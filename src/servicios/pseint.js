// Interprete de PSeInt (subconjunto del curso) + validador con casos de prueba. Sin dependencias.
// Lo usa el EXAMEN FINAL (components/nivel/ExamenFinal.jsx) en los ejercicios donde el estudiante escribe su propio programa.
// Acepta el estilo de PSeInt (Algoritmo ... FinAlgoritmo / Proceso ... FinProceso) y el del curso (INICIO ... FIN).
// ejecutar(codigo, entradas) -> { salida, error: { linea, mensaje } | null }
// validar(codigo, ejercicio)  -> { correcto, mensaje, casos: [...] }

const sinTildes = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '');
const clave = (s) => sinTildes(String(s)).toUpperCase();

class ErrorPS extends Error { constructor(linea, mensaje) { super(mensaje); this.linea = linea; } }

// ── Lexer ─────────────────────────────────────────────────────────────────────────────────────────
const UNIR_FIN = ['SI', 'MIENTRAS', 'PARA', 'SEGUN', 'ALGORITMO', 'PROCESO'];
function tokens(codigo) {
  const t = []; let i = 0; let linea = 1; const s = String(codigo).replace(/\r\n?/g, '\n');
  const push = (tipo, v) => t.push({ tipo, v, linea });
  while (i < s.length) {
    const c = s[i];
    if (c === '\n') { push('NL'); linea++; i++; continue; }
    if (c === ' ' || c === '\t') { i++; continue; }
    if (s.startsWith('//', i)) { while (i < s.length && s[i] !== '\n') i++; continue; }
    if (c === ';') { push('NL'); i++; continue; }
    if (c === '"' || c === "'" || c === '“' || c === '”') {
      const cierre = c === '“' ? '”' : c; let j = i + 1;
      while (j < s.length && s[j] !== cierre && !(cierre === '”' && s[j] === '"') && s[j] !== '\n') j++;
      if (j >= s.length || s[j] === '\n') throw new ErrorPS(linea, 'Falta cerrar las comillas de un texto.');
      push('STR', s.slice(i + 1, j)); i = j + 1; continue;
    }
    if (/[0-9]/.test(c) || (c === '.' && /[0-9]/.test(s[i + 1] || ''))) {
      let j = i; while (j < s.length && /[0-9.]/.test(s[j])) j++;
      const txt = s.slice(i, j);
      if ((txt.match(/\./g) || []).length > 1) throw new ErrorPS(linea, `Número mal escrito: ${txt}`);
      push('NUM', Number(txt)); i = j; continue;
    }
    if (/[A-Za-z_À-ɏ]/.test(c)) {
      let j = i; while (j < s.length && /[A-Za-z0-9_À-ɏ]/.test(s[j])) j++;
      const palabra = s.slice(i, j); const k = clave(palabra);
      const ant = t[t.length - 1];
      if (ant && ant.tipo === 'ID' && ant.k === 'FIN' && UNIR_FIN.includes(k)) { ant.k = 'FIN' + k; ant.v += palabra; }   // "Fin Si" = "FinSi"
      else t.push({ tipo: 'ID', v: palabra, k, linea });
      i = j; continue;
    }
    const dos = s.slice(i, i + 2);
    if (['<-', '<=', '>=', '<>', '!=', '==', ':='].includes(dos)) { push('OP', dos === ':=' ? '<-' : dos); i += 2; continue; }
    if (c === '←') { push('OP', '<-'); i++; continue; }
    if (c === '≤' || c === '≥' || c === '≠') { push('OP', c === '≤' ? '<=' : c === '≥' ? '>=' : '<>'); i++; continue; }
    if ('+-*/^%()=<>,:&|~[]'.includes(c)) { push('OP', c); i++; continue; }
    throw new ErrorPS(linea, `Carácter no reconocido: ${c}`);
  }
  push('NL'); push('EOF');
  return t;
}

