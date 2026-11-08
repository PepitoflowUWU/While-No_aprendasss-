-- =========================================================================================
-- while(no_aprendas) - UNIFICAR NOMBRE DE USUARIO Y NOMBRE DEL RANKING (una sola columna)
-- Antes: usuario.nombre_usuario (Jugador1896) y usuario.alias_ranking (CapiCoder_101).
-- Ahora: solo nombre_usuario, que es el que aparece en el juego y en el ranking. Se borra alias_ranking.
-- NO REPETIR si ya ejecutaste 11_progreso_puntos_comodines.sql: este archivo trae el validador anterior (que convertia a mayuscula).
-- Ejecutar UNA vez, completo (puede tardar unos segundos). Reemplaza a 04 y 05 para una base que ya los tenia.
-- Para una base nueva, 04 y 05 ya vienen actualizados y no hace falta este archivo.
-- =========================================================================================

-- 1) Quitar lo que depende de alias_ranking (se vuelve a crear mas abajo) -------------------------------
drop trigger if exists trg_usuario_ranking on usuario;
drop function if exists sincronizar_ranking();
do $q$
declare v char;
begin
  select c.relkind into v from pg_class c join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public' and c.relname = 'ranking_publico';
  if v = 'v' then drop view public.ranking_publico;
  elsif v = 'r' then drop table public.ranking_publico;
  end if;
end $q$;
drop function if exists completar_registro(text, uuid, text, boolean);

-- 2) Validador de usuario sin alias (crea o reemplaza; tambien deja activo el trigger) ---------------------
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

  -- Cambios en datos de un jugador: exigen el codigo de autorizacion (puntos y rachas quedan libres)
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
    NEW.codigo_estudiante := upper(btrim(NEW.codigo_estudiante));

    if NEW.codigo_estudiante is null or NEW.codigo_estudiante !~ '^U[0-9]{8}$' then
      raise exception 'El código de estudiante debe empezar con U y tener 9 caracteres (U + 8 números).'
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

-- Si usabas la funcion actualizar_usuario (codigo UTP2026), se vuelve a crear sin el alias
do $mig$
begin
  if to_regprocedure('public.actualizar_usuario(text,uuid,jsonb)') is not null then
    execute $f$
      create or replace function actualizar_usuario(p_codigo text, p_usuario_id uuid, p_cambios jsonb)
      returns usuario language plpgsql security definer set search_path = public, extensions as $body$
      declare v_hash text; v_actual usuario; v_nuevo usuario; v_resultado usuario;
      begin
        select valor into v_hash from config_sistema where clave = 'codigo_cambio_hash';
        if p_codigo is null or v_hash is null or crypt(p_codigo, v_hash) <> v_hash then
          raise exception 'Código de autorización inválido.' using errcode = '42501';
        end if;
        select * into v_actual from usuario where id = p_usuario_id;
        if not found then raise exception 'Usuario no encontrado.'; end if;
        v_nuevo := jsonb_populate_record(v_actual, p_cambios);
        perform set_config('app.cambio_autorizado', 'true', true);
        update usuario set personaje_id = v_nuevo.personaje_id, correo_institucional = v_nuevo.correo_institucional,
               codigo_estudiante = v_nuevo.codigo_estudiante
        where id = p_usuario_id returning * into v_resultado;
        return v_resultado;
      end $body$
    $f$;
  end if;
end $mig$;

-- 3) BORRAR la columna alias_ranking (el nombre de usuario ya cumple ese papel) -----------------------------
-- Es definitivo: se pierden los alias antiguos (por ejemplo CapiCoder_101). Los nombres de usuario no se tocan.
alter table usuario drop column if exists alias_ranking;

-- 4) Ranking publico (tabla de solo lectura, con ficha del jugador) -------------------------------------------
alter table usuario add column if not exists ultima_conexion timestamptz not null default now();

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

-- 5) Registro en un paso, sin alias ---------------------------------------------------------------------------

-- 1) Datos base ----------------------------------------------------------------------------
insert into rol (nombre, descripcion) values
  ('estudiante',    'Puede jugar, resolver ejercicios y ver su propio progreso.'),
  ('docente',       'Puede consultar el rendimiento de los estudiantes del curso.'),
  ('administrador', 'Puede crear y mantener el contenido del curso.')
