import React, { useEffect, useMemo, useRef, useState } from 'react';
import EjercicioDiagrama from './EjercicioDiagrama.jsx';
import IntroSerio from './IntroSerio.jsx';
import GuiaImg from '../personajes/GuiaImg.jsx';
import { evaluarDiagrama } from '../../servicios/diagrama.js';
import { ejecutar, validar } from '../../servicios/pseint.js';
import { muchachoDe } from '../../servicios/escribir.js';
import { pedirRecomendaciones } from '../../supabase/recomendaciones.js';
import { usePersonajes } from '../../context/PersonajesContext.jsx';
import { MINUTOS_EXAMEN, PUNTOS_POR_EJERCICIO, PUNTOS_PARA_APROBAR, notaExamen } from '../../datos/nivel6.js';
import '../../estilos/examen.css';

// EXAMEN FINAL (nivel 6, el último del mundo; datos/nivel6.js).
//  1) El guía (CapyheinSerio) presenta el examen.
//  2) Contrarreloj de 40 minutos. Un solo intento por ejercicio: bien = 2 puntos, mal = 0. Sin pistas ni soluciones.
//     · diagrama: arma el diagrama del pseudocódigo (EjercicioDiagrama) y ENTREGA.
//     · programa: escribe su pseudocódigo, puede EJECUTARLO con sus propios datos las veces que quiera y luego lo ENTREGA:
//       el intérprete (servicios/pseint.js) lo prueba con varios datos (algunos ocultos); vale cualquier procedimiento con el resultado correcto.
//  3) Al terminar (o si se acaba el tiempo, o si sale) se califica: C / B / A / AD. Con 12 puntos o más se completa el nivel
//     (onCompletar registra la lección en el servidor: 1 = ejercicio bien, 0 = mal).
const PLANTILLA = 'INICIO\n    \nFIN';
const ATAJOS = ['←', 'LEER ', 'ESCRIBIR ', 'DEFINIR ', ' COMO ', 'SI ', ' ENTONCES', 'SINO', 'FIN SI', '"'];
const mmss = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

function EditorCodigo({ valor, setValor, bloq }) {
  const ref = useRef(null);
  const insertar = (txt) => {
    const t = ref.current; if (!t || bloq) return;
    const a = t.selectionStart, b = t.selectionEnd;
    const nuevo = valor.slice(0, a) + txt + valor.slice(b);
    setValor(nuevo);
    requestAnimationFrame(() => { t.focus(); t.selectionStart = t.selectionEnd = a + txt.length; });
  };
  const tecla = (e) => {
    if (e.key === 'Tab') { e.preventDefault(); insertar('    '); }
  };
  const lineas = valor.split('\n').length;
  return (
    <div className="ex-editor">
      <div className="ex-atajos" aria-label="Insertar palabras">
        {ATAJOS.map((a) => <button key={a} type="button" disabled={bloq} onClick={() => insertar(a)}>{a.trim() || a}</button>)}
      </div>
      <div className="ex-codigo">
        <pre className="ex-lineas" aria-hidden="true">{Array.from({ length: lineas }, (_, k) => k + 1).join('\n')}</pre>
        <textarea ref={ref} value={valor} onChange={(e) => setValor(e.target.value)} onKeyDown={tecla} readOnly={bloq}
          spellCheck={false} autoCapitalize="off" autoCorrect="off" autoComplete="off" aria-label="Tu pseudocódigo" rows={Math.max(10, lineas + 1)} />
      </div>
    </div>
  );
}

