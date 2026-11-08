import { useCallback, useEffect, useRef, useState } from 'react';
import { MAP_NODES } from '../../datos/mapNodes';
import NodoMoneda from './NodoMoneda';
import NubesMapa from './NubesMapa';
import EfectosMapa from './EfectosMapa';
import { reducirMovimiento } from '../../audio/preferencias.js';
import HudCompacto from './HudCompacto';
import { PixelArt, BITMAPS } from '../comun/PixelArt';
import { PlayerSprite } from '../comun/PixelIcons';
import { usePersonajes } from '../../context/PersonajesContext.jsx';
import { imagenSinFondo } from '../../utils/quitarFondo.js';

const BASE = import.meta.env.BASE_URL;
const FONDO = `${BASE}assets/mapa/fondo.png`;               // mapa SIN nubes (activa las nubes animadas)
const FONDO_ORIGINAL = `${BASE}assets/mapa/fondo-original.png`; // mapa con nubes dibujadas
const COMPACTO = '(max-width: 899px), (max-height: 559px)';
const CALIBRAR = import.meta.env.DEV && new URLSearchParams(window.location.search).get('calibrar') === '1';

function useCompacto() {
  const [m, setM] = useState(() => window.matchMedia(COMPACTO).matches);
  useEffect(() => {
    const mq = window.matchMedia(COMPACTO);
    const f = () => setM(mq.matches);
    mq.addEventListener('change', f);
    window.addEventListener('resize', f);   // respaldo: algunos navegadores no avisan el cambio al rotar o redimensionar
    return () => { mq.removeEventListener('change', f); window.removeEventListener('resize', f); };
  }, []);
  return m;
}

// Muñeco del mapa: versión mini del personaje elegido (chico o chica). Si no hay imagen, usa el sprite de siempre.
// El muneco sale de personaje.imagen_mini_url. Si esa imagen no carga (enlace mal escrito, archivo borrado), usa la imagen
// grande del personaje, y si tampoco, el sprite de siempre. Los sprites chicos se ven con pixeles duros; los grandes, suaves.
export function JugadorMapa({ personaje }) {
  const [fallo, setFallo] = useState(false);
  const [grande, setGrande] = useState(false);
  const [pixelado, setPixelado] = useState(false);
  const [limpia, setLimpia] = useState(null);            // { src, url }: la imagen sin fondo magenta
  const { porId } = usePersonajes();
  const p = porId(personaje);
  const src = p ? (grande ? p.imagen : p.mini) : null;
  // Si la imagen trae el fondo magenta (#FF00FF) de la IA, se quita al cargarla. Mientras tanto se mantiene oculta.
  useEffect(() => {
    let vivo = true;
    if (src) imagenSinFondo(src, { recortar: true }).then((url) => { if (vivo) setLimpia({ src, url }); });
    return () => { vivo = false; };
  }, [src]);
  if (!p || fallo) return <PlayerSprite width={24} />;
  const lista = limpia?.src === src;
  return (
    <img className="player-img" src={lista ? limpia.url : src} alt="" draggable={false}
      style={{ '--k': p.escala, imageRendering: pixelado ? 'pixelated' : 'auto', visibility: lista ? 'visible' : 'hidden' }}
      onLoad={(e) => setPixelado(e.currentTarget.naturalHeight > 0 && e.currentTarget.naturalHeight <= 200)}
      onError={() => { if (!grande && p.imagen && p.mini !== p.imagen) setGrande(true); else setFallo(true); }} />
  );
}

