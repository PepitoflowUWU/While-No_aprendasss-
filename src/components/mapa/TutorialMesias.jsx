import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { usePersonajes } from '../../context/PersonajesContext.jsx';
import { MESIAS } from '../../datos/personajes.js';
import { tratamientoDe } from '../../servicios/escribir.js';
import '../../estilos/tutorial.css';

// TUTORIAL del mapa: el Mesías del Pront explica cada botón (lo resalta, oscurece lo demás y lo señala con una flecha),
// cómo se juega el nivel 1 y cómo funcionan los puntos. Sale la primera vez que se entra al mapa y se repite desde AJUSTES.
// Los botones se buscan por su atributo data-tuto (HUD.jsx, HudCompacto.jsx, Isla.jsx, Mapa.jsx). Si un botón no está
// en pantalla, ese paso se muestra igual, sin resaltar nada.
const VELOCIDAD = 22;   // ms por letra
const BASE = import.meta.env.BASE_URL;

const CLAVE = (sesion) => `wna_tutorial_visto_${sesion?.invitado ? 'invitado' : sesion?.id || 'anonimo'}`;
export const tutorialVisto = (sesion) => { try { return localStorage.getItem(CLAVE(sesion)) === '1'; } catch { return false; } };
export const marcarTutorialVisto = (sesion) => { try { localStorage.setItem(CLAVE(sesion), '1'); } catch { /* sin storage */ } };

function pasosDe({ tratamiento, esAdmin }) {
  return [
    { t: null, texto: `¡Hola, ${tratamiento}! Soy el Mesías del Pront y te voy a enseñar cómo funciona este mundo. Toca SIGUIENTE para continuar.` },
    { t: 'avatar', texto: 'Este eres tú. Tócalo para ver tu ficha: tus puntos, tu progreso y tus logros destacados.' },
    { t: 'nivel', texto: 'Aquí ves en qué nivel vas. Cada nivel es una isla del mapa con varias lecciones.' },
    { t: 'comodines', texto: 'Tus comodines. Si te trabas en un ejercicio, gasta uno y te daré una pista. ¡Úsalos con cuidado, que son pocos!' },
    { t: 'racha', texto: 'Tu racha cuenta los días seguidos que juegas. Si un día no juegas, vuelve a 0.' },
    { t: 'racha-max', texto: 'Aquí queda guardada tu mejor racha, aunque la actual se reinicie.' },
    { t: 'ajustes', texto: 'Ajustes: aquí apagas la música o los efectos, repites este tutorial o cierras sesión.' },
    esAdmin && { t: 'admin', texto: 'El panel de administración: aquí gestionas a los usuarios. Antes de cada cambio te pedirá un código por SMS.' },
    { t: 'perfil', texto: 'Tu mochila: aquí ves tus datos y todo tu progreso.' },
    { t: 'ranking', texto: 'El ranking: compárate con los demás jugadores. ¡Mientras más puntos tengas, más arriba estarás!' },
    { t: 'logros', texto: 'Tus trofeos. Cuando aparece un número rojo, tienes logros por reclamar.' },
    { t: 'nodo-1', scroll: true, texto: 'Toca este punto para entrar al Nivel 1: "¿Qué es un algoritmo?". Los siguientes niveles se abren cuando completas el anterior.' },
    { t: null, texto: 'Cada lección empieza con una pequeña TEORÍA. Léela con calma: de ahí salen las preguntas.' },
    { t: null, texto: 'Después vienen las preguntas con 4 alternativas. Elige una y presiona COMPROBAR. Si te equivocas, puedes volver a intentarlo.' },
    { t: null, texto: 'Los puntos dependen del intento en que aciertas:\n• 1.er intento: 10 puntos\n• 2.º intento: 7 puntos\n• 3.er intento: 4 puntos\n• 4.º intento: 1 punto\nSi fallas 4 veces, esa pregunta no suma. ¡Piensa bien antes de responder!' },
    { t: null, texto: 'Al terminar una lección ganas estrellas: 3 si no fallas ninguna vez, 2 si fallas 1 o 2 veces y 1 si fallas más. Los puntos se ganan la primera vez que completas cada lección y te suben en el ranking.' },
    { t: null, texto: '¡Eso es todo! Ahora te toca a ti. Toca el Nivel 1 y empieza tu aventura.' },
  ].filter(Boolean);
}

