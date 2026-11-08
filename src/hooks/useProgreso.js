import { useRef, useState } from 'react';
import { CURSOS } from '../datos/cursos';
import { registrarLeccion, usarComodinServidor } from '../supabase/usuarios.js';
import { puntosLeccion, estrellasLeccion, validarIntentos } from '../servicios/puntuacion.js';
import { COMODINES_MAX, comodinesSeguros, rachaSegura } from '../servicios/validaciones.js';
import { aplicarNivelCompletado, fechaLocal } from '../servicios/racha.js';

// hechos[cid][nivelIdx] = { lecciones: [0, 3, 2, 0, 0], completado: false }   (0 = no hecha, 1..3 = estrellas)
//
// USUARIO REGISTRADO: todo viene de Supabase. El estado inicial es lo que devolvio estado_jugador() al iniciar sesion
// (sesion.db.estado) y cada leccion o comodin se registra con una funcion del servidor, que valida, da los puntos una
// sola vez y devuelve el estado real. Nada depende de localStorage ni de variables locales: al cerrar sesion, recargar o
// entrar desde otro dispositivo el progreso es el mismo.
// INVITADO: el avance vive solo en esta pestana (sessionStorage) y no se guarda en la base.

export const LIMITE_COMODINES_UNIDAD_INVITADO = 5;      // igual que unidad.limite_comodines de la primera unidad
const unidadDe = (cid) => Math.max(1, CURSOS.findIndex((c) => c.id === cid) + 1);

// Convierte el estado del servidor a la estructura que usa el mapa.
export function hechosDeEstado(estado) {
  const hechos = {};
  const nivelDe = (u, n) => {
    const curso = CURSOS[u - 1];
    const def = curso?.niveles?.[n - 1];
    if (!def) return null;
    hechos[curso.id] ||= {};
    return (hechos[curso.id][n - 1] ||= { lecciones: Array(def.lecciones.length).fill(0), completado: false });
  };
  (estado?.lecciones || []).forEach((l) => { const x = nivelDe(l.unidad, l.nivel); if (x && l.leccion >= 1 && l.leccion <= x.lecciones.length) x.lecciones[l.leccion - 1] = l.estrellas; });
  (estado?.niveles || []).forEach((n) => {
    const x = nivelDe(n.unidad, n.nivel);
    if (x && n.completado) { x.completado = true; x.lecciones = x.lecciones.map((e) => e || 1); }   // un nivel completo tiene todas sus lecciones hechas
  });
  return hechos;
}

function usosDeEstado(estado) {
  const usos = {};
  (estado?.comodines_unidad || []).forEach((u) => { usos[u.unidad] = { usados: u.usados, limite: u.limite }; });
  return usos;
}

function estadoInicial(sesion, almacen, KEY) {
  const e = sesion?.db?.estado;
  if (sesion && !sesion.invitado && sesion.id) {
    return {
      hechos: hechosDeEstado(e), xp: e?.puntos ?? sesion.db?.puntos ?? 0, com: comodinesSeguros(e?.comodines ?? 3),
      racha: rachaSegura(e?.racha ?? 0), rachaMax: rachaSegura(e?.racha_max ?? 0), usos: usosDeEstado(e), error: null,
    };
  }
  let local = {};
  try { local = JSON.parse(almacen.getItem(KEY)) || {}; } catch { /* sin datos */ }
  return { hechos: {}, xp: 0, com: 3, racha: 0, rachaMax: 0, ultimo: null, usos: {}, ...local, error: null };
}

const esperar = (ms) => new Promise((r) => setTimeout(r, ms));

