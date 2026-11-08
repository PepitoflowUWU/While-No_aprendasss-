import React, { useEffect, useMemo, useRef } from 'react';
import { trocear, anchoEspacio } from '../../servicios/escribir.js';
import '../../estilos/escribir.css';

// Codigo con espacios para ESCRIBIR: cada ______ es una casilla donde se teclea la respuesta (sin opciones).
// buenos[i]: true = bien (verde), false = mal (rojo), null = sin comprobar. Enter pasa a la casilla siguiente y, en la ultima, comprueba.
export default function EjercicioEscribir({ q, valores, buenos, setValor, bloq = false, onEnviar }) {
  const lineas = useMemo(() => trocear(q.plantilla), [q.plantilla]);
  const total = q.respuestas.length;
  const refs = useRef([]);

  useEffect(() => { if (!bloq) refs.current[0]?.focus(); }, [q]);        // al empezar cada problema el cursor queda en el primer espacio

  const teclas = (n) => (e) => {
    if (e.key !== 'Enter') return;
    e.preventDefault();
    if (n < total - 1) refs.current[n + 1]?.focus(); else onEnviar?.();
  };

  return (
    <div className="ec">
      <div className="ec-ventana">
        <div className="ec-barra">
          <span className="ec-luces" aria-hidden="true"><i /><i /><i /></span>
          <b>{q.titulo}</b>
          <em>Escribe lo que falta en cada espacio</em>
        </div>
        <div className="ec-codigo" role="group" aria-label="Código incompleto">
          {lineas.map((partes, li) => {
            const enLinea = partes.filter((p) => p.espacio !== undefined).length;
            return (
            <div className="ec-linea" key={li}>
              <span className="ec-num" aria-hidden="true">{li + 1}</span>
              <span className="ec-txt">
                {partes.length === 0 && '\u200b'}
                {partes.map((p, k) => (p.espacio === undefined
                  ? <span key={k}>{p.texto}</span>
                  : (
                    <input
                      key={k}
                      ref={(el) => { refs.current[p.espacio] = el; }}
                      className={`ec-input ${buenos?.[p.espacio] === true ? 'ok' : buenos?.[p.espacio] === false ? 'mal' : ''}`}
                      style={{ width: `${anchoEspacio(q, p.espacio, enLinea)}ch` }}
                      value={valores[p.espacio] ?? ''}
                      disabled={bloq}
                      onChange={(e) => setValor(p.espacio, e.target.value)}
                      onKeyDown={teclas(p.espacio)}
                      aria-label={`Espacio ${p.espacio + 1} de ${total}`}
                      aria-invalid={buenos?.[p.espacio] === false ? 'true' : undefined}
                      autoComplete="off" autoCapitalize="none" autoCorrect="off" spellCheck={false} maxLength={40}
                    />
                  )))}
              </span>
            </div>
            );
          })}
        </div>
      </div>
      {bloq && q.resultado && <p className="ec-resultado" role="status">{q.resultado}</p>}
    </div>
  );
}
