import React from 'react';

const TEXTOS = { 1: 'PASO 1 DE 3 · CUENTA', 2: 'PASO 2 DE 3 · CELULAR', 3: 'PASO 3 DE 3 · PERSONAJE' };

export default function PasoIndicador({ paso }) {
  return (
    <div className="paso-chip">
      <span className="paso-dots" aria-hidden="true"><i className={paso >= 1 ? 'on' : ''} /><i className={paso >= 2 ? 'on' : ''} /><i className={paso >= 3 ? 'on' : ''} /></span>
      {TEXTOS[paso]}
    </div>
  );
}
