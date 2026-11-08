-- =========================================================================================
-- while(no_aprendas) - PANEL DE ADMINISTRACION: CODIGO POR SMS AL ELIMINAR O CAMBIAR CONTRASENA
--  1. Para eliminar una cuenta o cambiar una contrasena el administrador debe escribir el codigo de 6 digitos que
--     Twilio le envia por SMS a SU celular: el que esta en usuario.telefono de su propia cuenta (mismo id / codigo).
--     Ya NO se pide el codigo de autorizacion en el panel (las funciones ya no lo reciben).
--  2. La base lo comprueba sola: la sesion debe venir de un inicio con ese codigo SMS hace como maximo 5 minutos
--     (Authentication lo anota en el token: amr = otp), al mismo celular de usuario.telefono, y cada codigo SMS sirve
--     para UNA sola accion. Asi no se puede saltear llamando a la API directamente.
-- El envio del SMS lo hace Supabase con Twilio (Authentication > Providers > Phone), igual que en el registro.
-- Ejecutar completo (todo o nada, repetible). Requiere haber ejecutado antes 18 y 23.
-- Si el administrador no tiene celular, ejecuta despues 25_celular_admin.sql.
-- =========================================================================================
begin;

-- 1) Codigos SMS ya usados (uno por sesion): ningun codigo sirve para dos acciones
create table if not exists sms_admin_usado (
  session_id uuid primary key,
  usuario_id uuid not null,
  usado_en   timestamptz not null default now()
);
alter table sms_admin_usado enable row level security;
revoke all on sms_admin_usado from anon, authenticated;

-- 2) Celular del administrador: el de la tabla usuario (usuario.telefono) de su propia cuenta (mismo id).
--    Authentication necesita ese mismo numero para enviar el SMS, asi que si alli falta o es otro, se copia.
create or replace function mi_celular_admin()
returns text language plpgsql security definer set search_path = public as $$
declare v_uid uuid; v_tel text; v_auth text;
begin
  v_uid := exigir_permiso('panel_admin');
  select telefono into v_tel from usuario where id = v_uid;
  if v_tel is null then return null; end if;
  select phone into v_auth from auth.users where id = v_uid;
  if v_auth is distinct from substr(v_tel, 2) then          -- Authentication lo guarda sin el + (51912345678)
    if exists (select 1 from auth.users where phone = substr(v_tel, 2) and id <> v_uid) then
      raise exception 'El celular % ya está registrado con otra cuenta de acceso.', v_tel using errcode = '23505';
    end if;
    update auth.users set phone = substr(v_tel, 2), phone_confirmed_at = now(), updated_at = now() where id = v_uid;
  end if;
  return v_tel;
end $$;

-- 3) Exige que la sesion se haya verificado con el codigo SMS hace poco, al celular de usuario.telefono, y que ese
--    codigo no se haya usado
create or replace function exigir_sms_reciente()
returns void language plpgsql security definer set search_path = public as $$
declare
  v_jwt jsonb := auth.jwt();
  v_sesion uuid;
  v_ok boolean;
begin
  if not exists (select 1 from usuario u join auth.users a on a.id = u.id
                 where u.id = auth.uid() and u.telefono is not null and a.phone = substr(u.telefono, 2)) then
    raise exception 'Tu cuenta de administrador no tiene celular en la base de datos.' using errcode = '42501', hint = 'SMS_REQUERIDO';
  end if;
  v_ok := exists (
    select 1 from jsonb_array_elements(coalesce(v_jwt->'amr', '[]'::jsonb)) a
    where a->>'method' in ('otp', 'sms')
      and to_timestamp((a->>'timestamp')::bigint) > now() - interval '5 minutes');
  v_sesion := nullif(v_jwt->>'session_id', '')::uuid;
  if not v_ok or v_sesion is null then
    raise exception 'Falta verificar el código que te llegó por SMS.' using errcode = '42501', hint = 'SMS_REQUERIDO';
  end if;
  insert into sms_admin_usado (session_id, usuario_id) values (v_sesion, auth.uid()) on conflict (session_id) do nothing;
  if not found then
    raise exception 'Ese código SMS ya se usó. Pide uno nuevo.' using errcode = '42501', hint = 'SMS_REQUERIDO';
  end if;
