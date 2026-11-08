// Ranking de usuarios REGISTRADOS (los invitados nunca aparecen). Lee la tabla de solo lectura `ranking_publico`.
// - Con sesion (jugador con cuenta): nombre, codigo, puntos, racha maxima, ultima conexion y personaje (para la ficha).
// - Sin sesion (invitado): solo nombre, puntos y personaje; el resto no esta permitido para el publico.
// Nunca se expone el correo.
import { cliente } from './cliente';

export async function consultarRanking(limite = 50) {
  const db = cliente();
  const { data: sesion } = await db.auth.getSession();
  const columnas = sesion?.session
    ? 'nombre_usuario, codigo_estudiante, puntaje_total, racha_maxima, ultima_conexion, personaje_id'
    : 'nombre_usuario, puntaje_total, personaje_id';
  const { data, error } = await db
    .from('ranking_publico')
    .select(columnas)
    .order('puntaje_total', { ascending: false })
    .order('nombre_usuario', { ascending: true })
    .limit(limite);
  if (error) throw error;
  return data || [];
}
