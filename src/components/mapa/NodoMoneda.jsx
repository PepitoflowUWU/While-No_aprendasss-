import React from 'react';
import { PixelArt, BITMAPS } from '../comun/PixelArt';
import { PadlockIcon } from '../comun/PixelIcons';

// Disco isométrico "moneda gruesa" dibujado con píxeles de 0.2 u:
// elipse de 6.4 x 4.2 u, grosor inferior ~0.6 u, brillo superior de 0.4 u y sombra dura. Sin degradados.
const W = 32, H = 21, T = 3.5, SOMBRA = 5; // alto = 0.65 x ancho, grosor = 0.11 x ancho
const dentro = (x, y, dy = 0) => ((x + 0.5 - W / 2) / (W / 2)) ** 2 + ((y + 0.5 - dy - H / 2) / (H / 2)) ** 2 <= 1;

const FILAS = (() => {
  const rows = [];
  for (let y = 0; y < H + SOMBRA; y++) {
    let r = '';
    for (let x = 0; x < W; x++) {
      let c = '.';
      if (dentro(x, y, SOMBRA)) c = 'k';
      if (dentro(x, y, T)) c = 's';
      if (dentro(x, y)) c = dentro(x, y, 2) ? 't' : 'h';
      r += c;
    }
    rows.push(r);
  }
  return rows;
})();

const PALETAS = {
  oro: { t: '#F2C85B', h: '#FFE18A', s: '#B8862B', k: 'rgba(0,0,0,.25)' },
  piedra: { t: '#7C8BA6', h: '#7C8BA6', s: '#4A5872', k: 'rgba(0,0,0,.25)' },
};

export default function NodoMoneda({ st, flash, centellea = true }) {
  const bloqueado = st === 'lock';
  return (
    <span className="mn-body">
      <PixelArt rows={FILAS} fluid className="mn-art" palette={PALETAS[bloqueado ? 'piedra' : 'oro']} />
      {st === 'now' && <span className="mn-ring" />}
      {st === 'gold-medallion' && <span className={`mn-star ${centellea ? 'tw' : ''}`}><PixelArt rows={BITMAPS.star} fluid /></span>}
      {bloqueado && <span className="mn-lock"><PadlockIcon size="100%" /></span>}
      {flash && <span className="mn-flash" />}
    </span>
  );
}
