import React from 'react';

// Dibuja un bitmap de texto como SVG pixel art. 'X' = color (currentColor por defecto);
// otras letras se resuelven con la paleta.
export function PixelArt({ rows, size = 3, palette = {}, title, className = '', fluid = false }) {
  const w = rows[0].length, h = rows.length;
  const rects = [];
  rows.forEach((row, y) => {
    let x = 0;
    while (x < w) {
      const ch = row[x];
      if (ch === '.') { x++; continue; }
      let x2 = x;
      while (x2 < w && row[x2] === ch) x2++;
      rects.push(<rect key={`${x}-${y}`} x={x} y={y} width={x2 - x} height={1} fill={palette[ch] || 'currentColor'} />);
      x = x2;
    }
  });
  return (
    <svg className={className} width={fluid ? '100%' : w * size} height={fluid ? '100%' : h * size} viewBox={`0 0 ${w} ${h}`}
      shapeRendering="crispEdges" aria-hidden={title ? undefined : 'true'} role={title ? 'img' : undefined}>
      {title && <title>{title}</title>}
      {rects}
    </svg>
  );
}

const EYE = [
  '...XXXXXX...',
  '.XX......XX.',
  'X....XX....X',
  'X...XXXX...X',
  'X....XX....X',
  '.XX......XX.',
  '...XXXXXX...',
];

export const BITMAPS = {
  id: ['XXXXXXXXXXXX','X..........X','X.XXX.XXXX.X','X.XXX......X','X.XXX.XXXX.X','X..........X','XXXXXXXXXXXX'],
  mail: ['XXXXXXXXXXXX','XX........XX','X.X......X.X','X..X....X..X','X...X..X...X','X....XX....X','X..........X','XXXXXXXXXXXX'],
  user: ['..XXXX..','.XXXXXX.','.XXXXXX.','..XXXX..','.XXXXXX.','XXXXXXXX','XXXXXXXX','XXXXXXXX'],
  phone: ['.XXXXXX.','X......X','X.XXXX.X','X.XXXX.X','X.XXXX.X','X.XXXX.X','X......X','X..XX..X','.XXXXXX.'],
  lock: ['..XXXX..','.X....X.','.X....X.','XXXXXXXX','XXXXXXXX','XXX..XXX','XXX..XXX','XXXXXXXX','XXXXXXXX'],
  dice: ['XXXXXXX','X.....X','X.X.X.X','X..X..X','X.X.X.X','X.....X','XXXXXXX'],
  eye: EYE,
  eyeOff: EYE.map((r, y) => { const x = Math.round(1 + y * (10 / 6)); return r.slice(0, x) + 'X' + r.slice(x + 1); }),
  check: ['......X','.....XX','X...XX.','XX.XX..','.XXX...','..X....'],
  cross: ['XX...XX','XXX.XXX','.XXXXX.','..XXX..','.XXXXX.','XXX.XXX','XX...XX'],
  podio: ['.....XX.....','....XXXX....','XXX.XXXX....','XXX.XXXX.XXX','XXX.XXXX.XXX','XXXXXXXXXXXX'],
  mira: ['.....X.....','...XXXXX...','..X..X..X..','.X...X...X.','.X...X...X.','XXXXX.XXXXX','.X...X...X.','.X...X...X.','..X..X..X..','...XXXXX...','.....X.....'],
  star: ['...X...','...X...','XXXXXXX','.XXXXX.','..XXX..','.XX.XX.','.X...X.'],
};

export function Icono({ nombre, size = 3, className }) {
  return <PixelArt rows={BITMAPS[nombre]} size={size} className={className} />;
}

export const NUBE = [
  '..........XXXXXX..............',
  '........XXXXXXXXXX..XXXX......',
  '......XXXXXXXXXXXXXXXXXXXX....',
  '..XXXXXXXXXXXXXXXXXXXXXXXXXX..',
  'XXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
  'XXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
  '.SSSSSSSSSSSSSSSSSSSSSSSSSSSS.',
];
