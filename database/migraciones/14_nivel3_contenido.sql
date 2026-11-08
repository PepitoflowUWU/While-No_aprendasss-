-- =========================================================================================
-- while(no_aprendas) - CONTENIDO DEL NIVEL 3 DEL MUNDO 1: Pseudocodigo y diagramas de flujo
-- 5 lecciones, 25 ejercicios (22 de alternativas con 88 opciones, 3 de ordenar bloques con 12 bloques),
-- 16 ejecuciones paso a paso. Generado desde src/data/nivel3.js. Se ejecuta de una vez (no necesita otro script antes
-- ademas de 01, 02 y 11). REEMPLAZA todo el contenido del nivel 3 (es seguro repetirlo); no toca los demas niveles ni el progreso.
--
-- Como se guarda lo que no cabia en las tablas:
--   ejercicio.pista   = lo que da el comodin          ejercicio.codigo = pseudocodigo que se muestra con la pregunta
--   ejercicio.traza   = ejecucion paso a paso (jsonb)  caso_prueba      = bloques de los ejercicios de ordenar, en orden
--                                                                         (entrada = forma del bloque, salida_esperada = su texto)
-- =========================================================================================
begin;

-- Columnas nuevas de ejercicio (todas opcionales)
alter table ejercicio add column if not exists pista text;
alter table ejercicio add column if not exists codigo text;
alter table ejercicio add column if not exists traza jsonb;

-- El juego lee las filas visibles de caso_prueba (bloques y tablas); los casos ocultos siguen sin ser legibles
alter table caso_prueba enable row level security;
drop policy if exists "casos visibles" on caso_prueba;
create policy "casos visibles" on caso_prueba for select to anon, authenticated using (es_oculto = false);

-- Localiza (o crea) el nivel 3 de la unidad 1, por su POSICION, y le pone su nombre
do $crear$
declare v_unidad uuid;
begin
  select u.id into v_unidad from unidad u where u.orden = 1 order by u.id limit 1;
  if v_unidad is null then
    raise exception 'No existe la unidad 1. Ejecuta primero 02_nivel1_contenido.sql.';
  end if;
  if exists (select 1 from nivel where unidad_id = v_unidad and orden = 3) then
    update nivel set nombre = 'Nivel 3: Pseudocodigo y Diagramas' where unidad_id = v_unidad and orden = 3;
  else
    insert into nivel (unidad_id, nombre, dificultad, orden) values (v_unidad, 'Nivel 3: Pseudocodigo y Diagramas', 'medio', 3);
  end if;
end $crear$;

drop table if exists _n3;
create temp table _n3 as
  select n.id from nivel n join unidad u on u.id = n.unidad_id where n.orden = 3 and u.orden = 1 order by n.id limit 1;

-- Borra TODO el contenido anterior del nivel 3 (lecciones, ejercicios, alternativas y bloques). El progreso de los jugadores no se toca.
delete from leccion   where nivel_id = (select id from _n3);
delete from ejercicio where nivel_id = (select id from _n3);

-- ── Leccion 1: Introducción al pseudocódigo
insert into leccion (id, nivel_id, orden, titulo, teoria) values
  ('84000000-0000-0000-0000-000000000001', (select id from _n3), 1, 'Introducción al pseudocódigo', $json$[{"titulo":"¿Qué es el pseudocódigo?","texto":"El pseudocódigo es una forma de representar los pasos de un algoritmo utilizando palabras sencillas y estructuras similares a las de un lenguaje de programación. Sirve para explicar cómo resolver un problema antes de escribir un programa real.\n\nSu propósito es ayudar a comprender la lógica de un problema, organizar las instrucciones y detectar errores antes de programar.","codigo":null,"grafico":null},{"titulo":"Reglas y convenciones básicas","texto":"• Las instrucciones deben escribirse en un orden lógico.\n• Se pueden utilizar palabras como INICIO, LEER, ESCRIBIR y FIN.\n• Las variables almacenan datos que se utilizan durante el algoritmo.\n• Cada instrucción debe expresar una acción clara.\n• Los nombres de las variables deben ser descriptivos, como edad, nombre o precio.\n• El pseudocódigo no tiene una única sintaxis universal, pero se recomienda mantener un estilo consistente.","codigo":null,"grafico":null},{"titulo":"Ejemplo","texto":"Este algoritmo solicita un nombre y muestra un saludo.","codigo":"INICIO\n    LEER nombre\n    ESCRIBIR \"Hola \", nombre\nFIN","grafico":null}]$json$::jsonb);
