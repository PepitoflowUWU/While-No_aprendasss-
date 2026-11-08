// Logros reclamados de un usuario registrado. La base comprueba la meta de cada logro antes de entregarlo (database/migraciones/20_logros.sql).
import { cliente } from './cliente.js';

function aError(error) {
  const m = String(error?.message || error || '');
  if (error?.code === 'PGRST202' || error?.code === '42883' || /could not find the function|does not exist/i.test(m)) {
    return Object.assign(new Error('Falta ejecutar database/migraciones/20_logros.sql en Supabase.'), { codigo: 'SIN_MIGRACION' });
  }
  if (/failed to fetch|networkerror/i.test(m)) return Object.assign(new Error('No se pudo conectar con la base de datos.'), { codigo: 'RED' });
  return Object.assign(new Error(m || 'No se pudo completar la acción.'), { codigo: error?.code });
}
async function llamar(fn, args) {
  const { data, error } = await cliente().rpc(fn, args);
  if (error) throw aError(error);
  return data;
}

export const logrosReclamados = async () => { const d = await llamar('logros_reclamados'); return Array.isArray(d) ? d : []; };
export const reclamarLogro = (codigo) => llamar('reclamar_logro', { p_codigo: codigo });
export const reclamarLogros = async () => { const d = await llamar('reclamar_logros'); return Array.isArray(d) ? d : []; };

// Logros destacados (hasta 3) que el jugador muestra en su perfil (database/migraciones/31_logros_destacados.sql)
function sinMigracion31(e) {
  return e.codigo === 'SIN_MIGRACION' ? Object.assign(new Error('Falta ejecutar database/migraciones/31_logros_destacados.sql en Supabase.'), { codigo: 'SIN_MIGRACION' }) : e;
}
export const logrosDestacados = async () => {
  try { const d = await llamar('mis_logros_destacados'); return Array.isArray(d) ? d : []; }
  catch (e) { throw sinMigracion31(e); }
};
export const guardarLogrosDestacados = async (codigos) => {
  try { const d = await llamar('guardar_logros_destacados', { p_codigos: codigos }); return Array.isArray(d) ? d : []; }
  catch (e) { throw sinMigracion31(e); }
};
