// NIVEL 1 del MUNDO 1 — contenido oficial (5 lecciones). Es el unico nivel cuyo contenido tambien se guarda en
// Supabase (tablas leccion/ejercicio/alternativa, ver database/migraciones/). El juego lo lee de la base y, si no esta disponible,
// usa esta copia local (mismo contenido), asi nunca se queda sin lecciones.
// Cada leccion: teoria (diapositivas), 7 preguntas, 4 alternativas y una respuesta correcta (a(pregunta, [A,B,C,D], indice)).
import { aplicarPistas, PISTAS_NIVEL_1 } from './pistas.js';
import { a, T } from './helpers.js';

export const NIVEL_1 = {
  t: '¿Qué es un Algoritmo?',                 // titulo del nivel en el mapa (sin cambios)
  lecciones: [

    // ── LECCIÓN 1 ─────────────────────────────────────────────────────────
    // OJO: la teoria de esta leccion no llego en el material entregado (solo sus 7 preguntas). Los textos de las
    // 3 diapositivas son PROVISIONALES, redactados solo con lo que dicen las preguntas: reemplazalos por los tuyos.
    { titulo: 'Bienvenido a Principios de Algoritmos',
      teoria: [
        T('Bienvenido al curso',
          'Principios de Algoritmos te enseña a resolver problemas mediante pasos lógicos y ordenados. Es la base para diseñar soluciones informáticas en Ingeniería de Sistemas e Informática.'),
        T('Antes de escribir código',
          'Antes de programar hay que analizar el problema y pensar en una solución.\n\nEjemplo: calcular el promedio de un estudiante mediante pasos ordenados.'),
        T('Evaluación y dudas',
          'El sistema de evaluación comprueba el aprendizaje según criterios establecidos. Puedes consultarlos en el sílabo y en las indicaciones del docente.\n\nSi no comprendes un ejercicio: analízalo, practica y consulta tus dudas.'),
      ],
      ejercicios: [
        a('¿Cuál es el objetivo principal del curso Principios de Algoritmos?',
          ['Aprender a reparar computadoras.', 'Aprender a resolver problemas mediante pasos lógicos.', 'Diseñar únicamente páginas web.', 'Utilizar programas sin comprenderlos.'], 1),
        a('¿Qué debemos hacer antes de escribir el código de un programa?',
          ['Elegir los colores de la interfaz.', 'Copiar otro programa.', 'Analizar el problema y pensar en una solución.', 'Instalar un videojuego.'], 2),
        a('¿Cuál de estas actividades se relaciona con el curso?',
          ['Calcular el promedio de un estudiante mediante pasos ordenados.', 'Cambiar el fondo de pantalla.', 'Limpiar el teclado.', 'Escuchar música.'], 0),
        a('¿Para qué sirve el sistema de evaluación de un curso?',
          ['Para evitar las prácticas.', 'Para garantizar automáticamente la nota máxima.', 'Para reemplazar las clases.', 'Para comprobar el aprendizaje según criterios establecidos.'], 3),
        a('¿Dónde puede consultar un estudiante los criterios de evaluación?',
          ['En cualquier red social.', 'En el sílabo y las indicaciones del docente.', 'En un videojuego.', 'En el nombre del curso solamente.'], 1),
        a('¿Cómo ayuda este curso a un estudiante de Ingeniería de Sistemas e Informática?',
          ['Le enseña únicamente a ensamblar computadoras.', 'Le permite evitar todos los demás cursos.', 'Le proporciona bases para diseñar soluciones informáticas.', 'Le enseña exclusivamente a utilizar redes sociales.'], 2),
        a('¿Qué debería hacer un estudiante si no comprende un ejercicio?',
          ['Analizarlo, practicar y consultar sus dudas.', 'Copiar la respuesta sin leerla.', 'Abandonar el ejercicio.', 'Inventar un resultado.'], 0),
      ],
    },

    // ── LECCIÓN 2 ─────────────────────────────────────────────────────────
    { titulo: '¿Qué es un algoritmo?',
      teoria: [
        T('¿Qué es un algoritmo?',
          'Un algoritmo es una secuencia ordenada de instrucciones que permite resolver un problema o realizar una tarea.\n\nLos algoritmos no se utilizan únicamente en las computadoras. También están presentes en actividades cotidianas, como seguir una receta, preparar una bebida o realizar una operación matemática.'),
        T('Entrada, proceso y salida',
          'Generalmente, un algoritmo trabaja con tres elementos:\n• Entrada: son los datos que recibe.\n• Proceso: son las operaciones que realiza.\n• Salida: es el resultado que obtiene.\n\nUn algoritmo puede representarse mediante lenguaje natural, pseudocódigo o diagramas de flujo, y después implementarse en un lenguaje de programación.'),
        T('Ejemplo: sumar dos números',
          'Para sumar dos números, recibimos los valores 5 y 3, realizamos la suma y obtenemos 8.',
          'Entrada: 5 y 3.\nProceso: 5 + 3.\nSalida: 8.'),
      ],
      ejercicios: [
        a('¿Qué es un algoritmo?',
          ['Una pieza física de la computadora.', 'Una secuencia de pasos para resolver un problema.', 'Una marca de computadora.', 'Un lenguaje de programación obligatorio.'], 1),
        a('¿Cuál de los siguientes es un ejemplo de algoritmo cotidiano?',
          ['Mirar una pared.', 'Escuchar un sonido.', 'Observar una fotografía.', 'Seguir una receta de cocina.'], 3),
        a('En una suma, ¿qué representan los números que ingresamos?',
          ['Las entradas.', 'Las salidas.', 'Los errores.', 'Los resultados finales.'], 0),
        a('Si sumamos 5 + 3, ¿cuál es la salida?',
          ['5.', '3.', '8.', '53.'], 2),
        a('¿Cuál es el propósito de un algoritmo?',
          ['Complicar los problemas.', 'Organizar los pasos para alcanzar un resultado.', 'Evitar todo razonamiento.', 'Crear datos sin propósito.'], 1),
        a('¿Qué datos necesitamos para calcular el área de un rectángulo?',
          ['Su color y su peso.', 'El nombre de su creador.', 'La marca de la computadora.', 'Su base y su altura.'], 3),
        a('¿Cómo se puede representar un algoritmo?',
          ['Únicamente en Java.', 'Solo mediante fotografías.', 'Mediante lenguaje natural, pseudocódigo o diagramas de flujo.', 'Únicamente en hojas de cálculo.'], 2),
      ],
    },

    // ── LECCIÓN 3 ─────────────────────────────────────────────────────────
    { titulo: 'Las características de un algoritmo',
      teoria: [
        T('¿Qué hace útil a un algoritmo?',
          'Para que un algoritmo sea útil, debe cumplir ciertas características que permitan comprenderlo y ejecutarlo correctamente.'),
        T('Las características principales',
          '• Preciso: sus instrucciones deben ser claras y no generar ambigüedades.\n• Definido: con las mismas entradas y condiciones, debe seguir el mismo procedimiento y producir el mismo resultado.\n• Finito: debe terminar después de una cantidad limitada de pasos.\n• Ordenado: sus instrucciones deben seguir una secuencia lógica.\n• Efectivo: sus instrucciones deben poder ejecutarse y contribuir a resolver el problema.\n\nUn algoritmo no necesita tener muchos pasos para ser bueno. Lo importante es que sea claro, realizable y adecuado para resolver la tarea.'),
        T('Ejemplo: preparar una limonada',
          'Para preparar una limonada, primero conseguimos los ingredientes, después exprimimos el limón, mezclamos los ingredientes y finalmente servimos la bebida. Si cambiamos el orden de los pasos, podríamos dificultar la preparación.'),
      ],
      ejercicios: [
        a('¿Qué significa que un algoritmo sea preciso?',
          ['Que tenga muchos pasos.', 'Que siempre utilice números.', 'Que sus instrucciones sean claras y no ambiguas.', 'Que nunca termine.'], 2),
        a('¿Qué significa que un algoritmo sea finito?',
          ['Que termine después de una cantidad limitada de pasos.', 'Que funcione eternamente.', 'Que no reciba datos.', 'Que solo utilice números pequeños.'], 0),
        a('¿Qué característica permite obtener el mismo resultado con las mismas entradas y condiciones?',
          ['La decoración.', 'El tamaño.', 'La velocidad de internet.', 'La definición o determinismo.'], 3),
        a('Una receta indica servir la comida antes de prepararla. ¿Cuál es el problema principal?',
          ['Utiliza demasiados datos.', 'Sus pasos están en un orden incorrecto.', 'Tiene una salida.', 'Es demasiado precisa.'], 1),
        a('¿Cuál de las siguientes instrucciones es más precisa?',
          ['Haz algo con los números.', 'Resuelve esto como puedas.', 'Suma los dos números ingresados y muestra el resultado.', 'Realiza alguna operación.'], 2),
        a('Un algoritmo repite instrucciones infinitamente y nunca termina. ¿Qué característica incumple?',
          ['Finitud.', 'Diseño visual.', 'Uso de internet.', 'Nombre descriptivo.'], 0),
        a('¿Qué significa que un algoritmo sea efectivo?',
          ['Que tenga una pantalla bonita.', 'Que utilice internet.', 'Que tenga muchas instrucciones innecesarias.', 'Que sus pasos puedan ejecutarse y contribuyan a resolver el problema.'], 3),
      ],
    },

    // ── LECCIÓN 4 ─────────────────────────────────────────────────────────
    { titulo: 'La importancia de los algoritmos en la ingeniería',
      teoria: [
        T('Algoritmos en la ingeniería',
          'Los algoritmos son fundamentales en Ingeniería de Sistemas e Informática porque permiten diseñar soluciones lógicas y automatizar tareas.'),
        T('Dónde se utilizan',
          '• Sistemas de ventas: calcular precios, cantidades y totales.\n• Sistemas universitarios: calcular promedios y verificar condiciones de aprobación.\n• Aplicaciones de mapas: buscar rutas entre diferentes lugares.\n• Sistemas bancarios: procesar operaciones siguiendo reglas establecidas.\n• Desarrollo de software: transformar un problema en instrucciones que una computadora pueda ejecutar.\n\nUn algoritmo bien diseñado puede reducir errores y mejorar la eficiencia. Sin embargo, es importante probarlo para comprobar que funciona correctamente.'),
        T('Ejemplo: una tienda',
          'Una tienda vende tres productos a S/ 10 cada uno. El algoritmo multiplica la cantidad por el precio y muestra el total de S/ 30.',
          'Entrada: cantidad = 3 y precio = S/ 10.\nProceso: 3 × 10 = 30.\nSalida: S/ 30.'),
      ],
      ejercicios: [
        a('¿Por qué son importantes los algoritmos en Ingeniería de Sistemas?',
          ['Porque eliminan la necesidad de analizar.', 'Porque reemplazan el hardware.', 'Porque evitan aprender programación.', 'Porque ayudan a diseñar soluciones lógicas para problemas.'], 3),
        a('¿Qué operación podría realizar un algoritmo de un sistema de ventas?',
          ['Cambiar el fondo de pantalla.', 'Multiplicar el precio por la cantidad comprada.', 'Reproducir cualquier canción.', 'Cambiar el idioma del teclado.'], 1),
        a('¿Qué relación existe entre un algoritmo y un programa?',
          ['No tienen ninguna relación.', 'Un programa no puede utilizar algoritmos.', 'El algoritmo describe los pasos y el programa implementa la solución mediante código.', 'El programa es el problema que se desea resolver.'], 2),
        a('¿Qué aplicación de los algoritmos encontramos en los mapas digitales?',
          ['Buscar rutas entre lugares.', 'Aumentar físicamente el tamaño del teléfono.', 'Cambiar la batería del dispositivo.', 'Limpiar la pantalla.'], 0),
        a('¿Qué puede ocurrir si el algoritmo de ventas tiene errores?',
          ['Todos los cálculos serán perfectos.', 'El equipo tendrá más memoria.', 'Los precios se corregirán automáticamente.', 'Puede calcular totales incorrectos.'], 3),
        a('¿Qué conviene hacer antes de implementar un algoritmo?',
          ['Copiar código sin revisarlo.', 'Analizar las entradas, las salidas y los pasos de la solución.', 'Evitar definir el problema.', 'Elegir únicamente los colores.'], 1),
        a('¿Por qué se deben probar los algoritmos?',
          ['Para agregar instrucciones al azar.', 'Para reemplazar el sílabo.', 'Para detectar errores y comprobar que resuelvan correctamente el problema.', 'Para evitar programar.'], 2),
      ],
    },

    // ── LECCIÓN 5 ─────────────────────────────────────────────────────────
    { titulo: 'Desafío final del programador',
      teoria: [
        T('Repaso del nivel',
          'En esta última lección repasaremos los conocimientos adquiridos durante el nivel.\n\nUn algoritmo es una secuencia ordenada de instrucciones que permite resolver un problema. Puede recibir datos de entrada, procesarlos y generar una salida.'),
        T('Lo que debes recordar',
          'Para que sea útil, un algoritmo debe ser preciso, definido, finito y efectivo. Sus pasos también deben seguir un orden lógico.\n\nEn Ingeniería de Sistemas e Informática, los algoritmos sirven para desarrollar programas, automatizar procesos, realizar cálculos y resolver problemas reales.\n\nAntes de programar, debemos analizar el problema, definir qué datos necesitamos y establecer qué resultado esperamos. Después podemos implementar la solución y probarla.'),
        T('Ejemplo integrador',
          'Una universidad necesita determinar si un estudiante aprobó.',
          '1. Entrada: nota del estudiante.\n2. Proceso: comparar la nota con la mínima aprobatoria establecida.\n3. Salida: indicar si aprobó o desaprobó.\n4. Prueba: comprobar diferentes notas para verificar que el algoritmo funcione correctamente.'),
      ],
      ejercicios: [
        a('¿Cuál describe mejor un algoritmo?',
          ['Un dispositivo de almacenamiento.', 'Una secuencia de instrucciones para resolver un problema.', 'Una imagen de una aplicación.', 'Un componente físico.'], 1),
        a('Un programa recibe dos números, los suma y muestra el total. ¿Cuál es la salida?',
          ['Los dos números antes de sumarlos.', 'El teclado.', 'La operación pendiente.', 'El resultado de la suma.'], 3),
        a('Un algoritmo nunca termina debido a una repetición sin salida. ¿Qué característica incumple?',
          ['Finitud.', 'Diseño visual.', 'Uso de internet.', 'Nombre descriptivo.'], 0),
        a('¿Qué debería hacer un estudiante antes de desarrollar una solución informática?',
          ['Escribir código sin analizar.', 'Elegir una animación.', 'Comprender el problema e identificar las entradas y los resultados esperados.', 'Copiar un programa al azar.'], 2),
        a('¿Qué característica permite que las instrucciones no sean ambiguas?',
          ['La cantidad de colores.', 'La precisión.', 'El tamaño de la pantalla.', 'La velocidad del teclado.'], 1),
        a('Una tienda necesita calcular el costo de varios productos. ¿Por qué le sirve un algoritmo?',
          ['Para eliminar los precios.', 'Para evitar registrar cantidades.', 'Para cambiar las imágenes de los productos.', 'Para definir los pasos del cálculo y obtener el total.'], 3),
        a('¿Cuál resume mejor la importancia de Principios de Algoritmos?',
          ['Enseña a resolver problemas de forma lógica y proporciona bases para programar.', 'Solo enseña a memorizar palabras.', 'Evita que los futuros ingenieros realicen pruebas.', 'Reemplaza todas las demás asignaturas.'], 0),
      ],
    },
  ],
};

aplicarPistas(NIVEL_1, PISTAS_NIVEL_1);   // cada ejercicio trae su pista (lo que da el comodin)
