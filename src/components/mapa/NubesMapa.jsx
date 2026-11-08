import React, { useState } from 'react';
import { MAP_NUBES } from '../../datos/mapNodes';

const BASE = import.meta.env.BASE_URL;
const src = (id) => `${BASE}assets/mapa/nubes/nube-${id}.png`;

// Nubes animadas (sprites PNG). Si un sprite no existe, simplemente no se dibuja.
// Dos nubes pequeñas extra cruzan despacio la franja superior (se desvanecen antes de x = 70).
const CRUCES = [
  { id: 'c', w: 5.0, y: 9, dur: 100, delay: -20 },
  { id: 'd', w: 4.6, y: 15, dur: 118, delay: -75 },
];

function Nube({ id, onError, ...rest }) {
  return <img src={src(id)} alt="" draggable={false} onError={onError} {...rest} />;
}

export default function NubesMapa() {
  const [rotas, setRotas] = useState({});
  const rota = (id) => () => setRotas((r) => ({ ...r, [id]: true }));
  return (
    <div className="nubes-layer" aria-hidden="true">
      {MAP_NUBES.filter((n) => !rotas[n.id]).map((n) => (
        <div key={n.id} className="nube-pos" style={{ left: `${n.x}%`, top: `${n.y}%`, width: `${n.w}%` }}>
          <Nube id={n.id} onError={rota(n.id)} className="nube"
            style={{ animationDuration: `${n.dur}s, ${n.bob}s`, animationDelay: `${n.delay}s, ${n.delay / 2}s` }} />
        </div>
      ))}
      {CRUCES.filter((n) => !rotas[n.id]).map((n, i) => (
        <div key={`x${i}`} className="nube-cruce" style={{ top: `${n.y}%`, width: `${n.w}%`, animationDuration: `${n.dur}s`, animationDelay: `${n.delay}s` }}>
          <Nube id={n.id} onError={rota(n.id)} />
        </div>
      ))}
    </div>
  );
}
