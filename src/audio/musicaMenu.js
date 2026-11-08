// Musica del MENU: Inicio, Crear cuenta, Iniciar sesion y Seleccion de personaje (pista: assets/audio/inicio.m4a).
// - Al entrar al mundo se pausa con un fundido (alli suena la musica del mundo) y, al volver, continua donde quedo.
// - Se reproduce en bucle SIN cortes: dos reproductores se turnan y se funden entre si antes de que termine la pista
//   (la pista tiene su propio final, asi que un loop simple sonaria con un salto).
// - Respeta la preferencia de musica (Opciones) y se pausa si la pestana queda oculta.
const URL_MUSICA = `${import.meta.env.BASE_URL}assets/audio/inicio.m4a`;
// La pista esta masterizada mucho mas fuerte que la del mundo (-15.5 LUFS frente a -25.8 LUFS a volumen 0.45),
// por eso el volumen es bajo: asi las dos suenan parecido al pasar de una a otra.
const VOLUMEN = 0.18;
const ENTRADA_MS = 1500;      // fundido al empezar o reanudar
const SALIDA_MS = 800;        // fundido al pausar
const CRUCE_MS = 3000;        // fundido entre el final de una vuelta y el inicio de la siguiente
const PASO_MS = 40;

let pistas = null;            // dos reproductores [{ a: Audio, g: ganancia 0..1 }]
let actual = 0;               // cual de los dos es la vuelta en curso
let cruzando = false;
let master = 0;               // fundido general 0..1 (sube al sonar, baja al pausar)
let quiere = false;           // la musica debe estar sonando
let timer = 0;
let ultimo = 0;
let pendiente = null;         // reintento tras la primera interaccion si el navegador bloqueo el audio automatico

const acotar = (v) => Math.min(1, Math.max(0, v));
const duracion = (a) => (Number.isFinite(a.duration) ? a.duration : 0);

function crear() {
  if (pistas) return;
  pistas = [0, 1].map(() => {
    const a = new Audio(URL_MUSICA);
    a.preload = 'auto';
    a.volume = 0;
    return { a, g: 0 };
  });
  pistas[0].g = 1;
}

function quitarReintento() {
  if (!pendiente) return;
  document.removeEventListener('pointerdown', pendiente);
  document.removeEventListener('keydown', pendiente);
  pendiente = null;
}

function parar() {
  clearInterval(timer);
  timer = 0;
}

function tick() {
  const ahora = Date.now();
  const dt = Math.min(200, ahora - ultimo);
  ultimo = ahora;

  // fundido general: sube al sonar, baja al pausar
  const meta = quiere ? 1 : 0;
  master = meta > master ? Math.min(meta, master + dt / ENTRADA_MS) : Math.max(meta, master - dt / SALIDA_MS);

  const p = pistas[actual], q = pistas[1 - actual];
  const d = duracion(p.a);
  // se acerca el final de la vuelta: arranca la siguiente desde el principio y se funden
  if (!cruzando && !p.a.paused && d && d - p.a.currentTime <= CRUCE_MS / 1000) {
    cruzando = true;
    q.a.currentTime = 0;
    q.a.play().catch(() => {});
  }
  if (cruzando) {
    p.g = acotar(p.g - dt / CRUCE_MS);
    q.g = acotar(q.g + dt / CRUCE_MS);
    if (q.g >= 1) {                         // termino el cruce: la vuelta anterior queda lista para la proxima
      p.a.pause(); p.a.currentTime = 0; p.g = 0;
      actual = 1 - actual; cruzando = false;
    }
  }
  pistas.forEach((x) => { x.a.volume = acotar(VOLUMEN * master * x.g); });

  // pausa de verdad cuando el fundido de salida termino (la posicion se conserva para reanudar)
  if (!quiere && master === 0) {
    pistas.forEach((x) => x.a.pause());
    parar();
  }
}

function arrancarTemporizador() {
  if (timer) return;
  ultimo = Date.now();
  timer = setInterval(tick, PASO_MS);
}

function reproducir() {
  crear();
  const reproductores = cruzando ? pistas : [pistas[actual]];
  Promise.all(reproductores.map((x) => x.a.play())).then(arrancarTemporizador).catch(() => {
    // El navegador bloqueo el audio automatico: se reintenta con la primera interaccion del usuario
    if (pendiente || !quiere) return;
    pendiente = () => { quitarReintento(); if (quiere && document.visibilityState === 'visible') reproducir(); };
    document.addEventListener('pointerdown', pendiente);
    document.addEventListener('keydown', pendiente);
  });
  arrancarTemporizador();
}

export function iniciarMusicaMenu() {
  quiere = true;
  if (document.visibilityState === 'hidden') return;     // se reanuda al volver a la pestana
  reproducir();
}

export function pausarMusicaMenu() {
  quiere = false;
  quitarReintento();
  if (!pistas) return;
  arrancarTemporizador();                                // el fundido de salida lo hace el temporizador y luego pausa
}

// Pestana oculta: pausa al instante; al volver, continua si la musica debia sonar.
export function alCambiarVisibilidad() {
  if (!pistas) return;
  if (document.visibilityState === 'hidden') {
    pistas.forEach((x) => x.a.pause());
    parar();
  } else if (quiere) {
    reproducir();
  }
}
