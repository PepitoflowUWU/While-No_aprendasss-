-- =========================================================================================
-- while(no_aprendas) - CONTENIDO DEL NIVEL 2 DEL MUNDO 1: Logica proposicional
-- 5 lecciones, 34 ejercicios (30 preguntas de 4 alternativas + 4 tablas de verdad),
-- 120 alternativas y 14 filas de tabla. Generado desde src/data/nivel2.js.
--
-- ORDEN: 1) 09a_tipo_tabla_verdad.sql (SOLO, en su propia ejecucion)  2) este archivo.
-- Requiere haber ejecutado antes 01 y 02. REEMPLAZA TODO el contenido del nivel 2 en la base (es seguro repetirlo);
-- no toca el nivel 1 ni los demas.
-- =========================================================================================

-- Todo o nada: si algo falla, no se cambia nada.
begin;

-- Cada ejercicio trae su pista (lo que da el comodin); la columna es opcional
alter table ejercicio add column if not exists pista text;

-- Comprobacion previa: el tipo "tabla_verdad" debe existir (se crea con 09a, en una ejecucion aparte)
do $chk$ begin
  if not exists (select 1 from pg_enum e join pg_type t on t.oid = e.enumtypid
                 where t.typname = 'ejercicio_tipo' and e.enumlabel = 'tabla_verdad') then
    raise exception 'Primero ejecuta 09a_tipo_tabla_verdad.sql (solo ese archivo, aparte) y despues este.';
  end if;
end $chk$;

-- El juego necesita leer las filas visibles de las tablas de verdad (los casos ocultos siguen sin ser legibles)
alter table caso_prueba enable row level security;
drop policy if exists "casos visibles" on caso_prueba;
create policy "casos visibles" on caso_prueba for select to anon, authenticated using (es_oculto = false);

-- Paso 0a: localiza (o crea) el nivel 2 de la unidad 1, por su POSICION.
do $crear$
declare v_unidad uuid;
begin
  select u.id into v_unidad from unidad u where u.orden = 1 order by u.id limit 1;
  if v_unidad is null then
    raise exception 'No existe la unidad 1. Ejecuta primero 02_nivel1_contenido.sql.';
  end if;
  if not exists (select 1 from nivel where unidad_id = v_unidad and orden = 2) then
    insert into nivel (unidad_id, nombre, dificultad, orden)
    values (v_unidad, 'Nivel 2: Logica proposicional', 'facil', 2);
  end if;
end $crear$;

drop table if exists _n2;
create temp table _n2 as
  select n.id from nivel n join unidad u on u.id = n.unidad_id
  where n.orden = 2 and u.orden = 1
  order by n.id limit 1;

-- Paso 0b: borra TODO el contenido anterior del nivel 2 (lecciones, preguntas, alternativas y filas de tabla)
delete from leccion   where nivel_id = (select id from _n2);
delete from ejercicio where nivel_id = (select id from _n2);

-- ── Leccion 1: Concepto y clases de proposiciones
insert into leccion (id, nivel_id, orden, titulo, teoria) values
  ('74000000-0000-0000-0000-000000000001', (select id from _n2), 1, 'Concepto y clases de proposiciones', $json$[{"titulo":"¿Qué es una proposición?","texto":"Una proposición lógica es un enunciado que puede ser verdadero (V) o falso (F), pero no ambos al mismo tiempo.\n\nEjemplos:\n• «2 + 3 = 5» → Verdadero (V).\n• «10 es menor que 4» → Falso (F).\n• «¿Qué hora es?» → No es una proposición, porque es una pregunta.","codigo":null,"grafico":null},{"titulo":"Clases de proposiciones","texto":"• Simple: expresa una sola idea y no contiene conectivos lógicos. Ejemplo: «El sol es una estrella».\n• Compuesta: combina dos o más proposiciones mediante conectivos lógicos. Ejemplo: «El sol es una estrella y la Tierra es un planeta».\n\nLas letras p, q y r representan proposiciones.","codigo":null,"grafico":null}]$json$::jsonb);
