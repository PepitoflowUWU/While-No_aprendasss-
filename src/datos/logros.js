// CATALOGO DE LOGROS. Es la unica fuente: de aqui sale el panel de logros y tambien database/migraciones/20_logros.sql (con sus metas), que es lo que
// la base usa para comprobar que de verdad se cumplio un logro antes de entregarlo.
// metrica: dato del jugador que se compara con la meta (ver metricasDe). icono: dibujo del logro.
export const LOGROS = [
  { codigo: 'primera_leccion',   nombre: 'Primer paso',            descripcion: 'Completa tu primera lección',          metrica: 'lecciones_completadas', meta: 1,    icono: 'libro' },
  { codigo: 'diez_lecciones',    nombre: 'Aprendiz constante',     descripcion: 'Completa 10 lecciones',                metrica: 'lecciones_completadas', meta: 10,   icono: 'libro' },
  { codigo: 'veinticinco_lecciones', nombre: 'Estudiante dedicado', descripcion: 'Completa 25 lecciones',               metrica: 'lecciones_completadas', meta: 25,   icono: 'libro' },
  { codigo: 'primer_nivel',      nombre: 'Nivel superado',         descripcion: 'Completa tu primer nivel',             metrica: 'niveles_completados',   meta: 1,    icono: 'bandera' },
  { codigo: 'tres_niveles',      nombre: 'Camino recorrido',       descripcion: 'Completa 3 niveles',                   metrica: 'niveles_completados',   meta: 3,    icono: 'bandera' },
  { codigo: 'mundo_completo',    nombre: 'Maestro del mundo 1',    descripcion: 'Completa los 7 niveles',               metrica: 'niveles_completados',   meta: 7,    icono: 'trofeo' },
  { codigo: 'estrellas_3',       nombre: 'Cazador de estrellas',   descripcion: 'Suma 3 estrellas en tus niveles',      metrica: 'estrellas_total',       meta: 3,    icono: 'estrella' },
  { codigo: 'estrellas_9',       nombre: 'Lluvia de estrellas',    descripcion: 'Suma 9 estrellas en tus niveles',      metrica: 'estrellas_total',       meta: 9,    icono: 'estrella' },
  { codigo: 'estrellas_21',      nombre: 'Constelación',           descripcion: 'Consigue las 21 estrellas (3 por nivel)', metrica: 'estrellas_total',    meta: 21,   icono: 'estrella' },
  { codigo: 'perfecto_5',        nombre: 'Perfeccionista',         descripcion: 'Termina 5 lecciones con 3 estrellas',  metrica: 'lecciones_perfectas',   meta: 5,    icono: 'trofeo' },
  { codigo: 'racha_3',           nombre: 'Constancia',             descripcion: 'Llega a 3 días de racha',              metrica: 'racha_maxima',          meta: 3,    icono: 'llama' },
  { codigo: 'racha_7',           nombre: 'Imparable',              descripcion: 'Llega a 7 días de racha',              metrica: 'racha_maxima',          meta: 7,    icono: 'llama' },
  { codigo: 'xp_100',            nombre: 'Primeros puntos',        descripcion: 'Reúne 100 XP',                         metrica: 'puntaje_total',         meta: 100,  icono: 'rayo' },
  { codigo: 'xp_500',            nombre: 'Aprendiz de algoritmos', descripcion: 'Reúne 500 XP',                         metrica: 'puntaje_total',         meta: 500,  icono: 'rayo' },
  { codigo: 'xp_1000',           nombre: 'Experto en algoritmos',  descripcion: 'Reúne 1000 XP',                        metrica: 'puntaje_total',         meta: 1000, icono: 'rayo' },
  { codigo: 'primer_comodin',    nombre: 'Pidiendo ayuda',         descripcion: 'Usa un comodín por primera vez',       metrica: 'comodines_usados',      meta: 1,    icono: 'carta' },
];

export const METRICAS = ['lecciones_completadas', 'niveles_completados', 'estrellas_total', 'lecciones_perfectas', 'puntaje_total', 'racha_maxima', 'comodines_usados'];

// Estrellas de un NIVEL (las que se ven en el mapa, de 1 a 3): 0 si aun no lo completo; si lo completo, el promedio de las
// estrellas de sus lecciones redondeado. Las estrellas de cada leccion NO se suman aparte.
export function estrellasDeNivel(n) {
  if (!n?.completado) return 0;
  const l = n.lecciones || [];
  return Math.max(1, Math.min(3, Math.round(l.reduce((a, b) => a + b, 0) / (l.length || 1))));
}

// Datos del jugador que miden los logros, calculados con lo que ya tiene el juego (para un usuario registrado todo viene de la base).
// hechos[curso][nivel] = { lecciones: [0..3 estrellas por leccion], completado }
export function metricasDe(p = {}) {
  const niveles = Object.values(p.hechos || {}).flatMap((h) => Object.values(h || {}));
  const lecciones = niveles.flatMap((n) => n.lecciones || []);
  return {
    lecciones_completadas: lecciones.filter((e) => e > 0).length,
    niveles_completados: niveles.filter((n) => n.completado).length,
    estrellas_total: niveles.reduce((a, n) => a + estrellasDeNivel(n), 0),          // estrellas de los niveles completados (no las de cada leccion)
    lecciones_perfectas: lecciones.filter((e) => e === 3).length,
    puntaje_total: Math.max(0, p.xp || 0),
    racha_maxima: Math.max(0, p.rachaMax || 0),
    comodines_usados: Object.values(p.usos || {}).reduce((a, u) => a + Math.max(0, u?.usados || 0), 0),
  };
}

// Catalogo + avance de este jugador. reclamados: conjunto de codigos ya entregados.
export function itemsDeLogros(p, reclamados = new Set()) {
  const m = metricasDe(p);
  return LOGROS.map((l) => {
    const actual = m[l.metrica] || 0;
    const completo = actual >= l.meta;
    const reclamado = reclamados.has(l.codigo) && completo;       // un logro solo cuenta como obtenido si de verdad se cumple
    return { ...l, actual, valor: Math.min(actual, l.meta), completo, reclamado, reclamable: completo && !reclamado };
  });
}

// Orden del panel: primero los que se pueden reclamar, luego los que van en camino (los mas avanzados primero) y al final los obtenidos.
export function ordenarLogros(items) {
  const rango = (i) => (i.reclamable ? 0 : i.reclamado ? 2 : 1);
  return [...items].sort((a, b) => rango(a) - rango(b) || (rango(a) === 1 ? b.valor / b.meta - a.valor / a.meta : 0));
}
