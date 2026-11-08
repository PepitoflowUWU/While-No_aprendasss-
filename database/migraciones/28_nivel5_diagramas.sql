-- =========================================================================================
-- while(no_aprendas) - NIVEL 5 DEL MUNDO 1: Creacion de diagramas de flujo
-- 3 lecciones (etapas) sin teoria, 15 ejercicios de ARMAR el diagrama con caminos SI / NO. Generado desde src/datos/nivel5.js.
--  1. Columna nueva ejercicio.diagrama (jsonb): { "d": solucion, "distractores": bloques que sobran }.
--     Un bloque es ["texto", "forma"] (forma = ini | fin | io | proc | dec); una decision es { "dec": "¿...?", "si": [...], "no": [...] }.
--  2. Nivel 5 de la unidad 1: nombre "Nivel 5: Creacion de diagramas de flujo" y lecciones_requeridas = 3.
--  3. REEMPLAZA todo el contenido del nivel 5 (el anterior "Bucle MIENTRAS" no estaba en la base). Es seguro repetirlo.
--     Borra los registros de las lecciones 4 y 5 de ese nivel (ya no existen); los puntos que ya ganaron los jugadores no se tocan.
-- Requiere haber ejecutado antes 01, 02, 11 y 14.
-- =========================================================================================
begin;

alter table ejercicio add column if not exists diagrama jsonb;

do $crear$
declare v_unidad uuid;
begin
  select u.id into v_unidad from unidad u where u.orden = 1 order by u.id limit 1;
  if v_unidad is null then raise exception 'No existe la unidad 1. Ejecuta primero 02_nivel1_contenido.sql.'; end if;
  if exists (select 1 from nivel where unidad_id = v_unidad and orden = 5) then
    update nivel set nombre = 'Nivel 5: Creacion de diagramas de flujo', lecciones_requeridas = 3 where unidad_id = v_unidad and orden = 5;
  else
    insert into nivel (unidad_id, nombre, dificultad, orden, lecciones_requeridas)
    values (v_unidad, 'Nivel 5: Creacion de diagramas de flujo', 'medio', 5, 3);
  end if;
end $crear$;

drop table if exists _n5;
create temp table _n5 as
  select n.id from nivel n join unidad u on u.id = n.unidad_id where n.orden = 5 and u.orden = 1 order by n.id limit 1;

delete from progreso_leccion where nivel_id = (select id from _n5) and leccion_orden > 3;
delete from leccion   where nivel_id = (select id from _n5);
delete from ejercicio where nivel_id = (select id from _n5);

-- ── Leccion 1: Del código al diagrama de flujo
insert into leccion (id, nivel_id, orden, titulo, teoria) values
  ('88000000-0000-0000-0000-000000000001', (select id from _n5), 1, 'Del código al diagrama de flujo', '[]'::jsonb);
