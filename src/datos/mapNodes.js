// Centro de cada disco dorado del fondo, en % del escenario (x, y). EDITABLE.
// Usa ?calibrar=1 en la URL (solo en desarrollo) para ver una cruz roja en cada posición.
export const MAP_NODES = [
  [28.8, 74.7], // nivel 1
  [40.0, 69.6], // nivel 2
  [43.5, 56.9], // nivel 3
  [56.7, 49.9], // nivel 4
  [64.2, 39.1], // nivel 5
  [74.7, 30.6], // nivel 6
];
// TODO: el curso actual tiene 7 niveles pero el fondo solo trae 6 discos.
// El nivel 7 no se dibuja hasta que haya una 7.ª posición (p. ej. sobre la escalera del portal).

// Nubes (centro x, y y ancho en % del escenario). Los PNG van en /assets/mapa/nubes/.
export const MAP_NUBES = [
  { id: 'a', x: 13.8, y: 12.5, w: 21.5, dur: 44, bob: 8.5, delay: -12 },
  { id: 'b', x: 41.6, y: 12.8, w: 12.6, dur: 38, bob: 7.5, delay: -25 },
  { id: 'c', x: 31.1, y: 27.8, w: 8.3, dur: 30, bob: 7, delay: -7 },
  { id: 'd', x: 71.8, y: 8.7, w: 7.6, dur: 26, bob: 6.5, delay: -18 },
  { id: 'e', x: 93.4, y: 7.0, w: 10.5, dur: 33, bob: 7, delay: -3 },
  { id: 'f', x: 4.8, y: 32.2, w: 9.6, dur: 28, bob: 8, delay: -21 },
  { id: 'g', x: 87.1, y: 84.8, w: 25.8, dur: 45, bob: 9, delay: -30 },
  { id: 'h', x: 6.3, y: 91.4, w: 12.6, dur: 36, bob: 6, delay: -9 },
];
