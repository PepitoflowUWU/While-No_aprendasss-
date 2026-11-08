-- =========================================================================================
-- while(no_aprendas) - MIGRACION 11
-- Validaciones, progreso persistente, puntuacion por intento sin duplicados y limite de comodines por unidad.
--
-- Se ejecuta UNA vez, completa, en el SQL Editor (es "todo o nada": si algo falla no se cambia nada, y se puede
-- repetir sin romper nada). Requiere haber ejecutado antes 01 a 10 (en especial 05 y 09/09a si usas el nivel 2).
-- No borra filas ni puntos existentes. Corrige solo valores fuera de rango (por ejemplo negativos).
--
-- QUE HACE
--  1. Codigo de estudiante estricto: U + 8 digitos, en mayuscula (CHECK + trigger; ya no se convierte a mayuscula).
--  2. Rachas 0..999 (racha_maxima >= racha_actual), comodines disponibles 0..10, y numeros >= 0 en el resto de campos.
--  3. progreso_leccion: progreso de cada leccion por estudiante (nuevo; el modelo no tenia donde guardarlo).
--     progreso (ya existente) sigue guardando el estado de cada NIVEL; ahora para los 7 niveles, no solo el 1.
--  4. registrar_leccion(): unica via para dar puntos (10 / 7 / 4 / 1 segun el intento), una sola vez por leccion,
--     de forma atomica, y de paso completa el nivel, la racha y el comodin de recompensa.
--  5. usar_comodin(): descuenta un comodin disponible y cuenta el uso por estudiante y unidad (limite en unidad.limite_comodines).
--  6. Seguridad: el navegador ya NO puede escribir puntos, rachas, comodines, progreso ni usos (solo leer los suyos).
-- =========================================================================================
begin;

-- ---------------------------------------------------------------------------------------
-- 0) Corregir datos fuera de rango antes de imponer las restricciones (no se borra ninguna fila)
-- ---------------------------------------------------------------------------------------
update usuario set puntaje_total = 0 where puntaje_total < 0;
update usuario set racha_actual = least(greatest(racha_actual, 0), 999),
                   racha_maxima = least(greatest(racha_maxima, 0), 999);
update usuario set racha_maxima = racha_actual where racha_maxima < racha_actual;
update inventario_comodin set cantidad = least(greatest(cantidad, 0), 10);
update uso_comodin_unidad set comodines_usados = 0 where comodines_usados < 0;
update progreso set intentos_totales = 0 where intentos_totales < 0;
update intento set puntaje_obtenido = 0 where puntaje_obtenido < 0;
update ejercicio set puntos_base = 0 where puntos_base < 0;
update unidad set limite_comodines = 0 where limite_comodines < 0;
update sesion_invitado set tokens_disponibles = 0 where tokens_disponibles < 0;
update sesion_invitado set limite_niveles = 0 where limite_niveles < 0;

-- ---------------------------------------------------------------------------------------
-- 1) Restricciones CHECK (las rechaza PostgreSQL aunque se escriba directo por la API)
-- ---------------------------------------------------------------------------------------
-- 1.1 Codigo de estudiante: U + 8 digitos (9 caracteres, sin minusculas, espacios ni simbolos). NULL se permite
--     para cuentas que no son de estudiante. NOT VALID: se aplica a todo insert/update nuevo sin frenar la migracion
--     por filas antiguas; abajo se intenta validar tambien las existentes.
alter table usuario drop constraint if exists usuario_codigo_formato;
alter table usuario add constraint usuario_codigo_formato
  check (codigo_estudiante is null or (length(codigo_estudiante) = 9 and codigo_estudiante ~ '^U[0-9]{8}$')) not valid;
do $v$ begin
  alter table usuario validate constraint usuario_codigo_formato;
exception when check_violation then
  raise notice 'Hay usuarios con un codigo de formato antiguo; la regla ya rige para todo lo nuevo. Para verlos: select id, codigo_estudiante from usuario where codigo_estudiante !~ ''^U[0-9]{8}$'';';
