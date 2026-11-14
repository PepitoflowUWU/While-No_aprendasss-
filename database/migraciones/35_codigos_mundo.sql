-- =========================================================================================
-- while(no_aprendas) - CÓDIGOS POR MUNDO (Ajustes › CÓDIGOS). Cada código vale SOLO para el mundo (unidad) donde se escribe.
--   · MESIAS     → comodines ilimitados en ese mundo: sin límite de usos y sin gastar los del inventario.
--   · HELLO_WORD → todos los niveles de ese mundo abiertos (lo aplica el juego al dibujar el mapa).
--  1. Tabla codigo_mundo (usuario, unidad, código). El navegador solo puede LEER los suyos.
--  2. canjear_codigo(unidad, código): valida el código en el servidor y lo guarda. Devuelve los códigos activos de ese mundo.
--  3. usar_comodin: con MESIAS en ese mundo no aplica el límite ni descuenta comodines.
--  4. estado_jugador: también devuelve 'codigos' (para que el juego los recuerde al iniciar sesión en cualquier dispositivo).
-- Ejecutar UNA vez, completo (repetible). Requiere 11_progreso_puntos_comodines.sql.
-- =========================================================================================
begin;

-- 1. Códigos activos por jugador y mundo
create table if not exists codigo_mundo (
  usuario_id uuid not null references usuario(id) on delete cascade,
  unidad_id  uuid not null references unidad(id) on delete cascade,
  codigo     text not null check (codigo in ('MESIAS', 'HELLO_WORD')),
  creado_en  timestamptz not null default now(),
  primary key (usuario_id, unidad_id, codigo)
);
alter table codigo_mundo enable row level security;
drop policy if exists "leer lo propio" on codigo_mundo;
create policy "leer lo propio" on codigo_mundo for select to authenticated using (usuario_id = auth.uid());
revoke all on codigo_mundo from anon;
revoke insert, update, delete on codigo_mundo from authenticated;
grant select on codigo_mundo to authenticated;

-- 2. Canjear un código
create or replace function canjear_codigo(p_unidad_orden int, p_codigo text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_uid uuid := exigir_estudiante();
  v_unidad uuid;
  v_codigo text := upper(regexp_replace(trim(coalesce(p_codigo, '')), '[\s-]+', '_', 'g'));
begin
  if v_codigo not in ('MESIAS', 'HELLO_WORD') then
    raise exception 'CODIGO_INVALIDO: ese código no existe.' using errcode = 'P0001';
  end if;
  select id into v_unidad from unidad where orden = p_unidad_orden;
  if v_unidad is null then raise exception 'La unidad % no existe.', p_unidad_orden using errcode = '22023'; end if;

  insert into codigo_mundo (usuario_id, unidad_id, codigo) values (v_uid, v_unidad, v_codigo)
  on conflict (usuario_id, unidad_id, codigo) do nothing;

  return jsonb_build_object('codigos',
    (select jsonb_agg(codigo order by creado_en) from codigo_mundo where usuario_id = v_uid and unidad_id = v_unidad));
end $$;
revoke all on function canjear_codigo(int, text) from public, anon;
grant execute on function canjear_codigo(int, text) to authenticated;

-- 3. Comodines: con MESIAS no hay límite ni se gastan
create or replace function usar_comodin(p_unidad_orden int)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_uid uuid := exigir_estudiante();
  v_unidad uuid; v_limite int; v_usados int; v_disp int;
  v_com uuid := comodin_base();
  v_mesias boolean;
begin
  select id, limite_comodines into v_unidad, v_limite from unidad where orden = p_unidad_orden;
  if v_unidad is null then raise exception 'La unidad % no existe.', p_unidad_orden using errcode = '22023'; end if;
  select exists (select 1 from codigo_mundo where usuario_id = v_uid and unidad_id = v_unidad and codigo = 'MESIAS') into v_mesias;

  insert into uso_comodin_unidad (usuario_id, unidad_id) values (v_uid, v_unidad) on conflict (usuario_id, unidad_id) do nothing;
  select comodines_usados into v_usados from uso_comodin_unidad where usuario_id = v_uid and unidad_id = v_unidad for update;
  select cantidad into v_disp from inventario_comodin where usuario_id = v_uid and comodin_id = v_com for update;

  if v_mesias then                                   -- código MESIAS: ilimitados en este mundo
    update uso_comodin_unidad set comodines_usados = comodines_usados + 1 where usuario_id = v_uid and unidad_id = v_unidad;
    return jsonb_build_object('disponibles', coalesce(v_disp, 0), 'usados', v_usados + 1, 'limite', v_limite);
  end if;

  if v_usados >= v_limite then
    raise exception 'LIMITE_COMODINES_UNIDAD: ya usaste los % comodines de esta unidad.', v_limite using errcode = 'P0001';
  end if;
  if v_disp is null or v_disp <= 0 then
    raise exception 'SIN_COMODINES: no tienes comodines disponibles.' using errcode = 'P0001';
  end if;

  update inventario_comodin set cantidad = cantidad - 1 where usuario_id = v_uid and comodin_id = v_com;
  update uso_comodin_unidad set comodines_usados = comodines_usados + 1 where usuario_id = v_uid and unidad_id = v_unidad;
  return jsonb_build_object('disponibles', v_disp - 1, 'usados', v_usados + 1, 'limite', v_limite);
end $$;
revoke all on function usar_comodin(int) from public, anon;
grant execute on function usar_comodin(int) to authenticated;

-- 4. Estado del jugador con sus códigos
create or replace function estado_jugador()
returns jsonb language sql stable security invoker set search_path = public as $$
  select jsonb_build_object(
    'puntos', u.puntaje_total, 'racha', u.racha_actual, 'racha_max', u.racha_maxima, 'ultima_actividad', u.ultima_actividad,
    'comodines', coalesce((select i.cantidad from inventario_comodin i where i.usuario_id = u.id and i.comodin_id = comodin_base()), 0),
    'lecciones', coalesce((select jsonb_agg(jsonb_build_object('unidad', un.orden, 'nivel', n.orden, 'leccion', pl.leccion_orden, 'estrellas', pl.estrellas))
                           from progreso_leccion pl join nivel n on n.id = pl.nivel_id join unidad un on un.id = n.unidad_id
                           where pl.usuario_id = u.id), '[]'::jsonb),
    'niveles', coalesce((select jsonb_agg(jsonb_build_object('unidad', un.orden, 'nivel', n.orden, 'completado', p.completado))
                         from progreso p join nivel n on n.id = p.nivel_id join unidad un on un.id = n.unidad_id
                         where p.usuario_id = u.id), '[]'::jsonb),
    'comodines_unidad', coalesce((select jsonb_agg(jsonb_build_object('unidad', un.orden, 'usados', coalesce(uc.comodines_usados, 0), 'limite', un.limite_comodines))
                                  from unidad un left join uso_comodin_unidad uc on uc.unidad_id = un.id and uc.usuario_id = u.id), '[]'::jsonb),
    'codigos', coalesce((select jsonb_agg(jsonb_build_object('unidad', un.orden, 'codigo', cm.codigo))
                         from codigo_mundo cm join unidad un on un.id = cm.unidad_id
                         where cm.usuario_id = u.id), '[]'::jsonb))
  from usuario u where u.id = auth.uid();
$$;
revoke all on function estado_jugador() from public, anon;
grant execute on function estado_jugador() to authenticated;

commit;

-- Comprobación (con tu sesión en el juego): select * from codigo_mundo;
