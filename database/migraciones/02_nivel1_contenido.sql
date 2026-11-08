-- =========================================================================================
-- while(no_aprendas) - CONTENIDO DEL NIVEL 1 DEL MUNDO 1 (5 lecciones, 35 preguntas, 140 alternativas)
-- Generado desde src/data/nivel1.js. Se puede ejecutar mas de una vez: no duplica filas (ids fijos).
-- Requiere haber ejecutado antes 01_cambios_necesarios.sql.
-- NOTA: la teoria de la LECCION 1 no llego en el material; los 3 textos son provisionales (edita la fila de leccion 1).
-- =========================================================================================

-- Todo o nada: si algo falla, no se cambia nada.
begin;

-- Cada ejercicio trae su pista (lo que da el comodin); la columna es opcional
alter table ejercicio add column if not exists pista text;

-- Paso 0a: si faltan, crea SOLO lo minimo que cuelga el nivel 1: el curso, la unidad 1 y el nivel 1.
-- No modifica nada que ya exista (cada pieza se crea solo si no esta).
do $crear$
declare v_curso uuid; v_unidad uuid; v_guia uuid;
begin
  select id into v_curso from curso order by (codigo = 'ALG-101') desc, id limit 1;
  if v_curso is null then
    insert into curso (codigo, nombre, descripcion)
    values ('ALG-101', 'Principios de Algoritmos', 'Curso introductorio de logica de programacion y algoritmos.')
    returning id into v_curso;
  end if;

  select id into v_unidad from unidad where curso_id = v_curso and orden = 1 limit 1;
  if v_unidad is null then
    select id into v_guia from personaje where id = 'd0000000-0000-0000-0000-000000000004';   -- CapyHeiner (si existe)
    insert into unidad (curso_id, nombre, descripcion, tema_visual, limite_comodines, orden, personaje_guia_id)
    values (v_curso, 'Unidad 1: Fundamentos de Algoritmos', 'Conceptos basicos sobre que es un algoritmo y sus caracteristicas.', 'pradera', 5, 1, v_guia)
    returning id into v_unidad;
  end if;

  if not exists (select 1 from nivel where unidad_id = v_unidad and orden = 1) then
    insert into nivel (unidad_id, nombre, dificultad, orden)
    values (v_unidad, 'Nivel 1: Que es un algoritmo?', 'facil', 1);
  end if;
end $crear$;

-- Localiza el nivel 1 de la unidad 1 por su POSICION (no depende de ningun id fijo).
drop table if exists _n1;
create temp table _n1 as
  select n.id from nivel n join unidad u on u.id = n.unidad_id
  where n.orden = 1 and u.orden = 1
  order by n.id limit 1;
do $chk$ begin
  if not exists (select 1 from _n1) then
    raise exception 'No se pudo preparar el nivel 1 de la unidad 1. Revisa con: select u.orden as unidad, n.orden as nivel, n.id from unidad u left join nivel n on n.unidad_id = u.id order by 1, 2;';
  end if;
end $chk$;

-- Paso 0b: reemplaza el contenido de ejemplo del nivel 1 (las 5 preguntas del seed antiguo, que no pertenecen a ninguna
-- leccion). Sus alternativas y los intentos de prueba asociados se borran en cascada. No toca otros niveles.
delete from ejercicio
where nivel_id = (select id from _n1) and leccion_id is null;

-- ── Leccion 1: Bienvenido a Principios de Algoritmos
insert into leccion (id, nivel_id, orden, titulo, teoria) values
  ('71000000-0000-0000-0000-000000000001', (select id from _n1), 1, 'Bienvenido a Principios de Algoritmos', $json$[{"titulo":"Bienvenido al curso","texto":"Principios de Algoritmos te enseña a resolver problemas mediante pasos lógicos y ordenados. Es la base para diseñar soluciones informáticas en Ingeniería de Sistemas e Informática.","codigo":null,"grafico":null},{"titulo":"Antes de escribir código","texto":"Antes de programar hay que analizar el problema y pensar en una solución.\n\nEjemplo: calcular el promedio de un estudiante mediante pasos ordenados.","codigo":null,"grafico":null},{"titulo":"Evaluación y dudas","texto":"El sistema de evaluación comprueba el aprendizaje según criterios establecidos. Puedes consultarlos en el sílabo y en las indicaciones del docente.\n\nSi no comprendes un ejercicio: analízalo, practica y consulta tus dudas.","codigo":null,"grafico":null}]$json$::jsonb)
