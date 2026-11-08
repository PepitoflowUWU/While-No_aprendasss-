-- =========================================================================================
-- while(no_aprendas) - PANEL DE ADMINISTRACION: BLOQUEO ENTRE ADMINISTRADORES Y ASIGNAR ROLES
--  1. Un administrador ya no puede cambiar la contrasena de OTRO administrador (eliminarlo ya estaba bloqueado).
--     Su propia contrasena si la puede cambiar.
--  2. Super administrador: el usuario con codigo U24207317 (guardado en config_sistema, clave super_admin_codigo).
--     Es el UNICO que puede asignar roles (estudiante o administrador; el docente se quito en 27) desde el panel.
--  3. Funciones nuevas: es_super_admin(), admin_roles(), admin_asignar_rol(). Asignar un rol exige el codigo SMS
--     del super administrador (igual que eliminar o cambiar contrasena) y nadie puede cambiarse su propio rol.
--  4. mis_permisos() solo entrega la opcion asignar_rol al super administrador (el juego muestra la seccion con eso).
-- Ejecutar UNA vez, completo (todo o nada, repetible). Requiere haber ejecutado antes 18, 23 y 24.
-- =========================================================================================
begin;

-- 1) Quien es el super administrador (config_sistema no se puede leer ni cambiar desde el navegador)
insert into config_sistema (clave, valor) values ('super_admin_codigo', 'U24207317')
on conflict (clave) do update set valor = excluded.valor;

-- 2) Opcion nueva del RBAC: asignar_rol (del rol administrador, pero las funciones exigen ademas ser el super administrador)
insert into opcion (nombre, descripcion)
values ('asignar_rol', 'Asignar el rol de un usuario (solo el super administrador)')
on conflict (nombre) do nothing;

insert into permiso (rol_id, opcion_id)
select r.id, o.id from rol r join opcion o on o.nombre = 'asignar_rol'
where r.nombre = 'administrador'
on conflict (rol_id, opcion_id) do nothing;

-- 3) Funciones de apoyo
create or replace function es_super_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from usuario u
    where u.id = auth.uid()
      and u.codigo_estudiante = (select valor from config_sistema where clave = 'super_admin_codigo'));
$$;

-- asignar_rol solo aparece en la lista del super administrador
create or replace function mis_permisos()
returns text[] language sql stable security definer set search_path = public as $$
  select coalesce(array_agg(o.nombre order by o.nombre), '{}')
  from usuario u join permiso p on p.rol_id = u.rol_id join opcion o on o.id = p.opcion_id
  where u.id = auth.uid() and (o.nombre <> 'asignar_rol' or es_super_admin());
$$;

create or replace function exigir_super_admin()
returns uuid language plpgsql stable security definer set search_path = public as $$
declare v_uid uuid;
begin
  v_uid := exigir_permiso('asignar_rol');
  if not es_super_admin() then
    raise exception 'Solo el super administrador puede asignar roles.' using errcode = '42501';
  end if;
  return v_uid;
end $$;

-- 4) Un administrador no puede cambiar la contrasena de otro administrador
create or replace function admin_cambiar_contrasena(p_usuario text, p_nueva text)
returns jsonb language plpgsql security definer set search_path = public, extensions as $$
declare v_admin uuid; v_obj record; v_u text := btrim(coalesce(p_usuario, '')); v_hash text;
begin
  v_admin := exigir_permiso('cambiar_contrasena');
  if v_u = '' or length(v_u) > 64 then raise exception 'Escribe el ID del juego o el código del usuario.' using errcode = '22023'; end if;
  if p_nueva is null or length(p_nueva) < 6 or length(p_nueva) > 72 then
    raise exception 'La contraseña debe tener entre 6 y 72 caracteres.' using errcode = '22023';
  end if;

  select u.id, u.nombre_usuario, u.codigo_estudiante, r.nombre as rol into v_obj
  from usuario u join rol r on r.id = u.rol_id where u.id::text = v_u or u.codigo_estudiante = v_u;
  if not found then raise exception 'No existe un usuario con ese ID o código.' using errcode = '22023'; end if;
  if v_obj.rol = 'administrador' and v_obj.id <> v_admin then
    raise exception 'No puedes cambiar la contraseña de otro administrador.' using errcode = '42501';
  end if;
  perform exigir_sms_reciente();

  v_hash := crypt(p_nueva, gen_salt('bf'));
  update auth.users set encrypted_password = v_hash, updated_at = now() where id = v_obj.id;
  if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'usuario' and column_name = 'contrasena_hash') then
    execute 'update usuario set contrasena_hash = $1 where id = $2' using v_hash, v_obj.id;
  end if;
  return jsonb_build_object('cambiada', true, 'nombre_usuario', v_obj.nombre_usuario, 'codigo_estudiante', v_obj.codigo_estudiante);
