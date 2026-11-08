-- =========================================================================================
-- while(no_aprendas) - RANKING SIN VISTA "SECURITY DEFINER"  (corrige el aviso del Security Advisor)
-- Reemplaza la vista ranking_publico por una tabla de solo lectura que se mantiene sola con un trigger.
-- El juego consulta `ranking_publico`. Requiere la columna usuario.ultima_conexion (la crea 01 o 08).
-- Ejecutar DESPUES de 01_cambios_necesarios.sql. Se puede repetir sin romper nada.
-- =========================================================================================

-- Quita lo anterior sea una vista (version vieja) o una tabla (esta version). Seguro de repetir.
do $q$
declare v char;
begin
  select c.relkind into v from pg_class c join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public' and c.relname = 'ranking_publico';
  if v = 'v' then drop view public.ranking_publico;
  elsif v = 'r' then drop table public.ranking_publico;
  end if;
end $q$;

create table ranking_publico (
  usuario_id        uuid primary key references usuario(id) on delete cascade,   -- NO es legible desde el navegador
  nombre_usuario    varchar(50) not null,     -- es el mismo nombre de usuario que se ve en el juego
  codigo_estudiante varchar(20),              -- solo para jugadores con cuenta (ver grants)
  puntaje_total     int not null default 0,
  racha_maxima      int not null default 0,   -- solo para jugadores con cuenta
  ultima_conexion   timestamptz,              -- solo para jugadores con cuenta
  personaje_id      uuid
);

-- Solo lectura. Nunca se expone usuario_id ni el correo.
-- Invitados (sin cuenta): nombre, puntos y personaje. Jugadores con cuenta: ademas codigo, racha maxima y ultima conexion.
alter table ranking_publico enable row level security;
drop policy if exists "ranking legible" on ranking_publico;
create policy "ranking legible" on ranking_publico for select to anon, authenticated using (true);
revoke all on ranking_publico from anon, authenticated;
grant select (nombre_usuario, puntaje_total, personaje_id) on ranking_publico to anon, authenticated;
grant select (codigo_estudiante, racha_maxima, ultima_conexion) on ranking_publico to authenticated;

-- Mantiene la tabla al dia cuando cambia un estudiante (solo estudiantes: los invitados viven en otra tabla)
create or replace function sincronizar_ranking()
returns trigger language plpgsql security definer set search_path = public as $$
declare v_rol text;
begin
  if TG_OP = 'DELETE' then
    delete from ranking_publico where usuario_id = OLD.id;
    return OLD;
  end if;
  select nombre into v_rol from rol where id = NEW.rol_id;
  if v_rol = 'estudiante' and NEW.nombre_usuario is not null then
    insert into ranking_publico (usuario_id, nombre_usuario, codigo_estudiante, puntaje_total, racha_maxima, ultima_conexion, personaje_id)
    values (NEW.id, NEW.nombre_usuario, NEW.codigo_estudiante, NEW.puntaje_total, NEW.racha_maxima, NEW.ultima_conexion, NEW.personaje_id)
    on conflict (usuario_id) do update
      set nombre_usuario = excluded.nombre_usuario, codigo_estudiante = excluded.codigo_estudiante,
          puntaje_total = excluded.puntaje_total, racha_maxima = excluded.racha_maxima,
          ultima_conexion = excluded.ultima_conexion, personaje_id = excluded.personaje_id;
  else
    delete from ranking_publico where usuario_id = NEW.id;
  end if;
  return NEW;
end $$;
-- Es una funcion de trigger: nadie debe poder llamarla desde la API
revoke all on function sincronizar_ranking() from public, anon, authenticated;

drop trigger if exists trg_usuario_ranking on usuario;
create trigger trg_usuario_ranking
after insert or update or delete on usuario
for each row execute function sincronizar_ranking();

-- Carga los estudiantes que ya existen
insert into ranking_publico (usuario_id, nombre_usuario, codigo_estudiante, puntaje_total, racha_maxima, ultima_conexion, personaje_id)
select u.id, u.nombre_usuario, u.codigo_estudiante, u.puntaje_total, u.racha_maxima, u.ultima_conexion, u.personaje_id
from usuario u join rol r on r.id = u.rol_id
where r.nombre = 'estudiante' and u.nombre_usuario is not null
on conflict (usuario_id) do nothing;
