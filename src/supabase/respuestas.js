// La BASE valida las respuestas (database/migraciones/30_validar_respuestas_servidor.sql): el navegador no conoce la correcta.
// verificarAlternativa -> { correcto, intento, fallos, agotado, correcta (id de la correcta; solo al acertar o al agotar) }
import { cliente } from './cliente.js';

export async function verificarAlternativa(ejercicioId, alternativaId) {
  const { data, error } = await cliente().rpc('verificar_alternativa', { p_ejercicio: ejercicioId, p_alternativa: alternativaId });
  if (error) {
    const m = String(error.message || '');
    if (error.code === 'PGRST202' || /could not find the function/i.test(m)) throw new Error('Falta ejecutar database/migraciones/30_validar_respuestas_servidor.sql en Supabase.');
    if (/failed to fetch|networkerror/i.test(m)) throw new Error('No se pudo conectar con la base de datos para comprobar tu respuesta. Revisa tu conexión e inténtalo de nuevo.');
    throw new Error(m || 'No se pudo comprobar la respuesta.');
  }
  if (!data || typeof data.correcto !== 'boolean') throw new Error('Respuesta inesperada del servidor al comprobar.');
  return data;
}
