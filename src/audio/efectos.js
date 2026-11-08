// Estructura para EFECTOS DE SONIDO futuros. Todavia no hay ningun archivo de audio: no se inventa ninguno.
// Cuando existan, basta con registrarlos una vez:
//     registrarEfecto('acierto', `${import.meta.env.BASE_URL}assets/audio/acierto.m4a`);
// y usarlos donde corresponda:
//     reproducirEfecto('acierto');
// Si un efecto no esta registrado, reproducirEfecto no hace nada. El interruptor sigue configuracion_usuario.sonido_activado.
const registro = new Map();
let activos = true;

export const registrarEfecto = (nombre, url, volumen = 0.7) => { registro.set(nombre, { url, volumen }); };
export const activarEfectos = (v) => { activos = Boolean(v); };

export function reproducirEfecto(nombre) {
  const e = registro.get(nombre);
  if (!e || !activos) return;
  try {
    const a = new Audio(e.url);
    a.volume = e.volumen;
    a.play().catch(() => {});
  } catch { /* sin audio disponible */ }
}
