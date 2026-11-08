-- =========================================================================================
-- while(no_aprendas) - PISTAS DE LOS NIVELES 1 Y 2 (lo que da el comodin)
-- Pone una pista a cada ejercicio de los niveles 1 y 2 (69 ejercicios). El nivel 3 ya las trae con 14_nivel3_contenido.sql.
-- Solo ACTUALIZA la columna ejercicio.pista: no borra ni cambia preguntas, opciones ni el progreso de los jugadores.
-- Se localiza cada ejercicio por su posicion (nivel y numero de orden), asi que no depende de ningun id.
-- Se puede ejecutar mas de una vez.
-- =========================================================================================
begin;

alter table ejercicio add column if not exists pista text;

update ejercicio e set pista = v.pista
from (values
  (1, 1, 'Fíjate en el nombre del curso: los algoritmos son pasos lógicos para resolver problemas.'),
  (1, 2, 'Antes de programar hay que entender qué se pide y planear cómo resolverlo.'),
  (1, 3, 'Busca la actividad que sigue pasos ordenados para obtener un resultado a partir de datos.'),
  (1, 4, 'Piensa en para qué se evalúa: se revisa si lo aprendido cumple los criterios del curso.'),
  (1, 5, 'Es el documento que el curso entrega al inicio, junto con las indicaciones de quien lo dicta.'),
  (1, 6, 'El curso da fundamentos que luego sirven para crear soluciones informáticas.'),
  (1, 7, 'Una buena actitud combina entender el ejercicio, practicar y no quedarse con la duda.'),
  (1, 8, 'Un algoritmo es una secuencia ordenada de pasos con un fin.'),
  (1, 9, 'Busca una actividad diaria que se hace siguiendo instrucciones en orden, una tras otra.'),
  (1, 10, 'Son los datos que se le dan al algoritmo para que trabaje.'),
  (1, 11, 'La salida es el resultado que muestra el algoritmo: haz la suma.'),
  (1, 12, 'Piensa en lo que logra un algoritmo: guía los pasos hasta llegar a un resultado.'),
  (1, 13, 'Para el área de un rectángulo se multiplican dos medidas: ¿cuáles son?'),
  (1, 14, 'Piensa en las formas de explicar los pasos antes de programar: con palabras, con un código simplificado o con dibujos.'),
  (1, 15, 'Preciso significa que no deja dudas: cada instrucción se entiende de una sola manera.'),
  (1, 16, 'Finito tiene que ver con el final: ¿cuántos pasos tiene antes de terminar?'),
  (1, 17, 'Es la característica que hace que el resultado sea siempre el mismo con los mismos datos.'),
  (1, 18, 'Fíjate en la secuencia: servir antes de preparar rompe el orden lógico.'),
  (1, 19, 'La instrucción más precisa dice exactamente qué hacer, con qué datos y qué mostrar.'),
  (1, 20, 'Si nunca termina, le falta tener un final: piensa en la característica relacionada con terminar.'),
  (1, 21, 'Efectivo: lo que dice se puede hacer de verdad y acerca a la solución.'),
  (1, 22, 'Los algoritmos permiten planear soluciones lógicas antes de construir el sistema.'),
  (1, 23, 'Un sistema de ventas calcula totales: piensa en el precio y la cantidad.'),
  (1, 24, 'Uno describe los pasos; el otro los escribe en un lenguaje que la computadora entiende.'),
  (1, 25, 'Los mapas digitales te indican cómo llegar de un punto a otro: ¿qué buscan?'),
  (1, 26, 'Si el cálculo tiene errores, el resultado que se muestra tampoco será correcto.'),
  (1, 27, 'Antes de implementar conviene tener claro qué datos entran, qué debe salir y qué pasos hay.'),
  (1, 28, 'Probar sirve para descubrir fallos y confirmar que el resultado es el esperado.'),
  (1, 29, 'Piensa en la definición: pasos ordenados para resolver un problema.'),
  (1, 30, 'La salida es lo que el programa muestra al final: ¿qué obtiene al sumar?'),
  (1, 31, 'Una repetición sin salida no tiene final: piensa en la característica de terminar.'),
  (1, 32, 'Antes de resolver hay que entender el problema: ¿qué datos entran y qué se espera obtener?'),
  (1, 33, 'Piensa en la característica que evita las instrucciones con doble sentido.'),
  (1, 34, 'Calcular costos sigue pasos definidos: sumar los precios para llegar a un total.'),
  (1, 35, 'El curso enseña a razonar con lógica y deja la base para programar.'),
  (2, 1, 'Una proposición se puede decir si es verdadera o falsa; una orden o una pregunta no.'),
  (2, 2, 'Revisa cada opción con los datos que conoces y busca la que no se cumple.'),
  (2, 3, 'Fíjate si expresa una sola idea o si une varias con conectivos como «y» u «o».'),
  (2, 4, 'Una proposición compuesta une dos ideas con un conectivo lógico, por ejemplo «y».'),
  (2, 5, 'Las órdenes y las preguntas no pueden ser verdaderas ni falsas.'),
  (2, 6, 'Comprueba si el 6 se puede dividir exacto entre 2.'),
  (2, 7, 'Recuerda: la conjunción corresponde a «y» y la disyunción corresponde a «o».'),
  (2, 8, 'La conjunción solo es verdadera cuando las dos proposiciones son verdaderas.'),
  (2, 9, 'La conjunción solo es verdadera cuando las dos proposiciones son verdaderas.'),
  (2, 10, 'La conjunción solo es verdadera cuando las dos proposiciones son verdaderas.'),
  (2, 11, 'La conjunción solo es verdadera cuando las dos proposiciones son verdaderas.'),
  (2, 12, 'Una conjunción necesita que ambas proposiciones sean verdaderas: revisa cada una.'),
  (2, 13, 'Fila por fila: p ∧ q solo da V cuando p y q valen V a la vez.'),
  (2, 14, 'Recuerda: la disyunción corresponde a «o»; no la confundas con la «y».'),
  (2, 15, 'En la disyunción inclusiva basta con que una sea verdadera; solo es falsa si ambas son falsas.'),
  (2, 16, 'En la disyunción inclusiva basta con que una sea verdadera; solo es falsa si ambas son falsas.'),
  (2, 17, 'En la disyunción inclusiva basta con que una sea verdadera; solo es falsa si ambas son falsas.'),
  (2, 18, 'En la disyunción inclusiva basta con que una sea verdadera; solo es falsa si ambas son falsas.'),
  (2, 19, 'Una disyunción es verdadera si al menos una de sus proposiciones lo es: revisa cada una.'),
  (2, 20, 'Fila por fila: p ∨ q solo da F cuando p y q son falsas a la vez.'),
  (2, 21, 'La negación se lee «no p» y cambia el valor de verdad de una proposición.'),
  (2, 22, 'La negación invierte el valor de verdad: lo verdadero pasa a falso y viceversa.'),
  (2, 23, 'La negación invierte el valor de verdad: lo verdadero pasa a falso y viceversa.'),
  (2, 24, 'Primero decide si «10 es mayor que 4» es verdadero y luego invierte ese valor.'),
  (2, 25, 'Primero decide si «5 es un número par» es verdadero y luego invierte ese valor.'),
  (2, 26, 'Resuelve primero ¬p y después la disyunción con q: es verdadera si al menos una lo es.'),
  (2, 27, 'La negación invierte: si p es V, ¬p es F; si p es F, ¬p es V.'),
  (2, 28, 'Recuerda: la conjunción solo es verdadera si ambas proposiciones lo son.'),
  (2, 29, 'Recuerda: la disyunción es verdadera si al menos una proposición lo es.'),
  (2, 30, 'Resuelve primero ¬p; luego la conjunción necesita que ambas sean verdaderas.'),
  (2, 31, 'Sigue los pasos: primero la conjunción, luego ¬q y al final la disyunción.'),
  (2, 32, 'Recuerda: la disyunción solo es falsa cuando ambas proposiciones son falsas.'),
  (2, 33, 'Resuelve primero ¬p y después la conjunción con q.'),
  (2, 34, 'Resuelve columna por columna: primero p ∧ q, luego ¬q y al final (p ∧ q) ∨ ¬q.')
) as v(nivel_orden, orden, pista), nivel n, unidad u
where e.nivel_id = n.id and n.unidad_id = u.id and u.orden = 1
  and n.orden = v.nivel_orden and e.orden = v.orden;

-- Comprobacion: debe dar 0 ejercicios sin pista en los niveles 1, 2 y 3 (si el 3 sale con faltantes, ejecuta 14_nivel3_contenido.sql)
select n.orden as nivel, count(*) as ejercicios, count(*) filter (where e.pista is null) as sin_pista
from ejercicio e join nivel n on n.id = e.nivel_id join unidad u on u.id = n.unidad_id
where u.orden = 1 and n.orden in (1, 2, 3)
group by n.orden order by n.orden;

commit;
