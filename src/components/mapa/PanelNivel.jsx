import React from 'react';
import '../../estilos/panel-nivel.css';

// Lista de lecciones de un nivel. En pantallas angostas la tarjeta usa todo el ancho y se desplaza si no cabe;
// las estrellas van junto a "LECCIÓN N" para que el titulo tenga todo el espacio.
// enCurso = { leccion: ejercicio donde se quedo } de las lecciones empezadas y sin terminar
export default function PanelNivel({ nivel, nivelIdx, nivelHechos, enCurso = {}, onClose, onElegirLeccion }) {
  // nivelHechos es del estilo { lecciones: [0,0,0,0,0], completado: false }
  const lecciones = nivelHechos?.lecciones || [0,0,0,0,0];

  return (
    <div className="pn-velo">
      <div className="pn" role="dialog" aria-modal="true" aria-labelledby="pn-titulo">
        {/* Encabezado */}
        <div className="pn-cab">
          <div>
            <div className="pn-nivel">NIVEL {nivelIdx + 1}</div>
            <h2 id="pn-titulo" className="pn-titulo">{nivel.t}</h2>
          </div>
          <button type="button" className="pn-cerrar" onClick={onClose} aria-label="Cerrar">×</button>
        </div>

        {/* Progreso del nivel */}
        <div className="pn-progreso">
          <div className="pn-barra">
            {nivel.lecciones.map((_, i) => (
              <div key={i} style={{
                flex: 1, borderRight: i < nivel.lecciones.length - 1 ? '1px solid #112240' : 'none',
                background: lecciones[i] > 0 ? '#4ee86a' : 'transparent',
                transition: 'background 0.3s'
              }} />
            ))}
          </div>
          <div className="pn-cuenta">
            {lecciones.filter(l => l > 0).length} / {nivel.lecciones.length}
          </div>
        </div>

        {/* Lista de Lecciones */}
        <div className="pn-lista">
          {nivel.lecciones.map((lec, idx) => {
            const completada = lecciones[idx] > 0;
            const disponible = idx === 0 || lecciones[idx - 1] > 0 || completada;
            const estrellasObtenidas = lecciones[idx];

            return (
              <button
                key={idx}
                type="button"
                className="pn-leccion"
                disabled={!disponible}
                onClick={() => onElegirLeccion(idx)}
                style={{
                  background: completada ? 'rgba(78, 232, 106, 0.1)' : disponible ? '#1e3250' : 'rgba(30, 50, 80, 0.4)',
                  color: disponible ? '#fff' : '#6482a0',
                  cursor: disponible ? 'pointer' : 'not-allowed',
                  borderLeft: completada ? '4px solid #4ee86a' : disponible ? '4px solid #6ec4ff' : '4px solid transparent'
                }}
              >
                <div className="pn-circulo" style={{ background: completada ? '#4ee86a' : disponible ? '#6ec4ff' : '#263e5c' }}>
                  {completada ? '✓' : disponible ? (idx + 1) : '🔒'}
                </div>

                <div className="pn-texto">
                  <div className="pn-etq" style={{ color: completada ? '#4ee86a' : disponible ? '#6ec4ff' : '#6482a0' }}>
                    <span>LECCIÓN {idx + 1}</span>
                    {enCurso[idx] !== undefined && enCurso[idx] < lec.ejercicios.length && (
                      <span className="pn-sigue">Sigues en el ejercicio {enCurso[idx] + 1}</span>
                    )}
                    {completada && (
                      <span className="pn-estrellas" aria-label={`${estrellasObtenidas} de 3 estrellas`}>
                        {'⭐'.repeat(estrellasObtenidas)}{'☆'.repeat(3 - estrellasObtenidas)}
                      </span>
                    )}
                  </div>
                  <div className="pn-nombre">{lec.titulo}</div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
