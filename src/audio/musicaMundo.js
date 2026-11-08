// Música de fondo SOLO para la pantalla del mundo (mapa de niveles). Un único objeto Audio en bucle,
// con entrada y salida suaves. Se inicia al abrir el mapa y se detiene al salir de él.
const URL_MUSICA = `${import.meta.env.BASE_URL}assets/audio/mundo.m4a`;
const VOLUMEN = 0.45;       // volumen de fondo (0 a 1)
const ENTRADA_MS = 800;
const SALIDA_MS = 500;

let audio = null;
let activa = false;         // el mapa está abierto y la música debe sonar
let fade = 0;
let pendiente = null;       // reintento tras la primera interacción si el navegador bloqueó el audio

function obtener() {
  if (!audio) {
    audio = new Audio(URL_MUSICA);
    audio.loop = true;      // bucle
    audio.preload = 'auto';
    audio.volume = 0;
  }
  return audio;
}

function fundir(a, hasta, ms, alTerminar) {
  clearInterval(fade);
  const desde = a.volume, pasos = Math.max(4, Math.round(ms / 30));
  let n = 0;
  fade = setInterval(() => {
    n += 1;
    a.volume = Math.min(1, Math.max(0, desde + (hasta - desde) * (n / pasos)));
    if (n >= pasos) { clearInterval(fade); alTerminar?.(); }
  }, ms / pasos);
}

function quitarReintento() {
  if (!pendiente) return;
  document.removeEventListener('pointerdown', pendiente);
  document.removeEventListener('keydown', pendiente);
  pendiente = null;
}

function reproducir() {
  const a = obtener();
  const p = a.play();
  if (p && p.catch) {
    p.then(() => fundir(a, VOLUMEN, ENTRADA_MS)).catch(() => {
      // El navegador bloqueó el audio automático: reintenta con la primera interacción del usuario
      if (pendiente) return;
      pendiente = () => { quitarReintento(); if (activa && document.visibilityState === 'visible') reproducir(); };
      document.addEventListener('pointerdown', pendiente);
      document.addEventListener('keydown', pendiente);
    });
  }
}

export function iniciarMusicaMundo() {
  activa = true;
  if (document.visibilityState === 'hidden') return;     // se reanuda al volver a la pestaña
  const a = obtener();
  clearInterval(fade);
  if (!a.paused) { fundir(a, VOLUMEN, ENTRADA_MS); return; } // ya sonando (p. ej. salida cancelada)
  reproducir();
}

export function detenerMusicaMundo() {
  activa = false;
  quitarReintento();
  if (!audio) return;
  const a = audio;
  fundir(a, 0, SALIDA_MS, () => { if (!activa) { a.pause(); a.currentTime = 0; } });
}

// Pausa con la pestaña en segundo plano y reanuda al volver (solo si el mapa sigue abierto)
export function alCambiarVisibilidad() {
  if (!audio || !activa) return;
  if (document.visibilityState === 'hidden') { clearInterval(fade); audio.pause(); }
  else reproducir();
}