export default function Mapa({
  niveles, hechos, actual, pos, onElegir,
  aviso, children, hudDatos, personaje,
  recienDesbloqueado = null, // índice del nodo recién desbloqueado (destello de 300 ms)
}) {
  const [info, setInfo] = useState(null);
  const [conNubes, setConNubes] = useState(false);
  const [oculto, setOculto] = useState(document.hidden);
  const [fuera, setFuera] = useState(false);
  const compacto = useCompacto();
  const rootRef = useRef(null);
  const scrollRef = useRef(null);
  const escRef = useRef(null);
  const playerRef = useRef(null);
  const imgRef = useRef(null);
  const barras = useRef({ top: 0, bottom: 0 });

  const i = info ?? actual;
  const leccionesCompletadasInfo = hechos[i]?.lecciones?.filter((l) => l > 0).length || 0;
  const totalLeccionesInfo = niveles[i]?.lecciones?.length || 5;
  // Solo hay MAP_NODES.length posiciones en el fondo. Los niveles sobrantes no se dibujan (ver TODO en mapNodes.js).
  const visibles = Math.min(niveles.length, MAP_NODES.length);
  const nodoDe = (k) => MAP_NODES[Math.min(k, MAP_NODES.length - 1)];

  // Si existe fondo.png (sin nubes) se usa con nubes animadas; si no, fondo-original.png sin animar nubes.
  useEffect(() => {
    const img = new Image();
    img.onload = () => setConNubes(true);
    img.src = FONDO;
  }, []);

  // Pausa todas las animaciones con la pestaña oculta
  useEffect(() => {
    const f = () => setOculto(document.hidden);
    document.addEventListener('visibilitychange', f);
    return () => document.removeEventListener('visibilitychange', f);
  }, []);

  // Nitidez del fondo: al ampliar se mantienen los píxeles duros; al reducir se suaviza para evitar dientes de sierra.
  useEffect(() => {
    const esc = escRef.current, img = imgRef.current;
    const ajustar = () => {
      const natural = img.naturalWidth || 1672;
      const escala = (esc.clientWidth * (window.devicePixelRatio || 1)) / natural;
      rootRef.current.querySelectorAll('img.bgimg').forEach((el) => { el.style.imageRendering = escala >= 1 ? 'pixelated' : 'auto'; });
    };
    ajustar();
    img.addEventListener('load', ajustar);
    const ro = new ResizeObserver(ajustar);
    ro.observe(esc);
    return () => { ro.disconnect(); img.removeEventListener('load', ajustar); };
  }, [conNubes, compacto]);

  // ---------- Botón "centrar en mi nivel" (modo compacto) ----------
  // scrollerRef = .mapa-scroll: el elemento con overflow:auto que REALMENTE contiene el escenario.
  const esCompacto = () => window.matchMedia(COMPACTO).matches;
  const getDisco = () => escRef.current?.querySelector('.mn[data-actual="true"] .mn-body'); // el disco (no la etiqueta, ni el anillo, ni el sprite)

  const centrarEnMiNivel = useCallback((suave) => {
    const scroller = scrollRef.current, nodo = getDisco();
    if (!scroller || !nodo) {
      if (import.meta.env.DEV) console.warn('[centrar] falta el scroller o el nodo actual');
      return;
    }
    const s = scroller.getBoundingClientRect();
    const n = nodo.getBoundingClientRect();
    const { top: altoSup, bottom: altoInf } = barras.current;
    const destinoX = scroller.scrollLeft + (n.left + n.width / 2) - (s.left + s.width / 2);
    const destinoY = scroller.scrollTop + (n.top + n.height / 2) - (s.top + altoSup + (s.height - altoSup - altoInf) / 2);
    const x = Math.min(Math.max(destinoX, 0), scroller.scrollWidth - scroller.clientWidth);
    const y = Math.min(Math.max(destinoY, 0), scroller.scrollHeight - scroller.clientHeight);
    if (CALIBRAR) {
      console.log('[centrar]', { destinoX, destinoY, scroller: { left: s.left, top: s.top, width: s.width, height: s.height, scrollLeft: scroller.scrollLeft, scrollTop: scroller.scrollTop, scrollWidth: scroller.scrollWidth, clientWidth: scroller.clientWidth }, nodo: { left: n.left, top: n.top, width: n.width, height: n.height }, altoSup, altoInf });
    }
    const reducido = reducirMovimiento();
    scroller.scrollTo({ left: x, top: y, behavior: suave && !reducido ? 'smooth' : 'auto' });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Visibilidad: el botón aparece si el centro del disco queda fuera del área visible (scroller - barras - 24 px)
  const calcFuera = useCallback(() => {
    const sc = scrollRef.current, nodo = getDisco();
    if (!sc || !nodo || !esCompacto() || (sc.scrollWidth <= sc.clientWidth && sc.scrollHeight <= sc.clientHeight)) { setFuera(false); return; }
    const s = sc.getBoundingClientRect(), n = nodo.getBoundingClientRect();
    const { top, bottom } = barras.current, M = 24;
    const cx = n.left + n.width / 2, cy = n.top + n.height / 2;
    setFuera(cx < s.left + M || cx > s.right - M || cy < s.top + top + M || cy > s.bottom - bottom - M);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const alMedir = useCallback((m) => {
    barras.current = m;
    rootRef.current?.style.setProperty('--bar-top', `${m.top}px`);
    rootRef.current?.style.setProperty('--bar-bottom', `${m.bottom}px`);
    rootRef.current?.style.setProperty('--barra-inferior-h', `${m.bottom}px`);
    calcFuera();
  }, [calcFuera]);

  // (a) Al abrir: imagen cargada + fuentes listas + escenario con medidas (2 rAF); si no hay desplazamiento, reintenta a los 300 ms
  useEffect(() => {
    let vivo = true, t = 0;
    const img = imgRef.current, sc = scrollRef.current;
    const imgLista = new Promise((res) => {
      if (img.complete && img.naturalWidth) res();
      else { img.addEventListener('load', res, { once: true }); img.addEventListener('error', res, { once: true }); }
    });
    Promise.all([imgLista, document.fonts?.ready ?? Promise.resolve()]).then(() => {
      requestAnimationFrame(() => requestAnimationFrame(() => {
        if (!vivo || !esCompacto()) return;
        centrarEnMiNivel(false);
        if (sc.scrollWidth <= sc.clientWidth) t = setTimeout(() => vivo && centrarEnMiNivel(false), 300);
        calcFuera();
      }));
    });
    return () => { vivo = false; clearTimeout(t); };
  }, [centrarEnMiNivel, calcFuera, compacto]);

  // (b) Al cambiar el nivel actual: centra SOLO cuando el personaje terminó de moverse al nodo nuevo
  const montado = useRef(false);
  const actualPrevio = useRef(actual);
  const pendiente = useRef(false);
  const posPrevia = useRef(pos);
  useEffect(() => {
    const anterior = posPrevia.current; posPrevia.current = pos;
    if (!montado.current) { montado.current = true; return undefined; }
    if (actualPrevio.current !== actual) { actualPrevio.current = actual; pendiente.current = true; }
    if (!pendiente.current || pos !== actual || !esCompacto()) return undefined;
    const fin = () => { pendiente.current = false; centrarEnMiNivel(true); };
    const player = playerRef.current;
    if (anterior === pos || !player) { fin(); return undefined; }       // el personaje ya estaba en ese nodo
    let hecho = false;
    const una = () => { if (!hecho) { hecho = true; fin(); } };
    const f = (e) => { if (e.target === player && (e.propertyName === 'left' || e.propertyName === 'top')) una(); };
    player.addEventListener('transitionend', f);
    const t = setTimeout(una, 900);                                      // respaldo (la transición dura .6 s)
    return () => { player.removeEventListener('transitionend', f); clearTimeout(t); };
  }, [actual, pos, centrarEnMiNivel]);

  // (c) Al rotar o cambiar el tamaño: centra con 150 ms de retraso
  useEffect(() => {
    let t = 0;
    const f = () => { clearTimeout(t); t = setTimeout(() => { if (esCompacto()) { centrarEnMiNivel(false); } calcFuera(); }, 150); };
    window.addEventListener('resize', f);
    window.addEventListener('orientationchange', f);
    return () => { clearTimeout(t); window.removeEventListener('resize', f); window.removeEventListener('orientationchange', f); };
  }, [centrarEnMiNivel, calcFuera]);

  // Visibilidad del botón: listener de scroll pasivo (con rAF) y ResizeObserver
  useEffect(() => {
    const sc = scrollRef.current;
    let raf = 0;
    const f = () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(calcFuera); };
    sc.addEventListener('scroll', f, { passive: true });
    const ro = new ResizeObserver(f);
    ro.observe(sc);
    f();
    return () => { cancelAnimationFrame(raf); sc.removeEventListener('scroll', f); ro.disconnect(); };
  }, [calcFuera, compacto, actual, pos]);

  // Modo de ajuste (solo desarrollo): ?calibrar=1
  useEffect(() => {
    if (!CALIBRAR) return;
    MAP_NODES.forEach(([x, y], k) => console.log(`[calibrar] nivel ${k + 1}: x ${x}%, y ${y}%`));
    const t = setTimeout(() => console.log(`[calibrar] animaciones activas: ${document.getAnimations().length}`), 1500);
    return () => clearTimeout(t);
  }, []);

  const jugador = nodoDe(pos);
  const strip = `Nivel ${i + 1} · ${niveles[i]?.t || '—'} · ${leccionesCompletadasInfo}/${totalLeccionesInfo}`;

  return (
    <div ref={rootRef} className={`wrap mapa-root ${oculto ? 'is-paused' : ''}`}>
      <div className="mapa-scroll" ref={scrollRef}>
        {/* Modo amplio: relleno con el mapa reflejado a los costados (las nubes continúan como silueta) */}
        {!compacto && ['izq', 'der', 'arr', 'aba'].map((k) => (
          <img key={k} className={`bgimg fondo-espejo ${k}`} src={conNubes ? FONDO : FONDO_ORIGINAL} alt="" aria-hidden="true" draggable={false} />
        ))}
        <div className="escenario" ref={escRef}>
          <img ref={imgRef} className="bgimg mapa-fondo" src={conNubes ? FONDO : FONDO_ORIGINAL} alt="" draggable={false} />
          {conNubes && <NubesMapa />}
          <EfectosMapa pausado={oculto} />

          {/* Nodos: botones HTML sobre los discos del fondo */}
          {niveles.slice(0, visibles).map((n, k) => {
            const esHecho = Boolean(hechos[k]?.completado);
            const esActual = k === actual;
            const esBloqueado = k > actual;
            let st;
            if (esBloqueado) st = 'lock';
            else if (esHecho) st = 'gold-medallion';
            else if (esActual) st = 'now';
            else st = 'open';

            const lecciones = hechos[k]?.lecciones || [0, 0, 0, 0, 0];
            const totalLecciones = n.lecciones?.length || 5;
            const estrellasNivel = esHecho ? Math.max(1, Math.min(3, Math.round(lecciones.reduce((a, b) => a + b, 0) / totalLecciones))) : 0;
            const estado = esHecho ? 'completado' : esBloqueado ? 'bloqueado' : 'disponible';
            // límite de animaciones simultáneas: solo centellean las estrellas de los 2 últimos niveles completados
            const centellea = esHecho && k >= actual - 2;

            return (
              <button
                key={k}
                type="button"
                className={`mn ${st}`}
                data-actual={esActual ? 'true' : undefined}
                style={{ left: `${MAP_NODES[k][0]}%`, top: `${MAP_NODES[k][1]}%` }}
                aria-label={`Nivel ${k + 1}, ${estado}`}
                title={n.t}
                onMouseEnter={() => setInfo(k)}
                onMouseLeave={() => setInfo(null)}
                onFocus={() => setInfo(k)}
                onBlur={() => setInfo(null)}
                onClick={() => onElegir(k)}
              >
                <NodoMoneda st={st} flash={k === recienDesbloqueado} centellea={centellea} />
                <span className={`mn-tag ${k === pos ? 'alto' : ''} ${esActual ? 'bob' : ''}`}>{k + 1}</span>
                {esHecho && (
                  <span className="mn-stars" role="img" aria-label={`${estrellasNivel} de 3 estrellas`}>
                    {[1, 2, 3].map((e) => (
                      <span key={e} className={e <= estrellasNivel ? 'on' : ''}><PixelArt rows={BITMAPS.star} fluid /></span>
                    ))}
                  </span>
                )}
              </button>
            );
          })}

          {/* Personaje: de pie sobre el nodo donde está (base en el centro del disco) */}
          <div ref={playerRef} className="player" style={{ left: `${jugador[0]}%`, top: `${jugador[1]}%` }}>
            <JugadorMapa personaje={personaje} />
          </div>

          {CALIBRAR && MAP_NODES.map(([x, y], k) => (
            <span key={k} className="calibrar" style={{ left: `${x}%`, top: `${y}%` }}>+<b>{k + 1}</b></span>
          ))}
        </div>
      </div>

      {compacto ? (
        <>
          <HudCompacto
            actual={actual} {...hudDatos} strip={strip} fuera={fuera}
            onCentrar={() => centrarEnMiNivel(true)} onMedidas={alMedir}
          />
          {aviso && <div className="toast toast-compacto" role="status">{aviso}</div>}
        </>
      ) : (
        <div className="hud-layer">
          {children}
          <div className="mp-item mp-info" role="status" aria-live="polite">
            <div className="mp-info-title">NIVEL {i + 1}</div>
            <div className="mp-info-tema">{niveles[i]?.t || '—'}</div>
            <div className="mp-info-prog">Progreso: {leccionesCompletadasInfo} / {totalLeccionesInfo} lecciones</div>
          </div>
          {aviso && <div className="toast" role="status">{aviso}</div>}
        </div>
      )}
    </div>
  );
}
