import React, { useEffect, useRef } from 'react';

// Transición de MOSAICO DE PÍXELES (estilo 16 bits): una onda diagonal de cuadrados cubre la pantalla y luego se retira.
// Fase 1 cubrir (650 ms) -> fase 2 pausa (150 ms, aquí se llama onCovered) -> fase 3 revelar (750 ms).
// Un solo <canvas> a pantalla completa; sin elementos DOM por celda.
const AZUL = '#0E2A5C', CLARO = '#5FA8FF', OSCURO = '#071A3A';
const T1 = 650, T2 = 150, T3 = 750, CRECE = 220;
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

export default function PixelTransition({ empezarCubierto = false, onStart, onCovered, onDone, colorTema = AZUL }) {
  const ref = useRef(null);
  const cb = useRef({});
  cb.current = { onStart, onCovered, onDone };

  useEffect(() => {
    const cv = ref.current;
    const ctx = cv.getContext('2d');
    // theme-color durante la transición
    const meta = document.querySelector('meta[name="theme-color"]');
    const previo = meta ? meta.getAttribute('content') : null;
    if (meta) meta.setAttribute('content', colorTema);

    let dpr = 1, cp = 36, cols = 0, filas = 0, retraso = new Float32Array(0), raf = 0, vivo = true;

    // Rejilla: celda = clamp(36px, min(ancho, alto) / 14, 72px). Se recalcula si cambia la ventana.
    const medir = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = cv.clientWidth || window.innerWidth, h = cv.clientHeight || window.innerHeight;
      cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr);
      ctx.imageSmoothingEnabled = false;
      const celdaCss = clamp(Math.min(w, h) / 14, 36, 72);
      cp = Math.max(1, Math.round(celdaCss * dpr));            // píxeles enteros
      cols = Math.ceil(cv.width / cp); filas = Math.ceil(cv.height / cp);
      // retraso diagonal + variación aleatoria fija de ±0.06 por celda
      retraso = new Float32Array(cols * filas);
      for (let r = 0; r < filas; r++) for (let c = 0; c < cols; c++) {
        retraso[r * cols + c] = (c / cols + r / filas) / 2 + (Math.random() * 0.12 - 0.06);
      }
    };

    const celda = (x0, y0, lado, completa, parcial) => {
      const x = Math.round(x0 + cp / 2 - lado / 2), y = Math.round(y0 + cp / 2 - lado / 2);
      if (!completa) { ctx.fillStyle = parcial; ctx.fillRect(x, y, lado, lado); return; } // celda en movimiento: sin bisel (al crecer, brillo del frente de la onda)
      const b = Math.max(2, Math.round(2 * dpr));
      ctx.fillStyle = AZUL; ctx.fillRect(x, y, lado, lado);
      ctx.fillStyle = CLARO; ctx.fillRect(x, y, lado, b); ctx.fillRect(x, y, b, lado);                         // arriba e izquierda
      ctx.fillStyle = OSCURO; ctx.fillRect(x, y + lado - b, lado, b); ctx.fillRect(x + lado - b, y, b, lado);  // abajo y derecha
    };

    // modo 1 = cubrir, 2 = cubierto, 3 = revelar; tp = ms dentro de la fase
    const dibujar = (modo, tp) => {
      ctx.clearRect(0, 0, cv.width, cv.height);
      for (let r = 0; r < filas; r++) {
        for (let c = 0; c < cols; c++) {
          const d = clamp(retraso[r * cols + c], 0, 1);
          let tam;
          if (modo === 2) tam = 1;
          else if (modo === 1) {
            const p = (tp - d * (T1 - CRECE)) / CRECE;
            tam = p <= 0 ? 0 : Math.min(1, Math.ceil(p * 4) / 4);       // pasos de 25%, sin suavizado
          } else {
            const p = (tp - d * (T3 - CRECE)) / CRECE;
            tam = p <= 0 ? 1 : Math.max(0, 1 - Math.min(1, Math.ceil(p * 4) / 4));
          }
          if (tam <= 0) continue;
          const lado = tam >= 1 ? cp + 1 : Math.max(1, Math.round((cp + 1) * tam)); // 1 px más grande: sin líneas entre celdas
          celda(c * cp, r * cp, lado, tam >= 1, modo === 1 ? CLARO : AZUL);
        }
      }
    };

    medir();
    const alRedimensionar = () => { medir(); };
    window.addEventListener('resize', alRedimensionar);

    // Línea de tiempo
    let t0 = performance.now(), fase = empezarCubierto ? 2 : 1, cubiertoLlamado = false, cuadrosCubierto = 0, t3 = 0;
    if (empezarCubierto) { t0 = performance.now() - T1; } else { cb.current.onStart?.(); }

    const loop = (ahora) => {
      if (!vivo) return;
      const t = ahora - t0;
      if (fase === 1) {
        if (t >= T1) { fase = 2; } else { dibujar(1, t); raf = requestAnimationFrame(loop); return; }
      }
      if (fase === 2) {
        dibujar(2, 0);
        if (!cubiertoLlamado) { cubiertoLlamado = true; cb.current.onCovered?.(); cuadrosCubierto = 0; }
        else cuadrosCubierto += 1;
        // pausa de 150 ms y al menos 2 cuadros después de onCovered (Inicio ya montado por debajo)
        if (t >= T1 + T2 && cuadrosCubierto >= 2) { fase = 3; t3 = ahora; }
        raf = requestAnimationFrame(loop); return;
      }
      const tp = ahora - t3;
      if (tp >= T3) {
        ctx.clearRect(0, 0, cv.width, cv.height);
        cb.current.onDone?.();
        return;
      }
      dibujar(3, tp);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    return () => {
      vivo = false;
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', alRedimensionar);
      // restaura el color de tema solo si nadie más lo cambió
      if (meta && meta.getAttribute('content') === colorTema) meta.setAttribute('content', previo ?? '');
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return <canvas ref={ref} className="pixel-transition" aria-hidden="true" />;
}