export function useProgreso(sesion) {
  const registrado = !!sesion && !sesion.invitado && !!sesion.id;
  const invitado = !!sesion?.invitado;
  const KEY = 'wna-v4-invitado';
  const [p, setP] = useState(() => estadoInicial(sesion, sessionStorage, KEY));
  const pRef = useRef(p);
  pRef.current = p;

  // Solo el invitado se recuerda (en su pestana); el usuario registrado se recupera siempre de Supabase.
  const poner = (siguiente) => {
    pRef.current = siguiente;
    setP(siguiente);
    if (invitado) { try { sessionStorage.setItem(KEY, JSON.stringify(siguiente)); } catch { /* sin storage */ } }
  };

  const limiteUnidad = (cid) => p.usos[unidadDe(cid)]?.limite ?? LIMITE_COMODINES_UNIDAD_INVITADO;
  const usadosUnidad = (cid) => p.usos[unidadDe(cid)]?.usados ?? 0;

  // Marca la leccion en el mapa y aplica a la vez lo que cambio (estrellas, nivel completado).
  const conLeccion = (s, cid, nivelIdx, leccionIdx, estrellas, nivelCompleto) => {
    const nivel = s.hechos[cid]?.[nivelIdx] || { lecciones: Array(CURSOS.find((c) => c.id === cid).niveles[nivelIdx].lecciones.length).fill(0), completado: false };
    const lecciones = [...nivel.lecciones]; lecciones[leccionIdx] = Math.max(lecciones[leccionIdx] || 0, estrellas);
    return { ...s.hechos, [cid]: { ...s.hechos[cid], [nivelIdx]: { lecciones, completado: nivel.completado || nivelCompleto } } };
  };

  // Termina una leccion. intentos = un numero por pregunta (1 a 4, o 0 si no acerto). Devuelve el resultado REAL:
  // { puntos_otorgados, leccion_nueva, nivel_completado_ahora, estrellas, puntos, racha, racha_max, comodines }
  const completar = async (cid, nivelIdx, leccionIdx, intentos) => {
    validarIntentos(intentos);
    const s = pRef.current;
    const estrellas = estrellasLeccion(intentos);

    if (!registrado) {                                        // invitado: calculo local, nada se guarda en la base
      const previa = s.hechos[cid]?.[nivelIdx]?.lecciones?.[leccionIdx] || 0;
      const nueva = previa === 0;
      const ganados = nueva ? puntosLeccion(intentos) : 0;
      const hechos = conLeccion(s, cid, nivelIdx, leccionIdx, estrellas, false);
      const completo = hechos[cid][nivelIdx].lecciones.every((l) => l > 0);
      const antes = !!s.hechos[cid]?.[nivelIdx]?.completado;
      let sig = { ...s, hechos, xp: s.xp + ganados };
      const ahora = completo && !antes;
      if (ahora) {
        hechos[cid][nivelIdx].completado = true;
        sig = { ...sig, hechos, com: Math.min(COMODINES_MAX, s.com + 1), ...aplicarNivelCompletado({ racha: s.racha, rachaMax: s.rachaMax, ultimo: s.ultimo }, fechaLocal()) };
        sig.racha = rachaSegura(sig.racha); sig.rachaMax = rachaSegura(sig.rachaMax);
      }
      poner(sig);
      return { puntos_otorgados: ganados, leccion_nueva: nueva, nivel_completado_ahora: ahora, estrellas, puntos: sig.xp, racha: sig.racha, racha_max: sig.rachaMax, comodines: sig.com };
    }

    // registrado: el servidor valida y da los puntos una sola vez; hasta 3 reintentos si falla la conexion
    let r = null, fallo = null;
    for (let i = 0; i < 3 && !r; i++) {
      try { r = await registrarLeccion(unidadDe(cid), nivelIdx + 1, leccionIdx + 1, intentos); }
      catch (e) { fallo = e; if (i < 2) await esperar(600 * (i + 1)); }
    }
    if (!r) {
      console.warn('[Supabase] No se pudo guardar la leccion:', fallo?.message || fallo);
      poner({ ...pRef.current, error: 'No se pudo guardar tu progreso. Revisa tu conexión e inténtalo de nuevo.' });
      throw fallo;
    }
    const cur = pRef.current;
    poner({
      ...cur, error: null,
      hechos: conLeccion(cur, cid, nivelIdx, leccionIdx, r.estrellas, !!r.nivel_completado_ahora),
      xp: r.puntos, racha: rachaSegura(r.racha), rachaMax: rachaSegura(r.racha_max), com: comodinesSeguros(r.comodines),
    });
    return r;
  };

  // Usa un comodin. Devuelve { ok } o { ok: false, razon: 'limite' | 'sin_comodines' | 'error' }.
  const usarComodin = async (cid) => {
    const s = pRef.current;
    const unidad = unidadDe(cid);
    if (!registrado) {                                        // invitado: mismas reglas, solo en esta pestana
      const usados = s.usos[unidad]?.usados ?? 0;
      if (usados >= LIMITE_COMODINES_UNIDAD_INVITADO) return { ok: false, razon: 'limite' };
      if (s.com <= 0) return { ok: false, razon: 'sin_comodines' };
      poner({ ...s, com: s.com - 1, usos: { ...s.usos, [unidad]: { usados: usados + 1, limite: LIMITE_COMODINES_UNIDAD_INVITADO } } });
      return { ok: true };
    }
    const r = await usarComodinServidor(unidad);              // el servidor descuenta y cuenta el uso de forma atomica
    const cur = pRef.current;
    const limite = r.limite ?? cur.usos[unidad]?.limite ?? LIMITE_COMODINES_UNIDAD_INVITADO;
    if (r.ok) poner({ ...cur, com: comodinesSeguros(r.disponibles), usos: { ...cur.usos, [unidad]: { usados: r.usados, limite } } });
    else if (r.razon === 'limite') poner({ ...cur, usos: { ...cur.usos, [unidad]: { usados: limite, limite } } });   // queda bloqueado
    else if (r.razon === 'sin_comodines') poner({ ...cur, com: 0 });
    return r;
  };

  // Solo el invitado puede reiniciar: el progreso de un usuario registrado vive en la base de datos y no se borra desde aqui.
  const reiniciar = () => {
    if (registrado) return;
    poner({ hechos: {}, xp: 0, com: 3, racha: 0, rachaMax: 0, ultimo: null, usos: {}, error: null });
  };

  return { p, completar, usarComodin, reiniciar, limiteUnidad, usadosUnidad };
}
