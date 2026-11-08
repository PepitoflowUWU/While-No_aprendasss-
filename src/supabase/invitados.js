// Sesiones de invitado: viven en la tabla temporal `sesion_invitado`.
// Se crean y se cierran por funciones de la base (RPC), asi el navegador no necesita permisos
// directos sobre la tabla. Si la funcion aun no existe en la base, el juego sigue funcionando sin registro temporal.
import { cliente, configSupabase, supabaseConfigurado } from './cliente';

export async function crearSesionInvitado() {
  try {
    const { data, error } = await cliente().rpc('crear_sesion_invitado');
    if (error) throw error;
    return data || null;                       // uuid de la sesion
  } catch (e) {
    console.warn('[Supabase] No se pudo crear la sesion de invitado:', e?.message || e);
    return null;
  }
}

export async function cerrarSesionInvitado(id) {
  if (!id) return;
  try {
    const { error } = await cliente().rpc('cerrar_sesion_invitado', { p_id: id });
    if (error) throw error;
  } catch (e) {
    console.warn('[Supabase] No se pudo cerrar la sesion de invitado:', e?.message || e);
  }
}

// Para cuando se cierra la pestana: fetch con keepalive sigue vivo aunque la pagina se descargue.
export function cerrarSesionInvitadoAlSalir(id) {
  if (!id || !supabaseConfigurado) return;
  try {
    fetch(`${configSupabase.url}/rest/v1/rpc/cerrar_sesion_invitado`, {
      method: 'POST',
      keepalive: true,
      headers: {
        'Content-Type': 'application/json',
        apikey: configSupabase.clave,
        Authorization: `Bearer ${configSupabase.clave}`,
      },
      body: JSON.stringify({ p_id: id }),
    }).catch(() => {});
  } catch { /* nada que hacer */ }
}

// Barrido de sesiones abandonadas (navegador cerrado sin ejecutar codigo): borra solo las vencidas.
export async function limpiarInvitadosAbandonados() {
  try {
    await cliente().rpc('limpiar_invitados_vencidos');
  } catch { /* opcional */ }
}