insert into ejercicio (id, nivel_id, leccion_id, tipo, enunciado, puntos_base, orden, pista) values
  ('75000000-0000-0000-0000-000000000001', (select id from _n2), '74000000-0000-0000-0000-000000000001', 'teoria', '¿Cuál de los siguientes enunciados es una proposición?', 20, 1, 'Una proposición se puede decir si es verdadera o falsa; una orden o una pregunta no.'),
  ('75000000-0000-0000-0000-000000000002', (select id from _n2), '74000000-0000-0000-0000-000000000001', 'teoria', '¿Cuál es una proposición falsa?', 20, 2, 'Revisa cada opción con los datos que conoces y busca la que no se cumple.'),
  ('75000000-0000-0000-0000-000000000003', (select id from _n2), '74000000-0000-0000-0000-000000000001', 'teoria', '¿Qué tipo de proposición es «La Luna es un satélite»?', 20, 3, 'Fíjate si expresa una sola idea o si une varias con conectivos como «y» u «o».'),
  ('75000000-0000-0000-0000-000000000004', (select id from _n2), '74000000-0000-0000-0000-000000000001', 'teoria', 'Si p: «Estudio programación» y q: «Practico algoritmos», ¿cuál es una proposición compuesta?', 20, 4, 'Una proposición compuesta une dos ideas con un conectivo lógico, por ejemplo «y».'),
  ('75000000-0000-0000-0000-000000000005', (select id from _n2), '74000000-0000-0000-0000-000000000001', 'teoria', '¿Cuál NO es una proposición lógica?', 20, 5, 'Las órdenes y las preguntas no pueden ser verdaderas ni falsas.'),
  ('75000000-0000-0000-0000-000000000006', (select id from _n2), '74000000-0000-0000-0000-000000000001', 'teoria', 'Si p: «El número 6 es par», ¿cuál es su valor de verdad?', 20, 6, 'Comprueba si el 6 se puede dividir exacto entre 2.');
insert into alternativa (id, ejercicio_id, texto, es_correcta) values
  ('76000000-0000-0000-0000-000000000011', '75000000-0000-0000-0000-000000000001', '¡Abre la puerta!', false),
  ('76000000-0000-0000-0000-000000000012', '75000000-0000-0000-0000-000000000001', '7 + 2 = 9', true),
  ('76000000-0000-0000-0000-000000000013', '75000000-0000-0000-0000-000000000001', '¿Vienes mañana?', false),
  ('76000000-0000-0000-0000-000000000014', '75000000-0000-0000-0000-000000000001', 'Cierra la ventana, por favor.', false),
  ('76000000-0000-0000-0000-000000000021', '75000000-0000-0000-0000-000000000002', '4 es mayor que 2.', false),
  ('76000000-0000-0000-0000-000000000022', '75000000-0000-0000-0000-000000000002', 'Lima está en Perú.', false),
  ('76000000-0000-0000-0000-000000000023', '75000000-0000-0000-0000-000000000002', '3 × 3 = 8.', true),
  ('76000000-0000-0000-0000-000000000024', '75000000-0000-0000-0000-000000000002', '5 es un número impar.', false),
  ('76000000-0000-0000-0000-000000000031', '75000000-0000-0000-0000-000000000003', 'Compuesta.', false),
  ('76000000-0000-0000-0000-000000000032', '75000000-0000-0000-0000-000000000003', 'Simple.', true),
  ('76000000-0000-0000-0000-000000000033', '75000000-0000-0000-0000-000000000003', 'Pregunta.', false),
  ('76000000-0000-0000-0000-000000000034', '75000000-0000-0000-0000-000000000003', 'Exclamación.', false),
  ('76000000-0000-0000-0000-000000000041', '75000000-0000-0000-0000-000000000004', 'Estudio programación.', false),
  ('76000000-0000-0000-0000-000000000042', '75000000-0000-0000-0000-000000000004', 'Practico algoritmos.', false),
  ('76000000-0000-0000-0000-000000000043', '75000000-0000-0000-0000-000000000004', 'Estudio programación y practico algoritmos.', true),
  ('76000000-0000-0000-0000-000000000044', '75000000-0000-0000-0000-000000000004', '¿Practico algoritmos hoy?', false),
  ('76000000-0000-0000-0000-000000000051', '75000000-0000-0000-0000-000000000005', '5 es un número impar.', false),
  ('76000000-0000-0000-0000-000000000052', '75000000-0000-0000-0000-000000000005', 'Cierra el cuaderno.', true),
  ('76000000-0000-0000-0000-000000000053', '75000000-0000-0000-0000-000000000005', '8 es mayor que 3.', false),
  ('76000000-0000-0000-0000-000000000054', '75000000-0000-0000-0000-000000000005', '12 es divisible entre 3.', false),
  ('76000000-0000-0000-0000-000000000061', '75000000-0000-0000-0000-000000000006', 'V.', true),
  ('76000000-0000-0000-0000-000000000062', '75000000-0000-0000-0000-000000000006', 'F.', false),
  ('76000000-0000-0000-0000-000000000063', '75000000-0000-0000-0000-000000000006', 'No tiene valor de verdad.', false),
  ('76000000-0000-0000-0000-000000000064', '75000000-0000-0000-0000-000000000006', 'V y F al mismo tiempo.', false);