insert into ejercicio (id, nivel_id, leccion_id, tipo, enunciado, puntos_base, orden, pista, codigo, traza, diagrama) values
  ('89000000-0000-0000-0000-000000000001', (select id from _n5), '88000000-0000-0000-0000-000000000001', 'diagrama_flujo', 'Ejercicio 1. Sumar dos números. Lee el pseudocódigo y arma su diagrama de flujo.', 20, 1, 'Primero debes solicitar los dos números, después realizar la suma y finalmente mostrar el resultado.', 'INICIO
    DEFINIR numero1, numero2, suma COMO ENTERO

    LEER numero1
    LEER numero2

    suma ← numero1 + numero2

    ESCRIBIR suma
FIN', null, $json${"d":[["Inicio","ini"],["Leer numero1","io"],["Leer numero2","io"],["suma ← numero1 + numero2","proc"],["Escribir suma","io"],["Fin","fin"]],"distractores":[["suma ← numero1 * numero2","proc"]]}$json$::jsonb),
  ('89000000-0000-0000-0000-000000000002', (select id from _n5), '88000000-0000-0000-0000-000000000001', 'diagrama_flujo', 'Ejercicio 2. Calcular el doble de un número. Lee el pseudocódigo y arma su diagrama de flujo.', 20, 2, 'El proceso principal consiste en multiplicar el número ingresado por 2.', 'INICIO
    DEFINIR numero, doble COMO ENTERO

    LEER numero

    doble ← numero * 2

    ESCRIBIR doble
FIN', null, $json${"d":[["Inicio","ini"],["Leer numero","io"],["doble ← numero * 2","proc"],["Escribir doble","io"],["Fin","fin"]],"distractores":[["doble ← numero + 2","proc"]]}$json$::jsonb),
  ('89000000-0000-0000-0000-000000000003', (select id from _n5), '88000000-0000-0000-0000-000000000001', 'diagrama_flujo', 'Ejercicio 3. Determinar si un número es positivo. Lee el pseudocódigo y arma su diagrama de flujo.', 20, 3, 'Debes utilizar un rombo para representar la condición. Recuerda que una decisión tiene dos caminos: verdadero (SÍ) y falso (NO).', 'INICIO
    DEFINIR numero COMO ENTERO

    LEER numero

    SI numero > 0 ENTONCES
        ESCRIBIR "POSITIVO"
    SINO
        ESCRIBIR "NO ES POSITIVO"
    FIN SI
FIN', null, $json${"d":[["Inicio","ini"],["Leer numero","io"],{"dec":"¿numero > 0?","si":[["Escribir \"POSITIVO\"","io"]],"no":[["Escribir \"NO ES POSITIVO\"","io"]]},["Fin","fin"]],"distractores":[["¿numero < 0?","dec"]]}$json$::jsonb),
  ('89000000-0000-0000-0000-000000000004', (select id from _n5), '88000000-0000-0000-0000-000000000001', 'diagrama_flujo', 'Ejercicio 4. Calcular el promedio de tres notas. Lee el pseudocódigo y arma su diagrama de flujo.', 20, 4, 'Necesitas tres entradas antes de realizar el cálculo. El promedio se obtiene sumando las notas y dividiendo entre 3.', 'INICIO
    DEFINIR nota1, nota2, nota3, promedio COMO REAL

    LEER nota1
    LEER nota2
    LEER nota3

    promedio ← (nota1 + nota2 + nota3) / 3

    ESCRIBIR promedio
FIN', null, $json${"d":[["Inicio","ini"],["Leer nota1, nota2, nota3","io"],["suma ← nota1 + nota2 + nota3","proc"],["promedio ← suma / 3","proc"],["Escribir promedio","io"],["Fin","fin"]],"distractores":[["promedio ← suma * 3","proc"]]}$json$::jsonb),
  ('89000000-0000-0000-0000-000000000005', (select id from _n5), '88000000-0000-0000-0000-000000000001', 'diagrama_flujo', 'Ejercicio 5. Determinar si un estudiante aprobó. Lee el pseudocódigo y arma su diagrama de flujo.', 20, 5, 'La condición debe comprobar si la nota es mayor o igual a 11. Utiliza dos salidas dependiendo del resultado.', 'INICIO
    DEFINIR nota COMO REAL

    LEER nota

    SI nota >= 11 ENTONCES
        ESCRIBIR "APROBADO"
    SINO
        ESCRIBIR "DESAPROBADO"
    FIN SI
FIN', null, $json${"d":[["Inicio","ini"],["Leer nota","io"],{"dec":"¿nota >= 11?","si":[["Escribir \"APROBADO\"","io"]],"no":[["Escribir \"DESAPROBADO\"","io"]]},["Fin","fin"]],"distractores":[["¿nota > 11?","dec"]]}$json$::jsonb);

-- ── Leccion 2: Del problema al diagrama de flujo
insert into leccion (id, nivel_id, orden, titulo, teoria) values
  ('88000000-0000-0000-0000-000000000002', (select id from _n5), 2, 'Del problema al diagrama de flujo', '[]'::jsonb);
insert into ejercicio (id, nivel_id, leccion_id, tipo, enunciado, puntos_base, orden, pista, codigo, traza, diagrama) values
  ('89000000-0000-0000-0000-000000000006', (select id from _n5), '88000000-0000-0000-0000-000000000002', 'diagrama_flujo', 'Ejercicio 6. Una tienda vende cuadernos a S/ 8 cada uno. El usuario ingresa cuántos cuadernos desea comprar. Arma el diagrama que calcula y muestra el precio total.', 20, 6, 'Necesitas solicitar la cantidad de cuadernos y multiplicarla por 8.', null, null, $json${"d":[["Inicio","ini"],["Leer cantidad","io"],["total ← cantidad * 8","proc"],["Escribir total","io"],["Fin","fin"]],"distractores":[["total ← cantidad + 8","proc"]]}$json$::jsonb),
  ('89000000-0000-0000-0000-000000000007', (select id from _n5), '88000000-0000-0000-0000-000000000002', 'diagrama_flujo', 'Ejercicio 7. Un usuario ingresa su edad actual. Arma el diagrama que calcula cuántos años tendrá dentro de 10 años y lo muestra (si ingresa 18, debe mostrar 28).', 20, 7, 'Solo necesitas una entrada y una operación de suma.', null, null, $json${"d":[["Inicio","ini"],["Leer edad","io"],["edadFutura ← edad + 10","proc"],["Escribir edadFutura","io"],["Fin","fin"]],"distractores":[["edadFutura ← edad - 10","proc"]]}$json$::jsonb),
  ('89000000-0000-0000-0000-000000000008', (select id from _n5), '88000000-0000-0000-0000-000000000002', 'diagrama_flujo', 'Ejercicio 8. Arma el diagrama que pide la edad de una persona: si tiene 18 años o más muestra "Mayor de edad"; si no, "Menor de edad".', 20, 8, 'Utiliza una decisión que compare la edad con el número 18.', null, null, $json${"d":[["Inicio","ini"],["Leer edad","io"],{"dec":"¿edad >= 18?","si":[["Escribir \"Mayor de edad\"","io"]],"no":[["Escribir \"Menor de edad\"","io"]]},["Fin","fin"]],"distractores":[["¿edad > 18?","dec"]]}$json$::jsonb),
  ('89000000-0000-0000-0000-000000000009', (select id from _n5), '88000000-0000-0000-0000-000000000002', 'diagrama_flujo', 'Ejercicio 9. Una tienda descuenta S/ 15 del precio de un producto. El usuario ingresa el precio original. Arma el diagrama que muestra el precio final (si el precio es S/ 100, debe mostrar S/ 85).', 20, 9, 'Primero solicita el precio, luego realiza una resta.', null, null, $json${"d":[["Inicio","ini"],["Leer precio","io"],["precioFinal ← precio - 15","proc"],["Escribir precioFinal","io"],["Fin","fin"]],"distractores":[["precioFinal ← precio + 15","proc"]]}$json$::jsonb),
  ('89000000-0000-0000-0000-000000000010', (select id from _n5), '88000000-0000-0000-0000-000000000002', 'diagrama_flujo', 'Ejercicio 10. El usuario ingresa dos números diferentes. Arma el diagrama que los compara y muestra cuál es el mayor.', 20, 10, 'Necesitas dos entradas y una decisión. Compara el primer número con el segundo.', null, null, $json${"d":[["Inicio","ini"],["Leer numero1","io"],["Leer numero2","io"],{"dec":"¿numero1 > numero2?","si":[["Escribir numero1","io"]],"no":[["Escribir numero2","io"]]},["Fin","fin"]],"distractores":[["mayor ← numero1 + numero2","proc"]]}$json$::jsonb);

-- ── Leccion 3: Desafíos combinados
insert into leccion (id, nivel_id, orden, titulo, teoria) values
  ('88000000-0000-0000-0000-000000000003', (select id from _n5), 3, 'Desafíos combinados', '[]'::jsonb);
insert into ejercicio (id, nivel_id, leccion_id, tipo, enunciado, puntos_base, orden, pista, codigo, traza, diagrama) values
  ('89000000-0000-0000-0000-000000000011', (select id from _n5), '88000000-0000-0000-0000-000000000003', 'diagrama_flujo', 'Ejercicio 11. Calcular el área de un triángulo. Lee el pseudocódigo y arma su diagrama de flujo.', 20, 11, 'El diagrama debe tener dos entradas y un proceso matemático. Recuerda dividir el resultado entre 2.', 'INICIO
    DEFINIR base, altura, area COMO REAL

    LEER base
    LEER altura

    area ← (base * altura) / 2

    ESCRIBIR area
FIN', null, $json${"d":[["Inicio","ini"],["Leer base","io"],["Leer altura","io"],["area ← (base * altura) / 2","proc"],["Escribir area","io"],["Fin","fin"]],"distractores":[["area ← base * altura","proc"]]}$json$::jsonb),
  ('89000000-0000-0000-0000-000000000012', (select id from _n5), '88000000-0000-0000-0000-000000000003', 'diagrama_flujo', 'Ejercicio 12. Un sistema pide la temperatura de una habitación. Si es mayor a 30 grados muestra "Temperatura alta"; si es menor o igual, "Temperatura normal". Arma su diagrama.', 20, 12, 'Utiliza un rombo para comprobar si la temperatura supera los 30 grados.', null, null, $json${"d":[["Inicio","ini"],["Leer temperatura","io"],{"dec":"¿temperatura > 30?","si":[["Escribir \"Temperatura alta\"","io"]],"no":[["Escribir \"Temperatura normal\"","io"]]},["Fin","fin"]],"distractores":[["¿temperatura < 30?","dec"]]}$json$::jsonb),
  ('89000000-0000-0000-0000-000000000013', (select id from _n5), '88000000-0000-0000-0000-000000000003', 'diagrama_flujo', 'Ejercicio 13. Calcular el total con envío. Lee el pseudocódigo y arma su diagrama de flujo.', 20, 13, 'Primero evalúa el precio: si es 100 o más, el envío es gratis; si es menor, cuesta 10. Después de la decisión, suma el precio y el envío.', 'INICIO
    DEFINIR precio, envio, total COMO REAL

    LEER precio

    SI precio >= 100 ENTONCES
        envio ← 0
    SINO
        envio ← 10
    FIN SI

    total ← precio + envio

    ESCRIBIR total
FIN', null, $json${"d":[["Inicio","ini"],["Leer precio","io"],{"dec":"¿precio >= 100?","si":[["envio ← 0","proc"]],"no":[["envio ← 10","proc"]]},["total ← precio + envio","proc"],["Escribir total","io"],["Fin","fin"]],"distractores":[["total ← precio - envio","proc"]]}$json$::jsonb),
  ('89000000-0000-0000-0000-000000000014', (select id from _n5), '88000000-0000-0000-0000-000000000003', 'diagrama_flujo', 'Ejercicio 14. Un jugador empieza con 3 vidas. El usuario ingresa cuántas vidas perdió. Arma el diagrama que calcula las vidas restantes: si quedan 0 o menos muestra "Juego terminado"; si no, muestra las vidas que quedan.', 20, 14, 'Primero realiza una resta entre las vidas iniciales y las perdidas. Después utiliza una decisión para comprobar si quedan vidas.', null, null, $json${"d":[["Inicio","ini"],["Leer vidasPerdidas","io"],["vidas ← 3 - vidasPerdidas","proc"],{"dec":"¿vidas <= 0?","si":[["Escribir \"Juego terminado\"","io"]],"no":[["Escribir \"Vidas restantes: \", vidas","io"]]},["Fin","fin"]],"distractores":[["vidas ← 3 + vidasPerdidas","proc"]]}$json$::jsonb),
  ('89000000-0000-0000-0000-000000000015', (select id from _n5), '88000000-0000-0000-0000-000000000003', 'diagrama_flujo', 'Ejercicio 15. Sistema de calificación. Lee el pseudocódigo y arma su diagrama de flujo: tiene una decisión dentro de otra.', 20, 15, 'Este ejercicio tiene una decisión dentro de otra. Primero comprueba si la nota es 18 o más; si no lo es (camino NO), comprueba si alcanza 11.', 'INICIO
    DEFINIR nota COMO REAL

    LEER nota

    SI nota >= 18 ENTONCES
        ESCRIBIR "EXCELENTE"
    SINO
        SI nota >= 11 ENTONCES
            ESCRIBIR "APROBADO"
        SINO
            ESCRIBIR "DESAPROBADO"
        FIN SI
    FIN SI
FIN', null, $json${"d":[["Inicio","ini"],["Leer nota","io"],{"dec":"¿nota >= 18?","si":[["Escribir \"EXCELENTE\"","io"]],"no":[{"dec":"¿nota >= 11?","si":[["Escribir \"APROBADO\"","io"]],"no":[["Escribir \"DESAPROBADO\"","io"]]}]},["Fin","fin"]],"distractores":[]}$json$::jsonb);

-- Comprobacion: debe dar 3 lecciones, 15 ejercicios con diagrama y lecciones_requeridas = 3
select (select count(*) from leccion where nivel_id = (select id from _n5)) as lecciones,
       (select count(*) from ejercicio where nivel_id = (select id from _n5) and diagrama is not null) as ejercicios_diagrama,
       (select lecciones_requeridas from nivel where id = (select id from _n5)) as lecciones_requeridas;

commit;
