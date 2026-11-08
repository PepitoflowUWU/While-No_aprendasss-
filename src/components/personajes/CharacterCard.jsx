import React, { useState } from 'react';

// Tarjeta vertical de personaje. "revelado" = hover/foco o seleccionado → color; si no, silueta.
export default function CharacterCard({
  id, nombre, imagen, colorFondo, frase, revelado, seleccionado, onSelect, onEnter, onLeave,
}) {
  const [fallo, setFallo] = useState(false);
  const activo = revelado || seleccionado;

  const onKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelect(id); }
  };

  return (
    <div
      role="radio"
      aria-checked={seleccionado}
      aria-label={`${nombre}: ${frase}`}
      tabIndex={0}
      className={`char-card ${activo ? 'is-active' : ''} ${seleccionado ? 'is-selected' : ''}`}
      style={{ '--c': colorFondo }}
      onPointerEnter={(e) => e.pointerType === 'mouse' && onEnter(id)}
      onPointerLeave={(e) => e.pointerType === 'mouse' && onLeave(id)}
      onFocus={() => onEnter(id)}
      onBlur={() => onLeave(id)}
      onClick={() => onSelect(id)}
      onKeyDown={onKeyDown}
    >
      {seleccionado && <span className="char-arrow" aria-hidden="true">▼</span>}
      <div className="char-frame" aria-hidden="true" />
      <div className="char-face">
        <div className="char-pattern" />
        {fallo ? (
          <div className="char-missing">{nombre}</div>
        ) : (
          <img src={imagen} alt="" draggable={false} className="char-img" onError={() => setFallo(true)} />
        )}
      </div>
      <div className="char-name">{nombre}</div>
      <div className="char-phrase">{activo ? frase : '\u00A0'}</div>
    </div>
  );
}
