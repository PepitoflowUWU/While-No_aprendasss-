import React from 'react';
import { BookIcon, FlagIcon, StarGold, TrophyIcon, FlameIcon, BoltIcon, CardIcon } from '../comun/PixelIcons';

const ICONOS = { libro: BookIcon, bandera: FlagIcon, estrella: StarGold, trofeo: TrophyIcon, llama: FlameIcon, rayo: BoltIcon, carta: CardIcon };
export default function LogroIcono({ tipo, size = 40 }) {
  const Icono = ICONOS[tipo] || TrophyIcon;
  return <Icono size={size} />;
}