end $v$;

-- 1.2 Puntos, rachas y comodines
alter table usuario drop constraint if exists usuario_puntaje_no_negativo;
alter table usuario add constraint usuario_puntaje_no_negativo check (puntaje_total >= 0);
alter table usuario drop constraint if exists usuario_racha_actual_rango;
alter table usuario add constraint usuario_racha_actual_rango check (racha_actual between 0 and 999);
alter table usuario drop constraint if exists usuario_racha_maxima_rango;
alter table usuario add constraint usuario_racha_maxima_rango check (racha_maxima between 0 and 999);
alter table usuario drop constraint if exists usuario_racha_maxima_mayor;
alter table usuario add constraint usuario_racha_maxima_mayor check (racha_maxima >= racha_actual);

alter table inventario_comodin drop constraint if exists inventario_cantidad_rango;
alter table inventario_comodin add constraint inventario_cantidad_rango check (cantidad between 0 and 10);

-- 1.3 Resto de campos numericos: nunca negativos (los tipos int ya impiden decimales y texto)
alter table uso_comodin_unidad drop constraint if exists uso_comodin_no_negativo;
alter table uso_comodin_unidad add constraint uso_comodin_no_negativo check (comodines_usados >= 0);
alter table unidad drop constraint if exists unidad_numeros_no_negativos;
alter table unidad add constraint unidad_numeros_no_negativos check (limite_comodines >= 0 and orden >= 0);
alter table nivel drop constraint if exists nivel_orden_no_negativo;
alter table nivel add constraint nivel_orden_no_negativo check (orden >= 0);
alter table ejercicio drop constraint if exists ejercicio_numeros_no_negativos;
alter table ejercicio add constraint ejercicio_numeros_no_negativos check (puntos_base >= 0 and orden >= 0);
alter table progreso drop constraint if exists progreso_intentos_no_negativo;
alter table progreso add constraint progreso_intentos_no_negativo check (intentos_totales >= 0);
alter table intento drop constraint if exists intento_puntaje_no_negativo;
alter table intento add constraint intento_puntaje_no_negativo check (puntaje_obtenido >= 0);
alter table sesion_invitado drop constraint if exists sesion_invitado_no_negativos;
alter table sesion_invitado add constraint sesion_invitado_no_negativos check (tokens_disponibles >= 0 and limite_niveles >= 0);
alter table evento drop constraint if exists evento_minimos_no_negativos;
alter table evento add constraint evento_minimos_no_negativos check ((nivel_minimo is null or nivel_minimo >= 0) and (puntaje_minimo is null or puntaje_minimo >= 0));

-- ---------------------------------------------------------------------------------------
-- 2) Estructura: lecciones requeridas por nivel, los 7 niveles del mundo 1 y progreso por leccion
-- ---------------------------------------------------------------------------------------
alter table nivel add column if not exists lecciones_requeridas smallint not null default 5
  check (lecciones_requeridas between 1 and 50);           -- cuantas lecciones hay que completar para completar el nivel

-- Limite de comodines por unidad: la primera unidad permite 5 usos en total (otras unidades pueden tener otro valor)
update unidad set limite_comodines = 5 where orden = 1;

-- Niveles 3 a 7 del mundo 1 (el 1 y el 2 ya los crean 02 y 09). Solo se crean si faltan.
insert into nivel (unidad_id, nombre, dificultad, orden, lecciones_requeridas)
select (select id from unidad where orden = 1 order by id limit 1), v.nombre, v.dificultad::dificultad_nivel, v.orden, 5
from (values
  ('Nivel 3: Operadores',      'medio',   3),
  ('Nivel 4: Condicionales',   'medio',   4),
  ('Nivel 5: Bucle MIENTRAS',  'medio',   5),
  ('Nivel 6: Bucle PARA',      'dificil', 6),
  ('Nivel 7: Subalgoritmos',   'dificil', 7)
) as v(nombre, dificultad, orden)
where exists (select 1 from unidad where orden = 1)
  and not exists (select 1 from nivel n join unidad u on u.id = n.unidad_id where u.orden = 1 and n.orden = v.orden);

