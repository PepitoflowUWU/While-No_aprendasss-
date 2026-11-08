// Registro e inicio de sesion con Supabase Auth.
// - No se verifica que el correo exista de verdad: el correo es solo "codigo@utp.edu.pe" y no se envia nada.
//   (En Supabase, Authentication > Providers > Email > "Confirm email" debe estar APAGADO.)
// - La contrasena la maneja Supabase Auth (cifrada). Nunca se guarda en tablas propias ni en el navegador.
// - La fila de `usuario` (y su configuracion y 3 comodines) la crea UNA funcion de la base: completar_registro().
//   Asi el registro no depende de que existan roles o comodines cargados: la funcion los crea si faltan.
import { cliente, PG } from './cliente';
import { cargarPerfil } from './usuarios';
import { correoDe, validarCodigo, RE_TELEFONO, telefonoDeAuth } from '../servicios/cuenta';

// Errores con un codigo estable para que las pantallas muestren el mensaje que ya tienen.
const falla = (codigo, causa) => Object.assign(new Error(codigo), { codigo, causa });

// Comprueba si el codigo ya tiene cuenta (funcion de la base). null = no se pudo comprobar.
export async function codigoDisponible(codigo) {
  try {
    const { data, error } = await cliente().rpc('codigo_estudiante_disponible', { p_codigo: codigo });
    if (error) throw error;
    return Boolean(data);
  } catch { return null; }
}

// REGISTRO EN 3 PASOS
//  1) crearCuentaAuth(): cuenta en Supabase Auth (o se retoma una que quedo a medias). El perfil de `usuario` aun NO existe.
//  2) enviarCodigoSms() + verificarCodigoSms(): Supabase le pide a Twilio un codigo de 6 digitos por SMS y comprueba que el estudiante
//     lo escriba igual. Solo asi Authentication marca el celular como verificado (phone_confirmed_at).
//  3) finalizarRegistro(): la base crea el perfil (completar_registro) y SOLO lo hace si el celular ya esta verificado:
//     no se puede saltear la verificacion llamando a la API directamente. El nombre de usuario lo asigna la base
//     (Jugador + 4 ultimos digitos, con .2, .3 si se repite).
export async function crearCuentaAuth({ codigo, password, telefono = '' }) {
  const db = cliente();
  if (!validarCodigo(codigo)) throw falla('CODIGO_INVALIDO');          // estricto: U + 8 numeros, sin convertir
  const email = correoDe(codigo).toLowerCase();

  let user = null;
  const { data, error } = await db.auth.signUp({ email, password });
  if (error) {
    if (/already|registered|exists/i.test(error.message)) user = await retomarCuenta(db, email, password);
    else if (/password/i.test(error.message)) throw falla('CLAVE_DEBIL', error);
    else throw falla('AUTH', error);
  } else if (!data.user) {
    throw falla('AUTH');
  } else if (data.user.identities && data.user.identities.length === 0) {
    // Supabase no avisa con error cuando el correo ya existe: devuelve un usuario sin identidades
    user = await retomarCuenta(db, email, password);
  } else if (data.session) {
    user = data.user;
  } else {
    // Sin sesion: se intenta entrar directamente (no hay nada que verificar en el correo)
    const r = await db.auth.signInWithPassword({ email, password });
    if (r.error) throw falla('CONFIRMAR_CORREO', r.error);
    user = r.data.user;
  }
  // Una cuenta retomada puede tener ya el celular verificado (si el estudiante volvio atras): no se pide otro SMS
  const celularVerificado = Boolean(user.phone_confirmed_at) && telefono !== '' && telefonoDeAuth(user.phone) === telefono;
  return { user, celularVerificado };
}

// Errores de Supabase/Twilio con un codigo estable para mostrar un mensaje claro
export function errorSms(error) {
  const m = String(error?.message || ''); const c = String(error?.code || '');
  if (c === 'phone_exists' || /already (been )?registered|already exists|already in use|phone.*taken/i.test(m)) return falla('TEL_EN_USO', error);
  if (c === 'over_sms_send_rate_limit' || error?.status === 429 || /rate limit|too many|only request this after|security purposes/i.test(m)) return falla('SMS_ESPERA', error);
  if (/invalid.*phone|phone.*invalid|unsupported phone|not a valid phone/i.test(m)) return falla('TEL_INVALIDO', error);
  return falla('SMS_FALLO', error);
}