-- ── Leccion 2: Conjunción (AND)
insert into leccion (id, nivel_id, orden, titulo, teoria) values
  ('74000000-0000-0000-0000-000000000002', (select id from _n2), 2, 'Conjunción (AND)', $json$[{"titulo":"La conjunción","texto":"La conjunción une dos proposiciones mediante la palabra «y». Se representa con el símbolo ∧.\n\nEjemplo:\n• p: Estudio.\n• q: Practico.\n• p ∧ q: Estudio y practico.\n\nLa conjunción solamente es verdadera cuando ambas proposiciones son verdaderas.","codigo":null,"grafico":null},{"titulo":"Tabla de verdad de p ∧ q","texto":"Observa que el resultado es V únicamente en la primera fila.","codigo":" p | q | p ∧ q\n---+---+------\n V | V |   V\n V | F |   F\n F | V |   F\n F | F |   F","grafico":null}]$json$::jsonb);
insert into ejercicio (id, nivel_id, leccion_id, tipo, enunciado, puntos_base, orden, pista) values
  ('75000000-0000-0000-0000-000000000007', (select id from _n2), '74000000-0000-0000-0000-000000000002', 'teoria', '¿Qué símbolo representa la conjunción?', 20, 7, 'Recuerda: la conjunción corresponde a «y» y la disyunción corresponde a «o».'),
  ('75000000-0000-0000-0000-000000000008', (select id from _n2), '74000000-0000-0000-0000-000000000002', 'teoria', 'Si p = V y q = V, calcula p ∧ q.', 20, 8, 'La conjunción solo es verdadera cuando las dos proposiciones son verdaderas.'),
  ('75000000-0000-0000-0000-000000000009', (select id from _n2), '74000000-0000-0000-0000-000000000002', 'teoria', 'Si p = V y q = F, calcula p ∧ q.', 20, 9, 'La conjunción solo es verdadera cuando las dos proposiciones son verdaderas.'),
  ('75000000-0000-0000-0000-000000000010', (select id from _n2), '74000000-0000-0000-0000-000000000002', 'teoria', 'Si p = F y q = V, calcula p ∧ q.', 20, 10, 'La conjunción solo es verdadera cuando las dos proposiciones son verdaderas.'),
  ('75000000-0000-0000-0000-000000000011', (select id from _n2), '74000000-0000-0000-0000-000000000002', 'teoria', 'Si p = F y q = F, calcula p ∧ q.', 20, 11, 'La conjunción solo es verdadera cuando las dos proposiciones son verdaderas.'),
  ('75000000-0000-0000-0000-000000000012', (select id from _n2), '74000000-0000-0000-0000-000000000002', 'teoria', 'p: «Tengo internet» (V). q: «La computadora está encendida» (F). ¿Es verdadera la expresión «Tengo internet y la computadora está encendida»?', 20, 12, 'Una conjunción necesita que ambas proposiciones sean verdaderas: revisa cada una.'),
  ('75000000-0000-0000-0000-000000000013', (select id from _n2), '74000000-0000-0000-0000-000000000002', 'tabla_verdad', 'Arma la tabla de verdad de p ∧ q: elige V o F en cada fila.', 20, 13, 'Fila por fila: p ∧ q solo da V cuando p y q valen V a la vez.');
insert into alternativa (id, ejercicio_id, texto, es_correcta) values
  ('76000000-0000-0000-0000-000000000071', '75000000-0000-0000-0000-000000000007', '∨', false),
  ('76000000-0000-0000-0000-000000000072', '75000000-0000-0000-0000-000000000007', '∧', true),
  ('76000000-0000-0000-0000-000000000073', '75000000-0000-0000-0000-000000000007', '¬', false),
  ('76000000-0000-0000-0000-000000000074', '75000000-0000-0000-0000-000000000007', '→', false),
  ('76000000-0000-0000-0000-000000000081', '75000000-0000-0000-0000-000000000008', 'V', true),
  ('76000000-0000-0000-0000-000000000082', '75000000-0000-0000-0000-000000000008', 'F', false),
  ('76000000-0000-0000-0000-000000000083', '75000000-0000-0000-0000-000000000008', 'No definido', false),
  ('76000000-0000-0000-0000-000000000084', '75000000-0000-0000-0000-000000000008', 'Depende de r', false),
  ('76000000-0000-0000-0000-000000000091', '75000000-0000-0000-0000-000000000009', 'V', false),
  ('76000000-0000-0000-0000-000000000092', '75000000-0000-0000-0000-000000000009', 'F', true),
  ('76000000-0000-0000-0000-000000000093', '75000000-0000-0000-0000-000000000009', 'V y F', false),
  ('76000000-0000-0000-0000-000000000094', '75000000-0000-0000-0000-000000000009', 'No se puede calcular', false),
  ('76000000-0000-0000-0000-000000000101', '75000000-0000-0000-0000-000000000010', 'V', false),
  ('76000000-0000-0000-0000-000000000102', '75000000-0000-0000-0000-000000000010', 'F', true),
  ('76000000-0000-0000-0000-000000000103', '75000000-0000-0000-0000-000000000010', 'No se puede calcular', false),
  ('76000000-0000-0000-0000-000000000104', '75000000-0000-0000-0000-000000000010', 'V y F a la vez', false),
  ('76000000-0000-0000-0000-000000000111', '75000000-0000-0000-0000-000000000011', 'V', false),
  ('76000000-0000-0000-0000-000000000112', '75000000-0000-0000-0000-000000000011', 'F', true),
  ('76000000-0000-0000-0000-000000000113', '75000000-0000-0000-0000-000000000011', 'V solo si p cambia', false),
  ('76000000-0000-0000-0000-000000000114', '75000000-0000-0000-0000-000000000011', 'No definido', false),
  ('76000000-0000-0000-0000-000000000121', '75000000-0000-0000-0000-000000000012', 'Sí, es V.', false),
  ('76000000-0000-0000-0000-000000000122', '75000000-0000-0000-0000-000000000012', 'No, es F.', true),
  ('76000000-0000-0000-0000-000000000123', '75000000-0000-0000-0000-000000000012', 'No tiene valor de verdad.', false),
  ('76000000-0000-0000-0000-000000000124', '75000000-0000-0000-0000-000000000012', 'Depende de la velocidad del internet.', false);
