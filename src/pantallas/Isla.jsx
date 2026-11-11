import { useEffect, useMemo, useRef, useState } from 'react';
import { CURSOS, PERSONAJES } from '../datos/cursos';
import { useProgreso } from '../hooks/useProgreso';
import { leerAvances, guardarAvance, borrarAvance, claveAvance } from '../supabase/leccionEnCurso.js';
import { useNivelesRemotos } from '../hooks/useNiveles';
import Mapa from '../components/mapa/Mapa';
import HUD from '../components/mapa/HUD';
import Nivel from '../components/nivel/Nivel';
import PanelNivel from '../components/mapa/PanelNivel';
import PantallaTeoria from '../components/nivel/PantallaTeoria';
import { empiezaConTeoria } from '../datos/helpers.js';
import { Ranking } from '../components/jugador/Paneles';
import OpcionesModal from '../components/jugador/OpcionesModal';
import TutorialMesias, { tutorialVisto, marcarTutorialVisto } from '../components/mapa/TutorialMesias';
import { useMusicaActiva, useAnimaciones } from '../audio/preferencias.js';
import LogrosPanel from '../components/jugador/LogrosPanel';
import FichaJugador from '../components/jugador/FichaJugador';
import { useLogros } from '../hooks/useLogros.js';
import AdminPanel from '../components/admin/AdminPanel';
import { RankingPanel, ObjetivoPanel } from '../components/jugador/RankingPanel';
import { BackpackIcon, TrophyIcon } from '../components/comun/PixelIcons';
import MusicaMundo from '../components/multimedia/MusicaMundo';
import '@fontsource/pixelify-sans/latin-400.css';
import '@fontsource/pixelify-sans/latin-700.css';
import '@fontsource/press-start-2p/latin-400.css';
import '../estilos/isla.css';
import '../estilos/mapa-hud.css';
import '../estilos/mapa-escenario.css';
import '../estilos/mapa-compacto.css';

// Mapea la sección del registro al ID del curso
const CURSO_DE = { 'Algoritmos': 'pseudocodigo' };

