-- =========================================================================================
-- while(no_aprendas) - CELULAR DEL USUARIO + VERIFICACION POR SMS (Twilio) AL CREAR LA CUENTA
--  1. Columna usuario.telefono (formato +51 9XXXXXXXX), unica por usuario. Los usuarios que ya existen quedan sin celular.
--  2. completar_registro() ahora solo crea el perfil si el celular YA FUE VERIFICADO con el codigo que Twilio envio por SMS
--     (Authentication guarda la confirmacion en auth.users.phone_confirmed_at) y copia ese numero en usuario.telefono.
--     Asi no se puede saltear la verificacion llamando a la API directamente.
--  3. Cambiar el celular de un estudiante exige el codigo de autorizacion (igual que el personaje, el correo o el codigo).
--  4. El panel de administracion (admin_usuarios) trae el celular de cada usuario y lo puede buscar.
-- El envio del SMS lo hace Supabase con Twilio: se configura en el panel (Authentication > Providers > Phone), no aqui.
-- Ejecutar UNA vez, completo (todo o nada, repetible). Requiere haber ejecutado antes 11 y 18.
-- =========================================================================================
begin;

-- 1) Columna, formato y unicidad
alter table usuario add column if not exists telefono varchar(20);
alter table usuario drop constraint if exists usuario_telefono_formato;
alter table usuario add constraint usuario_telefono_formato check (telefono is null or telefono ~ '^\+519[0-9]{8}$');
create unique index if not exists usuario_telefono_unico on usuario (telefono) where telefono is not null;

-- 2) El perfil solo se crea con el celular verificado
create or replace function completar_registro(
  p_codigo text, p_personaje_id uuid, p_musica boolean default true, p_animaciones boolean default true
) returns void
language plpgsql security definer set search_path = public as $$
declare
  v_uid uuid := auth.uid();
  v_cod text := p_codigo;
  v_rol uuid; v_com uuid; v_hash text;
  v_phone text; v_conf timestamptz; v_tel text;
begin
  if v_uid is null then raise exception 'Sin sesion: primero hay que crear la cuenta.' using errcode = '42501'; end if;
  if v_cod is null or v_cod !~ '^U[0-9]{8}$' then
    raise exception 'El código debe ser U seguida de 8 números (ejemplo: U12345678).' using errcode = '23514';
  end if;

  -- El perfil solo se crea si el celular ya fue VERIFICADO con el código SMS (Authentication lo marca en phone_confirmed_at)
  select phone, phone_confirmed_at into v_phone, v_conf from auth.users where id = v_uid;
  if v_phone is null or v_conf is null then
    raise exception 'Verifica tu celular antes de continuar.' using errcode = '42501';
  end if;
  v_tel := '+' || regexp_replace(v_phone, '^\+', '');
  if v_tel !~ '^\+519[0-9]{8}$' then
    raise exception 'El celular debe ser de Perú: +51 y 9 dígitos (ejemplo: +51 912 345 678).' using errcode = '23514';
  end if;

  select id into v_rol from rol where nombre = 'estudiante';
  if v_rol is null then
    insert into rol (nombre, descripcion) values ('estudiante', 'Puede jugar, resolver ejercicios y ver su propio progreso.') returning id into v_rol;
  end if;
  v_com := comodin_base();
  if v_com is null then
    insert into comodin (nombre, descripcion, tipo_aplicacion) values ('Pista rápida', 'Da una pista breve sobre el ejercicio.', 'universal') returning id into v_com;
  end if;

  select encrypted_password into v_hash from auth.users where id = v_uid;
  if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'usuario' and column_name = 'contrasena_hash') then
    execute 'insert into usuario (id, personaje_id, rol_id, correo_institucional, codigo_estudiante, nombre_usuario,
                                  puntaje_total, racha_actual, racha_maxima, contrasena_hash, telefono)
             values ($1, $2, $3, $4, $5, $6, 0, 0, 0, $7, $8)'
      using v_uid, p_personaje_id, v_rol, v_cod || '@utp.edu.pe', v_cod, 'Jugador' || right(v_cod, 4), v_hash, v_tel;
  else
    insert into usuario (id, personaje_id, rol_id, correo_institucional, codigo_estudiante, nombre_usuario,
                         puntaje_total, racha_actual, racha_maxima, telefono)
    values (v_uid, p_personaje_id, v_rol, v_cod || '@utp.edu.pe', v_cod, 'Jugador' || right(v_cod, 4), 0, 0, 0, v_tel);
  end if;

  insert into configuracion_usuario (usuario_id, sonido_activado, musica_activada, animaciones_activadas)
  values (v_uid, true, coalesce(p_musica, true), coalesce(p_animaciones, true)) on conflict (usuario_id) do nothing;
  insert into inventario_comodin (usuario_id, comodin_id, cantidad) values (v_uid, v_com, 3)
  on conflict (usuario_id, comodin_id) do nothing;
