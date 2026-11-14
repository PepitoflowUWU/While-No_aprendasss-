// CÓDIGOS del juego (Ajustes › CÓDIGOS). Cada código vale SOLO para el mundo donde se escribe.
//  · MESIAS     → comodines ilimitados en ese mundo: sin límite de usos y sin gastar los que tiene.
//  · HELLO_WORD → todos los niveles de ese mundo quedan abiertos (no hace falta completar el anterior).
// Con cuenta, se guardan en la base (database/migraciones/35_codigos_mundo.sql: canjear_codigo); el invitado los guarda en la pestaña.
export const CODIGOS = {
  MESIAS: { titulo: 'Comodines ilimitados', detalle: 'Puedes usar todos los comodines que quieras en este mundo.' },
  HELLO_WORD: { titulo: 'Todos los niveles abiertos', detalle: 'Ya puedes entrar a cualquier nivel de este mundo.' },
};

// "hello word" / "Hello-Word" / " MESÍAS " → HELLO_WORD / MESIAS
export const normalizarCodigo = (txt) => String(txt || '')
  .normalize('NFD').replace(/[̀-ͯ]/g, '')
  .trim().toUpperCase().replace(/[\s-]+/g, '_');

export const esCodigoValido = (codigo) => Object.prototype.hasOwnProperty.call(CODIGOS, codigo);