on conflict (id) do nothing;
insert into ejercicio (id, nivel_id, leccion_id, tipo, enunciado, puntos_base, orden, pista) values
  ('72000000-0000-0000-0000-000000000001', (select id from _n1), '71000000-0000-0000-0000-000000000001', 'teoria', '¿Cuál es el objetivo principal del curso Principios de Algoritmos?', 20, 1, 'Fíjate en el nombre del curso: los algoritmos son pasos lógicos para resolver problemas.'),
  ('72000000-0000-0000-0000-000000000002', (select id from _n1), '71000000-0000-0000-0000-000000000001', 'teoria', '¿Qué debemos hacer antes de escribir el código de un programa?', 20, 2, 'Antes de programar hay que entender qué se pide y planear cómo resolverlo.'),
  ('72000000-0000-0000-0000-000000000003', (select id from _n1), '71000000-0000-0000-0000-000000000001', 'teoria', '¿Cuál de estas actividades se relaciona con el curso?', 20, 3, 'Busca la actividad que sigue pasos ordenados para obtener un resultado a partir de datos.'),
  ('72000000-0000-0000-0000-000000000004', (select id from _n1), '71000000-0000-0000-0000-000000000001', 'teoria', '¿Para qué sirve el sistema de evaluación de un curso?', 20, 4, 'Piensa en para qué se evalúa: se revisa si lo aprendido cumple los criterios del curso.'),
  ('72000000-0000-0000-0000-000000000005', (select id from _n1), '71000000-0000-0000-0000-000000000001', 'teoria', '¿Dónde puede consultar un estudiante los criterios de evaluación?', 20, 5, 'Es el documento que el curso entrega al inicio, junto con las indicaciones de quien lo dicta.'),
  ('72000000-0000-0000-0000-000000000006', (select id from _n1), '71000000-0000-0000-0000-000000000001', 'teoria', '¿Cómo ayuda este curso a un estudiante de Ingeniería de Sistemas e Informática?', 20, 6, 'El curso da fundamentos que luego sirven para crear soluciones informáticas.'),
  ('72000000-0000-0000-0000-000000000007', (select id from _n1), '71000000-0000-0000-0000-000000000001', 'teoria', '¿Qué debería hacer un estudiante si no comprende un ejercicio?', 20, 7, 'Una buena actitud combina entender el ejercicio, practicar y no quedarse con la duda.')
on conflict (id) do nothing;
insert into alternativa (id, ejercicio_id, texto, es_correcta) values
  ('73000000-0000-0000-0000-000000000011', '72000000-0000-0000-0000-000000000001', 'Aprender a reparar computadoras.', false),
  ('73000000-0000-0000-0000-000000000012', '72000000-0000-0000-0000-000000000001', 'Aprender a resolver problemas mediante pasos lógicos.', true),
  ('73000000-0000-0000-0000-000000000013', '72000000-0000-0000-0000-000000000001', 'Diseñar únicamente páginas web.', false),
  ('73000000-0000-0000-0000-000000000014', '72000000-0000-0000-0000-000000000001', 'Utilizar programas sin comprenderlos.', false),
  ('73000000-0000-0000-0000-000000000021', '72000000-0000-0000-0000-000000000002', 'Elegir los colores de la interfaz.', false),
  ('73000000-0000-0000-0000-000000000022', '72000000-0000-0000-0000-000000000002', 'Copiar otro programa.', false),
  ('73000000-0000-0000-0000-000000000023', '72000000-0000-0000-0000-000000000002', 'Analizar el problema y pensar en una solución.', true),
  ('73000000-0000-0000-0000-000000000024', '72000000-0000-0000-0000-000000000002', 'Instalar un videojuego.', false),
  ('73000000-0000-0000-0000-000000000031', '72000000-0000-0000-0000-000000000003', 'Calcular el promedio de un estudiante mediante pasos ordenados.', true),
  ('73000000-0000-0000-0000-000000000032', '72000000-0000-0000-0000-000000000003', 'Cambiar el fondo de pantalla.', false),
  ('73000000-0000-0000-0000-000000000033', '72000000-0000-0000-0000-000000000003', 'Limpiar el teclado.', false),
  ('73000000-0000-0000-0000-000000000034', '72000000-0000-0000-0000-000000000003', 'Escuchar música.', false),
  ('73000000-0000-0000-0000-000000000041', '72000000-0000-0000-0000-000000000004', 'Para evitar las prácticas.', false),
  ('73000000-0000-0000-0000-000000000042', '72000000-0000-0000-0000-000000000004', 'Para garantizar automáticamente la nota máxima.', false),
  ('73000000-0000-0000-0000-000000000043', '72000000-0000-0000-0000-000000000004', 'Para reemplazar las clases.', false),
  ('73000000-0000-0000-0000-000000000044', '72000000-0000-0000-0000-000000000004', 'Para comprobar el aprendizaje según criterios establecidos.', true),
  ('73000000-0000-0000-0000-000000000051', '72000000-0000-0000-0000-000000000005', 'En cualquier red social.', false),
  ('73000000-0000-0000-0000-000000000052', '72000000-0000-0000-0000-000000000005', 'En el sílabo y las indicaciones del docente.', true),
  ('73000000-0000-0000-0000-000000000053', '72000000-0000-0000-0000-000000000005', 'En un videojuego.', false),
  ('73000000-0000-0000-0000-000000000054', '72000000-0000-0000-0000-000000000005', 'En el nombre del curso solamente.', false),
  ('73000000-0000-0000-0000-000000000061', '72000000-0000-0000-0000-000000000006', 'Le enseña únicamente a ensamblar computadoras.', false),
  ('73000000-0000-0000-0000-000000000062', '72000000-0000-0000-0000-000000000006', 'Le permite evitar todos los demás cursos.', false),
  ('73000000-0000-0000-0000-000000000063', '72000000-0000-0000-0000-000000000006', 'Le proporciona bases para diseñar soluciones informáticas.', true),
  ('73000000-0000-0000-0000-000000000064', '72000000-0000-0000-0000-000000000006', 'Le enseña exclusivamente a utilizar redes sociales.', false),
  ('73000000-0000-0000-0000-000000000071', '72000000-0000-0000-0000-000000000007', 'Analizarlo, practicar y consultar sus dudas.', true),
  ('73000000-0000-0000-0000-000000000072', '72000000-0000-0000-0000-000000000007', 'Copiar la respuesta sin leerla.', false),
  ('73000000-0000-0000-0000-000000000073', '72000000-0000-0000-0000-000000000007', 'Abandonar el ejercicio.', false),
  ('73000000-0000-0000-0000-000000000074', '72000000-0000-0000-0000-000000000007', 'Inventar un resultado.', false)
