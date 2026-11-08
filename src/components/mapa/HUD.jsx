import React from 'react';
import { GearIcon, CrownIcon, CardIcon, FlameIcon, StarGold } from '../comun/PixelIcons';
import AvatarJugador from '../personajes/AvatarJugador';

// HUD superior: nivel actual (con avatar), ajustes, comodines y racha.
export default function HUD({ actual, com, racha, rachaMax = 0, personaje, onPerfil, onFicha, onAdmin }) {
  return (
    <>
      <button type="button" className="mp-item mp-nivel mp-btn" onClick={onFicha || onPerfil} aria-label={`Nivel actual ${actual + 1}. Ver perfil`} title="Ver perfil">
        <span className="mp-avatar"><AvatarJugador personaje={personaje} size={64} /></span>
        <span className="mp-panel mp-nivel-panel">
          <span className="mp-t">NIVEL ACTUAL</span>
          <span className="mp-n">{actual + 1}</span>
        </span>
      </button>

      <button type="button" className="mp-item mp-panel mp-gear mp-btn" onClick={onPerfil} aria-label="Ajustes y perfil" title="Ajustes">
        <span className="mp-ico"><GearIcon size={40} /></span>
      </button>

      {onAdmin && (
        <button type="button" className="mp-item mp-panel mp-corona mp-btn" onClick={onAdmin} aria-label="Panel de administración" title="Panel de administración">
          <span className="mp-ico"><CrownIcon size={40} /></span>
        </button>
      )}
      <div className="mp-item mp-panel mp-com">
        <span className="mp-ico-s"><CardIcon size={40} /></span>
        <span className="mp-txt"><span className="mp-t">COMODINES</span><span className="mp-v">x {com}</span></span>
      </div>

      <div className="mp-item mp-panel mp-racha">
        <span className="mp-ico-s"><FlameIcon size={40} /></span>
        <span className="mp-txt"><span className="mp-t">RACHA</span><span className="mp-v gold">{racha} {racha === 1 ? 'día' : 'días'}</span></span>
      </div>

      <div className="mp-item mp-panel mp-racha-max">
        <span className="mp-ico-s"><StarGold size={40} /></span>
        <span className="mp-txt"><span className="mp-t">RACHA MÁX.</span><span className="mp-v gold">{rachaMax} {rachaMax === 1 ? 'día' : 'días'}</span></span>
      </div>
    </>
  );
}