// ── Parser ────────────────────────────────────────────────────────────────────────────────────────
const TIPOS = { ENTERO: 'entero', REAL: 'real', NUMERO: 'real', NUMERICO: 'real', CARACTER: 'texto', TEXTO: 'texto', CADENA: 'texto', LOGICO: 'logico' };
const ESCRIBIR = ['ESCRIBIR', 'IMPRIMIR', 'MOSTRAR'];

function parsear(codigo) {
  const t = tokens(codigo); let p = 0;
  const ver = (o = 0) => t[p + o];
  const esK = (k, o = 0) => ver(o).tipo === 'ID' && ver(o).k === k;
  const esOp = (v, o = 0) => ver(o).tipo === 'OP' && ver(o).v === v;
  const sig = () => t[p++];
  const err = (m, tok = ver()) => { throw new ErrorPS(tok.linea, m); };
  const esperaK = (k, m) => { if (!esK(k)) err(m || `Se esperaba "${k}".`); return sig(); };
  const esperaOp = (v, m) => { if (!esOp(v)) err(m || `Se esperaba "${v}".`); return sig(); };
  const saltaNL = () => { while (ver().tipo === 'NL') p++; };
  const finLinea = () => { if (ver().tipo !== 'NL' && ver().tipo !== 'EOF') err(`Sobra "${ver().v}" al final de la instrucción.`); saltaNL(); };

  function programa() {
    saltaNL();
    // Estilo del curso: INICIO ... FIN
    if (esK('INICIO')) {
      sig(); finLinea();
      const cuerpo = bloque(['FIN', 'FINALGORITMO', 'FINPROCESO']);
      if (ver().tipo === 'EOF') err('Falta "FIN" al final del programa.');
      sig(); saltaNL();
      if (ver().tipo !== 'EOF') err('Hay instrucciones después de FIN.');
      return cuerpo;
    }
    if (!esK('ALGORITMO') && !esK('PROCESO')) err('El programa debe empezar con INICIO (o con "Algoritmo nombre").');
    const ini = sig().k;
    if (ver().tipo !== 'ID') err('Falta el nombre del algoritmo.');
    sig(); finLinea();
    const fin = ini === 'ALGORITMO' ? 'FINALGORITMO' : 'FINPROCESO';
    const cuerpo = bloque([fin, 'FINALGORITMO', 'FINPROCESO']);
    if (ver().tipo === 'EOF') err(`Falta "${ini === 'ALGORITMO' ? 'FinAlgoritmo' : 'FinProceso'}" al final.`);
    sig(); saltaNL();
    if (ver().tipo !== 'EOF') err('Hay instrucciones después de FinAlgoritmo.');
    return cuerpo;
  }

  // Lee instrucciones hasta encontrar alguna palabra de cierre (no la consume)
  function bloque(cierres, esCierre = () => false) {
    const lista = [];
    saltaNL();
    while (ver().tipo !== 'EOF' && !(ver().tipo === 'ID' && cierres.includes(ver().k)) && !esCierre()) {
      lista.push(instruccion()); saltaNL();
    }
    return lista;
  }

  function lvalor() {
    const tok = ver();
    if (tok.tipo !== 'ID') err('Se esperaba el nombre de una variable.');
    sig();
    return { nombre: tok.k, texto: tok.v, linea: tok.linea };
  }

  function instruccion() {
    const tok = ver(); const linea = tok.linea;
    if (tok.tipo !== 'ID') err(`No se esperaba "${tok.v}" al inicio de una instrucción.`);
    const k = tok.k;
    if (k === 'DEFINIR') {
      sig(); const vars = [lvalor()];
      while (esOp(',')) { sig(); vars.push(lvalor()); }
      esperaK('COMO', 'Falta "Como" en Definir (ejemplo: Definir edad Como Entero).');
      const ti = ver(); if (ti.tipo !== 'ID' || !TIPOS[ti.k]) err('Tipo de dato desconocido: usa Entero, Real, Caracter o Logico.');
      sig(); finLinea();
      return { tipo: 'Definir', vars, dato: TIPOS[ti.k], linea };
    }
    if (k === 'DIMENSION') err('Los arreglos (Dimension) todavía no están disponibles en este ejercicio.');
    if (k === 'LEER') {
      sig(); const vars = [lvalor()];
      while (esOp(',')) { sig(); vars.push(lvalor()); }
      finLinea(); return { tipo: 'Leer', vars, linea };
    }
    if (ESCRIBIR.includes(k)) {
      sig(); let saltar = true;
      if (esK('SIN') && (esK('SALTAR', 1) || esK('BAJAR', 1))) { sig(); sig(); saltar = false; }
      const exprs = [expr()];
      while (esOp(',')) { sig(); exprs.push(expr()); }
      if (esK('SIN') && (esK('SALTAR', 1) || esK('BAJAR', 1))) { sig(); sig(); saltar = false; }
      finLinea(); return { tipo: 'Escribir', exprs, saltar, linea };
    }
    if (k === 'SI') {
      sig(); const cond = expr();
      esperaK('ENTONCES', 'Falta "Entonces" después de la condición del Si.'); saltaNL();
      const entonces = bloque(['SINO', 'FINSI']); let sino = [];
      if (esK('SINO')) { sig(); saltaNL(); sino = bloque(['FINSI']); }
      if (!esK('FINSI')) err(`Falta "FinSi" para cerrar el Si de la línea ${linea}.`);
      sig(); finLinea(); return { tipo: 'Si', cond, entonces, sino, linea };
    }
    if (k === 'MIENTRAS') {
      sig(); const cond = expr();
      esperaK('HACER', 'Falta "Hacer" después de la condición del Mientras.'); saltaNL();
      const cuerpo = bloque(['FINMIENTRAS']);
      if (!esK('FINMIENTRAS')) err(`Falta "FinMientras" para cerrar el Mientras de la línea ${linea}.`);
      sig(); finLinea(); return { tipo: 'Mientras', cond, cuerpo, linea };
    }
    if (k === 'REPETIR') {
      sig(); saltaNL();
      const cierre = () => (esK('HASTA') && esK('QUE', 1)) || (esK('MIENTRAS') && esK('QUE', 1));
      const cuerpo = bloque([], cierre);
      if (!cierre()) err(`Falta "Hasta Que condición" para cerrar el Repetir de la línea ${linea}.`);
      const hasta = sig().k === 'HASTA'; sig();
      const cond = expr(); finLinea();
      return { tipo: 'Repetir', cuerpo, cond, hasta, linea };
    }
    if (k === 'PARA') {
      sig(); const v = lvalor();
      if (!esOp('<-') && !esOp('=')) err('En el Para falta la asignación inicial (ejemplo: Para i <- 1 Hasta 10 Hacer).');
      sig(); const desde = expr();
      esperaK('HASTA', 'Falta "Hasta" en el Para.'); const hasta = expr();
      let paso = null;
      if (esK('CON') && esK('PASO', 1)) { sig(); sig(); paso = expr(); }
      esperaK('HACER', 'Falta "Hacer" en el Para.'); saltaNL();
      const cuerpo = bloque(['FINPARA']);
      if (!esK('FINPARA')) err(`Falta "FinPara" para cerrar el Para de la línea ${linea}.`);
      sig(); finLinea(); return { tipo: 'Para', v, desde, hasta, paso, cuerpo, linea };
    }
    if (k === 'SEGUN') {
      sig(); const valor = expr();
      esperaK('HACER', 'Falta "Hacer" después de Segun.'); saltaNL();
      const esEtiqueta = () => {                                  // una linea "valor:" o "valor, valor:" empieza un caso
        if (ver().tipo === 'ID' && ['FINSEGUN', 'DE'].includes(ver().k)) return false;
        for (let j = p; t[j].tipo !== 'NL' && t[j].tipo !== 'EOF'; j++) if (t[j].tipo === 'OP' && t[j].v === ':') return true;
        return false;
      };
      const casos = []; let otro = null;
      while (!esK('FINSEGUN')) {
        if (ver().tipo === 'EOF') err(`Falta "FinSegun" para cerrar el Segun de la línea ${linea}.`);
        if (esK('DE') && esK('OTRO', 1) && esK('MODO', 2)) {
          sig(); sig(); sig(); esperaOp(':', 'Falta ":" después de "De Otro Modo".');
          otro = bloque(['FINSEGUN']); continue;
        }
        if (!esEtiqueta()) err('En un Segun cada caso empieza con "valor:".');
        const valores = [expr()];
        while (esOp(',')) { sig(); valores.push(expr()); }
        esperaOp(':');
        casos.push({ valores, cuerpo: bloque(['FINSEGUN', 'DE'], esEtiqueta) });
      }
      sig(); finLinea(); return { tipo: 'Segun', valor, casos, otro, linea };
    }
    if (['FINSI', 'FINMIENTRAS', 'FINPARA', 'FINSEGUN', 'SINO', 'FINALGORITMO', 'FINPROCESO'].includes(k)) err(`"${tok.v}" no tiene una instrucción que cerrar.`);
    if (ver(1).tipo === 'OP' && (ver(1).v === '<-' || ver(1).v === '=')) {
      const v = lvalor(); sig(); const e = expr(); finLinea();
      return { tipo: 'Asignar', v, e, linea };
    }
    err(`Instrucción desconocida: "${tok.v}". Revisa cómo está escrita.`);
  }

  // Expresiones: O < Y < NO < relacionales < + - < * / MOD < ^ < unario
  function expr() { return o(); }
  function o() { let a = y(); while (esK('O') || esOp('|')) { const l = sig().linea; a = { op: 'O', a, b: y(), linea: l }; } return a; }
  function y() { let a = no(); while (esK('Y') || esOp('&')) { const l = sig().linea; a = { op: 'Y', a, b: no(), linea: l }; } return a; }
  function no() { if (esK('NO') || esOp('~')) { const l = sig().linea; return { op: 'NO', a: no(), linea: l }; } return rel(); }
  function rel() {
    let a = suma();
    while (ver().tipo === 'OP' && ['=', '==', '<>', '!=', '<', '>', '<=', '>='].includes(ver().v)) {
      const tok = sig(); const op = tok.v === '==' ? '=' : tok.v === '!=' ? '<>' : tok.v;
      a = { op, a, b: suma(), linea: tok.linea };
    }
    return a;
  }
  function suma() { let a = mult(); while (esOp('+') || esOp('-')) { const tok = sig(); a = { op: tok.v, a, b: mult(), linea: tok.linea }; } return a; }
  function mult() {
    let a = pot();
    while (esOp('*') || esOp('/') || esOp('%') || esK('MOD')) { const tok = sig(); a = { op: tok.v === '%' || tok.k === 'MOD' ? 'MOD' : tok.v, a, b: pot(), linea: tok.linea }; }
    return a;
  }
  function pot() { const a = unario(); if (esOp('^')) { const tok = sig(); return { op: '^', a, b: pot(), linea: tok.linea }; } return a; }
  function unario() {
    if (esOp('-')) { const tok = sig(); return { op: 'NEG', a: unario(), linea: tok.linea }; }
    if (esOp('+')) { sig(); return unario(); }
    return primario();
  }
  function primario() {
    const tok = ver();
    if (tok.tipo === 'NUM') { sig(); return { lit: tok.v, linea: tok.linea }; }
    if (tok.tipo === 'STR') { sig(); return { lit: tok.v, linea: tok.linea }; }
    if (esOp('(')) { sig(); const e = expr(); esperaOp(')', 'Falta cerrar un paréntesis.'); return e; }
    if (tok.tipo === 'ID') {
      if (tok.k === 'VERDADERO') { sig(); return { lit: true, linea: tok.linea }; }
      if (tok.k === 'FALSO') { sig(); return { lit: false, linea: tok.linea }; }
      sig();
      if (esOp('(')) {
        sig(); const args = [];
        if (!esOp(')')) { args.push(expr()); while (esOp(',')) { sig(); args.push(expr()); } }
        esperaOp(')', `Falta cerrar el paréntesis de ${tok.v}.`);
        return { fn: tok.k, texto: tok.v, args, linea: tok.linea };
      }
      return { vari: tok.k, texto: tok.v, linea: tok.linea };
    }
    if (tok.tipo === 'NL' || tok.tipo === 'EOF') err('Falta una expresión al final de la línea.');
    err(`No se esperaba "${tok.v}" en la expresión.`);
  }

  return programa();
}

