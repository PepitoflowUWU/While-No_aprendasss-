// LECCION EN CURSO: donde se quedo el jugador en cada leccion empezada (database/migraciones/29_leccion_en_curso.sql).
// Se guarda en Supabase (sirve en cualquier dispositivo, aunque cierre sesion) y tambien en este navegador, por si la base aun
// no tiene la tabla o no hay conexion. Los invitados no guardan nada (su cuenta desaparece al salir). Al leer se toma la copia mas reciente.
import { cliente, supabaseConfigurado } from './cliente.js';

const LS = 'wna_leccion_en_curso_v1';
export const claveAvance = (curso, nivel, leccion) => `${curso}|${nivel}|${leccion}`;
const registrado = (sesion) => !!sesion?.id && !sesion.invitado;
const usaBase = (sesion) => supabaseConfigurado && registrado(sesion);

function leerLocal(uid) {
  try { return JSON.parse(localStorage.getItem(LS) || '{}')[uid] || {}; } catch { return {}; }
}
function escribirLocal(uid, mapa) {
  try {
    const todo = JSON.parse(localStorage.getItem(LS) || '{}');
    todo[uid] = mapa;
    localStorage.setItem(LS, JSON.stringify(todo));
  } catch { /* sin almacenamiento */ }
}
const avisar = (e) => console.warn('[Supabase] leccion en curso (¿falta ejecutar database/migraciones/29?):', e?.message || e);

// { 'curso|nivel|leccion': { curso, nivel, leccion, ejercicio, fallos, intentos, errores, directos, actualizado } }
export async function leerAvances(sesion) {
  if (!registrado(sesion)) return {};
  const uid = sesion.id;
  const mapa = { ...leerLocal(uid) };
  if (!usaBase(sesion)) return mapa;
  try {
    const { data, error } = await cliente().rpc('mis_lecciones_en_curso');
    if (error) throw error;
    (Array.isArray(data) ? data : []).forEach((a) => {
      const k = claveAvance(a.curso, a.nivel, a.leccion);
      if (!mapa[k] || new Date(a.actualizado) >= new Date(mapa[k].actualizado || 0)) mapa[k] = a;
    });
    escribirLocal(uid, mapa);
  } catch (e) { avisar(e); }
  return mapa;
}

export async function guardarAvance(sesion, a) {
  if (!registrado(sesion)) return;
  const uid = sesion.id;
  const fila = { ...a, actualizado: new Date().toISOString() };
  escribirLocal(uid, { ...leerLocal(uid), [claveAvance(a.curso, a.nivel, a.leccion)]: fila });
  if (!usaBase(sesion)) return;
  const { error } = await cliente().rpc('guardar_leccion_en_curso', {
    p_curso: a.curso, p_nivel: a.nivel, p_leccion: a.leccion, p_ejercicio: a.ejercicio, p_fallos: a.fallos,
    p_intentos: a.intentos, p_errores: a.errores, p_directos: a.directos,
  });
  if (error) avisar(error);
}

export async function borrarAvance(sesion, curso, nivel, leccion) {
  if (!registrado(sesion)) return;
  const uid = sesion.id;
  const mapa = leerLocal(uid);
  delete mapa[claveAvance(curso, nivel, leccion)];
  escribirLocal(uid, mapa);
  if (!usaBase(sesion)) return;
  const { error } = await cliente().rpc('borrar_leccion_en_curso', { p_curso: curso, p_nivel: nivel, p_leccion: leccion });
  if (error) avisar(error);
}
