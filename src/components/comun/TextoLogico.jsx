import React from 'react';

// Los simbolos de la logica (∧ ∨ ¬ → ↔) no existen en las fuentes pixel del juego y se veian diminutos.
// Se dibujan con una fuente que si los tiene y un poco mas grandes. El resto del texto no cambia.
const SIMBOLOS = /([∧∨¬→↔⇒⇔])/;
export default function TextoLogico({ texto }) {
  return (
    <>
      {String(texto ?? '').split(SIMBOLOS).map((parte, i) => (SIMBOLOS.test(parte)
        ? <span key={i} className="sim-logico">{parte}</span>
        : <React.Fragment key={i}>{parte}</React.Fragment>))}
    </>
  );
}
