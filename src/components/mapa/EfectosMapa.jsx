import React, { useEffect, useRef, useState } from 'react';
import { reducirMovimiento, useAnimaciones } from '../../audio/preferencias.js';

// Luz y vida sobre el fondo (sin modificar la imagen). Todo en % del escenario, pointer-events:none,
// aria-hidden y mix-blend-mode: screen. Solo se animan transform y opacity.
const P = (x, y, extra = {}) => ({ '--x': `${x}%`, '--y': `${y}%`, ...extra });
const CHIPS = [[79.2, 49.9, 2.4, 0], [65.2, 27.1, 3.1, -1.2], [52.6, 33.3, 2.1, -.6], [45.6, 76.7, 3.5, -2], [30.2, 62.9, 2.7, -1.7]];
const DESTELLOS = [[27.0, 6.9, '#FFFFFF', 2.2, 0], [28.9, 9.0, '#FFFFFF', 2.8, -1.1], [97.8, 27.8, '#FFFFFF', 2.5, -.7], [53.4, 10.6, '#FFD84A', 3, -.5]];

function useMovil() {
  const q = '(max-aspect-ratio: 6/5), (max-width: 700px)';
  const [m, setM] = useState(() => window.matchMedia(q).matches);
  useEffect(() => {
    const mq = window.matchMedia(q);
    const f = () => setM(mq.matches);
    mq.addEventListener('change', f);
    return () => mq.removeEventListener('change', f);
  }, []);
  return m;
}

// Luciérnagas y destellos del mar: un solo <canvas> cada uno (así no son 20 elementos animados).
function CanvasVida({ tipo, cantidad, pausado }) {
  const ref = useRef(null);
  useEffect(() => {
    const cv = ref.current, ctx = cv.getContext('2d');
    const quieto = reducirMovimiento();
    let w = 0, h = 0, u = 1, raf = 0, last = 0;
    const rnd = (a, b) => a + Math.random() * (b - a);
    const cuadro = (x, y, s) => ctx.fillRect(Math.round(x - s / 2), Math.round(y - s / 2), s, s);

    // zonas de mar (x, y en %): izquierda x<8, derecha x>93 y franja superior y<7
    const zonas = [[1, 7.5, 3, 97], [93, 99, 3, 97], [1, 99, 1, 7]];
    const sitioMar = () => { const z = zonas[(Math.random() * zonas.length) | 0]; return [rnd(z[0], z[1]), rnd(z[2], z[3])]; };
    const luciernagas = Array.from({ length: cantidad }, () => ({ x: rnd(15, 88), y: rnd(30, 88), per: rnd(6, 10), fase: rnd(0, 6.28), par: rnd(1.4, 2.6) }));
    const destellos = Array.from({ length: cantidad }, () => ({ pos: sitioMar(), nace: rnd(-4, 0), vida: rnd(2, 4) }));

    const medir = () => {
      w = cv.clientWidth; h = cv.clientHeight; u = w / 100;
      const d = Math.min(window.devicePixelRatio || 1, 2);
      cv.width = Math.round(w * d); cv.height = Math.round(h * d);
      ctx.setTransform(d, 0, 0, d, 0, 0);
    };
    const dibujar = (t) => {
      ctx.clearRect(0, 0, w, h);
      const s = Math.max(2, Math.round(0.4 * u));
      if (tipo === 'luciernagas') {
        luciernagas.forEach((f) => {
          const a = quieto ? 0.6 : 0.25 + 0.75 * (0.5 + 0.5 * Math.sin((t / f.par) * 2 + f.fase));
          const x = (f.x / 100) * w + (quieto ? 0 : Math.sin((t / f.per) * 6.283 + f.fase) * 1.5 * u);
          const y = (f.y / 100) * h + (quieto ? 0 : Math.cos((t / f.per) * 6.283 + f.fase * 1.3) * 1.5 * u);
          ctx.fillStyle = `rgba(232,255,138,${a * 0.35})`; cuadro(x, y, s * 3);
          ctx.fillStyle = `rgba(232,255,138,${a})`; cuadro(x, y, s);
        });
      } else {
        destellos.forEach((d) => {
          let edad = t - d.nace;
          if (edad > d.vida) { d.pos = sitioMar(); d.nace = t + rnd(0, 1.5); d.vida = rnd(2, 4); edad = -1; }
          if (edad < 0 && !quieto) return;
          const a = quieto ? 0.6 : Math.sin((Math.PI * edad) / d.vida);
          const x = (d.pos[0] / 100) * w, y = (d.pos[1] / 100) * h, c = Math.max(2, Math.round(0.3 * u));
          ctx.fillStyle = `rgba(255,255,255,${a})`;
          cuadro(x, y, c); cuadro(x - c, y, c); cuadro(x + c, y, c); cuadro(x, y - c, c); cuadro(x, y + c, c);
        });
      }
    };
    const loop = (ms) => {
      raf = requestAnimationFrame(loop);
      if (ms - last < 50) return; // ~20 fps, estilo retro y ligero
      last = ms; dibujar(ms / 1000);
    };
    medir();
    const ro = new ResizeObserver(() => { medir(); if (quieto || pausado) dibujar(0); });
    ro.observe(cv);
    if (quieto) dibujar(0);
    else if (!pausado) raf = requestAnimationFrame(loop);
    return () => { cancelAnimationFrame(raf); ro.disconnect(); };
  }, [tipo, cantidad, pausado]);
  return <canvas ref={ref} className={`fx-canvas fx-${tipo}`} />;
}

