-- =========================================================================================
-- while(no_aprendas) - LOGROS (16): reclamarlos y guardarlos en el perfil del jugador
-- Generado desde src/data/logros.js (el juego y la base usan las mismas metas).
--  Las estrellas son las del NIVEL (1 a 3 por nivel completado, como en el mapa), no la suma de las de cada leccion.
--  logro          = catalogo con la meta de cada logro (lectura publica)
--  logro_usuario  = logros que cada jugador ya reclamo (solo puede leer los suyos; solo se escribe con las funciones)
--  reclamar_logro / reclamar_logros = la BASE comprueba que de verdad se cumplio antes de entregar el logro
-- Ejecutar UNA vez, completo (todo o nada, repetible). Requiere haber ejecutado 01 a 05 y 11.
-- =========================================================================================
begin;

create table if not exists logro (
  codigo       text primary key,
  nombre       text not null,
  descripcion  text not null,
  metrica      text not null check (metrica in ('lecciones_completadas', 'niveles_completados', 'estrellas_total', 'lecciones_perfectas', 'puntaje_total', 'racha_maxima', 'comodines_usados')),
  meta         int  not null check (meta > 0),
  orden        int  not null
);

insert into logro (codigo, nombre, descripcion, metrica, meta, orden) values
  ('primera_leccion', 'Primer paso', 'Completa tu primera lección', 'lecciones_completadas', 1, 1),
  ('diez_lecciones', 'Aprendiz constante', 'Completa 10 lecciones', 'lecciones_completadas', 10, 2),
  ('veinticinco_lecciones', 'Estudiante dedicado', 'Completa 25 lecciones', 'lecciones_completadas', 25, 3),
  ('primer_nivel', 'Nivel superado', 'Completa tu primer nivel', 'niveles_completados', 1, 4),
  ('tres_niveles', 'Camino recorrido', 'Completa 3 niveles', 'niveles_completados', 3, 5),
  ('mundo_completo', 'Maestro del mundo 1', 'Completa los 7 niveles', 'niveles_completados', 7, 6),
  ('estrellas_3', 'Cazador de estrellas', 'Suma 3 estrellas en tus niveles', 'estrellas_total', 3, 7),
  ('estrellas_9', 'Lluvia de estrellas', 'Suma 9 estrellas en tus niveles', 'estrellas_total', 9, 8),
  ('estrellas_21', 'Constelación', 'Consigue las 21 estrellas (3 por nivel)', 'estrellas_total', 21, 9),
  ('perfecto_5', 'Perfeccionista', 'Termina 5 lecciones con 3 estrellas', 'lecciones_perfectas', 5, 10),
  ('racha_3', 'Constancia', 'Llega a 3 días de racha', 'racha_maxima', 3, 11),
  ('racha_7', 'Imparable', 'Llega a 7 días de racha', 'racha_maxima', 7, 12),
  ('xp_100', 'Primeros puntos', 'Reúne 100 XP', 'puntaje_total', 100, 13),
  ('xp_500', 'Aprendiz de algoritmos', 'Reúne 500 XP', 'puntaje_total', 500, 14),
  ('xp_1000', 'Experto en algoritmos', 'Reúne 1000 XP', 'puntaje_total', 1000, 15),
  ('primer_comodin', 'Pidiendo ayuda', 'Usa un comodín por primera vez', 'comodines_usados', 1, 16)
on conflict (codigo) do update set nombre = excluded.nombre, descripcion = excluded.descripcion,
  metrica = excluded.metrica, meta = excluded.meta, orden = excluded.orden;
-- Un logro que ya no esta en el catalogo se quita (tambien de quienes lo habian reclamado)
delete from logro where codigo not in (select codigo from (values ('primera_leccion'), ('diez_lecciones'), ('veinticinco_lecciones'), ('primer_nivel'), ('tres_niveles'), ('mundo_completo'), ('estrellas_3'), ('estrellas_9'), ('estrellas_21'), ('perfecto_5'), ('racha_3'), ('racha_7'), ('xp_100'), ('xp_500'), ('xp_1000'), ('primer_comodin')) as v(codigo));

create table if not exists logro_usuario (
  usuario_id       uuid        not null references usuario(id) on delete cascade,
  codigo           text        not null references logro(codigo) on delete cascade,
  fecha_reclamado  timestamptz not null default now(),
  primary key (usuario_id, codigo)
);

