-- =========================================================================================
-- while(no_aprendas) - VALIDAR QUE LA BASE RECHAZA LO QUE NO DEBE PERMITIR
-- Pegalo COMPLETO en el SQL Editor y ejecutalo. Devuelve una tabla con una fila por prueba:
--   OK       = la base rechazo lo prohibido (por el motivo correcto)
--   FALLA    = la base LO PERMITIO  (hay que corregirlo)
--   REVISAR  = fallo, pero por otro motivo distinto al esperado (mira el detalle)
--   OMITIDA  = no hay datos para probarlo todavia (por ejemplo, ningun usuario registrado)
--
-- NO DEJA CAMBIOS: cada intento corre en un sub-bloque que siempre se deshace; si la base permitiera la operacion,
-- se anota como FALLA y se revierte en el acto. Se puede ejecutar cuantas veces quieras.
-- Requiere haber ejecutado 11_progreso_puntos_comodines.sql y tener al menos un usuario registrado.
-- =========================================================================================
drop table if exists pg_temp.resultados;
create temp table resultados (orden serial, grupo text, prueba text, resultado text, detalle text);

-- Intenta una operacion que DEBE fallar. p_patron: texto que debe aparecer en el mensaje de error (el motivo correcto).
-- p_rol: si se indica, la operacion se intenta con ese rol (por ejemplo authenticated = lo que puede hacer el navegador).
create or replace function pg_temp.debe_fallar(p_grupo text, p_prueba text, p_sql text, p_patron text default null, p_rol text default null)
returns void language plpgsql as $f$
declare v_msg text;
begin
  begin
    if p_rol is not null then execute format('set local role %I', p_rol); end if;
    execute p_sql;
    raise exception using errcode = 'P9999', message = 'permitido';      -- si llega aqui, la base lo dejo pasar
  exception when others then
    v_msg := sqlerrm;
    if sqlstate = 'P9999' then
      insert into pg_temp.resultados (grupo, prueba, resultado, detalle) values (p_grupo, p_prueba, 'FALLA', 'La base lo PERMITIO (se revirtio).');
    elsif p_patron is null or v_msg ilike '%' || p_patron || '%' then
      insert into pg_temp.resultados (grupo, prueba, resultado, detalle) values (p_grupo, p_prueba, 'OK', left(v_msg, 110));
    else
      insert into pg_temp.resultados (grupo, prueba, resultado, detalle) values (p_grupo, p_prueba, 'REVISAR', 'Fallo por otro motivo: ' || left(v_msg, 110));
    end if;
  end;
end $f$;

create or replace function pg_temp.anotar(p_grupo text, p_prueba text, p_ok boolean, p_detalle text default null)
returns void language sql as $f$
  insert into pg_temp.resultados (grupo, prueba, resultado, detalle) values (p_grupo, p_prueba, case when p_ok then 'OK' else 'FALLA' end, p_detalle);
$f$;

do $prueba$
declare
  v_id uuid;           -- un estudiante real para probar (no se modifica nada)
  v_uid text;
  v_jwt text;
  v_malo text;
  v_cod text;
