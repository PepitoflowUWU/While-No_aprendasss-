import React from 'react';

// Texto en mayúsculas con tildes/Ñ bien dibujadas con la fuente pixel (ver .ac en juego.css).
const MAP = { Á: ['A', 'a'], É: ['E', 'a'], Í: ['I', 'a'], Ó: ['O', 'a'], Ú: ['U', 'a'], Ü: ['U', 'd'], Ñ: ['N', 't'] };

export default function Mayus({ children }) {
  return (
    <>
      {[...String(children)].map((c, i) => MAP[c]
        ? <span key={i} className={`ac ac-${MAP[c][1]}`} aria-hidden="true">{MAP[c][0]}</span>
        : c)}
      <span className="sr-only">{String(children)}</span>
    </>
  );
}