on conflict (id) do nothing;

-- ── Leccion 2: ¿Qué es un algoritmo?
insert into leccion (id, nivel_id, orden, titulo, teoria) values
  ('71000000-0000-0000-0000-000000000002', (select id from _n1), 2, '¿Qué es un algoritmo?', $json$[{"titulo":"¿Qué es un algoritmo?","texto":"Un algoritmo es una secuencia ordenada de instrucciones que permite resolver un problema o realizar una tarea.\n\nLos algoritmos no se utilizan únicamente en las computadoras. También están presentes en actividades cotidianas, como seguir una receta, preparar una bebida o realizar una operación matemática.","codigo":null,"grafico":null},{"titulo":"Entrada, proceso y salida","texto":"Generalmente, un algoritmo trabaja con tres elementos:\n• Entrada: son los datos que recibe.\n• Proceso: son las operaciones que realiza.\n• Salida: es el resultado que obtiene.\n\nUn algoritmo puede representarse mediante lenguaje natural, pseudocódigo o diagramas de flujo, y después implementarse en un lenguaje de programación.","codigo":null,"grafico":null},{"titulo":"Ejemplo: sumar dos números","texto":"Para sumar dos números, recibimos los valores 5 y 3, realizamos la suma y obtenemos 8.","codigo":"Entrada: 5 y 3.\nProceso: 5 + 3.\nSalida: 8.","grafico":null}]$json$::jsonb)
on conflict (id) do nothing;
insert into ejercicio (id, nivel_id, leccion_id, tipo, enunciado, puntos_base, orden, pista) values
  ('72000000-0000-0000-0000-000000000008', (select id from _n1), '71000000-0000-0000-0000-000000000002', 'teoria', '¿Qué es un algoritmo?', 20, 8, 'Un algoritmo es una secuencia ordenada de pasos con un fin.'),
  ('72000000-0000-0000-0000-000000000009', (select id from _n1), '71000000-0000-0000-0000-000000000002', 'teoria', '¿Cuál de los siguientes es un ejemplo de algoritmo cotidiano?', 20, 9, 'Busca una actividad diaria que se hace siguiendo instrucciones en orden, una tras otra.'),
  ('72000000-0000-0000-0000-000000000010', (select id from _n1), '71000000-0000-0000-0000-000000000002', 'teoria', 'En una suma, ¿qué representan los números que ingresamos?', 20, 10, 'Son los datos que se le dan al algoritmo para que trabaje.'),
  ('72000000-0000-0000-0000-000000000011', (select id from _n1), '71000000-0000-0000-0000-000000000002', 'teoria', 'Si sumamos 5 + 3, ¿cuál es la salida?', 20, 11, 'La salida es el resultado que muestra el algoritmo: haz la suma.'),
  ('72000000-0000-0000-0000-000000000012', (select id from _n1), '71000000-0000-0000-0000-000000000002', 'teoria', '¿Cuál es el propósito de un algoritmo?', 20, 12, 'Piensa en lo que logra un algoritmo: guía los pasos hasta llegar a un resultado.'),
  ('72000000-0000-0000-0000-000000000013', (select id from _n1), '71000000-0000-0000-0000-000000000002', 'teoria', '¿Qué datos necesitamos para calcular el área de un rectángulo?', 20, 13, 'Para el área de un rectángulo se multiplican dos medidas: ¿cuáles son?'),
  ('72000000-0000-0000-0000-000000000014', (select id from _n1), '71000000-0000-0000-0000-000000000002', 'teoria', '¿Cómo se puede representar un algoritmo?', 20, 14, 'Piensa en las formas de explicar los pasos antes de programar: con palabras, con un código simplificado o con dibujos.')