begin
  select u.id into v_id from usuario u join rol r on r.id = u.rol_id where r.nombre = 'estudiante' order by u.fecha_registro limit 1;
  if v_id is null then
    insert into pg_temp.resultados (grupo, prueba, resultado, detalle) values ('General', 'Hay al menos un estudiante registrado', 'OMITIDA', 'Registra una cuenta en el juego y vuelve a ejecutar.');
    return;
  end if;
  v_uid := v_id::text;
  v_jwt := format('select set_config(''request.jwt.claim.sub'', %L, true); select set_config(''request.jwt.claims'', %L, true);', v_uid,
                  json_build_object('sub', v_uid, 'role', 'authenticated')::text);

  -- ---------------------------------------------------------------------------------------
  -- 1) CODIGO DE ESTUDIANTE: U + 8 numeros (se salta la clave de autorizacion para probar solo el formato)
  -- ---------------------------------------------------------------------------------------
  foreach v_malo in array array['u12345678','U1234567','U123456789','U1234A678','U1234-678','123456789',' U12345678','U12345678 ','U 2345678','UU2345678','']
  loop
    perform pg_temp.debe_fallar('1. Codigo de estudiante', format('Rechaza %L', v_malo),
      format('select set_config(''app.cambio_autorizado'', ''true'', true); update usuario set codigo_estudiante = %L where id = %L', v_malo, v_id), 'código');
  end loop;
  -- la restriccion CHECK por si sola (sin el trigger): tambien lo rechaza aunque alguien lo desactive
  perform pg_temp.debe_fallar('1. Codigo de estudiante', 'CHECK usuario_codigo_formato rechaza u12345678 (sin trigger)',
    format('alter table usuario disable trigger trg_usuario_validar; update usuario set codigo_estudiante = %L where id = %L', 'u12345678', v_id), 'usuario_codigo_formato');
  perform pg_temp.debe_fallar('1. Codigo de estudiante', 'Un jugador no puede cambiarse el codigo sin autorizacion',
    format('update usuario set codigo_estudiante = %L where id = %L', 'U99999999', v_id), 'autorización');
  perform pg_temp.debe_fallar('1. Codigo de estudiante', 'completar_registro rechaza u12345678',
    v_jwt || ' select completar_registro(''u12345678'', null, true, true)', 'código');

  -- ---------------------------------------------------------------------------------------
  -- 2) RACHAS: enteros de 0 a 999 y racha_maxima >= racha_actual
  -- ---------------------------------------------------------------------------------------
  perform pg_temp.debe_fallar('2. Rachas', 'racha_actual = -1',   format('update usuario set racha_actual = -1 where id = %L', v_id), 'racha');
  perform pg_temp.debe_fallar('2. Rachas', 'racha_actual = 1000', format('update usuario set racha_actual = 1000, racha_maxima = 1000 where id = %L', v_id), 'racha');
  perform pg_temp.debe_fallar('2. Rachas', 'racha_maxima = -1',   format('update usuario set racha_maxima = -1 where id = %L', v_id), 'racha');
  perform pg_temp.debe_fallar('2. Rachas', 'racha_maxima = 1000', format('update usuario set racha_maxima = 1000 where id = %L', v_id), 'racha');
  perform pg_temp.debe_fallar('2. Rachas', 'racha_maxima menor que racha_actual', format('update usuario set racha_actual = 10, racha_maxima = 5 where id = %L', v_id), 'racha_maxima_mayor');
  perform pg_temp.debe_fallar('2. Rachas', 'racha con decimal (1.5)', format('update usuario set racha_actual = (''{"v":1.5}''::json->>''v'')::int where id = %L', v_id), 'invalid input syntax');
  perform pg_temp.debe_fallar('2. Rachas', 'racha con texto (abc)',   format('update usuario set racha_actual = ''abc'' where id = %L', v_id), 'invalid input syntax');

  -- ---------------------------------------------------------------------------------------
  -- 3) COMODINES DISPONIBLES: enteros de 0 a 10
  -- ---------------------------------------------------------------------------------------
  if exists (select 1 from inventario_comodin where usuario_id = v_id) then
    perform pg_temp.debe_fallar('3. Comodines', 'cantidad = 11',  format('update inventario_comodin set cantidad = 11 where usuario_id = %L', v_id), 'inventario_cantidad_rango');
    perform pg_temp.debe_fallar('3. Comodines', 'cantidad = -1',  format('update inventario_comodin set cantidad = -1 where usuario_id = %L', v_id), 'inventario_cantidad_rango');
    perform pg_temp.debe_fallar('3. Comodines', 'cantidad con decimal (2.5)', format('update inventario_comodin set cantidad = (''{"v":2.5}''::json->>''v'')::int where usuario_id = %L', v_id), 'invalid input syntax');
    perform pg_temp.debe_fallar('3. Comodines', 'cantidad con texto (x)',     format('update inventario_comodin set cantidad = ''x'' where usuario_id = %L', v_id), 'invalid input syntax');
  else
    insert into pg_temp.resultados (grupo, prueba, resultado, detalle) values ('3. Comodines', 'Rangos de cantidad (11, -1, decimal, texto)', 'OMITIDA', 'Ese usuario no tiene fila en inventario_comodin.');
  end if;

  -- ---------------------------------------------------------------------------------------
  -- 4) NUMEROS NEGATIVOS en puntos y otros campos
  -- ---------------------------------------------------------------------------------------
  perform pg_temp.debe_fallar('4. Numeros negativos', 'usuario.puntaje_total = -5', format('update usuario set puntaje_total = -5 where id = %L', v_id), 'usuario_puntaje_no_negativo');
  perform pg_temp.debe_fallar('4. Numeros negativos', 'unidad.limite_comodines = -1', 'update unidad set limite_comodines = -1', 'unidad_numeros_no_negativos');
  perform pg_temp.debe_fallar('4. Numeros negativos', 'nivel.orden = -1', 'update nivel set orden = -1', 'nivel_orden_no_negativo');
  if exists (select 1 from ejercicio) then
    perform pg_temp.debe_fallar('4. Numeros negativos', 'ejercicio.puntos_base = -1', 'update ejercicio set puntos_base = -1', 'ejercicio_numeros_no_negativos');
  end if;
  perform pg_temp.debe_fallar('4. Numeros negativos', 'progreso.intentos_totales = -1',
    format('insert into progreso (usuario_id, nivel_id, completado, intentos_totales) select %L, id, false, -1 from nivel limit 1', v_id), 'progreso_intentos_no_negativo');
  perform pg_temp.debe_fallar('4. Numeros negativos', 'uso_comodin_unidad.comodines_usados = -1',
    format('insert into uso_comodin_unidad (usuario_id, unidad_id, comodines_usados) select %L, id, -1 from unidad limit 1 on conflict (usuario_id, unidad_id) do update set comodines_usados = -1', v_id), 'uso_comodin_no_negativo');
  perform pg_temp.debe_fallar('4. Numeros negativos', 'progreso_leccion con estrellas 0 o puntos negativos',
    format('insert into progreso_leccion (usuario_id, nivel_id, leccion_orden, estrellas, puntos) select %L, id, 1, 0, -5 from nivel limit 1', v_id), 'check');

  -- ---------------------------------------------------------------------------------------
  -- 5) PUNTUACION: intentos validos de 1 a 4 (10 / 7 / 4 / 1)
  -- ---------------------------------------------------------------------------------------
  perform pg_temp.anotar('5. Puntuacion', 'puntos_por_intento(1..4) = 10, 7, 4, 1',
    (select array[puntos_por_intento(1), puntos_por_intento(2), puntos_por_intento(3), puntos_por_intento(4)] = array[10,7,4,1]));
  perform pg_temp.debe_fallar('5. Puntuacion', 'puntos_por_intento(0)',  'select puntos_por_intento(0)', 'fuera de rango');
  perform pg_temp.debe_fallar('5. Puntuacion', 'puntos_por_intento(5)',  'select puntos_por_intento(5)', 'fuera de rango');
  perform pg_temp.debe_fallar('5. Puntuacion', 'puntos_por_intento(-1)', 'select puntos_por_intento(-1)', 'fuera de rango');
  perform pg_temp.debe_fallar('5. Puntuacion', 'registrar_leccion con intento 5',    v_jwt || ' select registrar_leccion(1, 1, 1, array[5])', 'fuera de rango');
  perform pg_temp.debe_fallar('5. Puntuacion', 'registrar_leccion con intento -1',   v_jwt || ' select registrar_leccion(1, 1, 1, array[-1])', 'fuera de rango');
  perform pg_temp.debe_fallar('5. Puntuacion', 'registrar_leccion con intento NULL', v_jwt || ' select registrar_leccion(1, 1, 1, array[null]::int[])', 'fuera de rango');
  perform pg_temp.debe_fallar('5. Puntuacion', 'registrar_leccion sin preguntas ({})', v_jwt || ' select registrar_leccion(1, 1, 1, array[]::int[])', 'intento por pregunta');
  perform pg_temp.debe_fallar('5. Puntuacion', 'registrar_leccion con un nivel que no existe (99)', v_jwt || ' select registrar_leccion(1, 99, 1, array[1])', 'no existe');
  perform pg_temp.debe_fallar('5. Puntuacion', 'registrar_leccion con una leccion que no existe (9)', v_jwt || ' select registrar_leccion(1, 1, 9, array[1])', 'no existe');

  -- ---------------------------------------------------------------------------------------
  -- 6) COMODINES POR UNIDAD: limite de 5 usos y comodines disponibles
  -- ---------------------------------------------------------------------------------------
  perform pg_temp.debe_fallar('6. Limite de comodines', 'El 6o comodin de la unidad 1 se rechaza',
    format('insert into uso_comodin_unidad (usuario_id, unidad_id, comodines_usados) select %L, id, limite_comodines from unidad where orden = 1 on conflict (usuario_id, unidad_id) do update set comodines_usados = excluded.comodines_usados; update inventario_comodin set cantidad = 10 where usuario_id = %L; ',
           v_id, v_id) || v_jwt || ' select usar_comodin(1)', 'LIMITE_COMODINES_UNIDAD');
  perform pg_temp.debe_fallar('6. Limite de comodines', 'Sin comodines disponibles no se puede usar uno',
    format('insert into uso_comodin_unidad (usuario_id, unidad_id, comodines_usados) select %L, id, 0 from unidad where orden = 1 on conflict (usuario_id, unidad_id) do update set comodines_usados = 0; update inventario_comodin set cantidad = 0 where usuario_id = %L; ',
           v_id, v_id) || v_jwt || ' select usar_comodin(1)', 'SIN_COMODINES');
  perform pg_temp.debe_fallar('6. Limite de comodines', 'usar_comodin en una unidad que no existe (99)', v_jwt || ' select usar_comodin(99)', 'no existe');

  -- ---------------------------------------------------------------------------------------
  -- 7) SEGURIDAD: lo que el NAVEGADOR (rol authenticated / anon) no debe poder hacer
  -- ---------------------------------------------------------------------------------------
  perform pg_temp.debe_fallar('7. Seguridad (navegador)', 'Cambiar su propio puntaje_total', format('update usuario set puntaje_total = puntaje_total where id = %L', v_id), 'permission denied', 'authenticated');
  perform pg_temp.debe_fallar('7. Seguridad (navegador)', 'Cambiar su propia racha',        format('update usuario set racha_actual = racha_actual where id = %L', v_id), 'permission denied', 'authenticated');
  perform pg_temp.debe_fallar('7. Seguridad (navegador)', 'Cambiar sus comodines',          format('update inventario_comodin set cantidad = cantidad where usuario_id = %L', v_id), 'permission denied', 'authenticated');
  perform pg_temp.debe_fallar('7. Seguridad (navegador)', 'Marcar un nivel como completado', format('insert into progreso (usuario_id, nivel_id, completado) select %L, id, true from nivel limit 1', v_id), 'permission denied', 'authenticated');
  perform pg_temp.debe_fallar('7. Seguridad (navegador)', 'Escribir progreso de lecciones', format('insert into progreso_leccion (usuario_id, nivel_id, leccion_orden, estrellas, puntos) select %L, id, 1, 3, 100000 from nivel limit 1', v_id), 'permission denied', 'authenticated');
  perform pg_temp.debe_fallar('7. Seguridad (navegador)', 'Reiniciar sus usos de comodin',  format('update uso_comodin_unidad set comodines_usados = 0 where usuario_id = %L', v_id), 'permission denied', 'authenticated');
  perform pg_temp.debe_fallar('7. Seguridad (navegador)', 'Crearse una fila de usuario con puntos', 'insert into usuario (id, puntaje_total) values (gen_random_uuid(), 99999)', 'permission denied', 'authenticated');
  perform pg_temp.debe_fallar('7. Seguridad (navegador)', 'Un visitante sin sesion no puede llamar registrar_leccion', 'select registrar_leccion(1, 1, 1, array[1])', 'permission denied', 'anon');
  perform pg_temp.debe_fallar('7. Seguridad (navegador)', 'Un visitante sin sesion no puede llamar usar_comodin', 'select usar_comodin(1)', 'permission denied', 'anon');
  perform pg_temp.debe_fallar('7. Seguridad (navegador)', 'Sin sesion, registrar_leccion pide iniciar sesion', 'select set_config(''request.jwt.claim.sub'', '''', true); select set_config(''request.jwt.claims'', '''', true); select registrar_leccion(1, 1, 1, array[1])', 'iniciar sesión');
  begin
    perform set_config('app.cambio_autorizado', '', true);
  end;
