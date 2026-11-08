import { a, or, fl, T } from './helpers.js';
import { NIVEL_1 } from './nivel1.js';
import { NIVEL_2 } from './nivel2.js';
import { NIVEL_3 } from './nivel3.js';
import { NIVEL_4 } from './nivel4.js';
import { NIVEL_5 } from './nivel5.js';
// Posiciones (%) de los nodos sobre public/mapa1.jpg — 7 niveles
export const NODOS = [
  [20.4,77.5],[27.2,68.4],[34.3,60.2],[42,53.5],[52,49],[64,48.4],[74.4,48.4],
];
export const BOTS = [
  { n:'Ana',  x:950, avatar:'ana'  },
  { n:'Leo',  x:760, avatar:'leo'  },
  { n:'Mia',  x:680, avatar:'mia'  },
  { n:'Alex', x:640, avatar:'alex' },
];
export const PERSONAJES = { girl:'👩‍💻', boy:'🧑‍💻', dog:'🐶' };
export const estrellas = (n) => '★'.repeat(n) + '☆'.repeat(3-n);

// Helpers internos

// ═══════════════════════════════════════════════════════════════════
//  CURSOS — Jerarquía: Curso → Nivel (nodo del mapa) → Lección
//  Cada nivel tiene 5 lecciones: teoria (diapositivas) + ejercicios
// ═══════════════════════════════════════════════════════════════════
export const CURSOS = [
  {
    id: 'pseudocodigo',
    nombre: 'Principios de Algoritmos',

    niveles: [

      // ──────────────────────────────────────────────────────────────
      // NIVEL 1 — ¿Qué es un Algoritmo?
      // ──────────────────────────────────────────────────────────────
      NIVEL_1,

      // ──────────────────────────────────────────────────────────────
      // NIVEL 2 — Variables y Tipos de Datos
      // ──────────────────────────────────────────────────────────────
      NIVEL_2,

      // ──────────────────────────────────────────────────────────────
      // NIVEL 3 — Operadores y Expresiones
      // ──────────────────────────────────────────────────────────────
      NIVEL_3,

      // ──────────────────────────────────────────────────────────────
      // NIVEL 4 — Variables y Operaciones (escribir el codigo; el anterior Condicionales esta en condicionales_anterior.js)
      // ──────────────────────────────────────────────────────────────
      NIVEL_4,

      // ──────────────────────────────────────────────────────────────
      // NIVEL 5 — Creación de diagramas de flujo (el anterior Bucle MIENTRAS esta en bucle_mientras_anterior.js)
      // ──────────────────────────────────────────────────────────────
      NIVEL_5,

      // ──────────────────────────────────────────────────────────────
      // NIVEL 6 — Bucle PARA
      // ──────────────────────────────────────────────────────────────
      { t: 'Bucle PARA', lecciones: [

        { titulo: 'Introducción al PARA',
          teoria: [
            T('¿Cuándo usar PARA?',
              'El bucle PARA se usa cuando se conoce de antemano CUÁNTAS VECES se va a repetir el bloque. Es más compacto que el MIENTRAS para este caso porque incluye la inicialización y la actualización.',
              'MIENTRAS:               PARA:\ni←1                   PARA i←1 HASTA 5\nMIENTRAS i<=5           ESCRIBIR i\n  ESCRIBIR i          FIN_PARA\n  i←i+1\nFIN_MIENTRAS'),
            T('Sintaxis del PARA',
              'La estructura es: PARA variable ← inicio HASTA fin HACER ... FIN_PARA. El contador se incrementa automáticamente en 1 cada vuelta.',
              'PARA i ← 1 HASTA 5 HACER\n  ESCRIBIR i\nFIN_PARA\n→ Muestra: 1 2 3 4 5'),
            T('Partes del PARA',
              '• Variable de control (i): el contador del bucle.\n• Inicio: valor inicial del contador.\n• Fin: valor máximo (inclusive).\n• Paso: incremento por vuelta (por defecto es 1).',
              'PARA i ← 0 HASTA 10 CON PASO 2\n→ i toma valores: 0, 2, 4, 6, 8, 10'),
          ],
          ejercicios: [
            a('¿Cuándo conviene usar el bucle PARA?',
              ['Cuando se sabe de antemano cuántas veces repetir','Cuando no se sabe cuántas repeticiones habrá','Cuando hay centinela','Cuando hay decisiones múltiples'], 0),
            a('¿Cuántas veces se ejecuta: PARA i←1 HASTA 5?',
              ['5 veces','4 veces','6 veces','1 vez'], 0),
            a('¿Qué muestra: PARA i←1 HASTA 3: ESCRIBIR i?',
              ['1, 2, 3','0, 1, 2','1, 2, 3, 4','2, 3'], 0),
            a('¿Cuántos valores genera: PARA i←0 HASTA 10 CON PASO 2?',
              ['6 valores (0,2,4,6,8,10)','5 valores','11 valores','10 valores'], 0),
            a('¿Necesito actualizar manualmente el contador en el PARA?',
              ['No, el PARA lo hace automáticamente','Sí, igual que en el MIENTRAS','Solo si el paso es distinto de 1','Solo en la última vuelta'], 0),
            or('Ordena: muestra la tabla de multiplicar del 7.',
              ['INICIO','PARA i ← 1 HASTA 10 HACER','  ESCRIBIR "7 ×",i,"=",7×i','FIN_PARA','FIN']),
          ],
        },

        { titulo: 'PARA con PASO',
          teoria: [
            T('El parámetro PASO',
              'Por defecto el PARA incrementa en 1. Con CON PASO puedes definir cualquier incremento: de 2 en 2, de 5 en 5, o incluso negativo (conteo regresivo).',
              'PARA i←2 HASTA 10 CON PASO 2\n→ 2, 4, 6, 8, 10\n\nPARA i←10 HASTA 1 CON PASO -1\n→ 10, 9, 8, ..., 1'),
            T('Calcular número de vueltas',
              'Con PASO el número de vueltas es: ((fin - inicio) / paso) + 1. Verificar esto te ayuda a diseñar bucles correctos.',
              'inicio=0, fin=8, paso=2:\n((8-0)/2)+1 = 5 vueltas\n→ i: 0, 2, 4, 6, 8'),
            T('Casos de uso del PASO',
              'CON PASO es muy útil para: recorrer pares/impares, hacer conteo regresivo, saltar posiciones en listas, crear patrones.',
              'Números impares del 1 al 9:\nPARA i←1 HASTA 9 CON PASO 2\n  ESCRIBIR i\nFIN_PARA → 1,3,5,7,9'),
          ],
          ejercicios: [
            a('¿Qué valores genera: PARA i←1 HASTA 9 CON PASO 2?',
              ['1, 3, 5, 7, 9','2, 4, 6, 8','1, 2, 3, 4, 5','0, 2, 4, 6, 8'], 0),
            a('¿Cuántas vueltas da: PARA i←0 HASTA 20 CON PASO 5?',
              ['5 vueltas (0,5,10,15,20)','4 vueltas','6 vueltas','21 vueltas'], 0),
            a('¿Qué genera: PARA i←5 HASTA 1 CON PASO -1?',
              ['5, 4, 3, 2, 1','1, 2, 3, 4, 5','5, 3, 1','Nada, paso inválido'], 0),
            a('¿Para qué sirve CON PASO -1?',
              ['Para hacer un conteo regresivo','Para saltarse elementos','Para contar más rápido','Para evitar el bucle infinito'], 0),
            or('Ordena: muestra los múltiplos de 3 del 3 al 30.',
              ['INICIO','PARA i ← 3 HASTA 30 CON PASO 3 HACER','  ESCRIBIR i','FIN_PARA','FIN']),
            fl('Ordena el diagrama de la suma de los primeros N números naturales.',
              [['Inicio','ini'],['Leer n, suma←0','io'],['PARA i←1 HASTA n','proc'],['suma←suma+i','proc'],['Escribir suma','io'],['Fin','fin']]),
          ],
        },

        { titulo: 'PARA en Tablas',
          teoria: [
            T('Tablas de multiplicar',
              'El bucle PARA es ideal para generar tablas, ya que el número de vueltas es fijo y conocido.',
              'PARA i ← 1 HASTA 10 HACER\n  ESCRIBIR n,"×",i,"=",n×i\nFIN_PARA'),
            T('Sumatoria y factorial',
              'El PARA combinado con acumuladores permite calcular sumatorias y productos clásicos.',
              'Sumatoria 1+2+...+n:\nPARA i←1 HASTA n: suma←suma+i\n\nFactorial n!:\nPARA i←1 HASTA n: fact←fact×i'),
            T('Conteo con condición',
              'Dentro del PARA podemos usar SI para contar solo los elementos que cumplen una condición (filtrado).',
              'conta←0\nPARA i←1 HASTA 10 HACER\n  LEER nota\n  SI nota>=11 ENTONCES\n    conta←conta+1\n  FIN_SI\nFIN_PARA\nESCRIBIR "Aprobados:", conta'),
          ],
          ejercicios: [
            a('¿Cuánto vale suma después de: suma←0; PARA i←1 HASTA 4: suma←suma+i?',
              ['10','4','6','1'], 0),
            a('¿Cuánto vale fact después de: fact←1; PARA i←1 HASTA 4: fact←fact×i?',
              ['24','4','12','1'], 0),
            a('¿Qué cuenta el siguiente pseudocódigo: SI nota >= 11 dentro de un PARA de 10 notas?',
              ['Los estudiantes que aprobaron','El total de notas','El promedio','Los que reprobaron'], 0),
            a('¿Cuántas líneas imprime la tabla del 5 del 1 al 10?',
              ['10 líneas','5 líneas','50 líneas','100 líneas'], 0),
            or('Ordena: calcula n! (factorial de n).',
              ['INICIO','LEER n','fact ← 1','PARA i ← 1 HASTA n HACER','  fact ← fact × i','FIN_PARA','ESCRIBIR n,"! =", fact','FIN']),
            fl('Ordena el diagrama: recorre 5 notas y muestra cuántas aprueban (>=11).',
              [['Inicio','ini'],['aprobados←0','proc'],['PARA i←1 HASTA 5','proc'],['Leer nota','io'],['nota>=11? → aprobados+1','dec'],['Escribir aprobados','io'],['Fin','fin']]),
          ],
        },

        { titulo: 'PARA vs MIENTRAS',
          teoria: [
            T('¿Cuándo usar cada uno?',
              'Regla de oro: si SABES cuántas veces repetir → usa PARA. Si DEPENDE de una condición variable → usa MIENTRAS.',
              'PARA: tabla del 5 (siempre 10 vueltas)\nMIENTRAS: pedir contraseña hasta acertar'),
            T('Equivalencia entre bucles',
              'Todo PARA puede reescribirse como MIENTRAS, pero el PARA es más compacto. No todo MIENTRAS puede reescribirse fácilmente como PARA.',
              'PARA i←1 HASTA n:\n  ESCRIBIR i\n\n≡ EQUIVALE A:\ni←1\nMIENTRAS i<=n:\n  ESCRIBIR i\n  i←i+1'),
            T('Evitar errores comunes',
              '• En PARA: no modifiques la variable de control dentro del bucle.\n• En MIENTRAS: no olvides actualizar la condición o tendrás un bucle infinito.\n• Elige el bucle que haga el código más claro y legible.'),
          ],
          ejercicios: [
            a('¿Qué bucle es más adecuado para generar la tabla de multiplicar del 9?',
              ['PARA (número de vueltas fijo: 10)','MIENTRAS (depende del usuario)','Cualquiera es igual de adecuado','Ninguno'], 0),
            a('¿Qué bucle es más adecuado para pedir datos hasta que el usuario ingrese -1?',
              ['MIENTRAS (número de repeticiones variable)','PARA (número fijo)','Cualquiera','Ninguno'], 0),
            a('¿Es correcto decir que todo PARA puede escribirse como MIENTRAS?',
              ['Sí, son equivalentes','No, PARA tiene funciones únicas','No, MIENTRAS no puede simular a PARA','Sí, pero solo para números pares'], 0),
            a('¿Qué error común ocurre en el MIENTRAS cuando olvidas actualizar el contador?',
              ['Bucle infinito','El bucle no se ejecuta','Error de compilación','El resultado es incorrecto pero termina'], 0),
            or('Convierte a PARA: mostrar números del 1 al N ingresado por el usuario.',
              ['INICIO','LEER N','PARA i ← 1 HASTA N HACER','  ESCRIBIR i','FIN_PARA','FIN']),
            fl('Ordena el diagrama que elige entre PARA y MIENTRAS según si se conoce el total.',
              [['Inicio','ini'],['¿Se conoce el nro. de repeticiones?','dec'],['Usar PARA','proc'],['Usar MIENTRAS','proc'],['Fin','fin']]),
          ],
        },

        { titulo: 'Práctica: PARA',
          teoria: [
            T('¡Reto final del Nivel 6!',
              'Domina el bucle PARA con PASO, acumuladores, conteo condicional y la comparación con MIENTRAS.'),
            T('Repaso',
              '• PARA i←inicio HASTA fin HACER … FIN_PARA\n• CON PASO n para incrementos distintos de 1\n• PARA: número de vueltas conocido\n• MIENTRAS: número de vueltas variable'),
          ],
          ejercicios: [
            a('¿Cuántas vueltas da: PARA i←10 HASTA 1 CON PASO -2?',
              ['5 vueltas (10,8,6,4,2)','4 vueltas','6 vueltas','10 vueltas'], 0),
            a('¿Cuánto es suma al final: suma←0; PARA i←1 HASTA 5: suma←suma+i×i?',
              ['55','15','25','10'], 0),
            a('¿Cuánto vale: fact←1; PARA i←1 HASTA 5: fact←fact×i?',
              ['120','5','25','20'], 0),
            a('Para imprimir múltiplos de 4 del 4 al 40, ¿qué paso usarías?',
              ['CON PASO 4','CON PASO 2','CON PASO 1','CON PASO 10'], 0),
            a('¿Puedes modificar la variable de control (i) dentro del cuerpo del PARA?',
              ['Técnicamente sí, pero produce resultados impredecibles y se debe evitar','Sí, es la forma correcta de usarlo','No, el compilador lo impide siempre','Solo si el paso es 1'], 0),
            or('Ordena: imprime los primeros N números impares.',
              ['INICIO','LEER N','PARA i ← 1 HASTA N×2 CON PASO 2 HACER','  ESCRIBIR i','FIN_PARA','FIN']),
            or('Ordena: calcula la suma de los cuadrados del 1 al 10.',
              ['INICIO','suma ← 0','PARA i ← 1 HASTA 10 HACER','  suma ← suma + i × i','FIN_PARA','ESCRIBIR "Suma:", suma','FIN']),
            fl('Ordena el diagrama: genera los N primeros múltiplos de un número dado.',
              [['Inicio','ini'],['Leer numero, N','io'],['PARA i←1 HASTA N','proc'],['Escribir numero×i','io'],['Fin','fin']]),
          ],
        },
      ]},

      // ──────────────────────────────────────────────────────────────
      // NIVEL 7 — Subalgoritmos
      // ──────────────────────────────────────────────────────────────
      { t: 'Subalgoritmos', lecciones: [

        { titulo: '¿Qué es un Subalgoritmo?',
          teoria: [
            T('Dividir para conquistar',
              'Un subalgoritmo es un bloque de instrucciones con nombre que realiza una tarea específica. Permite dividir un problema grande en partes más pequeñas y manejables.',
              'Problema grande:\n  "Gestionar ventas"\n↓ Se divide en:\n  "Registrar venta"\n  "Calcular total"\n  "Generar recibo"'),
            T('Ventajas de los subalgoritmos',
              '1. Reutilización: se puede llamar múltiples veces.\n2. Organización: código más limpio y legible.\n3. Mantenimiento: corregir un error en un solo lugar.\n4. Trabajo en equipo: cada quien desarrolla una parte.'),
            T('Tipos de subalgoritmos',
              'Existen dos tipos:\n• Procedimiento: realiza una tarea pero NO devuelve un valor.\n• Función: realiza una tarea Y devuelve un valor de resultado.',
              'PROCEDIMIENTO: mostrar saludo\n→ solo ejecuta acciones\n\nFUNCIÓN: calcular área\n→ ejecuta y RETORNA un valor'),
          ],
          ejercicios: [
            a('¿Qué es un subalgoritmo?',
              ['Un bloque de instrucciones con nombre que realiza una tarea específica','Un tipo de bucle avanzado','Una variable especial de tipo texto','Un diagrama de flujo completo'], 0),
            a('¿Cuál es la principal ventaja de los subalgoritmos?',
              ['Reutilizar código en múltiples partes del algoritmo sin reescribirlo','Hacer que el algoritmo sea más rápido','Usar menos variables','Evitar los bucles'], 0),
            a('¿Cuál es la diferencia entre un procedimiento y una función?',
              ['La función retorna un valor; el procedimiento no','Son exactamente iguales','El procedimiento retorna un valor; la función no','La función usa PARA; el procedimiento usa MIENTRAS'], 0),
            a('¿Qué significa "reutilizar" un subalgoritmo?',
              ['Llamarlo múltiples veces desde distintas partes del algoritmo','Escribirlo varias veces en el código','Guardarlo en una variable','Copiarlo y pegarlo'], 0),
            a('¿Qué beneficio tiene dividir un problema en subalgoritmos para trabajo en equipo?',
              ['Cada persona puede desarrollar un subalgoritmo por separado','No hay ningún beneficio','El código se vuelve más lento','Se necesitan más variables'], 0),
            or('Ordena: estructura básica de un algoritmo con subalgoritmo.',
              ['PROCEDIMIENTO mostrarMensaje()','  ESCRIBIR "¡Hola desde el subalgoritmo!"','FIN_PROCEDIMIENTO','INICIO','  mostrarMensaje()','FIN']),
          ],
        },

        { titulo: 'Procedimientos',
          teoria: [
            T('¿Qué es un procedimiento?',
              'Un procedimiento es un subalgoritmo que ejecuta una secuencia de acciones pero NO devuelve ningún valor. Se usa para agrupar acciones que se repiten.',
              'PROCEDIMIENTO imprimirLinea()\n  ESCRIBIR "━━━━━━━━━━━━"\nFIN_PROCEDIMIENTO'),
            T('Llamar a un procedimiento',
              'Para usar un procedimiento, lo llamamos por su nombre seguido de paréntesis desde el algoritmo principal (o desde otro subalgoritmo).',
              'INICIO\n  imprimirLinea()\n  ESCRIBIR "Reporte"\n  imprimirLinea()\n  ESCRIBIR "Total: 500"\n  imprimirLinea()\nFIN'),
            T('Procedimiento con parámetros',
              'Un procedimiento puede recibir parámetros (datos de entrada) para personalizar su comportamiento.',
              'PROCEDIMIENTO saludar(nombre: CADENA)\n  ESCRIBIR "¡Hola, ", nombre, "!"\nFIN_PROCEDIMIENTO\n\nINICIO\n  saludar("Ana")\n  saludar("Carlos")\nFIN'),
          ],
          ejercicios: [
            a('¿Qué hace un procedimiento?',
              ['Ejecuta acciones sin devolver ningún valor','Calcula y devuelve un resultado','Guarda datos en memoria','Es igual a una función'], 0),
            a('¿Cómo se llama a un procedimiento llamado "mostrarMenu"?',
              ['mostrarMenu()','LLAMAR mostrarMenu','EJECUTAR mostrarMenu','mostrarMenu ← INICIO'], 0),
            a('¿Qué son los parámetros de un procedimiento?',
              ['Datos de entrada que recibe para personalizar su comportamiento','Variables que declara internamente','Resultados que devuelve','Los pasos que ejecuta'], 0),
            a('¿Cuántas veces se puede llamar a un procedimiento?',
              ['Cuantas veces sea necesario (reutilización)','Solo una vez','Máximo 3 veces','Depende del tamaño'], 0),
            or('Ordena el procedimiento que muestra la tabla de multiplicar de un número.',
              ['PROCEDIMIENTO mostrarTabla(n: ENTERO)','  PARA i ← 1 HASTA 10 HACER','    ESCRIBIR n,"×",i,"=",n×i','  FIN_PARA','FIN_PROCEDIMIENTO','INICIO','  LEER numero','  mostrarTabla(numero)','FIN']),
            fl('Ordena el diagrama: algoritmo principal llama a procedimiento "calcularTotal".',
              [['Inicio','ini'],['Leer precio, cantidad','io'],['Llamar calcularTotal(precio,cantidad)','proc'],['Escribir resultado','io'],['Fin','fin']]),
          ],
        },

        { titulo: 'Funciones',
          teoria: [
            T('¿Qué es una función?',
              'Una función es un subalgoritmo que, además de ejecutar acciones, RETORNA un valor de resultado. Ese valor puede usarse en expresiones o guardarse en una variable.',
              'FUNCIÓN cuadrado(n: ENTERO): ENTERO\n  RETORNAR n × n\nFIN_FUNCIÓN'),
            T('Usar el valor retornado',
              'Al llamar a una función, el valor retornado puede guardarse en una variable o usarse directamente en una expresión.',
              'resultado ← cuadrado(5)  → 25\nESCRIBIR cuadrado(3) + cuadrado(4)  → 25\nSI cuadrado(n) > 100 ENTONCES ...'),
            T('Diferencia clave: función vs procedimiento',
              'La función tiene un tipo de retorno declarado y usa RETORNAR. El procedimiento no tiene tipo de retorno y no usa RETORNAR.',
              'FUNCIÓN área(b,h: REAL): REAL\n  RETORNAR b × h / 2\nFIN_FUNCIÓN\n\nPROCEDIMIENTO mostrar(x: REAL)\n  ESCRIBIR "Valor:", x\nFIN_PROCEDIMIENTO'),
          ],
          ejercicios: [
            a('¿Qué diferencia a una función de un procedimiento?',
              ['La función retorna un valor usando RETORNAR','El procedimiento es más largo','La función no recibe parámetros','Son exactamente iguales'], 0),
            a('¿Qué hace RETORNAR dentro de una función?',
              ['Devuelve un valor y termina la función','Muestra el valor en pantalla','Continúa al siguiente paso','Reinicia la función'], 0),
            a('Si FUNCIÓN doble(n: ENTERO): ENTERO → RETORNAR n×2, ¿qué devuelve doble(7)?',
              ['14','7','2','49'], 0),
            a('¿Cómo se guarda el resultado de una función en una variable?',
              ['resultado ← nombreFuncion(argumentos)','RETORNAR resultado','GUARDAR nombreFuncion en resultado','resultado = nombreFuncion'], 0),
            or('Ordena la función que calcula el perímetro de un cuadrado (4 × lado).',
              ['FUNCIÓN perimetro(lado: REAL): REAL','  RETORNAR 4 × lado','FIN_FUNCIÓN','INICIO','  LEER l','  ESCRIBIR "Perímetro:", perimetro(l)','FIN']),
            fl('Ordena el diagrama de la función que determina el mayor de dos números.',
              [['Inicio función','ini'],['Recibir a, b','io'],['¿a > b?','dec'],['Retornar a','proc'],['Retornar b','proc'],['Fin función','fin']]),
          ],
        },

        { titulo: 'Parámetros y Argumentos',
          teoria: [
            T('Parámetros vs Argumentos',
              'Parámetro: la variable que aparece en la definición del subalgoritmo (el "molde"). Argumento: el valor concreto que se pasa al llamar al subalgoritmo.',
              'FUNCIÓN suma(a: ENTERO, b: ENTERO): ENTERO\n          ↑ parámetros\nESCRIBIR suma(5, 3)\n                ↑ argumentos'),
            T('Paso por valor',
              'En el paso por valor, el subalgoritmo recibe una copia del valor. Cualquier cambio dentro del subalgoritmo NO afecta a la variable original.',
              'PROCEDIMIENTO doble(n: ENTERO)\n  n ← n × 2  ← solo cambia la copia\n  ESCRIBIR n\nFIN_PROCEDIMIENTO\nx ← 5\ndoble(x)\nESCRIBIR x  → sigue valiendo 5'),
            T('Múltiples parámetros',
              'Un subalgoritmo puede recibir varios parámetros de distintos tipos. Se separan con coma.',
              'FUNCIÓN calcIMC(peso: REAL, talla: REAL): REAL\n  RETORNAR peso / (talla × talla)\nFIN_FUNCIÓN'),
          ],
          ejercicios: [
            a('¿Qué es un parámetro?',
              ['Variable en la definición del subalgoritmo que recibe datos de entrada','El valor concreto que se pasa al llamar','El resultado de la función','Una variable global del algoritmo'], 0),
            a('¿Qué es un argumento?',
              ['El valor concreto que se pasa al llamar al subalgoritmo','La variable en la definición del subalgoritmo','El tipo de retorno','El nombre del subalgoritmo'], 0),
            a('FUNCIÓN sumar(a,b: ENTERO): ENTERO → RETORNAR a+b. ¿Qué devuelve sumar(4,6)?',
              ['10','46','2','0'], 0),
            a('En el paso por valor, si modificas el parámetro dentro de la función, ¿qué pasa con el argumento original?',
              ['No cambia (se trabaja con una copia)','Cambia también','Genera un error','Depende del tipo de dato'], 0),
            or('Ordena la función que calcula el IMC.',
              ['FUNCIÓN calcIMC(peso: REAL, talla: REAL): REAL','  RETORNAR peso / (talla × talla)','FIN_FUNCIÓN','INICIO','  LEER p, t','  ESCRIBIR "IMC:", calcIMC(p, t)','FIN']),
            fl('Ordena el diagrama de la función que verifica si un número es primo.',
              [['Inicio función','ini'],['Recibir n','io'],['¿n tiene divisor entre 2 y n-1?','dec'],['Retornar FALSO','proc'],['Retornar VERDADERO','proc'],['Fin función','fin']]),
          ],
        },

        { titulo: 'Práctica: Subalgoritmos',
          teoria: [
            T('¡Reto final del Nivel 7 — y del Módulo!',
              'Combinarás procedimientos, funciones, parámetros y la invocación desde el algoritmo principal para resolver problemas completos.'),
            T('Repaso general del módulo',
              '• Algoritmos: finitos, precisos, eficaces\n• Variables, tipos, operadores\n• Condicionales SI/SINO\n• Bucles MIENTRAS y PARA\n• Subalgoritmos: procedimientos y funciones\n• Parámetros y RETORNAR'),
          ],
          ejercicios: [
            a('¿Cuál es la forma correcta de definir un procedimiento?',
              ['PROCEDIMIENTO nombre(params) ... FIN_PROCEDIMIENTO','FUNCIÓN nombre() SIN RETORNO','INICIO nombre() FIN','LLAMAR nombre(params)'], 0),
            a('¿Cuál es la forma correcta de definir una función?',
              ['FUNCIÓN nombre(params): TIPO ... RETORNAR valor ... FIN_FUNCIÓN','PROCEDIMIENTO nombre(params): TIPO','FUNCIÓN nombre() SIN TIPO','INICIO nombre(): TIPO FIN'], 0),
            a('¿Qué ventaja tienen los subalgoritmos en programas grandes?',
              ['Permiten dividir el problema en partes reutilizables y manejables','Hacen el programa más corto siempre','Evitan el uso de variables','Eliminan la necesidad de bucles'], 0),
            a('Una FUNCIÓN que calcula el máximo de dos números debe:',
              ['Recibir los dos números como parámetros y RETORNAR el mayor','Solo mostrar el mayor con ESCRIBIR','Recibir el resultado y mostrarlo','No usar parámetros'], 0),
            a('¿Qué instrucción termina una función y devuelve su resultado?',
              ['RETORNAR','FIN_FUNCIÓN','ESCRIBIR','SALIR'], 0),
            or('Ordena el algoritmo completo: función máximo y su uso.',
              ['FUNCIÓN maximo(a,b: ENTERO): ENTERO','  SI a > b ENTONCES RETORNAR a','  SINO RETORNAR b','  FIN_SI','FIN_FUNCIÓN','INICIO','  LEER x, y','  ESCRIBIR "Máximo:", maximo(x,y)','FIN']),
            or('Ordena: procedimiento que muestra el cuadrado y cubo de un número.',
              ['PROCEDIMIENTO potencias(n: ENTERO)','  ESCRIBIR "Cuadrado:", n×n','  ESCRIBIR "Cubo:", n×n×n','FIN_PROCEDIMIENTO','INICIO','  LEER num','  potencias(num)','FIN']),
            fl('Ordena el diagrama: algoritmo principal que llama funciones área y perímetro de un círculo.',
              [['Inicio','ini'],['Leer radio','io'],['Llamar area(radio)','proc'],['Llamar perimetro(radio)','proc'],['Escribir resultados','io'],['Fin','fin']]),
          ],
        },
      ]},
    ],
  },
];