on conflict (id) do nothing;
insert into alternativa (id, ejercicio_id, texto, es_correcta) values
  ('73000000-0000-0000-0000-000000000081', '72000000-0000-0000-0000-000000000008', 'Una pieza física de la computadora.', false),
  ('73000000-0000-0000-0000-000000000082', '72000000-0000-0000-0000-000000000008', 'Una secuencia de pasos para resolver un problema.', true),
  ('73000000-0000-0000-0000-000000000083', '72000000-0000-0000-0000-000000000008', 'Una marca de computadora.', false),
  ('73000000-0000-0000-0000-000000000084', '72000000-0000-0000-0000-000000000008', 'Un lenguaje de programación obligatorio.', false),
  ('73000000-0000-0000-0000-000000000091', '72000000-0000-0000-0000-000000000009', 'Mirar una pared.', false),
  ('73000000-0000-0000-0000-000000000092', '72000000-0000-0000-0000-000000000009', 'Escuchar un sonido.', false),
  ('73000000-0000-0000-0000-000000000093', '72000000-0000-0000-0000-000000000009', 'Observar una fotografía.', false),
  ('73000000-0000-0000-0000-000000000094', '72000000-0000-0000-0000-000000000009', 'Seguir una receta de cocina.', true),
  ('73000000-0000-0000-0000-000000000101', '72000000-0000-0000-0000-000000000010', 'Las entradas.', true),
  ('73000000-0000-0000-0000-000000000102', '72000000-0000-0000-0000-000000000010', 'Las salidas.', false),
  ('73000000-0000-0000-0000-000000000103', '72000000-0000-0000-0000-000000000010', 'Los errores.', false),
  ('73000000-0000-0000-0000-000000000104', '72000000-0000-0000-0000-000000000010', 'Los resultados finales.', false),
  ('73000000-0000-0000-0000-000000000111', '72000000-0000-0000-0000-000000000011', '5.', false),
  ('73000000-0000-0000-0000-000000000112', '72000000-0000-0000-0000-000000000011', '3.', false),
  ('73000000-0000-0000-0000-000000000113', '72000000-0000-0000-0000-000000000011', '8.', true),
  ('73000000-0000-0000-0000-000000000114', '72000000-0000-0000-0000-000000000011', '53.', false),
  ('73000000-0000-0000-0000-000000000121', '72000000-0000-0000-0000-000000000012', 'Complicar los problemas.', false),
  ('73000000-0000-0000-0000-000000000122', '72000000-0000-0000-0000-000000000012', 'Organizar los pasos para alcanzar un resultado.', true),
  ('73000000-0000-0000-0000-000000000123', '72000000-0000-0000-0000-000000000012', 'Evitar todo razonamiento.', false),
  ('73000000-0000-0000-0000-000000000124', '72000000-0000-0000-0000-000000000012', 'Crear datos sin propósito.', false),
  ('73000000-0000-0000-0000-000000000131', '72000000-0000-0000-0000-000000000013', 'Su color y su peso.', false),
  ('73000000-0000-0000-0000-000000000132', '72000000-0000-0000-0000-000000000013', 'El nombre de su creador.', false),
  ('73000000-0000-0000-0000-000000000133', '72000000-0000-0000-0000-000000000013', 'La marca de la computadora.', false),
  ('73000000-0000-0000-0000-000000000134', '72000000-0000-0000-0000-000000000013', 'Su base y su altura.', true),
  ('73000000-0000-0000-0000-000000000141', '72000000-0000-0000-0000-000000000014', 'Únicamente en Java.', false),
  ('73000000-0000-0000-0000-000000000142', '72000000-0000-0000-0000-000000000014', 'Solo mediante fotografías.', false),
  ('73000000-0000-0000-0000-000000000143', '72000000-0000-0000-0000-000000000014', 'Mediante lenguaje natural, pseudocódigo o diagramas de flujo.', true),
  ('73000000-0000-0000-0000-000000000144', '72000000-0000-0000-0000-000000000014', 'Únicamente en hojas de cálculo.', false)
on conflict (id) do nothing;

-- ── Leccion 3: Las características de un algoritmo
insert into leccion (id, nivel_id, orden, titulo, teoria) values
  ('71000000-0000-0000-0000-000000000003', (select id from _n1), 3, 'Las características de un algoritmo', $json$[{"titulo":"¿Qué hace útil a un algoritmo?","texto":"Para que un algoritmo sea útil, debe cumplir ciertas características que permitan comprenderlo y ejecutarlo correctamente.","codigo":null,"grafico":null},{"titulo":"Las características principales","texto":"• Preciso: sus instrucciones deben ser claras y no generar ambigüedades.\n• Definido: con las mismas entradas y condiciones, debe seguir el mismo procedimiento y producir el mismo resultado.\n• Finito: debe terminar después de una cantidad limitada de pasos.\n• Ordenado: sus instrucciones deben seguir una secuencia lógica.\n• Efectivo: sus instrucciones deben poder ejecutarse y contribuir a resolver el problema.\n\nUn algoritmo no necesita tener muchos pasos para ser bueno. Lo importante es que sea claro, realizable y adecuado para resolver la tarea.","codigo":null,"grafico":null},{"titulo":"Ejemplo: preparar una limonada","texto":"Para preparar una limonada, primero conseguimos los ingredientes, después exprimimos el limón, mezclamos los ingredientes y finalmente servimos la bebida. Si cambiamos el orden de los pasos, podríamos dificultar la preparación.","codigo":null,"grafico":null}]$json$::jsonb)
on conflict (id) do nothing;
insert into ejercicio (id, nivel_id, leccion_id, tipo, enunciado, puntos_base, orden, pista) values
  ('72000000-0000-0000-0000-000000000015', (select id from _n1), '71000000-0000-0000-0000-000000000003', 'teoria', '¿Qué significa que un algoritmo sea preciso?', 20, 15, 'Preciso significa que no deja dudas: cada instrucción se entiende de una sola manera.'),
  ('72000000-0000-0000-0000-000000000016', (select id from _n1), '71000000-0000-0000-0000-000000000003', 'teoria', '¿Qué significa que un algoritmo sea finito?', 20, 16, 'Finito tiene que ver con el final: ¿cuántos pasos tiene antes de terminar?'),
  ('72000000-0000-0000-0000-000000000017', (select id from _n1), '71000000-0000-0000-0000-000000000003', 'teoria', '¿Qué característica permite obtener el mismo resultado con las mismas entradas y condiciones?', 20, 17, 'Es la característica que hace que el resultado sea siempre el mismo con los mismos datos.'),
  ('72000000-0000-0000-0000-000000000018', (select id from _n1), '71000000-0000-0000-0000-000000000003', 'teoria', 'Una receta indica servir la comida antes de prepararla. ¿Cuál es el problema principal?', 20, 18, 'Fíjate en la secuencia: servir antes de preparar rompe el orden lógico.'),
  ('72000000-0000-0000-0000-000000000019', (select id from _n1), '71000000-0000-0000-0000-000000000003', 'teoria', '¿Cuál de las siguientes instrucciones es más precisa?', 20, 19, 'La instrucción más precisa dice exactamente qué hacer, con qué datos y qué mostrar.'),
  ('72000000-0000-0000-0000-000000000020', (select id from _n1), '71000000-0000-0000-0000-000000000003', 'teoria', 'Un algoritmo repite instrucciones infinitamente y nunca termina. ¿Qué característica incumple?', 20, 20, 'Si nunca termina, le falta tener un final: piensa en la característica relacionada con terminar.'),
  ('72000000-0000-0000-0000-000000000021', (select id from _n1), '71000000-0000-0000-0000-000000000003', 'teoria', '¿Qué significa que un algoritmo sea efectivo?', 20, 21, 'Efectivo: lo que dice se puede hacer de verdad y acerca a la solución.')
