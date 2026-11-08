import React, { useState } from 'react';
import { usePersonajes } from '../../context/PersonajesContext.jsx';
import TextoLogico from '../comun/TextoLogico.jsx';
import '../../estilos/tabla-verdad.css';
import '../../estilos/nivel.css';
import '../../estilos/nivel-responsivo.css';

export default function PantallaTeoria({ leccion, onVolver, onComenzar, isModal = false }) {
  const { imagenGuia } = usePersonajes();
  const capySerio = imagenGuia('serio') || undefined;
  const capyAcertaste = imagenGuia('acertaste') || undefined;
  const [slideIdx, setSlideIdx] = useState(0);
  const total = leccion.teoria.length;
  const slide = leccion.teoria[slideIdx];
  const esUltima = slideIdx === total - 1;

  const handleNext = () => {
    if (esUltima) {
      onComenzar();
    } else {
      setSlideIdx(i => i + 1);
    }
  };

  const handlePrev = () => {
    if (slideIdx > 0) {
      setSlideIdx(i => i - 1);
    }
  };

  const renderGrafico = (grafico) => {
    if (!grafico) return null;

    if (grafico === 'diagrama_figuras') {
      return (
        <div style={{ display: 'flex', gap: 16, marginTop: 16, flexWrap: 'wrap', justifyContent: 'flex-start' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ width: 80, height: 40, background: '#4ee86a', borderRadius: '50%', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0d1b2a', fontWeight: 'bold' }}>Inicio/Fin</div>
            <div style={{ fontSize: 11, color: '#8aaec8', marginTop: 4 }}>Óvalo</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ width: 80, height: 40, background: '#6ec4ff', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0d1b2a', fontWeight: 'bold' }}>Proceso</div>
            <div style={{ fontSize: 11, color: '#8aaec8', marginTop: 4 }}>Rectángulo</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ width: 80, height: 40, background: '#f5c542', transform: 'skew(-20deg)', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ transform: 'skew(20deg)', color: '#0d1b2a', fontWeight: 'bold', fontSize: 14 }}>Entrada/Salida</div>
            </div>
            <div style={{ fontSize: 11, color: '#8aaec8', marginTop: 4 }}>Paralelogramo</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ width: 60, height: 60, background: '#ff6e6e', transform: 'rotate(45deg)', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ transform: 'rotate(-45deg)', color: '#0d1b2a', fontWeight: 'bold' }}>Decisión</div>
            </div>
            <div style={{ fontSize: 11, color: '#8aaec8', marginTop: 4 }}>Rombo</div>
          </div>
        </div>
      );
    }
    
    if (grafico === 'esquema_eps') {
      return (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 16, flexWrap: 'wrap' }}>
           <div style={{ padding: '8px 16px', background: '#375586', borderRadius: 8, fontWeight: 'bold', color: '#fff' }}>Entrada</div>
           <div style={{ color: '#4ee86a', fontWeight: 'bold' }}>→</div>
           <div style={{ padding: '8px 16px', background: '#6ec4ff', color: '#0d1b2a', borderRadius: 8, fontWeight: 'bold' }}>Proceso</div>
           <div style={{ color: '#4ee86a', fontWeight: 'bold' }}>→</div>
           <div style={{ padding: '8px 16px', background: '#f5c542', color: '#0d1b2a', borderRadius: 8, fontWeight: 'bold' }}>Salida</div>
        </div>
      );
    }

    if (grafico === 'ejemplo_doble_flujo') {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
           <div className="chip f-ini" style={{ pointerEvents: 'none', transform: 'scale(0.85)' }}>Inicio</div>
           <div style={{ color: '#f5c542', fontSize: 20 }}>▼</div>
           <div className="chip f-io" style={{ pointerEvents: 'none', transform: 'scale(0.85)' }}>Leer n</div>
           <div style={{ color: '#f5c542', fontSize: 20 }}>▼</div>
           <div className="chip f-proc" style={{ pointerEvents: 'none', transform: 'scale(0.85)' }}>doble ← n × 2</div>
           <div style={{ color: '#f5c542', fontSize: 20 }}>▼</div>
           <div className="chip f-io" style={{ pointerEvents: 'none', transform: 'scale(0.85)' }}>Escribir doble</div>
           <div style={{ color: '#f5c542', fontSize: 20 }}>▼</div>
           <div className="chip f-fin" style={{ pointerEvents: 'none', transform: 'scale(0.85)' }}>Fin</div>
        </div>
      );
    }

    if (grafico === 'variable_caja') {
      return (
        <div style={{ display: 'flex', gap: 24, marginTop: 16 }}>
          <div style={{ border: '3px solid #6ec4ff', borderRadius: 8, padding: 12, width: 100, textAlign: 'center' }}>
            <div style={{ fontSize: 12, color: '#8aaec8', marginBottom: 8, borderBottom: '1px solid #1e3250' }}>edad</div>
            <div style={{ fontSize: 24, color: '#fff', fontWeight: 'bold' }}>15</div>
          </div>
          <div style={{ border: '3px solid #f5c542', borderRadius: 8, padding: 12, width: 120, textAlign: 'center' }}>
            <div style={{ fontSize: 12, color: '#8aaec8', marginBottom: 8, borderBottom: '1px solid #1e3250' }}>nombre</div>
            <div style={{ fontSize: 20, color: '#fff', fontWeight: 'bold' }}>"Leo"</div>
          </div>
        </div>
      );
    }

    return null;
  };

  const renderContent = () => (
    <div className={`teoria-box ${isModal ? 'es-modal' : ''}`}>
      {/* Botón cerrar */}
      <button type="button" className="teoria-cerrar" onClick={onVolver} aria-label="Cerrar la teoría">×</button>

      {/* Título de la lección */}
      <div className="teoria-head">
        <div className="teoria-kicker">TEORÍA</div>
        <h2 className="teoria-titulo">{leccion.titulo}</h2>
      </div>

      {/* Contenido de la diapositiva (con scroll interno si no cabe) */}
      <div className="teoria-body">
        {slide.grafico === 'ejemplo_doble_flujo' ? (
          <>
            <div className="teoria-texto">
              <img className="teoria-capy" src={esUltima ? capyAcertaste : capySerio} alt="CapyHein" />
              <h3 className="teoria-h3">{slide.titulo}</h3>
              <p className="teoria-p"><TextoLogico texto={slide.texto} /></p>
            </div>
            <div className="teoria-diagrama">
              <div className="teoria-grafico">{renderGrafico(slide.grafico)}</div>
            </div>
          </>
        ) : (
          <>
            <img className="teoria-capy" src={esUltima ? capyAcertaste : capySerio} alt="CapyHein" />
            <div className="teoria-texto">
              <h3 className="teoria-h3">{slide.titulo}</h3>
              <p className="teoria-p"><TextoLogico texto={slide.texto} /></p>
              {slide.codigo && <div className="teoria-codigo"><TextoLogico texto={slide.codigo} /></div>}
              <div className="teoria-grafico">{renderGrafico(slide.grafico)}</div>
            </div>
          </>
        )}
      </div>

      {/* Controles de navegación */}
      <div className="teoria-nav">
        <button type="button" className="teoria-btn prev" onClick={handlePrev} disabled={slideIdx === 0} style={{ visibility: slideIdx === 0 ? 'hidden' : 'visible' }}>
          ← Anterior
        </button>

        <div className="teoria-puntos" aria-label={`Diapositiva ${slideIdx + 1} de ${total}`}>
          {leccion.teoria.map((_, i) => <i key={i} className={i === slideIdx ? 'on' : ''} />)}
        </div>

        <button type="button" className={`teoria-btn next ${esUltima ? 'ultima' : ''}`} onClick={esUltima ? (isModal ? onVolver : onComenzar) : handleNext}>
          {esUltima ? (isModal ? 'CERRAR' : '¡A PRACTICAR! 🚀') : 'Siguiente →'}
        </button>
      </div>
    </div>
  );

  if (isModal) {
    return (
      <div className="nivel-screen-overlay teoria-overlay">
        {renderContent()}
      </div>
    );
  }

  return (
    <div className="nivel-screen">
      {/* Tokens de fondo */}
      <span className="bg-code-token bg-token-1">0101</span>
      <span className="bg-code-token bg-token-2">&#123; &#125;</span>
      <span className="bg-code-token bg-token-3">&#123; &#125;</span>
      <span className="bg-code-token bg-token-4">&lt;/&gt;</span>
      <span className="bg-code-token bg-token-5">⚙</span>

      <div className="nivel-container">
        {renderContent()}
      </div>
    </div>
  );
}
