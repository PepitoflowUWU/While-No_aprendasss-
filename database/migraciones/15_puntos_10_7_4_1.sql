-- =========================================================================================
-- while(no_aprendas) - NUEVA PUNTUACION POR INTENTO: 10 / 7 / 4 / 1
-- Respuesta correcta en el intento 1 = 10 puntos, 2 = 7, 3 = 4, 4 = 1. Sin acertar en los 4 intentos = 0.
-- Solo cambia la funcion puntos_por_intento(): registrar_leccion() ya la usa, asi que no hay que tocar nada mas en la base.
-- Se puede ejecutar mas de una vez.
--
-- IMPORTANTE: esto afecta a los puntos que se den DE AQUI EN ADELANTE. Los puntos que los jugadores ya tienen
-- (puntaje_total y progreso_leccion.puntos) no se modifican: se obtuvieron con la escala anterior (100 / 70 / 40 / 10)
-- y por eso seran mucho mayores que los nuevos. Si quieres convertirlos a la escala nueva, mira el bloque opcional del final.
-- =========================================================================================
create or replace function puntos_por_intento(p_intento int)
returns int language plpgsql immutable as $$
begin
  if p_intento is null or p_intento < 1 or p_intento > 4 then
    raise exception 'Intento fuera de rango: debe estar entre 1 y 4 (recibido %).', p_intento using errcode = '22023';
  end if;
  return case p_intento when 1 then 10 when 2 then 7 when 3 then 4 else 1 end;
end $$;

revoke all on function puntos_por_intento(int) from public, anon;

-- Comprobacion: debe dar 10, 7, 4, 1
select puntos_por_intento(1) as intento_1, puntos_por_intento(2) as intento_2, puntos_por_intento(3) as intento_3, puntos_por_intento(4) as intento_4;

-- ---------------------------------------------------------------------------------------
-- OPCIONAL (NO se ejecuta solo): convertir los puntos ya acumulados a la escala nueva (dividir entre 10, redondeando).
-- Es irreversible: antes exporta usuario y progreso_leccion. Quita los "--" de las lineas para usarlo.
-- ---------------------------------------------------------------------------------------
-- begin;
-- update progreso_leccion set puntos = round(puntos / 10.0)::int;
-- update usuario set puntaje_total = (select coalesce(sum(pl.puntos), 0) from progreso_leccion pl where pl.usuario_id = usuario.id)
--   where id in (select usuario_id from progreso_leccion);
-- commit;
-- (Esto recalcula el puntaje de cada jugador como la suma de sus lecciones ya convertidas. Los jugadores que no tengan
--  lecciones registradas no cambian.)
