import React from 'react';
import TextoLogico from '../comun/TextoLogico.jsx';
import '../../estilos/tabla-verdad.css';

// Ejercicio "arma la tabla de verdad": las columnas de entrada (p, q) ya estan; el estudiante completa cada
// celda de resultado tocandola (vacia -> V -> F -> V ...). valor[columna][fila] = '' | 'V' | 'F'.
export const tablaVacia = (q) => q.salidas.map(() => q.filas.map(() => ''));
export const tablaCompleta = (valor) => Array.isArray(valor) && valor.length > 0 && valor.every((col) => col.every(Boolean));
export const tablaCorrecta = (q, valor) => q.salidas.every((s, c) => s.v.every((v, r) => valor?.[c]?.[r] === v));
// Primera celda vacia o equivocada: [columna, fila] (la usa el comodin). null si ya esta todo bien.
export function primeraCeldaMala(q, valor) {
  for (let c = 0; c < q.salidas.length; c++) for (let r = 0; r < q.filas.length; r++) if (valor?.[c]?.[r] !== q.salidas[c].v[r]) return [c, r];
  return null;
}

export default function TablaVerdad({ q, valor, setValor, bloq = false, resultado = null }) {
  const alternar = (c, r) => {
    if (bloq) return;
    setValor(valor.map((col, ci) => (ci !== c ? col : col.map((x, ri) => (ri !== r ? x : (x === 'V' ? 'F' : 'V'))))));
  };
  return (
    <div className="tv-wrap">
      <table className="tv" aria-label="Tabla de verdad">
        <thead>
          <tr>
            {q.entradas.map((n) => <th key={n} className="tv-th tv-in-th" scope="col">{n}</th>)}
            {q.salidas.map((s) => <th key={s.t} className="tv-th tv-out-th" scope="col"><TextoLogico texto={s.t} /></th>)}
          </tr>
        </thead>
        <tbody>
          {q.filas.map((fila, r) => (
            <tr key={r}>
              {fila.map((v, i) => <td key={i} className={`tv-in tv-${v}`}>{v}</td>)}
              {q.salidas.map((s, c) => {
                const x = valor?.[c]?.[r] || '';
                const mal = resultado === 'mal' && x && x !== s.v[r];
                const bien = resultado === 'acertado';
                const fila_txt = q.entradas.map((n, i) => `${n} igual ${fila[i]}`).join(', ');
                return (
                  <td key={c} className="tv-out">
                    <button type="button" disabled={bloq} onClick={() => alternar(c, r)}
                      className={`tv-cel ${x ? 'lleno' : ''} ${x === 'V' ? 'es-v' : ''} ${x === 'F' ? 'es-f' : ''} ${mal ? 'mal' : ''} ${bien ? 'bien' : ''}`}
                      aria-label={`Fila ${fila_txt}. Resultado de ${s.t}: ${x || 'sin respuesta'}`}>
                      {x || '?'}
                    </button>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
      <p className="tv-ayuda">Toca cada <b>?</b> para elegir V o F.</p>
    </div>
  );
}
