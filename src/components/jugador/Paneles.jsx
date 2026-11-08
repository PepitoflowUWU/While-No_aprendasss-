import { useEffect } from 'react';
import { metricasDe } from '../../datos/logros.js';
import { RankingLista } from './RankingPanel';
import { AvatarPixel, StarGold } from '../comun/PixelIcons';

export function Ventana({ titulo, onCerrar, children }) {
  useEffect(() => {
    const f = (e) => e.key === 'Escape' && onCerrar();
    window.addEventListener('keydown', f);
    return () => window.removeEventListener('keydown', f);
  }, [onCerrar]);
  return (
    <div className="velo" onMouseDown={(e) => e.target === e.currentTarget && onCerrar()}>
      <div className="modal" role="dialog" aria-modal="true" aria-label={titulo}>
        <h2>{titulo}</h2>
        {children}
      </div>
    </div>
  );
}

export function Ranking({ xp = 0, alias = null, personaje }) {
  // Mismos datos que el panel del mapa: usuarios registrados de Supabase con sus puntos actuales.
  return (
    <div className="rk-card">
      <div className="rk-header-ribbon">
        <span>Ranking</span>
      </div>
      <RankingLista xp={xp} alias={alias} personaje={personaje} variante="hoja" />
    </div>
  );
}

export function Objetivo({ hechos, total }) {
  const pct = Math.min(100, Math.round((hechos / (total || 1)) * 100));
  return (
    <div className="obj-card">
      <div className="side-divider" />
      <div className="obj-header">Objetivo de Sección</div>
      <div className="obj-star-icon">
        <StarGold size={26} />
      </div>
      <div className="obj-subtitle">Completa {total} niveles</div>
      <div className="obj-bar-wrapper">
        <div className="obj-bar-track">
          <div className="obj-bar-fill" style={{ width: `${pct}%` }} />
        </div>
      </div>
      <div className="obj-counter">{hechos} / {total}</div>
    </div>
  );
}

export function Perfil({ p, sesion, onReiniciar, onSalir, onCerrar }) {
  const m = metricasDe(p);
  return (
    <Ventana titulo="Perfil" onCerrar={onCerrar}>
      <p>Jugador: {sesion.usuario}</p>
      <p>XP total: {p.xp}</p>
      <p>Niveles completados: {m.niveles_completados}</p>
      <p>Estrellas: {m.estrellas_total}</p>
      <p>Racha: {p.racha} {p.racha === 1 ? 'día' : 'días'}</p>
      <p>Comodines: {p.com}</p>
      <div className="row">
        {onReiniciar && <button className="sec" onClick={() => window.confirm('¿Borrar todo tu progreso?') && onReiniciar()}>Reiniciar progreso</button>}
        <button className="sec" onClick={onSalir}>Cerrar sesión</button>
        <button className="go" onClick={onCerrar}>Cerrar</button>
      </div>
    </Ventana>
  );
}