// Primer elemento visible con ese data-tuto
function buscar(t) {
  if (!t) return null;
  for (const el of document.querySelectorAll(`[data-tuto="${t}"]`)) {
    const r = el.getBoundingClientRect();
    if (r.width > 0 && r.height > 0) return el;
  }
  return null;
}

function centrarSiHaceFalta(el, inmediato) {
  let sc = el.parentElement;
  while (sc && sc !== document.body) {
    const cs = getComputedStyle(sc);
    if (/(auto|scroll)/.test(cs.overflowX + cs.overflowY) && (sc.scrollWidth > sc.clientWidth || sc.scrollHeight > sc.clientHeight)) break;
    sc = sc.parentElement;
  }
  if (!sc || sc === document.body) return;   // nada desplazable (PC): el mapa no se mueve
  const r = el.getBoundingClientRect(), c = sc.getBoundingClientRect();
  const visible = r.top >= c.top && r.bottom <= c.bottom && r.left >= c.left && r.right <= c.right;
  if (visible) return;
  sc.scrollTo({
    left: sc.scrollLeft + (r.left + r.width / 2) - (c.left + c.width / 2),
    top: sc.scrollTop + (r.top + r.height / 2) - (c.top + c.height / 2),
    behavior: inmediato ? 'auto' : 'smooth',
  });
}

// Imagen del Mesías: la de la tabla `personaje` y, si no está o no carga, la copia del proyecto.
// maxAlto: espacio libre para que nunca tape el botón resaltado (en px; null = sin límite).
function ImagenMesias({ pose, espejo, maxAlto }) {
  const { imagenDe } = usePersonajes();
  const remota = imagenDe(MESIAS[pose].id);
  const [fallo, setFallo] = useState({});
  const src = remota && !fallo[remota] ? remota : `${BASE}${MESIAS[pose].local}`;
  return (
    <img className={`tm-mesias ${espejo ? 'espejo' : ''}`} src={src} alt="" draggable={false}
      style={maxAlto ? { maxHeight: maxAlto } : undefined}
      onError={() => remota && setFallo((f) => ({ ...f, [remota]: true }))} />
  );
}

