// Perfil, progreso, puntos, rachas, comodines y preferencias del usuario REGISTRADO.
// IMPORTANTE: puntos, rachas, comodines, lecciones y niveles NO se escriben desde aqui con insert/update. El navegador
// solo puede LEER lo suyo; todo cambio pasa por funciones de la base (database/migraciones/11): registrar_leccion y usar_comodin, que
// validan, evitan puntos duplicados y son atomicas. Asi nadie puede alterarlos con una solicitud directa.
import { misPermisos } from './admin.js';
import { cliente } from './cliente';
import { validarIntentos } from '../servicios/puntuacion.js';
import { esEntero } from '../servicios/validaciones.js';

const cacheNiveles = new Map();

// Nivel N (1, 2, ...) de la unidad 1, buscado por su POSICION. null si no existe.
export async function idNivel(orden) {
  if (cacheNiveles.has(orden)) return cacheNiveles.get(orden);
  let id = null;
  try {
    const { data } = await cliente()
      .from('nivel').select('id, orden, unidad!inner(orden)')
      .eq('orden', orden).eq('unidad.orden', 1).limit(1);
    id = data?.[0]?.id || null;
  } catch { id = null; }
  if (id) cacheNiveles.set(orden, id);
  return id;
}

async function rpc(nombre, args) {
  const { data, error } = await cliente().rpc(nombre, args);
  if (error) throw error;
  return data;
}

// ── Progreso ────────────────────────────────────────────────────────────────────────────────────────────────────
// Todo el estado del jugador guardado en Supabase (puntos, racha, comodines, lecciones, niveles y usos por unidad).
// Se completan las filas iniciales que falten y la racha vigente se actualiza (vuelve a 0 si paso un dia sin completar niveles).
export async function cargarEstado() {
  await rpc('asegurar_datos_iniciales');
  await rpc('sincronizar_racha');
  return rpc('estado_jugador');
}

// Registra una leccion terminada. intentos = un numero por pregunta (1 a 4 = intento en que acerto; 0 = no acerto en 4).
// Devuelve lo que el SERVIDOR otorgo: { puntos_otorgados, leccion_nueva, nivel_completado_ahora, estrellas, puntos, racha, racha_max, comodines }.
export async function registrarLeccion(unidad, nivel, leccion, intentos) {
  [unidad, nivel, leccion].forEach((n) => { if (!esEntero(n) || n < 1) throw new RangeError('Unidad, nivel y leccion deben ser enteros desde 1.'); });
  validarIntentos(intentos);
  const r = await rpc('registrar_leccion', { p_unidad_orden: unidad, p_nivel_orden: nivel, p_leccion_orden: leccion, p_intentos: intentos });
  // Se comprueba la respuesta: nunca se muestran ni se guardan en pantalla valores que el servidor no devolvio bien
  const campos = ['puntos_otorgados', 'puntos', 'racha', 'racha_max', 'comodines', 'estrellas'];
  if (!r || typeof r !== 'object' || campos.some((c) => !esEntero(r[c]))) throw new Error('Respuesta inesperada del servidor al registrar la leccion.');
  return r;
}

// Usa un comodin. { ok: true, disponibles, usados, limite } o { ok: false, razon: 'limite' | 'sin_comodines' | 'error' }.
export async function usarComodinServidor(unidad) {
  if (!esEntero(unidad) || unidad < 1) throw new RangeError('La unidad debe ser un entero desde 1.');
  try {
    const r = await rpc('usar_comodin', { p_unidad_orden: unidad });
    if (!r || ['disponibles', 'usados', 'limite'].some((c) => !esEntero(r[c]))) throw new Error('Respuesta inesperada del servidor al usar el comodin.');
    return { ok: true, ...r };
  } catch (e) {
    const m = `${e?.message || ''}`;
    if (m.includes('LIMITE_COMODINES_UNIDAD')) return { ok: false, razon: 'limite' };
    if (m.includes('SIN_COMODINES')) return { ok: false, razon: 'sin_comodines' };
    console.warn('[Supabase] usar_comodin:', m);
    return { ok: false, razon: 'error' };
  }
}

// ── Perfil ──────────────────────────────────────────────────────────────────────────────────────────────────────
// Perfil completo del usuario registrado (o null si no tiene fila en `usuario`).
export async function cargarPerfil(userId) {
  const db = cliente();
  const { data: u, error } = await db.from('usuario').select('*').eq('id', userId).maybeSingle();
  if (error) throw error;
  if (!u) return null;

  const [conf, estado, permisos] = await Promise.all([
    db.from('configuracion_usuario').select('sonido_activado, musica_activada, animaciones_activadas').eq('usuario_id', userId).maybeSingle(),
    cargarEstado().catch((e) => { console.warn('[Supabase] No se pudo leer el progreso (¿falta ejecutar database/migraciones/11?):', e?.message || e); return null; }),
    // Opciones del rol (la corona del panel de administracion se ve si incluye panel_admin). [] si falta database/migraciones/18
    misPermisos().catch(() => []),
  ]);

  return {
    ...u,
    sonido_activado: conf.data?.sonido_activado ?? true,
    musica_activada: conf.data?.musica_activada ?? true,
    animaciones_activadas: conf.data?.animaciones_activadas ?? true,
    estado,                                       // null si la migracion 11 aun no se ejecuto
    permisos,
  };
}

// Aviso de que el jugador sigue en el juego: la base actualiza la ultima conexion y suma el tiempo jugado (latido, database/migraciones/18).
// Si esa funcion aun no existe, se guarda solo la ultima conexion como antes.
export async function registrarConexion(userId) {
  const { error: e1 } = await cliente().rpc('latido');
  if (!e1) return;
  if (e1.code !== 'PGRST202' && e1.code !== '42883' && !/could not find the function/i.test(e1.message || '')) throw e1;
  const { error } = await cliente().from('usuario').update({ ultima_conexion: new Date().toISOString() }).eq('id', userId);
  if (error) throw error;
}

// Preferencias en configuracion_usuario.
export async function guardarAnimaciones(userId, activadas) {
  const { error } = await cliente().from('configuracion_usuario').upsert(
    { usuario_id: userId, animaciones_activadas: activadas }, { onConflict: 'usuario_id' });
  if (error) throw error;
}

export async function guardarMusica(userId, activada) {
  const { error } = await cliente().from('configuracion_usuario').upsert(
    { usuario_id: userId, musica_activada: activada }, { onConflict: 'usuario_id' });
  if (error) throw error;
}