-- Seguridad: cada jugador solo lee lo suyo y nadie escribe desde el navegador
alter table logro enable row level security;
alter table logro_usuario enable row level security;
drop policy if exists "logros publicos" on logro;
create policy "logros publicos" on logro for select to anon, authenticated using (true);
drop policy if exists "mis logros" on logro_usuario;
create policy "mis logros" on logro_usuario for select to authenticated using (usuario_id = auth.uid());
revoke all on logro, logro_usuario from anon, authenticated;
grant select on logro to anon, authenticated;
grant select on logro_usuario to authenticated;

-- Valor actual de una metrica para un jugador (interna: la usan las funciones de abajo)
create or replace function valor_metrica(p_usuario uuid, p_metrica text)
returns int language sql stable security definer set search_path = public as $$
  select case p_metrica
    when 'lecciones_completadas' then (select count(*) from progreso_leccion where usuario_id = p_usuario)::int
    when 'niveles_completados'   then (select count(*) from progreso where usuario_id = p_usuario and completado)::int
    when 'estrellas_total'       then coalesce((
      -- estrellas de los NIVELES completados (las del mapa, de 1 a 3): el promedio de las estrellas de sus lecciones, redondeado
      select sum(greatest(1, least(3, round(s.prom)::int))) from (
        select avg(pl.estrellas) as prom from progreso_leccion pl
        join progreso p on p.usuario_id = pl.usuario_id and p.nivel_id = pl.nivel_id and p.completado
        where pl.usuario_id = p_usuario group by pl.nivel_id) s), 0)::int
    when 'lecciones_perfectas'   then (select count(*) from progreso_leccion where usuario_id = p_usuario and estrellas = 3)::int
    when 'puntaje_total'         then coalesce((select puntaje_total from usuario where id = p_usuario), 0)
    when 'racha_maxima'          then coalesce((select racha_maxima from usuario where id = p_usuario), 0)
    when 'comodines_usados'      then coalesce((select sum(comodines_usados) from uso_comodin_unidad where usuario_id = p_usuario), 0)::int
    else 0 end;
$$;

-- Codigos de los logros que el jugador ya reclamo
create or replace function logros_reclamados()
returns text[] language plpgsql stable security definer set search_path = public as $$
declare v_uid uuid := exigir_estudiante();
begin
  return coalesce((select array_agg(codigo order by fecha_reclamado) from logro_usuario where usuario_id = v_uid), '{}');
end $$;

-- Reclama un logro: solo si de verdad se cumplio su meta
create or replace function reclamar_logro(p_codigo text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_uid uuid := exigir_estudiante(); v_l logro%rowtype; v_n int;
begin
  select * into v_l from logro where codigo = p_codigo;
  if not found then raise exception 'No existe ese logro.' using errcode = '22023'; end if;
  if valor_metrica(v_uid, v_l.metrica) < v_l.meta then
    raise exception 'Aún no cumples este logro.' using errcode = 'P0001';
  end if;
  insert into logro_usuario (usuario_id, codigo) values (v_uid, p_codigo) on conflict do nothing;
  get diagnostics v_n = row_count;
  return jsonb_build_object('codigo', p_codigo, 'nuevo', v_n = 1);
end $$;

-- Reclama de una vez todos los que ya estan cumplidos; devuelve los que se entregaron ahora
create or replace function reclamar_logros()
returns text[] language plpgsql security definer set search_path = public as $$
declare v_uid uuid := exigir_estudiante(); v_nuevos text[];
begin
  with ins as (
    insert into logro_usuario (usuario_id, codigo)
    select v_uid, l.codigo from logro l where valor_metrica(v_uid, l.metrica) >= l.meta
    on conflict do nothing returning codigo)
  select coalesce(array_agg(codigo), '{}') into v_nuevos from ins;
  return v_nuevos;
end $$;

revoke all on function valor_metrica(uuid, text) from public, anon, authenticated;
revoke all on function logros_reclamados(), reclamar_logro(text), reclamar_logros() from public, anon;
grant execute on function logros_reclamados(), reclamar_logro(text), reclamar_logros() to authenticated;

commit;

-- Comprobacion: debe dar 16 logros
--   select count(*) from logro;
