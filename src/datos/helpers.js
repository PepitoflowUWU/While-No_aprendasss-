// Constructores de contenido (los usan cursos.js y nivel1.js).
// extra (opcional) puede traer: codigo (fragmento de pseudocodigo que se muestra con la pregunta), pista (lo que da el comodin)
// y traza (ejecucion paso a paso que se anima al responder bien; ver components/EjecucionPasoAPaso.jsx).
export const a  = (p, o, ans, extra = {}) => ({ tipo: 'alt',    p, o, a: ans, ...extra });   // pregunta con alternativas (ans = indice de la correcta)
export const or = (p, l, extra = {})      => ({ tipo: 'orden',  p, l, ...extra });
export const fl = (p, l, extra = {})      => ({ tipo: 'flujo',  p, l, ...extra });
export const T  = (titulo, texto, codigo = null, grafico = null) => ({ titulo, texto, codigo, grafico });
// Ejercicio de TABLA DE VERDAD: el estudiante completa las columnas de resultado (V o F) fila por fila.
//   entradas: nombres de las proposiciones, p. ej. ['p', 'q']
//   filas:    valores de las entradas en cada fila, p. ej. [['V','V'], ['V','F'], ['F','V'], ['F','F']]
//   salidas:  columnas a completar: [{ t: 'p ∧ q', v: ['V','F','F','F'] }, ...] (v = resultado correcto de cada fila)
export const tb = (p, entradas, filas, salidas, extra = {}) => ({ tipo: 'tabla', p, entradas, filas, salidas, ...extra });

// Ejercicio de CODIGO para ESCRIBIR: el estudiante escribe lo que falta en cada espacio ______ de la plantilla (sin opciones).
//   titulo:      "Problema 1. Registrar la edad de un estudiante"      plantilla: codigo con espacios ______
//   respuestas:  lo que va en cada espacio, en orden, p. ej. ['DEFINIR', 'ENTERO', 'edad']
//   aceptadas:   (opcional) otras formas completas igual de correctas, p. ej. [['5 + contador']] cuando se puede escribir en otro orden
//   resultado:   (opcional) lo que se obtiene al ejecutarlo, p. ej. 'Resultado: 150 puntos.'      pista: lo que da el comodin
export const cd = (p, titulo, plantilla, respuestas, extra = {}) => ({ tipo: 'escribir', p, titulo, plantilla, respuestas, ...extra });

// ¿La leccion abre con las diapositivas de teoria? Las lecciones marcadas sinTeoria (practica, como el nivel 4) van DIRECTO a los
// ejercicios; la teoria sigue disponible con el boton TEORIA de la pantalla de pregunta.
// Armar un diagrama de flujo con caminos Si / No (servicios/diagrama.js). d = solucion; distractores = bloques que sobran.
export const dg = (p, d, extra = {}) => ({ tipo: 'diagrama', p, d, ...extra });
export const empiezaConTeoria = (leccion) => !leccion?.sinTeoria;
