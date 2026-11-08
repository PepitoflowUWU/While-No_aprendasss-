-- =========================================================================================
-- while(no_aprendas) - CAMBIOS MINIMOS EN SUPABASE PARA ESTA VERSION
-- Ejecutar UNA vez en el SQL Editor (se puede repetir sin romper nada).
-- No borra ni modifica filas existentes.
-- =========================================================================================

-- 1) Lecciones del nivel 1 --------------------------------------------------------------
-- El modelo tenia unidad -> nivel -> ejercicio, pero el nivel 1 se compone de 5 LECCIONES (cada una con su teoria
-- y 7 preguntas). No existia donde guardarlas, asi que este es el unico cambio estructural:
-- una tabla pequena `leccion` y una columna `ejercicio.leccion_id`. No se duplica informacion.
create table if not exists leccion (
  id        uuid primary key default gen_random_uuid(),
  nivel_id  uuid not null references nivel(id) on delete cascade,
  orden     int  not null,
  titulo    text not null,
  teoria    jsonb not null,            -- diapositivas: [{ titulo, texto, codigo, grafico }, ...]
  unique (nivel_id, orden)
);
alter table ejercicio add column if not exists leccion_id uuid references leccion(id) on delete cascade;

-- 1b) Ultima conexion del jugador (la ficha del ranking muestra cuanto tiempo lleva desconectado).
--     Es distinta de usuario.ultima_actividad, que marca el ultimo nivel completado y sirve para la racha.
alter table usuario add column if not exists ultima_conexion timestamptz not null default now();

-- 1c) Preferencia de animaciones y efectos (Opciones). Se guarda junto con musica y sonido.
alter table configuracion_usuario add column if not exists animaciones_activadas boolean not null default true;

-- 2) Ranking publico: lo crea 04_ranking_sin_security_definer.sql (tabla de solo lectura que se mantiene con un trigger).
--    Ejecutalo despues de este archivo. No uses una vista: Supabase la marca como SECURITY DEFINER.

-- 3) Funciones que usa el juego ---------------------------------------------------------
-- 3.1 Comprobar si un codigo de estudiante ya tiene cuenta (antes de crearla)
create or replace function codigo_estudiante_disponible(p_codigo text)
returns boolean language sql stable security definer set search_path = public as $$
  select not exists (select 1 from usuario where codigo_estudiante = upper(btrim(p_codigo)));
$$;
revoke all on function codigo_estudiante_disponible(text) from public;
grant execute on function codigo_estudiante_disponible(text) to anon, authenticated;

-- 3.2 Invitados: sesion temporal (vence a las 12 h por si el navegador se cierra sin avisar)
create or replace function crear_sesion_invitado()
returns uuid language plpgsql security definer set search_path = public as $$
declare v_id uuid;
begin
  delete from sesion_invitado where fecha_expiracion < now();     -- barrido de sesiones abandonadas
  insert into sesion_invitado (fecha_expiracion) values (now() + interval '12 hours') returning id into v_id;
  return v_id;
end $$;

create or replace function cerrar_sesion_invitado(p_id uuid)
returns void language sql security definer set search_path = public as $$
  delete from sesion_invitado where id = p_id;                    -- intento/progreso del invitado se borran en cascada
$$;

create or replace function limpiar_invitados_vencidos()
returns void language sql security definer set search_path = public as $$
  delete from sesion_invitado where fecha_expiracion < now();
$$;

revoke all on function crear_sesion_invitado()        from public;
revoke all on function cerrar_sesion_invitado(uuid)   from public;
revoke all on function limpiar_invitados_vencidos()   from public;
grant execute on function crear_sesion_invitado()        to anon, authenticated;
grant execute on function cerrar_sesion_invitado(uuid)   to anon, authenticated;
grant execute on function limpiar_invitados_vencidos()   to anon, authenticated;

-- 3.3 (OPCIONAL) Limpieza automatica cada hora, aunque nadie abra el juego. Requiere activar la extension pg_cron
--     en Database > Extensions. Si no la activas, el juego igual limpia al abrirse y cada vez que alguien entra como invitado.
-- select cron.schedule('limpiar-invitados', '0 * * * *', $$ delete from sesion_invitado where fecha_expiracion < now() $$);
