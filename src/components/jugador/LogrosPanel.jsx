import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import LogroIcono from './LogroIcono';
import '../../estilos/logros.css';

// Panel de logros: lista de misiones con su avance. Al cumplir una se puede RECLAMAR (o RECLAMAR TODO) y el logro
// queda en el perfil del jugador. La base comprueba que la meta se cumplio antes de entregarlo.
export default function LogrosPanel({ logros, onCerrar }) {
  const { items, pendientes, obtenidos, total, error, ocupado, reclamar, reclamarTodos } = logros;
  const cerrarRef = useRef(null);
  useEffect(() => {
    const previo = document.activeElement;
    cerrarRef.current?.focus();
    const tecla = (e) => { if (e.key === 'Escape') { e.stopPropagation(); onCerrar(); } };
    document.addEventListener('keydown', tecla, true);
    return () => { document.removeEventListener('keydown', tecla, true); previo?.focus?.(); };
  }, [onCerrar]);

  return createPortal(
    <div className="lg-fondo" onClick={onCerrar} onPointerDown={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()} role="presentation">
      <div className="lg-panel" role="dialog" aria-modal="true" aria-labelledby="lg-titulo" onClick={(e) => e.stopPropagation()}>
        <div className="lg-barra">
          <h2 id="lg-titulo">LOGROS</h2>
          <span className="lg-cuenta" aria-label={`${obtenidos.length} de ${total} logros obtenidos`}>{obtenidos.length}/{total}</span>
          <button ref={cerrarRef} type="button" className="lg-x" onClick={onCerrar} aria-label="Cerrar">✕</button>
        </div>

        <div className={`lg-banner ${pendientes ? 'activo' : ''}`}>
          <p>
            {pendientes
              ? <>Tienes <b>{pendientes}</b> {pendientes === 1 ? 'logro completado' : 'logros completados'}. ¡Reclámalos ahora!</>
              : 'No tienes logros por reclamar. ¡Sigue jugando para completar más!'}
          </p>
          <button type="button" className="lg-btn lg-btn-todo" disabled={!pendientes || ocupado} onClick={reclamarTodos}>RECLAMAR TODO</button>
        </div>
        {error && <p className="lg-error" role="alert">{error}</p>}

        <ul className="lg-lista">
          {items.map((i) => (
            <li key={i.codigo} className={`lg-fila ${i.reclamable ? 'lista' : ''} ${i.reclamado ? 'hecho' : ''}`} data-codigo={i.codigo}>
              <span className="lg-icono">
                <LogroIcono tipo={i.icono} size={40} />
                {i.reclamable && <i className="lg-alerta" aria-hidden="true">!</i>}
              </span>
              <div className="lg-texto">
                <b>{i.nombre}</b>
                <span className="lg-desc">{i.descripcion}</span>
                <span className="lg-prog" role="progressbar" aria-valuemin={0} aria-valuemax={i.meta} aria-valuenow={i.valor} aria-label={`${i.nombre}: ${i.valor} de ${i.meta}`}>
                  <i style={{ width: `${(i.valor / i.meta) * 100}%` }} /><em>{i.valor}/{i.meta}</em>
                </span>
              </div>
              {i.reclamado
                ? <span className="lg-obtenido"><b aria-hidden="true">✓</b> OBTENIDO</span>
                : <button type="button" className="lg-btn" disabled={!i.reclamable || ocupado} onClick={() => reclamar(i.codigo)} aria-label={`Reclamar ${i.nombre}`}>RECLAMAR</button>}
            </li>
          ))}
        </ul>
      </div>
    </div>,
    document.body,
  );
}
