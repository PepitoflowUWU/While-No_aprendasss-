// Quita el fondo magenta (#FF00FF) de una imagen: lo que la IA de imagenes dibuja detras del personaje cuando se le pide
// "fondo magenta" para despues recortarlo. Si la imagen ya es transparente (o no tiene ese fondo) no se toca.
// Asi, cuando se suban los PNG ya recortados, esta correccion deja de actuar sola.
export const MAGENTA = [255, 0, 255];
const T1 = 60;      // distancia RGB al magenta: hasta aqui es fondo -> transparente
const T2 = 140;     // de T1 a T2 es el borde (mezcla de personaje y fondo): semitransparente

const acotar = (v) => Math.max(0, Math.min(255, Math.round(v)));
const distancia = (r, g, b) => Math.hypot(r - MAGENTA[0], g - MAGENTA[1], b - MAGENTA[2]);
// "Cuanto magenta tiene" un color (0 = nada, 1 = magenta puro). El rojo, el azul y la piel dan casi 0.
const tinte = (r, g, b) => Math.max(0, (Math.min(r, b) - g) / 255);

// data: Uint8ClampedArray RGBA (ImageData.data) de ancho x alto. Se modifica en el sitio.
export function quitarMagenta(data, ancho, alto) {
  // 1) El fondo pasa a transparente y el borde a semitransparente.
  for (let i = 0; i < data.length; i += 4) {
    const d = distancia(data[i], data[i + 1], data[i + 2]);
    if (d <= T1) { data[i] = data[i + 1] = data[i + 2] = data[i + 3] = 0; }
    else if (d < T2) data[i + 3] = acotar(data[i + 3] * ((d - T1) / (T2 - T1)));
  }
  // 2) Quitar el halo rosado del contorno: los pixeles del borde que conservan tinte magenta toman el color de sus vecinos solidos.
  const copia = new Uint8ClampedArray(data);
  const idx = (x, y) => (y * ancho + x) * 4;
  for (let y = 0; y < alto; y++) {
    for (let x = 0; x < ancho; x++) {
      const i = idx(x, y);
      if (copia[i + 3] === 0) continue;
      let borde = copia[i + 3] < 255;
      for (let dy = -1; dy <= 1 && !borde; dy++) for (let dx = -1; dx <= 1; dx++) {
        const nx = x + dx, ny = y + dy;
        if (nx >= 0 && ny >= 0 && nx < ancho && ny < alto && copia[idx(nx, ny) + 3] === 0) { borde = true; break; }
      }
      if (!borde || tinte(copia[i], copia[i + 1], copia[i + 2]) <= 0.12) continue;
      let r = 0, g = 0, b = 0, n = 0;
      for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) {
        const nx = x + dx, ny = y + dy;
        if (nx < 0 || ny < 0 || nx >= ancho || ny >= alto) continue;
        const j = idx(nx, ny);
        if (copia[j + 3] === 255 && tinte(copia[j], copia[j + 1], copia[j + 2]) <= 0.12) { r += copia[j]; g += copia[j + 1]; b += copia[j + 2]; n += 1; }
      }
      if (n) { data[i] = acotar(r / n); data[i + 1] = acotar(g / n); data[i + 2] = acotar(b / n); }
    }
  }
  return data;
}

// Rectangulo que ocupa lo VISIBLE de la imagen (pixeles con algo de opacidad), o null si esta vacia. Sirve para quitar el margen
// transparente que dejan las imagenes de IA alrededor del personaje: sin recortarlo, el muneco se ve mas pequeño de lo que es.
export function limitesVisibles(data, ancho, alto, minAlfa = 24) {
  let x0 = ancho, y0 = alto, x1 = -1, y1 = -1;
  for (let y = 0; y < alto; y++) {
    for (let x = 0; x < ancho; x++) {
      if (data[(y * ancho + x) * 4 + 3] >= minAlfa) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
    }
  }
  return x1 < 0 ? null : { x: x0, y: y0, ancho: x1 - x0 + 1, alto: y1 - y0 + 1 };
}

// Hay fondo magenta si las 4 esquinas son opacas y de color magenta.
export function tieneFondoMagenta(data, ancho, alto) {
  const esq = [[0, 0], [ancho - 1, 0], [0, alto - 1], [ancho - 1, alto - 1]];
  return esq.every(([x, y]) => {
    const i = (y * ancho + x) * 4;
    return data[i + 3] > 200 && distancia(data[i], data[i + 1], data[i + 2]) < T2;
  });
}

const cache = new Map();
// Devuelve (como promesa) la URL de la imagen sin fondo magenta, o la misma URL si no hace falta o no se puede procesar.
// Con { recortar: true } ademas quita el margen transparente alrededor del personaje (el muneco del mapa).
// Necesita que el servidor de imagenes permita CORS (Supabase Storage lo permite); si no, se muestra tal cual.
export function imagenSinFondo(src, { recortar = false } = {}) {
  if (!src) return Promise.resolve(src);
  const clave = `${src}|${recortar ? 'r' : ''}`;
  if (cache.has(clave)) return cache.get(clave);
  const p = new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const c = document.createElement('canvas');
        c.width = img.naturalWidth; c.height = img.naturalHeight;
        const ctx = c.getContext('2d', { willReadFrequently: true });
        ctx.drawImage(img, 0, 0);
        const datos = ctx.getImageData(0, 0, c.width, c.height);
        let cambio = false;
        if (tieneFondoMagenta(datos.data, c.width, c.height)) {
          quitarMagenta(datos.data, c.width, c.height);
          ctx.putImageData(datos, 0, 0);
          cambio = true;
        }
        if (recortar) {
          const lim = limitesVisibles(datos.data, c.width, c.height);
          if (lim && (lim.ancho < c.width || lim.alto < c.height)) {          // hay margen transparente: se recorta
            const c2 = document.createElement('canvas');
            c2.width = lim.ancho; c2.height = lim.alto;
            c2.getContext('2d').drawImage(c, lim.x, lim.y, lim.ancho, lim.alto, 0, 0, lim.ancho, lim.alto);
            resolve(c2.toDataURL('image/png'));
            return;
          }
        }
        resolve(cambio ? c.toDataURL('image/png') : src);
      } catch { resolve(src); }                              // canvas bloqueado por CORS u otro problema: se deja la imagen original
    };
    img.onerror = () => resolve(src);
    img.src = src;
  });
  cache.set(clave, p);
  return p;
}
