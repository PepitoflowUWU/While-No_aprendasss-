import React from 'react';
import Mayus from './Mayus.jsx';
import { Icono } from './PixelArt.jsx';

// Campo del formulario (ícono a la izquierda, etiqueta, ayuda y mensaje en vivo). Lo usan Crear cuenta e Iniciar sesión.
export default function Campo({ id, etiqueta, icono, ayuda, error, ok, children, extra }) {
  return (
    <div className="reg-field">
      <div className="reg-icon" aria-hidden="true"><Icono nombre={icono} size={3} /></div>
      <div className="reg-body">
        <label htmlFor={id} className="reg-label"><Mayus>{etiqueta}</Mayus></label>
        {children}
        {ayuda && <p id={`${id}-ayuda`} className="reg-help">{ayuda}</p>}
        <p id={`${id}-msg`} className={`reg-msg ${ok && !error ? 'ok' : ''}`} aria-live="polite">
          {error ? (<><Icono nombre="cross" size={2} /> <span>{error}</span></>)
            : ok ? (<><Icono nombre="check" size={2} /> <span>{ok}</span></>) : null}
        </p>
        {extra}
      </div>
    </div>
  );
}
