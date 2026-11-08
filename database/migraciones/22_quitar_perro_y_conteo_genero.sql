-- =========================================================================================
-- while(no_aprendas) - QUITAR AL PERSONAJE PERRO + CONTEO DE HOMBRES Y MUJERES EN EL PANEL DE ADMINISTRACION
--  1. Quita al personaje Perro de la tabla personaje. Los usuarios que lo habian elegido quedan SIN personaje (el juego muestra el
--     muneco de siempre) y desaparece de la pantalla de seleccion.
--     OJO: NO borres archivos del bucket personajes a ciegas: la mini del Chico apunta al archivo perro-mini.png (ver 10_personaje_mini.sql).
--  2. Actualiza admin_resumen() para que el resumen del panel traiga la cantidad de HOMBRES y MUJERES, segun el personaje que eligio
--     cada usuario (Chico = hombre, Chica = mujer) y cuantos no tienen personaje.
-- Ejecutar UNA vez, completo (todo o nada, repetible). Requiere haber ejecutado antes 18_panel_admin.sql.
-- =========================================================================================
do $perro$
declare v_id uuid; v_n int;
begin
  select id into v_id from personaje where tipo = 'jugable' and lower(nombre) = 'perro' limit 1;
  if v_id is null then
    raise notice 'No hay personaje Perro: no hay nada que quitar.';
  else
    perform set_config('app.cambio_autorizado', 'true', true);          -- cambiar el personaje de un jugador exige autorizacion (solo dentro de esta transaccion)
    update usuario set personaje_id = null where personaje_id = v_id;
    get diagnostics v_n = row_count;
    delete from personaje where id = v_id;
    raise notice 'Personaje Perro eliminado. Usuarios que lo tenian y quedaron sin personaje: %', v_n;
  end if;
end $perro$;

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
    -- Segun el personaje que eligio cada usuario: Chico = hombre, Chica = mujer
    'hombres', count(*) filter (where lower(pj.nombre) = 'chico'),
    'mujeres', count(*) filter (where lower(pj.nombre) = 'chica'),
    'sin_personaje', count(*) filter (where pj.id is null or lower(pj.nombre) not in ('chico', 'chica')),
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

-- Comprobacion: ya no debe aparecer el Perro y el resumen trae hombres, mujeres y sin_personaje
select nombre, tipo from personaje where tipo = 'jugable' order by nombre;
