import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { usePersonajes } from '../../context/PersonajesContext.jsx';
import '../../estilos/intro-serio.css';

// Presentacion de los niveles 4 y 5: la pantalla se oscurece y el guia (CapyheinSerio, en primer plano) le habla al jugador.
// textos = las partes del dialogo (una por pantalla). El texto se escribe letra por letra; tocar el cuadro o el boton
// lo completa y, si ya estaba completo, pasa a la siguiente parte. Al terminar la ultima llama a onFin.
const VELOCIDAD = 28;   // ms por letra

export default function IntroSerio({ textos, onFin }) {
  const { imagenGuia } = usePersonajes();
  const img = imagenGuia('primerPlano') || imagenGuia('serio');
  const [fase, setFase] = useState(0);
  const [letras, setLetras] = useState(0);
  const botonRef = useRef(null);
  const texto = textos[fase] || '';
  const completo = letras >= texto.length;
  const ultima = fase >= textos.length - 1;

  // Escribe el texto de la fase actual letra por letra (sin animaciones si el jugador las desactivo)
  useEffect(() => {
    const sinAnim = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches || document.documentElement.dataset.animaciones === 'off';
    if (sinAnim) { setLetras(texto.length); return undefined; }
    setLetras(0);
    const t = setInterval(() => setLetras((n) => { if (n + 1 >= texto.length) clearInterval(t); return n + 1; }), VELOCIDAD);
    return () => clearInterval(t);
  }, [texto]);

  useEffect(() => { botonRef.current?.focus(); }, [fase]);

  const avanzar = () => {
    if (!completo) { setLetras(texto.length); return; }
    if (ultima) onFin();
    else setFase((f) => Math.min(f + 1, textos.length - 1));   // doble toque rapido: no se salta una parte
  };

  return createPortal(
    <div className="is-velo" role="dialog" aria-modal="true" aria-label="El profesor Capyhein te habla" onClick={avanzar}>
      <div className="is-escena">
        {img && <img className="is-guia" src={img} alt="Profesor Capyhein, serio" decoding="async" />}
        <div className="is-dialogo">
          <p aria-live="polite">
            <span>{texto.slice(0, letras)}</span>
            <span className="is-resto" aria-hidden="true">{texto.slice(letras)}</span>
          </p>
          <div className="is-pie">
            <span className="is-pasos" aria-hidden="true">{textos.map((_, i) => <i key={i} className={i === fase ? 'on' : ''} />)}</span>
            <button ref={botonRef} type="button" className="btn-primary-action is-btn" onClick={(e) => { e.stopPropagation(); avanzar(); }}>
              {!completo ? 'SALTAR ▸▸' : ultima ? 'COMENZAR →' : 'SIGUIENTE ▸'}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