-- Progreso por leccion. Una fila por (estudiante, nivel, leccion): la clave unica impide registros duplicados.
create table if not exists progreso_leccion (
  id               uuid primary key default gen_random_uuid(),
  usuario_id       uuid not null references usuario(id) on delete cascade,
  nivel_id         uuid not null references nivel(id) on delete cascade,
  leccion_orden    smallint not null check (leccion_orden between 1 and 50),
  estrellas        smallint not null check (estrellas between 1 and 3),
  puntos           int not null default 0 check (puntos >= 0),
  intentos_totales int not null default 0 check (intentos_totales >= 0),
  fecha_completado timestamptz not null default now(),
  unique (usuario_id, nivel_id, leccion_orden)
);

-- Lo que ya estaba completo antes de esta migracion no debe volver a dar puntos: se registra como lecciones hechas (0 puntos,
-- porque esos puntos ya estan en usuario.puntaje_total).
insert into progreso_leccion (usuario_id, nivel_id, leccion_orden, estrellas, puntos)
select p.usuario_id, p.nivel_id, g, 1, 0
from progreso p
join nivel n on n.id = p.nivel_id
cross join lateral generate_series(1, n.lecciones_requeridas) as g
where p.completado and p.usuario_id is not null
on conflict (usuario_id, nivel_id, leccion_orden) do nothing;

-- ---------------------------------------------------------------------------------------
-- 3) Validador de usuario: el codigo ya NO se convierte a mayuscula (u12345678 se rechaza)
-- ---------------------------------------------------------------------------------------
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
            OLD.nombre_usuario, OLD.fecha_registro)
           is distinct from
           (NEW.personaje_id, NEW.rol_id, NEW.correo_institucional, NEW.codigo_estudiante,
            NEW.nombre_usuario, NEW.fecha_registro)
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

drop trigger if exists trg_usuario_validar on usuario;
create trigger trg_usuario_validar
before insert or update on usuario
for each row execute function validar_y_preparar_usuario();

-- ---------------------------------------------------------------------------------------
-- 4) Funciones del juego (la unica via para cambiar puntos, rachas, comodines y progreso)
-- ---------------------------------------------------------------------------------------
-- Comodin que cuenta como "comodin disponible" del jugador (el juego maneja un solo contador).
create or replace function comodin_base()
returns uuid language sql stable security definer set search_path = public as $$
  select id from comodin order by (nombre = 'Pista rápida') desc, id limit 1;
$$;

-- Puntos segun el intento en que se respondio bien: 1 -> 10, 2 -> 7, 3 -> 4, 4 -> 1. Fuera de 1..4 es un error.
create or replace function puntos_por_intento(p_intento int)
returns int language plpgsql immutable as $$
begin
  if p_intento is null or p_intento < 1 or p_intento > 4 then
    raise exception 'Intento fuera de rango: debe estar entre 1 y 4 (recibido %).', p_intento using errcode = '22023';
  end if;
  return case p_intento when 1 then 10 when 2 then 7 when 3 then 4 else 1 end;
end $$;

-- Valida que quien llama sea un estudiante con sesion. Devuelve su id.
create or replace function exigir_estudiante()
returns uuid language plpgsql stable security definer set search_path = public as $$
declare v_uid uuid := auth.uid();
begin
  if v_uid is null then raise exception 'Necesitas iniciar sesión.' using errcode = '42501'; end if;
  if not exists (select 1 from usuario u join rol r on r.id = u.rol_id where u.id = v_uid and r.nombre = 'estudiante') then
    raise exception 'Solo los estudiantes tienen progreso.' using errcode = '42501';
  end if;
  return v_uid;
end $$;

-- Racha vigente: si paso un dia completo sin completar ningun nivel, la racha actual vuelve a 0 (la maxima no se toca).
create or replace function sincronizar_racha()
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_uid uuid := exigir_estudiante();
  v_hoy date := (now() at time zone 'America/Lima')::date;
  v_ult date;
  v_actual int;
