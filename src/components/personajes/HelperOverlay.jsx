import React, { useEffect, useState } from 'react';
import helperSearch from '../../assets/helper-search.png';
import helperTablet from '../../assets/helper-tablet.png';
import { PixelButton } from '../comun/UI.jsx';
import messiahImg from '../../assets/helper-search.png';

export default function HelperOverlay({ close, pista }) {
  const [phase, setPhase] = useState(1);
  useEffect(() => {
    const t = setTimeout(() => setPhase(2), 2800);
    return () => clearTimeout(t);
  }, []);
  return (
    <div className="helper-overlay">
      <div className="helper-scene">
        <img className="helper-sprite" src={phase===1 ? helperSearch : helperTablet} alt="El Mesías del Pront ayudando"/>
        <div className="helper-dialog">
          <div className="dialog-name">EL MESÍAS DEL PRONT</div>
          {phase===1 ? (
            <>
              <div>Esto es sencillo, dame un momento y lo busco<span className="loading-dots">...</span></div>
              <div className="loading-bar"><span/></div>
            </>
          ) : (
            <>
              <div className="mb-4">Ya sé la respuesta</div>
              <div className="hint">PISTA: {pista}</div>
              <PixelButton onClick={close} className="mt-4">CONTINUAR →</PixelButton>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
