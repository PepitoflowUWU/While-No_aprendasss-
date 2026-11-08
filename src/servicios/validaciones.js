// Validaciones de numeros en la aplicacion. Las mismas reglas las impone la base de datos con restricciones CHECK
// (database/migraciones/11): aqui se aplican antes para no enviar valores invalidos y para no mostrar valores imposibles.
export const esEntero = (v) => typeof v === 'number' && Number.isInteger(v);
export const enteroEnRango = (v, min, max) => esEntero(v) && v >= min && (max === undefined || v <= max);

export const RACHA_MAX = 999;
export const COMODINES_MAX = 10;
export const validarRacha = (v) => enteroEnRango(v, 0, RACHA_MAX);
export const validarComodines = (v) => enteroEnRango(v, 0, COMODINES_MAX);
export const validarPuntos = (v) => enteroEnRango(v, 0);

// Para mostrar: lleva un valor al rango permitido (por ejemplo si el servidor devolviera algo raro).
export const acotar = (v, min, max) => (esEntero(v) ? Math.min(max, Math.max(min, v)) : min);
export const rachaSegura = (v) => acotar(v, 0, RACHA_MAX);
export const comodinesSeguros = (v) => acotar(v, 0, COMODINES_MAX);
