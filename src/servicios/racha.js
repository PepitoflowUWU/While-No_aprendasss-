// Reglas de racha (funciones puras, sin tocar la base de datos).
// - La racha sube cuando el usuario completa al menos un nivel en un dia consecutivo.
// - Si pasa un dia completo sin completar ningun nivel, la racha actual vuelve a 0.
// - La racha maxima conserva el record y solo sube cuando la racha actual lo supera.

export const fechaLocal = (d = new Date()) => {
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
};

// Dias de calendario entre dos fechas 'YYYY-MM-DD' (b - a). Usa mediodia UTC para evitar saltos de horario.
export function diasEntre(a, b) {
  const t = (s) => { const [y, m, d] = s.split('-').map(Number); return Date.UTC(y, m - 1, d, 12); };
  return Math.round((t(b) - t(a)) / 86400000);
}

// Racha que sigue "viva" hoy: si la ultima actividad fue hace 2 dias o mas, ya se rompio.
export function rachaVigente({ racha = 0, ultimo = null }, hoy = fechaLocal()) {
  if (!ultimo) return 0;
  return diasEntre(ultimo, hoy) >= 2 ? 0 : racha;
}

// Efecto de completar un nivel hoy.
export function aplicarNivelCompletado({ racha = 0, rachaMax = 0, ultimo = null }, hoy = fechaLocal()) {
  const vigente = rachaVigente({ racha, ultimo }, hoy);
  const nueva = ultimo === hoy ? Math.max(vigente, 1) : vigente + 1;   // el mismo dia no suma dos veces
  return { racha: nueva, rachaMax: Math.max(rachaMax || 0, nueva), ultimo: hoy };
}

// Estado de conexion de un jugador a partir de su ultima conexion (ISO). "En linea" si fue hace menos de 4 minutos
// (el juego avisa cada 2 minutos mientras esta abierto).
export function estadoConexion(iso, ahora = Date.now()) {
  if (!iso) return { enLinea: false, texto: 'Sin conexión registrada' };
  const seg = Math.max(0, Math.floor((ahora - new Date(iso).getTime()) / 1000));
  if (seg < 240) return { enLinea: true, texto: 'En línea' };
  const min = Math.floor(seg / 60);
  if (min < 60) return { enLinea: false, texto: `Desconectado hace ${min} min` };
  const h = Math.floor(min / 60);
  if (h < 24) return { enLinea: false, texto: `Desconectado hace ${h} ${h === 1 ? 'hora' : 'horas'}` };
  const d = Math.floor(h / 24);
  return { enLinea: false, texto: `Desconectado hace ${d} ${d === 1 ? 'día' : 'días'}` };
}
