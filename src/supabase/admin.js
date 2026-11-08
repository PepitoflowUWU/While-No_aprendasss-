// Llamadas del PANEL DE ADMINISTRACION. Todo pasa por funciones de la base (database/migraciones/18_panel_admin.sql): la base comprueba el
// permiso de cada una, y eliminar o cambiar contrasenas ademas exigen el codigo SMS del administrador (database/migraciones/24; nunca se valida aqui).
import { cliente } from './cliente.js';
import { errorSms } from './autenticacion.js';
import { RE_TELEFONO } from '../servicios/cuenta.js';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const CODIGO = /^U[0-9]{8}$/;

// ID del juego (uuid) o codigo de estudiante (U + 8 numeros)
export const esIdOCodigo = (t) => { const x = String(t || '').trim(); return UUID.test(x) || CODIGO.test(x); };

// Un mensaje claro para cada fallo (los de la base ya vienen en espanol)
function aError(error) {
  const m = String(error?.message || error || '');
  if (error?.code === 'PGRST202' || error?.code === '42883' || /could not find the function|does not exist/i.test(m)) {
    return Object.assign(new Error('Falta ejecutar database/migraciones/18_panel_admin.sql y database/migraciones/24_admin_verificacion_sms.sql en Supabase.'), { codigo: 'SIN_MIGRACION' });
  }
  if (/failed to fetch|networkerror/i.test(m)) return Object.assign(new Error('No se pudo conectar con la base de datos.'), { codigo: 'RED' });
  if (error?.hint === 'SMS_REQUERIDO') return Object.assign(new Error(m), { codigo: 'SMS_REQUERIDO' });
  return Object.assign(new Error(m || 'No se pudo completar la acción.'), { codigo: error?.code });
}

async function llamar(fn, args) {
  const { data, error } = await cliente().rpc(fn, args);
  if (error) throw aError(error);
  return data;
}

export const misPermisos = async () => { const d = await llamar('mis_permisos'); return Array.isArray(d) ? d : []; };
export const adminResumen = () => llamar('admin_resumen');
export const adminUsuarios = async (buscar = '', limite = 200) => (await llamar('admin_usuarios', { p_buscar: buscar || null, p_limite: limite })) || [];
export const adminEliminarUsuario = (usuario) => llamar('admin_eliminar_usuario', { p_usuario: usuario });
export const adminCambiarContrasena = (usuario, nueva) => llamar('admin_cambiar_contrasena', { p_usuario: usuario, p_nueva: nueva });
// Solo el super administrador (database/migraciones/26_roles_super_admin.sql)
export const adminRoles = async () => (await llamar('admin_roles')) || [];
export const adminAsignarRol = (usuario, rol) => llamar('admin_asignar_rol', { p_usuario: usuario, p_rol: rol });

// CODIGO SMS DEL ADMINISTRADOR (database/migraciones/24_admin_verificacion_sms.sql). Twilio (via Supabase) envia 6 digitos al celular
// guardado en la base para el administrador (usuario.telefono); al escribirlo, Supabase renueva la sesion marcandola como verificada por SMS y la base
// solo acepta eliminar / cambiar contrasena con una sesion asi de los ultimos 5 minutos (un codigo = una accion).
const fallaSms = (codigo, causa) => Object.assign(new Error(codigo), { codigo, causa });

// Cuenta de la sesion actual y su celular: el de usuario.telefono en la base, vinculado a su id (+51912345678, o '' si no tiene)
export async function celularAdmin() {
  const { data, error } = await cliente().auth.getUser();
  if (error) throw aError(error);
  const telefono = await llamar('mi_celular_admin');
  return { id: data?.user?.id || '', telefono: telefono || '' };
}

export async function enviarSmsAdmin(telefono) {
  if (!RE_TELEFONO.test(telefono)) throw fallaSms('TEL_INVALIDO');
  const { error } = await cliente().auth.signInWithOtp({ phone: telefono, options: { shouldCreateUser: false } });
  if (error) throw errorSms(error);
}

// Comprueba el codigo. La sesion nueva debe ser de la MISMA cuenta: si no, se cierra y no se sigue.
export async function verificarSmsAdmin(telefono, codigo, idAdmin) {
  if (!/^[0-9]{6}$/.test(String(codigo))) throw fallaSms('CODIGO_SMS_INVALIDO');
  const { data, error } = await cliente().auth.verifyOtp({ phone: telefono, token: String(codigo), type: 'sms' });
  if (error) {
    const e = errorSms(error);
    throw e.codigo === 'SMS_ESPERA' ? e : fallaSms('CODIGO_SMS_INVALIDO', error);
  }
  if (idAdmin && data?.user?.id !== idAdmin) {
    await cliente().auth.signOut();
    throw fallaSms('OTRA_CUENTA');
  }
}
