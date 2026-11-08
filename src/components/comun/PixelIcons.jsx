import React from 'react';

// Avatares estilo pixel art para el ranking y el perfil
export function AvatarPixel({ tipo = 'tu', size = 28 }) {
  if (tipo === 'ana') {
    // Ana: Niña de cabello rizado castaño
    return (
      <svg width={size} height={size} viewBox="0 0 16 16" shapeRendering="crispEdges">
        <rect width="16" height="16" fill="#eed9b7" />
        <rect x="3" y="1" width="10" height="4" fill="#6a3818" />
        <rect x="2" y="2" width="12" height="6" fill="#6a3818" />
        <rect x="1" y="4" width="3" height="5" fill="#542b11" />
        <rect x="12" y="4" width="3" height="5" fill="#542b11" />
        {/* Cara */}
        <rect x="4" y="5" width="8" height="6" fill="#f8cfab" />
        {/* Ojos */}
        <rect x="5" y="7" width="2" height="2" fill="#1b120c" />
        <rect x="9" y="7" width="2" height="2" fill="#1b120c" />
        {/* Mejillas */}
        <rect x="4" y="9" width="1" height="1" fill="#f0998a" />
        <rect x="11" y="9" width="1" height="1" fill="#f0998a" />
        {/* Boca */}
        <rect x="7" y="10" width="2" height="1" fill="#c06040" />
        {/* Ropa */}
        <rect x="3" y="12" width="10" height="4" fill="#df5d68" />
        <rect x="6" y="12" width="4" height="2" fill="#f8cfab" />
      </svg>
    );
  }

  if (tipo === 'leo') {
    // Leo: Chico con cabello castaño corto
    return (
      <svg width={size} height={size} viewBox="0 0 16 16" shapeRendering="crispEdges">
        <rect width="16" height="16" fill="#eed9b7" />
        {/* Cabello */}
        <rect x="4" y="1" width="8" height="3" fill="#845025" />
        <rect x="3" y="2" width="10" height="4" fill="#845025" />
        <rect x="3" y="3" width="2" height="5" fill="#845025" />
        <rect x="11" y="3" width="2" height="5" fill="#845025" />
        {/* Cara */}
        <rect x="4" y="5" width="8" height="6" fill="#f8cfab" />
        {/* Ojos */}
        <rect x="5" y="7" width="2" height="2" fill="#201812" />
        <rect x="9" y="7" width="2" height="2" fill="#201812" />
        {/* Sonrisa */}
        <rect x="7" y="10" width="2" height="1" fill="#b06040" />
        {/* Ropa */}
        <rect x="3" y="12" width="10" height="4" fill="#439b4f" />
        <rect x="6" y="12" width="4" height="2" fill="#f8cfab" />
      </svg>
    );
  }

  if (tipo === 'mia') {
    // Mia: Niña con cabello anaranjado
    return (
      <svg width={size} height={size} viewBox="0 0 16 16" shapeRendering="crispEdges">
        <rect width="16" height="16" fill="#eed9b7" />
        {/* Cabello */}
        <rect x="3" y="1" width="10" height="3" fill="#d96924" />
        <rect x="2" y="2" width="12" height="4" fill="#d96924" />
        <rect x="1" y="4" width="3" height="7" fill="#b54f15" />
        <rect x="12" y="4" width="3" height="7" fill="#b54f15" />
        {/* Cara */}
        <rect x="4" y="5" width="8" height="6" fill="#fbd1b4" />
        {/* Ojos */}
        <rect x="5" y="7" width="2" height="2" fill="#1b120c" />
        <rect x="9" y="7" width="2" height="2" fill="#1b120c" />
        {/* Sonrisa */}
        <rect x="7" y="10" width="2" height="1" fill="#bd5b3b" />
        {/* Ropa */}
        <rect x="3" y="12" width="10" height="4" fill="#9353ba" />
        <rect x="6" y="12" width="4" height="2" fill="#fbd1b4" />
      </svg>
    );
  }

  if (tipo === 'alex') {
    // Alex: Chico con cabello azul / estilo tecno
    return (
      <svg width={size} height={size} viewBox="0 0 16 16" shapeRendering="crispEdges">
        <rect width="16" height="16" fill="#eed9b7" />
        {/* Cabello azul */}
        <rect x="3" y="1" width="10" height="3" fill="#2b75a8" />
        <rect x="2" y="2" width="12" height="4" fill="#2b75a8" />
        <rect x="2" y="4" width="2" height="5" fill="#1e547a" />
        <rect x="12" y="4" width="2" height="5" fill="#1e547a" />
        {/* Cara */}
        <rect x="4" y="5" width="8" height="6" fill="#f4caa2" />
        {/* Ojos */}
        <rect x="5" y="7" width="2" height="2" fill="#0d2334" />
        <rect x="9" y="7" width="2" height="2" fill="#0d2334" />
        {/* Sonrisa */}
        <rect x="7" y="10" width="2" height="1" fill="#a45535" />
        {/* Ropa */}
        <rect x="3" y="12" width="10" height="4" fill="#e67e22" />
        <rect x="6" y="12" width="4" height="2" fill="#f4caa2" />
      </svg>
    );
  }

  // Por defecto: 'tu' (chico con cabello afro/rizado negro, camiseta azul como en la imagen)
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" shapeRendering="crispEdges">
      <rect width="16" height="16" fill="#dfcba5" />
      {/* Pelo afro negro rizado */}
      <rect x="3" y="0" width="10" height="3" fill="#18181c" />
      <rect x="2" y="1" width="12" height="5" fill="#18181c" />
      <rect x="1" y="2" width="14" height="4" fill="#18181c" />
      <rect x="1" y="4" width="3" height="4" fill="#101014" />
      <rect x="12" y="4" width="3" height="4" fill="#101014" />
      {/* Cara */}
      <rect x="4" y="6" width="8" height="5" fill="#f2c89f" />
      {/* Ojos grandes pixel */}
      <rect x="5" y="7" width="2" height="2" fill="#111116" />
      <rect x="9" y="7" width="2" height="2" fill="#111116" />
      <rect x="5" y="7" width="1" height="1" fill="#ffffff" />
      <rect x="9" y="7" width="1" height="1" fill="#ffffff" />
      {/* Boca */}
      <rect x="7" y="10" width="2" height="1" fill="#b35b3d" />
      {/* Ropa azul con cuello */}
      <rect x="3" y="12" width="10" height="4" fill="#2d5fd6" />
      <rect x="6" y="12" width="4" height="2" fill="#f2c89f" />
      <rect x="7" y="13" width="2" height="3" fill="#ffffff" />
    </svg>
  );
}

