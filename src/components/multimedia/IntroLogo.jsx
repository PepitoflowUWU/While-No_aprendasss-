import { reducirMovimiento } from '../../audio/preferencias.js';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import fondoInicio from '../../assets/fondo-inicio.png';
import '@fontsource/pixelify-sans/latin-400.css';
import '@fontsource/pixelify-sans/latin-700.css';
import PixelTransition from '../comun/PixelTransition.jsx';
import '../../estilos/intro.css';

// Intro con el video del logo de Code Brothers. Estados: puerta -> reproduciendo -> transicion -> fin.
// La transición hacia Inicio es un mosaico de píxeles (PixelTransition).
const BASE = import.meta.env.BASE_URL;
const V_NORMAL = `${BASE}assets/intro/code-brothers.mp4`;
const V_2160 = `${BASE}assets/intro/code-brothers-2160.mp4`;
const V_VERTICAL = `${BASE}assets/intro/code-brothers-vertical.mp4`;

async function existe(url) {
  try {
    const r = await fetch(url, { method: 'HEAD' });
    return r.ok && (r.headers.get('content-type') || '').startsWith('video');
  } catch { return false; }
}

export default function IntroLogo({ onMontarInicio, onFin }) {
  const reducir = useMemo(() => reducirMovimiento(), []);    // sistema o ajuste del juego: sin mosaico, solo un fundido
  const vref = useRef(null);
  const timers = useRef([]);
  const intervalos = useRef([]);
  const transRef = useRef(false);
  const cargado = useRef(false);
  const seguridad = useRef(false);
  const fallos = useRef(0);
  const previos = useRef(null);

  const [src, setSrc] = useState(null);
  const [dim, setDim] = useState(null);
  const [fase, setFase] = useState('puerta');     // puerta | reproduciendo | transicion | fin
  const [sub, setSub] = useState(null);           // fundido (solo con movimiento reducido)
  const [mosaico, setMosaico] = useState(null);   // null | { cubierto }
  const [transparente, setTransparente] = useState(false);
  const [verVideo, setVerVideo] = useState(true);
  const [silenciado, setSilenciado] = useState(false);
  const [bg, setBg] = useState('#FFFFFF');

  const luego = useCallback((fn, ms) => { const t = setTimeout(fn, ms); timers.current.push(t); return t; }, []);

  // Fondo de body y theme-color blancos mientras dura la intro (se restauran al terminar)
  useEffect(() => {
    let meta = document.querySelector('meta[name="theme-color"]');
    const creada = !meta;
    if (creada) { meta = document.createElement('meta'); meta.name = 'theme-color'; document.head.appendChild(meta); }
    previos.current = { bodyBg: document.body.style.background, tema: creada ? null : meta.getAttribute('content'), creada, meta };
    meta.setAttribute('content', '#FFFFFF');
    document.body.style.background = '#FFFFFF';
    return () => {
      const p = previos.current;
      document.body.style.background = p.bodyBg;
      if (p.creada) p.meta.remove(); else p.meta.setAttribute('content', p.tema ?? '');
    };
  }, []);

  // Elige la versión del video: vertical si la pantalla es vertical y existe; 2160 si el ancho físico > 2200 px y existe
  useEffect(() => {
    let vivo = true;
    (async () => {
      let url = V_NORMAL;
      if (window.matchMedia('(orientation: portrait)').matches && await existe(V_VERTICAL)) url = V_VERTICAL;
      else if (window.innerWidth * (window.devicePixelRatio || 1) > 2200 && await existe(V_2160)) url = V_2160;
      if (vivo) setSrc(url);
    })();
    return () => { vivo = false; };
  }, []);

  // Mientras se ve la puerta: precarga las imágenes de Inicio
  useEffect(() => { const i = new Image(); i.src = fondoInicio; }, []);

  // Si el video no carga en 8 s, el mosaico empieza ya completo (solo fases 2 y 3)
  useEffect(() => {
    const t = luego(() => { if (!cargado.current) errorVideo(); }, 8000);
    return () => clearTimeout(t);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const finalizar = useCallback(() => {
    timers.current.forEach(clearTimeout); timers.current = [];
    intervalos.current.forEach(clearInterval); intervalos.current = [];
    const v = vref.current;
    if (v) { v.pause(); v.removeAttribute('src'); v.load(); }
    setVerVideo(false);
    setFase('fin');
    onFin();
  }, [onFin]);

  // Transición: mosaico de píxeles (empieza cuando termina el video). Con movimiento reducido: fundido de 300 ms.
  const iniciarTransicion = useCallback(() => {
    if (transRef.current) return;
    transRef.current = true;
    setFase('transicion');
    if (reducir) { setSub('fundido'); onMontarInicio(); luego(finalizar, 300); return; }
    setMosaico({ cubierto: false });
  }, [reducir, onMontarInicio, luego, finalizar]);

  // Si el video falla o tarda: el mosaico empieza ya completo y solo corren las fases 2 y 3
  function errorVideo() {
    if (transRef.current) return;
    transRef.current = true;
    setFase('transicion');
    if (reducir) { setVerVideo(false); setSub('fundido'); onMontarInicio(); luego(finalizar, 300); return; }
    setMosaico({ cubierto: true });
  }

  // Pantalla totalmente cubierta: desmonta el video y monta Inicio por debajo
  const alCubierto = useCallback(() => {
    const v = vref.current;
    if (v) { v.pause(); v.removeAttribute('src'); v.load(); }
    setVerVideo(false);
    setTransparente(true);
    onMontarInicio();
  }, [onMontarInicio]);

  // Puerta: play() con sonido DENTRO del mismo manejador del evento
  const comenzar = () => {
    const v = vref.current;
    if (!v || !src || fase !== 'puerta') return;
    v.muted = false; v.volume = 1;
    const p = v.play();
    setFase('reproduciendo');
    if (p && p.catch) {
      p.catch((e) => {
        if (e && e.name === 'AbortError') return;
        fallos.current += 1;
        if (fallos.current === 1) { setFase('puerta'); return; }           // primer fallo: vuelve a la puerta
        v.muted = true; setSilenciado(true);                                // segundo fallo: reproduce silenciado
        setFase('reproduciendo');
        v.play().catch(() => errorVideo());
      });
    }
  };

  const activarSonido = () => { const v = vref.current; if (v) { v.muted = false; v.volume = 1; setSilenciado(false); } };

  const bajarAudio = (ms) => {
    const v = vref.current; if (!v) return;
    const pasos = Math.max(5, Math.round(ms / 25)), ini = v.volume; // pasos de ~25 ms: baja suave, sin cortes secos
    let n = 0;
    const id = setInterval(() => { n += 1; v.volume = Math.max(0, ini * (1 - n / pasos)); if (n >= pasos) clearInterval(id); }, ms / pasos);
    intervalos.current.push(id);
  };

  const saltar = useCallback(() => {
    if (fase !== 'reproduciendo' || transRef.current) return;
    iniciarTransicion();
  }, [fase, iniciarTransicion]);

  // Esc = saltar
  useEffect(() => {
    const f = (e) => { if (e.key === 'Escape') saltar(); };
    document.addEventListener('keydown', f);
    return () => document.removeEventListener('keydown', f);
  }, [saltar]);

  // Pausa/reanuda con la pestaña en segundo plano
  useEffect(() => {
    const f = () => {
      const v = vref.current; if (!v || fase !== 'reproduciendo') return;
      if (document.hidden) v.pause(); else v.play().catch(() => {});
    };
    document.addEventListener('visibilitychange', f);
    return () => document.removeEventListener('visibilitychange', f);
  }, [fase]);

  // Limpieza al desmontar
  useEffect(() => () => {
    timers.current.forEach(clearTimeout); intervalos.current.forEach(clearInterval);
    const v = vref.current; if (v) { v.pause(); v.removeAttribute('src'); v.load(); }
  }, []);

  const alMetadata = (e) => {
    const v = e.currentTarget;
    setDim({ w: v.videoWidth, h: v.videoHeight });
  };
  // Primer cuadro: toma el píxel de la esquina superior izquierda como color de fondo (coincide con el blanco del video)
  const alCargarDatos = (e) => {
    cargado.current = true;
    try {
      const c = document.createElement('canvas'); c.width = 1; c.height = 1;
      const ctx = c.getContext('2d', { willReadFrequently: true });
      ctx.drawImage(e.currentTarget, 0, 0, 1, 1, 0, 0, 1, 1);
      const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
      const col = `rgb(${r}, ${g}, ${b})`;
      setBg(col); document.body.style.background = col;
    } catch { /* se queda en #FFFFFF */ }
  };
  const alReproducir = (e) => {
    const v = e.currentTarget;
    if (seguridad.current || !isFinite(v.duration)) return;
    seguridad.current = true;
    luego(iniciarTransicion, (v.duration + 1) * 1000); // respaldo si no llega "ended"
  };

  if (fase === 'fin') return null;

  const ar = dim ? dim.w / dim.h : 16 / 9;
  const estiloVideo = dim ? {
    width: `min(calc(100vw - env(safe-area-inset-left) - env(safe-area-inset-right)), calc((100dvh - env(safe-area-inset-top) - env(safe-area-inset-bottom)) * ${ar}), ${dim.w}px)`,
  } : { width: 'min(100vw, 864px)' };

  return (
    <div className={`intro-root ${sub === 'fundido' ? 'fundido' : ''}`} style={{ background: transparente ? 'transparent' : bg }}>
      {verVideo && src && (
        <div className="intro-escena">
          <video
            ref={vref}
            className="intro-video"
            style={estiloVideo}
            src={src}
            playsInline
            preload="auto"
            disablePictureInPicture
            disableRemotePlayback
            aria-label="Animación del logo de Code Brothers"
            onLoadedMetadata={alMetadata}
            onLoadedData={alCargarDatos}
            onPlaying={alReproducir}
            onEnded={iniciarTransicion}
            onError={errorVideo}
          />
        </div>
      )}

      {fase === 'puerta' && (
        <div className="intro-puerta" role="button" tabIndex={0} aria-label="Comenzar"
          onClick={comenzar}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); comenzar(); } }}>
          <span className="intro-puerta-txt">TOCA PARA COMENZAR</span>
        </div>
      )}

      {fase === 'reproduciendo' && verVideo && (
        <button type="button" className="intro-saltar" onClick={saltar}>SALTAR ›</button>
      )}
      {silenciado && fase === 'reproduciendo' && (
        <button type="button" className="intro-sonido" onClick={activarSonido} aria-label="ACTIVAR SONIDO">
          <svg viewBox="0 0 8 8" width="22" height="22" shapeRendering="crispEdges" aria-hidden="true"><path d="M0 3h2l2-2h1v6H4L2 5H0zM6 2h1v4H6z" fill="currentColor" /></svg>
          <span>ACTIVAR SONIDO</span>
        </button>
      )}

      {mosaico && fase === 'transicion' && (
        <PixelTransition
          empezarCubierto={mosaico.cubierto}
          onStart={() => bajarAudio(500)}   // el audio baja de 1 a 0 en 500 ms al empezar a cubrir
          onCovered={alCubierto}
          onDone={finalizar}
        />
      )}
    </div>
  );
}
