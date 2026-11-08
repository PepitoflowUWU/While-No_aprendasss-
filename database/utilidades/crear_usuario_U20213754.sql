-- =========================================================================================
-- while(no_aprendas) - CREAR EL ESTUDIANTE U20213754 (personaje: Chica)
-- Crea la cuenta de acceso (Authentication) y el perfil del jugador (usuario, configuracion y 3 comodines), para que
-- la persona pueda iniciar sesion en el juego con su correo (codigo@utp.edu.pe) y la contrasena que pongas aqui.
--
-- 1) Cambia los valores de la seccion "CAMBIA AQUI".   2) Ejecuta TODO el script.   3) Mira la tabla de resultado.
-- Es todo o nada: si algo falla (codigo invalido, correo repetido...), no se crea nada.
--
-- Usa el MISMO registro que el juego (funcion completar_registro), asi que aplica las mismas validaciones:
-- codigo U + 8 numeros, nombre de usuario automatico (Jugador + 4 ultimos digitos), 3 comodines, etc.
-- Requiere haber ejecutado antes 01 a 05, 11 y 23 (el registro exige celular verificado: aqui lo deja ya verificado).
-- =========================================================================================
drop table if exists pg_temp.usuario_creado;
create temp table usuario_creado (id uuid);

do $crear$
declare
  -- ===================== CAMBIA AQUI =====================
  v_codigo       text    := 'U20213754';   -- U + 8 numeros, en mayuscula
  v_contrasena   text    := 'CambiaEstaClave1';    -- al menos 6 caracteres. CAMBIALA: es la que usara la persona para entrar
  v_telefono     text    := '+51900000000';   -- CAMBIALO: celular REAL del estudiante (+51 y 9 digitos). Se guarda ya verificado (tu respondes por el)
  v_personaje    text    := 'Chica';       -- Chica o Chico (o null para dejarlo sin elegir)
  v_musica       boolean := true;          -- musica del juego activada
  v_animaciones  boolean := true;          -- animaciones y efectos activados
  -- =======================================================
  v_id    uuid := gen_random_uuid();
  v_email text;
  v_pj    uuid;
begin
  if v_codigo is null or v_codigo !~ '^U[0-9]{8}$' then
    raise exception 'El código debe ser U seguida de 8 números, en mayúscula (ejemplo: U20213754).' using errcode = '23514';
  end if;
  if v_telefono is null or v_telefono !~ '^\+519[0-9]{8}$' then
    raise exception 'El celular debe ser de Perú: +51 y 9 dígitos (ejemplo: +51912345678).' using errcode = '23514';
  end if;
  if v_contrasena is null or length(v_contrasena) < 6 then
    raise exception 'La contraseña debe tener al menos 6 caracteres.' using errcode = '23514';
  end if;

  v_email := lower(v_codigo) || '@utp.edu.pe';
  if exists (select 1 from auth.users where lower(email) = v_email) then
    raise exception 'Ya existe una cuenta con el correo %.', v_email using errcode = '23505';
  end if;
  if exists (select 1 from usuario where codigo_estudiante = v_codigo) then
    raise exception 'Ya existe un jugador con el código %.', v_codigo using errcode = '23505';
  end if;

  if v_personaje is not null then
    select id into v_pj from personaje where tipo = 'jugable' and lower(nombre) = lower(v_personaje);
    if v_pj is null then
      raise exception 'No existe el personaje jugable "%". Usa Chica o Chico (o null).', v_personaje using errcode = '23503';
    end if;
  end if;

  -- 1) Cuenta de acceso (Authentication). Los campos de texto van vacios, no nulos: asi lo espera el servicio de acceso.
  insert into auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, last_sign_in_at,
                          raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
                          confirmation_token, email_change, email_change_token_new, recovery_token, phone, phone_confirmed_at)
  values ('00000000-0000-0000-0000-000000000000', v_id, 'authenticated', 'authenticated', v_email,
          extensions.crypt(v_contrasena, extensions.gen_salt('bf')), now(), now(),
          '{"provider":"email","providers":["email"]}', '{}', now(), now(), '', '', '', '', substr(v_telefono, 2), now());

  insert into auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
  values (gen_random_uuid(), v_id, jsonb_build_object('sub', v_id::text, 'email', v_email, 'email_verified', true), 'email', v_id::text, now(), now(), now());

  -- 2) Perfil del jugador: se llama al registro del juego en nombre de esa cuenta
  perform set_config('request.jwt.claim.sub', v_id::text, true);
  perform set_config('request.jwt.claims', json_build_object('sub', v_id, 'role', 'authenticated')::text, true);
  perform completar_registro(v_codigo, v_pj, v_musica, v_animaciones);

  insert into usuario_creado values (v_id);
end
$crear$;

-- Resultado: el usuario creado
select u.nombre_usuario, u.codigo_estudiante, u.correo_institucional as correo, p.nombre as personaje,
       u.puntaje_total as puntos, u.racha_actual as racha, i.cantidad as comodines,
       c.musica_activada as musica, c.animaciones_activadas as animaciones
from usuario_creado x
join usuario u on u.id = x.id
left join personaje p on p.id = u.personaje_id
left join inventario_comodin i on i.usuario_id = u.id
left join configuracion_usuario c on c.usuario_id = u.id;

-- Para BORRAR un usuario creado (por ejemplo una prueba). Primero su perfil del juego (sus datos de configuracion, comodines,
-- progreso y ranking se borran en cascada) y despues su cuenta de acceso (sus identidades se borran en cascada):
--   delete from usuario where codigo_estudiante = 'U20213754';
--   delete from auth.users where email = 'u20213754@utp.edu.pe';
-- (Si tu tabla usuario no tiene la clave externa hacia auth.users, borrar solo la cuenta de acceso deja el perfil huerfano.)