begin
  select (ultima_actividad at time zone 'America/Lima')::date, racha_actual into v_ult, v_actual
  from usuario where id = v_uid for update;
  if v_actual > 0 and (v_ult is null or v_ult < v_hoy - 1) then
    update usuario set racha_actual = 0 where id = v_uid;
  end if;
  return (select jsonb_build_object('racha', racha_actual, 'racha_max', racha_maxima) from usuario where id = v_uid);
end $$;

-- Crea las filas que todo jugador necesita (configuracion y 3 comodines) si faltan. Seguro de repetir.
create or replace function asegurar_datos_iniciales()
returns void language plpgsql security definer set search_path = public as $$
declare v_uid uuid := exigir_estudiante(); v_com uuid := comodin_base();
begin
  insert into configuracion_usuario (usuario_id) values (v_uid) on conflict (usuario_id) do nothing;
  if v_com is not null then
    insert into inventario_comodin (usuario_id, comodin_id, cantidad) values (v_uid, v_com, 3)
    on conflict (usuario_id, comodin_id) do nothing;
  end if;
end $$;

-- Registra una leccion terminada. p_intentos tiene UN numero por pregunta: el intento (1 a 4) en que respondio bien,
-- o 0 si agoto los 4 intentos sin acertar. Devuelve un resumen con lo que realmente se otorgo.
--  * Los puntos se dan SOLO la primera vez que se completa la leccion (la clave unica lo garantiza aunque lleguen
--    dos solicitudes a la vez). Repetirla puede mejorar las estrellas, nunca los puntos.
--  * Al completarse la ultima leccion del nivel se marca el nivel como completado y, solo esa primera vez,
--    se da +1 comodin (maximo 10) y se actualiza la racha. Todo en la misma transaccion.
create or replace function registrar_leccion(
  p_unidad_orden int, p_nivel_orden int, p_leccion_orden int, p_intentos int[]
) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_uid uuid := exigir_estudiante();
  v_nivel uuid; v_req int;
  v_n int; v_puntos int := 0; v_errores int := 0; v_estrellas int; v_total_intentos int := 0;
  v_nueva boolean; v_otorgados int := 0;
  v_hechas int; v_nivel_nuevo boolean := false;
  v_com uuid := comodin_base();
  v_hoy date := (now() at time zone 'America/Lima')::date;
  v_ult date; v_racha int; v_racha_max int;
