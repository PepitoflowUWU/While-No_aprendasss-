// Pide a Gemini (a través de la Edge Function "recomendaciones" de Supabase: supabase/functions/recomendaciones)
// consejos para mejorar el pseudocódigo del estudiante. La clave de Gemini NUNCA está en el juego.
import { cliente, supabaseConfigurado } from './cliente.js';

// → { resumen, consejos: [...] }  ·  lanza Error con un mensaje listo para mostrar
export async function pedirRecomendaciones({ enunciado, codigo, correcto, mensaje }) {
  if (!supabaseConfigurado) throw new Error('Las recomendaciones necesitan conexión con la base de datos.');
  let data, error;
  try {
    ({ data, error } = await cliente().functions.invoke('recomendaciones', { body: { enunciado, codigo, correcto, mensaje } }));
  } catch (e) { error = e; }
  if (error || !data || data.error) {
    const estado = error?.context?.status;
    const txt = String(data?.error || error?.message || '');
    if (estado === 404 || /not found|FunctionsFetchError|Failed to send/i.test(txt)) throw new Error('El guía todavía no puede dar recomendaciones (falta publicar la función "recomendaciones" en Supabase).');
    if (txt.includes('SIN_CLAVE')) throw new Error('Falta configurar la clave de Gemini en Supabase (GEMINI_API_KEY).');
    if (estado === 429 || /429/.test(txt)) throw new Error('El guía está atendiendo a muchos estudiantes. Espera un minuto e inténtalo otra vez.');
    throw new Error('El guía no pudo responder ahora. Inténtalo de nuevo en un momento.');
  }
  return { resumen: String(data.resumen || ''), consejos: Array.isArray(data.consejos) ? data.consejos : [] };
}
