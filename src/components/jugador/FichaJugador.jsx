import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import AvatarJugador from '../personajes/AvatarJugador';
import LogroIcono from './LogroIcono';
import { usePersonajes } from '../../context/PersonajesContext.jsx';
import { CURSOS } from '../../datos/cursos';
import { metricasDe, estrellasDeNivel } from '../../datos/logros.js';
import { MAX_DESTACADOS } from '../../hooks/useLogros.js';
import '../../estilos/logros.css';

// Perfil del jugador (se abre con el boton NIVEL ACTUAL): a la izquierda su personaje completo; a la derecha su nombre, XP total,
// niveles completados, estrellas y racha maxima; sus LOGROS DESTACADOS (hasta 3, los elige el jugador) y los logros que ya reclamo.
export default function FichaJugador({ p, sesion, logros, onCerrar }) {
  const cerrarRef = useRef(null);
  const { porId } = usePersonajes();
  const personaje = porId(sesion.personaje);
  const m = useMemo(() => metricasDe(p), [p]);
  const niveles = CURSOS[0].niveles;
  const estrellasMax = niveles.length * 3;                                  // 3 estrellas por nivel
  const hechos = p.hechos?.[CURSOS[0].id] || {};
  const porNivel = niveles.map((_, i) => ({ n: i + 1, completado: !!hechos[i]?.completado, estrellas: estrellasDeNivel(hechos[i]) }));
  const dias = m.racha_maxima;

  // Logros destacados: el jugador elige hasta 3 de sus logros obtenidos (se guardan en la base)
  const [editando, setEditando] = useState(false);
  const [eleccion, setEleccion] = useState([]);
  const [guardando, setGuardando] = useState(false);
  const [errorDest, setErrorDest] = useState('');
  const destacados = logros.destacados || [];
  const editar = () => { setEleccion(destacados.map((l) => l.codigo)); setErrorDest(''); setEditando(true); };
  const alternar = (codigo) => setEleccion((e) => (e.includes(codigo)
    ? e.filter((c) => c !== codigo)
    : e.length < MAX_DESTACADOS ? [...e, codigo] : e));
  const guardar = async () => {
    setGuardando(true); setErrorDest('');
    try { await logros.guardarDestacados(eleccion); setEditando(false); }
    catch (e) { setErrorDest(e.message); }
    finally { setGuardando(false); }
  };
  const huecos = editando
    ? eleccion.map((c) => logros.obtenidos.find((l) => l.codigo === c)).filter(Boolean)
    : destacados;

  useEffect(() => {
    const previo = document.activeElement;
    cerrarRef.current?.focus();
    const tecla = (e) => { if (e.key === 'Escape') { e.stopPropagation(); onCerrar(); } };
    document.addEventListener('keydown', tecla, true);
    return () => { document.removeEventListener('keydown', tecla, true); previo?.focus?.(); };
  }, [onCerrar]);

  const datos = [
    ['JUGADOR', sesion.usuario || 'Jugador'],
    ['XP TOTAL', m.puntaje_total],
    ['NIVELES COMPLETADOS', `${m.niveles_completados} / ${niveles.length}`],
    ['ESTRELLAS OBTENIDAS', `${m.estrellas_total} / ${estrellasMax}`],
    ['RACHA MÁXIMA', `${dias} ${dias === 1 ? 'día' : 'días'}`],
  ];

  return createPortal(
    <div className="lg-fondo" onClick={onCerrar} onPointerDown={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()} role="presentation">
      <div className="fj-panel" role="dialog" aria-modal="true" aria-labelledby="fj-titulo" onClick={(e) => e.stopPropagation()}>
        <div className="lg-barra">
          <h2 id="fj-titulo">JUGADOR</h2>
          <button ref={cerrarRef} type="button" className="lg-x" onClick={onCerrar} aria-label="Cerrar">✕</button>
        </div>
        <div className="fj-cuerpo">
          <div className="fj-personaje" aria-label={personaje ? `Personaje: ${personaje.nombre}` : 'Personaje'}>
            {personaje?.imagen
              ? <img src={personaje.imagen} alt={`Personaje ${personaje.nombre}`} />
              : <AvatarJugador personaje={sesion.personaje} size={120} />}
            {personaje && <span className="fj-pj-nombre">{personaje.nombre}</span>}
          </div>
          <div className="fj-derecha">
            <dl className="fj-datos">
              {datos.map(([k, v]) => <div key={k} className={k === 'JUGADOR' ? 'fj-nombre' : ''}><dt>{k}</dt><dd>{v}</dd></div>)}
            </dl>
            <ul className="fj-niveles" aria-label="Estrellas por nivel">

            </ul>

            <section className="fj-logros fj-destacados" aria-label="Logros destacados">
              <h3>
                LOGROS DESTACADOS
                {logros.obtenidos.length > 0 && !editando && (
                  <button type="button" className="fj-editar" onClick={editar}>{destacados.length ? 'CAMBIAR' : 'ELEGIR'}</button>
                )}
              </h3>
              <ul className="fj-dest">
                {Array.from({ length: MAX_DESTACADOS }, (_, i) => {
                  const l = huecos[i];
                  return l
                    ? (
                      <li key={l.codigo} className="lleno" title={`${l.nombre}: ${l.descripcion}`}>
                        <span className="fj-ins"><LogroIcono tipo={l.icono} size={40} /></span>
                        <b>{l.nombre}</b>
                      </li>
                    )
                    : <li key={`vacio-${i}`} className="vacio" aria-label="Espacio libre"><span aria-hidden="true">+</span></li>;
                })}
              </ul>
              {editando && (
                <div className="fj-dest-acciones">
                  <p>Toca tus logros de abajo para elegir hasta {MAX_DESTACADOS} (<b>{eleccion.length}/{MAX_DESTACADOS}</b>).</p>
                  <div>
                    <button type="button" className="lg-btn" onClick={() => setEditando(false)} disabled={guardando}>CANCELAR</button>
                    <button type="button" className="lg-btn lg-btn-todo" onClick={guardar} disabled={guardando}>{guardando ? 'GUARDANDO…' : 'GUARDAR'}</button>
                  </div>
                </div>
              )}
              {errorDest && <p className="lg-error" role="alert">{errorDest}</p>}
              {!logros.obtenidos.length && <p className="fj-vacio">Cuando tengas logros podrás elegir {MAX_DESTACADOS} para destacarlos aquí.</p>}
            </section>

            <section className="fj-logros" aria-label="Logros obtenidos">
              <h3>LOGROS OBTENIDOS <span>{logros.obtenidos.length}/{logros.total}</span></h3>
              {logros.obtenidos.length
                ? (
                  <ul className="fj-grid">
                    {logros.obtenidos.map((l) => {
                      const pos = eleccion.indexOf(l.codigo);
                      const contenido = (
                        <>
                          <span className="fj-ins"><LogroIcono tipo={l.icono} size={34} /></span>
                          <b>{l.nombre}</b>
                          {editando && pos >= 0 && <i className="fj-pos" aria-hidden="true">{pos + 1}</i>}
                        </>
                      );
                      return (
                        <li key={l.codigo} title={`${l.nombre}: ${l.descripcion}`} className={editando ? `elegible ${pos >= 0 ? 'elegido' : ''}` : ''}>
                          {editando
                            ? (
                              <button type="button" aria-pressed={pos >= 0} onClick={() => alternar(l.codigo)}
                                disabled={pos < 0 && eleccion.length >= MAX_DESTACADOS} aria-label={`Destacar ${l.nombre}`}>
                                {contenido}
                              </button>
                            )
                            : contenido}
                        </li>
                      );
                    })}
                  </ul>
                )
                : <p className="fj-vacio">Aún no tienes logros. Completa los retos de <b>LOGROS</b> y reclámalos para verlos aquí.</p>}
            </section>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
