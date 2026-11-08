-- =========================================================================================
-- while(no_aprendas) - PANEL DE ADMINISTRACION
-- Prepara la base para el boton de la corona (panel de administradores):
--  1. Permisos del rol administrador, usando las tablas de roles que ya existen (rol, opcion, permiso).
--  2. Horas jugadas: columna usuario.segundos_jugados y funcion latido() que la va sumando mientras se juega.
--  3. Funciones del panel (solo las puede ejecutar quien tenga el permiso): resumen, lista de usuarios con su informacion,
--     eliminar una cuenta y cambiar la contrasena de un usuario. Eliminar y cambiar contrasena exigen el CODIGO DE
--     AUTORIZACION guardado (cifrado) en config_sistema: el mismo que protege los cambios de datos de los jugadores.
--  4. Un administrador tambien puede jugar (exigir_estudiante acepta los dos roles) y sale en el ranking.
--  5. Cierra la laguna de seguridad: activa RLS en las tablas que nunca lo tuvieron y protege config_sistema.
--
-- Ejecutar UNA vez, completo (todo o nada, repetible). Requiere haber ejecutado 01 a 05 y 11.
-- Despues ejecuta 19_admin_U24207317.sql para darle el rol de administrador a ese usuario.
-- =========================================================================================
begin;

-- ---------------------------------------------------------------------------------------
-- 1) Rol y permisos del administrador (RBAC existente: rol -> permiso -> opcion)
-- ---------------------------------------------------------------------------------------
insert into rol (nombre, descripcion)
values ('administrador', 'Administra el juego: ve a todos los usuarios, elimina cuentas y cambia contrasenas.')
on conflict (nombre) do nothing;

insert into opcion (nombre, descripcion) values
  ('panel_admin',        'Ver el panel de administracion (boton de la corona)'),
  ('ver_usuarios',       'Ver la informacion de todos los usuarios'),
  ('eliminar_usuario',   'Eliminar la cuenta de un usuario'),
  ('cambiar_contrasena', 'Cambiar la contrasena de un usuario')
on conflict (nombre) do nothing;

insert into permiso (rol_id, opcion_id)
select r.id, o.id from rol r join opcion o on o.nombre in ('panel_admin', 'ver_usuarios', 'eliminar_usuario', 'cambiar_contrasena')
where r.nombre = 'administrador'
on conflict (rol_id, opcion_id) do nothing;

-- ---------------------------------------------------------------------------------------
-- 2) Seguridad pendiente: tablas sin RLS y config_sistema
--    (sin politicas = el navegador no puede leerlas ni escribirlas; solo las usan las funciones de la base)
-- ---------------------------------------------------------------------------------------
alter table opcion              enable row level security;
alter table permiso             enable row level security;
alter table recompensa          enable row level security;
alter table evento              enable row level security;
alter table evento_recompensa   enable row level security;
alter table usuario_recompensa  enable row level security;
revoke all on opcion, permiso, recompensa, evento, evento_recompensa, usuario_recompensa from anon, authenticated;

-- Codigo de autorizacion (cifrado). Si ya existe, no se toca; si no, se crea con UTP2026 (cambialo cuando quieras).
create table if not exists config_sistema (clave text primary key, valor text not null);
insert into config_sistema (clave, valor)
select 'codigo_cambio_hash', extensions.crypt('UTP2026', extensions.gen_salt('bf'))
where not exists (select 1 from config_sistema where clave = 'codigo_cambio_hash');
alter table config_sistema enable row level security;
revoke all on config_sistema from anon, authenticated;

-- La funcion de cambios con codigo solo se usa desde el SQL Editor: se quita a los visitantes y jugadores
do $q$
begin
  if to_regprocedure('public.actualizar_usuario(text,uuid,jsonb)') is not null then
    revoke execute on function actualizar_usuario(text, uuid, jsonb) from public, anon, authenticated;
  end if;
end $q$;

-- ---------------------------------------------------------------------------------------
-- 3) Horas jugadas
-- ---------------------------------------------------------------------------------------
alter table usuario add column if not exists segundos_jugados int not null default 0;
alter table usuario drop constraint if exists usuario_segundos_no_negativo;
alter table usuario add constraint usuario_segundos_no_negativo check (segundos_jugados >= 0);

