// Contenido de un NIVEL guardado en Supabase (nivel 1 y nivel 2 del mundo 1):
//   leccion (titulo + teoria en jsonb) -> ejercicio (la pregunta) -> alternativa (opciones, una correcta)
//   o, en los ejercicios de tabla de verdad (tipo tabla_verdad), -> caso_prueba (una fila de la tabla cada uno)
//   o, en los de ordenar (pseudocodigo o diagrama de flujo), -> caso_prueba (un bloque cada uno, en el orden correcto).
// ejercicio.pista (lo que da el comodin), ejercicio.codigo (pseudocodigo de la pregunta) y ejercicio.traza (ejecucion paso a paso).
// Devuelve el mismo formato que usa el juego. Si algo falta o no tiene la forma esperada devuelve null,
// y el juego usa la copia local (src/data/nivel1.js, nivel2.js), que tiene el mismo contenido.
import { cliente } from './cliente';
import { idNivel } from './usuarios';
import { a, or, fl, tb, dg } from '../datos/helpers.js';

// Ejercicio de tabla de verdad guardado como filas de caso_prueba (una por fila de la tabla):
//   entrada = 'p=V;q=F'   salida_esperada = 'p ∧ q=F;¬q=V;(p ∧ q) ∨ ¬q=V'
const pares = (txt) => String(txt ?? '').split(';').map((x) => { const i = x.lastIndexOf('='); return [x.slice(0, i).trim(), x.slice(i + 1).trim()]; });
function aTabla(e) {
  const casos = [...(e.caso_prueba || [])].sort((x, y) => (x.id < y.id ? -1 : 1));   // el orden lo fija el id de la semilla
  if (!casos.length) return null;
  const ent = casos.map((c) => pares(c.entrada));
  const sal = casos.map((c) => pares(c.salida_esperada));
  const nombresE = ent[0].map((p) => p[0]), nombresS = sal[0].map((p) => p[0]);
  const valido = (v) => v === 'V' || v === 'F';
  const bien = ent.every((f) => f.length === nombresE.length && f.every(([n, v], i) => n === nombresE[i] && valido(v)))
    && sal.every((f) => f.length === nombresS.length && f.every(([n, v], i) => n === nombresS[i] && valido(v)));
  if (!bien || !nombresE.length || !nombresS.length) return null;
  return tb(e.enunciado, nombresE, ent.map((f) => f.map((p) => p[1])), nombresS.map((t, c) => ({ t, v: sal.map((f) => f[c][1]) })), extras(e));
}

// Datos opcionales del ejercicio. Una traza mal formada invalida el nivel (el juego usa entonces su copia local).
const trazaValida = (t) => !!t && typeof t === 'object' && typeof t.titulo === 'string'
  && (t.modo === 'codigo' || t.modo === 'diagrama') && Array.isArray(t.lineas) && t.lineas.length > 0
  && (t.modo === 'diagrama' ? t.lineas.every((x) => Array.isArray(x) && x.length === 2) : t.lineas.every((x) => typeof x === 'string'))
  && Array.isArray(t.pasos) && t.pasos.length > 0
  && t.pasos.every((p) => Number.isInteger(p.l) && p.l >= 0 && p.l < t.lineas.length && typeof p.texto === 'string');
function extras(e) {
  const x = {};
  if (e.pista) x.pista = e.pista;
  if (e.codigo) x.codigo = e.codigo;
  if (e.traza) x.traza = e.traza;
  return x;
}

// Con la migracion 30 el navegador ya no recibe es_correcta: el ejercicio lleva su id y el de cada opcion, y la BASE valida
// la respuesta (supabase/respuestas.js). a = -1 = la correcta no se conoce aqui. Sin la migracion 30 se valida como antes.
function aAlternativas(e) {
  const alts = [...(e.alternativa || [])].sort((x, y) => (x.id < y.id ? -1 : 1));   // el orden lo fija el id de la semilla
  if (alts.length < 2) return null;
  if (e.traza && !trazaValida(e.traza)) return null;
  const textos = alts.map((x) => x.texto);
  if (alts.every((x) => x.es_correcta === undefined)) return a(e.enunciado, textos, -1, { ...extras(e), id: e.id, altIds: alts.map((x) => x.id) });
  if (alts.filter((x) => x.es_correcta).length !== 1) return null;
  return a(e.enunciado, textos, alts.findIndex((x) => x.es_correcta), extras(e));
}

