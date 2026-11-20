// Edge Function de Supabase: RECOMENDACIONES con Gemini para los ejercicios de escribir código del examen final (nivel 6).
// El juego le manda el enunciado y el pseudocódigo del estudiante; Gemini responde consejos cortos en español
// (nombres de variables claros, cómo resumir el código, buenas prácticas). La clave de Gemini vive SOLO aquí, como secreto:
//   npx supabase secrets set GEMINI_API_KEY=tu_clave
// Opcional: npx supabase secrets set GEMINI_MODEL=nombre-del-modelo   (si no, prueba los de la lista MODELOS)
// Subirla: npx supabase functions deploy recomendaciones

const CLAVE = Deno.env.get('GEMINI_API_KEY') ?? '';
const MODELOS = [Deno.env.get('GEMINI_MODEL'), 'gemini-3.8-flash', 'gemini-flash-latest', 'gemini-2.5-flash'].filter(Boolean) as string[];
const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
const responder = (cuerpo: unknown, status = 200) =>
  new Response(JSON.stringify(cuerpo), { status, headers: { ...CORS, 'Content-Type': 'application/json' } });

const INSTRUCCION = `Eres el profesor Capyhein de un juego para estudiantes que empiezan a programar en pseudocódigo (estilo PSeInt).
Revisa el pseudocódigo del estudiante y dale RECOMENDACIONES para mejorarlo. Fíjate sobre todo en:
- nombres de variables claros y exactos (por ejemplo "promedio" en vez de "p", "vidasRestantes" en vez de "v");
- cómo hacer el código más corto o simple (quitar variables o pasos que sobran, unir condiciones, usar SINO en lugar de varios SI);
- buenas prácticas: declarar las variables con DEFINIR, mensajes claros al pedir datos y al mostrar resultados, sangría ordenada.
Reglas: escribe en español sencillo, trata al estudiante de "tú", da entre 2 y 4 consejos de una o dos oraciones cada uno,
puedes mostrar un fragmento corto como ejemplo, pero NO escribas el programa completo. Si el código ya está muy bien, dilo y da 1 o 2 ideas.
Responde SOLO con JSON: {"resumen": "una oración sobre el código", "consejos": ["...", "..."]}`;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  if (req.method !== 'POST') return responder({ error: 'Usa POST' }, 405);
  if (!CLAVE) return responder({ error: 'SIN_CLAVE' }, 500);

  let datos: { enunciado?: string; codigo?: string; correcto?: boolean; mensaje?: string };
  try { datos = await req.json(); } catch { return responder({ error: 'JSON inválido' }, 400); }
  const codigo = String(datos.codigo ?? '').slice(0, 4000);
  const enunciado = String(datos.enunciado ?? '').slice(0, 1500);
  if (!codigo.trim()) return responder({ error: 'Falta el código' }, 400);

  const pedido = `Ejercicio:\n${enunciado}\n\nPseudocódigo del estudiante:\n${codigo}\n\n` +
    `Resultado de las pruebas: ${datos.correcto ? 'correcto (pasó todas las pruebas)' : `incorrecto. ${String(datos.mensaje ?? '').slice(0, 400)}`}`;

  let ultimo = '';
  for (const modelo of MODELOS) {
    const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${modelo}:generateContent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': CLAVE },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: INSTRUCCION }] },
        contents: [{ role: 'user', parts: [{ text: pedido }] }],
        // Límite alto: los modelos nuevos "piensan" antes de responder y eso también gasta salida (con 600 la respuesta llegaba cortada)
        generationConfig: { temperature: 0.4, maxOutputTokens: 4096, responseMimeType: 'application/json' },
      }),
    });
    if (r.status === 404) { ultimo = `modelo ${modelo} no disponible`; continue; }   // nombre de modelo que no existe: prueba el siguiente
    if (!r.ok) return responder({ error: `Gemini respondió ${r.status}` }, r.status === 429 ? 429 : 502);
    const d = await r.json();
    const texto = (d.candidates?.[0]?.content?.parts ?? []).map((p: { text?: string }) => p.text ?? '').join('').trim();
    const limpio = texto.replace(/^```(?:json)?/, '').replace(/```$/, '').trim();
    try {
      const j = JSON.parse(limpio);
      const consejos = (Array.isArray(j.consejos) ? j.consejos : []).map(String).filter(Boolean).slice(0, 5);
      return responder({ resumen: String(j.resumen ?? ''), consejos, modelo });
    } catch {
      // JSON incompleto o con otro formato: se rescatan el resumen y los consejos que sí llegaron completos
      const resumen = limpio.match(/"resumen"\s*:\s*"((?:[^"\\]|\\.)*)"/)?.[1] ?? '';
      const bloque = limpio.match(/"consejos"\s*:\s*\[([\s\S]*)/)?.[1] ?? '';
      const consejos = [...bloque.matchAll(/"((?:[^"\\]|\\.)*)"/g)].map((m) => m[1]).filter(Boolean).slice(0, 5);
      const quitar = (t: string) => t.replace(/\\n/g, '\n').replace(/\\"/g, '"');
      if (resumen || consejos.length) return responder({ resumen: quitar(resumen), consejos: consejos.map(quitar), modelo });
      return responder({ resumen: '', consejos: limpio ? [limpio.slice(0, 1200)] : [], modelo });
    }
  }
  return responder({ error: ultimo || 'Sin modelo disponible' }, 502);
});