// Icono Engranaje para Ajustes
export function GearIcon({ size = 22 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z" />
    </svg>
  );
}

// Icono Corona (panel de administracion)
export function CrownIcon({ size = 22 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" shapeRendering="crispEdges" aria-hidden="true">
      <path d="M1 4h2v1h1v2h1v1h1V6h1V3h2v3h1v2h1V7h1V5h1V4h2v9H1z" fill="#ffd23f" />
      <path d="M1 12h14v2H1z" fill="#e0a800" />
      <rect x="7" y="9" width="2" height="2" fill="#e63946" />
      <rect x="3" y="10" width="1" height="1" fill="#4aa3ff" />
      <rect x="12" y="10" width="1" height="1" fill="#4aa3ff" />
      <path d="M1 3h2v1H1zM7 2h2v1H7zM13 3h2v1h-2z" fill="#fff3b0" />
      <path d="M1 14h14v1H1z" fill="#7a5200" />
    </svg>
  );
}

// Iconos de logros: bandera (niveles) y rayo (XP)
export function FlagIcon({ size = 38 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" shapeRendering="crispEdges" aria-hidden="true">
      <rect x="3" y="1" width="2" height="14" fill="#8b5a2b" />
      <path d="M5 2h9v2h-1v1h1v2h-1v1h1v2H5z" fill="#e63946" />
      <path d="M5 2h9v1H5z" fill="#ff8a94" />
      <rect x="2" y="14" width="5" height="1" fill="#5a3a18" />
    </svg>
  );
}
export function BoltIcon({ size = 38 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" shapeRendering="crispEdges" aria-hidden="true">
      <path d="M9 1H5L3 9h3l-1 6 8-9H9z" fill="#ffd23f" />
      <path d="M9 1H5L3 9h1l2-8z" fill="#fff3b0" />
      <path d="M9 6h4l-8 9 1-6H3" fill="none" stroke="#c98a00" strokeWidth=".6" />
    </svg>
  );
}

