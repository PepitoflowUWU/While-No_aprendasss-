// NIVEL 2 del MUNDO 1 — Lógica proposicional (5 lecciones). Preguntas de 4 alternativas y, en las lecciones 2 a 5,
// un ejercicio final para ARMAR la tabla de verdad (tipo 'tabla').
// Reemplaza por completo el contenido anterior del nivel 2. Tambien se guarda en Supabase (database/migraciones/09_nivel2_contenido.sql);
// el juego lo lee de la base y, si no esta disponible, usa esta copia local (mismo contenido).
// Las formulas \(p \land q\) del material se escriben aqui con simbolos: ∧ (y), ∨ (o), ¬ (no).
import { aplicarPistas, PISTAS_NIVEL_2 } from './pistas.js';
import { a, tb, T } from './helpers.js';

export const NIVEL_2 = {
  t: 'Lógica Proposicional',
  lecciones: [

    // ── LECCIÓN 1 ─────────────────────────────────────────────────────────
    { titulo: 'Concepto y clases de proposiciones',
      teoria: [
        T('¿Qué es una proposición?',
          'Una proposición lógica es un enunciado que puede ser verdadero (V) o falso (F), pero no ambos al mismo tiempo.\n\nEjemplos:\n• «2 + 3 = 5» → Verdadero (V).\n• «10 es menor que 4» → Falso (F).\n• «¿Qué hora es?» → No es una proposición, porque es una pregunta.'),
        T('Clases de proposiciones',
          '• Simple: expresa una sola idea y no contiene conectivos lógicos. Ejemplo: «El sol es una estrella».\n• Compuesta: combina dos o más proposiciones mediante conectivos lógicos. Ejemplo: «El sol es una estrella y la Tierra es un planeta».\n\nLas letras p, q y r representan proposiciones.'),
      ],
      ejercicios: [
        a('¿Cuál de los siguientes enunciados es una proposición?',
          ['¡Abre la puerta!', '7 + 2 = 9', '¿Vienes mañana?', 'Cierra la ventana, por favor.'], 1),
        a('¿Cuál es una proposición falsa?',
          ['4 es mayor que 2.', 'Lima está en Perú.', '3 × 3 = 8.', '5 es un número impar.'], 2),
        a('¿Qué tipo de proposición es «La Luna es un satélite»?',
          ['Compuesta.', 'Simple.', 'Pregunta.', 'Exclamación.'], 1),
        a('Si p: «Estudio programación» y q: «Practico algoritmos», ¿cuál es una proposición compuesta?',
          ['Estudio programación.', 'Practico algoritmos.', 'Estudio programación y practico algoritmos.', '¿Practico algoritmos hoy?'], 2),
        a('¿Cuál NO es una proposición lógica?',
          ['5 es un número impar.', 'Cierra el cuaderno.', '8 es mayor que 3.', '12 es divisible entre 3.'], 1),
        a('Si p: «El número 6 es par», ¿cuál es su valor de verdad?',
          ['V.', 'F.', 'No tiene valor de verdad.', 'V y F al mismo tiempo.'], 0),
      ],
    },

    // ── LECCIÓN 2 ─────────────────────────────────────────────────────────
    { titulo: 'Conjunción (AND)',
      teoria: [
        T('La conjunción',
          'La conjunción une dos proposiciones mediante la palabra «y». Se representa con el símbolo ∧.\n\nEjemplo:\n• p: Estudio.\n• q: Practico.\n• p ∧ q: Estudio y practico.\n\nLa conjunción solamente es verdadera cuando ambas proposiciones son verdaderas.'),
        T('Tabla de verdad de p ∧ q',
          'Observa que el resultado es V únicamente en la primera fila.',
          ' p | q | p ∧ q\n---+---+------\n V | V |   V\n V | F |   F\n F | V |   F\n F | F |   F'),
      ],
      ejercicios: [
        a('¿Qué símbolo representa la conjunción?', ['∨', '∧', '¬', '→'], 1),
        a('Si p = V y q = V, calcula p ∧ q.', ['V', 'F', 'No definido', 'Depende de r'], 0),
        a('Si p = V y q = F, calcula p ∧ q.', ['V', 'F', 'V y F', 'No se puede calcular'], 1),
        a('Si p = F y q = V, calcula p ∧ q.', ['V', 'F', 'No se puede calcular', 'V y F a la vez'], 1),
        a('Si p = F y q = F, calcula p ∧ q.', ['V', 'F', 'V solo si p cambia', 'No definido'], 1),
        a('p: «Tengo internet» (V). q: «La computadora está encendida» (F). ¿Es verdadera la expresión «Tengo internet y la computadora está encendida»?',
          ['Sí, es V.', 'No, es F.', 'No tiene valor de verdad.', 'Depende de la velocidad del internet.'], 1),
        tb('Arma la tabla de verdad de p ∧ q: elige V o F en cada fila.', ['p', 'q'], [['V', 'V'], ['V', 'F'], ['F', 'V'], ['F', 'F']],
          [{ t: 'p ∧ q', v: ['V', 'F', 'F', 'F'] }]),
      ],
    },

    // ── LECCIÓN 3 ─────────────────────────────────────────────────────────
    { titulo: 'Disyunción (OR)',
      teoria: [
        T('La disyunción',
          'La disyunción une dos proposiciones mediante la palabra «o». Se representa con el símbolo ∨.\n\nEjemplo:\n• p: Juego.\n• q: Programo.\n• p ∨ q: Juego o programo.\n\nEn la disyunción inclusiva, basta con que al menos una proposición sea verdadera para que el resultado sea verdadero.'),
        T('Tabla de verdad de p ∨ q',
          'El resultado es F únicamente cuando ambas proposiciones son falsas.',
          ' p | q | p ∨ q\n---+---+------\n V | V |   V\n V | F |   V\n F | V |   V\n F | F |   F'),
      ],
      ejercicios: [
        a('¿Qué símbolo representa la disyunción?', ['∧', '¬', '∨', '→'], 2),
        a('Si p = V y q = V, calcula p ∨ q.', ['V', 'F', 'No definido', 'Depende de q'], 0),
        a('Si p = V y q = F, calcula p ∨ q.', ['F', 'V', '¬', 'No definido'], 1),
        a('Si p = F y q = V, calcula p ∨ q.', ['F', 'V', 'Depende de p', 'No definido'], 1),
        a('Si p = F y q = F, calcula p ∨ q.', ['V', 'F', 'V y F a la vez', 'Depende de q'], 1),
        a('p: «Tengo una laptop» (F). q: «Tengo una computadora de escritorio» (V). ¿Cuál es el valor de p ∨ q?',
          ['F', 'V', 'No es una proposición.', 'V y F'], 1),
        tb('Arma la tabla de verdad de p ∨ q: elige V o F en cada fila.', ['p', 'q'], [['V', 'V'], ['V', 'F'], ['F', 'V'], ['F', 'F']],
          [{ t: 'p ∨ q', v: ['V', 'V', 'V', 'F'] }]),
      ],
    },

    // ── LECCIÓN 4 ─────────────────────────────────────────────────────────
    { titulo: 'Negación (NOT)',
      teoria: [
        T('La negación',
          'La negación cambia el valor de verdad de una proposición. Si es verdadera, su negación es falsa; si es falsa, su negación es verdadera.\n\nSe representa como ¬p y se lee «no p».\n\nEjemplo:\n• p: El número 8 es par (V).\n• ¬p: El número 8 no es par (F).'),
        T('Tabla de verdad de ¬p',
          'La negación invierte el valor de p.',
          ' p | ¬p\n---+----\n V |  F\n F |  V'),
      ],
      ejercicios: [
        a('¿Qué símbolo representa la negación?', ['∨', '∧', '¬', '→'], 2),
        a('Si p = V, ¿cuánto vale ¬p?', ['V', 'F', 'V ∧ F', 'No definido'], 1),
        a('Si p = F, ¿cuánto vale ¬p?', ['F', 'V', 'No definido', 'V ∧ F'], 1),
        a('p: «10 es mayor que 4» (V). ¿Cuál es el valor de ¬p?', ['V', 'F', 'No es posible.', 'V y F'], 1),
        a('p: «5 es un número par» (F). ¿Cuál es el valor de ¬p?', ['F', 'V', 'Depende de q', 'No es posible.'], 1),
        a('Si p = V y q = F, calcula ¬p ∨ q.', ['V', 'F', '¬', 'No definido'], 1),
        tb('Arma la tabla de verdad de ¬p: elige V o F en cada fila.', ['p'], [['V'], ['F']],
          [{ t: '¬p', v: ['F', 'V'] }]),
      ],
    },

    // ── LECCIÓN 5 ─────────────────────────────────────────────────────────
    { titulo: 'Tablas de verdad y evaluación',
      teoria: [
        T('Tablas de verdad',
          'Una tabla de verdad muestra todos los resultados posibles de una expresión lógica. Para dos proposiciones p y q existen cuatro combinaciones: VV, VF, FV y FF.\n\nPara evaluar expresiones compuestas, se resuelven las operaciones paso a paso, respetando los paréntesis.'),
        T('Ejemplo: evaluar paso a paso',
          'Si p = V y q = F, calcula (p ∧ q) ∨ ¬q.',
          'Paso 1: Resolver la conjunción.\n  p ∧ q = V ∧ F = F\n\nPaso 2: Resolver la negación.\n  ¬q = ¬F = V\n\nPaso 3: Resolver la disyunción.\n  F ∨ V = V\n\nResultado final: V.'),
      ],
      ejercicios: [
        a('Si p = V y q = F, calcula p ∧ q.', ['V', 'F', 'V ∨ F', 'No definido'], 1),
        a('Si p = F y q = V, calcula p ∨ q.', ['F', 'V', '¬V', 'Depende de p'], 1),
        a('Si p = V, calcula ¬p ∧ p.', ['V', 'F', '¬', 'No se puede calcular'], 1),
        a('Si p = V y q = F, calcula (p ∧ q) ∨ ¬q.', ['V', 'F', 'No se puede determinar.', '¬V'], 0),
        a('Completa la evaluación: p = F, q = F. ¿Cuánto vale p ∨ q?', ['V', 'F', '¬F', 'V y F a la vez'], 1),
        a('Si p = F y q = V, calcula ¬p ∧ q.', ['F', 'V', '¬', 'No definido'], 1),
        tb('Arma la tabla de (p ∧ q) ∨ ¬q resolviendo cada columna paso a paso.', ['p', 'q'], [['V', 'V'], ['V', 'F'], ['F', 'V'], ['F', 'F']],
          [{ t: 'p ∧ q', v: ['V', 'F', 'F', 'F'] }, { t: '¬q', v: ['F', 'V', 'F', 'V'] }, { t: '(p ∧ q) ∨ ¬q', v: ['V', 'V', 'F', 'V'] }]),
      ],
    },
  ],
};

aplicarPistas(NIVEL_2, PISTAS_NIVEL_2);   // cada ejercicio trae su pista (lo que da el comodin)