end $$;

-- 5) Roles que se pueden asignar (para la lista del panel)
create or replace function admin_roles()
returns jsonb language plpgsql stable security definer set search_path = public as $$
begin
  perform exigir_super_admin();
  return coalesce((select jsonb_agg(jsonb_build_object('nombre', r.nombre, 'descripcion', r.descripcion) order by r.nombre)
                   from rol r where r.nombre in ('estudiante', 'administrador')), '[]'::jsonb);
end $$;

-- 6) Asignar el rol de un usuario. p_usuario = id del juego (uuid) o codigo U########; p_rol = nombre del rol.
create or replace function admin_asignar_rol(p_usuario text, p_rol text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_admin uuid; v_obj record; v_rol uuid; v_u text := btrim(coalesce(p_usuario, '')); v_nombre text := lower(btrim(coalesce(p_rol, '')));
begin
  v_admin := exigir_super_admin();
  if v_u = '' or length(v_u) > 64 then raise exception 'Escribe el ID del juego o el código del usuario.' using errcode = '22023'; end if;
  if v_nombre not in ('estudiante', 'administrador') then
    raise exception 'Elige un rol válido: estudiante o administrador.' using errcode = '22023';
  end if;
  select id into v_rol from rol where nombre = v_nombre;
  if v_rol is null then raise exception 'El rol % no existe en la tabla rol.', v_nombre using errcode = '22023'; end if;

  select u.id, u.nombre_usuario, u.codigo_estudiante, r.nombre as rol into v_obj
  from usuario u join rol r on r.id = u.rol_id where u.id::text = v_u or u.codigo_estudiante = v_u;
  if not found then raise exception 'No existe un usuario con ese ID o código.' using errcode = '22023'; end if;
  if v_obj.id = v_admin then raise exception 'No puedes cambiar tu propio rol.' using errcode = 'P0001'; end if;
  if v_obj.rol = v_nombre then raise exception 'Ese usuario ya tiene el rol %.', v_nombre using errcode = 'P0001'; end if;
  perform exigir_sms_reciente();

  perform set_config('app.cambio_autorizado', 'true', true);   -- el rol es un dato protegido del jugador (sql 23)
  update usuario set rol_id = v_rol where id = v_obj.id;
  return jsonb_build_object('asignado', true, 'nombre_usuario', v_obj.nombre_usuario, 'codigo_estudiante', v_obj.codigo_estudiante,
                            'rol_anterior', v_obj.rol, 'rol_nuevo', v_nombre);
end $$;

-- 7) Permisos de ejecucion
revoke all on function es_super_admin(), exigir_super_admin() from public, anon, authenticated;
revoke all on function mis_permisos(), admin_roles(), admin_asignar_rol(text, text), admin_cambiar_contrasena(text, text) from public, anon;
grant execute on function mis_permisos(), admin_roles(), admin_asignar_rol(text, text), admin_cambiar_contrasena(text, text) to authenticated;

commit;

-- Comprobacion: el super administrador y su rol
--   select u.nombre_usuario, u.codigo_estudiante, r.nombre as rol from usuario u join rol r on r.id = u.rol_id
--   where u.codigo_estudiante = (select valor from config_sistema where clave = 'super_admin_codigo');