// ── Ejecucion ─────────────────────────────────────────────────────────────────────────────────────
const MAX_PASOS = 200000;
const nombreTipo = { entero: 'Entero', real: 'Real', texto: 'Caracter', logico: 'Logico' };
const tipoDe = (v) => (typeof v === 'boolean' ? 'logico' : typeof v === 'string' ? 'texto' : Number.isInteger(v) ? 'entero' : 'real');
export function formatear(v) {
  if (typeof v === 'boolean') return v ? 'VERDADERO' : 'FALSO';
  if (typeof v === 'number') return Number.isInteger(v) ? String(v) : String(Number(v.toPrecision(12)));
  return String(v);
}

export function ejecutar(codigo, entradas = [], opciones = {}) {
  const salida = []; let linea = '';
  const fin = (error) => { if (linea) salida.push(linea); return { salida: salida.join('\n'), error, pidioDatos: cola.length < entradas.length || error?.faltaDato }; };
  const cola = [...entradas].map(String);
  let ast;
  try { ast = parsear(codigo); } catch (e) { return { salida: '', error: { linea: e.linea ?? null, mensaje: e.message } }; }

  const vars = new Map();       // NOMBRE -> { tipo, valor, definida }
  let pasos = 0;
  const err = (n, m) => { throw new ErrorPS(n.linea, m); };

  const asignar = (v, valor, n) => {
    let x = vars.get(v.nombre);
    if (!x) {
      if (opciones.exigirDefinir) err(n, `La variable "${v.texto}" no fue definida. Usa: Definir ${v.texto} Como ...`);
      x = { tipo: null }; vars.set(v.nombre, x);
    }
    if (x.tipo === 'entero') {
      if (typeof valor !== 'number') err(n, `No coinciden los tipos: "${v.texto}" es Entero y se le quiere guardar ${formatear(valor)}.`);
      if (!Number.isInteger(valor)) err(n, `"${v.texto}" es Entero y no puede guardar ${formatear(valor)} (tiene decimales).`);
    } else if (x.tipo === 'real' && typeof valor !== 'number') err(n, `No coinciden los tipos: "${v.texto}" es Real y se le quiere guardar ${formatear(valor)}.`);
    else if (x.tipo === 'texto' && typeof valor !== 'string') valor = formatear(valor);
    else if (x.tipo === 'logico' && typeof valor !== 'boolean') err(n, `No coinciden los tipos: "${v.texto}" es Logico.`);
    x.valor = valor;
  };
  const leerVar = (n) => {
    const x = vars.get(n.vari);
    if (!x) err(n, `La variable "${n.texto}" no existe (¿está bien escrita?).`);
    if (x.valor === undefined) err(n, `La variable "${n.texto}" se usa sin tener un valor asignado.`);
    return x.valor;
  };
  const num = (n, v, que) => { if (typeof v !== 'number') err(n, `${que} necesita números y recibió ${formatear(v)}.`); return v; };
  const log = (n, v) => { if (typeof v !== 'boolean') err(n, `Se esperaba una condición (VERDADERO o FALSO) y se obtuvo ${formatear(v)}.`); return v; };

  const FN = {
    RC: (n, a) => { if (num(n, a, 'RC') < 0) err(n, 'No se puede sacar raíz de un número negativo.'); return Math.sqrt(a); },
    RAIZ: (n, a) => FN.RC(n, a),
    ABS: (n, a) => Math.abs(num(n, a, 'ABS')), LN: (n, a) => Math.log(num(n, a, 'LN')), EXP: (n, a) => Math.exp(num(n, a, 'EXP')),
    SEN: (n, a) => Math.sin(num(n, a, 'SEN')), COS: (n, a) => Math.cos(num(n, a, 'COS')), TAN: (n, a) => Math.tan(num(n, a, 'TAN')),
    TRUNC: (n, a) => Math.trunc(num(n, a, 'TRUNC')), REDON: (n, a) => Math.round(num(n, a, 'REDON')),
    AZAR: (n, a) => Math.floor(Math.random() * num(n, a, 'AZAR')),
    ALEATORIO: (n, a, b) => num(n, a, 'ALEATORIO') + Math.floor(Math.random() * (num(n, b, 'ALEATORIO') - a + 1)),
    LONGITUD: (n, s) => String(s).length, MAYUSCULAS: (n, s) => String(s).toUpperCase(), MINUSCULAS: (n, s) => String(s).toLowerCase(),
    SUBCADENA: (n, s, a, b) => String(s).slice(num(n, a, 'SUBCADENA') - 1, num(n, b, 'SUBCADENA')),
    CONCATENAR: (n, a, b) => String(a) + String(b),
    CONVERTIRANUMERO: (n, s) => { const x = Number(String(s).replace(',', '.')); if (Number.isNaN(x)) err(n, `"${s}" no es un número.`); return x; },
    CONVERTIRATEXTO: (n, x) => formatear(x),
  };

  function ev(n) {
    if ('lit' in n) return n.lit;
    if ('vari' in n) return leerVar(n);
    if ('fn' in n) {
      const f = FN[n.fn]; if (!f) err(n, `La función "${n.texto}" no existe.`);
      return f(n, ...n.args.map(ev));
    }
    if (n.op === 'NEG') return -num(n, ev(n.a), 'El signo -');
    if (n.op === 'NO') return !log(n, ev(n.a));
    if (n.op === 'Y') return log(n, ev(n.a)) && log(n, ev(n.b));
    if (n.op === 'O') return log(n, ev(n.a)) || log(n, ev(n.b));
    const a = ev(n.a); const b = ev(n.b);
    switch (n.op) {
      case '+': if (typeof a === 'string' || typeof b === 'string') return formatear(a) + formatear(b); return num(n, a, 'La suma') + num(n, b, 'La suma');
      case '-': return num(n, a, 'La resta') - num(n, b, 'La resta');
      case '*': return num(n, a, 'La multiplicación') * num(n, b, 'La multiplicación');
      case '/': if (num(n, b, 'La división') === 0) err(n, 'División por cero.'); return num(n, a, 'La división') / b;
      case 'MOD': if (!Number.isInteger(num(n, a, 'MOD')) || !Number.isInteger(num(n, b, 'MOD'))) err(n, 'MOD solo funciona con números enteros.'); if (b === 0) err(n, 'MOD por cero.'); return a % b;
      case '^': return Math.pow(num(n, a, 'La potencia'), num(n, b, 'La potencia'));
      case '=': return a === b; case '<>': return a !== b;
      case '<': return a < b; case '>': return a > b; case '<=': return a <= b; case '>=': return a >= b;
      default: err(n, 'Operación desconocida.');
    }
  }

  function correr(lista) { for (const n of lista) paso(n); }
  function paso(n) {
    if (++pasos > MAX_PASOS) err(n, 'El programa no termina: parece un ciclo infinito. Revisa la condición del ciclo.');
    switch (n.tipo) {
      case 'Definir':
        for (const v of n.vars) {
          if (vars.has(v.nombre) && vars.get(v.nombre).tipo) err(n, `La variable "${v.texto}" ya fue definida.`);
          vars.set(v.nombre, { tipo: n.dato, valor: undefined });
        }
        return;
      case 'Leer':
        for (const v of n.vars) {
          if (!cola.length) { const e = new ErrorPS(n.linea, 'El programa pide más datos (Leer) de los que tiene la prueba.'); e.faltaDato = true; throw e; }
          const txt = cola.shift().trim();
          const x = vars.get(v.nombre);
          const tipo = x?.tipo;
          let valor;
          if (tipo === 'texto') valor = txt;
          else if (tipo === 'logico') { const u = clave(txt); if (u !== 'VERDADERO' && u !== 'FALSO') err(n, `Se esperaba VERDADERO o FALSO y se ingresó "${txt}".`); valor = u === 'VERDADERO'; }
          else {
            const nro = Number(txt.replace(',', '.'));
            if (tipo && Number.isNaN(nro)) err(n, `Se esperaba un número para "${v.texto}" y se ingresó "${txt}".`);
            valor = Number.isNaN(nro) || txt === '' ? txt : nro;
            if (tipo === 'entero' && !Number.isInteger(valor)) err(n, `"${v.texto}" es Entero y se ingresó ${txt}.`);
          }
          asignar(v, valor, n);
        }
        return;
      case 'Escribir':
        linea += n.exprs.map((e) => formatear(ev(e))).join('');
        if (n.saltar) { salida.push(linea); linea = ''; }
        return;
      case 'Asignar': asignar(n.v, ev(n.e), n); return;
      case 'Si': correr(log(n, ev(n.cond)) ? n.entonces : n.sino); return;
      case 'Mientras': while (log(n, ev(n.cond))) { correr(n.cuerpo); if (++pasos > MAX_PASOS) err(n, 'El programa no termina: parece un ciclo infinito. Revisa la condición del Mientras.'); } return;
      case 'Repetir':
        do { correr(n.cuerpo); if (++pasos > MAX_PASOS) err(n, 'El programa no termina: parece un ciclo infinito. Revisa la condición del Repetir.'); }
        while (n.hasta ? !log(n, ev(n.cond)) : log(n, ev(n.cond)));
        return;
      case 'Para': {
        const desde = num(n, ev(n.desde), 'El Para'); const hasta = num(n, ev(n.hasta), 'El Para');
        const pasoV = n.paso ? num(n, ev(n.paso), 'El paso del Para') : (hasta >= desde ? 1 : -1);
        if (pasoV === 0) err(n, 'El paso del Para no puede ser 0.');
        asignar(n.v, desde, n);
        while (pasoV > 0 ? vars.get(n.v.nombre).valor <= hasta : vars.get(n.v.nombre).valor >= hasta) {
          correr(n.cuerpo);
          asignar(n.v, vars.get(n.v.nombre).valor + pasoV, n);
          if (++pasos > MAX_PASOS) err(n, 'El programa no termina: parece un ciclo infinito.');
        }
        return;
      }
      case 'Segun': {
        const v = ev(n.valor);
        const caso = n.casos.find((c) => c.valores.some((e) => ev(e) === v));
        correr(caso ? caso.cuerpo : (n.otro || []));
        return;
      }
      default: err(n, 'Instrucción desconocida.');
    }
  }

  try { correr(ast); return fin(null); }
  catch (e) {
    if (!(e instanceof ErrorPS)) throw e;
    return fin({ linea: e.linea ?? null, mensaje: e.message, faltaDato: !!e.faltaDato });
  }
}

