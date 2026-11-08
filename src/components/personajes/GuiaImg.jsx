import React from 'react';
import { usePersonajes } from '../../context/PersonajesContext.jsx';
import { ANIMO_GUIA } from '../../datos/personajes.js';

// Imagen del Capyhein segun su animo. Mantiene TODAS las imagenes del guia ya montadas (solo se oculta la que no
// corresponde), asi al confirmar una respuesta el cambio es instantaneo: no hay que descargar ni decodificar nada.
export default function GuiaImg({ animo, className = '', alt }) {
  const { imagenGuia } = usePersonajes();
  return (
    <>
      {Object.keys(ANIMO_GUIA).map((a) => {
        const src = imagenGuia(a);
        if (!src) return null;
        const activa = a === animo;
        return (
          <img key={a} src={src} className={className} alt={activa ? (alt || `Profesor Capyehein ${a}`) : ''}
            aria-hidden={activa ? undefined : true} decoding="sync" loading="eager"
            style={activa ? undefined : { display: 'none' }} />
        );
      })}
    </>
  );
}
