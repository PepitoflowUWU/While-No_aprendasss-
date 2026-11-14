import React, { useEffect, useRef } from 'react';
import '../../estilos/portal.css';

// Cartel que sale al tocar el PORTAL del mapa con todos los niveles completados: por ahora no hay otros mundos.
export default function CartelPortal({ onCerrar }) {
  const btn = useRef(null);
  useEffect(() => {
    btn.current?.focus();
    const tecla = (e) => { if (e.key === 'Escape') onCerrar(); };
    document.addEventListener('keydown', tecla);
    return () => document.removeEventListener('keydown', tecla);
  }, [onCerrar]);

  return (
    <div className="pt-fondo" onClick={onCerrar} role="presentation">
      <div className="pt-cartel" role="dialog" aria-modal="true" aria-labelledby="pt-titulo" onClick={(e) => e.stopPropagation()}>
        <span className="pt-cuerda izq" aria-hidden="true" />
        <span className="pt-cuerda der" aria-hidden="true" />
        <div className="pt-tablero">
          <div className="pt-cinta" aria-hidden="true" />
          <h2 id="pt-titulo">EN MANTENIMIENTO</h2>
          <p className="pt-icono" aria-hidden="true">🚧</p>
          <p className="pt-texto">Próximamente otros mundos</p>
          <p className="pt-sub">¡Completaste todos los niveles! Muy pronto este portal te llevará a nuevos desafíos.</p>
          <div className="pt-cinta abajo" aria-hidden="true" />
        </div>
        <button ref={btn} type="button" className="pt-btn" onClick={onCerrar}>ENTENDIDO</button>
      </div>
    </div>
  );
}
