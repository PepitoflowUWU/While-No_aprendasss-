import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { StarGold } from '../comun/PixelIcons';
import AvatarJugador from '../personajes/AvatarJugador';
import { consultarRanking } from '../../supabase/ranking';
import JugadorDetalle from './JugadorDetalle';

const FILAS_VISIBLES = 5;

// Lista del ranking con scroll interno (5 filas visibles en el panel; filas de 52 px en la hoja inferior).
// La fila del usuario se resalta y se centra al abrir. Flechas arriba/abajo desplazan una fila.
// Los datos salen de Supabase (solo usuarios registrados, con sus puntos actuales). Sin usuarios registrados queda vacio.
// alias = nombre de usuario del usuario actual (null para invitados, que no aparecen en el ranking).
export function RankingLista({ xp = 0, alias = null, personaje, variante = 'panel' }) {
  const listaRef = useRef(null);
  const yoRef = useRef(null);
  const [datos, setDatos] = useState([]);
  const [abierto, setAbierto] = useState(null);   // nombre del jugador cuya ficha esta abierta

  // Se consulta al abrir y de nuevo (con una pausa corta) cuando cambian los puntos del usuario.
  useEffect(() => {
    let vivo = true;
    const t = setTimeout(() => {
      consultarRanking().then((r) => { if (vivo) setDatos(r); })
        .catch((e) => { if (vivo) { console.warn('[Supabase] ranking:', e?.message || e); setDatos([]); } });
    }, 400);
    return () => { vivo = false; clearTimeout(t); };
  }, [xp]);

  const filas = useMemo(
    () => datos.map((r) => ({
      a: r.nombre_usuario, personaje: r.personaje_id, codigo: r.codigo_estudiante,
      rachaMax: r.racha_maxima, conexion: r.ultima_conexion,
      yo: !!alias && r.nombre_usuario === alias,
      x: !!alias && r.nombre_usuario === alias ? Math.max(r.puntaje_total, xp) : r.puntaje_total,
    })).sort((a, b) => b.x - a.x),
    [datos, alias, xp],
  );

  useLayoutEffect(() => {
    const l = listaRef.current, m = yoRef.current;
    if (l && m) l.scrollTop = m.offsetTop - (l.clientHeight - m.offsetHeight) / 2;
  }, [filas.length]);

  const onKeyDown = (e) => {
    if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
    e.preventDefault();
    const l = listaRef.current;
    const fila = variante === 'hoja' ? 52 : l.clientHeight / FILAS_VISIBLES;
    l.scrollBy({ top: (e.key === 'ArrowDown' ? 1 : -1) * fila, behavior: 'smooth' });
  };

  return (
    <div className={`mp-rk-list ${variante === 'hoja' ? 'hoja' : ''}`} ref={listaRef} tabIndex={0} role="region" aria-label="Ranking de jugadores" onKeyDown={onKeyDown}>
      <ol>
        {filas.map((r, i) => (
          <li key={r.a + i} ref={r.yo ? yoRef : null} className={`mp-rk-row ${r.yo ? 'yo' : ''}`} aria-current={r.yo ? 'true' : undefined}
            role="button" tabIndex={0} aria-label={`Ver datos de ${r.a}, puesto ${i + 1}`} style={{ cursor: 'pointer' }}
            onClick={() => setAbierto(r.a)}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.stopPropagation(); setAbierto(r.a); } }}>
            <span className="mp-rk-pos">{i + 1}</span>
            <span className="mp-rk-av"><AvatarJugador personaje={r.yo ? personaje : r.personaje} size={32} /></span>
            <span className="mp-rk-alias"><span className="mp-rk-txt">{r.a}</span>{r.yo && <b className="mp-rk-tu">TÚ</b>}</span>
            <span className="mp-rk-score">{r.x}</span>
          </li>
        ))}
      </ol>
      {abierto && filas.find((f) => f.a === abierto) && (
        <JugadorDetalle jugador={filas.find((f) => f.a === abierto)} esYo={filas.find((f) => f.a === abierto).yo} onCerrar={() => setAbierto(null)} />
      )}
    </div>
  );
}

// Panel de escritorio (modo amplio): título fijo + lista con scroll.
export function RankingPanel(props) {
  return (
    <section className="mp-item mp-wood mp-rank" aria-labelledby="mp-rk-titulo">
      <h2 id="mp-rk-titulo" className="mp-rk-title">RANKING</h2>
      <RankingLista {...props} />
    </section>
  );
}

export function ObjetivoPanel({ hechos, total }) {
  const pct = Math.min(100, Math.round((hechos / (total || 1)) * 100));
  return (
    <section className="mp-item mp-wood mp-obj" aria-label="Objetivo">
      <div className="mp-obj-head"><span className="mp-obj-star"><StarGold size={26} /></span><h2>OBJETIVO</h2></div>
      <p>Completa {total} niveles</p>
      <div className="mp-obj-bar" role="progressbar" aria-valuemin={0} aria-valuemax={total} aria-valuenow={hechos} aria-label="Niveles completados">
        <div className="mp-obj-fill" style={{ width: `${pct}%` }} />
        <span>{hechos} / {total}</span>
      </div>
    </section>
  );
}
