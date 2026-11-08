// Lectura de la tabla `personaje` (id, nombre, tipo, descripcion, imagen_url e imagen_mini_url).
// imagen_mini_url es el muneco del mapa. Si la columna aun no existe en la base (falta correr database/migraciones/10_personaje_mini.sql),
// se vuelve a pedir sin ella y el juego usa imagen_url, asi la pantalla de personajes nunca se rompe.
import { cliente } from './cliente';

export async function consultarPersonajes() {
  const db = cliente();
  const con = await db.from('personaje').select('id, nombre, tipo, descripcion, imagen_url, imagen_mini_url').order('id');
  if (!con.error) return con.data || [];
  const sinColumna = con.error.code === '42703' || /imagen_mini_url/i.test(con.error.message || '');
  if (!sinColumna) throw con.error;
  const sin = await db.from('personaje').select('id, nombre, tipo, descripcion, imagen_url').order('id');
  if (sin.error) throw sin.error;
  return sin.data || [];
}