// ── Estructura usada (para exigir, por ejemplo, un Mientras) ──────────────────────────────────────
export function estructuras(codigo) {
  const usadas = new Set();
  const rec = (lista) => lista.forEach((n) => {
    usadas.add(n.tipo);
    ['entonces', 'sino', 'cuerpo', 'otro'].forEach((k) => n[k] && rec(n[k]));
    (n.casos || []).forEach((c) => rec(c.cuerpo));
  });
  rec(parsear(codigo));
  return usadas;
}

// ── Validador ─────────────────────────────────────────────────────────────────────────────────────
// ejercicio = { casos: [{ entrada: ['5','3'], salida: '8', oculto, contiene: ['pocas vidas'], excluye: ['eliminado'] }],
//               comparar: 'numeros' | 'texto' | 'palabras', requiere: ['Mientras'], exigirDefinir }
// 'palabras': la salida debe tener las frases de contiene (palabras completas, sin importar mayusculas ni tildes) y ninguna de excluye;
//             si el caso trae ademas salida con numeros, tambien deben coincidir los ultimos numeros mostrados.
// 'numeros' compara solo los numeros y VERDADERO/FALSO que muestra el programa (asi "La suma es: 8" y "8" valen igual).
const valoresDe = (txt) => (String(txt).match(/-?\d+(?:[.,]\d+)?|\bVERDADERO\b|\bFALSO\b/gi) || [])
  .map((x) => (/^[a-z]/i.test(x) ? x.toUpperCase() : String(Number(x.replace(',', '.')))));