begin
  select n.id, n.lecciones_requeridas into v_nivel, v_req
  from nivel n join unidad u on u.id = n.unidad_id
  where u.orden = p_unidad_orden and n.orden = p_nivel_orden;
  if v_nivel is null then raise exception 'El nivel % de la unidad % no existe.', p_nivel_orden, p_unidad_orden using errcode = '22023'; end if;
  -- Serializa las solicitudes del mismo jugador sobre el mismo nivel: dos lecciones terminadas a la vez no pueden
  -- "no verse" entre si al contar si el nivel quedo completo, ni dar dos veces la recompensa del nivel.
  perform pg_advisory_xact_lock(hashtext(v_uid::text || ':' || v_nivel::text));
  if p_leccion_orden is null or p_leccion_orden < 1 or p_leccion_orden > v_req then
    raise exception 'La leccion % no existe en ese nivel (1 a %).', p_leccion_orden, v_req using errcode = '22023';
  end if;
  if p_intentos is null or cardinality(p_intentos) < 1 or cardinality(p_intentos) > 30 then
    raise exception 'Se esperaba un intento por pregunta (entre 1 y 30 preguntas).' using errcode = '22023';
  end if;

  foreach v_n in array p_intentos loop
    if v_n is null or v_n < 0 or v_n > 4 then
      raise exception 'Intento fuera de rango: debe ser 0 (sin acertar) o de 1 a 4 (recibido %).', v_n using errcode = '22023';
    end if;
    if v_n = 0 then
      v_errores := v_errores + 4; v_total_intentos := v_total_intentos + 4;
    else
      v_puntos := v_puntos + puntos_por_intento(v_n);          -- 10 / 7 / 4 / 1
      v_errores := v_errores + (v_n - 1); v_total_intentos := v_total_intentos + v_n;
    end if;
  end loop;
  v_estrellas := case when v_errores = 0 then 3 when v_errores <= 2 then 2 else 1 end;

  -- Atomico: solo UNA solicitud puede insertar la fila (primera vez) y dar los puntos
  insert into progreso_leccion (usuario_id, nivel_id, leccion_orden, estrellas, puntos, intentos_totales)
  values (v_uid, v_nivel, p_leccion_orden, v_estrellas, v_puntos, v_total_intentos)
  on conflict (usuario_id, nivel_id, leccion_orden) do nothing
  returning true into v_nueva;

  if v_nueva then
    update usuario set puntaje_total = puntaje_total + v_puntos where id = v_uid;
    v_otorgados := v_puntos;
  else
    update progreso_leccion set estrellas = greatest(estrellas, v_estrellas)       -- repetir solo puede mejorar la calificacion
    where usuario_id = v_uid and nivel_id = v_nivel and leccion_orden = p_leccion_orden;
  end if;

  -- Nivel completado: todas sus lecciones hechas. La recompensa se da solo si el nivel no estaba completado.
  select count(*) into v_hechas from progreso_leccion where usuario_id = v_uid and nivel_id = v_nivel;
  if v_hechas >= v_req then
    insert into progreso (usuario_id, nivel_id, completado, intentos_totales, fecha_completado)
    values (v_uid, v_nivel, true,
            (select coalesce(sum(intentos_totales), 0) from progreso_leccion where usuario_id = v_uid and nivel_id = v_nivel), now())
    on conflict (usuario_id, nivel_id) do update set completado = true, fecha_completado = now()
      where progreso.completado = false
    returning true into v_nivel_nuevo;
  end if;

  if v_nivel_nuevo then
    if v_com is not null then                                  -- +1 comodin disponible, tope 10
      insert into inventario_comodin (usuario_id, comodin_id, cantidad) values (v_uid, v_com, 1)
      on conflict (usuario_id, comodin_id) do update set cantidad = least(inventario_comodin.cantidad + 1, 10);
    end if;
    select (ultima_actividad at time zone 'America/Lima')::date, racha_actual, racha_maxima into v_ult, v_racha, v_racha_max
    from usuario where id = v_uid for update;
    if v_ult is not distinct from v_hoy then v_racha := greatest(v_racha, 1);          -- ya conto hoy
    elsif v_ult = v_hoy - 1 then v_racha := least(v_racha + 1, 999);
    else v_racha := 1;
    end if;
    update usuario set racha_actual = v_racha, racha_maxima = least(999, greatest(racha_maxima, v_racha)),
                       ultima_actividad = now()
    where id = v_uid;
  end if;

  return (
    select jsonb_build_object(
      'puntos_otorgados', v_otorgados, 'leccion_nueva', coalesce(v_nueva, false), 'nivel_completado_ahora', coalesce(v_nivel_nuevo, false),
      'estrellas', (select estrellas from progreso_leccion where usuario_id = v_uid and nivel_id = v_nivel and leccion_orden = p_leccion_orden),
      'puntos', u.puntaje_total, 'racha', u.racha_actual, 'racha_max', u.racha_maxima,
      'comodines', coalesce((select cantidad from inventario_comodin where usuario_id = v_uid and comodin_id = v_com), 0))
    from usuario u where u.id = v_uid);
end $$;

-- Usa un comodin: descuenta 1 de los disponibles Y suma 1 al uso de la unidad. Rechaza si no quedan disponibles o si la
-- unidad ya llego a su limite (5 en la primera). Los bloqueos de fila evitan que solicitudes simultaneas pasen el limite.
create or replace function usar_comodin(p_unidad_orden int)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_uid uuid := exigir_estudiante();
  v_unidad uuid; v_limite int; v_usados int; v_disp int;
  v_com uuid := comodin_base();