export default function Isla({ sesion, onSalir, onMusica, onAnimaciones }) {
  const { p, completar, usarComodin, limiteUnidad, usadosUnidad } = useProgreso(sesion);
  const logros = useLogros(sesion, p);
  const [cid,    setCid]    = useState(CURSO_DE[sesion.seccion] || CURSOS[0].id);
  const [nivel,  setNivel]  = useState(null); // indice del nivel abierto
  const [leccionActiva, setLeccionActiva] = useState(null); // indice de la lección
  const [mostrarTeoria, setMostrarTeoria] = useState(false);
  const [enEjercicios, setEnEjercicios] = useState(false);
  const [panel,  setPanel]  = useState(null);
  const [aviso,  setAviso]  = useState('');
  const [recienDesbloqueado, setRecienDesbloqueado] = useState(null);
  const [tutorial, setTutorial] = useState(() => !tutorialVisto(sesion));   // la primera vez que entra al mapa
  const musicaActiva = useMusicaActiva();
  const animacionesActivas = useAnimaciones();
  const timer = useRef();
  const flashTimer = useRef();

  // Lecciones a medias: donde se quedo el jugador en cada una (Supabase + este navegador)
  const [avances, setAvances] = useState({});
  useEffect(() => { let vivo = true; leerAvances(sesion).then((m) => vivo && setAvances(m)); return () => { vivo = false; }; }, [sesion?.id]);   // eslint-disable-line react-hooks/exhaustive-deps

  const remotos = useNivelesRemotos();   // lecciones de los niveles 1 y 2 guardadas en Supabase (si no estan, se usa la copia local, identica)
  const curso = useMemo(() => {
    const base = CURSOS.find(c => c.id === cid) || CURSOS[0];
    if (base.id !== CURSOS[0].id) return base;
    // La base trae titulo, teoria y ejercicios; lo demas de cada leccion (intro, introTexto, sinTeoria) sale de la copia local
    return { ...base, niveles: base.niveles.map((n, i) => (remotos[i] ? { ...n, lecciones: remotos[i].lecciones.map((l, k) => ({ ...n.lecciones[k], ...l })) } : n)) };
  }, [cid, remotos]);
  const hechos   = p.hechos[cid] || {};
  const total    = curso.niveles.length;
  const nHechos  = Object.keys(hechos).length;

  // Primer nivel sin completar = nivel "actual" disponible
  let actual = 0;
  for (let i = 0; i < total; i++) {
    if (!hechos[i]?.completado) { actual = i; break; }
    if (i === total - 1) actual = total - 1; // todos completados
  }

  const [pos, setPos] = useState(actual);
  useEffect(() => setPos(actual), [actual, cid]);

  // Avisos: error al guardar el progreso, o la base de datos aun sin la migracion 11
  useEffect(() => { if (p.error) avisar(p.error); }, [p.error]);   // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (sesion && !sesion.invitado && !sesion.db?.estado) avisar('No se pudo leer tu progreso: falta actualizar la base de datos (database/migraciones/11).');
  }, []);   // eslint-disable-line react-hooks/exhaustive-deps

  // Limpiar timers al desmontar
  useEffect(() => () => { clearTimeout(timer.current); clearTimeout(flashTimer.current); }, []);

  const avisar = (m) => {
    setAviso(m);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setAviso(''), 2000);
  };

  const elegir = (i) => {
    if (i > actual) return avisar('Completa el nivel anterior para desbloquearlo.');
    setPos(i);
    setTimeout(() => setNivel(i), 500);
  };

  // Avance guardado de una leccion, solo si sigue siendo valido para su contenido actual
  const avanceDe = (nivelIdx, leccionIdx) => {
    const a = avances[claveAvance(cid, nivelIdx, leccionIdx)];
    const lec = curso.niveles[nivelIdx]?.lecciones[leccionIdx];
    return a && lec && a.ejercicio <= lec.ejercicios.length && Array.isArray(a.intentos) && a.intentos.length === a.ejercicio ? a : null;
  };
  const cambiarAvance = (nivelIdx, leccionIdx, datos) => {
    const k = claveAvance(cid, nivelIdx, leccionIdx);
    if (!datos) {
      if (!avances[k]) return;
      setAvances((m) => { const n = { ...m }; delete n[k]; return n; });
      borrarAvance(sesion, cid, nivelIdx, leccionIdx);
      return;
    }
    const fila = { curso: cid, nivel: nivelIdx, leccion: leccionIdx, ...datos };
    setAvances((m) => ({ ...m, [k]: { ...fila, actualizado: new Date().toISOString() } }));
    guardarAvance(sesion, fila);
  };

  // Callback al elegir lección
  const handleElegirLeccion = (idx) => {
    setLeccionActiva(idx);
    // Una leccion a medias sigue directo en el ejercicio donde se quedo (la teoria queda en el boton TEORIA)
    if (avanceDe(nivel, idx)) { setEnEjercicios(true); return; }
    // Las lecciones de practica (nivel 4) van directo a los ejercicios: la teoria queda en el boton TEORIA
    if (empiezaConTeoria(curso.niveles[nivel].lecciones[idx])) setMostrarTeoria(true);
    else setEnEjercicios(true);
  };

  // Callback al finalizar una lección
  // La leccion ya se registro en el servidor al terminar la ultima pregunta (Nivel llama a onCompletar);
  // aqui solo se cierra el ejercicio y, si el servidor dijo que se completo el nivel, se muestra el destello del siguiente.
  const alTerminarLeccion = (resultado) => {
    const nivelIdx = nivel;
    setEnEjercicios(false);
    setLeccionActiva(null);

    if (resultado?.nivel_completado_ahora) {
      // Si hay un nivel siguiente, mostrar flash
      const siguienteIdx = nivelIdx + 1;
      if (siguienteIdx < total) {
        setRecienDesbloqueado(siguienteIdx);
        clearTimeout(flashTimer.current);
        flashTimer.current = setTimeout(() => setRecienDesbloqueado(null), 3500);
      }
    }
  };

  return (
    <div className="isla">
      <MusicaMundo />
      {/* Mapa de la isla */}
      <Mapa
        niveles={curso.niveles}
        hechos={hechos}
        actual={actual}
        pos={pos}
        onElegir={elegir}
        aviso={aviso}
        recienDesbloqueado={recienDesbloqueado}
        personaje={sesion.personaje}
        hudDatos={{
          com: p.com, racha: p.racha, rachaMax: p.rachaMax, personaje: sesion.personaje, xp: p.xp,
          alias: sesion.invitado ? null : (sesion.usuario || null),   // los invitados no aparecen en el ranking
          onPerfil: () => setPanel('ajustes'), onAjustes: () => setPanel('ajustes'), onFicha: () => setPanel('ficha'), onLogros: () => setPanel('logros'), pendientes: logros.pendientes,
          onAdmin: sesion.esAdmin ? () => setPanel('admin') : undefined,
        }}
      >
        <HUD
          actual={actual}
          com={p.com}
          racha={p.racha}
          rachaMax={p.rachaMax}
          personaje={sesion.personaje}
          onPerfil={() => setPanel('ajustes')}
          onAjustes={() => setPanel('ajustes')}
          onFicha={() => setPanel('ficha')}
          onAdmin={sesion.esAdmin ? () => setPanel('admin') : undefined}
        />
        <RankingPanel xp={p.xp} alias={sesion.invitado ? null : (sesion.usuario || null)} personaje={sesion.personaje} />
        <ObjetivoPanel hechos={nHechos} total={total} />
        <button type="button" className="mp-item mp-panel mp-sq mp-perfil mp-btn" data-tuto="perfil" onClick={() => setPanel('ficha')} aria-label="Perfil">
          <span className="mp-ico-big"><BackpackIcon size={64} /></span>
          <span className="mp-lbl">Perfil</span>
        </button>
        <button type="button" className="mp-item mp-panel mp-sq mp-logros mp-btn" data-tuto="logros" onClick={() => setPanel('logros')} aria-label={logros.pendientes ? `Logros: ${logros.pendientes} por reclamar` : 'Logros'}>
          {logros.pendientes > 0 && <i className="mp-alerta" aria-hidden="true">{logros.pendientes}</i>}
          <span className="mp-ico-big"><TrophyIcon size={64} /></span>
          <span className="mp-lbl">Logros</span>
        </button>
      </Mapa>

      {/* Pantallas del flujo de lecciones */}
      {nivel !== null && !mostrarTeoria && !enEjercicios && (
        <PanelNivel
          nivel={curso.niveles[nivel]}
          nivelIdx={nivel}
          nivelHechos={hechos[nivel]}
          enCurso={Object.fromEntries(curso.niveles[nivel].lecciones.map((_, k) => [k, avanceDe(nivel, k)]).filter(([, a]) => a).map(([k, a]) => [k, a.ejercicio]))}
          onClose={() => setNivel(null)}
          onElegirLeccion={handleElegirLeccion}
        />
      )}

      {mostrarTeoria && leccionActiva !== null && (
        <PantallaTeoria
          leccion={curso.niveles[nivel].lecciones[leccionActiva]}
          onVolver={() => { setMostrarTeoria(false); setLeccionActiva(null); }}
          onComenzar={() => { setMostrarTeoria(false); setEnEjercicios(true); }}
        />
      )}

      {enEjercicios && leccionActiva !== null && (
        <Nivel
          key={cid + nivel + leccionActiva}
          leccion={curso.niveles[nivel].lecciones[leccionActiva]}
          leccionIdx={leccionActiva}
          nivel={curso.niveles[nivel]}
          nivelIdx={nivel}
          personajeId={sesion.personaje}
          com={p.com}
          usos={{ usados: usadosUnidad(cid), limite: limiteUnidad(cid) }}   // comodines usados en TODA la unidad (el limite lo pone el servidor)
          primeraVez={!((p.hechos[cid]?.[nivel]?.lecciones?.[leccionActiva] || 0) > 0)}
          avance={avanceDe(nivel, leccionActiva)}
          onAvance={(datos) => cambiarAvance(nivel, leccionActiva, datos)}
          onUsarComodin={() => usarComodin(cid)}
          onCompletar={(intentos) => completar(cid, nivel, leccionActiva, intentos)}
          onFin={alTerminarLeccion}
          onCerrar={() => { setEnEjercicios(false); setLeccionActiva(null); }}
        />
      )}

      {/* Modales */}
      {panel === 'ranking' && (
        <div className="velo" onMouseDown={(e) => e.target === e.currentTarget && setPanel(null)}>
          <div className="rpg-board-modal">
            <button 
              onClick={() => setPanel(null)} 
              aria-label="Cerrar"
              style={{
                position: 'absolute', top: '-14px', right: '-14px',
                background: '#d64545', border: '3px solid #fff', borderRadius: '50%',
                width: '32px', height: '32px', color: '#fff', cursor: 'pointer',
                fontWeight: '900', fontSize: '16px', boxShadow: '0 4px 6px rgba(0,0,0,0.5)',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}
            >×</button>
            <div className="rivet tl" />
            <div className="rivet tr" />
            <div className="rivet bl" />
            <div className="rivet br" />
            <Ranking xp={p.xp} alias={sesion.invitado ? null : (sesion.usuario || null)} personaje={sesion.personaje} />
          </div>
        </div>
      )}
      {panel === 'ajustes' && (
        <OpcionesModal
          titulo="AJUSTES" invitado={!!sesion.invitado}
          musicaActiva={musicaActiva} onMusica={onMusica}
          animacionesActivas={animacionesActivas} onAnimaciones={onAnimaciones}
          onTutorial={() => { setPanel(null); setTutorial(true); }}
          onCerrarSesion={onSalir}
          onCerrar={() => setPanel(null)}
        />
      )}
      {panel === 'logros'  && <LogrosPanel logros={logros} onCerrar={() => setPanel(null)} />}
      {panel === 'ficha'   && <FichaJugador p={p} sesion={sesion} logros={logros} onCerrar={() => setPanel(null)} />}
      {panel === 'admin' && sesion.esAdmin && <AdminPanel sesion={sesion} onCerrar={() => setPanel(null)} />}

      {/* Tutorial del Mesías: solo sobre el mapa (no encima de una ventana ni de una lección) */}
      {tutorial && panel === null && nivel === null && !enEjercicios && !mostrarTeoria && (
        <TutorialMesias personaje={sesion.personaje} esAdmin={!!sesion.esAdmin}
          onFin={() => { marcarTutorialVisto(sesion); setTutorial(false); }} />
      )}
    </div>
  );
}
