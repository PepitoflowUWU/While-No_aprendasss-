// PISTAS de los niveles 1 y 2: es lo que da el COMODIN (las del nivel 3 viven en nivel3.js).
// Orientan sin decir la respuesta. pistas[leccion][ejercicio], en el mismo orden que las preguntas.
export const PISTAS_NIVEL_1 = [
  [ // Lección 1 · Bienvenido a Principios de Algoritmos
    'Fíjate en el nombre del curso: los algoritmos son pasos lógicos para resolver problemas.',
    'Antes de programar hay que entender qué se pide y planear cómo resolverlo.',
    'Busca la actividad que sigue pasos ordenados para obtener un resultado a partir de datos.',
    'Piensa en para qué se evalúa: se revisa si lo aprendido cumple los criterios del curso.',
    'Es el documento que el curso entrega al inicio, junto con las indicaciones de quien lo dicta.',
    'El curso da fundamentos que luego sirven para crear soluciones informáticas.',
    'Una buena actitud combina entender el ejercicio, practicar y no quedarse con la duda.',
  ],
  [ // Lección 2 · ¿Qué es un algoritmo?
    'Un algoritmo es una secuencia ordenada de pasos con un fin.',
    'Busca una actividad diaria que se hace siguiendo instrucciones en orden, una tras otra.',
    'Son los datos que se le dan al algoritmo para que trabaje.',
    'La salida es el resultado que muestra el algoritmo: haz la suma.',
    'Piensa en lo que logra un algoritmo: guía los pasos hasta llegar a un resultado.',
    'Para el área de un rectángulo se multiplican dos medidas: ¿cuáles son?',
    'Piensa en las formas de explicar los pasos antes de programar: con palabras, con un código simplificado o con dibujos.',
  ],
  [ // Lección 3 · Las características de un algoritmo
    'Preciso significa que no deja dudas: cada instrucción se entiende de una sola manera.',
    'Finito tiene que ver con el final: ¿cuántos pasos tiene antes de terminar?',
    'Es la característica que hace que el resultado sea siempre el mismo con los mismos datos.',
    'Fíjate en la secuencia: servir antes de preparar rompe el orden lógico.',
    'La instrucción más precisa dice exactamente qué hacer, con qué datos y qué mostrar.',
    'Si nunca termina, le falta tener un final: piensa en la característica relacionada con terminar.',
    'Efectivo: lo que dice se puede hacer de verdad y acerca a la solución.',
  ],
  [ // Lección 4 · La importancia de los algoritmos en la ingeniería
    'Los algoritmos permiten planear soluciones lógicas antes de construir el sistema.',
    'Un sistema de ventas calcula totales: piensa en el precio y la cantidad.',
    'Uno describe los pasos; el otro los escribe en un lenguaje que la computadora entiende.',
    'Los mapas digitales te indican cómo llegar de un punto a otro: ¿qué buscan?',
    'Si el cálculo tiene errores, el resultado que se muestra tampoco será correcto.',
    'Antes de implementar conviene tener claro qué datos entran, qué debe salir y qué pasos hay.',
    'Probar sirve para descubrir fallos y confirmar que el resultado es el esperado.',
  ],
  [ // Lección 5 · Desafío final del programador
    'Piensa en la definición: pasos ordenados para resolver un problema.',
    'La salida es lo que el programa muestra al final: ¿qué obtiene al sumar?',
    'Una repetición sin salida no tiene final: piensa en la característica de terminar.',
    'Antes de resolver hay que entender el problema: ¿qué datos entran y qué se espera obtener?',
    'Piensa en la característica que evita las instrucciones con doble sentido.',
    'Calcular costos sigue pasos definidos: sumar los precios para llegar a un total.',
    'El curso enseña a razonar con lógica y deja la base para programar.',
  ],
];

