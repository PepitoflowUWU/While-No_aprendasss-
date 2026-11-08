-- =========================================================================================
-- while(no_aprendas) - SIN ROL DOCENTE + PERSONAJES NUEVOS ChicaN Y ChicoN
--  1. Se elimina el rol docente: los usuarios que lo tuvieran pasan a estudiante y se borran sus permisos y el rol.
--     Desde el panel solo se pueden asignar los roles estudiante y administrador.
--  2. Personajes jugables nuevos (Storage: personajes/personajesSeleccionable/ChicaN y ChicoN):
--       ChicaN = otra version de la Chica, ChicoN = otra version del Chico.
--     En la seleccion el jugador elige primero Chica o Chico y despues la version (normal o N).
--     Solo ChicoN tiene muñeco mini por ahora; ChicaN usa su imagen grande en el mapa hasta que tenga mini.
--  3. Panel > Resumen: ChicaN cuenta como mujer y ChicoN como hombre.
-- Ejecutar UNA vez, completo (todo o nada, repetible). Requiere haber ejecutado antes 10, 22 y 26.
-- =========================================================================================
begin;

-- ---------------------------------------------------------------------------------------
-- 1) Sin rol docente
-- ---------------------------------------------------------------------------------------
do $doc$
declare v_doc uuid; v_est uuid;
begin
  select id into v_doc from rol where nombre = 'docente';
  if v_doc is null then return; end if;
  select id into v_est from rol where nombre = 'estudiante';
  perform set_config('app.cambio_autorizado', 'true', true);   -- el rol es un dato protegido del jugador (23)
  update usuario set rol_id = v_est where rol_id = v_doc;
  delete from permiso where rol_id = v_doc;
  delete from rol where id = v_doc;
end $doc$;

create or replace function admin_roles()
returns jsonb language plpgsql stable security definer set search_path = public as $$
begin
  perform exigir_super_admin();
  return coalesce((select jsonb_agg(jsonb_build_object('nombre', r.nombre, 'descripcion', r.descripcion) order by r.nombre)
                   from rol r where r.nombre in ('estudiante', 'administrador')), '[]'::jsonb);
end $$;

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

  perform set_config('app.cambio_autorizado', 'true', true);
  update usuario set rol_id = v_rol where id = v_obj.id;
  return jsonb_build_object('asignado', true, 'nombre_usuario', v_obj.nombre_usuario, 'codigo_estudiante', v_obj.codigo_estudiante,
                            'rol_anterior', v_obj.rol, 'rol_nuevo', v_nombre);
end $$;

-- ---------------------------------------------------------------------------------------
-- 2) Personajes ChicaN y ChicoN
-- ---------------------------------------------------------------------------------------
insert into personaje (id, nombre, tipo, descripcion, imagen_url, imagen_mini_url) values
  ('d0000000-0000-0000-0000-000000000009', 'ChicaN', 'jugable', 'Otra versión de la Chica.',
   'https://nbvvesjfntqxfgcikeyq.supabase.co/storage/v1/object/public/personajes/personajesSeleccionable/ChicaN/chicaN.png',
   null),                                                                                   -- aun sin mini: el mapa usa la imagen grande
  ('d0000000-0000-0000-0000-000000000010', 'ChicoN', 'jugable', 'Otra versión del Chico.',
   'https://nbvvesjfntqxfgcikeyq.supabase.co/storage/v1/object/public/personajes/personajesSeleccionable/ChicoN/chicoN.png',
   'https://nbvvesjfntqxfgcikeyq.supabase.co/storage/v1/object/public/personajes/personajesSeleccionable/ChicoN/chicoN-mini.png')
on conflict (id) do update
  set nombre = excluded.nombre, tipo = excluded.tipo, descripcion = excluded.descripcion,
      imagen_url = excluded.imagen_url, imagen_mini_url = coalesce(excluded.imagen_mini_url, personaje.imagen_mini_url);

-- ---------------------------------------------------------------------------------------
-- 3) Panel > Resumen: ChicaN es mujer y ChicoN es hombre
-- ---------------------------------------------------------------------------------------
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
    -- Segun el personaje que eligio cada usuario: Chico y ChicoN = hombre, Chica y ChicaN = mujer
    'hombres', count(*) filter (where lower(pj.nombre) in ('chico', 'chicon')),
    'mujeres', count(*) filter (where lower(pj.nombre) in ('chica', 'chican')),
    'sin_personaje', count(*) filter (where pj.id is null or lower(pj.nombre) not in ('chico', 'chicon', 'chica', 'chican')),
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

commit;

-- Comprobacion: roles que quedan (estudiante y administrador) y los 4 personajes jugables
--   select nombre from rol order by nombre;
--   select id, nombre, imagen_url, imagen_mini_url from personaje where tipo = 'jugable' order by id;
