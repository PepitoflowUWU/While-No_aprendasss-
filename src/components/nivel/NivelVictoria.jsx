import React from 'react';
import { usePersonajes } from '../../context/PersonajesContext.jsx';

// Formatea milisegundos en M:SS
function fmt(ms) {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  return m > 0 ? `${m}m ${s % 60}s` : `${s}s`;
}

const MSG = {
  3: '¡Perfección! Dominaste el nivel sin errores.',
  2: '¡Muy bien! Sigue practicando para llegar a 3 estrellas.',
  1: '¡Lo lograste! Repasa el tema e inténtalo de nuevo.',
};

export default function NivelVictoria({ leccion, leccionIdx, nivel, nivelIdx, estrellas = 1, tiempoMs = 0, precision = 0, errores = 0, xpGanada = 30, repetida = false, guardando = false, errorGuardado = false, onVolver }) {
  const capyRiendose = usePersonajes().imagenGuia('riendose') || undefined;
  const stars = '⭐'.repeat(estrellas) + '☆'.repeat(3 - estrellas);

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 300,
      background: '#0d1b2a',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: 'Nunito, sans-serif',
    }}>
      <div style={{
        background: '#112240',
        border: '3px solid #f5c542',
        borderRadius: 16,
        padding: '32px 40px',
        maxWidth: 480,
        width: '90%',
        textAlign: 'center',
        color: '#fff',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 16,
      }}>
        {capyRiendose && <img src={capyRiendose} alt="Capyehein" style={{ width: 100, objectFit: 'contain' }} />}

        <div style={{ color: '#aac4e0', fontSize: 12, letterSpacing: 2, fontFamily: 'monospace' }}>
          NIVEL {nivelIdx + 1} · LECCIÓN {leccionIdx + 1}
        </div>

        <h2 style={{ color: '#ffd84e', margin: 0, fontSize: 22 }}>¡LECCIÓN COMPLETADA!</h2>

        <div style={{ fontSize: 40 }}>{stars}</div>

        {repetida
          ? <div style={{ color: '#9cc8ff', fontSize: 15, fontWeight: 700, textAlign: 'center' }}>Lección repetida: no suma puntos</div>
          : <div style={{ color: '#4ee86a', fontSize: 28, fontWeight: 900 }}>+{xpGanada} XP</div>}

        <div style={{ display: 'flex', gap: 12, width: '100%' }}>
          {[
            { icon: '⏱', label: 'Tiempo',   val: fmt(tiempoMs),    col: '#6ec4ff' },
            { icon: '🎯', label: 'Precisión', val: precision + '%', col: precision >= 80 ? '#4ee86a' : '#ffd84e' },
            { icon: '❌', label: 'Errores',  val: errores,          col: errores === 0 ? '#4ee86a' : '#ffd84e' },
          ].map(s => (
            <div key={s.label} style={{
              flex: 1,
              background: 'rgba(255,255,255,0.06)',
              borderRadius: 10,
              padding: '12px 8px',
            }}>
              <div style={{ fontSize: 22 }}>{s.icon}</div>
              <div style={{ fontSize: 11, color: '#8aaec8', marginBottom: 4 }}>{s.label}</div>
              <div style={{ color: s.col, fontWeight: 900, fontSize: 18 }}>{s.val}</div>
            </div>
          ))}
        </div>

        <p style={{ color: '#d4ecff', margin: 0, fontSize: 14 }}>{MSG[estrellas] || MSG[1]}</p>
        {errorGuardado && <p role="alert" style={{ color: '#ffb4b4', margin: 0, fontSize: 13, textAlign: 'center' }}>No se pudo guardar tu progreso. Revisa tu conexión e inténtalo de nuevo.</p>}

        <button
          onClick={onVolver}
          disabled={guardando}
          style={{
            background: '#f5c542',
            color: '#1c1400',
            border: 'none',
            borderRadius: 8,
            padding: '14px 32px',
            fontSize: 15,
            fontWeight: 900,
            cursor: guardando ? 'wait' : 'pointer',
            opacity: guardando ? 0.7 : 1,
            marginTop: 4,
          }}
        >
          {guardando ? 'GUARDANDO…' : '📈 VER MI PROGRESO'}
        </button>
      </div>
    </div>
  );
}
