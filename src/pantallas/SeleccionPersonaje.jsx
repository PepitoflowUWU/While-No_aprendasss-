import { supabaseConfigurado } from '../supabase/cliente.js';
import React, { useEffect, useMemo, useState } from 'react';
import { PixelButton } from '../components/comun/UI.jsx';
import GameBackground from '../components/comun/GameBackground.jsx';
import PasoIndicador from '../components/comun/PasoIndicador.jsx';
import CharacterCard from '../components/personajes/CharacterCard.jsx';
import { usePersonajes } from '../context/PersonajesContext.jsx';
import { GRUPOS_PERSONAJE } from '../datos/personajes.js';
import '../estilos/seleccion.css';

// Pantalla "Character Select" en 2 pasos:
//  1) Chica o Chico (tarjeta del personaje base de cada grupo).
//  2) La version: la normal y la N (ChicaN / ChicoN). Al confirmar una, onPick guarda el personaje_id
//     en el estado global (App), que crea el perfil y entra al juego.
// Tocar una tarjeta solo la SELECCIONA; el boton CONFIRMAR es el que avanza (asi un toque sin querer no elige).
// En celulares (sin mouse) las tarjetas se ven a color y animadas desde que se abre la pantalla: alli no existe el "pasar el mouse".
const TACTIL = '(hover: none) and (pointer: coarse)';
function useTactil() {
  const [t, setT] = useState(() => window.matchMedia?.(TACTIL).matches ?? false);
  useEffect(() => {
    const mq = window.matchMedia?.(TACTIL);
    if (!mq) return undefined;
    const f = () => setT(mq.matches);
    mq.addEventListener('change', f);
    return () => mq.removeEventListener('change', f);
  }, []);
  return t;
}
// Explica la causa para que se pueda arreglar sin abrir la consola del navegador.
function motivoSinPersonajes(error) {
  if (!supabaseConfigurado) return 'Este despliegue no tiene las variables VITE_SUPABASE_URL y VITE_SUPABASE_PUBLISHABLE_KEY. Cárgalas en el servicio donde publicaste el juego y vuelve a desplegarlo.';
  if (error) return `No se pudo leer la tabla personaje: ${String(error.message || error).slice(0, 140)}`;
  return 'La tabla personaje no devolvió filas: revisa que tenga datos y que la política de lectura esté activa.';
}

export default function SeleccionPersonaje({ go, onPick }) {
  const [grupoId, setGrupoId] = useState('');          // '' = paso 1 (Chica o Chico)
  const [selectedId, setSelectedId] = useState('');
  const [hoveredId, setHoveredId] = useState('');
  const [enviando, setEnviando] = useState(false);
  const tactil = useTactil();
  const { jugables: LISTA_PERSONAJES, porId, cargando, error, recargar } = usePersonajes();

  // Grupos con las versiones que existen en la tabla `personaje`
  const grupos = useMemo(() => GRUPOS_PERSONAJE
    .map((g) => ({ ...g, versiones: g.versiones.map(porId).filter(Boolean) }))
    .filter((g) => g.versiones.length)
    .map((g) => ({ ...g, tarjeta: { ...(porId(g.base) || g.versiones[0]), id: g.id, nombre: g.nombre } })), [porId]);
  const grupo = grupos.find((g) => g.id === grupoId) || null;
  const tarjetas = grupo ? grupo.versiones : grupos.map((g) => g.tarjeta);

  // Precarga para evitar parpadeos al hacer hover
  useEffect(() => {
    LISTA_PERSONAJES.forEach((p) => { const i = new Image(); i.src = p.imagen; });
  }, [LISTA_PERSONAJES]);

  // Tocar una tarjeta solo la marca
  const marcar = (id) => { if (!enviando) setSelectedId(id); };
  // CONFIRMAR: paso 1 → paso 2; paso 2 → entra al juego con el personaje marcado
  const confirmar = async () => {
    if (enviando || !selectedId) return;
    if (!grupo) { setGrupoId(selectedId); setHoveredId(''); setSelectedId(''); return; }
    setEnviando(true);
    try { await onPick(selectedId); } finally { setEnviando(false); }
  };
  const volver = () => {
    if (grupo) { setGrupoId(''); setSelectedId(''); setHoveredId(''); } else go('register');
  };

  return (
    <GameBackground>
      <div className="cs-screen">
        <PasoIndicador paso={3} />
        <h1 className="cs-title">{grupo ? `ELIGE TU ${grupo.nombre}` : 'SELECCIONA TU PERSONAJE'}</h1>

        <div className="cs-grid" role="radiogroup" aria-label={grupo ? `Elige la versión de ${grupo.nombre}` : 'Selecciona tu personaje'} aria-busy={enviando}>
          {tarjetas.map((p) => (
            <CharacterCard
              key={p.id}
              {...p}
              revelado={tactil || hoveredId === p.id || selectedId === p.id}
              seleccionado={selectedId === p.id}
              onSelect={marcar}
              onEnter={setHoveredId}
              onLeave={(id) => setHoveredId((h) => (h === id ? '' : h))}
            />
          ))}
        </div>

        {cargando && <p className="cs-help">CARGANDO PERSONAJES...</p>}
        {!cargando && (error || !grupos.length) && (
          <>
            <p className="cs-help">NO SE PUDIERON CARGAR LOS PERSONAJES. <button type="button" className="cs-reintentar" onClick={recargar}>REINTENTAR</button></p>
            <p className="cs-help" role="alert" style={{ textTransform: 'none', maxWidth: 560 }}>{motivoSinPersonajes(error)}</p>
          </>
        )}
        {!cargando && !error && grupos.length > 0 && (
          <p className="cs-help" role="status">
            {enviando ? 'ENTRANDO AL JUEGO...'
              : selectedId ? 'PRESIONA CONFIRMAR PARA CONTINUAR'
              : `${tactil ? 'TOCA' : 'HAZ CLIC EN'} ${grupo ? 'UNA VERSIÓN' : 'UN PERSONAJE'} Y LUEGO PRESIONA CONFIRMAR`}
          </p>
        )}

        <div className="cs-actions">
          <PixelButton onClick={volver} className="secondary" disabled={enviando}>{grupo ? '← CAMBIAR' : '← VOLVER'}</PixelButton>
          <PixelButton onClick={confirmar} disabled={!selectedId || enviando}>{enviando ? 'ENTRANDO...' : 'CONFIRMAR ✔'}</PixelButton>
        </div>

      </div>
    </GameBackground>
  );
}
