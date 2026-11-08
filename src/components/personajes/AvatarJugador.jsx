import React, { useState } from 'react';
import { AvatarPixel } from '../comun/PixelIcons';
import { usePersonajes } from '../../context/PersonajesContext.jsx';

// Avatar del personaje elegido (imagen_url de la tabla personaje en Supabase). Si la imagen no existe, usa el avatar pixel de siempre.
export default function AvatarJugador({ personaje, size = 32 }) {
  const [fallo, setFallo] = useState(false);
  const { porId } = usePersonajes();
  const src = porId(personaje)?.imagen;
  if (!src || fallo) return <AvatarPixel tipo="tu" size={size} />;
  return <img className="mp-avatar-img" src={src} alt="" draggable={false} onError={() => setFallo(true)} />;
}