insert into caso_prueba (id, ejercicio_id, entrada, salida_esperada, es_oculto) values
  ('77000000-0000-0000-0000-000000001301', '75000000-0000-0000-0000-000000000013', 'p=V;q=V', 'p ∧ q=V', false),
  ('77000000-0000-0000-0000-000000001302', '75000000-0000-0000-0000-000000000013', 'p=V;q=F', 'p ∧ q=F', false),
  ('77000000-0000-0000-0000-000000001303', '75000000-0000-0000-0000-000000000013', 'p=F;q=V', 'p ∧ q=F', false),
  ('77000000-0000-0000-0000-000000001304', '75000000-0000-0000-0000-000000000013', 'p=F;q=F', 'p ∧ q=F', false);

-- ── Leccion 3: Disyunción (OR)
insert into leccion (id, nivel_id, orden, titulo, teoria) values
  ('74000000-0000-0000-0000-000000000003', (select id from _n2), 3, 'Disyunción (OR)', $json$[{"titulo":"La disyunción","texto":"La disyunción une dos proposiciones mediante la palabra «o». Se representa con el símbolo ∨.\n\nEjemplo:\n• p: Juego.\n• q: Programo.\n• p ∨ q: Juego o programo.\n\nEn la disyunción inclusiva, basta con que al menos una proposición sea verdadera para que el resultado sea verdadero.","codigo":null,"grafico":null},{"titulo":"Tabla de verdad de p ∨ q","texto":"El resultado es F únicamente cuando ambas proposiciones son falsas.","codigo":" p | q | p ∨ q\n---+---+------\n V | V |   V\n V | F |   V\n F | V |   V\n F | F |   F","grafico":null}]$json$::jsonb);
insert into ejercicio (id, nivel_id, leccion_id, tipo, enunciado, puntos_base, orden, pista) values
  ('75000000-0000-0000-0000-000000000014', (select id from _n2), '74000000-0000-0000-0000-000000000003', 'teoria', '¿Qué símbolo representa la disyunción?', 20, 14, 'Recuerda: la disyunción corresponde a «o»; no la confundas con la «y».'),
  ('75000000-0000-0000-0000-000000000015', (select id from _n2), '74000000-0000-0000-0000-000000000003', 'teoria', 'Si p = V y q = V, calcula p ∨ q.', 20, 15, 'En la disyunción inclusiva basta con que una sea verdadera; solo es falsa si ambas son falsas.'),
  ('75000000-0000-0000-0000-000000000016', (select id from _n2), '74000000-0000-0000-0000-000000000003', 'teoria', 'Si p = V y q = F, calcula p ∨ q.', 20, 16, 'En la disyunción inclusiva basta con que una sea verdadera; solo es falsa si ambas son falsas.'),
  ('75000000-0000-0000-0000-000000000017', (select id from _n2), '74000000-0000-0000-0000-000000000003', 'teoria', 'Si p = F y q = V, calcula p ∨ q.', 20, 17, 'En la disyunción inclusiva basta con que una sea verdadera; solo es falsa si ambas son falsas.'),
  ('75000000-0000-0000-0000-000000000018', (select id from _n2), '74000000-0000-0000-0000-000000000003', 'teoria', 'Si p = F y q = F, calcula p ∨ q.', 20, 18, 'En la disyunción inclusiva basta con que una sea verdadera; solo es falsa si ambas son falsas.'),
  ('75000000-0000-0000-0000-000000000019', (select id from _n2), '74000000-0000-0000-0000-000000000003', 'teoria', 'p: «Tengo una laptop» (F). q: «Tengo una computadora de escritorio» (V). ¿Cuál es el valor de p ∨ q?', 20, 19, 'Una disyunción es verdadera si al menos una de sus proposiciones lo es: revisa cada una.'),
  ('75000000-0000-0000-0000-000000000020', (select id from _n2), '74000000-0000-0000-0000-000000000003', 'tabla_verdad', 'Arma la tabla de verdad de p ∨ q: elige V o F en cada fila.', 20, 20, 'Fila por fila: p ∨ q solo da F cuando p y q son falsas a la vez.');