// Icono Carta / Comodín
export function CardIcon({ size = 26 }) {
  return (
    <svg width={size} height={size * 1.3} viewBox="0 0 20 26" shapeRendering="crispEdges">
      {/* Borde exterior blanco/dorado */}
      <rect x="1" y="1" width="18" height="24" rx="2" fill="#fdfbf5" stroke="#375586" strokeWidth="1" />
      {/* Marco interior azul/dorado */}
      <rect x="3" y="3" width="14" height="20" fill="#203a6b" />
      <rect x="4" y="4" width="12" height="18" fill="#132448" />
      {/* Sol / estrella en el centro */}
      <circle cx="10" cy="13" r="4.5" fill="#f9cb35" />
      <circle cx="10" cy="13" r="2.5" fill="#e67e22" />
      {/* Rayos de la estrella */}
      <rect x="9.5" y="6" width="1" height="3" fill="#f9cb35" />
      <rect x="9.5" y="17" width="1" height="3" fill="#f9cb35" />
      <rect x="4" y="12.5" width="3" height="1" fill="#f9cb35" />
      <rect x="13" y="12.5" width="3" height="1" fill="#f9cb35" />
      {/* Pequeños diamantes en las esquinas */}
      <rect x="4" y="4" width="1.5" height="1.5" fill="#f9cb35" />
      <rect x="14.5" y="4" width="1.5" height="1.5" fill="#f9cb35" />
      <rect x="4" y="20.5" width="1.5" height="1.5" fill="#f9cb35" />
      <rect x="14.5" y="20.5" width="1.5" height="1.5" fill="#f9cb35" />
    </svg>
  );
}

// Icono Fuego / Racha
export function FlameIcon({ size = 24 }) {
  return (
    <svg width={size} height={size * 1.2} viewBox="0 0 20 24" shapeRendering="crispEdges">
      {/* Llama exterior roja/naranja */}
      <path d="M10 1 Q14 7 14 11 Q17 12 17 16 Q17 22 10 23 Q3 22 3 16 Q3 12 7 9 Q8 6 10 1 Z" fill="#eb4d26" />
      {/* Llama intermedia naranja/amarillo */}
      <path d="M10 5 Q13 9 13 13 Q15 14 15 17 Q15 21 10 22 Q5 21 5 17 Q5 13 8 11 Q9 8 10 5 Z" fill="#f39c12" />
      {/* Centro brillante amarillo/blanco */}
      <path d="M10 9 Q12 12 12 15 Q13 16 13 18 Q13 21 10 21 Q7 21 7 18 Q7 15 9 13 Q9.5 11 10 9 Z" fill="#ffeb3b" />
      <path d="M10 13 Q11 15 11 17 Q11 19 10 19 Q9 19 9 17 Q9 15 10 13 Z" fill="#ffffff" />
    </svg>
  );
}

// Icono Mochila (Perfil)
export function BackpackIcon({ size = 38 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" shapeRendering="crispEdges">
      {/* Asa superior */}
      <rect x="12" y="3" width="8" height="3" fill="#5c2e0b" />
      <rect x="14" y="4" width="4" height="2" fill="none" />
      {/* Cuerpo principal cuero marrón */}
      <rect x="6" y="6" width="20" height="22" rx="3" fill="#9b4d1b" />
      <rect x="7" y="7" width="18" height="20" fill="#a75520" />
      {/* Solapa superior */}
      <rect x="6" y="6" width="20" height="9" fill="#7a3a10" />
      <rect x="7" y="7" width="18" height="7" fill="#8c4314" />
      {/* Bolsillo frontal */}
      <rect x="9" y="16" width="14" height="10" fill="#7a3a10" />
      <rect x="10" y="17" width="12" height="8" fill="#8c4314" />
      {/* Correas verticales oscuras */}
      <rect x="10" y="6" width="3" height="20" fill="#4d2207" />
      <rect x="19" y="6" width="3" height="20" fill="#4d2207" />
      {/* Hebillas doradas */}
      <rect x="9" y="13" width="5" height="4" fill="#ffd438" />
      <rect x="10" y="14" width="3" height="2" fill="#9c7809" />
      <rect x="18" y="13" width="5" height="4" fill="#ffd438" />
      <rect x="19" y="14" width="3" height="2" fill="#9c7809" />
      {/* Bolsillos laterales */}
      <rect x="4" y="13" width="2" height="9" fill="#6d320c" />
      <rect x="26" y="13" width="2" height="9" fill="#6d320c" />
    </svg>
  );
}