-- El juego avisa cada 2 minutos mientras esta abierto y visible. Cada aviso suma el tiempo desde el anterior, solo si fue
-- reciente (maximo 150 s): asi se cuenta el tiempo real de juego y no se puede inflar enviando numeros.
create or replace function latido()
returns void language plpgsql security definer set search_path = public as $$
begin
  update usuario set
    segundos_jugados = segundos_jugados + case
      when ultima_conexion is not null and now() - ultima_conexion <= interval '150 seconds'
      then least(extract(epoch from now() - ultima_conexion)::int, 150) else 0 end,
    ultima_conexion = now()
  where id = auth.uid();
end $$;

-- ---------------------------------------------------------------------------------------
-- 4) Permisos y roles: funciones de apoyo
-- ---------------------------------------------------------------------------------------
create or replace function tiene_permiso(p_opcion text)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from usuario u join permiso p on p.rol_id = u.rol_id join opcion o on o.id = p.opcion_id
    where u.id = auth.uid() and o.nombre = p_opcion);
$$;

create or replace function exigir_permiso(p_opcion text)
returns uuid language plpgsql stable security definer set search_path = public as $$
begin
  if auth.uid() is null then raise exception 'Necesitas iniciar sesión.' using errcode = '42501'; end if;
  if not tiene_permiso(p_opcion) then raise exception 'No tienes permiso para esta acción.' using errcode = '42501'; end if;
  return auth.uid();
end $$;

-- Lista de opciones que tiene el jugador (el juego muestra la corona si incluye panel_admin)
create or replace function mis_permisos()
returns text[] language sql stable security definer set search_path = public as $$
  select coalesce(array_agg(o.nombre order by o.nombre), '{}')
  from usuario u join permiso p on p.rol_id = u.rol_id join opcion o on o.id = p.opcion_id
  where u.id = auth.uid();
$$;

-- Un administrador tambien puede jugar: las funciones del juego aceptan estudiante y administrador
create or replace function exigir_estudiante()
returns uuid language plpgsql stable security definer set search_path = public as $$
declare v_uid uuid := auth.uid();
begin
  if v_uid is null then raise exception 'Necesitas iniciar sesión.' using errcode = '42501'; end if;
  if not exists (select 1 from usuario u join rol r on r.id = u.rol_id
                 where u.id = v_uid and r.nombre in ('estudiante', 'administrador')) then
    raise exception 'Solo los jugadores tienen progreso.' using errcode = '42501';
  end if;
  return v_uid;
end $$;

-- El ranking incluye a los administradores (tambien juegan)
create or replace function sincronizar_ranking()
returns trigger language plpgsql security definer set search_path = public as $$
declare v_rol text;
begin
  if TG_OP = 'DELETE' then
    delete from ranking_publico where usuario_id = OLD.id;
    return OLD;
  end if;
  select nombre into v_rol from rol where id = NEW.rol_id;
  if v_rol in ('estudiante', 'administrador') and NEW.nombre_usuario is not null then
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
revoke all on function sincronizar_ranking() from public, anon, authenticated;

-- ---------------------------------------------------------------------------------------
-- 5) Funciones del panel
-- ---------------------------------------------------------------------------------------
-- Nivel en el que esta un jugador: el siguiente al ultimo nivel completado (sin pasar del ultimo nivel del mundo 1)
create or replace function nivel_actual_de(p_usuario uuid)
returns int language sql stable security definer set search_path = public as $$
  select least(
    coalesce((select max(n.orden) from progreso p join nivel n on n.id = p.nivel_id join unidad un on un.id = n.unidad_id
              where p.usuario_id = p_usuario and p.completado and un.orden = 1), 0) + 1,
    coalesce((select max(n.orden) from nivel n join unidad un on un.id = n.unidad_id where un.orden = 1), 1));
$$;

-- Comprueba el codigo de autorizacion (el cifrado de config_sistema). Un intento fallido espera un momento.
create or replace function verificar_codigo_autorizacion(p_codigo text)
returns void language plpgsql security definer set search_path = public, extensions as $$
declare v_hash text;
begin
  select valor into v_hash from config_sistema where clave = 'codigo_cambio_hash';
  if v_hash is null then raise exception 'No hay un código de autorización configurado.' using errcode = 'P0001'; end if;
  if p_codigo is null or crypt(p_codigo, v_hash) <> v_hash then
    perform pg_sleep(1.5);
    raise exception 'Código de autorización incorrecto.' using errcode = '42501';
  end if;
