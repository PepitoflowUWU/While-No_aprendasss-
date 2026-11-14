import React, { useEffect, useRef, useState } from 'react';
import { PixelButton } from '../comun/UI.jsx';
import { CODIGOS } from '../../servicios/codigos.js';
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
// En el mapa ademas trae: VER TUTORIAL (onTutorial), CÓDIGOS (onCanjear: MESIAS, HELLO_WORD para el mundo actual),
// REINICIAR PROGRESO (onReiniciar) y CERRAR SESIÓN (onCerrarSesion), que pide confirmacion antes de salir.
export default function OpcionesModal({
  titulo = 'OPCIONES', musicaActiva, onMusica, animacionesActivas = true, onAnimaciones,
  onTutorial, onReiniciar, onCerrarSesion, invitado = false, onCerrar, onCanjear, codigosActivos = [],
}) {
  const panelRef = useRef(null);
  const [confirmar, setConfirmar] = useState(null);   // null | 'salir' | 'reiniciar'
  const [vista, setVista] = useState('principal');    // principal | codigos
  const [texto, setTexto] = useState('');
  const [resultado, setResultado] = useState(null);   // { ok, mensaje }
  const [canjeando, setCanjeando] = useState(false);

  const canjear = async (e) => {
    e.preventDefault();
    if (!texto.trim() || canjeando) return;
    setCanjeando(true);
    let r;
    try { r = await onCanjear(texto); } catch { r = { ok: false, razon: 'error' }; }
    setCanjeando(false);
    const MSG = {
      invalido: 'Ese código no existe. Revisa cómo lo escribiste.',
      repetido: 'Ese código ya está activo en este mundo.',
      sin_migracion: 'Falta actualizar la base de datos (database/migraciones/35_codigos_mundo.sql).',
      error: 'No se pudo activar el código. Revisa tu conexión e inténtalo de nuevo.',
    };
    setResultado(r.ok
      ? { ok: true, mensaje: `¡Código ${r.codigo} activado! ${CODIGOS[r.codigo].detalle}` }
      : { ok: false, mensaje: MSG[r.razon] || MSG.error });
    if (r.ok) setTexto('');
  };
  useEffect(() => {
    const previo = document.activeElement;
    panelRef.current?.focus();
    const tecla = (e) => { if (e.key === 'Escape') onCerrar(); };
    document.addEventListener('keydown', tecla);
    return () => { document.removeEventListener('keydown', tecla); previo?.focus?.(); };
  }, [onCerrar]);

  const hayCuenta = onTutorial || onReiniciar || onCerrarSesion || onCanjear;

  return (
    <div className="opc-fondo" onClick={onCerrar} role="presentation">
      <div ref={panelRef} tabIndex={-1} className="reg-panel opc-panel" role="dialog" aria-modal="true" aria-labelledby="opc-titulo" onClick={(e) => e.stopPropagation()}>
        <div className="reg-header"><h1 id="opc-titulo">{titulo}</h1></div>

        {vista === 'codigos' ? (
          <div className="opc-codigos">
            <form onSubmit={canjear} className="opc-cod-form">
              <label htmlFor="opc-cod-input" className="opc-etiqueta">ESCRIBE UN CÓDIGO</label>
              <div className="opc-cod-fila">
                <input id="opc-cod-input" value={texto} onChange={(e) => { setTexto(e.target.value); setResultado(null); }}
                  autoComplete="off" autoCorrect="off" autoCapitalize="characters" spellCheck={false} maxLength={30} placeholder="CÓDIGO" />
                <PixelButton className="opc-cod-btn" onClick={canjear} disabled={!texto.trim() || canjeando}>{canjeando ? '...' : 'CANJEAR'}</PixelButton>
              </div>
            </form>
            {resultado && <p className={`opc-cod-res ${resultado.ok ? 'ok' : 'mal'}`} role="status">{resultado.mensaje}</p>}
            <p className="opc-ayuda">Los códigos valen solo para el mundo en el que estás.</p>
            {codigosActivos.length > 0 && (
              <div className="opc-cod-activos">
                <span className="opc-etiqueta">ACTIVOS EN ESTE MUNDO</span>
                <ul>{codigosActivos.map((c) => <li key={c}><b>{c}</b> · {CODIGOS[c]?.titulo || ''}</li>)}</ul>
              </div>
            )}
            <div className="opc-pie">
              <PixelButton className="secondary" onClick={() => { setVista('principal'); setResultado(null); setTexto(''); }}>← VOLVER</PixelButton>
            </div>
          </div>
        ) : confirmar ? (
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
                {onCanjear && <PixelButton className="secondary opc-accion" onClick={() => setVista('codigos')}>CÓDIGOS</PixelButton>}
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