insert into alternativa (id, ejercicio_id, texto, es_correcta) values
  ('76000000-0000-0000-0000-000000000141', '75000000-0000-0000-0000-000000000014', '∧', false),
  ('76000000-0000-0000-0000-000000000142', '75000000-0000-0000-0000-000000000014', '¬', false),
  ('76000000-0000-0000-0000-000000000143', '75000000-0000-0000-0000-000000000014', '∨', true),
  ('76000000-0000-0000-0000-000000000144', '75000000-0000-0000-0000-000000000014', '→', false),
  ('76000000-0000-0000-0000-000000000151', '75000000-0000-0000-0000-000000000015', 'V', true),
  ('76000000-0000-0000-0000-000000000152', '75000000-0000-0000-0000-000000000015', 'F', false),
  ('76000000-0000-0000-0000-000000000153', '75000000-0000-0000-0000-000000000015', 'No definido', false),
  ('76000000-0000-0000-0000-000000000154', '75000000-0000-0000-0000-000000000015', 'Depende de q', false),
  ('76000000-0000-0000-0000-000000000161', '75000000-0000-0000-0000-000000000016', 'F', false),
  ('76000000-0000-0000-0000-000000000162', '75000000-0000-0000-0000-000000000016', 'V', true),
  ('76000000-0000-0000-0000-000000000163', '75000000-0000-0000-0000-000000000016', '¬', false),
  ('76000000-0000-0000-0000-000000000164', '75000000-0000-0000-0000-000000000016', 'No definido', false),
  ('76000000-0000-0000-0000-000000000171', '75000000-0000-0000-0000-000000000017', 'F', false),
  ('76000000-0000-0000-0000-000000000172', '75000000-0000-0000-0000-000000000017', 'V', true),
  ('76000000-0000-0000-0000-000000000173', '75000000-0000-0000-0000-000000000017', 'Depende de p', false),
  ('76000000-0000-0000-0000-000000000174', '75000000-0000-0000-0000-000000000017', 'No definido', false),
  ('76000000-0000-0000-0000-000000000181', '75000000-0000-0000-0000-000000000018', 'V', false),
  ('76000000-0000-0000-0000-000000000182', '75000000-0000-0000-0000-000000000018', 'F', true),
  ('76000000-0000-0000-0000-000000000183', '75000000-0000-0000-0000-000000000018', 'V y F a la vez', false),
  ('76000000-0000-0000-0000-000000000184', '75000000-0000-0000-0000-000000000018', 'Depende de q', false),
  ('76000000-0000-0000-0000-000000000191', '75000000-0000-0000-0000-000000000019', 'F', false),
  ('76000000-0000-0000-0000-000000000192', '75000000-0000-0000-0000-000000000019', 'V', true),
  ('76000000-0000-0000-0000-000000000193', '75000000-0000-0000-0000-000000000019', 'No es una proposición.', false),
  ('76000000-0000-0000-0000-000000000194', '75000000-0000-0000-0000-000000000019', 'V y F', false);
insert into caso_prueba (id, ejercicio_id, entrada, salida_esperada, es_oculto) values
  ('77000000-0000-0000-0000-000000002001', '75000000-0000-0000-0000-000000000020', 'p=V;q=V', 'p ∨ q=V', false),
  ('77000000-0000-0000-0000-000000002002', '75000000-0000-0000-0000-000000000020', 'p=V;q=F', 'p ∨ q=V', false),
  ('77000000-0000-0000-0000-000000002003', '75000000-0000-0000-0000-000000000020', 'p=F;q=V', 'p ∨ q=V', false),
  ('77000000-0000-0000-0000-000000002004', '75000000-0000-0000-0000-000000000020', 'p=F;q=F', 'p ∨ q=F', false);

-- ── Leccion 4: Negación (NOT)
insert into leccion (id, nivel_id, orden, titulo, teoria) values
  ('74000000-0000-0000-0000-000000000004', (select id from _n2), 4, 'Negación (NOT)', $json$[{"titulo":"La negación","texto":"La negación cambia el valor de verdad de una proposición. Si es verdadera, su negación es falsa; si es falsa, su negación es verdadera.\n\nSe representa como ¬p y se lee «no p».\n\nEjemplo:\n• p: El número 8 es par (V).\n• ¬p: El número 8 no es par (F).","codigo":null,"grafico":null},{"titulo":"Tabla de verdad de ¬p","texto":"La negación invierte el valor de p.","codigo":" p | ¬p\n---+----\n V |  F\n F |  V","grafico":null}]$json$::jsonb);