on conflict (id) do nothing;
insert into alternativa (id, ejercicio_id, texto, es_correcta) values
  ('73000000-0000-0000-0000-000000000151', '72000000-0000-0000-0000-000000000015', 'Que tenga muchos pasos.', false),
  ('73000000-0000-0000-0000-000000000152', '72000000-0000-0000-0000-000000000015', 'Que siempre utilice números.', false),
  ('73000000-0000-0000-0000-000000000153', '72000000-0000-0000-0000-000000000015', 'Que sus instrucciones sean claras y no ambiguas.', true),
  ('73000000-0000-0000-0000-000000000154', '72000000-0000-0000-0000-000000000015', 'Que nunca termine.', false),
  ('73000000-0000-0000-0000-000000000161', '72000000-0000-0000-0000-000000000016', 'Que termine después de una cantidad limitada de pasos.', true),
  ('73000000-0000-0000-0000-000000000162', '72000000-0000-0000-0000-000000000016', 'Que funcione eternamente.', false),
  ('73000000-0000-0000-0000-000000000163', '72000000-0000-0000-0000-000000000016', 'Que no reciba datos.', false),
  ('73000000-0000-0000-0000-000000000164', '72000000-0000-0000-0000-000000000016', 'Que solo utilice números pequeños.', false),
  ('73000000-0000-0000-0000-000000000171', '72000000-0000-0000-0000-000000000017', 'La decoración.', false),
  ('73000000-0000-0000-0000-000000000172', '72000000-0000-0000-0000-000000000017', 'El tamaño.', false),
  ('73000000-0000-0000-0000-000000000173', '72000000-0000-0000-0000-000000000017', 'La velocidad de internet.', false),
  ('73000000-0000-0000-0000-000000000174', '72000000-0000-0000-0000-000000000017', 'La definición o determinismo.', true),
  ('73000000-0000-0000-0000-000000000181', '72000000-0000-0000-0000-000000000018', 'Utiliza demasiados datos.', false),
  ('73000000-0000-0000-0000-000000000182', '72000000-0000-0000-0000-000000000018', 'Sus pasos están en un orden incorrecto.', true),
  ('73000000-0000-0000-0000-000000000183', '72000000-0000-0000-0000-000000000018', 'Tiene una salida.', false),
  ('73000000-0000-0000-0000-000000000184', '72000000-0000-0000-0000-000000000018', 'Es demasiado precisa.', false),
  ('73000000-0000-0000-0000-000000000191', '72000000-0000-0000-0000-000000000019', 'Haz algo con los números.', false),
  ('73000000-0000-0000-0000-000000000192', '72000000-0000-0000-0000-000000000019', 'Resuelve esto como puedas.', false),
  ('73000000-0000-0000-0000-000000000193', '72000000-0000-0000-0000-000000000019', 'Suma los dos números ingresados y muestra el resultado.', true),
  ('73000000-0000-0000-0000-000000000194', '72000000-0000-0000-0000-000000000019', 'Realiza alguna operación.', false),
  ('73000000-0000-0000-0000-000000000201', '72000000-0000-0000-0000-000000000020', 'Finitud.', true),
  ('73000000-0000-0000-0000-000000000202', '72000000-0000-0000-0000-000000000020', 'Diseño visual.', false),
  ('73000000-0000-0000-0000-000000000203', '72000000-0000-0000-0000-000000000020', 'Uso de internet.', false),
  ('73000000-0000-0000-0000-000000000204', '72000000-0000-0000-0000-000000000020', 'Nombre descriptivo.', false),
  ('73000000-0000-0000-0000-000000000211', '72000000-0000-0000-0000-000000000021', 'Que tenga una pantalla bonita.', false),
  ('73000000-0000-0000-0000-000000000212', '72000000-0000-0000-0000-000000000021', 'Que utilice internet.', false),
  ('73000000-0000-0000-0000-000000000213', '72000000-0000-0000-0000-000000000021', 'Que tenga muchas instrucciones innecesarias.', false),
  ('73000000-0000-0000-0000-000000000214', '72000000-0000-0000-0000-000000000021', 'Que sus pasos puedan ejecutarse y contribuyan a resolver el problema.', true)
on conflict (id) do nothing;

