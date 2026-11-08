import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { GearIcon, CrownIcon, CardIcon, FlameIcon, BackpackIcon, TrophyIcon, StarGold } from '../comun/PixelIcons';
import { PixelArt, BITMAPS } from '../comun/PixelArt';
import AvatarJugador from '../personajes/AvatarJugador';
import { RankingLista } from '../jugador/RankingPanel';

// HUD del MODO COMPACTO: capa fija sobre la pantalla con medidas táctiles (todo en px, sin la unidad u).
// Barra superior, barra inferior, tira del nivel actual, botón "centrar" y hoja inferior del ranking.
function HojaRanking({ onCerrar, xp, alias, personaje }) {
  const hojaRef = useRef(null);
  const cerrarRef = useRef(null);
  const arrastre = useRef(null);
  const [dy, setDy] = useState(0);
  const [arrastrando, setArrastrando] = useState(false);

  useEffect(() => {
    cerrarRef.current?.focus();
    const onKey = (e) => {
      if (e.key === 'Escape') { e.stopPropagation(); onCerrar(); return; }
      if (e.key !== 'Tab') return;
      // foco atrapado dentro del diálogo
      const f = [...hojaRef.current.querySelectorAll('button, [tabindex="0"]')];
      if (!f.length) return;
      const a = document.activeElement, primero = f[0], ultimo = f[f.length - 1];
      if (e.shiftKey && (a === primero || !hojaRef.current.contains(a))) { e.preventDefault(); ultimo.focus(); }
      else if (!e.shiftKey && (a === ultimo || !hojaRef.current.contains(a))) { e.preventDefault(); primero.focus(); }
    };
    document.addEventListener('keydown', onKey, true);
    return () => document.removeEventListener('keydown', onKey, true);
  }, [onCerrar]);

  const down = (e) => { arrastre.current = e.clientY; setArrastrando(true); e.currentTarget.setPointerCapture(e.pointerId); };
  const move = (e) => { if (arrastre.current !== null) setDy(Math.max(0, e.clientY - arrastre.current)); };
  const up = () => {
    if (arrastre.current === null) return;
    arrastre.current = null; setArrastrando(false);
    if (dy > 80) onCerrar(); else setDy(0);
  };

  return (
    <div className="hc-fondo" onClick={onCerrar}>
      <div ref={hojaRef} className="hc-hoja" role="dialog" aria-modal="true" aria-labelledby="hc-rk-titulo"
        style={{ transform: `translateY(${dy}px)`, transition: arrastrando ? 'none' : 'transform .2s ease' }}
        onClick={(e) => e.stopPropagation()}>
        <div className="hc-hoja-cab" onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up}>
          <span className="hc-agarre" aria-hidden="true" />
          <h2 id="hc-rk-titulo">RANKING</h2>
          <button ref={cerrarRef} type="button" className="hc-cerrar" onClick={onCerrar} onPointerDown={(e) => e.stopPropagation()} aria-label="Cerrar ranking">
            <svg viewBox="0 0 7 7" width="20" height="20" shapeRendering="crispEdges" aria-hidden="true"><path d="M0 0h2v1h1v1h1V1h1V0h2v2H6v1H5v1h1v1h1v2H5V6H4V5H3v1H2v1H0V5h1V4h1V3H1V2H0z" fill="currentColor" /></svg>
          </button>
        </div>
        <RankingLista xp={xp} alias={alias} personaje={personaje} variante="hoja" />
      </div>
    </div>
  );
}

export default function HudCompacto({
  actual, com, racha, rachaMax = 0, personaje, xp, alias, strip, fuera,
  onCentrar, onPerfil, onFicha, onLogros, onMedidas, onAdmin, pendientes = 0,
}) {
  const topRef = useRef(null);
  const botRef = useRef(null);
  const rankBtn = useRef(null);
  const [hoja, setHoja] = useState(false);

  // Informa la altura de las barras para que el mapa deje ese espacio libre arriba y abajo
  useLayoutEffect(() => {
    const medir = () => onMedidas({ top: topRef.current.offsetHeight, bottom: botRef.current.offsetHeight });
    medir();
    const ro = new ResizeObserver(medir);
    ro.observe(topRef.current); ro.observe(botRef.current);
    return () => ro.disconnect();
  }, [onMedidas]);

  const cerrar = () => { setHoja(false); setTimeout(() => rankBtn.current?.focus(), 0); };

  return (
    <div className="hud-compacto">
      <header className="hc-top" ref={topRef}>
        <div className="hc-row1">
          <button type="button" className="hc-avatar hc-btn" onClick={onFicha || onPerfil} aria-label="Ver perfil">
            <AvatarJugador personaje={personaje} size={48} />
          </button>
          <div className="hc-nivel"><span className="hc-nl">NIVEL</span><span className="hc-nn">{actual + 1}</span></div>
          <button type="button" className="hc-gear hc-btn" onClick={onPerfil} aria-label="Ajustes y perfil"><GearIcon size={32} /></button>
          {onAdmin && <button type="button" className="hc-gear hc-corona hc-btn" onClick={onAdmin} aria-label="Panel de administración" title="Panel de administración"><CrownIcon size={32} /></button>}
        </div>
        <div className="hc-row2">
          <div className="hc-pill"><span className="hc-ico"><CardIcon size={28} /></span><span>COMODINES x{com}</span></div>
          <div className="hc-pill"><span className="hc-ico"><FlameIcon size={28} /></span><span>RACHA {racha}</span></div>
          <div className="hc-pill"><span className="hc-ico"><StarGold size={28} /></span><span>MÁX {rachaMax}</span></div>
        </div>
      </header>

      {fuera && !hoja && (
        <button type="button" className="hc-centrar hc-btn" onClick={onCentrar} aria-label="Centrar el mapa en mi nivel" title="Centrar en mi nivel">
          <PixelArt rows={BITMAPS.mira} fluid />
        </button>
      )}

      <div className="hc-bottom" ref={botRef}>
        {strip && <div className="hc-strip" role="status">{strip}</div>}
        <nav className="hc-nav" aria-label="Menú del mapa">
          <button type="button" className="hc-nb hc-btn" onClick={onFicha || onPerfil}><span className="hc-nico"><BackpackIcon size={28} /></span><span>Perfil</span></button>
          <button type="button" className="hc-nb hc-btn" ref={rankBtn} onClick={() => setHoja(true)} aria-haspopup="dialog">
            <span className="hc-nico"><PixelArt rows={BITMAPS.podio} fluid /></span><span>Ranking</span>
          </button>
          <button type="button" className="hc-nb hc-btn" onClick={onLogros} aria-label={pendientes ? `Logros: ${pendientes} por reclamar` : 'Logros'}><span className="hc-nico"><TrophyIcon size={28} /></span><span>Logros</span>{pendientes > 0 && <i className="hc-alerta" aria-hidden="true">{pendientes}</i>}</button>
        </nav>
      </div>

      {hoja && <HojaRanking onCerrar={cerrar} xp={xp} alias={alias} personaje={personaje} />}
    </div>
  );
}
