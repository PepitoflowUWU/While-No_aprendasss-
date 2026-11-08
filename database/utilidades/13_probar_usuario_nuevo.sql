-- =========================================================================================
-- while(no_aprendas) - PROBAR UN USUARIO NUEVO
-- Intenta INSERTAR un usuario con los valores que pongas abajo y te dice si la base lo ACEPTA o lo RECHAZA (y por que).
-- 1) Cambia los valores de la seccion "CAMBIA AQUI".   2) Ejecuta TODO el script.   3) Mira la tabla de resultado.
-- Por defecto solo PRUEBA: deshace todo (v_guardar = false). Con v_guardar = true el usuario queda guardado.
--
-- OJO: un usuario creado asi sirve para probar la base de datos, pero NO puede iniciar sesion en el juego (no tiene
-- identidad de acceso). Para una cuenta con la que jugar, registrala desde la pantalla "Crear cuenta" del juego.
-- =========================================================================================
drop table if exists pg_temp.resultado_prueba;
create temp table resultado_prueba (campo text, valor text);

do $prueba$
declare
  -- ===================== CAMBIA AQUI =====================
  v_codigo        text    := 'U12345678';   -- prueba: 'u12345678', 'U1234567', 'U123456789', 'U1234A678', 'U1234-678', '123456789'
  v_correo        text    := null;          -- null = se usa el codigo + @utp.edu.pe. Prueba otro: 'U99999999@utp.edu.pe' o 'x@gmail.com'
  v_contrasena    text    := 'Clave123';
  v_puntos        int     := 0;             -- prueba: -5
  v_racha_actual  int     := 0;             -- prueba: -1, 1000
  v_racha_maxima  int     := 0;             -- prueba: 1000, o un numero menor que v_racha_actual
  v_comodines     int     := 3;             -- prueba: 11, -1
  v_guardar       boolean := false;         -- true = dejar el usuario guardado ; false = solo probar y deshacer
  -- =======================================================
  v_id    uuid := gen_random_uuid();
  v_rol   uuid;
  v_com   uuid;
  v_mail  text;
  v_nombre text;
  v_hash  text;
begin
  v_mail := coalesce(v_correo, v_codigo || '@utp.edu.pe');
  select id into v_rol from rol where nombre = 'estudiante';
  if v_rol is null then
    insert into resultado_prueba values ('RESULTADO', 'No existe el rol estudiante: ejecuta 05_registro_robusto.sql');
    return;
  end if;
  select id into v_com from comodin order by (nombre = 'Pista rápida') desc, id limit 1;

  begin
    -- Si usuario.id apunta a Authentication, primero se crea esa cuenta de acceso
    if exists (select 1 from pg_constraint where conrelid = 'public.usuario'::regclass and contype = 'f' and confrelid = 'auth.users'::regclass) then
      insert into auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data)
      values (v_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', lower(v_mail),
              extensions.crypt(v_contrasena, extensions.gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{}');
    end if;
    select extensions.crypt(v_contrasena, extensions.gen_salt('bf')) into v_hash;

    -- El usuario. (nombre_usuario lo genera la base: Jugador + 4 ultimos digitos)
    if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'usuario' and column_name = 'contrasena_hash') then
      execute 'insert into usuario (id, rol_id, correo_institucional, codigo_estudiante, nombre_usuario, puntaje_total, racha_actual, racha_maxima, contrasena_hash)
               values ($1, $2, $3, $4, ''x'', $5, $6, $7, $8)'
        using v_id, v_rol, v_mail, v_codigo, v_puntos, v_racha_actual, v_racha_maxima, v_hash;
    else
      insert into usuario (id, rol_id, correo_institucional, codigo_estudiante, nombre_usuario, puntaje_total, racha_actual, racha_maxima)
      values (v_id, v_rol, v_mail, v_codigo, 'x', v_puntos, v_racha_actual, v_racha_maxima);
    end if;
    insert into configuracion_usuario (usuario_id) values (v_id) on conflict do nothing;
    if v_com is not null then insert into inventario_comodin (usuario_id, comodin_id, cantidad) values (v_id, v_com, v_comodines); end if;

    select nombre_usuario into v_nombre from usuario where id = v_id;
    insert into resultado_prueba values ('RESULTADO', 'ACEPTADO: la base permitio crear el usuario');
    insert into resultado_prueba values ('nombre_usuario generado', v_nombre);
    insert into resultado_prueba values ('guardado', case when v_guardar then 'SI: el usuario quedo guardado' else 'NO: se deshizo (solo era una prueba)' end);
    if not v_guardar then
      -- Se deshace el bloque, pero el resultado ya anotado se vuelve a escribir fuera
      raise exception using errcode = 'P9999', message = 'deshacer ' || coalesce(v_nombre, '');
    end if;
  exception when others then
    if sqlstate = 'P9999' then
      delete from resultado_prueba;
      insert into resultado_prueba values ('RESULTADO', 'ACEPTADO: la base permitio crear el usuario');
      insert into resultado_prueba values ('nombre_usuario generado', substr(sqlerrm, 10));
      insert into resultado_prueba values ('guardado', 'NO: se deshizo (solo era una prueba). Pon v_guardar := true para dejarlo guardado.');
    else
      delete from resultado_prueba;
      insert into resultado_prueba values ('RESULTADO', 'RECHAZADO: la base NO permitio crear el usuario');
      insert into resultado_prueba values ('motivo', sqlerrm);
      insert into resultado_prueba values ('codigo de error', sqlstate);
    end if;
  end;

  insert into resultado_prueba values ('valores probados', format('codigo=%L correo=%L puntos=%s racha=%s racha_max=%s comodines=%s', v_codigo, v_mail, v_puntos, v_racha_actual, v_racha_maxima, v_comodines));
end
$prueba$;

select campo, valor from pg_temp.resultado_prueba
order by case campo when 'RESULTADO' then 1 when 'motivo' then 2 when 'nombre_usuario generado' then 2 when 'codigo de error' then 3 when 'guardado' then 3 else 4 end;
