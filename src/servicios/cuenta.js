// Ayudas puras de la cuenta (formato del codigo, correo, nombre de usuario). No hablan con ninguna base de datos.
// Codigo de estudiante: la letra U MAYUSCULA y 8 numeros (9 caracteres en total). Nada de minusculas, espacios ni simbolos.
export const RE_CODIGO = /^U[0-9]{8}$/;
export const DOMINIO = '@utp.edu.pe';
export const RE_CORREO = /^U[0-9]{8}@utp\.edu\.pe$/i;
export const validarCodigo = (c) => RE_CODIGO.test(c);
export const validarCorreo = (c) => RE_CORREO.test(c);
export const correoDe = (c) => `${c}${DOMINIO}`;
// Vista previa: la base de datos es quien asigna el nombre final (agrega .2, .3 ... si se repite).
export const nombreUsuarioDe = (codigo) => `Jugador${codigo.slice(-4)}`;

// Codigo de ejemplo al azar para el placeholder: U + 2 + 4 + 6 digitos (nunca U24207317)
export function codigoEjemplo() {
  let c;
  do { c = `U24${String(Math.floor(Math.random() * 1e6)).padStart(6, '0')}`; } while (c === 'U24207317');
  return c;
}

// Celular de Peru: 9 digitos que empiezan con 9 (el +51 se agrega solo). Se guarda como +51912345678 (formato internacional).
export const RE_CELULAR = /^9[0-9]{8}$/;
export const RE_TELEFONO = /^\+519[0-9]{8}$/;
export const validarCelular = (d) => RE_CELULAR.test(d);
export const telefonoDe = (d) => `+51${d}`;
export const celularDe = (t) => String(t || '').replace(/^\+?51/, '');                         // +51912345678 -> 912345678
export const enmascararTelefono = (t) => (RE_TELEFONO.test(t) ? `+51 9•• ••• ${t.slice(-3)}` : String(t || ''));
export const telefonoDeAuth = (p) => (p ? `+${String(p).replace(/^\+/, '')}` : '');             // Authentication guarda 51912345678
