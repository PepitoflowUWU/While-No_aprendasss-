import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Alternativas, Ordenar } from './Ejercicios';
import TablaVerdad, { tablaVacia, tablaCompleta, tablaCorrecta, primeraCeldaMala } from './TablaVerdad.jsx';
import EjercicioEscribir from './EjercicioEscribir.jsx';
import EjercicioDiagrama from './EjercicioDiagrama.jsx';
import { evaluarDiagrama, solucionDe } from '../../servicios/diagrama.js';
import { verificarAlternativa } from '../../supabase/respuestas.js';
import { evaluar, completo, valoresVacios, saludoGuia, fraseSeria } from '../../servicios/escribir.js';
import IntroSerio from './IntroSerio.jsx';
import { usePersonajes } from '../../context/PersonajesContext.jsx';
import TextoLogico from '../comun/TextoLogico.jsx';
import EjecucionPasoAPaso from './EjecucionPasoAPaso.jsx';
import { MAX_INTENTOS, puntosLeccion, estrellasLeccion } from '../../servicios/puntuacion.js';
import NivelVictoria from './NivelVictoria';
import HelperOverlay from '../personajes/HelperOverlay.jsx';
import PantallaTeoria from './PantallaTeoria';
import '../../estilos/nivel.css';
import '../../estilos/nivel-responsivo.css';
import '../../estilos/escena.css';

// Reacciones del Profesor Capyehein: las imagenes salen de la tabla `personaje` (Supabase)
import GuiaImg from '../personajes/GuiaImg.jsx';

const PISTA = {
  alt:   'Descarta primero las opciones que sabes que no encajan con lo que ya vimos.',
  orden: 'Piensa qué paso tiene que ocurrir primero y avanza en orden lógico.',
  flujo: 'Todo diagrama empieza en Inicio, termina en Fin y la decisión va en medio.',
  tabla: 'Revisa la tabla de verdad de la teoría y completa fila por fila, mirando los valores de p y q.',
  escribir: 'Lee con calma el objetivo y piensa qué palabra o expresión falta en cada espacio.',
  diagrama: 'Todo diagrama empieza en Inicio y termina en Fin. Después de un rombo completa sus dos caminos: SÍ y NO.',
};

// Valor con el que empieza cada tipo de ejercicio
const valorInicial = (q) => (q?.tipo === 'alt' ? -1 : q?.tipo === 'tabla' ? tablaVacia(q) : q?.tipo === 'escribir' ? valoresVacios(q) : []);   // diagrama: [] (vacio)

function FlujoSuccessModal({ q, onClose }) {
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (step < q.l.length) {
      const timer = setTimeout(() => setStep(s => s + 1), 700);
      return () => clearTimeout(timer);
    }
  }, [step, q.l.length]);

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 500,
      background: 'rgba(13, 27, 42, 0.95)', backdropFilter: 'blur(5px)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'
    }}>
      <h2 style={{ color: '#4ee86a', fontSize: 24, marginBottom: 20 }}>¡Diagrama Completado!</h2>
      
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0 }}>
        {q.l.map(([txt, forma], i) => (
          <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', transition: 'all 0.5s', opacity: i <= step ? 1 : 0.2, transform: i === step ? 'scale(1.1)' : 'scale(1)' }}>
            {i > 0 && <div style={{ color: '#f5c542', fontSize: 24, margin: '4px 0', textShadow: i <= step ? '0 0 10px #f5c542' : 'none' }}>▼</div>}
            <div className={`chip f-${forma || 'proc'}`} style={{ 
              boxShadow: i === step ? '0 0 20px #4ee86a' : (i < step ? '0 0 5px #6ec4ff' : 'none'),
              borderColor: i <= step ? '#4ee86a' : undefined,
              pointerEvents: 'none'
            }}>
              {txt}
            </div>
          </div>
        ))}
      </div>

      <button onClick={onClose} style={{
        marginTop: 40, background: '#6ec4ff', color: '#0d1b2a', padding: '12px 24px', borderRadius: 8, border: 'none', fontWeight: 'bold', cursor: 'pointer', fontSize: 16
      }}>
        Continuar
      </button>
    </div>
  );
}