insert into ejercicio (id, nivel_id, leccion_id, tipo, enunciado, puntos_base, orden, pista) values
  ('75000000-0000-0000-0000-000000000021', (select id from _n2), '74000000-0000-0000-0000-000000000004', 'teoria', '¿Qué símbolo representa la negación?', 20, 21, 'La negación se lee «no p» y cambia el valor de verdad de una proposición.'),
  ('75000000-0000-0000-0000-000000000022', (select id from _n2), '74000000-0000-0000-0000-000000000004', 'teoria', 'Si p = V, ¿cuánto vale ¬p?', 20, 22, 'La negación invierte el valor de verdad: lo verdadero pasa a falso y viceversa.'),
  ('75000000-0000-0000-0000-000000000023', (select id from _n2), '74000000-0000-0000-0000-000000000004', 'teoria', 'Si p = F, ¿cuánto vale ¬p?', 20, 23, 'La negación invierte el valor de verdad: lo verdadero pasa a falso y viceversa.'),
  ('75000000-0000-0000-0000-000000000024', (select id from _n2), '74000000-0000-0000-0000-000000000004', 'teoria', 'p: «10 es mayor que 4» (V). ¿Cuál es el valor de ¬p?', 20, 24, 'Primero decide si «10 es mayor que 4» es verdadero y luego invierte ese valor.'),
  ('75000000-0000-0000-0000-000000000025', (select id from _n2), '74000000-0000-0000-0000-000000000004', 'teoria', 'p: «5 es un número par» (F). ¿Cuál es el valor de ¬p?', 20, 25, 'Primero decide si «5 es un número par» es verdadero y luego invierte ese valor.'),
  ('75000000-0000-0000-0000-000000000026', (select id from _n2), '74000000-0000-0000-0000-000000000004', 'teoria', 'Si p = V y q = F, calcula ¬p ∨ q.', 20, 26, 'Resuelve primero ¬p y después la disyunción con q: es verdadera si al menos una lo es.'),
  ('75000000-0000-0000-0000-000000000027', (select id from _n2), '74000000-0000-0000-0000-000000000004', 'tabla_verdad', 'Arma la tabla de verdad de ¬p: elige V o F en cada fila.', 20, 27, 'La negación invierte: si p es V, ¬p es F; si p es F, ¬p es V.');
insert into alternativa (id, ejercicio_id, texto, es_correcta) values
  ('76000000-0000-0000-0000-000000000211', '75000000-0000-0000-0000-000000000021', '∨', false),
  ('76000000-0000-0000-0000-000000000212', '75000000-0000-0000-0000-000000000021', '∧', false),
  ('76000000-0000-0000-0000-000000000213', '75000000-0000-0000-0000-000000000021', '¬', true),
  ('76000000-0000-0000-0000-000000000214', '75000000-0000-0000-0000-000000000021', '→', false),
  ('76000000-0000-0000-0000-000000000221', '75000000-0000-0000-0000-000000000022', 'V', false),
  ('76000000-0000-0000-0000-000000000222', '75000000-0000-0000-0000-000000000022', 'F', true),
  ('76000000-0000-0000-0000-000000000223', '75000000-0000-0000-0000-000000000022', 'V ∧ F', false),
  ('76000000-0000-0000-0000-000000000224', '75000000-0000-0000-0000-000000000022', 'No definido', false),
  ('76000000-0000-0000-0000-000000000231', '75000000-0000-0000-0000-000000000023', 'F', false),
  ('76000000-0000-0000-0000-000000000232', '75000000-0000-0000-0000-000000000023', 'V', true),
  ('76000000-0000-0000-0000-000000000233', '75000000-0000-0000-0000-000000000023', 'No definido', false),
  ('76000000-0000-0000-0000-000000000234', '75000000-0000-0000-0000-000000000023', 'V ∧ F', false),
  ('76000000-0000-0000-0000-000000000241', '75000000-0000-0000-0000-000000000024', 'V', false),
  ('76000000-0000-0000-0000-000000000242', '75000000-0000-0000-0000-000000000024', 'F', true),
  ('76000000-0000-0000-0000-000000000243', '75000000-0000-0000-0000-000000000024', 'No es posible.', false),
  ('76000000-0000-0000-0000-000000000244', '75000000-0000-0000-0000-000000000024', 'V y F', false),
  ('76000000-0000-0000-0000-000000000251', '75000000-0000-0000-0000-000000000025', 'F', false),
  ('76000000-0000-0000-0000-000000000252', '75000000-0000-0000-0000-000000000025', 'V', true),
  ('76000000-0000-0000-0000-000000000253', '75000000-0000-0000-0000-000000000025', 'Depende de q', false),
  ('76000000-0000-0000-0000-000000000254', '75000000-0000-0000-0000-000000000025', 'No es posible.', false),
  ('76000000-0000-0000-0000-000000000261', '75000000-0000-0000-0000-000000000026', 'V', false),
  ('76000000-0000-0000-0000-000000000262', '75000000-0000-0000-0000-000000000026', 'F', true),
  ('76000000-0000-0000-0000-000000000263', '75000000-0000-0000-0000-000000000026', '¬', false),
  ('76000000-0000-0000-0000-000000000264', '75000000-0000-0000-0000-000000000026', 'No definido', false);