-- ── Leccion 4: La importancia de los algoritmos en la ingeniería
insert into leccion (id, nivel_id, orden, titulo, teoria) values
  ('71000000-0000-0000-0000-000000000004', (select id from _n1), 4, 'La importancia de los algoritmos en la ingeniería', $json$[{"titulo":"Algoritmos en la ingeniería","texto":"Los algoritmos son fundamentales en Ingeniería de Sistemas e Informática porque permiten diseñar soluciones lógicas y automatizar tareas.","codigo":null,"grafico":null},{"titulo":"Dónde se utilizan","texto":"• Sistemas de ventas: calcular precios, cantidades y totales.\n• Sistemas universitarios: calcular promedios y verificar condiciones de aprobación.\n• Aplicaciones de mapas: buscar rutas entre diferentes lugares.\n• Sistemas bancarios: procesar operaciones siguiendo reglas establecidas.\n• Desarrollo de software: transformar un problema en instrucciones que una computadora pueda ejecutar.\n\nUn algoritmo bien diseñado puede reducir errores y mejorar la eficiencia. Sin embargo, es importante probarlo para comprobar que funciona correctamente.","codigo":null,"grafico":null},{"titulo":"Ejemplo: una tienda","texto":"Una tienda vende tres productos a S/ 10 cada uno. El algoritmo multiplica la cantidad por el precio y muestra el total de S/ 30.","codigo":"Entrada: cantidad = 3 y precio = S/ 10.\nProceso: 3 × 10 = 30.\nSalida: S/ 30.","grafico":null}]$json$::jsonb)
on conflict (id) do nothing;
insert into ejercicio (id, nivel_id, leccion_id, tipo, enunciado, puntos_base, orden, pista) values
  ('72000000-0000-0000-0000-000000000022', (select id from _n1), '71000000-0000-0000-0000-000000000004', 'teoria', '¿Por qué son importantes los algoritmos en Ingeniería de Sistemas?', 20, 22, 'Los algoritmos permiten planear soluciones lógicas antes de construir el sistema.'),
  ('72000000-0000-0000-0000-000000000023', (select id from _n1), '71000000-0000-0000-0000-000000000004', 'teoria', '¿Qué operación podría realizar un algoritmo de un sistema de ventas?', 20, 23, 'Un sistema de ventas calcula totales: piensa en el precio y la cantidad.'),
  ('72000000-0000-0000-0000-000000000024', (select id from _n1), '71000000-0000-0000-0000-000000000004', 'teoria', '¿Qué relación existe entre un algoritmo y un programa?', 20, 24, 'Uno describe los pasos; el otro los escribe en un lenguaje que la computadora entiende.'),
  ('72000000-0000-0000-0000-000000000025', (select id from _n1), '71000000-0000-0000-0000-000000000004', 'teoria', '¿Qué aplicación de los algoritmos encontramos en los mapas digitales?', 20, 25, 'Los mapas digitales te indican cómo llegar de un punto a otro: ¿qué buscan?'),
  ('72000000-0000-0000-0000-000000000026', (select id from _n1), '71000000-0000-0000-0000-000000000004', 'teoria', '¿Qué puede ocurrir si el algoritmo de ventas tiene errores?', 20, 26, 'Si el cálculo tiene errores, el resultado que se muestra tampoco será correcto.'),
  ('72000000-0000-0000-0000-000000000027', (select id from _n1), '71000000-0000-0000-0000-000000000004', 'teoria', '¿Qué conviene hacer antes de implementar un algoritmo?', 20, 27, 'Antes de implementar conviene tener claro qué datos entran, qué debe salir y qué pasos hay.'),
  ('72000000-0000-0000-0000-000000000028', (select id from _n1), '71000000-0000-0000-0000-000000000004', 'teoria', '¿Por qué se deben probar los algoritmos?', 20, 28, 'Probar sirve para descubrir fallos y confirmar que el resultado es el esperado.')
on conflict (id) do nothing;
insert into alternativa (id, ejercicio_id, texto, es_correcta) values
  ('73000000-0000-0000-0000-000000000221', '72000000-0000-0000-0000-000000000022', 'Porque eliminan la necesidad de analizar.', false),
  ('73000000-0000-0000-0000-000000000222', '72000000-0000-0000-0000-000000000022', 'Porque reemplazan el hardware.', false),
  ('73000000-0000-0000-0000-000000000223', '72000000-0000-0000-0000-000000000022', 'Porque evitan aprender programación.', false),
  ('73000000-0000-0000-0000-000000000224', '72000000-0000-0000-0000-000000000022', 'Porque ayudan a diseñar soluciones lógicas para problemas.', true),
  ('73000000-0000-0000-0000-000000000231', '72000000-0000-0000-0000-000000000023', 'Cambiar el fondo de pantalla.', false),
  ('73000000-0000-0000-0000-000000000232', '72000000-0000-0000-0000-000000000023', 'Multiplicar el precio por la cantidad comprada.', true),
  ('73000000-0000-0000-0000-000000000233', '72000000-0000-0000-0000-000000000023', 'Reproducir cualquier canción.', false),
  ('73000000-0000-0000-0000-000000000234', '72000000-0000-0000-0000-000000000023', 'Cambiar el idioma del teclado.', false),
  ('73000000-0000-0000-0000-000000000241', '72000000-0000-0000-0000-000000000024', 'No tienen ninguna relación.', false),
  ('73000000-0000-0000-0000-000000000242', '72000000-0000-0000-0000-000000000024', 'Un programa no puede utilizar algoritmos.', false),
  ('73000000-0000-0000-0000-000000000243', '72000000-0000-0000-0000-000000000024', 'El algoritmo describe los pasos y el programa implementa la solución mediante código.', true),
  ('73000000-0000-0000-0000-000000000244', '72000000-0000-0000-0000-000000000024', 'El programa es el problema que se desea resolver.', false),
  ('73000000-0000-0000-0000-000000000251', '72000000-0000-0000-0000-000000000025', 'Buscar rutas entre lugares.', true),
  ('73000000-0000-0000-0000-000000000252', '72000000-0000-0000-0000-000000000025', 'Aumentar físicamente el tamaño del teléfono.', false),
  ('73000000-0000-0000-0000-000000000253', '72000000-0000-0000-0000-000000000025', 'Cambiar la batería del dispositivo.', false),
  ('73000000-0000-0000-0000-000000000254', '72000000-0000-0000-0000-000000000025', 'Limpiar la pantalla.', false),
  ('73000000-0000-0000-0000-000000000261', '72000000-0000-0000-0000-000000000026', 'Todos los cálculos serán perfectos.', false),
  ('73000000-0000-0000-0000-000000000262', '72000000-0000-0000-0000-000000000026', 'El equipo tendrá más memoria.', false),
  ('73000000-0000-0000-0000-000000000263', '72000000-0000-0000-0000-000000000026', 'Los precios se corregirán automáticamente.', false),
  ('73000000-0000-0000-0000-000000000264', '72000000-0000-0000-0000-000000000026', 'Puede calcular totales incorrectos.', true),
  ('73000000-0000-0000-0000-000000000271', '72000000-0000-0000-0000-000000000027', 'Copiar código sin revisarlo.', false),
  ('73000000-0000-0000-0000-000000000272', '72000000-0000-0000-0000-000000000027', 'Analizar las entradas, las salidas y los pasos de la solución.', true),
  ('73000000-0000-0000-0000-000000000273', '72000000-0000-0000-0000-000000000027', 'Evitar definir el problema.', false),
  ('73000000-0000-0000-0000-000000000274', '72000000-0000-0000-0000-000000000027', 'Elegir únicamente los colores.', false),
  ('73000000-0000-0000-0000-000000000281', '72000000-0000-0000-0000-000000000028', 'Para agregar instrucciones al azar.', false),
  ('73000000-0000-0000-0000-000000000282', '72000000-0000-0000-0000-000000000028', 'Para reemplazar el sílabo.', false),
  ('73000000-0000-0000-0000-000000000283', '72000000-0000-0000-0000-000000000028', 'Para detectar errores y comprobar que resuelvan correctamente el problema.', true),
  ('73000000-0000-0000-0000-000000000284', '72000000-0000-0000-0000-000000000028', 'Para evitar programar.', false)
