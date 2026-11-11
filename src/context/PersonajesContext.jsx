import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { consultarPersonajes } from '../supabase/personajes.js';
import { ANIMO_GUIA, GUIA_PRIMER_PLANO, PRESENTACION_JUGABLE, PRESENTACION_POR_DEFECTO, PERSONAJES_RETIRADOS } from '../datos/personajes.js';

// Carga UNA vez la tabla `personaje` de Supabase y la comparte con todo el juego.
// jugables: tarjetas de seleccion / avatar / muneco del mapa. guias: Capyhein en sus distintos animos.
const Ctx = createContext(null);

const aJugable = (p) => {
  const x = PRESENTACION_JUGABLE[p.id] || PRESENTACION_POR_DEFECTO;
  return { id: p.id, nombre: x.etiqueta || p.nombre.toUpperCase(), imagen: p.imagen_url, mini: p.imagen_mini_url || p.imagen_url, ...x };
};

// Las imagenes del guia viven en Supabase Storage: se descargan y decodifican apenas se conoce la tabla,
// y se guardan en memoria, para que el cambio de animo al confirmar una respuesta sea inmediato.
const retenidas = [];
function precargarGuias(filas) {
  filas.filter((p) => p.tipo === 'guia' && p.imagen_url).forEach((p) => {
    if (retenidas.some((i) => i.src === p.imagen_url)) return;
    const img = new Image();
    img.decoding = 'sync';
    img.src = p.imagen_url;
    img.decode?.().catch(() => {});
    retenidas.push(img);
  });
}

export function PersonajesProvider({ children }) {
  const [filas, setFilas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  const cargar = useCallback(async () => {
    setCargando(true); setError(null);
    try { const r = await consultarPersonajes(); precargarGuias(r); setFilas(r); }
    catch (e) { console.warn('[Supabase] personaje:', e?.message || e); setError(e); }
    finally { setCargando(false); }
  }, []);
  useEffect(() => { cargar(); }, [cargar]);

  const valor = useMemo(() => {
    const jugables = filas.filter((p) => p.tipo === 'jugable' && p.imagen_url && !PERSONAJES_RETIRADOS.includes(p.id)).map(aJugable);
    const porId = (id) => jugables.find((p) => p.id === id) || null;
    // Imagen del guia segun el animo ("serio" por defecto; "primerPlano" = CapyheinSerio). null si la tabla aun no la tiene.
    const imagenGuia = (animo = 'serio') => {
      const id = animo === 'primerPlano' ? GUIA_PRIMER_PLANO : ANIMO_GUIA[animo] || ANIMO_GUIA.serio;
      return filas.find((p) => p.id === id)?.imagen_url || null;
    };
    // Imagen de cualquier personaje de la tabla por su id (null si no esta)
    const imagenDe = (id) => filas.find((p) => p.id === id)?.imagen_url || null;
    return { jugables, porId, imagenGuia, imagenDe, cargando, error, recargar: cargar };
  }, [filas, cargando, error, cargar]);

  return <Ctx.Provider value={valor}>{children}</Ctx.Provider>;
}

export function usePersonajes() {
  const v = useContext(Ctx);
  if (!v) throw new Error('usePersonajes debe usarse dentro de <PersonajesProvider>');
  return v;
}
