import React, { useEffect, useMemo, useState } from 'react';
import { bloquesDe, usadosEn, cambiarLista, listaEn, mismoCamino } from '../../servicios/diagrama.js';
import '../../estilos/diagrama.css';

// ARMAR UN DIAGRAMA DE FLUJO: el estudiante toca los bloques de abajo y se agregan al camino activo (el recuadro amarillo).
// Al poner un rombo se abren sus caminos SI y NO (se activa el SI); tocando un camino se elige donde seguir agregando.
// Tocar un bloque ya puesto lo quita (si es un rombo, con sus caminos). buenos['ruta'] = true/false marca verde/rojo al comprobar.
export default function EjercicioDiagrama({ q, valor, setValor, buenos, bloq = false }) {
  const bloques = useMemo(() => bloquesDe(q), [q]);
  const orden = useMemo(() => bloques.map((_, i) => i).sort(() => Math.random() - 0.5), [bloques]);
  const [camino, setCamino] = useState([]);
  useEffect(() => { setCamino([]); }, [q]);

  const usados = usadosEn(valor);
  const libres = orden.filter((i) => !usados.has(i));

  // Los cambios se aplican sobre el diagrama mas reciente (dos toques seguidos no se pisan)
  const agregar = (b) => {
    if (bloq) return;
    const esDec = bloques[b][1] === 'dec';
    const pos = listaEn(valor, camino).length;
    setValor((v) => cambiarLista(v, camino, (lista) => (lista.some((n) => n.b === b) ? lista : [...lista, esDec ? { b, si: [], no: [] } : { b }])));
    if (esDec) setCamino([...camino, pos, 'si']);                 // al poner un rombo se sigue por su camino SI
  };
  const quitar = (enCamino, k) => {
    if (bloq) return;
    setValor((v) => cambiarLista(v, enCamino, (lista) => lista.filter((_, i) => i !== k)));
    // si el camino activo estaba dentro de lo que se quito (o despues, en la misma lista), se vuelve a esa lista
    const dentro = camino.length > enCamino.length && mismoCamino(camino.slice(0, enCamino.length), enCamino) && camino[enCamino.length] >= k;
    if (dentro) setCamino(enCamino);
  };

  const Lista = ({ nodos, en, etiqueta }) => {
    const activo = !bloq && mismoCamino(camino, en);
    return (
      <div className={`dg-lista ${activo ? 'activa' : ''} ${en.length ? 'rama' : ''}`}
        onClick={(e) => { e.stopPropagation(); if (!bloq) setCamino(en); }}>
        {etiqueta}
        {nodos.map((n, k) => {
          const ruta = [...en, k].join('.');
          const marca = buenos ? (buenos[ruta] ? 'bien' : 'mal') : '';
          const [texto, forma] = bloques[n.b];
          return (
            <div key={ruta} className="dg-paso">
              {k > 0 && <b className="dg-flecha" aria-hidden="true">▼</b>}
              <button type="button" className={`chip f-${forma} dg-bloque ${marca}`} disabled={bloq}
                title={bloq ? undefined : 'Quitar este bloque'} onClick={(e) => { e.stopPropagation(); quitar(en, k); }}>
                {texto}
              </button>
              {n.si && (
                <div className="dg-ramas">
                  <Lista nodos={n.si} en={[...en, k, 'si']} etiqueta={<span className="dg-etq si">SÍ</span>} />
                  <Lista nodos={n.no} en={[...en, k, 'no']} etiqueta={<span className="dg-etq no">NO</span>} />
                </div>
              )}
            </div>
          );
        })}
        {!bloq && (
          <span className={`dg-hueco ${activo ? 'activo' : ''}`}>{activo ? 'El próximo bloque va aquí' : 'Toca para agregar aquí'}</span>
        )}
      </div>
    );
  };

  return (
    <div className="dg">
      {q.codigo && <pre className="dg-codigo" aria-label="Pseudocódigo del ejercicio"><code>{q.codigo}</code></pre>}
      <div className="dg-lienzo" aria-label="Tu diagrama de flujo">
        <Lista nodos={valor} en={[]} />
      </div>
      {!bloq && (
        <>
          <p className="dg-ayuda">Toca un bloque para agregarlo donde está el recuadro amarillo. Toca un camino (SÍ o NO) para elegir dónde seguir; toca un bloque del diagrama para quitarlo.</p>
          <div className="dg-paleta" aria-label="Bloques disponibles">
            {libres.map((i) => (
              <button key={i} type="button" className={`chip f-${bloques[i][1]}`} onClick={() => agregar(i)}>{bloques[i][0]}</button>
            ))}
            {!libres.length && <span className="dg-vacio">Ya usaste todos los bloques.</span>}
          </div>
          <div className="dg-acciones">
            {camino.length > 0 && <button type="button" className="dg-mini" onClick={() => setCamino([])}>↩ Seguir en el camino principal</button>}
            {valor.length > 0 && <button type="button" className="dg-mini" onClick={() => { setValor([]); setCamino([]); }}>Borrar todo</button>}
          </div>
        </>
      )}
    </div>
  );
}
