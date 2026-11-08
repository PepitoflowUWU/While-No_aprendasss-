import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useAnimaciones } from '../../audio/preferencias.js';
import '../../estilos/ejecucion.css';

// Muestra COMO FUNCIONA un algoritmo ya resuelto: se resalta cada instruccion (o bloque del diagrama) en orden, con su
// explicacion, la memoria (variables) y lo que aparece en pantalla. Se abre solo al responder bien un ejercicio de
// pseudocodigo o de diagrama de flujo. Con "Animaciones y efectos" apagado no avanza solo: se pasa paso a paso con el boton.
//   traza = { titulo, entrada, modo: 'codigo' | 'diagrama', lineas: [...], pasos: [{ l, texto, vars?, salida? }] }
const MS_POR_PASO = 1700;

// Memoria y pantalla acumuladas hasta el paso `hasta` (inclusive)
export function estadoEnPaso(pasos, hasta) {
  const vars = {}; const salida = [];
  for (let i = 0; i <= hasta && i < pasos.length; i++) {
    if (pasos[i].vars) Object.assign(vars, pasos[i].vars);
    if (pasos[i].salida !== undefined) salida.push(String(pasos[i].salida));
  }
  return { vars, salida };
}

// onCerrar: solo cierra la ventana. onContinuar (opcional): cierra y pasa directamente a la siguiente pregunta.
export default function EjecucionPasoAPaso({ traza, onCerrar, onContinuar }) {
  const animaciones = useAnimaciones();
  const total = traza.pasos.length;
  const [paso, setPaso] = useState(-1);                 // -1 = todavia no empezo
  const [jugando, setJugando] = useState(animaciones);
  const continuarRef = useRef(null);

  // Avance automatico
  useEffect(() => {
    if (!jugando) return undefined;
    if (paso >= total - 1) { setJugando(false); return undefined; }
    const t = setTimeout(() => setPaso((p) => p + 1), paso === -1 ? 500 : MS_POR_PASO);
    return () => clearTimeout(t);
  }, [jugando, paso, total]);

  // Si se apagan las animaciones mientras corre, se detiene
  useEffect(() => { if (!animaciones) setJugando(false); }, [animaciones]);

  // Foco y Escape
  useEffect(() => {
    const previo = document.activeElement;
    continuarRef.current?.focus({ preventScroll: true });
    const tecla = (e) => { if (e.key === 'Escape') { e.stopPropagation(); onCerrar(); } };
    document.addEventListener('keydown', tecla, true);
    return () => { document.removeEventListener('keydown', tecla, true); previo?.focus?.(); };
  }, [onCerrar]);

  const actual = paso >= 0 ? traza.pasos[paso] : null;
  const { vars, salida } = useMemo(() => estadoEnPaso(traza.pasos, paso), [traza, paso]);
  const terminado = paso >= total - 1;
  const hechas = new Set(traza.pasos.slice(0, Math.max(0, paso)).map((p) => p.l));   // instrucciones ya ejecutadas
  const diagrama = traza.modo === 'diagrama';

  const siguiente = () => { setJugando(false); setPaso((p) => Math.min(total - 1, p + 1)); };
  const repetir = () => { setPaso(-1); setJugando(animaciones); };
  const alternar = () => {
    if (jugando) { setJugando(false); return; }
    if (terminado) { setPaso(-1); }
    setJugando(true);
  };

  return (
    <div className="ejp-fondo" role="presentation" onPointerDown={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()}>
      <div className="ejp-panel" role="dialog" aria-modal="true" aria-labelledby="ejp-titulo">
        <h2 id="ejp-titulo" className="ejp-titulo">{traza.titulo}</h2>
        {traza.entrada && <p className="ejp-entrada">{traza.entrada}</p>}

        <div className="ejp-cuerpo">
          {diagrama ? (
            <ol className="ejp-diagrama" aria-label="Diagrama de flujo">
              {traza.lineas.map(([txt, forma], i) => (
                <li key={i} className={`ejp-bloque ${actual?.l === i ? 'activa' : ''} ${hechas.has(i) && actual?.l !== i ? 'hecha' : ''}`}>
                  {i > 0 && <span className="ejp-flecha" aria-hidden="true">▼</span>}
                  <span className={`chip f-${forma || 'proc'} ejp-chip`}>{txt}</span>
                </li>
              ))}
            </ol>
          ) : (
            <ol className="ejp-codigo" aria-label="Algoritmo">
              {traza.lineas.map((txt, i) => (
                <li key={i} className={`ejp-linea ${actual?.l === i ? 'activa' : ''} ${hechas.has(i) && actual?.l !== i ? 'hecha' : ''}`}>
                  <span className="ejp-num" aria-hidden="true">{i + 1}</span>
                  <code>{txt}</code>
                </li>
              ))}
            </ol>
          )}

          <div className="ejp-lado">
            <section className="ejp-memoria" aria-label="Memoria: variables">
              <h3>MEMORIA</h3>
              {Object.keys(vars).length ? (
                <table><tbody>
                  {Object.entries(vars).map(([k, v]) => (
                    <tr key={k} className={actual?.vars && k in actual.vars ? 'cambio' : ''}><th scope="row">{k}</th><td>{String(v)}</td></tr>
                  ))}
                </tbody></table>
              ) : <p className="ejp-vacio">Sin variables todavía</p>}
            </section>
            <section className="ejp-pantalla" aria-label="Pantalla: lo que muestra el algoritmo">
              <h3>PANTALLA</h3>
              {salida.length ? <pre>{salida.join('\n')}</pre> : <p className="ejp-vacio">Todavía no muestra nada</p>}
            </section>
          </div>
        </div>

        <p className="ejp-texto" role="status" aria-live="polite">
          {actual ? actual.texto : 'Pulsa «Reproducir» para ver cómo funciona, instrucción por instrucción.'}
        </p>

        <div className="ejp-barra">
          <span className="ejp-contador">{paso < 0 ? `Paso 0 de ${total}` : `Paso ${paso + 1} de ${total}`}</span>
          <div className="ejp-botones">
            <button type="button" className="ejp-btn" onClick={alternar}>{jugando ? '⏸ Pausar' : terminado ? '↺ Repetir' : '▶ Reproducir'}</button>
            <button type="button" className="ejp-btn" onClick={siguiente} disabled={terminado}>Siguiente paso ⏭</button>
            <button type="button" className="ejp-btn secundario" onClick={repetir} disabled={paso < 0}>↺ Reiniciar</button>
            <button type="button" className="ejp-btn secundario" onClick={onCerrar}>✕ Cerrar</button>
            <button type="button" ref={continuarRef} className="ejp-btn principal" onClick={onContinuar || onCerrar}>CONTINUAR →</button>
          </div>
        </div>
        {terminado && <p className="ejp-fin">¡Listo! Así funciona tu algoritmo.</p>}
      </div>
    </div>
  );
}
