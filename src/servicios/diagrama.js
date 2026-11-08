// Logica de los ejercicios de ARMAR UN DIAGRAMA DE FLUJO (tipo 'diagrama', datos/nivel5.js).
// q.d = la solucion: lista de bloques ['texto', 'forma'] (forma = ini | fin | io | proc | dec) y decisiones
//       { dec: '¿condicion?', si: [...], no: [...] } (los caminos pueden tener otras decisiones adentro).
// q.distractores = bloques de mas que NO van en el diagrama.
// El diagrama del estudiante (valor) usa la misma forma, pero con el numero de bloque de la paleta:
//       [{ b: 0 }, { b: 3, si: [{ b: 4 }], no: [{ b: 5 }] }, ...]

const clave = ([texto, forma]) => `${forma}|${String(texto).trim()}`;

// Todos los bloques disponibles (los de la solucion + los distractores), cada uno una sola vez
export function bloquesDe(q) {
  const lista = [];
  const rec = (nodos) => nodos.forEach((n) => {
    if (Array.isArray(n)) lista.push(n);
    else { lista.push([n.dec, 'dec']); rec(n.si); rec(n.no); }
  });
  rec(q.d);
  (q.distractores || []).forEach((b) => lista.push(b));
  return lista;
}

// Solucion expresada con los numeros de bloque de la paleta (para mostrarla cuando se acaban las oportunidades)
export function solucionDe(q) {
  const bloques = bloquesDe(q);
  const usados = new Set();
  const indice = (b) => { const i = bloques.findIndex((x, k) => !usados.has(k) && clave(x) === clave(b)); usados.add(i); return i; };
  const rec = (nodos) => nodos.map((n) => (Array.isArray(n) ? { b: indice(n) } : { b: indice([n.dec, 'dec']), si: rec(n.si), no: rec(n.no) }));
  return rec(q.d);
}

// Compara posicion por posicion. Devuelve { correcto, buenos: { 'ruta': true|false } } (ruta = '0', '2.si.0', ...)
export function evaluarDiagrama(q, valor) {
  const bloques = bloquesDe(q);
  const buenos = {};
  let correcto = true;
  const rec = (mios, sol, ruta) => {
    if (mios.length !== sol.length) correcto = false;
    mios.forEach((n, i) => {
      const r = ruta ? `${ruta}.${i}` : String(i);
      const s = sol[i];
      const esperado = !s ? null : Array.isArray(s) ? clave(s) : clave([s.dec, 'dec']);
      const ok = esperado !== null && clave(bloques[n.b]) === esperado;
      buenos[r] = ok;
      if (!ok) correcto = false;
      if (n.si) {
        const sDec = ok && !Array.isArray(s) ? s : { si: [], no: [] };
        rec(n.si, sDec.si, `${r}.si`); rec(n.no, sDec.no, `${r}.no`);
      }
    });
  };
  rec(valor, q.d, '');
  return { correcto, buenos };
}

export const usadosEn = (valor) => {
  const s = new Set();
  const rec = (nodos) => nodos.forEach((n) => { s.add(n.b); if (n.si) { rec(n.si); rec(n.no); } });
  rec(valor);
  return s;
};

// Lista que corresponde a un camino: [] = principal; [2, 'si'] = camino Si de la decision 2; [2, 'no', 0, 'si'] = ...
export function listaEn(valor, camino) {
  let lista = valor;
  for (let i = 0; i < camino.length; i += 2) lista = lista[camino[i]]?.[camino[i + 1]] ?? [];
  return lista;
}

// Copia del diagrama con un cambio en la lista de un camino
export function cambiarLista(valor, camino, fn) {
  if (!camino.length) return fn(valor);
  const [i, rama, ...resto] = camino;
  return valor.map((n, k) => (k === i ? { ...n, [rama]: cambiarLista(n[rama], resto, fn) } : n));
}

export const mismoCamino = (a, b) => a.length === b.length && a.every((x, i) => x === b[i]);
