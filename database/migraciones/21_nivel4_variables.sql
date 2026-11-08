-- =========================================================================================
-- while(no_aprendas) - NIVEL 4 "Variables y Operaciones": ahora tiene 3 LECCIONES (antes 5)
-- El contenido del nivel (15 problemas para escribir el codigo) esta en el juego (src/data/nivel4.js). Este script le dice a la base
-- que el nivel 4 se completa con 3 lecciones: sin el, el servidor seguiria pidiendo 5 y el nivel nunca quedaria completo.
--  1. nivel 4 de la unidad 1: lecciones_requeridas = 3 y nombre "Nivel 4: Variables y Operaciones".
--  2. Borra los registros de lecciones 4 y 5 de ese nivel (eran del contenido anterior, ya no existen). Los puntos que ya ganaron
--     los jugadores NO se tocan.
-- Ejecutar UNA vez, completo (todo o nada, repetible). Requiere haber ejecutado antes 11_progreso_puntos_comodines.sql.
-- =========================================================================================
do $n4$
declare v_filas int;
begin
  update nivel n set lecciones_requeridas = 3, nombre = 'Nivel 4: Variables y Operaciones'
  from unidad u where u.id = n.unidad_id and u.orden = 1 and n.orden = 4;
  get diagnostics v_filas = row_count;
  if v_filas = 0 then
    raise exception 'No existe el nivel 4 del mundo 1: ejecuta antes 11_progreso_puntos_comodines.sql.';
  end if;

  delete from progreso_leccion pl using nivel n, unidad u
  where pl.nivel_id = n.id and n.unidad_id = u.id and u.orden = 1 and n.orden = 4 and pl.leccion_orden > 3;
end $n4$;

-- Comprobacion: el nivel 4 debe pedir 3 lecciones y los demas niveles, 5
select n.orden as nivel, n.nombre, n.lecciones_requeridas
from nivel n join unidad u on u.id = n.unidad_id where u.orden = 1 order by n.orden;
