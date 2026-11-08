import React, { useState } from 'react';

// "El Mesías del Pront": abajo a la izquierda con globo de diálogo.
export default function MesiasGuia({ texto }) {
  const [fallo, setFallo] = useState(false);
  return (
    <div className="cs-guide">
      {!fallo && <img src="/assets/personajes/mesias.png" alt="El Mesías del Pront" onError={() => setFallo(true)} />}
      <div className="cs-bubble" aria-live="polite">{texto}</div>
    </div>
  );
}