export const PISTAS_NIVEL_2 = [
  [ // Lección 1 · Concepto y clases de proposiciones
    'Una proposición se puede decir si es verdadera o falsa; una orden o una pregunta no.',
    'Revisa cada opción con los datos que conoces y busca la que no se cumple.',
    'Fíjate si expresa una sola idea o si une varias con conectivos como «y» u «o».',
    'Una proposición compuesta une dos ideas con un conectivo lógico, por ejemplo «y».',
    'Las órdenes y las preguntas no pueden ser verdaderas ni falsas.',
    'Comprueba si el 6 se puede dividir exacto entre 2.',
  ],
  [ // Lección 2 · Conjunción (AND)
    'Recuerda: la conjunción corresponde a «y» y la disyunción corresponde a «o».',
    'La conjunción solo es verdadera cuando las dos proposiciones son verdaderas.',
    'La conjunción solo es verdadera cuando las dos proposiciones son verdaderas.',
    'La conjunción solo es verdadera cuando las dos proposiciones son verdaderas.',
    'La conjunción solo es verdadera cuando las dos proposiciones son verdaderas.',
    'Una conjunción necesita que ambas proposiciones sean verdaderas: revisa cada una.',
    'Fila por fila: p ∧ q solo da V cuando p y q valen V a la vez.',
  ],
  [ // Lección 3 · Disyunción (OR)
    'Recuerda: la disyunción corresponde a «o»; no la confundas con la «y».',
    'En la disyunción inclusiva basta con que una sea verdadera; solo es falsa si ambas son falsas.',
    'En la disyunción inclusiva basta con que una sea verdadera; solo es falsa si ambas son falsas.',
    'En la disyunción inclusiva basta con que una sea verdadera; solo es falsa si ambas son falsas.',
    'En la disyunción inclusiva basta con que una sea verdadera; solo es falsa si ambas son falsas.',
    'Una disyunción es verdadera si al menos una de sus proposiciones lo es: revisa cada una.',
    'Fila por fila: p ∨ q solo da F cuando p y q son falsas a la vez.',
  ],
  [ // Lección 4 · Negación (NOT)
    'La negación se lee «no p» y cambia el valor de verdad de una proposición.',
    'La negación invierte el valor de verdad: lo verdadero pasa a falso y viceversa.',
    'La negación invierte el valor de verdad: lo verdadero pasa a falso y viceversa.',
    'Primero decide si «10 es mayor que 4» es verdadero y luego invierte ese valor.',
    'Primero decide si «5 es un número par» es verdadero y luego invierte ese valor.',
    'Resuelve primero ¬p y después la disyunción con q: es verdadera si al menos una lo es.',
    'La negación invierte: si p es V, ¬p es F; si p es F, ¬p es V.',
  ],
  [ // Lección 5 · Tablas de verdad y evaluación
    'Recuerda: la conjunción solo es verdadera si ambas proposiciones lo son.',
    'Recuerda: la disyunción es verdadera si al menos una proposición lo es.',
    'Resuelve primero ¬p; luego la conjunción necesita que ambas sean verdaderas.',
    'Sigue los pasos: primero la conjunción, luego ¬q y al final la disyunción.',
    'Recuerda: la disyunción solo es falsa cuando ambas proposiciones son falsas.',
    'Resuelve primero ¬p y después la conjunción con q.',
    'Resuelve columna por columna: primero p ∧ q, luego ¬q y al final (p ∧ q) ∨ ¬q.',
  ],
];

// Asigna a cada ejercicio su pista. Falla si el numero de pistas no coincide con el de ejercicios (para no dejar ninguno sin pista).
export function aplicarPistas(nivel, pistas) {
  if (pistas.length !== nivel.lecciones.length) throw new Error('Pistas: numero de lecciones distinto');
  nivel.lecciones.forEach((l, i) => {
    if (pistas[i].length !== l.ejercicios.length) throw new Error(`Pistas: la leccion ${i + 1} tiene ${l.ejercicios.length} ejercicios y ${pistas[i].length} pistas`);
    l.ejercicios.forEach((q, k) => { q.pista = pistas[i][k]; });
  });
  return nivel;
}
