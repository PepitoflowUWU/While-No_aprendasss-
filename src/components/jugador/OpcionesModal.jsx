import React, { useEffect, useRef, useState } from 'react';
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

// Panel de OPCIONES (pantalla de inicio) y de AJUSTES (engranaje del mapa): musica del juego y animaciones/efectos.
// Cada cambio se guarda en configuracion_usuario si hay sesion; si no, en este navegador (lo gestiona App).
// En el mapa ademas trae: VER TUTORIAL (onTutorial), REINICIAR PROGRESO (solo invitados, onReiniciar) y CERRAR SESIÓN (onCerrarSesion),
// que pide confirmacion antes de salir.
export default function OpcionesModal({
  titulo = 'OPCIONES', musicaActiva, onMusica, animacionesActivas = true, onAnimaciones,
  onTutorial, onReiniciar, onCerrarSesion, invitado = false, onCerrar,
}) {
  const panelRef = useRef(null);
  const [confirmar, setConfirmar] = useState(null);   // null | 'salir' | 'reiniciar'
  useEffect(() => {
    const previo = document.activeElement;
    panelRef.current?.focus();
    const tecla = (e) => { if (e.key === 'Escape') onCerrar(); };
    document.addEventListener('keydown', tecla);
    return () => { document.removeEventListener('keydown', tecla); previo?.focus?.(); };
  }, [onCerrar]);

  const hayCuenta = onTutorial || onReiniciar || onCerrarSesion;

  return (
    <div className="opc-fondo" onClick={onCerrar} role="presentation">
      <div ref={panelRef} tabIndex={-1} className="reg-panel opc-panel" role="dialog" aria-modal="true" aria-labelledby="opc-titulo" onClick={(e) => e.stopPropagation()}>
        <div className="reg-header"><h1 id="opc-titulo">{titulo}</h1></div>

        {confirmar ? (
          <div className="opc-confirmar" role="alertdialog" aria-labelledby="opc-conf-txt">
            <p id="opc-conf-txt" className="opc-conf-txt">
              {confirmar === 'salir'
                ? (invitado ? '¿Seguro que quieres salir? Juegas como invitado: tu progreso se borrará.' : '¿Seguro que quieres cerrar sesión? Tu progreso queda guardado en tu cuenta.')
                : '¿Borrar todo tu progreso? Esto no se puede deshacer.'}
            </p>
            <div className="opc-conf-btns">
              <PixelButton className="secondary" onClick={() => setConfirmar(null)}>CANCELAR</PixelButton>
              <PixelButton className="opc-peligro" onClick={() => { const c = confirmar; setConfirmar(null); if (c === 'salir') onCerrarSesion(); else { onReiniciar(); onCerrar(); } }}>
                {confirmar === 'salir' ? 'SÍ, SALIR' : 'SÍ, BORRAR'}
              </PixelButton>
            </div>
          </div>
        ) : (
          <>
            <Interruptor id="opc-musica-txt" etiqueta="MÚSICA DEL JUEGO" activo={musicaActiva} onCambiar={onMusica} />
            {onAnimaciones && (
              <Interruptor id="opc-anim-txt" etiqueta="ANIMACIONES Y EFECTOS" ayuda="Si lo apagas, se quitan los movimientos y efectos de toda la pantalla, también los del mundo."
                activo={animacionesActivas} onCambiar={onAnimaciones} />
            )}
            {hayCuenta && (
              <div className="opc-acciones">
                {onTutorial && <PixelButton className="secondary opc-accion" onClick={onTutorial}>VER TUTORIAL</PixelButton>}
                {onReiniciar && <PixelButton className="secondary opc-accion" onClick={() => setConfirmar('reiniciar')}>REINICIAR PROGRESO</PixelButton>}
                {onCerrarSesion && <PixelButton className="opc-peligro opc-accion" onClick={() => setConfirmar('salir')}>{invitado ? 'SALIR DEL JUEGO' : 'CERRAR SESIÓN'}</PixelButton>}
              </div>
            )}
            <div className="opc-pie">
              <PixelButton className="secondary" onClick={onCerrar}>CERRAR</PixelButton>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
