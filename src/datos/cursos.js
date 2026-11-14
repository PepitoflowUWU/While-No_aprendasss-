import { a, or, fl, T } from './helpers.js';
import { NIVEL_1 } from './nivel1.js';
import { NIVEL_2 } from './nivel2.js';
import { NIVEL_3 } from './nivel3.js';
import { NIVEL_4 } from './nivel4.js';
import { NIVEL_5 } from './nivel5.js';
import { NIVEL_6 } from './nivel6.js';
// Posiciones (%) de los nodos sobre public/mapa1.jpg (antiguas; el mapa usa datos/mapNodes.js)
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
      // NIVEL 6 — Examen final (datos/nivel6.js): 1 lección, 10 ejercicios, 40 minutos, nota C / B / A / AD
      // ──────────────────────────────────────────────────────────────
      NIVEL_6,
    ],
  },
];
