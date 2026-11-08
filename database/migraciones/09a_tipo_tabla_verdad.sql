-- =========================================================================================
-- while(no_aprendas) - Nuevo tipo de ejercicio: tabla_verdad  (EJECUTAR SOLO ESTE ARCHIVO, antes de 09)
-- PostgreSQL no permite usar un valor de enum recien creado en la misma ejecucion, por eso va aparte.
-- Se puede repetir sin problema.
-- =========================================================================================
alter type ejercicio_tipo add value if not exists 'tabla_verdad';