end
$prueba$;

-- ---------------------------------------------------------------------------------------
-- 8) VERIFICACION DE LA ESTRUCTURA (restricciones, RLS, permisos e ids automaticos)
-- ---------------------------------------------------------------------------------------
do $estructura$
declare r record; v_n int;
begin
  for r in select * from (values
      ('usuario','usuario_codigo_formato'), ('usuario','usuario_puntaje_no_negativo'), ('usuario','usuario_racha_actual_rango'),
      ('usuario','usuario_racha_maxima_rango'), ('usuario','usuario_racha_maxima_mayor'), ('inventario_comodin','inventario_cantidad_rango'),
      ('uso_comodin_unidad','uso_comodin_no_negativo'), ('unidad','unidad_numeros_no_negativos'), ('nivel','nivel_orden_no_negativo'),
      ('ejercicio','ejercicio_numeros_no_negativos'), ('progreso','progreso_intentos_no_negativo'), ('intento','intento_puntaje_no_negativo'),
      ('sesion_invitado','sesion_invitado_no_negativos'), ('evento','evento_minimos_no_negativos')) as t(tabla, restriccion)
  loop
    perform pg_temp.anotar('8. Estructura', format('Restriccion %s en %s existe', r.restriccion, r.tabla),
      exists (select 1 from pg_constraint where conrelid = format('public.%I', r.tabla)::regclass and conname = r.restriccion));
  end loop;
  for r in select unnest(array['usuario','progreso','progreso_leccion','inventario_comodin','uso_comodin_unidad','configuracion_usuario']) as tabla loop
    perform pg_temp.anotar('8. Estructura', format('RLS activado en %s', r.tabla), (select relrowsecurity from pg_class where oid = format('public.%I', r.tabla)::regclass));
  end loop;
  perform pg_temp.anotar('8. Estructura', 'Limite de comodines de la unidad 1 = 5', coalesce((select limite_comodines = 5 from unidad where orden = 1), false));
  perform pg_temp.anotar('8. Estructura', 'Existen los 7 niveles del mundo 1', (select count(*) = 7 from nivel n join unidad u on u.id = n.unidad_id where u.orden = 1));
  perform pg_temp.anotar('8. Estructura', 'El navegador no tiene permiso de escribir en usuario.puntaje_total', not has_column_privilege('authenticated', 'public.usuario', 'puntaje_total', 'UPDATE'));
  perform pg_temp.anotar('8. Estructura', 'El navegador no puede insertar en progreso, progreso_leccion ni inventario_comodin',
    not (has_table_privilege('authenticated', 'public.progreso', 'INSERT') or has_table_privilege('authenticated', 'public.progreso_leccion', 'INSERT') or has_table_privilege('authenticated', 'public.inventario_comodin', 'INSERT')));
  perform pg_temp.anotar('8. Estructura', 'Los visitantes (anon) no pueden ejecutar registrar_leccion ni usar_comodin',
    not (has_function_privilege('anon', 'public.registrar_leccion(int,int,int,int[])', 'EXECUTE') or has_function_privilege('anon', 'public.usar_comodin(int)', 'EXECUTE')));
  select count(*) into v_n from information_schema.columns c join information_schema.tables t on t.table_name = c.table_name and t.table_schema = c.table_schema
    where c.table_schema = 'public' and t.table_type = 'BASE TABLE' and c.column_name = 'id' and c.column_default is null and c.table_name not in ('usuario');
  perform pg_temp.anotar('8. Estructura', 'Todos los id se generan solos (la unica excepcion es usuario.id, que viene de Authentication)', v_n = 0,
    case when v_n = 0 then null else v_n || ' tabla(s) con id sin valor automatico' end);
end $estructura$;

-- ---------------------------------------------------------------------------------------
-- RESULTADO (la ultima fila resume todo)
-- ---------------------------------------------------------------------------------------
select grupo, prueba, resultado, detalle from (
  select orden, grupo, prueba, resultado, detalle from pg_temp.resultados
  union all
  select 99999, 'RESUMEN',
         format('%s pruebas: %s OK, %s FALLA, %s REVISAR, %s OMITIDA', count(*), count(*) filter (where resultado = 'OK'), count(*) filter (where resultado = 'FALLA'),
                count(*) filter (where resultado = 'REVISAR'), count(*) filter (where resultado = 'OMITIDA')),
         case when count(*) filter (where resultado in ('FALLA','REVISAR')) = 0 then 'TODO CORRECTO' else 'HAY COSAS QUE CORREGIR' end,
         null
  from pg_temp.resultados
) x order by orden;