end $$;

create or replace function admin_resumen()
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare v_max int; v_res jsonb;
begin
  perform exigir_permiso('panel_admin');
  select max(nivel_actual_de(id)) into v_max from usuario;
  select jsonb_build_object(
    'total_usuarios', count(*),
    'estudiantes', count(*) filter (where r.nombre = 'estudiante'),
    'administradores', count(*) filter (where r.nombre = 'administrador'),
    -- Segun el personaje que eligio cada usuario: Chico = hombre, Chica = mujer
    'hombres', count(*) filter (where lower(pj.nombre) = 'chico'),
    'mujeres', count(*) filter (where lower(pj.nombre) = 'chica'),
    'sin_personaje', count(*) filter (where pj.id is null or lower(pj.nombre) not in ('chico', 'chica')),
    'niveles_totales', (select coalesce(max(n.orden), 1) from nivel n join unidad un on un.id = n.unidad_id where un.orden = 1),
    'nivel_maximo', coalesce(v_max, 1),
    'horas_totales', round(coalesce(sum(u.segundos_jugados), 0) / 3600.0, 1),
    'conectados_ahora', count(*) filter (where u.ultima_conexion > now() - interval '4 minutes'),
    'quienes', (select coalesce(jsonb_agg(jsonb_build_object('nombre', q.nombre_usuario, 'codigo', q.codigo_estudiante) order by q.nombre_usuario), '[]'::jsonb)
                from (select u2.nombre_usuario, u2.codigo_estudiante from usuario u2 where nivel_actual_de(u2.id) = coalesce(v_max, 1)
                      order by u2.nombre_usuario limit 10) q),
    'cuantos_nivel_maximo', (select count(*) from usuario u3 where nivel_actual_de(u3.id) = coalesce(v_max, 1))
  ) into v_res
  from usuario u join rol r on r.id = u.rol_id left join personaje pj on pj.id = u.personaje_id;
  return v_res;
end $$;

-- Informacion de cada usuario. p_buscar filtra por nombre, codigo, correo o id (vacio = todos). Maximo 500.
create or replace function admin_usuarios(p_buscar text default null, p_limite int default 200)
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare v_b text := nullif(btrim(coalesce(p_buscar, '')), '');
begin
  perform exigir_permiso('ver_usuarios');
  return coalesce((
    select jsonb_agg(f order by (f->>'nivel')::int desc, (f->>'puntaje_total')::int desc, f->>'nombre_usuario')
    from (
      select jsonb_build_object(
        'id', u.id, 'nombre_usuario', u.nombre_usuario, 'codigo_estudiante', u.codigo_estudiante, 'correo', u.correo_institucional,
        'telefono', u.telefono, 'rol', r.nombre, 'nivel', nivel_actual_de(u.id),
        'niveles_completados', (select count(*) from progreso p where p.usuario_id = u.id and p.completado),
        'racha_actual', u.racha_actual, 'racha_maxima', u.racha_maxima, 'puntaje_total', u.puntaje_total,
        'segundos_jugados', u.segundos_jugados,
        'comodines', coalesce((select sum(i.cantidad) from inventario_comodin i where i.usuario_id = u.id), 0),
        'ultima_conexion', u.ultima_conexion, 'fecha_registro', u.fecha_registro) as f
      from usuario u join rol r on r.id = u.rol_id
      where v_b is null or u.nombre_usuario ilike '%' || v_b || '%' or u.codigo_estudiante ilike '%' || v_b || '%'
         or u.correo_institucional ilike '%' || v_b || '%' or u.telefono ilike '%' || v_b || '%' or u.id::text = v_b
      order by u.puntaje_total desc, u.nombre_usuario
      limit least(greatest(coalesce(p_limite, 200), 1), 500)) t), '[]'::jsonb);
end $$;

