import { useEffect, useState } from 'react';
import { cargarNivelRemoto } from '../supabase/niveles.js';
import { supabaseConfigurado } from '../supabase/cliente.js';
import { CURSOS } from '../datos/cursos';

// Lecciones de los niveles 1, 2, 3 y 5 del mundo 1 leidas de Supabase. remotos[i] es null mientras carga o si no estan
// disponibles (en ese caso se usa la copia local, que es identica). Se leen una sola vez por visita.
const INDICES = [0, 1, 2, 4];                             // niveles 1, 2, 3 y 5 (el 4 solo esta en el juego)
let cache = null;
let enCurso = null;

const cargar = () => Promise.all(INDICES.map((i) => {
  const lecs = CURSOS[0].niveles[i].lecciones;
  const esperado = { preguntas: lecs.map((l) => l.ejercicios.length), sinTeoria: lecs.map((l) => !l.teoria?.length) };
  return cargarNivelRemoto(i + 1, esperado).catch((e) => { console.warn(`[Supabase] nivel ${i + 1}:`, e?.message || e); return null; });
}));

export function useNivelesRemotos() {
  const [remotos, setRemotos] = useState(cache || {});
  useEffect(() => {
    if (cache || !supabaseConfigurado) return undefined;
    let vivo = true;
    enCurso = enCurso || cargar();
    enCurso.then((r) => {
      const obj = {}; INDICES.forEach((i, k) => { if (r[k]) obj[i] = r[k]; });
      cache = obj;
      if (vivo) setRemotos(obj);
    });
    return () => { vivo = false; };
  }, []);
  return remotos;
}
