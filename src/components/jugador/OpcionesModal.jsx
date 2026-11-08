import React, { useEffect, useRef } from 'react';
import { PixelButton } from '../comun/UI.jsx';
import '../../estilos/registro.css';
import '../../estilos/opciones.css';

// Interruptor accesible (musica y animaciones comparten el mismo aspecto).
function Interruptor({ id, etiqueta, ayuda, activo, onCambiar }) {
  return (
    <div className="opc-fila">
      <span className="opc-texto">
        <span id={id} className="opc-etiqueta">{etiqueta}</span>
        {ayuda && <span className="opc-ayuda">{ayuda}</span>}
      </span>
      <button type="button" role="switch" aria-checked={activo} aria-labelledby={id}
        className={`opc-switch ${activo ? 'on' : ''}`} onClick={() => onCambiar(!activo)}>
        <span className="opc-knob" aria-hidden="true" />
        <span className="opc-estado">{activo ? 'SÍ' : 'NO'}</span>
      </button>
    </div>
  );
}

// Panel de OPCIONES (pantalla de inicio): musica del juego y animaciones/efectos.
// Cada cambio se guarda en configuracion_usuario si hay sesion; si no, en este navegador (lo gestiona App).
export default function OpcionesModal({ musicaActiva, onMusica, animacionesActivas = true, onAnimaciones, onCerrar }) {
  const panelRef = useRef(null);
  useEffect(() => {
    const previo = document.activeElement;
    panelRef.current?.focus();
    const tecla = (e) => { if (e.key === 'Escape') onCerrar(); };
    document.addEventListener('keydown', tecla);
    return () => { document.removeEventListener('keydown', tecla); previo?.focus?.(); };
  }, [onCerrar]);

  return (
    <div className="opc-fondo" onClick={onCerrar} role="presentation">
      <div ref={panelRef} tabIndex={-1} className="reg-panel opc-panel" role="dialog" aria-modal="true" aria-labelledby="opc-titulo" onClick={(e) => e.stopPropagation()}>
        <div className="reg-header"><h1 id="opc-titulo">OPCIONES</h1></div>
        <Interruptor id="opc-musica-txt" etiqueta="MÚSICA DEL JUEGO" activo={musicaActiva} onCambiar={onMusica} />
        {onAnimaciones && (
          <Interruptor id="opc-anim-txt" etiqueta="ANIMACIONES Y EFECTOS" ayuda="Si lo apagas, se quitan los movimientos y efectos de toda la pantalla, también los del mundo."
            activo={animacionesActivas} onCambiar={onAnimaciones} />
        )}
        <div className="opc-pie">
          <PixelButton className="secondary" onClick={onCerrar}>CERRAR</PixelButton>
        </div>
      </div>
    </div>
  );
}