export default function EfectosMapa({ pausado = false }) {
  const movil = useMovil();
  const animaciones = useAnimaciones();
  const nPart = movil ? 3 : 6;
  const nVida = movil ? 5 : 10;
  if (!animaciones) return null;            // sin animaciones tampoco hay luces ni particulas sobre el mapa
  return (
    <div className="fx-layer" aria-hidden="true">
      {/* Faro */}
      <i className="fx fx-glow fx-flicker" style={P(20.3, 33.8, { '--s': '5cqw', '--c': '#FFD84A' })} />
      <i className="fx fx-rays ra" style={P(20.3, 33.8)} />
      <i className="fx fx-rays rb" style={P(20.3, 33.8)} />

      {/* Portal de salida */}
      <i className="fx fx-glow fx-halo" style={P(80.7, 18.6, { '--s': '14cqw', '--c': '#FFD86B' })} />
      {Array.from({ length: nPart }, (_, i) => (
        <i key={i} className="fx fx-part" style={P(80.7, 20.5, { '--dx': `${(i - (nPart - 1) / 2) * (6 / nPart) * 1.1}cqw`, animationDuration: `${3 + (i % 3)}s`, animationDelay: `${-i * 0.7}s` })} />
      ))}

      {/* Pantalla agrietada de inicio */}
      <i className="fx fx-glow fx-irregular" style={P(15.0, 77.0, { '--s': '8cqw', '--c': '#4FD8FF' })} />
      {[-1.6, 0, 1.6].map((dx, i) => (
        <i key={i} className="fx fx-beam" style={P(15.0, 75.5, { '--dx': `${dx}cqw`, animationDelay: `${-i * 0.8}s` })} />
      ))}

      {/* Linterna del muelle */}
      <i className="fx fx-glow fx-lamp" style={P(63.1, 71.0, { '--s': '3.5cqw', '--c': '#FFC15A' })} />

      {/* Edificio servidor: 3 rayitas en secuencia + luz de la puerta */}
      {[-0.7, 0, 0.7].map((dy, i) => (
        <i key={i} className="fx fx-stripe" style={P(42.2, 40.4, { '--dy': `${dy}cqw`, animationDelay: `${-i * 0.4}s` })} />
      ))}
      <i className="fx fx-glow fx-door" style={P(42.6, 44.4, { '--s': '2cqw', '--c': '#FF9A3C' })} />

      {/* Piedras-chip */}
      {CHIPS.map(([x, y, d, dl], i) => (
        <i key={i} className="fx fx-glow fx-chip" style={P(x, y, { '--s': '2cqw', '--c': '#4FD8FF', animationDuration: `${d}s`, animationDelay: `${dl}s` })} />
      ))}

      {/* Cable del puente: destellos de izquierda a derecha */}
      {[0].map((dl, i) => <i key={i} className="fx fx-spark-cable" style={P(67.0, 55.3, { animationDelay: `${dl}s` })} />)}

      {/* Destellos de 4 puntas en el cielo */}
      {DESTELLOS.map(([x, y, c, d, dl], i) => (
        <i key={i} className="fx fx-star4" style={P(x, y, { '--c': c, animationDuration: `${d}s`, animationDelay: `${dl}s` })} />
      ))}

      <CanvasVida tipo="luciernagas" cantidad={nVida} pausado={pausado} />
      <CanvasVida tipo="mar" cantidad={nVida} pausado={pausado} />
    </div>
  );
}
