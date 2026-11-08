import React from 'react';
import '@fontsource/pixelify-sans/latin-400.css';
import '@fontsource/pixelify-sans/latin-700.css';
import '@fontsource/press-start-2p/latin-400.css';
import '../../estilos/juego.css';
import { PixelArt, NUBE } from './PixelArt.jsx';
import CodeRain from './CodeRain.jsx';

// Fondo compartido (Inicio, Crear cuenta, Selección de personaje).
// Capas: cielo + colinas + césped (imagen) → nubes animadas → lluvia de código → contenido.
const NUBES = [
  { t: '5%',  s: 4, d: 150, dl: -20 },
  { t: '15%', s: 3, d: 190, dl: -110 },
  { t: '24%', s: 5, d: 130, dl: -60 },
  { t: '9%',  s: 3, d: 210, dl: -170 },
  { t: '19%', s: 4, d: 170, dl: -5 },
];

export default function GameBackground({ children }) {
  return (
    <div className="game-bg">
      <div className="gb-scene" aria-hidden="true" />
      <div className="gb-clouds" aria-hidden="true">
        {NUBES.map((n, i) => (
          <div key={i} className="gb-cloud" style={{ '--t': n.t, '--d': `${n.d}s`, '--dl': `${n.dl}s`, '--x': `${(i * 23 + 8) % 85}%` }}>
            <PixelArt rows={NUBE} size={n.s} palette={{ X: '#ffffff', S: '#cfe6f5' }} />
          </div>
        ))}
      </div>
      <CodeRain />
      <div className="gb-content">{children}</div>
    </div>
  );
}
