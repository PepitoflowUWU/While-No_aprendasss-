-- =========================================================================================
-- while(no_aprendas) - LECCION EN CURSO: retomar donde se quedo el jugador
-- Si el jugador sale de una leccion a medias (cierra sesion, cierra la pagina o vuelve al mapa), al volver a entrar a esa
-- misma leccion sigue en el ejercicio donde se quedo, con los intentos y errores que ya llevaba.
--  1. Tabla leccion_en_curso: una fila por jugador y leccion empezada (se borra al terminar la leccion).
--  2. Funciones: mis_lecciones_en_curso(), guardar_leccion_en_curso(...) y borrar_leccion_en_curso(...).
--     Cada jugador solo ve y cambia sus propias filas; el navegador no puede tocar la tabla directamente.
-- Los puntos se siguen otorgando UNA vez, en el servidor, al terminar la leccion (registrar_leccion, script 11).
-- Ejecutar UNA vez, completo (todo o nada, repetible). Requiere haber ejecutado antes 11 y 18.
-- =========================================================================================
begin;

create table if not exists leccion_en_curso (
  usuario_id  uuid        not null references usuario(id) on delete cascade,
  curso       text        not null check (length(curso) between 1 and 40),
  nivel       smallint    not null check (nivel between 0 and 49),        -- indice del nivel en el mapa (0 = nivel 1)
  leccion     smallint    not null check (leccion between 0 and 49),      -- indice de la leccion (0 = leccion 1)
  ejercicio   smallint    not null check (ejercicio between 0 and 30),    -- ejercicio donde sigue (0 = el primero)
  fallos      smallint    not null default 0 check (fallos between 0 and 50),               -- intentos fallidos del ejercicio actual
  intentos    smallint[]  not null default '{}' check (cardinality(intentos) <= 30),        -- intento en que acerto cada ejercicio hecho (0 = no sumo)
  errores     smallint    not null default 0 check (errores between 0 and 500),
  directos    smallint    not null default 0 check (directos between 0 and 30),             -- ejercicios acertados sin errores
  actualizado timestamptz not null default now(),
  primary key (usuario_id, curso, nivel, leccion)
);
alter table leccion_en_curso enable row level security;
revoke all on leccion_en_curso from anon, authenticated;

create or replace function mis_lecciones_en_curso()
returns jsonb language sql stable security definer set search_path = public as $$
  select coalesce(jsonb_agg(jsonb_build_object(
    'curso', curso, 'nivel', nivel, 'leccion', leccion, 'ejercicio', ejercicio, 'fallos', fallos,
    'intentos', to_jsonb(intentos), 'errores', errores, 'directos', directos, 'actualizado', actualizado)), '[]'::jsonb)
  from leccion_en_curso where usuario_id = auth.uid();
$$;

create or replace function guardar_leccion_en_curso(
  p_curso text, p_nivel int, p_leccion int, p_ejercicio int, p_fallos int, p_intentos int[], p_errores int, p_directos int
) returns void language plpgsql security definer set search_path = public as $$
declare v_uid uuid := auth.uid();
begin
  if v_uid is null or not exists (select 1 from usuario where id = v_uid) then
    raise exception 'Necesitas iniciar sesión.' using errcode = '42501';
  end if;
  if coalesce(cardinality(p_intentos), 0) <> p_ejercicio then
    raise exception 'Debe haber un intento por cada ejercicio hecho.' using errcode = '22023';
  end if;
  if exists (select 1 from unnest(p_intentos) x where x < 0 or x > 4) then
    raise exception 'Cada intento debe estar entre 0 y 4.' using errcode = '22023';
  end if;
  insert into leccion_en_curso (usuario_id, curso, nivel, leccion, ejercicio, fallos, intentos, errores, directos, actualizado)
  values (v_uid, p_curso, p_nivel, p_leccion, p_ejercicio, p_fallos, p_intentos::smallint[], p_errores, p_directos, now())
  on conflict (usuario_id, curso, nivel, leccion) do update
    set ejercicio = excluded.ejercicio, fallos = excluded.fallos, intentos = excluded.intentos,
        errores = excluded.errores, directos = excluded.directos, actualizado = now();
end $$;

create or replace function borrar_leccion_en_curso(p_curso text, p_nivel int, p_leccion int)
returns void language sql security definer set search_path = public as $$
  delete from leccion_en_curso where usuario_id = auth.uid() and curso = p_curso and nivel = p_nivel and leccion = p_leccion;
$$;

revoke all on function mis_lecciones_en_curso(), guardar_leccion_en_curso(text, int, int, int, int, int[], int, int),
  borrar_leccion_en_curso(text, int, int) from public, anon;
grant execute on function mis_lecciones_en_curso(), guardar_leccion_en_curso(text, int, int, int, int, int[], int, int),
  borrar_leccion_en_curso(text, int, int) to authenticated;

commit;

-- Comprobacion: lecciones a medias de cada jugador
--   select u.nombre_usuario, l.nivel + 1 as nivel, l.leccion + 1 as leccion, l.ejercicio + 1 as ejercicio, l.actualizado
--   from leccion_en_curso l join usuario u on u.id = l.usuario_id order by l.actualizado desc;