// RECOMENDACIONES DEL GUÍA (Gemini) en la pantalla de la nota: una por cada ejercicio de código que entregó.
// Se piden de a una (la versión gratis de Gemini admite pocas consultas por minuto) y cada una aparece apenas llega.
function RecomendacionesFinales({ entregas: lista }) {
  const [entregas] = useState(lista);                        // fija: la lista no cambia mientras se muestra
  const [estado, setEstado] = useState({});                  // { [numero]: { cargando } | { resumen, consejos } | { error } }
  const vivo = useRef(true);

  const pedir = async (e) => {
    setEstado((s) => ({ ...s, [e.numero]: { cargando: true } }));
    let r;
    try {
      const x = await pedirRecomendaciones({ enunciado: e.enunciado, codigo: e.codigo, correcto: e.correcto, mensaje: e.mensaje });
      r = x.consejos.length || x.resumen ? x : { error: 'El guía no encontró nada que recomendar esta vez.' };
    } catch (err) { r = { error: err.message }; }
    if (vivo.current) setEstado((s) => ({ ...s, [e.numero]: r }));
  };

  useEffect(() => {
    vivo.current = true;
    (async () => { for (const e of entregas) { if (!vivo.current) return; await pedir(e); } })();
    return () => { vivo.current = false; };
  }, []);   // eslint-disable-line react-hooks/exhaustive-deps

  if (!entregas.length) return null;
  return (
    <section className="ex-reco-final" aria-labelledby="ex-reco-t">
      <h2 id="ex-reco-t" className="ex-reco-t">💡 RECOMENDACIONES DEL GUÍA</h2>
      <p className="ex-reco-nota">Consejos para mejorar tu código. No cambian tus puntos.</p>
      {entregas.map((e) => {
        const r = estado[e.numero];
        return (
          <article key={e.numero} className="ex-reco-caja" aria-live="polite">
            <span className="ex-reco-ej">{e.titulo} <b className={e.correcto ? 'bien' : 'mal'}>{e.correcto ? '✔' : '✘'}</b></span>
            {(!r || r.cargando) && <p className="ex-reco-cargando">{r ? 'El guía está revisando tu código... (puede tardar hasta medio minuto)' : 'En espera...'}</p>}
            {r?.error && (
              <div className="ex-reco-error">
                <p>{r.error}</p>
                <button type="button" className="ex-btn ex-secundario" onClick={() => pedir(e)}>REINTENTAR</button>
              </div>
            )}
            {r?.consejos && (
              <>
                {r.resumen && <p className="ex-reco-resumen">{r.resumen}</p>}
                <ul>{r.consejos.map((c, k) => <li key={k}>{c}</li>)}</ul>
              </>
            )}
          </article>
        );
      })}
    </section>
  );
}

