-- =========================================================================================
-- while(no_aprendas) - El mundo 1 queda con 6 NIVELES: el NIVEL 6 es el EXAMEN FINAL (1 sola lección) y el nivel 7 se elimina.
-- El examen está en el juego (src/datos/nivel6.js, components/nivel/ExamenFinal.jsx): 10 ejercicios, 40 minutos, nota C/B/A/AD.
-- El juego solo registra el examen cuando el estudiante saca 12 puntos o más.
--  1. Nivel 6 de la unidad 1: lecciones_requeridas = 1 y nombre "Nivel 6: Examen final" (lo crea si falta).
--     La primera vez borra lo registrado del contenido anterior (Bucle PARA) para que nadie quede con el examen aprobado sin darlo.
--  2. Borra el nivel 7 (Subalgoritmos) y todo su avance.
--  3. Borra las lecciones a medias guardadas de los niveles 6 y 7 anteriores.
--  4. Logros: "Maestro del mundo 1" = 6 niveles; "Constelación" = 18 estrellas; "Estudiante dedicado" = 20 lecciones
--     (ahora el mundo tiene 22 lecciones: con 25 no se podía conseguir).
-- Los puntos que ya ganaron los jugadores NO se tocan. Ejecutar UNA vez, completo (repetible).
-- =========================================================================================
do $n6$
declare v_unidad uuid; v_nivel uuid;
begin
  select u.id into v_unidad from unidad u where u.orden = 1 order by u.id limit 1;
  if v_unidad is null then raise exception 'No existe la unidad 1. Ejecuta primero 02_nivel1_contenido.sql.'; end if;

  -- 1. Nivel 6 = examen final
  select id into v_nivel from nivel where unidad_id = v_unidad and orden = 6 order by id limit 1;
  if v_nivel is null then
    insert into nivel (unidad_id, nombre, dificultad, orden, lecciones_requeridas)
    values (v_unidad, 'Nivel 6: Examen final', 'dificil', 6, 1);
  else
    if (select nombre from nivel where id = v_nivel) <> 'Nivel 6: Examen final' then
      delete from progreso_leccion where nivel_id = v_nivel;
      delete from progreso where nivel_id = v_nivel;
      delete from leccion_en_curso where curso = 'pseudocodigo' and nivel = 5;   -- lecciones a medias del Bucle PARA (nivel 6 = índice 5)
    end if;
    update nivel set nombre = 'Nivel 6: Examen final', lecciones_requeridas = 1 where id = v_nivel;
  end if;

  -- 2. Sin nivel 7: primero su avance y su contenido, luego el nivel
  delete from progreso_leccion where nivel_id in (select id from nivel where unidad_id = v_unidad and orden >= 7);
  delete from progreso where nivel_id in (select id from nivel where unidad_id = v_unidad and orden >= 7);
  delete from ejercicio where nivel_id in (select id from nivel where unidad_id = v_unidad and orden >= 7);
  delete from leccion where nivel_id in (select id from nivel where unidad_id = v_unidad and orden >= 7);
  delete from nivel where unidad_id = v_unidad and orden >= 7;
  delete from leccion_en_curso where curso = 'pseudocodigo' and nivel >= 6;

  -- 4. Logros que dependían de 7 niveles / 25 lecciones
  update logro set descripcion = 'Completa los 6 niveles', meta = 6 where codigo = 'mundo_completo';
  update logro set descripcion = 'Consigue las 18 estrellas (3 por nivel)', meta = 18 where codigo = 'estrellas_21';
  update logro set descripcion = 'Completa 20 lecciones', meta = 20 where codigo = 'veinticinco_lecciones';
end $n6$;

-- Comprobación: deben salir 6 niveles y el 6 debe pedir 1 lección
select n.orden as nivel, n.nombre, n.lecciones_requeridas
from nivel n join unidad u on u.id = n.unidad_id where u.orden = 1 order by n.orden;