begin
  select id, limite_comodines into v_unidad, v_limite from unidad where orden = p_unidad_orden;
  if v_unidad is null then raise exception 'La unidad % no existe.', p_unidad_orden using errcode = '22023'; end if;

  insert into uso_comodin_unidad (usuario_id, unidad_id) values (v_uid, v_unidad) on conflict (usuario_id, unidad_id) do nothing;
  select comodines_usados into v_usados from uso_comodin_unidad where usuario_id = v_uid and unidad_id = v_unidad for update;
  if v_usados >= v_limite then
    raise exception 'LIMITE_COMODINES_UNIDAD: ya usaste los % comodines de esta unidad.', v_limite using errcode = 'P0001';
  end if;

  select cantidad into v_disp from inventario_comodin where usuario_id = v_uid and comodin_id = v_com for update;
  if v_disp is null or v_disp <= 0 then
    raise exception 'SIN_COMODINES: no tienes comodines disponibles.' using errcode = 'P0001';
  end if;

  update inventario_comodin set cantidad = cantidad - 1 where usuario_id = v_uid and comodin_id = v_com;
  update uso_comodin_unidad set comodines_usados = comodines_usados + 1 where usuario_id = v_uid and unidad_id = v_unidad;
  return jsonb_build_object('disponibles', v_disp - 1, 'usados', v_usados + 1, 'limite', v_limite);
end $$;

-- Todo el progreso del jugador en una sola consulta (respeta RLS: solo ve lo suyo).
create or replace function estado_jugador()
returns jsonb language sql stable security invoker set search_path = public as $$
  select jsonb_build_object(
    'puntos', u.puntaje_total, 'racha', u.racha_actual, 'racha_max', u.racha_maxima, 'ultima_actividad', u.ultima_actividad,
    'comodines', coalesce((select i.cantidad from inventario_comodin i where i.usuario_id = u.id and i.comodin_id = comodin_base()), 0),
    'lecciones', coalesce((select jsonb_agg(jsonb_build_object('unidad', un.orden, 'nivel', n.orden, 'leccion', pl.leccion_orden, 'estrellas', pl.estrellas))
                           from progreso_leccion pl join nivel n on n.id = pl.nivel_id join unidad un on un.id = n.unidad_id
                           where pl.usuario_id = u.id), '[]'::jsonb),
    'niveles', coalesce((select jsonb_agg(jsonb_build_object('unidad', un.orden, 'nivel', n.orden, 'completado', p.completado))
                         from progreso p join nivel n on n.id = p.nivel_id join unidad un on un.id = n.unidad_id
                         where p.usuario_id = u.id), '[]'::jsonb),
    'comodines_unidad', coalesce((select jsonb_agg(jsonb_build_object('unidad', un.orden, 'usados', coalesce(uc.comodines_usados, 0), 'limite', un.limite_comodines))
                                  from unidad un left join uso_comodin_unidad uc on uc.unidad_id = un.id and uc.usuario_id = u.id), '[]'::jsonb))
  from usuario u where u.id = auth.uid();
$$;

-- Registro: el codigo ya no se convierte a mayuscula (u12345678 se rechaza). Mismo contrato que antes.
create or replace function completar_registro(
  p_codigo text, p_personaje_id uuid, p_musica boolean default true, p_animaciones boolean default true
) returns void
language plpgsql security definer set search_path = public as $$
declare
  v_uid uuid := auth.uid();
  v_cod text := p_codigo;
  v_rol uuid; v_com uuid; v_hash text;