// Ejercicio de ordenar: los bloques estan en caso_prueba, en el orden correcto (entrada = forma del bloque en los diagramas).
function aBloques(e, flujo) {
  const casos = [...(e.caso_prueba || [])].sort((x, y) => (x.id < y.id ? -1 : 1));
  if (casos.length < 2 || casos.some((c) => !c.salida_esperada)) return null;
  if (e.traza && !trazaValida(e.traza)) return null;
  return flujo ? fl(e.enunciado, casos.map((c) => [c.salida_esperada, c.entrada || 'proc']), extras(e))
               : or(e.enunciado, casos.map((c) => c.salida_esperada), extras(e));
}

// Ejercicio de ARMAR un diagrama (nivel 5): ejercicio.diagrama = { d: solucion, distractores } (jsonb, database/migraciones/28)
const bloqueValido = (b) => Array.isArray(b) && b.length === 2 && typeof b[0] === 'string' && ['ini', 'fin', 'io', 'proc', 'dec'].includes(b[1]);
const nodoValido = (n) => bloqueValido(n) || (!!n && typeof n.dec === 'string' && Array.isArray(n.si) && Array.isArray(n.no) && n.si.every(nodoValido) && n.no.every(nodoValido));
function aDiagrama(e) {
  const x = e.diagrama;
  if (!x || !Array.isArray(x.d) || !x.d.length || !x.d.every(nodoValido) || !(x.distractores || []).every(bloqueValido)) return null;
  return dg(e.enunciado, x.d, { ...extras(e), distractores: x.distractores || [] });
}

const aEjercicio = (e) => (e.diagrama ? aDiagrama(e)
  : e.tipo === 'tabla_verdad' ? aTabla(e)
  : (e.alternativa || []).length ? aAlternativas(e)
  : e.tipo === 'diagrama_flujo' ? aBloques(e, true)
  : e.tipo === 'completar_codigo' ? aBloques(e, false) : null);

// esperado: { preguntas: [7, 7, 7, 7, 7] } = cuantos ejercicios debe tener cada leccion (se toma de la copia local)
export async function cargarNivelRemoto(orden, esperado) {
  const nivel = await idNivel(orden);
  if (!nivel) return null;
  const db = cliente();
  const baseCon = (alt) => `id, leccion_id, tipo, enunciado, orden, alternativa(${alt}), caso_prueba(id, entrada, salida_esperada)`;
  let base = baseCon('id, texto, es_correcta');
  const pedirBase = (cols) => db.from('ejercicio').select(cols).eq('nivel_id', nivel).order('orden');
  // Con la migracion 30 es_correcta ya no se puede leer: se pide sin ella (la base valida las respuestas)
  const sinPermiso = (r) => r.error && (r.error.code === '42501' || /permission denied/i.test(r.error.message || ''));
  const pedir = async (cols) => {
    const r = await pedirBase(cols.replace('BASE', base));
    if (!sinPermiso(r)) return r;
    base = baseCon('id, texto');
    return pedirBase(cols.replace('BASE', base));
  };
  const lecP = db.from('leccion').select('id, orden, titulo, teoria').eq('nivel_id', nivel).order('orden');
  // Si las columnas nuevas aun no existen (falta correr database/migraciones/14 o 28), se vuelve a pedir sin ellas: los demas niveles siguen funcionando
  const faltaColumna = (r) => r.error && (r.error.code === '42703' || /pista|codigo|traza|diagrama/i.test(r.error.message || ''));
  let ejs = await pedir('BASE, pista, codigo, traza, diagrama');
  if (faltaColumna(ejs)) ejs = await pedir('BASE, pista, codigo, traza');
  if (faltaColumna(ejs)) ejs = await pedir('BASE');
  const lec = await lecP;
  if (lec.error) throw lec.error;
  if (ejs.error) throw ejs.error;
  if ((lec.data || []).length !== esperado.preguntas.length) return null;

  const lecciones = lec.data.map((l, i) => {
    const qs = (ejs.data || []).filter((e) => e.leccion_id === l.id);
    const ejercicios = qs.map(aEjercicio);
    // Una leccion sin teoria (nivel 5) es valida solo si la copia local tampoco la tiene
    const sinTeoria = !!esperado.sinTeoria?.[i];
    if (ejercicios.length !== esperado.preguntas[i] || ejercicios.includes(null) || !Array.isArray(l.teoria) || (!l.teoria.length && !sinTeoria)) return null;
    return { titulo: l.titulo, teoria: l.teoria, ejercicios };
  });
  return lecciones.includes(null) ? null : { lecciones };
}