-- Elimina la cuenta (perfil, progreso, comodines... y la cuenta de acceso). p_usuario = id del juego (uuid) o codigo U########.
create or replace function admin_eliminar_usuario(p_codigo text, p_usuario text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_admin uuid; v_obj record; v_u text := btrim(coalesce(p_usuario, ''));
begin
  v_admin := exigir_permiso('eliminar_usuario');
  if v_u = '' or length(v_u) > 64 then raise exception 'Escribe el ID del juego o el código del usuario.' using errcode = '22023'; end if;
  perform verificar_codigo_autorizacion(p_codigo);

  select u.id, u.nombre_usuario, u.codigo_estudiante, r.nombre as rol into v_obj
  from usuario u join rol r on r.id = u.rol_id where u.id::text = v_u or u.codigo_estudiante = v_u;
  if not found then raise exception 'No existe un usuario con ese ID o código.' using errcode = '22023'; end if;
  if v_obj.id = v_admin then raise exception 'No puedes eliminar tu propia cuenta.' using errcode = 'P0001'; end if;
  if v_obj.rol = 'administrador' then raise exception 'No se puede eliminar a otro administrador desde el panel.' using errcode = 'P0001'; end if;

  delete from usuario where id = v_obj.id;        -- su configuracion, comodines, progreso y lugar en el ranking se borran en cascada
  delete from auth.users where id = v_obj.id;     -- su cuenta de acceso (y sus identidades)
  return jsonb_build_object('eliminado', true, 'nombre_usuario', v_obj.nombre_usuario, 'codigo_estudiante', v_obj.codigo_estudiante);
end $$;

-- Cambia la contrasena de acceso de un usuario (6 a 72 caracteres).
create or replace function admin_cambiar_contrasena(p_codigo text, p_usuario text, p_nueva text)
returns jsonb language plpgsql security definer set search_path = public, extensions as $$
declare v_obj record; v_u text := btrim(coalesce(p_usuario, '')); v_hash text;
begin
  perform exigir_permiso('cambiar_contrasena');
  if v_u = '' or length(v_u) > 64 then raise exception 'Escribe el ID del juego o el código del usuario.' using errcode = '22023'; end if;
  if p_nueva is null or length(p_nueva) < 6 or length(p_nueva) > 72 then
    raise exception 'La contraseña debe tener entre 6 y 72 caracteres.' using errcode = '22023';
  end if;
  perform verificar_codigo_autorizacion(p_codigo);

  select u.id, u.nombre_usuario, u.codigo_estudiante into v_obj from usuario u where u.id::text = v_u or u.codigo_estudiante = v_u;
  if not found then raise exception 'No existe un usuario con ese ID o código.' using errcode = '22023'; end if;

  v_hash := crypt(p_nueva, gen_salt('bf'));
  update auth.users set encrypted_password = v_hash, updated_at = now() where id = v_obj.id;
  if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'usuario' and column_name = 'contrasena_hash') then
    execute 'update usuario set contrasena_hash = $1 where id = $2' using v_hash, v_obj.id;
  end if;
  return jsonb_build_object('cambiada', true, 'nombre_usuario', v_obj.nombre_usuario, 'codigo_estudiante', v_obj.codigo_estudiante);
end $$;

-- ---------------------------------------------------------------------------------------
-- 6) Permisos de ejecucion
-- ---------------------------------------------------------------------------------------
-- Auxiliares internas: nadie las llama desde el navegador (verificar_codigo_autorizacion permitiria probar codigos a ciegas)
revoke all on function tiene_permiso(text), exigir_permiso(text), nivel_actual_de(uuid), verificar_codigo_autorizacion(text)
  from public, anon, authenticated;
-- Las del juego y del panel: solo jugadores con sesion (las del panel ademas exigen su permiso adentro)
revoke all on function latido(), mis_permisos(), admin_resumen(), admin_usuarios(text, int), admin_eliminar_usuario(text, text),
  admin_cambiar_contrasena(text, text, text), exigir_estudiante() from public, anon;
grant execute on function latido(), mis_permisos(), admin_resumen(), admin_usuarios(text, int),
  admin_eliminar_usuario(text, text), admin_cambiar_contrasena(text, text, text) to authenticated;

commit;

-- Comprobacion: el rol administrador debe tener 4 permisos
--   select r.nombre as rol, o.nombre as opcion from permiso p join rol r on r.id = p.rol_id join opcion o on o.id = p.opcion_id where r.nombre = 'administrador' order by o.nombre;
