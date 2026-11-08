-- =========================================================================================
-- while(no_aprendas) - LA BASE VALIDA LAS RESPUESTAS (ejercicios de alternativas)
--  1. El navegador ya NO puede leer cual alternativa es la correcta (alternativa.es_correcta queda oculta):
--     en "Inspeccionar" solo se ven el texto y el id de cada opcion.
--  2. verificar_alternativa(ejercicio, alternativa): al tocar COMPROBAR el juego le pregunta a la base si la opcion es
--     correcta. La base anota los intentos de cada jugador (tabla intento_ejercicio): 4 oportunidades por ejercicio;
--     solo despues del 4.o fallo (o al acertar) devuelve cual era la correcta.
--  3. registrar_leccion() calcula los puntos de los ejercicios de alternativas con los intentos que anoto la base, no con
--     lo que dice el navegador. Al registrar la leccion se limpian esos intentos (para poder repetirla).
--  Los invitados tambien validan con la base, pero sus intentos no se anotan (no tienen cuenta).
--  Los otros tipos (ordenar, tabla de verdad, diagramas, escribir) se validan todavia en el juego.
-- Ejecutar UNA vez, completo (todo o nada, repetible). Requiere haber ejecutado antes 11 y 15.
-- =========================================================================================
begin;

-- 1) El navegador solo puede leer id, ejercicio_id y texto de cada alternativa
revoke select on alternativa from anon, authenticated;
grant select (id, ejercicio_id, texto) on alternativa to anon, authenticated;

-- 2) Intentos de cada jugador en cada ejercicio (los cuenta la base)
create table if not exists intento_ejercicio (
  usuario_id   uuid     not null references usuario(id) on delete cascade,
  ejercicio_id uuid     not null references ejercicio(id) on delete cascade,
  fallos       smallint not null default 0 check (fallos between 0 and 4),
  acertado_en  smallint check (acertado_en between 1 and 4),          -- intento en que acerto (null = aun no)
  actualizado  timestamptz not null default now(),
  primary key (usuario_id, ejercicio_id)
);
alter table intento_ejercicio enable row level security;
revoke all on intento_ejercicio from anon, authenticated;

-- 3) Comprobar una respuesta
--    Devuelve { correcto, intento (1-4, al acertar), fallos, agotado (4 fallos), correcta (id; solo al acertar o al agotar) }
create or replace function verificar_alternativa(p_ejercicio uuid, p_alternativa uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_uid uuid := auth.uid();
  v_correcta uuid; v_ok boolean; r intento_ejercicio%rowtype;
begin
  select id into v_correcta from alternativa where ejercicio_id = p_ejercicio and es_correcta order by id limit 1;
  if v_correcta is null then raise exception 'Ese ejercicio no existe o no tiene respuesta correcta.' using errcode = '22023'; end if;
  if not exists (select 1 from alternativa where id = p_alternativa and ejercicio_id = p_ejercicio) then
    raise exception 'Esa opción no pertenece al ejercicio.' using errcode = '22023';
  end if;
  v_ok := p_alternativa = v_correcta;

  -- Invitado (sin cuenta): se responde sin anotar intentos
  if v_uid is null or not exists (select 1 from usuario where id = v_uid) then
    return jsonb_build_object('correcto', v_ok, 'correcta', case when v_ok then v_correcta end);
  end if;

  insert into intento_ejercicio (usuario_id, ejercicio_id) values (v_uid, p_ejercicio) on conflict do nothing;
  select * into r from intento_ejercicio where usuario_id = v_uid and ejercicio_id = p_ejercicio for update;

  if r.acertado_en is not null then                              -- ya lo habia acertado: no cambia nada
    return jsonb_build_object('correcto', v_ok, 'intento', r.acertado_en, 'fallos', r.fallos, 'correcta', v_correcta, 'resuelto', true);
  end if;
  if r.fallos >= 4 then                                          -- ya agoto sus 4 oportunidades
    return jsonb_build_object('correcto', false, 'fallos', r.fallos, 'agotado', true, 'correcta', v_correcta);
  end if;

  if v_ok then
    update intento_ejercicio set acertado_en = r.fallos + 1, actualizado = now() where usuario_id = v_uid and ejercicio_id = p_ejercicio;
    return jsonb_build_object('correcto', true, 'intento', r.fallos + 1, 'fallos', r.fallos, 'correcta', v_correcta);
  end if;
  update intento_ejercicio set fallos = r.fallos + 1, actualizado = now() where usuario_id = v_uid and ejercicio_id = p_ejercicio;
  return jsonb_build_object('correcto', false, 'fallos', r.fallos + 1, 'agotado', r.fallos + 1 >= 4,
                            'correcta', case when r.fallos + 1 >= 4 then v_correcta end);
end $$;

-- 4) registrar_leccion: igual que en 11, pero los ejercicios de alternativas usan los intentos que anoto la base
create or replace function registrar_leccion(
  p_unidad_orden int, p_nivel_orden int, p_leccion_orden int, p_intentos int[]
) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_uid uuid := exigir_estudiante();
  v_nivel uuid; v_req int;
  v_n int; v_puntos int := 0; v_errores int := 0; v_estrellas int; v_total_intentos int := 0;
  v_nueva boolean; v_otorgados int := 0;
  v_hechas int; v_nivel_nuevo boolean := false;
  v_com uuid := comodin_base();
  v_hoy date := (now() at time zone 'America/Lima')::date;
  v_ult date; v_racha int; v_racha_max int;
  v_leccion uuid; v_ejs uuid[]; v_i int; v_alt boolean; v_val int;