on conflict (nombre) do nothing;

insert into comodin (nombre, descripcion, tipo_aplicacion)
select v.nombre, v.descripcion, v.tipo
from (values
  ('Pista rápida',            'Da una pista breve sobre el ejercicio.',       'universal'),
  ('Eliminar opción',         'Elimina una alternativa incorrecta.',          'teoria'),
  ('Revisar código',          'Señala la línea con el posible error.',        'codigo'),
  ('Explicación paso a paso', 'Explica el error con más detalle.',            'codigo'),
  ('Segunda oportunidad',     'Permite reintentar sin descontar puntaje.',    'universal')
) as v(nombre, descripcion, tipo)
where not exists (select 1 from comodin c where c.nombre = v.nombre);

-- 2) Registro en un solo paso ---------------------------------------------------------------
-- Se llama justo despues de crear la cuenta en Authentication (ya hay sesion: auth.uid()).
-- El nombre de usuario (Jugador####, .2, .3) lo asigna el trigger de la tabla usuario y es TAMBIEN el nombre del ranking.
create or replace function completar_registro(
  p_codigo text, p_personaje_id uuid, p_musica boolean default true
) returns void
language plpgsql security definer set search_path = public as $$
declare
  v_uid uuid := auth.uid();
  v_cod text := upper(btrim(p_codigo));
  v_rol uuid;
  v_com uuid;
  v_hash text;
begin
  if v_uid is null then
    raise exception 'Sin sesion: primero hay que crear la cuenta.' using errcode = '42501';
  end if;
  if v_cod !~ '^U[0-9]{8}$' then
    raise exception 'El codigo debe ser U + 8 numeros.' using errcode = '23514';
  end if;

  select id into v_rol from rol where nombre = 'estudiante';
  if v_rol is null then
    insert into rol (nombre, descripcion) values ('estudiante', 'Puede jugar, resolver ejercicios y ver su propio progreso.') returning id into v_rol;
  end if;

  select id into v_com from comodin where nombre = 'Pista rápida' limit 1;
  if v_com is null then select id into v_com from comodin order by id limit 1; end if;
  if v_com is null then
    insert into comodin (nombre, descripcion, tipo_aplicacion) values ('Pista rápida', 'Da una pista breve sobre el ejercicio.', 'universal') returning id into v_com;
  end if;

  -- Algunas bases tienen la columna usuario.contrasena_hash (obligatoria). La contrasena real la guarda Supabase Auth:
  -- aqui solo se copia el HASH ya cifrado de auth.users, sin que la contrasena pase por esta funcion.
  select encrypted_password into v_hash from auth.users where id = v_uid;

  if exists (select 1 from information_schema.columns
             where table_schema = 'public' and table_name = 'usuario' and column_name = 'contrasena_hash') then
    execute 'insert into usuario (id, personaje_id, rol_id, correo_institucional, codigo_estudiante, nombre_usuario,
                                  puntaje_total, racha_actual, racha_maxima, contrasena_hash)
             values ($1, $2, $3, $4, $5, $6, 0, 0, 0, $7)'
      using v_uid, p_personaje_id, v_rol, v_cod || '@utp.edu.pe', v_cod, 'Jugador' || right(v_cod, 4), v_hash;
  else
    insert into usuario (id, personaje_id, rol_id, correo_institucional, codigo_estudiante, nombre_usuario,
                         puntaje_total, racha_actual, racha_maxima)
    values (v_uid, p_personaje_id, v_rol, v_cod || '@utp.edu.pe', v_cod, 'Jugador' || right(v_cod, 4),
            0, 0, 0);
  end if;

  insert into configuracion_usuario (usuario_id, sonido_activado, musica_activada)
  values (v_uid, true, coalesce(p_musica, true)) on conflict (usuario_id) do nothing;

  insert into inventario_comodin (usuario_id, comodin_id, cantidad)
  values (v_uid, v_com, 3) on conflict (usuario_id, comodin_id) do nothing;
end $$;

revoke all on function completar_registro(text, uuid, boolean) from public, anon;
grant execute on function completar_registro(text, uuid, boolean) to authenticated;
