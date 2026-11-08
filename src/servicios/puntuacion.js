// Puntuacion de las lecciones. Es el MISMO calculo que hace la base de datos (registrar_leccion en database/migraciones/11): alli es donde
// se otorgan los puntos de verdad; aqui solo se usa para mostrar el resultado y para el modo invitado.
//   Responder bien en el intento 1 -> 10 puntos, 2 -> 7, 3 -> 4, 4 -> 1. Sin acertar en 4 intentos -> 0.
export const MAX_INTENTOS = 4;
export const PUNTOS_POR_INTENTO = Object.freeze({ 1: 10, 2: 7, 3: 4, 4: 1 });

// n debe ser un entero de 1 a 4; cualquier otro valor es un error (nunca se calcula una puntuacion con intentos invalidos).
export function puntosPorIntento(n) {
  if (!Number.isInteger(n) || n < 1 || n > MAX_INTENTOS) throw new RangeError(`Intento fuera de rango: debe estar entre 1 y ${MAX_INTENTOS} (recibido ${n}).`);
  return PUNTOS_POR_INTENTO[n];
}

// intentos: un numero por pregunta = intento en que se acerto (1 a 4) o 0 si se agotaron los 4 intentos sin acertar.
export function validarIntentos(intentos) {
  if (!Array.isArray(intentos) || intentos.length < 1 || intentos.length > 30) throw new RangeError('Se esperaba un intento por pregunta.');
  intentos.forEach((n) => { if (!Number.isInteger(n) || n < 0 || n > MAX_INTENTOS) throw new RangeError(`Intento fuera de rango: ${n}`); });
  return intentos;
}

export const puntosLeccion = (intentos) => validarIntentos(intentos).reduce((s, n) => s + (n === 0 ? 0 : puntosPorIntento(n)), 0);

// Errores = intentos fallidos. Estrellas: 0 errores = 3, 1 o 2 = 2, mas = 1 (igual que la base de datos).
export const erroresLeccion = (intentos) => validarIntentos(intentos).reduce((s, n) => s + (n === 0 ? MAX_INTENTOS : n - 1), 0);
export const estrellasLeccion = (intentos) => { const e = erroresLeccion(intentos); return e === 0 ? 3 : e <= 2 ? 2 : 1; };