begin
  select n.id, n.lecciones_requeridas into v_nivel, v_req
  from nivel n join unidad u on u.id = n.unidad_id
  where u.orden = p_unidad_orden and n.orden = p_nivel_orden;
  if v_nivel is null then raise exception 'El nivel % de la unidad % no existe.', p_nivel_orden, p_unidad_orden using errcode = '22023'; end if;
  perform pg_advisory_xact_lock(hashtext(v_uid::text || ':' || v_nivel::text));
  if p_leccion_orden is null or p_leccion_orden < 1 or p_leccion_orden > v_req then
    raise exception 'La leccion % no existe en ese nivel (1 a %).', p_leccion_orden, v_req using errcode = '22023';
  end if;
  if p_intentos is null or cardinality(p_intentos) < 1 or cardinality(p_intentos) > 30 then
    raise exception 'Se esperaba un intento por pregunta (entre 1 y 30 preguntas).' using errcode = '22023';
  end if;

  -- Si la leccion esta en la base, sus ejercicios de alternativas cuentan con los intentos anotados por verificar_alternativa
  select id into v_leccion from leccion where nivel_id = v_nivel and orden = p_leccion_orden;
  if v_leccion is not null then
    select array_agg(id order by orden) into v_ejs from ejercicio where leccion_id = v_leccion;
  end if;
  if v_ejs is not null and cardinality(v_ejs) > 0 then
    if cardinality(p_intentos) <> cardinality(v_ejs) then
      raise exception 'La leccion tiene % ejercicios en la base y se recibieron %. Recarga el juego.', cardinality(v_ejs), cardinality(p_intentos)
        using errcode = '22023';
    end if;
    for v_i in 1 .. cardinality(v_ejs) loop
      select exists (select 1 from alternativa where ejercicio_id = v_ejs[v_i]) into v_alt;
      if v_alt then
        select coalesce(acertado_en, 0) into v_val from intento_ejercicio where usuario_id = v_uid and ejercicio_id = v_ejs[v_i];
        p_intentos[v_i] := coalesce(v_val, 0);                  -- sin intentos anotados = no se respondio con la base
      end if;
    end loop;
    delete from intento_ejercicio where usuario_id = v_uid and ejercicio_id = any (v_ejs);
  end if;

  foreach v_n in array p_intentos loop
    if v_n is null or v_n < 0 or v_n > 4 then
      raise exception 'Intento fuera de rango: debe ser 0 (sin acertar) o de 1 a 4 (recibido %).', v_n using errcode = '22023';
    end if;
    if v_n = 0 then
      v_errores := v_errores + 4; v_total_intentos := v_total_intentos + 4;
    else
      v_puntos := v_puntos + puntos_por_intento(v_n);          -- 10 / 7 / 4 / 1
      v_errores := v_errores + (v_n - 1); v_total_intentos := v_total_intentos + v_n;
    end if;
  end loop;
  v_estrellas := case when v_errores = 0 then 3 when v_errores <= 2 then 2 else 1 end;

  insert into progreso_leccion (usuario_id, nivel_id, leccion_orden, estrellas, puntos, intentos_totales)
  values (v_uid, v_nivel, p_leccion_orden, v_estrellas, v_puntos, v_total_intentos)
  on conflict (usuario_id, nivel_id, leccion_orden) do nothing
  returning true into v_nueva;

  if v_nueva then
    update usuario set puntaje_total = puntaje_total + v_puntos where id = v_uid;
    v_otorgados := v_puntos;
  else
    update progreso_leccion set estrellas = greatest(estrellas, v_estrellas)
    where usuario_id = v_uid and nivel_id = v_nivel and leccion_orden = p_leccion_orden;
  end if;

  select count(*) into v_hechas from progreso_leccion where usuario_id = v_uid and nivel_id = v_nivel;
  if v_hechas >= v_req then
    insert into progreso (usuario_id, nivel_id, completado, intentos_totales, fecha_completado)
    values (v_uid, v_nivel, true,
            (select coalesce(sum(intentos_totales), 0) from progreso_leccion where usuario_id = v_uid and nivel_id = v_nivel), now())
    on conflict (usuario_id, nivel_id) do update set completado = true, fecha_completado = now()
      where progreso.completado = false
    returning true into v_nivel_nuevo;
  end if;

  if v_nivel_nuevo then
    if v_com is not null then
      insert into inventario_comodin (usuario_id, comodin_id, cantidad) values (v_uid, v_com, 1)
      on conflict (usuario_id, comodin_id) do update set cantidad = least(inventario_comodin.cantidad + 1, 10);
    end if;
    select (ultima_actividad at time zone 'America/Lima')::date, racha_actual, racha_maxima into v_ult, v_racha, v_racha_max
    from usuario where id = v_uid for update;
    if v_ult is not distinct from v_hoy then v_racha := greatest(v_racha, 1);
    elsif v_ult = v_hoy - 1 then v_racha := least(v_racha + 1, 999);
    else v_racha := 1;
    end if;
    update usuario set racha_actual = v_racha, racha_maxima = least(999, greatest(racha_maxima, v_racha)),
                       ultima_actividad = now()
    where id = v_uid;
  end if;

  return (
    select jsonb_build_object(
      'puntos_otorgados', v_otorgados, 'leccion_nueva', coalesce(v_nueva, false), 'nivel_completado_ahora', coalesce(v_nivel_nuevo, false),
      'estrellas', (select estrellas from progreso_leccion where usuario_id = v_uid and nivel_id = v_nivel and leccion_orden = p_leccion_orden),
      'puntos', u.puntaje_total, 'racha', u.racha_actual, 'racha_max', u.racha_maxima,
      'comodines', coalesce((select cantidad from inventario_comodin where usuario_id = v_uid and comodin_id = v_com), 0))
    from usuario u where u.id = v_uid);
end $$;

revoke all on function verificar_alternativa(uuid, uuid) from public;
grant execute on function verificar_alternativa(uuid, uuid) to anon, authenticated;
revoke all on function registrar_leccion(int, int, int, int[]) from public, anon;
grant execute on function registrar_leccion(int, int, int, int[]) to authenticated;

commit;

-- Comprobacion: desde el navegador ya no se puede leer es_correcta (debe dar "permission denied" si se prueba con el rol authenticated)
--   select has_column_privilege('authenticated', 'alternativa', 'es_correcta', 'select') as navegador_ve_la_correcta;   -- debe dar false