export default function TutorialMesias({ personaje, esAdmin = false, onFin }) {
  const { porId } = usePersonajes();
  const [pasos] = useState(() => pasosDe({ tratamiento: tratamientoDe(porId(personaje)?.nombre), esAdmin }));
  const [i, setI] = useState(0);
  const [letras, setLetras] = useState(0);
  const [rect, setRect] = useState(null);
  const sigRef = useRef(null);
  const globoRef = useRef(null);
  const [altoGlobo, setAltoGlobo] = useState(190);
  const paso = pasos[i];
  const texto = paso.texto;
  const completo = letras >= texto.length;
  const ultimo = i >= pasos.length - 1;
  const sinAnim = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches || document.documentElement.dataset.animaciones === 'off';

  // Texto letra por letra
  useEffect(() => {
    if (sinAnim()) { setLetras(texto.length); return undefined; }
    setLetras(0);
    const t = setInterval(() => setLetras((n) => { if (n + 1 >= texto.length) clearInterval(t); return n + 1; }), VELOCIDAD);
    return () => clearInterval(t);
  }, [texto]);

  // Sigue la posición del botón resaltado (cambia al desplazar el mapa, girar el celular o mientras carga la pantalla)
  useLayoutEffect(() => {
    let raf;
    const el0 = buscar(paso.t);
    // Solo se desplaza el contenedor del mapa que SE PUEDE desplazar (celular) y solo si el punto queda fuera de la pantalla.
    // Nunca scrollIntoView: también movería contenedores con overflow hidden y el mundo entero quedaba corrido (PC).
    if (el0 && paso.scroll) centrarSiHaceFalta(el0, sinAnim());
    const medir = () => {
      const el = buscar(paso.t);
      const r = el?.getBoundingClientRect();
      setRect((prev) => {
        if (!r) return prev === null ? prev : null;
        if (prev && Math.abs(prev.left - r.left) < 0.5 && Math.abs(prev.top - r.top) < 0.5 && Math.abs(prev.width - r.width) < 0.5 && Math.abs(prev.height - r.height) < 0.5) return prev;
        return { left: r.left, top: r.top, width: r.width, height: r.height };
      });
      raf = requestAnimationFrame(medir);
    };
    medir();
    return () => cancelAnimationFrame(raf);
  }, [paso]);   // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { sigRef.current?.focus({ preventScroll: true }); }, [i]);

  // Alto real del cuadro de texto (cambia con cada texto y al girar el celular)
  useLayoutEffect(() => {
    const h = globoRef.current?.offsetHeight;
    if (h && Math.abs(h - altoGlobo) > 2) setAltoGlobo(h);
  });

  const avanzar = () => {
    if (!completo) { setLetras(texto.length); return; }
    if (ultimo) onFin();
    else setI((n) => Math.min(n + 1, pasos.length - 1));   // doble toque rápido: no se salta un paso
  };

  useEffect(() => {
    const tecla = (e) => {
      if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); onFin(); }
      else if (e.key === 'ArrowRight') { e.preventDefault(); avanzar(); }
    };
    document.addEventListener('keydown', tecla, true);
    return () => document.removeEventListener('keydown', tecla, true);
  });

  // Dónde va el cuadro del Mesías: en la mitad de la pantalla contraria al botón resaltado
  const alto = window.innerHeight, ancho = window.innerWidth;
  const PAD = 6;
  const foco = rect && { left: rect.left - PAD, top: rect.top - PAD, width: rect.width + PAD * 2, height: rect.height + PAD * 2 };
  const cy = foco ? foco.top + foco.height / 2 : alto;
  const cx = foco ? foco.left + foco.width / 2 : 0;
  const panelArriba = !!foco && cy > alto * 0.5;
  const aDerecha = !!foco && cx > ancho * 0.55;
  // Espacio libre entre el borde de la pantalla y el botón resaltado (descontando la flecha). En celular vertical el Mesías
  // va encima del cuadro de texto, así que a ese espacio se le resta el alto del cuadro.
  const columna = window.matchMedia?.('(max-width: 520px)').matches;
  const espacio = foco ? (panelArriba ? foco.top : alto - foco.top - foco.height) - 12 - 34 : Infinity;
  const maxAlto = Number.isFinite(espacio) ? Math.max(110, Math.round(columna ? espacio - altoGlobo + 12 : espacio)) : null;
  const flecha = foco && (panelArriba
    ? { left: cx, top: foco.top - 10, dir: 'abajo' }                  // flecha sobre el botón, apuntando hacia abajo
    : { left: cx, top: foco.top + foco.height + 10, dir: 'arriba' }); // flecha bajo el botón, apuntando hacia arriba

  return createPortal(
    <div className={`tm-velo ${foco ? 'con-foco' : ''}`} role="dialog" aria-modal="true" aria-label="Tutorial del Mesías del Pront" onClick={avanzar}>
      {foco && <div className="tm-foco" style={foco} aria-hidden="true" />}
      {flecha && <div className={`tm-flecha ${flecha.dir}`} style={{ left: flecha.left, top: flecha.top }} aria-hidden="true" />}

      <div className={`tm-panel ${panelArriba ? 'arriba' : 'abajo'} ${aDerecha ? 'derecha' : ''}`}>
        <ImagenMesias pose={foco ? 'senala' : 'pie'} espejo={aDerecha} maxAlto={maxAlto} />
        <div ref={globoRef} className="tm-globo" onClick={(e) => { e.stopPropagation(); avanzar(); }}>
          <span className="tm-nombre">EL MESÍAS DEL PRONT</span>
          <p className="tm-texto" aria-hidden="true">{texto.slice(0, letras)}<span className="tm-resto">{texto.slice(letras)}</span></p>
          <p className="tm-sr" aria-live="polite">{texto}</p>
          <div className="tm-pie">
            <span className="tm-cuenta" aria-label={`Paso ${i + 1} de ${pasos.length}`}>{i + 1} / {pasos.length}</span>
            <div className="tm-btns">
              {!ultimo && <button type="button" className="tm-btn tm-saltar" onClick={(e) => { e.stopPropagation(); onFin(); }}>SALTAR</button>}
              <button ref={sigRef} type="button" className="tm-btn tm-sig" onClick={(e) => { e.stopPropagation(); avanzar(); }}>
                {ultimo ? '¡A JUGAR!' : 'SIGUIENTE'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
