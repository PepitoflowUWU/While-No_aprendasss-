import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import AvatarJugador from '../personajes/AvatarJugador';
import { usePersonajes } from '../../context/PersonajesContext.jsx';
import { estadoConexion } from '../../servicios/racha.js';
import '../../estilos/jugador-detalle.css';

// Ficha de un jugador del ranking: a la izquierda el personaje que eligio; a la derecha nombre, codigo, puntos,
// racha maxima y cuanto tiempo lleva desconectado. Se abre al tocar una fila del ranking y se cierra con Esc, tocando fuera o con el boton.
export default function JugadorDetalle({ jugador, esYo = false, onCerrar }) {
  const cerrarRef = useRef(null);
  const [ahora, setAhora] = useState(() => Date.now());
  const { porId } = usePersonajes();
  const personaje = porId(jugador.personaje);

  useEffect(() => {
    const previo = document.activeElement;
    cerrarRef.current?.focus();
    const tecla = (e) => { if (e.key === 'Escape') { e.stopPropagation(); onCerrar(); } };
    document.addEventListener('keydown', tecla, true);
    const t = setInterval(() => setAhora(Date.now()), 30000);     // el "hace X min" se mantiene al dia
    return () => { document.removeEventListener('keydown', tecla, true); clearInterval(t); previo?.focus?.(); };
  }, [onCerrar]);

  // Los invitados solo ven nombre, puntos y personaje: el resto llega como undefined y se muestra "Solo con cuenta".
  const SOLO_CUENTA = 'Solo con cuenta';
  const con = esYo ? { enLinea: true, texto: 'En línea' }
    : jugador.conexion === undefined ? { enLinea: false, texto: SOLO_CUENTA } : estadoConexion(jugador.conexion, ahora);
  const dias = jugador.rachaMax;
  const datos = [
    ['CÓDIGO', jugador.codigo === undefined ? SOLO_CUENTA : (jugador.codigo || '—')],
    ['PUNTOS', jugador.x],
    ['RACHA MÁXIMA', dias === undefined ? SOLO_CUENTA : `${dias} ${dias === 1 ? 'día' : 'días'}`],
  ];

  return createPortal(
    <div className="jd-fondo" onClick={onCerrar} onPointerDown={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()} role="presentation">
      <div className="jd-panel" role="dialog" aria-modal="true" aria-labelledby="jd-titulo" onClick={(e) => e.stopPropagation()}>
        <div className="jd-barra">
          <h2 id="jd-titulo">JUGADOR</h2>
          <button ref={cerrarRef} type="button" className="jd-x" onClick={onCerrar} aria-label="Cerrar">✕</button>
        </div>
        <div className="jd-cuerpo">
          <div className="jd-personaje" aria-label={personaje ? `Personaje: ${personaje.nombre}` : 'Personaje'}>
            {personaje?.imagen
              ? <img src={personaje.imagen} alt={`Personaje ${personaje.nombre}`} />
              : <AvatarJugador personaje={jugador.personaje} size={96} />}
            {personaje && <span className="jd-pj-nombre">{personaje.nombre}</span>}
          </div>
          <dl className="jd-datos">
            <div className="jd-nombre"><dt>NOMBRE</dt><dd>{jugador.a}{esYo && <b className="jd-tu">TÚ</b>}</dd></div>
            {datos.map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}
            <div className={`jd-conexion ${con.enLinea ? 'on' : ''}`}>
              <dt>ÚLTIMA CONEXIÓN</dt>
              <dd><span className="jd-punto" aria-hidden="true" />{con.texto}</dd>
            </div>
          </dl>
        </div>
      </div>
    </div>,
    document.body,
  );
}