// Cada pregunta tiene 4 oportunidades (10 / 7 / 4 / 1 puntos segun el intento en que se acierta; sin acertar, 0).
// onCompletar(intentos) registra la leccion en el servidor (que da los puntos una sola vez); onUsarComodin() pide el comodin al servidor.
// avance = donde se quedo el jugador la ultima vez ({ ejercicio, fallos, intentos, errores, directos }) para retomar ahi;
// onAvance(datos) se llama cada vez que cambia ese avance, y onAvance(null) al terminar la leccion.
export default function Nivel({ leccion, leccionIdx, nivel, nivelIdx, com, usos = null, primeraVez = true, personajeId = null, avance = null, onAvance, onUsarComodin, onCompletar, onFin, onCerrar }) {
  const total = leccion.ejercicios.length;
  const { porId } = usePersonajes();
  const [intro, setIntro] = useState(!!leccion.intro && !avance);   // el personaje guia habla primero (no al retomar una leccion)

  // ── Progreso del nivel ──────────────────────────────────────────────
  const [qi,          setQi]          = useState(avance?.ejercicio ?? 0);
  const [erroresTotal, setErroresTotal] = useState(avance?.errores ?? 0);
  const [directosOK,  setDirectosOK]  = useState(avance?.directos ?? 0); // sin errores en esa pregunta
  const [fallos,      setFallos]      = useState(0); // intentos fallidos de la pregunta actual (maximo 4)
  const [agotada,     setAgotada]     = useState(false);
  const intentosRef = useRef(avance?.intentos ? [...avance.intentos] : []);   // intentos[i] = intento en que se acerto la pregunta i (1 a 4), o 0
  const retomado = useRef(avance);                      // fallos que ya llevaba en el ejercicio donde se quedo (solo al abrir)
  const enviado = useRef(false);
  const [usandoComodin, setUsandoComodin] = useState(false);
  const [guardado, setGuardado] = useState(null);      // resultado que devolvio el servidor al guardar la leccion
  const [errorGuardado, setErrorGuardado] = useState(false);

  // ── Estado del ejercicio actual ─────────────────────────────────────
  const q   = leccion.ejercicios[qi];
  const alt = q?.tipo === 'alt';
  const tabla = q?.tipo === 'tabla';
  const escribir = q?.tipo === 'escribir';
  const diagrama = q?.tipo === 'diagrama';
  const anchoFlujo = (q?.tipo === 'flujo' || diagrama) && !intro;   // mientras habla el guia, la escena usa el ancho normal
  const pizarra = !!q?.codigo && !intro && !diagrama;                // en los diagramas el codigo va junto al lienzo (EjercicioDiagrama)
  const [valor,     setValor]     = useState(valorInicial(q));
  const [buenos,    setBuenos]    = useState(null);   // escribir / diagrama: que espacios o bloques estan bien (true) o mal (false) tras comprobar
  const [ocultas,   setOcultas]   = useState([]);
  const [ok,        setOk]        = useState(false);
  const [msg,       setMsg]       = useState('');
  const [ayuda,     setAyuda]     = useState(false);
  const [resultado, setResultado] = useState(null);  // 'acertado' | 'mal' | null
  const [animo,     setAnimo]     = useState('serio');
  const [tuvoError, setTuvoError] = useState(false); // ¿este ejercicio tuvo al menos 1 error?
  const [viendoTeoria, setViendoTeoria] = useState(false);
  const [showFlujoSuccessModal, setShowFlujoSuccessModal] = useState(false);
  const [verTraza, setVerTraza] = useState(false);
  const [comprobando, setComprobando] = useState(false);     // esperando a que la base diga si la respuesta es correcta          // ejecucion paso a paso del algoritmo (al responder bien)

  // ── Cronómetro ──────────────────────────────────────────────────────
  const startTime = useRef(Date.now());

  // ── Orden aleatorio para tipo "orden"/"flujo" — guarda si q es undefined al terminar
  const orden = useMemo(
    () => (alt || !q?.l ? [] : q.l.map((_, i) => i).sort(() => Math.random() - 0.5)),
    [q, alt]
  );

  // Tecla ESC para salir
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape' && e.target?.tagName !== 'INPUT') onCerrar(); };   // escribiendo en una casilla, Esc no saca de la leccion
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onCerrar]);

  // Reiniciar estado al cambiar de ejercicio
  useEffect(() => {
    if (q) {
      setValor(valorInicial(q));
      setBuenos(null);
      setOcultas([]);
      setOk(false);
      setMsg('');
      setResultado(null);
      setAnimo('serio');
      const r = retomado.current;
      retomado.current = null;
      const previos = r && r.ejercicio === qi ? r.fallos || 0 : 0;
      setTuvoError(previos > 0);
      setFallos(previos);
      setAgotada(false);
    }
  }, [qi, q]);

  // ── Imagen de CapyHein según ánimo ──────────────────────────────────

  // ── Comodín ─────────────────────────────────────────────────────────
  const comodinBloqueado = !!usos && usos.usados >= usos.limite;       // la unidad ya uso todos sus comodines
  const usosRestantes = usos ? Math.max(0, usos.limite - usos.usados) : null;
  const usarComodin = async () => {
    if (usandoComodin || ok) return;
    if (comodinBloqueado) { setMsg(`Ya usaste los ${usos.limite} comodines de esta unidad.`); return; }
    if (com < 1) { setMsg('No te quedan comodines en este momento.'); return; }
    setUsandoComodin(true);
    let r;
    try { r = await onUsarComodin(); } catch { r = { ok: false, razon: 'error' }; }
    setUsandoComodin(false);
    if (!r?.ok) {
      setMsg(r?.razon === 'limite' ? 'Ya usaste los comodines de esta unidad.'
        : r?.razon === 'sin_comodines' ? 'No te quedan comodines en este momento.'
        : 'No se pudo usar el comodín. Inténtalo de nuevo.');
      return;
    }
    if (q.pista) {
      // Este ejercicio trae su propia PISTA: eso es lo que da el comodin (no elimina opciones ni coloca bloques)
    } else if (alt && q.a >= 0) {
      const malas = q.o.map((_, i) => i).filter(i => i !== q.a && !ocultas.includes(i));
      if (malas.length > 1) {
        setOcultas(prev => [...prev, malas[0]]);
        if (valor === malas[0]) setValor(-1);
      }
    } else if (escribir || diagrama) {
      // Sin pista propia no hay nada mas que dar: el comodin solo muestra la ayuda general
    } else if (tabla) {
      // Comodin en la tabla: completa bien la primera celda vacia o equivocada
      const m = primeraCeldaMala(q, valor);
      if (m) setValor(valor.map((col, c) => col.map((x, r) => (c === m[0] && r === m[1] ? q.salidas[c].v[r] : x))));
      setResultado(null);
    } else {
      let k = 0;
      while (valor[k] === k) k++;
      if (k < q.l.length) setValor([...valor.slice(0, k), k]);
    }
    setAnimo('confundido');
    setAyuda(true);
  };

  // ── Comprobar respuesta ──────────────────────────────────────────────
  // Alternativas leidas de la base (traen id): la respuesta la valida la BASE, que tambien cuenta los intentos.
  const enServidor = alt && !!q?.id && Array.isArray(q?.altIds);
  const comprobar = async () => {
    if (comprobando) return;
    const vacio = alt ? valor < 0 : tabla ? !tablaCompleta(valor) : escribir ? !completo(valor) : !valor.length;
    if (vacio) { setMsg(escribir ? 'Completa todos los espacios antes de comprobar.' : diagrama ? 'Arma el diagrama antes de comprobar.' : 'Por favor selecciona una opción antes de comprobar.'); return; }

    let srv = null;
    if (enServidor) {
      setComprobando(true);
      try { srv = await verificarAlternativa(q.id, q.altIds[valor]); }
      catch (e) { setComprobando(false); setMsg(e.message); return; }
      setComprobando(false);
    }
    const correctaAlt = srv ? (srv.correcta ? q.altIds.indexOf(srv.correcta) : -1) : q.a;

    const ev = escribir ? evaluar(q, valor) : diagrama ? evaluarDiagrama(q, valor) : null;
    const bien = srv
      ? srv.correcto && !srv.agotado
      : alt
      ? valor === q.a
      : tabla
        ? tablaCorrecta(q, valor)
        : escribir || diagrama
          ? ev.correcto
          : valor.length === q.l.length && valor.every((v, i) => v === i);
    if (escribir || diagrama) setBuenos(ev.buenos);

    if (bien) {
      intentosRef.current[qi] = srv?.intento ?? Math.min(fallos + 1, MAX_INTENTOS);   // acerto en el intento (fallos + 1); en escribir no hay tope de intentos y a partir del 4.º vale 1 punto
      setOk(true);
      setResultado('acertado');
      setAnimo(Math.random() > 0.5 ? 'acertaste' : 'riendose');
      setMsg('¡Excelente! Has dado en el clavo.');
      if (!tuvoError) setDirectosOK(d => d + 1);

      if (q.traza) {
        setVerTraza(true);                                  // animacion: como se ejecuta paso a paso
      } else if (q.tipo === 'flujo') {
        setShowFlujoSuccessModal(true);
      }
    } else {
      const nuevos = srv ? (srv.agotado ? MAX_INTENTOS : Math.max(srv.fallos ?? 0, fallos + 1)) : fallos + 1;   // con la base, cuentan sus intentos
      setFallos(nuevos);
      setErroresTotal(e => e + 1);
      setTuvoError(true);
      setResultado('mal');
      setAnimo(Math.random() > 0.5 ? 'mal' : 'confundido');
      if (escribir) {
        // Aqui no se regala la respuesta: hay que dejar TODO correcto para pasar al siguiente ejercicio
        const bienes = ev.buenos.filter(Boolean).length;
        const aviso = ev.porMayusculas.some(Boolean) ? ' Ojo: el nombre debe ser exacto, revisa las mayúsculas y minúsculas.' : '';
        setMsg(`Revisa los espacios marcados en rojo (${bienes} de ${ev.buenos.length} bien). Intento ${nuevos}: sigue intentando.${aviso}`);
      } else if (diagrama) {
        // Igual que escribir: no se regala la solucion; solo se pasa con el diagrama bien armado
        const marcas = Object.values(ev.buenos || {});        // { ruta: true|false } por bloque
        const bienes = marcas.filter(Boolean).length;
        setMsg(`Revisa los bloques marcados en rojo y que no falte ninguno (${bienes} de ${marcas.length} bien). Intento ${nuevos}: sigue intentando.`);
      } else if (nuevos >= MAX_INTENTOS) {
        // Cuarta oportunidad fallida: se muestra la respuesta correcta y la pregunta no suma puntos
        intentosRef.current[qi] = 0;
        setValor(alt ? (correctaAlt >= 0 ? correctaAlt : valor) : tabla ? q.salidas.map((c) => [...c.v]) : diagrama ? solucionDe(q) : q.l.map((_, i) => i));
        if (diagrama) setBuenos(null);
        setOk(true);
        setResultado('acertado');
        setAgotada(true);
        setMsg(alt && correctaAlt < 0
          ? 'Se acabaron las 4 oportunidades. Esta pregunta no suma puntos.'      // invitado: la base no le revela la correcta
          : 'Se acabaron las 4 oportunidades. Te mostramos la respuesta correcta; esta pregunta no suma puntos.');
      } else {
        const quedan = MAX_INTENTOS - nuevos;
        setMsg(`Mmm, esa no es la correcta. Te ${quedan === 1 ? 'queda 1 oportunidad' : `quedan ${quedan} oportunidades`}.`);
      }
    }
  };

  // ── Siguiente pregunta ───────────────────────────────────────────────
  const siguiente = () => {
    setQi(prev => prev + 1);
  };

  // ── Fin: mostrar pantalla de victoria ───────────────────────────────
  const fin = qi >= total;
  const est = erroresTotal === 0 ? 3 : erroresTotal <= 2 ? 2 : 1;      // igual que estrellasLeccion(intentos) y que la base de datos
  const tiempoMs = Date.now() - startTime.current;
  const precision = total > 0 ? Math.round((directosOK / total) * 100) : 0;
  const intentos = Array.from({ length: total }, (_, i) => intentosRef.current[i] ?? 0);
  const puntosLocal = fin ? puntosLeccion(intentos) : 0;
  // Lo que cuenta es lo que otorgo el servidor (solo la primera vez que se completa la leccion); mientras responde, la estimacion local
  const xpGanada  = guardado ? guardado.puntos_otorgados : (primeraVez ? puntosLocal : 0);
  const repetida  = guardado ? !guardado.leccion_nueva : !primeraVez;

  // Guarda donde va el jugador (para retomar si sale de la leccion). Un ejercicio ya respondido cuenta como hecho.
  useEffect(() => {
    if (!onAvance) return;
    if (fin) { onAvance(null); return; }
    const sig = ok ? qi + 1 : qi;
    const f = ok ? 0 : Math.min(fallos, 50);              // la base acepta hasta 50 (escribir y diagramas no tienen tope)
    if (sig === 0 && f === 0) return;                   // todavia no hizo nada
    onAvance({ ejercicio: sig, fallos: f, intentos: Array.from({ length: sig }, (_, i) => intentosRef.current[i] ?? 0), errores: erroresTotal, directos: directosOK });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [qi, fallos, ok, erroresTotal, directosOK, fin]);

  // Al terminar la ultima pregunta la leccion se registra UNA vez en el servidor
  useEffect(() => {
    if (!fin || enviado.current) return;
    enviado.current = true;
    Promise.resolve(onCompletar ? onCompletar(intentos) : null).then(setGuardado).catch(() => setErrorGuardado(true));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fin]);

  if (fin) {
    // nivel completado
    return (
      <NivelVictoria
        leccion={leccion}
        leccionIdx={leccionIdx}
        nivel={nivel}
        nivelIdx={nivelIdx}
        estrellas={est}
        tiempoMs={tiempoMs}
        precision={precision}
        errores={erroresTotal}
        xpGanada={xpGanada}
        repetida={repetida}
        guardando={!!onCompletar && !guardado && !errorGuardado}
        errorGuardado={errorGuardado}
        onVolver={() => onFin(guardado)}
      />
    );
  }

  // ── Barra de progreso ────────────────────────────────────────────────
  const progresoPct = Math.round((qi / total) * 100);

  return (
    <div className="nivel-screen">
      {/* Tokens de fondo */}
      <span className="bg-code-token bg-token-1">0101</span>
      <span className="bg-code-token bg-token-2">&#123; &#125;</span>
      <span className="bg-code-token bg-token-3">&#123; &#125;</span>
      <span className="bg-code-token bg-token-4">&lt;/&gt;</span>
      <span className="bg-code-token bg-token-5">⚙</span>

      <style>{`
        @keyframes pulse-teoria {
          0% { box-shadow: 0 0 0 0 rgba(245, 197, 66, 0.7); border-color: #f5c542; }
          70% { box-shadow: 0 0 0 10px rgba(245, 197, 66, 0); border-color: #ffd84e; }
          100% { box-shadow: 0 0 0 0 rgba(245, 197, 66, 0); border-color: #f5c542; }
        }
        .btn-teoria-blink {
          animation: pulse-teoria 1.5s infinite;
          border: 2px solid #f5c542 !important;
          color: #ffd84e !important;
        }
        .capy-bubble.flujo-mode::before {
          display: none !important;
        }
      `}</style>

      <div className="nivel-container" style={{ maxWidth: anchoFlujo ? '1600px' : '1320px', width: '100%' }}>
        {/* ── BARRA SUPERIOR ── */}
        <header className="nivel-topbar">
          <button className="nivel-back-btn" onClick={onCerrar} aria-label="Volver al mapa">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="12" x2="5" y2="12"/>
              <polyline points="12 19 5 12 12 5"/>
            </svg>
          </button>

          <div className="nivel-progress-box">
            <div className="nivel-title-text">
              NIVEL {nivelIdx + 1} · LECCIÓN {leccionIdx + 1}
            </div>
            <div className="nivel-track">
              <div className="nivel-fill" style={{ width: `${progresoPct}%` }} />
            </div>
          </div>

          {leccion.teoria?.length > 0 && !leccion.sinBotonTeoria ? (
          <button
            className={`nivel-btn-teoria ${tuvoError ? 'btn-teoria-blink' : ''}`}
            aria-label="Ver la teoría"
            onClick={() => setViendoTeoria(true)}
          >
            📖 TEORÍA
          </button>
          ) : null}
        </header>

        {/* ── CONTENIDO PRINCIPAL (FLEX DEPENDIENDO DE TIPO) ── */}
        <div className={`nivel-main ${anchoFlujo ? 'es-flujo' : ''}`}>
          {/* ── ESCENA: personaje de medio cuerpo, fondo y cuadro de diálogo con la pregunta ── */}
          <div className={`escena ${pizarra ? 'con-codigo' : ''} ${escribir && !intro ? 'compacta' : ''}`} style={pizarra ? { '--lineas': q.codigo.split('\n').length } : undefined}>
            <div className="escena-fondo" aria-hidden="true">
              <span className="escena-lampara l1" /><span className="escena-lampara l2" />
            </div>
            <div className="escena-personaje">
              <GuiaImg animo={animo} className="escena-capy" />
            </div>
            {/* Pseudocódigo del ejercicio: una "pizarra" a la derecha del personaje (en pantallas angostas queda debajo de él) */}
            {pizarra && <pre className="q-codigo escena-pizarra" aria-label="Pseudocódigo del ejercicio"><code>{q.codigo}</code></pre>}
            <div className="escena-dialogo">
              <h3 className="escena-pregunta">{intro ? (leccion.introTexto || saludoGuia(porId(personajeId)?.nombre)) : <TextoLogico texto={q.p} />}</h3>
              {!intro && msg && (
                <div className={`escena-feedback ${ok ? 'ok' : 'error'}`} role="status">
                  {msg}
                </div>
              )}
              {!intro && ok && q.traza && !agotada && (
                <button type="button" className="escena-ver-traza" onClick={() => setVerTraza(true)}>▶ Ver cómo funciona paso a paso</button>
              )}
            </div>
          </div>

        {/* ── ZONA DE RESPUESTAS ── */}
        {!intro && <div className="nivel-exercise-area">
          {alt ? (
            <Alternativas
              q={q}
              valor={typeof valor === 'number' ? valor : -1}
              setValor={(v) => {
                setValor(v);
                setResultado(null);
                setMsg('');
                if (animo !== 'serio') setAnimo('serio');
              }}
              ocultas={ocultas}
              bloq={ok}
              resultado={resultado}
            />
          ) : tabla ? (
            <TablaVerdad
              q={q}
              valor={valor}
              setValor={(v) => {
                setValor(v);
                setResultado(null);
                setMsg('');
                if (animo !== 'serio') setAnimo('serio');
              }}
              bloq={ok}
              resultado={resultado}
            />
          ) : escribir ? (
            <EjercicioEscribir
              q={q}
              valores={valor}
              buenos={buenos}
              setValor={(n, texto) => {
                setValor((v) => v.map((x, i) => (i === n ? texto : x)));
                setBuenos((b) => (b ? b.map((x, i) => (i === n ? null : x)) : b));
                setResultado(null);
                setMsg('');
                if (animo !== 'serio') setAnimo('serio');
              }}
              bloq={ok}
              onEnviar={comprobar}
            />
          ) : diagrama ? (
            <EjercicioDiagrama
              q={q}
              valor={Array.isArray(valor) ? valor : []}
              buenos={buenos}
              setValor={(v) => {
                setValor(v);
                setBuenos(null);
                setResultado(null);
                setMsg('');
                if (animo !== 'serio') setAnimo('serio');
              }}
              bloq={ok}
            />
          ) : (
            <Ordenar q={q} valor={Array.isArray(valor) ? valor : []} setValor={setValor} orden={orden} bloq={ok} />
          )}
        </div>}
      </div>

      {/* Presentacion (niveles 4 y 5): fondo oscuro y el guia en primer plano hablandole al jugador, en 2 partes */}
      {intro && (
        <IntroSerio
          textos={[fraseSeria(porId(personajeId)?.nombre), leccion.introTexto || saludoGuia(porId(personajeId)?.nombre)]}
          onFin={() => setIntro(false)}
        />
      )}

      {/* ── BARRA INFERIOR ── */}
        <footer className="nivel-bottom-bar">
          {intro ? (
            <>
              <span />
              <button className="btn-primary-action" onClick={() => setIntro(false)}>COMENZAR →</button>
            </>
          ) : (<>
          <button
            className="btn-comodin-action"
            onClick={usarComodin}
            disabled={com < 1 || ok || comodinBloqueado || usandoComodin}
            title={comodinBloqueado ? 'Ya usaste todos los comodines de esta unidad' : 'Gastar 1 comodín para obtener ayuda'}
            aria-label={usos ? `Comodín: te quedan ${usosRestantes} usos en esta unidad` : 'Comodín'}
          >
            <span>🎁</span>
            <span>COMODÍN</span>
            {usos && <span style={{ fontSize: '0.78em', opacity: 0.9 }}>{usosRestantes}/{usos.limite}</span>}
          </button>

          {ok ? (
            <button className="btn-primary-action" onClick={siguiente}>
              {qi + 1 >= total ? 'TERMINAR' : 'CONTINUAR'} →
            </button>
          ) : (
            <button
              className="btn-primary-action check-btn"
              onClick={comprobar}
              disabled={comprobando || (alt ? valor < 0 : tabla ? !tablaCompleta(valor) : escribir ? !completo(valor) : !valor.length)}
            >
              {comprobando ? 'COMPROBANDO…' : 'COMPROBAR'}
            </button>
          )}
          </>)}
        </footer>
      </div>

      {/* Overlay de ayuda */}
      {ayuda && (
        <HelperOverlay pista={q?.pista || PISTA[q?.tipo]} close={() => setAyuda(false)} />
      )}

      {viendoTeoria && (
        <PantallaTeoria
          isModal={true}
          leccion={leccion}
          onVolver={() => setViendoTeoria(false)}
          onComenzar={() => setViendoTeoria(false)}
        />
      )}

      {verTraza && q?.traza && <EjecucionPasoAPaso traza={q.traza} onCerrar={() => setVerTraza(false)} onContinuar={() => { setVerTraza(false); siguiente(); }} />}
      {showFlujoSuccessModal && (
        <FlujoSuccessModal q={q} onClose={() => setShowFlujoSuccessModal(false)} />
      )}
    </div>
  );
}