insert into caso_prueba (id, ejercicio_id, entrada, salida_esperada, es_oculto) values
  ('77000000-0000-0000-0000-000000002701', '75000000-0000-0000-0000-000000000027', 'p=V', '¬p=F', false),
  ('77000000-0000-0000-0000-000000002702', '75000000-0000-0000-0000-000000000027', 'p=F', '¬p=V', false);

-- ── Leccion 5: Tablas de verdad y evaluación
insert into leccion (id, nivel_id, orden, titulo, teoria) values
  ('74000000-0000-0000-0000-000000000005', (select id from _n2), 5, 'Tablas de verdad y evaluación', $json$[{"titulo":"Tablas de verdad","texto":"Una tabla de verdad muestra todos los resultados posibles de una expresión lógica. Para dos proposiciones p y q existen cuatro combinaciones: VV, VF, FV y FF.\n\nPara evaluar expresiones compuestas, se resuelven las operaciones paso a paso, respetando los paréntesis.","codigo":null,"grafico":null},{"titulo":"Ejemplo: evaluar paso a paso","texto":"Si p = V y q = F, calcula (p ∧ q) ∨ ¬q.","codigo":"Paso 1: Resolver la conjunción.\n  p ∧ q = V ∧ F = F\n\nPaso 2: Resolver la negación.\n  ¬q = ¬F = V\n\nPaso 3: Resolver la disyunción.\n  F ∨ V = V\n\nResultado final: V.","grafico":null}]$json$::jsonb);
insert into ejercicio (id, nivel_id, leccion_id, tipo, enunciado, puntos_base, orden, pista) values
  ('75000000-0000-0000-0000-000000000028', (select id from _n2), '74000000-0000-0000-0000-000000000005', 'teoria', 'Si p = V y q = F, calcula p ∧ q.', 20, 28, 'Recuerda: la conjunción solo es verdadera si ambas proposiciones lo son.'),
  ('75000000-0000-0000-0000-000000000029', (select id from _n2), '74000000-0000-0000-0000-000000000005', 'teoria', 'Si p = F y q = V, calcula p ∨ q.', 20, 29, 'Recuerda: la disyunción es verdadera si al menos una proposición lo es.'),
  ('75000000-0000-0000-0000-000000000030', (select id from _n2), '74000000-0000-0000-0000-000000000005', 'teoria', 'Si p = V, calcula ¬p ∧ p.', 20, 30, 'Resuelve primero ¬p; luego la conjunción necesita que ambas sean verdaderas.'),
  ('75000000-0000-0000-0000-000000000031', (select id from _n2), '74000000-0000-0000-0000-000000000005', 'teoria', 'Si p = V y q = F, calcula (p ∧ q) ∨ ¬q.', 20, 31, 'Sigue los pasos: primero la conjunción, luego ¬q y al final la disyunción.'),
  ('75000000-0000-0000-0000-000000000032', (select id from _n2), '74000000-0000-0000-0000-000000000005', 'teoria', 'Completa la evaluación: p = F, q = F. ¿Cuánto vale p ∨ q?', 20, 32, 'Recuerda: la disyunción solo es falsa cuando ambas proposiciones son falsas.'),
  ('75000000-0000-0000-0000-000000000033', (select id from _n2), '74000000-0000-0000-0000-000000000005', 'teoria', 'Si p = F y q = V, calcula ¬p ∧ q.', 20, 33, 'Resuelve primero ¬p y después la conjunción con q.'),
  ('75000000-0000-0000-0000-000000000034', (select id from _n2), '74000000-0000-0000-0000-000000000005', 'tabla_verdad', 'Arma la tabla de (p ∧ q) ∨ ¬q resolviendo cada columna paso a paso.', 20, 34, 'Resuelve columna por columna: primero p ∧ q, luego ¬q y al final (p ∧ q) ∨ ¬q.');