insert into ejercicio (id, nivel_id, leccion_id, tipo, enunciado, puntos_base, orden, pista, codigo, traza) values
  ('85000000-0000-0000-0000-000000000001', (select id from _n3), '84000000-0000-0000-0000-000000000001', 'teoria', '¿Cuál es el propósito principal del pseudocódigo?', 20, 1, 'Se utiliza para planificar la lógica de una solución antes de programarla.', null, null),
  ('85000000-0000-0000-0000-000000000002', (select id from _n3), '84000000-0000-0000-0000-000000000001', 'teoria', '¿Qué instrucción se utiliza para solicitar o recibir un dato del usuario en el ejemplo presentado?', 20, 2, 'Es la instrucción que permite ingresar un valor desde el teclado.', 'INICIO
    LEER nombre
    ESCRIBIR "Hola ", nombre
FIN', null),
  ('85000000-0000-0000-0000-000000000003', (select id from _n3), '84000000-0000-0000-0000-000000000001', 'completar_codigo', 'Ordena las siguientes instrucciones para mostrar un saludo.', 20, 3, 'Todo algoritmo comienza antes de ejecutar instrucciones y termina después de ellas.', null, $json${"titulo":"Así funciona tu pseudocódigo","entrada":null,"lineas":["INICIO","    ESCRIBIR \"Hola\"","FIN"],"pasos":[{"l":0,"texto":"INICIO: el algoritmo comienza."},{"l":1,"texto":"ESCRIBIR muestra el mensaje Hola en la pantalla.","salida":"Hola"},{"l":2,"texto":"FIN: el algoritmo termina."}],"modo":"codigo"}$json$::jsonb),
  ('85000000-0000-0000-0000-000000000004', (select id from _n3), '84000000-0000-0000-0000-000000000001', 'teoria', '¿Cuál de los siguientes nombres de variable es más descriptivo para almacenar la edad de una persona?', 20, 4, 'El mejor nombre permite comprender qué información almacena sin tener que adivinarlo.', null, null),
  ('85000000-0000-0000-0000-000000000005', (select id from _n3), '84000000-0000-0000-0000-000000000001', 'completar_codigo', 'Completa el código para que solicite un nombre y después lo muestre.', 20, 5, 'Debes utilizar la instrucción que recibe un dato.', 'INICIO
    ______ nombre
    ESCRIBIR nombre
FIN', $json${"titulo":"Así funciona tu pseudocódigo","entrada":"Supongamos que el usuario escribe Ana.","lineas":["INICIO","    LEER nombre","    ESCRIBIR nombre","FIN"],"pasos":[{"l":0,"texto":"INICIO: el algoritmo comienza."},{"l":1,"texto":"LEER espera un dato: el usuario escribe Ana y se guarda en la variable nombre.","vars":{"nombre":"\"Ana\""}},{"l":2,"texto":"ESCRIBIR muestra el valor guardado en nombre.","salida":"Ana"},{"l":3,"texto":"FIN: el algoritmo termina."}],"modo":"codigo"}$json$::jsonb);
insert into alternativa (id, ejercicio_id, texto, es_correcta) values
  ('86000000-0000-0000-0000-000000000011', '85000000-0000-0000-0000-000000000001', 'Diseñar imágenes para una aplicación.', false),
  ('86000000-0000-0000-0000-000000000012', '85000000-0000-0000-0000-000000000001', 'Representar los pasos de un algoritmo de manera sencilla.', true),
  ('86000000-0000-0000-0000-000000000013', '85000000-0000-0000-0000-000000000001', 'Almacenar archivos en una computadora.', false),
  ('86000000-0000-0000-0000-000000000014', '85000000-0000-0000-0000-000000000001', 'Reemplazar permanentemente todos los lenguajes de programación.', false),
  ('86000000-0000-0000-0000-000000000021', '85000000-0000-0000-0000-000000000002', 'INICIO', false),
  ('86000000-0000-0000-0000-000000000022', '85000000-0000-0000-0000-000000000002', 'FIN', false),
  ('86000000-0000-0000-0000-000000000023', '85000000-0000-0000-0000-000000000002', 'LEER', true),
  ('86000000-0000-0000-0000-000000000024', '85000000-0000-0000-0000-000000000002', 'ESCRIBIR', false),
  ('86000000-0000-0000-0000-000000000041', '85000000-0000-0000-0000-000000000004', 'x', false),
  ('86000000-0000-0000-0000-000000000042', '85000000-0000-0000-0000-000000000004', 'dato1', false),
  ('86000000-0000-0000-0000-000000000043', '85000000-0000-0000-0000-000000000004', 'edad', true),
  ('86000000-0000-0000-0000-000000000044', '85000000-0000-0000-0000-000000000004', 'abc', false),
  ('86000000-0000-0000-0000-000000000051', '85000000-0000-0000-0000-000000000005', 'LEER', true),
  ('86000000-0000-0000-0000-000000000052', '85000000-0000-0000-0000-000000000005', 'FIN', false),
  ('86000000-0000-0000-0000-000000000053', '85000000-0000-0000-0000-000000000005', 'INICIO', false),
  ('86000000-0000-0000-0000-000000000054', '85000000-0000-0000-0000-000000000005', 'SUMAR', false);
insert into caso_prueba (id, ejercicio_id, entrada, salida_esperada, es_oculto) values
  ('87000000-0000-0000-0000-000000000301', '85000000-0000-0000-0000-000000000003', null, 'INICIO', false),
  ('87000000-0000-0000-0000-000000000302', '85000000-0000-0000-0000-000000000003', null, 'ESCRIBIR "Hola"', false),
  ('87000000-0000-0000-0000-000000000303', '85000000-0000-0000-0000-000000000003', null, 'FIN', false);

-- ── Leccion 2: Reglas y convenciones del pseudocódigo
insert into leccion (id, nivel_id, orden, titulo, teoria) values
  ('84000000-0000-0000-0000-000000000002', (select id from _n3), 2, 'Reglas y convenciones del pseudocódigo', $json$[{"titulo":"Convenciones más usadas","texto":"Para escribir pseudocódigo correctamente, las instrucciones deben estar organizadas, ser comprensibles y mantener una estructura coherente.\n\n• INICIO: indica el comienzo del algoritmo.\n• FIN: indica el final.\n• LEER: permite recibir datos.\n• ESCRIBIR: muestra información al usuario.\n• ←: representa la asignación de un valor a una variable.\n• SI ... ENTONCES: permite tomar decisiones según una condición.","codigo":null,"grafico":null},{"titulo":"La indentación","texto":"La indentación consiste en dejar espacios al inicio de las instrucciones internas para facilitar su lectura.","codigo":null,"grafico":null},{"titulo":"Ejemplo con una decisión","texto":"El algoritmo recibe una edad y muestra un mensaje según el valor ingresado.","codigo":"INICIO\n    LEER edad\n    SI edad >= 18 ENTONCES\n        ESCRIBIR \"Mayor de edad\"\n    FIN SI\nFIN","grafico":null}]$json$::jsonb);
insert into ejercicio (id, nivel_id, leccion_id, tipo, enunciado, puntos_base, orden, pista, codigo, traza) values
  ('85000000-0000-0000-0000-000000000006', (select id from _n3), '84000000-0000-0000-0000-000000000002', 'completar_codigo', 'Completa el código para mostrar el mensaje Bienvenido.', 20, 6, 'La instrucción debe presentar un mensaje en pantalla.', 'INICIO
    ______ "Bienvenido"
FIN', $json${"titulo":"Así funciona tu pseudocódigo","entrada":null,"lineas":["INICIO","    ESCRIBIR \"Bienvenido\"","FIN"],"pasos":[{"l":0,"texto":"INICIO: el algoritmo comienza."},{"l":1,"texto":"ESCRIBIR muestra el mensaje en la pantalla.","salida":"Bienvenido"},{"l":2,"texto":"FIN: el algoritmo termina."}],"modo":"codigo"}$json$::jsonb),
  ('85000000-0000-0000-0000-000000000007', (select id from _n3), '84000000-0000-0000-0000-000000000002', 'teoria', '¿Qué significa la siguiente instrucción?', 20, 7, 'La flecha representa el almacenamiento de un valor en una variable.', 'contador ← 10', $json${"titulo":"Así funciona la asignación","entrada":null,"lineas":["contador ← 10"],"pasos":[{"l":0,"texto":"La flecha ← guarda el valor 10 dentro de la variable contador.","vars":{"contador":10}}],"modo":"codigo"}$json$::jsonb),
  ('85000000-0000-0000-0000-000000000008', (select id from _n3), '84000000-0000-0000-0000-000000000002', 'diagrama_flujo', 'Ordena los bloques para representar un algoritmo que lee un número y luego lo muestra.', 20, 8, 'El algoritmo primero comienza, después recibe el dato, lo presenta y finalmente termina.', null, $json${"titulo":"¡Diagrama completado! Así se ejecuta","entrada":"Supongamos que el usuario escribe 7.","lineas":[["Inicio","ini"],["Leer el número","io"],["Mostrar el número","io"],["Fin","fin"]],"pasos":[{"l":0,"texto":"El algoritmo comienza en el óvalo de Inicio."},{"l":1,"texto":"El paralelogramo de entrada recibe el dato: el usuario escribe 7 y se guarda.","vars":{"número":7}},{"l":2,"texto":"El paralelogramo de salida muestra el número guardado.","salida":"7"},{"l":3,"texto":"El óvalo de Fin termina el algoritmo."}],"modo":"diagrama"}$json$::jsonb),
  ('85000000-0000-0000-0000-000000000009', (select id from _n3), '84000000-0000-0000-0000-000000000002', 'teoria', '¿Qué instrucción permite comprobar si una persona tiene 18 años o más?', 20, 9, 'Busca la estructura que permite evaluar una expresión verdadera o falsa.', null, $json${"titulo":"Así funciona la decisión","entrada":"Supongamos que el usuario escribe 20.","lineas":["INICIO","    LEER edad","    SI edad >= 18 ENTONCES","        ESCRIBIR \"Mayor de edad\"","    FIN SI","FIN"],"pasos":[{"l":0,"texto":"INICIO: el algoritmo comienza."},{"l":1,"texto":"LEER guarda en edad el valor que escribe el usuario: 20.","vars":{"edad":20}},{"l":2,"texto":"SI evalúa la condición: 20 >= 18 es VERDADERO, así que se entra al bloque."},{"l":3,"texto":"Como la condición se cumple, ESCRIBIR muestra el mensaje.","salida":"Mayor de edad"},{"l":4,"texto":"FIN SI cierra la decisión."},{"l":5,"texto":"FIN: el algoritmo termina."}],"modo":"codigo"}$json$::jsonb),
  ('85000000-0000-0000-0000-000000000010', (select id from _n3), '84000000-0000-0000-0000-000000000002', 'comparar_codigo', '¿Cuál de los siguientes pseudocódigos presenta una estructura correcta para leer y mostrar una edad?', 20, 10, 'El algoritmo debe comenzar antes de ejecutar las instrucciones y recibir el dato antes de mostrarlo.', null, $json${"titulo":"Así funciona el algoritmo correcto","entrada":"Supongamos que el usuario escribe 25.","lineas":["INICIO","    LEER edad","    ESCRIBIR edad","FIN"],"pasos":[{"l":0,"texto":"INICIO: el algoritmo comienza."},{"l":1,"texto":"LEER guarda el dato que escribe el usuario en la variable edad.","vars":{"edad":25}},{"l":2,"texto":"ESCRIBIR muestra el valor que hay en edad.","salida":"25"},{"l":3,"texto":"FIN: el algoritmo termina."}],"modo":"codigo"}$json$::jsonb);
insert into alternativa (id, ejercicio_id, texto, es_correcta) values
  ('86000000-0000-0000-0000-000000000061', '85000000-0000-0000-0000-000000000006', 'LEER', false),
  ('86000000-0000-0000-0000-000000000062', '85000000-0000-0000-0000-000000000006', 'ESCRIBIR', true),
  ('86000000-0000-0000-0000-000000000063', '85000000-0000-0000-0000-000000000006', 'SI', false),
  ('86000000-0000-0000-0000-000000000064', '85000000-0000-0000-0000-000000000006', 'FIN', false),
  ('86000000-0000-0000-0000-000000000071', '85000000-0000-0000-0000-000000000007', 'Se solicita al usuario que ingrese diez datos.', false),
  ('86000000-0000-0000-0000-000000000072', '85000000-0000-0000-0000-000000000007', 'Se muestra el número diez en pantalla.', false),
  ('86000000-0000-0000-0000-000000000073', '85000000-0000-0000-0000-000000000007', 'Se asigna el valor 10 a la variable contador.', true),
  ('86000000-0000-0000-0000-000000000074', '85000000-0000-0000-0000-000000000007', 'Se termina el algoritmo.', false),
  ('86000000-0000-0000-0000-000000000091', '85000000-0000-0000-0000-000000000009', 'ESCRIBIR edad', false),
  ('86000000-0000-0000-0000-000000000092', '85000000-0000-0000-0000-000000000009', 'LEER edad', false),
  ('86000000-0000-0000-0000-000000000093', '85000000-0000-0000-0000-000000000009', 'SI edad >= 18 ENTONCES', true),
  ('86000000-0000-0000-0000-000000000094', '85000000-0000-0000-0000-000000000009', 'edad ← 18', false),
  ('86000000-0000-0000-0000-000000000101', '85000000-0000-0000-0000-000000000010', 'FIN
LEER edad
INICIO', false),
  ('86000000-0000-0000-0000-000000000102', '85000000-0000-0000-0000-000000000010', 'INICIO
    LEER edad
    ESCRIBIR edad
FIN', true),
  ('86000000-0000-0000-0000-000000000103', '85000000-0000-0000-0000-000000000010', 'ESCRIBIR edad
FIN
LEER edad', false),
  ('86000000-0000-0000-0000-000000000104', '85000000-0000-0000-0000-000000000010', 'LEER edad
INICIO
FIN', false);
insert into caso_prueba (id, ejercicio_id, entrada, salida_esperada, es_oculto) values
  ('87000000-0000-0000-0000-000000000801', '85000000-0000-0000-0000-000000000008', 'ini', 'Inicio', false),
  ('87000000-0000-0000-0000-000000000802', '85000000-0000-0000-0000-000000000008', 'io', 'Leer el número', false),
  ('87000000-0000-0000-0000-000000000803', '85000000-0000-0000-0000-000000000008', 'io', 'Mostrar el número', false),
  ('87000000-0000-0000-0000-000000000804', '85000000-0000-0000-0000-000000000008', 'fin', 'Fin', false);

-- ── Leccion 3: Tipos de datos básicos
insert into leccion (id, nivel_id, orden, titulo, teoria) values
  ('84000000-0000-0000-0000-000000000003', (select id from _n3), 3, 'Tipos de datos básicos', $json$[{"titulo":"¿Qué es un tipo de dato?","texto":"Los tipos de datos indican qué clase de información puede almacenar una variable. Elegir el tipo correcto ayuda a realizar operaciones adecuadas y evitar errores.","codigo":null,"grafico":null},{"titulo":"Entero y real","texto":"1. Entero (entero): almacena números sin parte decimal.\nEjemplos: 5, 0, -12, 100.\nUso habitual: edad en años completos, cantidad de productos o número de estudiantes.\n\n2. Real (real): almacena números que pueden tener parte decimal.\nEjemplos: 3.5, 18.75, 0.25.\nUso habitual: precios, estaturas, pesos o promedios.","codigo":null,"grafico":null},{"titulo":"Cadena y booleano","texto":"3. Cadena (cadena): almacena texto formado por letras, números y otros caracteres.\nEjemplos: \"María\", \"Hola mundo\", \"U12345678\".\nUso habitual: nombres, direcciones y códigos de identificación.\n\n4. Booleano (booleano): almacena únicamente dos valores lógicos: VERDADERO o FALSO.\nUso habitual: determinar si un usuario está activo o si una condición se cumple.","codigo":null,"grafico":null},{"titulo":"Importante","texto":"Un número puede ser entero o real según cómo se represente y se utilice. Un código de identificación que contiene números no necesariamente es un dato numérico; si identifica a una persona, normalmente se almacena como cadena.","codigo":null,"grafico":null}]$json$::jsonb);
insert into ejercicio (id, nivel_id, leccion_id, tipo, enunciado, puntos_base, orden, pista, codigo, traza) values
  ('85000000-0000-0000-0000-000000000011', (select id from _n3), '84000000-0000-0000-0000-000000000003', 'teoria', 'La variable cantidadAlumnos almacena el número 35. ¿Qué tipo de dato corresponde?', 20, 11, 'El valor no tiene parte decimal.', null, null),
  ('85000000-0000-0000-0000-000000000012', (select id from _n3), '84000000-0000-0000-0000-000000000003', 'teoria', 'La variable promedio almacena el valor 16.75. ¿Qué tipo de dato corresponde?', 20, 12, 'El número tiene una parte decimal.', null, null),
  ('85000000-0000-0000-0000-000000000013', (select id from _n3), '84000000-0000-0000-0000-000000000003', 'teoria', 'La variable codigoEstudiante almacena el valor "U12345678". ¿Qué tipo de dato corresponde?', 20, 13, 'Aunque contiene números, también incluye una letra y funciona como identificador.', null, null),
  ('85000000-0000-0000-0000-000000000014', (select id from _n3), '84000000-0000-0000-0000-000000000003', 'teoria', 'Una variable llamada usuarioActivo puede tener los valores VERDADERO o FALSO. ¿Qué tipo de dato debe utilizar?', 20, 14, 'Solo representa dos estados lógicos posibles.', null, null),
  ('85000000-0000-0000-0000-000000000015', (select id from _n3), '84000000-0000-0000-0000-000000000003', 'teoria', 'Relaciona cada variable con su tipo de dato.', 20, 15, 'Observa si el valor es un número sin decimales, un número decimal, texto o un estado lógico.', 'edad ← 20
precio ← 12.50
nombre ← "Carlos"
aprobado ← VERDADERO', null);
insert into alternativa (id, ejercicio_id, texto, es_correcta) values
  ('86000000-0000-0000-0000-000000000111', '85000000-0000-0000-0000-000000000011', 'Cadena', false),
  ('86000000-0000-0000-0000-000000000112', '85000000-0000-0000-0000-000000000011', 'Booleano', false),
  ('86000000-0000-0000-0000-000000000113', '85000000-0000-0000-0000-000000000011', 'Entero', true),
  ('86000000-0000-0000-0000-000000000114', '85000000-0000-0000-0000-000000000011', 'Real', false),
  ('86000000-0000-0000-0000-000000000121', '85000000-0000-0000-0000-000000000012', 'Entero', false),
  ('86000000-0000-0000-0000-000000000122', '85000000-0000-0000-0000-000000000012', 'Real', true),
  ('86000000-0000-0000-0000-000000000123', '85000000-0000-0000-0000-000000000012', 'Cadena', false),
  ('86000000-0000-0000-0000-000000000124', '85000000-0000-0000-0000-000000000012', 'Booleano', false),
  ('86000000-0000-0000-0000-000000000131', '85000000-0000-0000-0000-000000000013', 'Entero', false),
  ('86000000-0000-0000-0000-000000000132', '85000000-0000-0000-0000-000000000013', 'Real', false),
  ('86000000-0000-0000-0000-000000000133', '85000000-0000-0000-0000-000000000013', 'Booleano', false),
  ('86000000-0000-0000-0000-000000000134', '85000000-0000-0000-0000-000000000013', 'Cadena', true),
  ('86000000-0000-0000-0000-000000000141', '85000000-0000-0000-0000-000000000014', 'Booleano', true),
  ('86000000-0000-0000-0000-000000000142', '85000000-0000-0000-0000-000000000014', 'Entero', false),
  ('86000000-0000-0000-0000-000000000143', '85000000-0000-0000-0000-000000000014', 'Cadena', false),
  ('86000000-0000-0000-0000-000000000144', '85000000-0000-0000-0000-000000000014', 'Real', false),
  ('86000000-0000-0000-0000-000000000151', '85000000-0000-0000-0000-000000000015', 'Entero, real, cadena, booleano.', true),
  ('86000000-0000-0000-0000-000000000152', '85000000-0000-0000-0000-000000000015', 'Real, entero, booleano, cadena.', false),
  ('86000000-0000-0000-0000-000000000153', '85000000-0000-0000-0000-000000000015', 'Cadena, real, entero, booleano.', false),
  ('86000000-0000-0000-0000-000000000154', '85000000-0000-0000-0000-000000000015', 'Booleano, cadena, real, entero.', false);

-- ── Leccion 4: Completar pseudocódigo y seleccionar el código correcto
insert into leccion (id, nivel_id, orden, titulo, teoria) values
  ('84000000-0000-0000-0000-000000000004', (select id from _n3), 4, 'Completar pseudocódigo y seleccionar el código correcto', $json$[{"titulo":"Variables y operaciones","texto":"Las variables permiten almacenar datos y utilizarlos durante la ejecución de un algoritmo. Para trabajar con ellas, se pueden realizar operaciones aritméticas, recibir datos y mostrar resultados.","codigo":null,"grafico":null},{"titulo":"Operadores básicos","texto":"• +: suma.\n• -: resta.\n• *: multiplicación.\n• /: división.\n• = o ==: comparación de igualdad, dependiendo de la convención utilizada.\n• > y <: comparan si un valor es mayor o menor que otro.\n• >= y <=: incluyen la igualdad en la comparación.\n\nEn esta lección, los ejercicios utilizan la asignación ← y el símbolo * para multiplicar.","codigo":null,"grafico":null}]$json$::jsonb);
insert into ejercicio (id, nivel_id, leccion_id, tipo, enunciado, puntos_base, orden, pista, codigo, traza) values
  ('85000000-0000-0000-0000-000000000016', (select id from _n3), '84000000-0000-0000-0000-000000000004', 'completar_codigo', 'El siguiente algoritmo solicita un número, lo multiplica por 3 y muestra el resultado. Elige el código correcto para completar ambos espacios.', 20, 16, 'El primer espacio debe calcular el triple del número; el segundo debe mostrar la variable que almacena ese cálculo.', 'INICIO
    LEER numero
    resultado ← ______
    ESCRIBIR ______
FIN', $json${"titulo":"Así funciona tu pseudocódigo","entrada":"Supongamos que el usuario escribe 5.","lineas":["INICIO","    LEER numero","    resultado ← numero * 3","    ESCRIBIR resultado","FIN"],"pasos":[{"l":0,"texto":"INICIO: el algoritmo comienza."},{"l":1,"texto":"LEER guarda el dato que escribe el usuario: 5.","vars":{"numero":5}},{"l":2,"texto":"Se calcula 5 * 3 = 15 y el resultado se guarda en la variable resultado.","vars":{"resultado":15}},{"l":3,"texto":"ESCRIBIR muestra el valor de resultado.","salida":"15"},{"l":4,"texto":"FIN: el algoritmo termina."}],"modo":"codigo"}$json$::jsonb),
  ('85000000-0000-0000-0000-000000000017', (select id from _n3), '84000000-0000-0000-0000-000000000004', 'comparar_codigo', 'Se desea ingresar dos números y mostrar su suma. ¿Cuál algoritmo cumple el objetivo?', 20, 17, 'Los dos números deben leerse antes de calcular la suma y mostrar el resultado almacenado.', null, $json${"titulo":"Así funciona el algoritmo correcto","entrada":"Supongamos que el usuario escribe 4 y después 6.","lineas":["INICIO","    LEER a","    LEER b","    suma ← a + b","    ESCRIBIR suma","FIN"],"pasos":[{"l":0,"texto":"INICIO: el algoritmo comienza."},{"l":1,"texto":"Primer LEER: el usuario escribe 4 y se guarda en a.","vars":{"a":4}},{"l":2,"texto":"Segundo LEER: el usuario escribe 6 y se guarda en b.","vars":{"b":6}},{"l":3,"texto":"Se calcula 4 + 6 = 10 y se guarda en suma.","vars":{"suma":10}},{"l":4,"texto":"ESCRIBIR muestra el valor de suma.","salida":"10"},{"l":5,"texto":"FIN: el algoritmo termina."}],"modo":"codigo"}$json$::jsonb),
  ('85000000-0000-0000-0000-000000000018', (select id from _n3), '84000000-0000-0000-0000-000000000004', 'completar_codigo', 'Completa el código para calcular cuánto dinero queda después de gastar una cantidad.', 20, 18, 'El dinero restante se obtiene quitando el gasto al dinero inicial.', 'INICIO
    LEER dineroInicial
    LEER gasto
    dineroRestante ← ______
    ESCRIBIR dineroRestante
FIN', $json${"titulo":"Así funciona tu pseudocódigo","entrada":"Supongamos que el usuario escribe 100 y después 30.","lineas":["INICIO","    LEER dineroInicial","    LEER gasto","    dineroRestante ← dineroInicial - gasto","    ESCRIBIR dineroRestante","FIN"],"pasos":[{"l":0,"texto":"INICIO: el algoritmo comienza."},{"l":1,"texto":"LEER guarda 100 en dineroInicial.","vars":{"dineroInicial":100}},{"l":2,"texto":"LEER guarda 30 en gasto.","vars":{"gasto":30}},{"l":3,"texto":"Se calcula 100 - 30 = 70 y se guarda en dineroRestante.","vars":{"dineroRestante":70}},{"l":4,"texto":"ESCRIBIR muestra cuánto dinero queda.","salida":"70"},{"l":5,"texto":"FIN: el algoritmo termina."}],"modo":"codigo"}$json$::jsonb),
  ('85000000-0000-0000-0000-000000000019', (select id from _n3), '84000000-0000-0000-0000-000000000004', 'teoria', 'Observa el algoritmo. ¿Qué resultado se muestra?', 20, 19, 'Multiplica el valor almacenado en numero por tres.', 'INICIO
    numero ← 4
    resultado ← numero * 3
    ESCRIBIR resultado
FIN', $json${"titulo":"Así se ejecuta el algoritmo","entrada":null,"lineas":["INICIO","    numero ← 4","    resultado ← numero * 3","    ESCRIBIR resultado","FIN"],"pasos":[{"l":0,"texto":"INICIO: el algoritmo comienza."},{"l":1,"texto":"La asignación guarda el valor 4 en la variable numero.","vars":{"numero":4}},{"l":2,"texto":"Se calcula 4 * 3 = 12 y se guarda en resultado.","vars":{"resultado":12}},{"l":3,"texto":"ESCRIBIR muestra el valor de resultado.","salida":"12"},{"l":4,"texto":"FIN: el algoritmo termina."}],"modo":"codigo"}$json$::jsonb),
  ('85000000-0000-0000-0000-000000000020', (select id from _n3), '84000000-0000-0000-0000-000000000004', 'completar_codigo', 'Se desea determinar si un número es mayor que cero. ¿Cuál opción completa correctamente el algoritmo?', 20, 20, 'Un número positivo es estrictamente mayor que cero.', 'INICIO
    LEER numero
    SI ______ ENTONCES
        ESCRIBIR "Positivo"
    FIN SI
FIN', $json${"titulo":"Así funciona tu pseudocódigo","entrada":"Supongamos que el usuario escribe 7.","lineas":["INICIO","    LEER numero","    SI numero > 0 ENTONCES","        ESCRIBIR \"Positivo\"","    FIN SI","FIN"],"pasos":[{"l":0,"texto":"INICIO: el algoritmo comienza."},{"l":1,"texto":"LEER guarda en numero el valor que escribe el usuario: 7.","vars":{"numero":7}},{"l":2,"texto":"SI evalúa la condición: 7 > 0 es VERDADERO, así que se entra al bloque."},{"l":3,"texto":"ESCRIBIR muestra el mensaje.","salida":"Positivo"},{"l":4,"texto":"FIN SI cierra la decisión."},{"l":5,"texto":"FIN: el algoritmo termina."}],"modo":"codigo"}$json$::jsonb);
insert into alternativa (id, ejercicio_id, texto, es_correcta) values
  ('86000000-0000-0000-0000-000000000161', '85000000-0000-0000-0000-000000000016', 'numero + 3 y numero', false),
  ('86000000-0000-0000-0000-000000000162', '85000000-0000-0000-0000-000000000016', 'numero * 3 y resultado', true),
  ('86000000-0000-0000-0000-000000000163', '85000000-0000-0000-0000-000000000016', 'numero - 3 y numero', false),
  ('86000000-0000-0000-0000-000000000164', '85000000-0000-0000-0000-000000000016', 'numero / 3 y numero', false),
  ('86000000-0000-0000-0000-000000000171', '85000000-0000-0000-0000-000000000017', 'INICIO
    LEER a
    LEER b
    suma ← a + b
    ESCRIBIR suma
FIN', true),
  ('86000000-0000-0000-0000-000000000172', '85000000-0000-0000-0000-000000000017', 'INICIO
    LEER a
    suma ← a + b
    LEER b
    ESCRIBIR a
FIN', false),
  ('86000000-0000-0000-0000-000000000173', '85000000-0000-0000-0000-000000000017', 'INICIO
    LEER a
    LEER b
    suma ← a * b
    ESCRIBIR suma
FIN', false),
  ('86000000-0000-0000-0000-000000000174', '85000000-0000-0000-0000-000000000017', 'INICIO
    ESCRIBIR suma
    LEER a
    LEER b
FIN', false),
  ('86000000-0000-0000-0000-000000000181', '85000000-0000-0000-0000-000000000018', 'dineroInicial + gasto', false),
  ('86000000-0000-0000-0000-000000000182', '85000000-0000-0000-0000-000000000018', 'dineroInicial * gasto', false),
  ('86000000-0000-0000-0000-000000000183', '85000000-0000-0000-0000-000000000018', 'dineroInicial - gasto', true),
  ('86000000-0000-0000-0000-000000000184', '85000000-0000-0000-0000-000000000018', 'gasto - dineroInicial', false),
  ('86000000-0000-0000-0000-000000000191', '85000000-0000-0000-0000-000000000019', '7', false),
  ('86000000-0000-0000-0000-000000000192', '85000000-0000-0000-0000-000000000019', '12', true),
  ('86000000-0000-0000-0000-000000000193', '85000000-0000-0000-0000-000000000019', '1', false),
  ('86000000-0000-0000-0000-000000000194', '85000000-0000-0000-0000-000000000019', '43', false),
  ('86000000-0000-0000-0000-000000000201', '85000000-0000-0000-0000-000000000020', 'numero < 0', false),
  ('86000000-0000-0000-0000-000000000202', '85000000-0000-0000-0000-000000000020', 'numero = 0', false),
  ('86000000-0000-0000-0000-000000000203', '85000000-0000-0000-0000-000000000020', 'numero > 0', true),
  ('86000000-0000-0000-0000-000000000204', '85000000-0000-0000-0000-000000000020', 'numero ← 0', false);

-- ── Leccion 5: Diagramas de flujo y resolución de problemas
insert into leccion (id, nivel_id, orden, titulo, teoria) values
  ('84000000-0000-0000-0000-000000000005', (select id from _n3), 5, 'Diagramas de flujo y resolución de problemas', $json$[{"titulo":"¿Qué es un diagrama de flujo?","texto":"Un diagrama de flujo representa gráficamente los pasos de un algoritmo mediante símbolos conectados por flechas. Permite comprender visualmente el orden de ejecución de un programa.","codigo":null,"grafico":null},{"titulo":"Símbolos principales","texto":"• Óvalo (inicio y fin): indica dónde comienza o termina el algoritmo.\n• Rectángulo (proceso): representa operaciones, cálculos o asignaciones.\n• Paralelogramo (entrada o salida): representa la lectura de datos o la presentación de resultados.\n• Rombo (decisión): evalúa una condición y permite seguir caminos diferentes, como Sí y No.\n• Flecha (línea de flujo): indica la dirección y el orden de ejecución.","codigo":null,"grafico":null},{"titulo":"Cómo resolver un problema","texto":"Para resolver un problema mediante pseudocódigo o un diagrama de flujo, primero se identifican los datos de entrada, luego los procesos necesarios, después las decisiones que correspondan y finalmente las salidas.","codigo":null,"grafico":null}]$json$::jsonb);
insert into ejercicio (id, nivel_id, leccion_id, tipo, enunciado, puntos_base, orden, pista, codigo, traza) values
  ('85000000-0000-0000-0000-000000000021', (select id from _n3), '84000000-0000-0000-0000-000000000005', 'diagrama_flujo', 'Ordena los bloques para crear un algoritmo que lea un número y muestre su doble.', 20, 21, 'Primero comienza el algoritmo, después recibe el número, realiza el cálculo, muestra el resultado y termina.', null, $json${"titulo":"¡Diagrama completado! Así se ejecuta","entrada":"Supongamos que el usuario escribe 6.","lineas":[["Inicio","ini"],["Leer numero","io"],["doble ← numero × 2","proc"],["Mostrar doble","io"],["Fin","fin"]],"pasos":[{"l":0,"texto":"El algoritmo comienza en el óvalo de Inicio."},{"l":1,"texto":"El paralelogramo de entrada recibe el dato: el usuario escribe 6.","vars":{"numero":6}},{"l":2,"texto":"El rectángulo de proceso calcula 6 × 2 = 12 y lo guarda en doble.","vars":{"doble":12}},{"l":3,"texto":"El paralelogramo de salida muestra el valor de doble.","salida":"12"},{"l":4,"texto":"El óvalo de Fin termina el algoritmo."}],"modo":"diagrama"}$json$::jsonb),
  ('85000000-0000-0000-0000-000000000022', (select id from _n3), '84000000-0000-0000-0000-000000000005', 'teoria', '¿Qué símbolo se utiliza para representar una decisión en un diagrama de flujo?', 20, 22, 'Este símbolo se utiliza cuando una condición puede producir una respuesta de tipo Sí o No.', null, null),
  ('85000000-0000-0000-0000-000000000023', (select id from _n3), '84000000-0000-0000-0000-000000000005', 'completar_codigo', 'El algoritmo debe leer la edad de una persona y mostrar Mayor de edad cuando tenga 18 años o más. ¿Qué condición se debe utilizar?', 20, 23, 'La condición debe incluir tanto el valor 18 como todos los números mayores.', 'INICIO
    LEER edad
    SI ______ ENTONCES
        ESCRIBIR "Mayor de edad"
    FIN SI
FIN', $json${"titulo":"Así funciona tu pseudocódigo","entrada":"Supongamos que el usuario escribe 18.","lineas":["INICIO","    LEER edad","    SI edad >= 18 ENTONCES","        ESCRIBIR \"Mayor de edad\"","    FIN SI","FIN"],"pasos":[{"l":0,"texto":"INICIO: el algoritmo comienza."},{"l":1,"texto":"LEER guarda en edad el valor que escribe el usuario: 18.","vars":{"edad":18}},{"l":2,"texto":"SI evalúa la condición: 18 >= 18 es VERDADERO (el 18 también cuenta), así que se entra al bloque."},{"l":3,"texto":"ESCRIBIR muestra el mensaje.","salida":"Mayor de edad"},{"l":4,"texto":"FIN SI cierra la decisión."},{"l":5,"texto":"FIN: el algoritmo termina."}],"modo":"codigo"}$json$::jsonb),
  ('85000000-0000-0000-0000-000000000024', (select id from _n3), '84000000-0000-0000-0000-000000000005', 'teoria', 'Observa el algoritmo. ¿Qué mensaje se mostrará?', 20, 24, 'Evalúa si cinco es mayor que cero.', 'INICIO
    numero ← 5
    SI numero > 0 ENTONCES
        ESCRIBIR "Positivo"
    SI NO
        ESCRIBIR "No positivo"
    FIN SI
FIN', $json${"titulo":"Así se ejecuta el algoritmo","entrada":null,"lineas":["INICIO","    numero ← 5","    SI numero > 0 ENTONCES","        ESCRIBIR \"Positivo\"","    SI NO","        ESCRIBIR \"No positivo\"","    FIN SI","FIN"],"pasos":[{"l":0,"texto":"INICIO: el algoritmo comienza."},{"l":1,"texto":"La asignación guarda el valor 5 en la variable numero.","vars":{"numero":5}},{"l":2,"texto":"SI evalúa la condición: 5 > 0 es VERDADERO, así que se ejecuta el primer bloque."},{"l":3,"texto":"ESCRIBIR muestra el mensaje del primer bloque.","salida":"Positivo"},{"l":6,"texto":"Como la condición fue verdadera, el bloque SI NO se salta y el algoritmo continúa en FIN SI."},{"l":7,"texto":"FIN: el algoritmo termina."}],"modo":"codigo"}$json$::jsonb),
  ('85000000-0000-0000-0000-000000000025', (select id from _n3), '84000000-0000-0000-0000-000000000005', 'comparar_codigo', 'Se necesita calcular el promedio de dos notas. ¿Cuál opción presenta el algoritmo correcto?', 20, 25, 'Para calcular el promedio de dos notas, suma ambas y divide el resultado entre dos.', null, $json${"titulo":"Así funciona el algoritmo correcto","entrada":"Supongamos que el usuario escribe 14 y después 18.","lineas":["INICIO","    LEER nota1","    LEER nota2","    promedio ← (nota1 + nota2) / 2","    ESCRIBIR promedio","FIN"],"pasos":[{"l":0,"texto":"INICIO: el algoritmo comienza."},{"l":1,"texto":"Primer LEER: el usuario escribe 14 y se guarda en nota1.","vars":{"nota1":14}},{"l":2,"texto":"Segundo LEER: el usuario escribe 18 y se guarda en nota2.","vars":{"nota2":18}},{"l":3,"texto":"Primero se resuelve el paréntesis: 14 + 18 = 32. Luego se divide: 32 / 2 = 16. El resultado se guarda en promedio.","vars":{"promedio":16}},{"l":4,"texto":"ESCRIBIR muestra el valor de promedio.","salida":"16"},{"l":5,"texto":"FIN: el algoritmo termina."}],"modo":"codigo"}$json$::jsonb);
insert into alternativa (id, ejercicio_id, texto, es_correcta) values
  ('86000000-0000-0000-0000-000000000221', '85000000-0000-0000-0000-000000000022', 'Óvalo.', false),
  ('86000000-0000-0000-0000-000000000222', '85000000-0000-0000-0000-000000000022', 'Rombo.', true),
  ('86000000-0000-0000-0000-000000000223', '85000000-0000-0000-0000-000000000022', 'Rectángulo.', false),
  ('86000000-0000-0000-0000-000000000224', '85000000-0000-0000-0000-000000000022', 'Paralelogramo.', false),
  ('86000000-0000-0000-0000-000000000231', '85000000-0000-0000-0000-000000000023', 'edad > 18', false),
  ('86000000-0000-0000-0000-000000000232', '85000000-0000-0000-0000-000000000023', 'edad < 18', false),
  ('86000000-0000-0000-0000-000000000233', '85000000-0000-0000-0000-000000000023', 'edad >= 18', true),
  ('86000000-0000-0000-0000-000000000234', '85000000-0000-0000-0000-000000000023', 'edad = 0', false),
  ('86000000-0000-0000-0000-000000000241', '85000000-0000-0000-0000-000000000024', 'Positivo', true),
  ('86000000-0000-0000-0000-000000000242', '85000000-0000-0000-0000-000000000024', 'No positivo', false),
  ('86000000-0000-0000-0000-000000000243', '85000000-0000-0000-0000-000000000024', '5', false),
  ('86000000-0000-0000-0000-000000000244', '85000000-0000-0000-0000-000000000024', 'No se muestra ningún mensaje.', false),
  ('86000000-0000-0000-0000-000000000251', '85000000-0000-0000-0000-000000000025', 'INICIO
    LEER nota1
    LEER nota2
    promedio ← (nota1 + nota2) / 2
    ESCRIBIR promedio
FIN', true),
  ('86000000-0000-0000-0000-000000000252', '85000000-0000-0000-0000-000000000025', 'INICIO
    LEER nota1
    promedio ← nota1 / 2
    LEER nota2
    ESCRIBIR nota1
FIN', false),
  ('86000000-0000-0000-0000-000000000253', '85000000-0000-0000-0000-000000000025', 'INICIO
    LEER nota1
    LEER nota2
    promedio ← nota1 * nota2
    ESCRIBIR promedio
FIN', false),
  ('86000000-0000-0000-0000-000000000254', '85000000-0000-0000-0000-000000000025', 'INICIO
    ESCRIBIR promedio
    LEER nota1
    LEER nota2
FIN', false);
insert into caso_prueba (id, ejercicio_id, entrada, salida_esperada, es_oculto) values
  ('87000000-0000-0000-0000-000000002101', '85000000-0000-0000-0000-000000000021', 'ini', 'Inicio', false),
  ('87000000-0000-0000-0000-000000002102', '85000000-0000-0000-0000-000000000021', 'io', 'Leer numero', false),
  ('87000000-0000-0000-0000-000000002103', '85000000-0000-0000-0000-000000000021', 'proc', 'doble ← numero × 2', false),
  ('87000000-0000-0000-0000-000000002104', '85000000-0000-0000-0000-000000000021', 'io', 'Mostrar doble', false),
  ('87000000-0000-0000-0000-000000002105', '85000000-0000-0000-0000-000000000021', 'fin', 'Fin', false);

-- Comprobacion: debe dar 5 lecciones, 25 ejercicios, 88 alternativas (22 correctas), 12 bloques y 16 ejecuciones
select (select count(*) from leccion where nivel_id = (select id from _n3)) as lecciones,
       (select count(*) from ejercicio where nivel_id = (select id from _n3) and leccion_id is not null) as ejercicios,
       (select count(*) from alternativa a join ejercicio e on e.id = a.ejercicio_id where e.nivel_id = (select id from _n3)) as alternativas,
       (select count(*) from alternativa a join ejercicio e on e.id = a.ejercicio_id where e.nivel_id = (select id from _n3) and a.es_correcta) as correctas,
       (select count(*) from caso_prueba c join ejercicio e on e.id = c.ejercicio_id where e.nivel_id = (select id from _n3)) as bloques,
       (select count(*) from ejercicio where nivel_id = (select id from _n3) and traza is not null) as ejecuciones,
       (select count(*) from ejercicio where nivel_id = (select id from _n3) and pista is not null) as pistas;

commit;