// Icono Libro / Grimorio (Extras)
export function BookIcon({ size = 38 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" shapeRendering="crispEdges">
      {/* Lomo exterior marrón oscuro */}
      <rect x="4" y="6" width="24" height="20" rx="2" fill="#4a2610" />
      {/* Cubierta abierta */}
      <rect x="5" y="7" width="10" height="18" fill="#783e18" />
      <rect x="17" y="7" width="10" height="18" fill="#783e18" />
      {/* Páginas pergamino marfil */}
      <rect x="6" y="8" width="9" height="16" fill="#f7f0db" />
      <rect x="17" y="8" width="9" height="16" fill="#f7f0db" />
      {/* Líneas de texto ficticio */}
      <rect x="8" y="11" width="5" height="1.5" fill="#8d7756" />
      <rect x="8" y="14" width="5" height="1.5" fill="#8d7756" />
      <rect x="8" y="17" width="5" height="1.5" fill="#8d7756" />
      <rect x="8" y="20" width="4" height="1.5" fill="#8d7756" />

      <rect x="19" y="11" width="5" height="1.5" fill="#8d7756" />
      <rect x="19" y="14" width="5" height="1.5" fill="#8d7756" />
      <rect x="19" y="17" width="5" height="1.5" fill="#8d7756" />
      <rect x="19" y="20" width="4" height="1.5" fill="#8d7756" />
      {/* Marcador de cinta dorada */}
      <rect x="15" y="6" width="2" height="19" fill="#ffd438" />
      <polygon points="15,25 16,23 17,25" fill="#ffd438" />
    </svg>
  );
}

// Icono Trofeo (Logros)
export function TrophyIcon({ size = 38 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" shapeRendering="crispEdges">
      {/* Copa exterior y asas */}
      <rect x="6" y="8" width="20" height="4" fill="#ffd438" />
      <rect x="8" y="12" width="16" height="6" fill="#f3ba1e" />
      <rect x="10" y="18" width="12" height="4" fill="#e09e10" />
      <rect x="12" y="22" width="8" height="3" fill="#c48508" />
      {/* Asas laterales */}
      <path d="M6 10 H3 V16 H6 V15 H4 V11 H6 Z" fill="#ffd438" />
      <path d="M26 10 H29 V16 H26 V15 H28 V11 H26 Z" fill="#ffd438" />
      {/* Brillo en la copa */}
      <rect x="9" y="9" width="3" height="10" fill="#fff5a6" />
      <rect x="10" y="8" width="2" height="2" fill="#ffffff" />
      {/* Tallo del trofeo */}
      <rect x="14" y="25" width="4" height="3" fill="#b37805" />
      {/* Base */}
      <rect x="9" y="27" width="14" height="3" fill="#4d2c14" />
      <rect x="8" y="29" width="16" height="2" fill="#2d1708" />
      {/* Plaquita dorada en la base */}
      <rect x="13" y="28" width="6" height="1.5" fill="#ffd438" />
    </svg>
  );
}

// Estrella dorada con relieve 3D
export function StarGold({ size = 26 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24">
      {/* Sombra / borde oscuro */}
      <polygon
        points="12,1.5 15.3,8.2 22.7,9.3 17.3,14.5 18.6,21.8 12,18.3 5.4,21.8 6.7,14.5 1.3,9.3 8.7,8.2"
        fill="#1e1808"
        stroke="#1e1808"
        strokeWidth="2"
      />
      {/* Relleno dorado vibrante */}
      <polygon
        points="12,2 15.1,8.3 22.1,9.3 17.1,14.2 18.3,21.1 12,17.8 5.7,21.1 6.9,14.2 1.9,9.3 8.9,8.3"
        fill="#ffcb2b"
      />
      {/* Faceta de sombra */}
      <polygon
        points="12,2 12,17.8 5.7,21.1 6.9,14.2 1.9,9.3 8.9,8.3"
        fill="#e6a412"
      />
      {/* Brillo */}
      <polygon
        points="12,4 13.5,8 18,8.8 14.5,12 12,14"
        fill="#ffefa8"
      />
    </svg>
  );
}

