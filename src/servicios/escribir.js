// Logica de los ejercicios de ESCRIBIR (tipo 'escribir', data/nivel4.js): el estudiante teclea lo que falta en cada espacio ______.
// El NOMBRE debe ser EXACTO: se distinguen mayusculas y minusculas (suma != Suma != sUma) y no se admiten letras de mas ni de menos.
// Solo se toleran los espacios de los extremos o alrededor de un operador o parentesis (contador+5 = contador + 5), la coma decimal
// (15,75 = 15.75) y los simbolos del teclado del celular (− × ÷). Otras formas igual de correctas van en q.aceptadas (conjuntos completos).
export const ESPACIO = /_{3,}/;

export const normalizar = (t) => String(t ?? '').normalize('NFC')
  .replace(/[−–—]/g, '-').replace(/[×·]/g, '*').replace(/÷/g, '/')
  .replace(/,/g, '.')
  .trim().replace(/\s+/g, ' ')
  .replace(/\s*([+\-*/()])\s*/g, '$1');       // los espacios junto a un operador o parentesis no cuentan; los de entre dos palabras si

export const contarEspacios = (plantilla) => (String(plantilla).match(/_{3,}/g) || []).length;

// Plantilla -> lineas; cada linea es una lista de trozos: { texto } o { espacio: n } (n = posicion del espacio, desde 0)
export function trocear(plantilla) {
  let n = 0;
  return String(plantilla).split('\n').map((linea) => {
    const partes = [];
    const re = /_{3,}/g;
    let ultimo = 0; let m;
    while ((m = re.exec(linea))) {
      if (m.index > ultimo) partes.push({ texto: linea.slice(ultimo, m.index) });
      partes.push({ espacio: n++ });
      ultimo = m.index + m[0].length;
    }
    if (ultimo < linea.length) partes.push({ texto: linea.slice(ultimo) });
    return partes;
  });
}

export const valoresVacios = (q) => q.respuestas.map(() => '');
export const completo = (valores) => Array.isArray(valores) && valores.length > 0 && valores.every((x) => String(x ?? '').trim() !== '');

// { correcto, buenos[], porMayusculas[] }: buenos[i] = el espacio i esta bien, EXACTO (se toma el conjunto de respuestas con mas aciertos);
// porMayusculas[i] = esta mal pero solo por mayusculas/minusculas (para avisarle al estudiante).
export function evaluar(q, valores) {
  const v = (valores || []).map(normalizar);
  const conjuntos = [q.respuestas, ...(q.aceptadas || [])];
  let mejor = null;
  for (const set of conjuntos) {
    const buenos = set.map((r, i) => v[i] !== undefined && v[i] !== '' && v[i] === normalizar(r));
    const n = buenos.filter(Boolean).length;
    if (!mejor || n > mejor.n) mejor = { buenos, n, set };
  }
  const porMayusculas = mejor.set.map((r, i) => !mejor.buenos[i] && v[i] !== undefined && v[i] !== '' && v[i].toLowerCase() === normalizar(r).toLowerCase());
  return { correcto: mejor.n === q.respuestas.length && v.length === q.respuestas.length, buenos: mejor.buenos, porMayusculas };
}

// Ancho de cada casilla (en caracteres): lo mas largo que se acepta en ese espacio + un poco de margen. Si la linea tiene varios espacios
// las casillas son mas justas para que la linea no se salga de la pantalla.
export const anchoEspacio = (q, i, enLinea = 1) => {
  const largo = Math.max(...[q.respuestas, ...(q.aceptadas || [])].map((s) => String(s[i] ?? '').length));
  return enLinea > 1 ? Math.max(4, largo) + 2 : Math.max(8, largo) + 3;
};

// El personaje guia se dirige al jugador segun el personaje que eligio (chico o chica)
export function tratamientoDe(nombrePersonaje) {
  const n = String(nombrePersonaje || '').toLowerCase();
  if (n.includes('chica')) return 'chica';
  if (n.includes('chico')) return 'chico';
  return 'aprendiz';
}
// Texto original del guia en la leccion 1 del nivel 4 (el nivel 5 usa su propio introTexto en datos/nivel5.js)
export const saludoGuia = (nombrePersonaje) =>
  `Vamos a ver tu capacidad de razonar, ${tratamientoDe(nombrePersonaje)}. Te daré ejercicios de retroalimentación de lo que has aprendido. Veremos cómo te defiendes con esto.`;

// Primera frase de la presentacion seria (niveles 4 y 5): muchacho o muchacha segun el personaje elegido
export function fraseSeria(nombrePersonaje) {
  const t = tratamientoDe(nombrePersonaje);
  return `Ahora hay que ponernos serios, ${t === 'chica' ? 'muchacha' : t === 'chico' ? 'muchacho' : 'aprendiz'}.`;
}