on conflict (id) do nothing;

-- ── Leccion 5: Desafío final del programador
insert into leccion (id, nivel_id, orden, titulo, teoria) values
  ('71000000-0000-0000-0000-000000000005', (select id from _n1), 5, 'Desafío final del programador', $json$[{"titulo":"Repaso del nivel","texto":"En esta última lección repasaremos los conocimientos adquiridos durante el nivel.\n\nUn algoritmo es una secuencia ordenada de instrucciones que permite resolver un problema. Puede recibir datos de entrada, procesarlos y generar una salida.","codigo":null,"grafico":null},{"titulo":"Lo que debes recordar","texto":"Para que sea útil, un algoritmo debe ser preciso, definido, finito y efectivo. Sus pasos también deben seguir un orden lógico.\n\nEn Ingeniería de Sistemas e Informática, los algoritmos sirven para desarrollar programas, automatizar procesos, realizar cálculos y resolver problemas reales.\n\nAntes de programar, debemos analizar el problema, definir qué datos necesitamos y establecer qué resultado esperamos. Después podemos implementar la solución y probarla.","codigo":null,"grafico":null},{"titulo":"Ejemplo integrador","texto":"Una universidad necesita determinar si un estudiante aprobó.","codigo":"1. Entrada: nota del estudiante.\n2. Proceso: comparar la nota con la mínima aprobatoria establecida.\n3. Salida: indicar si aprobó o desaprobó.\n4. Prueba: comprobar diferentes notas para verificar que el algoritmo funcione correctamente.","grafico":null}]$json$::jsonb)
on conflict (id) do nothing;
insert into ejercicio (id, nivel_id, leccion_id, tipo, enunciado, puntos_base, orden, pista) values
  ('72000000-0000-0000-0000-000000000029', (select id from _n1), '71000000-0000-0000-0000-000000000005', 'teoria', '¿Cuál describe mejor un algoritmo?', 20, 29, 'Piensa en la definición: pasos ordenados para resolver un problema.'),
  ('72000000-0000-0000-0000-000000000030', (select id from _n1), '71000000-0000-0000-0000-000000000005', 'teoria', 'Un programa recibe dos números, los suma y muestra el total. ¿Cuál es la salida?', 20, 30, 'La salida es lo que el programa muestra al final: ¿qué obtiene al sumar?'),
  ('72000000-0000-0000-0000-000000000031', (select id from _n1), '71000000-0000-0000-0000-000000000005', 'teoria', 'Un algoritmo nunca termina debido a una repetición sin salida. ¿Qué característica incumple?', 20, 31, 'Una repetición sin salida no tiene final: piensa en la característica de terminar.'),
  ('72000000-0000-0000-0000-000000000032', (select id from _n1), '71000000-0000-0000-0000-000000000005', 'teoria', '¿Qué debería hacer un estudiante antes de desarrollar una solución informática?', 20, 32, 'Antes de resolver hay que entender el problema: ¿qué datos entran y qué se espera obtener?'),
  ('72000000-0000-0000-0000-000000000033', (select id from _n1), '71000000-0000-0000-0000-000000000005', 'teoria', '¿Qué característica permite que las instrucciones no sean ambiguas?', 20, 33, 'Piensa en la característica que evita las instrucciones con doble sentido.'),
  ('72000000-0000-0000-0000-000000000034', (select id from _n1), '71000000-0000-0000-0000-000000000005', 'teoria', 'Una tienda necesita calcular el costo de varios productos. ¿Por qué le sirve un algoritmo?', 20, 34, 'Calcular costos sigue pasos definidos: sumar los precios para llegar a un total.'),
  ('72000000-0000-0000-0000-000000000035', (select id from _n1), '71000000-0000-0000-0000-000000000005', 'teoria', '¿Cuál resume mejor la importancia de Principios de Algoritmos?', 20, 35, 'El curso enseña a razonar con lógica y deja la base para programar.')
