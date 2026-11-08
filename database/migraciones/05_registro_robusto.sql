-- =========================================================================================
-- while(no_aprendas) - REGISTRO ROBUSTO (ejecutar en el SQL Editor; se puede repetir sin romper nada)
-- 1) Crea los datos base que el registro necesita si faltan (roles y comodines).
-- 2) Crea la funcion completar_registro(): guarda usuario + configuracion + 3 comodines en UN solo paso.
-- =========================================================================================

-- 0) Ajuste nuevo: preferencia de animaciones y efectos (junto a musica y sonido) ------------------------------------
alter table configuracion_usuario add column if not exists animaciones_activadas boolean not null default true;

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

-- Versiones anteriores de la funcion (otra lista de parametros): se quitan para que no haya dos con el mismo nombre
drop function if exists completar_registro(text, uuid, boolean);
drop function if exists completar_registro(text, uuid, text, boolean);

-- 2) Registro en un solo paso ---------------------------------------------------------------
-- Se llama justo despues de crear la cuenta en Authentication (ya hay sesion: auth.uid()).
-- El nombre de usuario (Jugador####, .2, .3) lo asigna el trigger de la tabla usuario y es TAMBIEN el nombre del ranking.
create or replace function completar_registro(
  p_codigo text, p_personaje_id uuid, p_musica boolean default true, p_animaciones boolean default true
) returns void
language plpgsql security definer set search_path = public as $$
declare
  v_uid uuid := auth.uid();
  v_cod text := p_codigo;                       -- estricto: no se convierte a mayuscula (u12345678 se rechaza)
  v_rol uuid;
  v_com uuid;
  v_hash text;
begin
  if v_uid is null then
    raise exception 'Sin sesion: primero hay que crear la cuenta.' using errcode = '42501';
  end if;
  if v_cod is null or v_cod !~ '^U[0-9]{8}$' then
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

  insert into configuracion_usuario (usuario_id, sonido_activado, musica_activada, animaciones_activadas)
  values (v_uid, true, coalesce(p_musica, true), coalesce(p_animaciones, true)) on conflict (usuario_id) do nothing;

  insert into inventario_comodin (usuario_id, comodin_id, cantidad)
  values (v_uid, v_com, 3) on conflict (usuario_id, comodin_id) do nothing;
end $$;

revoke all on function completar_registro(text, uuid, boolean, boolean) from public, anon;
grant execute on function completar_registro(text, uuid, boolean, boolean) to authenticated;