// Los mensajes que piden datos ("Ingrese el número 1:") van antes del resultado: se comparan los ULTIMOS valores mostrados
const terminaCon = (obt, esp) => esp.length > 0 && obt.length >= esp.length && obt.slice(-esp.length).join('|') === esp.join('|');
const unaLinea = (txt) => String(txt).split('\n').filter((l) => l.trim()).join(' / ');
const normal = (txt) => ` ${sinTildes(String(txt)).toLowerCase().replace(/[^a-z0-9ñ]+/g, ' ').trim()} `;
const tieneFrase = (txt, frase) => normal(txt).includes(normal(frase));
const pasaPalabras = (salida, c) => (c.contiene || []).every((f) => tieneFrase(salida, f)) && !(c.excluye || []).some((f) => tieneFrase(salida, f))
  && (!c.salida || terminaCon(valoresDe(salida), valoresDe(c.salida)));
const textoDe = (txt) => String(txt).split('\n').map((l) => l.trim().replace(/\s+/g, ' ')).filter(Boolean).join('\n').toLowerCase();

export function validar(codigo, ejercicio) {
  if (!String(codigo).trim()) return { correcto: false, mensaje: 'Escribe tu programa antes de comprobar.', casos: [] };
  let usadas;
  try { usadas = estructuras(codigo); }
  catch (e) { return { correcto: false, mensaje: `Línea ${e.linea}: ${e.message}`, linea: e.linea, casos: [] }; }
  for (const r of ejercicio.requiere || []) {
    if (!usadas.has(r)) return { correcto: false, mensaje: `El ejercicio pide usar ${r}. Tu programa todavía no lo usa.`, casos: [] };
  }
  const casos = ejercicio.casos.map((c) => {
    const r = ejecutar(codigo, c.entrada || [], { exigirDefinir: ejercicio.exigirDefinir });
    const bien = !r.error && (ejercicio.comparar === 'texto'
      ? textoDe(r.salida) === textoDe(c.salida)
      : ejercicio.comparar === 'palabras' ? pasaPalabras(r.salida, c)
        : terminaCon(valoresDe(r.salida), valoresDe(c.salida)));
    return { ...c, obtenido: r.salida, error: r.error, bien };
  });
  const malo = casos.find((c) => !c.bien);
  if (!malo) return { correcto: true, mensaje: `¡Correcto! Tu programa pasó las ${casos.length} pruebas.`, casos };
  const n = casos.filter((c) => c.bien).length;
  const conEntrada = malo.oculto ? 'En una prueba oculta' : `Con la entrada ${(malo.entrada || []).join(', ') || '(sin datos)'}`;
  const mensaje = malo.error
    ? `${conEntrada}, línea ${malo.error.linea}: ${malo.error.mensaje}`
    : malo.oculto
      ? `${conEntrada} tu programa no dio el resultado correcto. Revisa que funcione con cualquier dato, no solo con el ejemplo.`
      : `${conEntrada} tu programa mostró «${unaLinea(malo.obtenido) || '(nada)'}» y se esperaba «${malo.espera || malo.salida}».`;
  return { correcto: false, mensaje: `${mensaje} (${n} de ${casos.length} pruebas bien)`, linea: malo.error?.linea, casos };
}