begin
  if v_uid is null then raise exception 'Sin sesion: primero hay que crear la cuenta.' using errcode = '42501'; end if;
  if v_cod is null or v_cod !~ '^U[0-9]{8}$' then
    raise exception 'El código debe ser U seguida de 8 números (ejemplo: U12345678).' using errcode = '23514';
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
                                  puntaje_total, racha_actual, racha_maxima, contrasena_hash)
             values ($1, $2, $3, $4, $5, $6, 0, 0, 0, $7)'
      using v_uid, p_personaje_id, v_rol, v_cod || '@utp.edu.pe', v_cod, 'Jugador' || right(v_cod, 4), v_hash;
  else
    insert into usuario (id, personaje_id, rol_id, correo_institucional, codigo_estudiante, nombre_usuario,
                         puntaje_total, racha_actual, racha_maxima)
    values (v_uid, p_personaje_id, v_rol, v_cod || '@utp.edu.pe', v_cod, 'Jugador' || right(v_cod, 4), 0, 0, 0);
  end if;

  insert into configuracion_usuario (usuario_id, sonido_activado, musica_activada, animaciones_activadas)
  values (v_uid, true, coalesce(p_musica, true), coalesce(p_animaciones, true)) on conflict (usuario_id) do nothing;
  insert into inventario_comodin (usuario_id, comodin_id, cantidad) values (v_uid, v_com, 3)
  on conflict (usuario_id, comodin_id) do nothing;
end $$;

-- Permisos de ejecucion: solo jugadores con sesion
revoke all on function comodin_base(), puntos_por_intento(int), exigir_estudiante(), sincronizar_racha(), asegurar_datos_iniciales(),
  registrar_leccion(int, int, int, int[]), usar_comodin(int), estado_jugador(), completar_registro(text, uuid, boolean, boolean)
  from public, anon;
grant execute on function sincronizar_racha(), asegurar_datos_iniciales(), registrar_leccion(int, int, int, int[]),
  usar_comodin(int), estado_jugador(), completar_registro(text, uuid, boolean, boolean) to authenticated;
-- (comodin_base, puntos_por_intento y exigir_estudiante son auxiliares: solo las usan las funciones de arriba)
grant execute on function comodin_base() to authenticated;   -- estado_jugador (security invoker) la necesita

-- ---------------------------------------------------------------------------------------
-- 5) Seguridad (RLS y permisos): el navegador solo LEE lo suyo; todo cambio pasa por las funciones
-- ---------------------------------------------------------------------------------------
alter table progreso_leccion enable row level security;
alter table uso_comodin_unidad enable row level security;
alter table progreso enable row level security;
alter table inventario_comodin enable row level security;

drop policy if exists "leer lo propio" on progreso_leccion;
create policy "leer lo propio" on progreso_leccion for select to authenticated using (usuario_id = auth.uid());
drop policy if exists "leer lo propio" on uso_comodin_unidad;
create policy "leer lo propio" on uso_comodin_unidad for select to authenticated using (usuario_id = auth.uid());

-- progreso e inventario_comodin: antes el jugador podia escribirlos desde el navegador. Ahora solo leer los suyos.
drop policy if exists "filas propias" on progreso;
drop policy if exists "leer lo propio" on progreso;
create policy "leer lo propio" on progreso for select to authenticated using (usuario_id = auth.uid());
drop policy if exists "filas propias" on inventario_comodin;
drop policy if exists "leer lo propio" on inventario_comodin;
create policy "leer lo propio" on inventario_comodin for select to authenticated using (usuario_id = auth.uid());

revoke insert, update, delete on progreso_leccion, uso_comodin_unidad, progreso, inventario_comodin from anon, authenticated;
revoke all on progreso_leccion, uso_comodin_unidad from anon;

-- usuario: el jugador no puede crearse la fila ni cambiarse puntos, rachas o comodines. Solo actualiza su ultima conexion.
drop policy if exists "usuario crea su fila" on usuario;
revoke insert on usuario from anon, authenticated;
revoke update on usuario from anon, authenticated;
grant update (ultima_conexion) on usuario to authenticated;

commit;

-- Comprobacion rapida (opcional):
--   select conname, pg_get_constraintdef(oid) from pg_constraint where conrelid = 'usuario'::regclass and contype = 'c';
--   select orden, nombre, lecciones_requeridas from nivel order by orden;
--   select nombre, orden, limite_comodines from unidad;