export default function ExamenFinal({ leccion, personajeId, onCompletar, onFin }) {
  const ejercicios = leccion.ejercicios;
  const total = ejercicios.length;
  const { porId } = usePersonajes();
  const muchacho = muchachoDe(porId(personajeId)?.nombre);

  const [fase, setFase] = useState('intro');                 // intro | examen | fin
  const [i, setI] = useState(0);
  const [resultados, setResultados] = useState(() => Array(total).fill(null));
  const [diagrama, setDiagrama] = useState([]);
  const [codigo, setCodigo] = useState(PLANTILLA);
  const [datosPrueba, setDatosPrueba] = useState('');
  const [consola, setConsola] = useState(null);             // { salida, error } de EJECUTAR
  const [entregado, setEntregado] = useState(null);         // { bien, mensaje } del ejercicio actual
  const [aviso, setAviso] = useState('');
  const [confirmar, setConfirmar] = useState(null);         // 'entregar' | 'saltar' | 'salir'
  const [finAt, setFinAt] = useState(0);
  const [ahora, setAhora] = useState(Date.now());
  const [cierre, setCierre] = useState(null);               // { motivo, puntos, nota, segundos }
  const [guardado, setGuardado] = useState(null);
  const [errorGuardado, setErrorGuardado] = useState(false);
  const terminado = useRef(false);
  const entregas = useRef({});   // ejercicios de código entregados: { [i]: { numero, titulo, enunciado, codigo, correcto, mensaje } }

  const q = ejercicios[i];
  const restante = fase === 'examen' ? Math.max(0, Math.ceil((finAt - ahora) / 1000)) : MINUTOS_EXAMEN * 60;
  const puntos = resultados.filter(Boolean).length * PUNTOS_POR_EJERCICIO;

  // Reloj
  useEffect(() => {
    if (fase !== 'examen') return undefined;
    const t = setInterval(() => setAhora(Date.now()), 500);
    return () => clearInterval(t);
  }, [fase]);
  useEffect(() => { if (fase === 'examen' && restante <= 0) terminar('tiempo'); });   // eslint-disable-line react-hooks/exhaustive-deps

  // Avisa antes de cerrar la pestaña en pleno examen
  useEffect(() => {
    if (fase !== 'examen') return undefined;
    const f = (e) => { e.preventDefault(); e.returnValue = ''; };
    window.addEventListener('beforeunload', f);
    return () => window.removeEventListener('beforeunload', f);
  }, [fase]);

  const empezar = () => { setFinAt(Date.now() + MINUTOS_EXAMEN * 60 * 1000); setAhora(Date.now()); setFase('examen'); };

  function terminar(motivo, res = resultados) {
    if (terminado.current) return;
    terminado.current = true;
    const pts = res.filter(Boolean).length * PUNTOS_POR_EJERCICIO;
    const usados = Math.min(MINUTOS_EXAMEN * 60, Math.round((Date.now() - (finAt - MINUTOS_EXAMEN * 60 * 1000)) / 1000));
    setCierre({ motivo, puntos: pts, ...notaExamen(pts), segundos: usados, res });
    setConfirmar(null);
    setFase('fin');
    if (pts >= PUNTOS_PARA_APROBAR && onCompletar) {
      Promise.resolve(onCompletar(res.map((r) => (r ? 1 : 0)))).then(setGuardado).catch(() => setErrorGuardado(true));
    }
  }

  const reiniciarEjercicio = () => {
    setDiagrama([]); setCodigo(PLANTILLA); setDatosPrueba(''); setConsola(null); setEntregado(null); setAviso(''); setConfirmar(null);
  };

  const vacio = q?.tipo === 'diagrama' ? diagrama.length === 0 : codigo.replace(/\b(INICIO|FIN)\b/gi, '').trim() === '';

  const pedirEntrega = () => {
    if (vacio) { setAviso(q.tipo === 'diagrama' ? 'Arma el diagrama antes de entregar.' : 'Escribe tu programa antes de entregar.'); return; }
    setAviso(''); setConfirmar('entregar');
  };

  const entregar = (bien, mensaje) => {
    const res = resultados.map((r, k) => (k === i ? bien : r));
    setResultados(res);
    setEntregado({ bien, mensaje });
    setConfirmar(null);
    return res;
  };

  const confirmarEntrega = () => {
    if (q.tipo === 'diagrama') {
      const { correcto } = evaluarDiagrama(q, diagrama);
      entregar(correcto, correcto ? '¡Correcto! El diagrama respeta la lógica del pseudocódigo.' : 'Incorrecto: el diagrama no corresponde al pseudocódigo.');
    } else {
      const r = validar(codigo, q.validacion);
      // se guarda para las recomendaciones de Gemini, que se piden al final (pantalla de la nota)
      entregas.current[i] = { numero: i + 1, titulo: q.p, enunciado: `${q.p}\n${q.problema || ''}`, codigo, correcto: r.correcto, mensaje: r.mensaje };
      entregar(r.correcto, r.mensaje);
    }
  };

  const saltar = () => { entregar(false, 'Ejercicio saltado: 0 puntos.'); };

  const siguiente = () => {
    if (i >= total - 1) { terminar('completo'); return; }
    setI(i + 1); reiniciarEjercicio();
    document.querySelector('.ex-cuerpo')?.scrollTo?.({ top: 0 });
  };

  const probar = () => {
    const entradas = datosPrueba.split(/[,\n;]+/).map((x) => x.trim()).filter((x) => x !== '');
    const r = ejecutar(codigo, entradas);
    setConsola(r);
  };

  const guiaTexto = useMemo(() => [
    `Esta es tu recta final, ${muchacho}.`,
    `Si logras pasar esto, ya no tendré más que enseñarte por el momento. Tienes ${MINUTOS_EXAMEN} minutos para terminar todo. ¡Mucha suerte!`,
  ], [muchacho]);

  // ── 1) Presentación del guía ──
  if (fase === 'intro') {
    return (
      <div className="ex-pantalla">
        <IntroSerio textos={guiaTexto} onFin={empezar} />
      </div>
    );
  }

  // ── 3) Calificación ──
  if (fase === 'fin' && cierre) {
    const aprobado = cierre.puntos >= PUNTOS_PARA_APROBAR;
    const bien = cierre.res.filter(Boolean).length;
    return (
      <div className="ex-pantalla ex-final">
        <div className="ex-tarjeta" role="dialog" aria-modal="true" aria-labelledby="ex-nota-titulo">
          {cierre.motivo === 'tiempo' && <p className="ex-tiempo-fuera">⏰ ¡SE ACABÓ EL TIEMPO!</p>}
          {cierre.motivo === 'salir' && <p className="ex-tiempo-fuera">Saliste del examen: se calificó lo que llevabas.</p>}
          <h1 id="ex-nota-titulo" className="ex-titulo-final">RESULTADO DEL EXAMEN</h1>
          <div className={`ex-nota nota-${cierre.nota.toLowerCase()}`} aria-label={`Nota ${cierre.nota}`}>
            <span className="ex-nota-letra">{cierre.nota}</span>
            <span className="ex-nota-texto">{cierre.texto}</span>
          </div>
          <p className="ex-puntos"><b>{cierre.puntos}</b> / {total * PUNTOS_POR_EJERCICIO} puntos · {bien} de {total} ejercicios bien · tiempo {mmss(cierre.segundos)}</p>
          <ol className="ex-lista-res" aria-label="Resultado por ejercicio">
            {cierre.res.map((r, k) => (
              <li key={k} className={r ? 'bien' : 'mal'} title={`Ejercicio ${k + 1}: ${r ? 'bien' : 'mal'}`}>{k + 1}<span aria-hidden="true">{r ? '✔' : '✘'}</span></li>
            ))}
          </ol>
          <div className="ex-guia-final">
            <span className="ex-guia-img"><GuiaImg animo={aprobado ? 'acertaste' : 'mal'} /></span>
            <p>
              {aprobado
                ? `¡Lo lograste, ${muchacho}! Ya no tengo más que enseñarte por el momento. Nivel completado.`
                : `Todavía no, ${muchacho}. Necesitas al menos ${PUNTOS_PARA_APROBAR} puntos para completar el nivel. Repasa y vuelve a intentarlo.`}
            </p>
          </div>
          <RecomendacionesFinales entregas={Object.values(entregas.current).sort((a, b) => a.numero - b.numero)} />
          {aprobado && !guardado && !errorGuardado && <p className="ex-guardando">Guardando tu resultado...</p>}
          {errorGuardado && <p className="ex-error">No se pudo guardar tu resultado. Revisa tu conexión y vuelve a dar el examen.</p>}
          <button type="button" className="ex-btn ex-principal" onClick={() => onFin(guardado)} disabled={aprobado && !guardado && !errorGuardado}>
            VOLVER AL MAPA
          </button>
        </div>
      </div>
    );
  }

  // ── 2) Examen ──
  const poco = restante <= 5 * 60;
  return (
    <div className="ex-pantalla">
      <header className="ex-barra">
        <div className="ex-barra-izq">
          <span className="ex-etq">EXAMEN FINAL</span>
          <span className="ex-num">Ejercicio {i + 1} de {total}</span>
        </div>
        <div className={`ex-reloj ${poco ? 'poco' : ''}`} role="timer" aria-label={`Tiempo restante ${mmss(restante)}`}>⏱ {mmss(restante)}</div>
        <div className="ex-barra-der">
          <span className="ex-pts">{puntos} pts</span>
          <button type="button" className="ex-btn ex-salir" onClick={() => setConfirmar('salir')}>SALIR</button>
        </div>
      </header>
      <div className="ex-progreso" aria-hidden="true">
        {resultados.map((r, k) => <i key={k} className={k === i ? 'actual' : r === true ? 'bien' : r === false ? 'mal' : ''} />)}
      </div>

      <main className="ex-cuerpo">
        <section className="ex-enunciado">
          <div className="ex-tags">
            <span className={`ex-dif dif-${(q.dificultad || '').toLowerCase()}`}>{q.dificultad}</span>
            <span className="ex-valor">{PUNTOS_POR_EJERCICIO} puntos</span>
            <span className="ex-tipo">{q.tipo === 'diagrama' ? 'Del código al diagrama' : 'Escribe el pseudocódigo'}</span>
          </div>
          <h2>{q.p}</h2>
          {q.problema && <p className="ex-problema">{q.problema}</p>}
          {q.resultado && <p className="ex-esperado"><b>Resultado esperado:</b> {q.resultado}</p>}
          {q.tipo === 'programa' && (
            <p className="ex-nota-ayuda">Puedes resolverlo a tu manera: se acepta cualquier procedimiento si el resultado es el correcto. Se probará con varios datos, algunos ocultos.</p>
          )}
        </section>

        {q.tipo === 'diagrama' ? (
          <EjercicioDiagrama q={q} valor={diagrama} setValor={(v) => { setDiagrama(v); setAviso(''); }} buenos={null} bloq={!!entregado} />
        ) : (
          <section className="ex-programa">
            <EditorCodigo valor={codigo} setValor={(v) => { setCodigo(v); setAviso(''); }} bloq={!!entregado} />
            {!entregado && (
              <div className="ex-probar">
                <label htmlFor="ex-datos">Datos para probar (separados por comas)</label>
                <div className="ex-probar-fila">
                  <input id="ex-datos" value={datosPrueba} onChange={(e) => setDatosPrueba(e.target.value)} placeholder="ej. 8   o   18, 16, 20"
                    autoCapitalize="off" autoCorrect="off" spellCheck={false} />
                  <button type="button" className="ex-btn" onClick={probar}>▶ EJECUTAR</button>
                </div>
              </div>
            )}
            {consola && !entregado && (
              <div className={`ex-consola ${consola.error ? 'con-error' : ''}`} role="status">
                <span className="ex-consola-t">SALIDA</span>
                {consola.salida && <pre>{consola.salida}</pre>}
                {consola.error && (
                  <p>{consola.error.faltaDato
                    ? 'Tu programa pide más datos (LEER) de los que escribiste en "Datos para probar".'
                    : `${consola.error.linea ? `Línea ${consola.error.linea}: ` : ''}${consola.error.mensaje}`}</p>
                )}
                {!consola.salida && !consola.error && <p>(El programa no mostró nada.)</p>}
              </div>
            )}
          </section>
        )}

        {aviso && <p className="ex-aviso" role="alert">{aviso}</p>}
        {entregado && (
          <div className={`ex-veredicto ${entregado.bien ? 'bien' : 'mal'}`} role="status">
            <b>{entregado.bien ? `✔ +${PUNTOS_POR_EJERCICIO} puntos` : '✘ 0 puntos'}</b>
            <span>{entregado.mensaje}</span>
          </div>
        )}
      </main>

      <footer className="ex-pie">
        {entregado ? (
          <button type="button" className="ex-btn ex-principal" onClick={siguiente}>{i >= total - 1 ? 'TERMINAR EXAMEN' : 'SIGUIENTE ▶'}</button>
        ) : (
          <>
            <button type="button" className="ex-btn ex-secundario" onClick={() => setConfirmar('saltar')}>SALTAR</button>
            <button type="button" className="ex-btn ex-principal" onClick={pedirEntrega}>ENTREGAR</button>
          </>
        )}
      </footer>

      {confirmar && (
        <div className="ex-modal-fondo" role="presentation" onClick={() => setConfirmar(null)}>
          <div className="ex-modal" role="alertdialog" aria-modal="true" aria-labelledby="ex-modal-t" onClick={(e) => e.stopPropagation()}>
            <p id="ex-modal-t">
              {confirmar === 'entregar' && '¿Entregar este ejercicio? Solo tienes un intento: después no podrás cambiarlo.'}
              {confirmar === 'saltar' && '¿Saltar este ejercicio? Valdrá 0 puntos y no podrás volver a él.'}
              {confirmar === 'salir' && `Si sales ahora, el examen termina y se califica con lo que llevas (${puntos} puntos).`}
            </p>
            <div className="ex-modal-btns">
              <button type="button" className="ex-btn ex-secundario" onClick={() => setConfirmar(null)} autoFocus>
                {confirmar === 'salir' ? 'SEGUIR EN EL EXAMEN' : 'CANCELAR'}
              </button>
              <button type="button" className="ex-btn ex-principal"
                onClick={() => (confirmar === 'entregar' ? confirmarEntrega() : confirmar === 'saltar' ? saltar() : terminar('salir'))}>
                {confirmar === 'entregar' ? 'SÍ, ENTREGAR' : confirmar === 'saltar' ? 'SÍ, SALTAR' : 'SALIR Y CALIFICAR'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