// Estrella vacía / oscura para puntuaciones incompletas
export function StarDark({ size = 26 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24">
      <polygon
        points="12,1.5 15.3,8.2 22.7,9.3 17.3,14.5 18.6,21.8 12,18.3 5.4,21.8 6.7,14.5 1.3,9.3 8.7,8.2"
        fill="#162238"
        stroke="#0d1422"
        strokeWidth="2"
      />
      <polygon
        points="12,2 15.1,8.3 22.1,9.3 17.1,14.2 18.3,21.1 12,17.8 5.7,21.1 6.9,14.2 1.9,9.3 8.9,8.3"
        fill="#22334f"
      />
    </svg>
  );
}

// Candado para nodos bloqueados
export function PadlockIcon({ size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" shapeRendering="crispEdges">
      {/* Grillete */}
      <rect x="6" y="2" width="8" height="7" rx="4" fill="none" stroke="#252a33" strokeWidth="2.5" />
      {/* Cuerpo del candado */}
      <rect x="4" y="8" width="12" height="10" rx="2" fill="#3b424f" stroke="#1b1e25" strokeWidth="1" />
      <rect x="5" y="9" width="10" height="8" fill="#4d5565" />
      {/* Ojo de la cerradura */}
      <circle cx="10" cy="12" r="1.5" fill="#1b1e25" />
      <rect x="9.5" y="12.5" width="1" height="3" fill="#1b1e25" />
    </svg>
  );
}

// Sprite del Jugador detallado (chico con rizos afro, chaqueta azul, mochila)
export function PlayerSprite({ width = 38 }) {
  return (
    <svg width={width} height={width * 1.3} viewBox="0 0 24 32" shapeRendering="crispEdges">
      {/* Pelo afro oscuro rizado */}
      <rect x="6" y="1" width="12" height="4" fill="#141416" />
      <rect x="4" y="3" width="16" height="8" fill="#141416" />
      <rect x="3" y="5" width="18" height="6" fill="#141416" />
      {/* Cara */}
      <rect x="7" y="10" width="10" height="7" fill="#f2c89f" />
      {/* Ojos pixel */}
      <rect x="9" y="12" width="2" height="3" fill="#121214" />
      <rect x="14" y="12" width="2" height="3" fill="#121214" />
      <rect x="9" y="12" width="1" height="1" fill="#ffffff" />
      <rect x="14" y="12" width="1" height="1" fill="#ffffff" />
      {/* Sonrisa */}
      <rect x="11" y="15" width="3" height="1" fill="#b35b3d" />
      {/* Mochila trasera visible */}
      <rect x="3" y="15" width="4" height="9" fill="#8c471a" />
      <rect x="3" y="17" width="4" height="2" fill="#ffd438" />
      {/* Chaqueta azul con cremallera blanca */}
      <rect x="6" y="17" width="12" height="7" fill="#2d5fd6" />
      <rect x="11" y="17" width="2" height="7" fill="#ffffff" />
      {/* Brazos */}
      <rect x="5" y="18" width="2" height="5" fill="#244eb5" />
      <rect x="17" y="18" width="2" height="5" fill="#244eb5" />
      {/* Manos */}
      <rect x="5" y="23" width="2" height="2" fill="#f2c89f" />
      <rect x="17" y="23" width="2" height="2" fill="#f2c89f" />
      {/* Pantalones vaqueros oscuros */}
      <rect x="8" y="24" width="3" height="4" fill="#1a274a" />
      <rect x="13" y="24" width="3" height="4" fill="#1a274a" />
      {/* Botas marrones */}
      <rect x="7" y="28" width="4" height="3" fill="#542e0d" />
      <rect x="13" y="28" width="4" height="3" fill="#542e0d" />
    </svg>
  );
}