end $$;

-- 4) Las dos acciones delicadas exigen el SMS en lugar del codigo de autorizacion (el resto queda igual que en 18).
--    Cambia la firma (ya no reciben p_codigo): se borran las versiones anteriores.
drop function if exists admin_eliminar_usuario(text, text);
drop function if exists admin_cambiar_contrasena(text, text, text);

create or replace function admin_eliminar_usuario(p_usuario text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_admin uuid; v_obj record; v_u text := btrim(coalesce(p_usuario, ''));
begin
  v_admin := exigir_permiso('eliminar_usuario');
  if v_u = '' or length(v_u) > 64 then raise exception 'Escribe el ID del juego o el código del usuario.' using errcode = '22023'; end if;
  perform exigir_sms_reciente();

  select u.id, u.nombre_usuario, u.codigo_estudiante, r.nombre as rol into v_obj
  from usuario u join rol r on r.id = u.rol_id where u.id::text = v_u or u.codigo_estudiante = v_u;
  if not found then raise exception 'No existe un usuario con ese ID o código.' using errcode = '22023'; end if;
  if v_obj.id = v_admin then raise exception 'No puedes eliminar tu propia cuenta.' using errcode = 'P0001'; end if;
  if v_obj.rol = 'administrador' then raise exception 'No se puede eliminar a otro administrador desde el panel.' using errcode = 'P0001'; end if;

  delete from usuario where id = v_obj.id;        -- su configuracion, comodines, progreso y lugar en el ranking se borran en cascada
  delete from auth.users where id = v_obj.id;     -- su cuenta de acceso (y sus identidades)
  return jsonb_build_object('eliminado', true, 'nombre_usuario', v_obj.nombre_usuario, 'codigo_estudiante', v_obj.codigo_estudiante);
end $$;

create or replace function admin_cambiar_contrasena(p_usuario text, p_nueva text)
returns jsonb language plpgsql security definer set search_path = public, extensions as $$
declare v_obj record; v_u text := btrim(coalesce(p_usuario, '')); v_hash text;
begin
  perform exigir_permiso('cambiar_contrasena');
  if v_u = '' or length(v_u) > 64 then raise exception 'Escribe el ID del juego o el código del usuario.' using errcode = '22023'; end if;
  if p_nueva is null or length(p_nueva) < 6 or length(p_nueva) > 72 then
    raise exception 'La contraseña debe tener entre 6 y 72 caracteres.' using errcode = '22023';
  end if;
  perform exigir_sms_reciente();

  select u.id, u.nombre_usuario, u.codigo_estudiante into v_obj from usuario u where u.id::text = v_u or u.codigo_estudiante = v_u;
  if not found then raise exception 'No existe un usuario con ese ID o código.' using errcode = '22023'; end if;

  v_hash := crypt(p_nueva, gen_salt('bf'));
  update auth.users set encrypted_password = v_hash, updated_at = now() where id = v_obj.id;
  if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'usuario' and column_name = 'contrasena_hash') then
    execute 'update usuario set contrasena_hash = $1 where id = $2' using v_hash, v_obj.id;
  end if;
  return jsonb_build_object('cambiada', true, 'nombre_usuario', v_obj.nombre_usuario, 'codigo_estudiante', v_obj.codigo_estudiante);
end $$;

-- 5) Permisos de ejecucion (exigir_sms_reciente es interna: solo la usan las funciones del panel)
revoke all on function exigir_sms_reciente() from public, anon, authenticated;
revoke all on function mi_celular_admin() from public, anon;
grant execute on function mi_celular_admin() to authenticated;
revoke all on function admin_eliminar_usuario(text), admin_cambiar_contrasena(text, text) from public, anon;
grant execute on function admin_eliminar_usuario(text), admin_cambiar_contrasena(text, text) to authenticated;

commit;

-- Comprobacion: acciones hechas con codigo SMS (la mas reciente primero)
--   select s.usado_en, u.nombre_usuario from sms_admin_usado s left join usuario u on u.id = s.usuario_id order by s.usado_en desc;