// Pide el SMS: Twilio envia un codigo de 6 digitos a ese numero (+51 9XXXXXXXX). Requiere la sesion de la cuenta del paso 1.
export async function enviarCodigoSms(telefono) {
  if (!RE_TELEFONO.test(telefono)) throw falla('TEL_INVALIDO');
  const { error } = await cliente().auth.updateUser({ phone: telefono });
  if (error) throw errorSms(error);
}

// Comprueba el codigo que escribio el estudiante contra el que se envio. Si coincide, el celular queda verificado.
export async function verificarCodigoSms(telefono, codigo) {
  if (!/^[0-9]{6}$/.test(String(codigo))) throw falla('CODIGO_SMS_INVALIDO');
  const { error } = await cliente().auth.verifyOtp({ phone: telefono, token: String(codigo), type: 'phone_change' });
  if (error) {
    const e = errorSms(error);
    throw e.codigo === 'SMS_ESPERA' ? e : falla('CODIGO_SMS_INVALIDO', error);
  }
}

// Crea el perfil del jugador (usuario + configuracion + 3 comodines) con el personaje elegido.
export async function finalizarRegistro({ codigo, personajeId, musica = true, animaciones = true }) {
  const db = cliente();
  if (!validarCodigo(codigo)) throw falla('CODIGO_INVALIDO');
  const { data: ses } = await db.auth.getSession();
  const user = ses?.session?.user;
  if (!user) throw falla('SIN_SESION');

  const { error: e } = await db.rpc('completar_registro', { p_codigo: codigo, p_personaje_id: personajeId, p_musica: musica, p_animaciones: animaciones });
  if (e) {
    // Falta verificar el celular: se puede verificar y reintentar, no hace falta cerrar la sesion
    if (e.code === '42501' && /celular/i.test(e.message || '')) throw falla('CELULAR_SIN_VERIFICAR', e);
    await db.auth.signOut();
    if (e.code === PG.UNICO) throw falla(/telefono/i.test(e.message || '') ? 'TEL_EN_USO' : 'CODIGO_DUPLICADO', e);
    if (/celular debe ser/i.test(e.message || '')) throw falla('TEL_INVALIDO', e);
    throw falla('PERFIL', e);
  }

  const perfil = await cargarPerfil(user.id);
  if (!perfil) throw falla('PERFIL');
  return perfil;
}

// El correo ya existia en Authentication. Si es una cuenta que quedo a medias (sin fila en `usuario`, por un
// intento anterior que fallo) y la contrasena coincide, se retoma y se completa. Si ya es una cuenta completa
// o la contrasena no coincide, el codigo ya esta en uso.
async function retomarCuenta(db, email, password) {
  const r = await db.auth.signInWithPassword({ email, password });
  if (r.error) throw falla('CODIGO_DUPLICADO', r.error);
  const { data: fila } = await db.from('usuario').select('id').eq('id', r.data.user.id).maybeSingle();
  if (fila) { await db.auth.signOut(); throw falla('CODIGO_DUPLICADO'); }
  return r.data.user;
}

export async function iniciarSesion({ correo, password }) {
  const db = cliente();
  const { data, error } = await db.auth.signInWithPassword({ email: correo.trim().toLowerCase(), password });
  if (error) {
    if (/confirm/i.test(error.message)) throw falla('CONFIRMAR_CORREO', error);
    throw falla('CREDENCIALES', error);
  }
  const perfil = await cargarPerfil(data.user.id);
  if (!perfil) { await db.auth.signOut(); throw falla('SIN_PERFIL'); }
  return perfil;
}

// Recupera la sesion guardada por Supabase al recargar la pagina.
export async function restaurarSesion() {
  const db = cliente();
  const { data } = await db.auth.getSession();
  const user = data?.session?.user;
  if (!user) return null;
  return cargarPerfil(user.id);
}

export async function cerrarSesionAuth() {
  try { await cliente().auth.signOut(); } catch { /* ya estaba cerrada */ }
}