end $$;

-- 3) El celular tambien es un dato protegido de los estudiantes
create or replace function validar_y_preparar_usuario()
returns trigger
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_rol text;
  v_rol_old text;
  v_base text;
  v_nombre text;
  v_n int;
  v_generar boolean;
begin
  select nombre into v_rol from rol where id = NEW.rol_id;

  -- Cambios en datos de un jugador: exigen el codigo de autorizacion (puntos y rachas quedan libres para las funciones)
  if TG_OP = 'UPDATE' then
    select nombre into v_rol_old from rol where id = OLD.rol_id;
    if v_rol_old = 'estudiante'
       and (OLD.personaje_id, OLD.rol_id, OLD.correo_institucional, OLD.codigo_estudiante,
            OLD.nombre_usuario, OLD.fecha_registro, OLD.telefono)
           is distinct from
           (NEW.personaje_id, NEW.rol_id, NEW.correo_institucional, NEW.codigo_estudiante,
            NEW.nombre_usuario, NEW.fecha_registro, NEW.telefono)
       and coalesce(current_setting('app.cambio_autorizado', true), '') <> 'true' then
      raise exception 'Se requiere el código de autorización para modificar los datos de un jugador.'
        using errcode = '42501';
    end if;
  end if;

  if v_rol = 'estudiante' then
    if NEW.codigo_estudiante is null or NEW.codigo_estudiante !~ '^U[0-9]{8}$' then
      raise exception 'El código de estudiante debe ser U seguida de 8 números (ejemplo: U12345678), en mayúscula y sin espacios.'
        using errcode = '23514';
    end if;
    if NEW.correo_institucional !~* '^u[0-9]{8}@utp\.edu\.pe$' then
      raise exception 'El correo debe empezar con U (o u) y terminar en @utp.edu.pe.' using errcode = '23514';
    end if;
    if upper(split_part(NEW.correo_institucional, '@', 1)) <> NEW.codigo_estudiante then
      raise exception 'El correo debe ser igual al código de estudiante.' using errcode = '23514';
    end if;

    -- Nombre de usuario automatico: Jugador + 4 ultimos digitos (.2, .3 si se repite). Es tambien el nombre del ranking.
    if TG_OP = 'INSERT' then v_generar := true;
    else v_generar := NEW.codigo_estudiante is distinct from OLD.codigo_estudiante;
    end if;

    if v_generar then
      v_base := 'Jugador' || right(NEW.codigo_estudiante, 4);
      perform pg_advisory_xact_lock(hashtext(v_base));
      v_nombre := v_base;
      v_n := 1;
      while exists (select 1 from usuario where nombre_usuario = v_nombre and id <> NEW.id) loop
        v_n := v_n + 1;
        v_nombre := v_base || '.' || v_n;
      end loop;
      NEW.nombre_usuario := v_nombre;
    else
      NEW.nombre_usuario := OLD.nombre_usuario;
    end if;
  end if;

  return NEW;
end;
$$;

-- 4) Panel de administracion: celular de cada usuario
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

commit;

-- Comprobacion: la columna existe y los usuarios antiguos no tienen celular (nulo)
--   select count(*) as con_celular, count(*) filter (where telefono is null) as sin_celular from usuario;
