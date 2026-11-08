import React, { useEffect, useMemo, useState } from 'react';
import { useAnimaciones } from '../../audio/preferencias.js';

// Lluvia de código con CSS puro. Detrás del panel, sin interacción, oculta a lectores de pantalla.
// Líder blanco, estela verde menta que se desvanece; opacidad máxima 0.5.
const GLYPHS = ['0', '1', '<', '>', '/', '{', '}', ';', '(', ')'];
const rnd = (a, b) => a + Math.random() * (b - a);

function useMatch(q) {
  const [m, setM] = useState(() => window.matchMedia(q).matches);
  useEffect(() => {
    const mq = window.matchMedia(q);
    const f = () => setM(mq.matches);
    mq.addEventListener('change', f);
    return () => mq.removeEventListener('change', f);
  }, [q]);
  return m;
}

export default function CodeRain() {
  const animaciones = useAnimaciones();
  const movil = useMatch('(max-width: 700px)');
  const n = movil ? 8 : 18;
  const [oculto, setOculto] = useState(document.hidden);

  useEffect(() => {
    const f = () => setOculto(document.hidden);
    document.addEventListener('visibilitychange', f);
    return () => document.removeEventListener('visibilitychange', f);
  }, []);

  const cols = useMemo(() => Array.from({ length: n }, (_, i) => {
    const dur = rnd(8, 16);
    const len = Math.floor(rnd(8, 14));
    return {
      left: ((i + 0.15 + Math.random() * 0.7) / n) * 100,
      dur, delay: -rnd(0, dur), y: rnd(8, 80),
      size: 10 + Math.floor(Math.random() * 3),
      chars: Array.from({ length: len }, () => GLYPHS[(Math.random() * GLYPHS.length) | 0]),
    };
  }), [n]);

  if (!animaciones) return null;            // sin animaciones tampoco hay lluvia de codigo
  return (
    <div className={`code-rain ${oculto ? 'is-paused' : ''}`} aria-hidden="true">
      {cols.map((c, i) => (
        <div key={i} className="cr-col"
          style={{ left: `${c.left}%`, fontSize: c.size, animationDuration: `${c.dur}s`, animationDelay: `${c.delay}s`, '--y': `${c.y}vh` }}>
          {c.chars.map((ch, k) => k === c.chars.length - 1
            ? <span key={k} className="cr-lider">{ch}</span>
            : <span key={k} className="cr-estela" style={{ opacity: (k / (c.chars.length - 1)) * 0.45 }}>{ch}</span>)}
        </div>
      ))}
    </div>
  );
}