insert into alternativa (id, ejercicio_id, texto, es_correcta) values
  ('76000000-0000-0000-0000-000000000281', '75000000-0000-0000-0000-000000000028', 'V', false),
  ('76000000-0000-0000-0000-000000000282', '75000000-0000-0000-0000-000000000028', 'F', true),
  ('76000000-0000-0000-0000-000000000283', '75000000-0000-0000-0000-000000000028', 'V ∨ F', false),
  ('76000000-0000-0000-0000-000000000284', '75000000-0000-0000-0000-000000000028', 'No definido', false),
  ('76000000-0000-0000-0000-000000000291', '75000000-0000-0000-0000-000000000029', 'F', false),
  ('76000000-0000-0000-0000-000000000292', '75000000-0000-0000-0000-000000000029', 'V', true),
  ('76000000-0000-0000-0000-000000000293', '75000000-0000-0000-0000-000000000029', '¬V', false),
  ('76000000-0000-0000-0000-000000000294', '75000000-0000-0000-0000-000000000029', 'Depende de p', false),
  ('76000000-0000-0000-0000-000000000301', '75000000-0000-0000-0000-000000000030', 'V', false),
  ('76000000-0000-0000-0000-000000000302', '75000000-0000-0000-0000-000000000030', 'F', true),
  ('76000000-0000-0000-0000-000000000303', '75000000-0000-0000-0000-000000000030', '¬', false),
  ('76000000-0000-0000-0000-000000000304', '75000000-0000-0000-0000-000000000030', 'No se puede calcular', false),
  ('76000000-0000-0000-0000-000000000311', '75000000-0000-0000-0000-000000000031', 'V', true),
  ('76000000-0000-0000-0000-000000000312', '75000000-0000-0000-0000-000000000031', 'F', false),
  ('76000000-0000-0000-0000-000000000313', '75000000-0000-0000-0000-000000000031', 'No se puede determinar.', false),
  ('76000000-0000-0000-0000-000000000314', '75000000-0000-0000-0000-000000000031', '¬V', false),
  ('76000000-0000-0000-0000-000000000321', '75000000-0000-0000-0000-000000000032', 'V', false),
  ('76000000-0000-0000-0000-000000000322', '75000000-0000-0000-0000-000000000032', 'F', true),
  ('76000000-0000-0000-0000-000000000323', '75000000-0000-0000-0000-000000000032', '¬F', false),
  ('76000000-0000-0000-0000-000000000324', '75000000-0000-0000-0000-000000000032', 'V y F a la vez', false),
  ('76000000-0000-0000-0000-000000000331', '75000000-0000-0000-0000-000000000033', 'F', false),
  ('76000000-0000-0000-0000-000000000332', '75000000-0000-0000-0000-000000000033', 'V', true),
  ('76000000-0000-0000-0000-000000000333', '75000000-0000-0000-0000-000000000033', '¬', false),
  ('76000000-0000-0000-0000-000000000334', '75000000-0000-0000-0000-000000000033', 'No definido', false);
insert into caso_prueba (id, ejercicio_id, entrada, salida_esperada, es_oculto) values
  ('77000000-0000-0000-0000-000000003401', '75000000-0000-0000-0000-000000000034', 'p=V;q=V', 'p ∧ q=V;¬q=F;(p ∧ q) ∨ ¬q=V', false),
  ('77000000-0000-0000-0000-000000003402', '75000000-0000-0000-0000-000000000034', 'p=V;q=F', 'p ∧ q=F;¬q=V;(p ∧ q) ∨ ¬q=V', false),
  ('77000000-0000-0000-0000-000000003403', '75000000-0000-0000-0000-000000000034', 'p=F;q=V', 'p ∧ q=F;¬q=F;(p ∧ q) ∨ ¬q=F', false),
  ('77000000-0000-0000-0000-000000003404', '75000000-0000-0000-0000-000000000034', 'p=F;q=F', 'p ∧ q=F;¬q=V;(p ∧ q) ∨ ¬q=V', false);

-- Comprobacion: debe dar 5 lecciones, 34 ejercicios (4 de tabla), 120 alternativas (30 correctas) y 14 filas de tabla
select (select count(*) from leccion where nivel_id = (select id from _n2)) as lecciones,
       (select count(*) from ejercicio where nivel_id = (select id from _n2) and leccion_id is not null) as ejercicios,
       (select count(*) from ejercicio where nivel_id = (select id from _n2) and tipo = 'tabla_verdad') as tablas,
       (select count(*) from alternativa a join ejercicio e on e.id = a.ejercicio_id where e.nivel_id = (select id from _n2)) as alternativas,
       (select count(*) from alternativa a join ejercicio e on e.id = a.ejercicio_id where e.nivel_id = (select id from _n2) and a.es_correcta) as correctas,
       (select count(*) from caso_prueba c join ejercicio e on e.id = c.ejercicio_id where e.nivel_id = (select id from _n2)) as filas_de_tabla;

commit;