on conflict (id) do nothing;
insert into alternativa (id, ejercicio_id, texto, es_correcta) values
  ('73000000-0000-0000-0000-000000000291', '72000000-0000-0000-0000-000000000029', 'Un dispositivo de almacenamiento.', false),
  ('73000000-0000-0000-0000-000000000292', '72000000-0000-0000-0000-000000000029', 'Una secuencia de instrucciones para resolver un problema.', true),
  ('73000000-0000-0000-0000-000000000293', '72000000-0000-0000-0000-000000000029', 'Una imagen de una aplicación.', false),
  ('73000000-0000-0000-0000-000000000294', '72000000-0000-0000-0000-000000000029', 'Un componente físico.', false),
  ('73000000-0000-0000-0000-000000000301', '72000000-0000-0000-0000-000000000030', 'Los dos números antes de sumarlos.', false),
  ('73000000-0000-0000-0000-000000000302', '72000000-0000-0000-0000-000000000030', 'El teclado.', false),
  ('73000000-0000-0000-0000-000000000303', '72000000-0000-0000-0000-000000000030', 'La operación pendiente.', false),
  ('73000000-0000-0000-0000-000000000304', '72000000-0000-0000-0000-000000000030', 'El resultado de la suma.', true),
  ('73000000-0000-0000-0000-000000000311', '72000000-0000-0000-0000-000000000031', 'Finitud.', true),
  ('73000000-0000-0000-0000-000000000312', '72000000-0000-0000-0000-000000000031', 'Diseño visual.', false),
  ('73000000-0000-0000-0000-000000000313', '72000000-0000-0000-0000-000000000031', 'Uso de internet.', false),
  ('73000000-0000-0000-0000-000000000314', '72000000-0000-0000-0000-000000000031', 'Nombre descriptivo.', false),
  ('73000000-0000-0000-0000-000000000321', '72000000-0000-0000-0000-000000000032', 'Escribir código sin analizar.', false),
  ('73000000-0000-0000-0000-000000000322', '72000000-0000-0000-0000-000000000032', 'Elegir una animación.', false),
  ('73000000-0000-0000-0000-000000000323', '72000000-0000-0000-0000-000000000032', 'Comprender el problema e identificar las entradas y los resultados esperados.', true),
  ('73000000-0000-0000-0000-000000000324', '72000000-0000-0000-0000-000000000032', 'Copiar un programa al azar.', false),
  ('73000000-0000-0000-0000-000000000331', '72000000-0000-0000-0000-000000000033', 'La cantidad de colores.', false),
  ('73000000-0000-0000-0000-000000000332', '72000000-0000-0000-0000-000000000033', 'La precisión.', true),
  ('73000000-0000-0000-0000-000000000333', '72000000-0000-0000-0000-000000000033', 'El tamaño de la pantalla.', false),
  ('73000000-0000-0000-0000-000000000334', '72000000-0000-0000-0000-000000000033', 'La velocidad del teclado.', false),
  ('73000000-0000-0000-0000-000000000341', '72000000-0000-0000-0000-000000000034', 'Para eliminar los precios.', false),
  ('73000000-0000-0000-0000-000000000342', '72000000-0000-0000-0000-000000000034', 'Para evitar registrar cantidades.', false),
  ('73000000-0000-0000-0000-000000000343', '72000000-0000-0000-0000-000000000034', 'Para cambiar las imágenes de los productos.', false),
  ('73000000-0000-0000-0000-000000000344', '72000000-0000-0000-0000-000000000034', 'Para definir los pasos del cálculo y obtener el total.', true),
  ('73000000-0000-0000-0000-000000000351', '72000000-0000-0000-0000-000000000035', 'Enseña a resolver problemas de forma lógica y proporciona bases para programar.', true),
  ('73000000-0000-0000-0000-000000000352', '72000000-0000-0000-0000-000000000035', 'Solo enseña a memorizar palabras.', false),
  ('73000000-0000-0000-0000-000000000353', '72000000-0000-0000-0000-000000000035', 'Evita que los futuros ingenieros realicen pruebas.', false),
  ('73000000-0000-0000-0000-000000000354', '72000000-0000-0000-0000-000000000035', 'Reemplaza todas las demás asignaturas.', false)
on conflict (id) do nothing;

-- Comprobacion: debe dar 5 lecciones, 35 preguntas y 140 alternativas (35 correctas)
select (select count(*) from leccion where nivel_id = (select id from _n1)) as lecciones,
       (select count(*) from ejercicio where nivel_id = (select id from _n1) and leccion_id is not null) as preguntas,
       (select count(*) from alternativa a join ejercicio e on e.id = a.ejercicio_id where e.nivel_id = (select id from _n1) and e.leccion_id is not null) as alternativas,
       (select count(*) from alternativa a join ejercicio e on e.id = a.ejercicio_id where e.nivel_id = (select id from _n1) and e.leccion_id is not null and a.es_correcta) as correctas;

commit;
