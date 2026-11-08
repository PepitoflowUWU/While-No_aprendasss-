import React from 'react';
import TextoLogico from '../comun/TextoLogico.jsx';
import '../../estilos/tabla-verdad.css';

export function Alternativas({ q, valor, setValor, ocultas = [], bloq = false, resultado = null }) {
  const letras = ['A', 'B', 'C', 'D', 'E', 'F'];
  return (
    <div className="options-grid">
      {q.o.map((t, i) => {
        if (ocultas.includes(i)) return null;
        const isSelected = valor === i;
        const isCorrect = resultado === 'acertado' && isSelected;
        const isWrong = resultado === 'mal' && isSelected;
        return (
          <button
            key={i}
            disabled={bloq}
            className={`option-card ${isSelected ? 'selected' : ''} ${isCorrect ? 'correct' : ''} ${isWrong ? 'wrong' : ''}`}
            onClick={() => setValor(i)}
            type="button"
          >
            <span className="option-badge">{letras[i] || i + 1}</span>
            <span className={`option-text ${String(t).includes('\n') ? 'es-codigo' : ''}`}><TextoLogico texto={t} /></span>
          </button>
        );
      })}
    </div>
  );
}

// Sirve para "orden" (texto) y "flujo" (bloques [texto, forma] con flechas)
export function Ordenar({ q, valor, setValor, orden, bloq }) {
  const flujo = q.tipo === 'flujo';
  const chip = (i, puesto) => {
    const [t, f] = [].concat(q.l[i]);
    return (
      <button
        key={i}
        disabled={bloq}
        className={`chip ${flujo ? 'f-' + (f || 'proc') : 'cod'}`}
        onClick={() => setValor(puesto ? valor.filter((v) => v !== i) : [...valor, i])}
        type="button"
      >
        {t}
      </button>
    );
  };

  return (
    <div className="ordenar-wrapper" style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <div className="resp" style={{ 
        background: '#111d2e', borderColor: '#263e5c', minHeight: '64px', borderRadius: '6px',
        display: 'flex', flexWrap: flujo ? 'nowrap' : 'wrap', flexDirection: flujo ? 'column' : 'row',
        alignItems: 'center', justifyContent: 'flex-start', gap: flujo ? '0' : '4px',
        padding: '16px', maxHeight: flujo ? '100%' : 'none', overflowY: flujo ? 'auto' : 'visible',
        flex: flujo ? 1 : 'none'
      }}>
        {valor.length ? (
          valor.map((i, k) => (
            <div key={i} style={{ display: 'flex', flexDirection: flujo ? 'column' : 'row', alignItems: 'center' }}>
              {k > 0 && flujo && <b className="flecha" style={{ margin: '4px 0', color: '#f5c542', fontSize: '20px' }}>▼</b>}
              {k > 0 && !flujo && <b className="flecha" style={{ margin: '0 4px', color: '#f5c542' }}>►</b>}
              {chip(i, true)}
            </div>
          ))
        ) : (
          <span className="ph" style={{ color: '#7a8ea8', fontSize: '15px' }}>
            Toca los bloques en el orden correcto
          </span>
        )}
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
        {orden.filter((i) => !valor.includes(i)).map((i) => chip(i, false))}
      </div>
    </div>
  );
}
