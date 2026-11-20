// CONSEJOS INSTANTÁNEOS para el pseudocódigo del estudiante (sin IA, al momento). Se muestran en la pantalla de la nota
// del examen mientras llegan las recomendaciones de Gemini (que las reemplazan), o solas si Gemini no responde.
// Revisa: nombres de variables muy cortos, variables sin DEFINIR, LEER sin mensaje antes, resultados sin texto,
// varios SI seguidos que podrían ir con SINO y variables que solo se usan para mostrar un cálculo.
const sinTildes = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '');
const PALABRAS = new Set(['INICIO', 'FIN', 'SI', 'SINO', 'ENTONCES', 'LEER', 'ESCRIBIR', 'DEFINIR', 'COMO', 'MOD', 'MIENTRAS', 'HACER',
  'PARA', 'HASTA', 'CON', 'PASO', 'REPETIR', 'QUE', 'SEGUN', 'ALGORITMO', 'PROCESO', 'FINSI', 'FINALGORITMO', 'FINPROCESO', 'FINMIENTRAS', 'FINPARA',
  'ENTERO', 'REAL', 'CADENA', 'CARACTER', 'TEXTO', 'LOGICO', 'NUMERO', 'NUMERICO', 'VERDADERO', 'FALSO', 'MOSTRAR', 'IMPRIMIR', 'SIN', 'SALTAR']);
const lista = (xs) => xs.map((x) => `"${x}"`).join(', ');

export function consejosLocales(codigo) {
  const lineas = String(codigo || '').replace(/\r/g, '').split('\n').map((l) => l.replace(/\/\/.*$/, '').trim()).filter(Boolean);
  const K = (l) => sinTildes(l).toUpperCase();
  const consejos = [];

  // Variables: las de LEER, las asignadas (x <- ...) y las de DEFINIR
  const leidas = [], asignadas = [], definidas = new Set();
  lineas.forEach((l) => {
    const k = K(l);
    if (k.startsWith('LEER ')) l.slice(5).split(',').map((v) => v.trim()).filter(Boolean).forEach((v) => leidas.push(v));
    const a = l.match(/^([A-Za-zÁÉÍÓÚÑáéíóúñ_][\wÁÉÍÓÚÑáéíóúñ]*)\s*(<-|←|:=)/);
    if (a) asignadas.push(a[1]);
    if (k.startsWith('DEFINIR ')) l.slice(8).split(/\s+COMO\s+/i)[0].split(',').forEach((v) => definidas.add(K(v.trim())));
  });
  const todas = [...new Set([...leidas, ...asignadas])].filter((v) => !PALABRAS.has(K(v)));

  const cortas = todas.filter((v) => v.length <= 2);
  if (cortas.length) {
    consejos.push(`Usa nombres que digan qué guarda cada variable: en vez de ${lista(cortas)}, prueba con nombres como "numero", "promedio" o "vidasRestantes". Así tu código se entiende solo.`);
  }

  // Varios SI seguidos sin SINO
  const nSi = lineas.filter((l) => /^SI\s/.test(K(l))).length;
  const nSino = lineas.filter((l) => /^SINO\b/.test(K(l))).length;
  if (nSi >= 3 && nSino === 0) {
    consejos.push('Tienes varios SI separados: encadénalos con SINO (SI ... SINO SI ...). Así no repites comparaciones como "p < 18" y el programa revisa menos condiciones.');
  }

  const sinDefinir = todas.filter((v) => !definidas.has(K(v)));
  if (sinDefinir.length) {
    consejos.push(`Declara tus variables al inicio con DEFINIR, por ejemplo: DEFINIR ${sinDefinir.slice(0, 3).join(', ')} COMO REAL. Ayuda a ver de un vistazo qué datos usa el programa.`);
  }

  // LEER sin un ESCRIBIR justo antes que explique qué dato ingresar
  const leerSinMensaje = lineas.some((l, i) => K(l).startsWith('LEER ') && !(i > 0 && /^(ESCRIBIR|MOSTRAR|IMPRIMIR)\s/.test(K(lineas[i - 1]))));
  if (leerSinMensaje) {
    consejos.push('Antes de cada LEER muestra un mensaje que diga qué dato escribir, por ejemplo: ESCRIBIR "Ingresa tu nota:". Quien use tu programa sabrá qué hacer.');
  }

  // Resultado mostrado sin ningún texto (ESCRIBIR variable)
  const soloValor = lineas.some((l) => /^(ESCRIBIR|MOSTRAR|IMPRIMIR)\s/.test(K(l)) && !/["']/.test(l));
  if (soloValor) {
    consejos.push('Acompaña los resultados con un texto, por ejemplo: ESCRIBIR "El resultado es: ", total. Es más claro que mostrar solo el número.');
  }

  // Variable que solo se calcula para mostrarla una vez (x <- cálculo; ESCRIBIR x)
  const unaVez = asignadas.find((v) => {
    const usos = lineas.filter((l) => new RegExp(`\\b${v}\\b`).test(l)).length;
    return usos === 2 && lineas.some((l) => /^(ESCRIBIR|MOSTRAR|IMPRIMIR)\s/.test(K(l)) && new RegExp(`\\b${v}\\b`).test(l));
  });
  if (unaVez && consejos.length < 4) {
    consejos.push(`Puedes resumir: "${unaVez}" solo se usa para mostrar el cálculo, así que podrías escribir la operación directo dentro del ESCRIBIR.`);
  }

  return consejos.slice(0, 4);
}
