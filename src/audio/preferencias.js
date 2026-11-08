// Preferencia de MUSICA del juego (activada / desactivada), compartida por Inicio (Opciones) y el mapa.
// - Sin sesion: se recuerda en este navegador.
// - Con sesion: la fuente de verdad es configuracion_usuario.musica_activada (la guarda/recupera App).
import { useSyncExternalStore } from 'react';

const KEY = 'wna-musica';
let activa = (() => { try { return localStorage.getItem(KEY) !== '0'; } catch { return true; } })();
const oyentes = new Set();

export const leerMusica = () => activa;

export function fijarMusica(valor) {
  const v = Boolean(valor);
  if (v === activa) return;
  activa = v;
  try { localStorage.setItem(KEY, v ? '1' : '0'); } catch { /* sin storage */ }
  oyentes.forEach((f) => f());
}

export function useMusicaActiva() {
  return useSyncExternalStore(
    (f) => { oyentes.add(f); return () => oyentes.delete(f); },
    () => activa,
    () => true,
  );
}

// ---- Animaciones y efectos visuales (activadas / desactivadas) --------------------------------------------------
// Misma logica que la musica: sin sesion se recuerda en este navegador; con sesion la fuente de verdad es
// configuracion_usuario.animaciones_activadas (la guarda y recupera App). Se aplica a toda la pantalla mediante el
// atributo data-animaciones de <html> (ver estilos/sin-animaciones.css) y los componentes que dibujan efectos con JS.
const KEY_ANIM = 'wna-animaciones';
let animaciones = (() => { try { return localStorage.getItem(KEY_ANIM) !== '0'; } catch { return true; } })();
const oyentesAnim = new Set();
const marcarHtml = () => { try { document.documentElement.dataset.animaciones = animaciones ? 'on' : 'off'; } catch { /* sin DOM */ } };
marcarHtml();

export const leerAnimaciones = () => animaciones;

export function fijarAnimaciones(valor) {
  const v = Boolean(valor);
  if (v === animaciones) return;
  animaciones = v;
  try { localStorage.setItem(KEY_ANIM, v ? '1' : '0'); } catch { /* sin storage */ }
  marcarHtml();
  oyentesAnim.forEach((f) => f());
}

export function useAnimaciones() {
  return useSyncExternalStore(
    (f) => { oyentesAnim.add(f); return () => oyentesAnim.delete(f); },
    () => animaciones,
    () => true,
  );
}

// true si hay que evitar el movimiento: el usuario apago las animaciones o su sistema pide "reducir movimiento".
export function reducirMovimiento() {
  try { return !animaciones || window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch { return !animaciones; }
}
