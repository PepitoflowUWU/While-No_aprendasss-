import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { CrownIcon } from '../comun/PixelIcons';
import { adminResumen, adminUsuarios, adminEliminarUsuario, adminCambiarContrasena, adminRoles, adminAsignarRol, esIdOCodigo, celularAdmin, enviarSmsAdmin, verificarSmsAdmin } from '../../supabase/admin.js';
import { enmascararTelefono } from '../../servicios/cuenta.js';
import '../../estilos/admin.css';

// Panel de administracion (boton de la corona). Solo se abre si la sesion tiene el permiso panel_admin; ademas la base
// comprueba el permiso en cada llamada, y eliminar / cambiar contrasena exigen el codigo SMS
// que Twilio envia al celular del administrador (database/migraciones/24_admin_verificacion_sms.sql).
// Un administrador no puede cambiar la contrasena de otro, y solo el super administrador (U24207317) asigna roles (26).
const SECCIONES = [
  { id: 'resumen', nombre: 'Resumen', icono: '▦' },
  { id: 'usuarios', nombre: 'Usuarios', icono: '☷' },
  { id: 'eliminar', nombre: 'Eliminar cuenta', icono: '✕' },
  { id: 'contrasena', nombre: 'Cambiar contraseña', icono: '✎' },
  { id: 'roles', nombre: 'Asignar rol', icono: '⚑', soloSuper: true },
  { id: 'inventario', nombre: 'Inventario', icono: '▣', pronto: true },
];

export const formatoHoras = (seg = 0) => (seg < 3600 ? `${Math.round(seg / 60)} min` : `${(seg / 3600).toFixed(1)} h`);
export function hace(fecha, ahora = Date.now()) {
  if (!fecha) return '—';
  const s = Math.max(0, (ahora - new Date(fecha).getTime()) / 1000);
  if (s < 90) return 'ahora';
  if (s < 3600) return `hace ${Math.round(s / 60)} min`;
  if (s < 86400) return `hace ${Math.round(s / 3600)} h`;
  return `hace ${Math.round(s / 86400)} d`;
}

const NOMBRE_ROL = { administrador: 'ADMIN', estudiante: 'ESTUDIANTE' };
function Insignia({ rol }) { return <span className={`adm-rol ${rol === 'administrador' ? 'adm-rol-admin' : ''}`}>{NOMBRE_ROL[rol] || String(rol || '').toUpperCase()}</span>; }
// La contrasena de OTRO administrador no se puede cambiar (la base tambien lo bloquea)
const esOtroAdmin = (u, yo) => u?.rol === 'administrador' && u.id !== yo;

// ── Resumen ───────────────────────────────────────────────────────────────────────────────────────
function Resumen({ resumen, usuarios }) {
  const niveles = Array.from({ length: resumen.niveles_totales || 1 }, (_, i) => i + 1);
  const porNivel = niveles.map((n) => usuarios.filter((u) => u.nivel === n).length);
  const tope = Math.max(1, ...porNivel);
  const top = [...usuarios].sort((a, b) => b.puntaje_total - a.puntaje_total).slice(0, 5);
  const quienes = resumen.quienes || [];
  const resto = Math.max(0, (resumen.cuantos_nivel_maximo || 0) - quienes.length);
  // Hombres y mujeres: segun el personaje que eligio cada usuario (Chico = hombre, Chica = mujer)
  const hayGenero = resumen.hombres !== undefined;
  const hombres = resumen.hombres ?? 0;
  const mujeres = resumen.mujeres ?? 0;
  const sinPersonaje = resumen.sin_personaje ?? 0;
  const conPersonaje = hombres + mujeres;
  const pH = conPersonaje ? Math.round((hombres / conPersonaje) * 100) : 0;
  const pM = conPersonaje ? 100 - pH : 0;
  return (
    <div className="adm-resumen">
      <div className="adm-tarjetas">
        <div className="adm-card">
          <span className="adm-card-t">USUARIOS TOTALES</span>
          <span className="adm-card-n" data-testid="total-usuarios">{resumen.total_usuarios}</span>
          <span className="adm-card-s">{resumen.estudiantes} estudiantes · {resumen.administradores} {resumen.administradores === 1 ? 'administrador' : 'administradores'}</span>
        </div>
        <div className="adm-card adm-card-oro">
          <span className="adm-card-t">NIVEL MÁXIMO ALCANZADO</span>
          <span className="adm-card-n" data-testid="nivel-maximo">Nivel {resumen.nivel_maximo}<small> de {resumen.niveles_totales}</small></span>
          <span className="adm-card-s" data-testid="quienes">
            {resumen.nivel_maximo > 1
              ? <>Lo alcanzó: <b>{quienes.map((q) => `${q.nombre} (${q.codigo || 'sin código'})`).join(', ')}</b>{resto > 0 ? ` y ${resto} más` : ''}</>
              : 'Nadie ha completado el primer nivel todavía.'}
          </span>
        </div>
        <div className="adm-card">
          <span className="adm-card-t">HORAS JUGADAS</span>
          <span className="adm-card-n">{resumen.horas_totales}<small> h</small></span>
          <span className="adm-card-s">Entre todos los usuarios</span>
        </div>
        <div className="adm-card">
          <span className="adm-card-t">CONECTADOS AHORA</span>
          <span className="adm-card-n">{resumen.conectados_ahora}</span>
          <span className="adm-card-s">Activos en los últimos 4 minutos</span>
        </div>
      </div>
      <section className="adm-caja adm-genero" aria-label="Hombres y mujeres">
        <h3>Hombres y mujeres</h3>
        {hayGenero ? (
          <>
            <div className="adm-genero-nums">
              <div className="adm-genero-h"><span>HOMBRES</span><b data-testid="hombres">{hombres}</b><small>{pH}%</small></div>
              <div className="adm-genero-m"><span>MUJERES</span><b data-testid="mujeres">{mujeres}</b><small>{pM}%</small></div>
            </div>
            <div className="adm-genero-barra" role="img" aria-label={`${hombres} hombres y ${mujeres} mujeres`}>
              <i className="h" style={{ width: `${pH}%` }} /><i className="m" style={{ width: `${pM}%` }} />
            </div>
            <p className="adm-genero-nota" data-testid="nota-genero">
              {sinPersonaje > 0 ? ` ${sinPersonaje} ${sinPersonaje === 1 ? 'usuario no tiene' : 'usuarios no tienen'} personaje.` : ''}
            </p>
          </>
        ) : <p className="adm-vacio">Ejecuta database/migraciones/22_quitar_perro_y_conteo_genero.sql en Supabase para ver este dato.</p>}
      </section>
      <div className="adm-dos">
        <section className="adm-caja">
          <h3>Jugadores por nivel</h3>
          <ul className="adm-barras">
            {niveles.map((n, i) => (
              <li key={n}><span>Nivel {n}</span><span className="adm-barra"><i style={{ width: `${(porNivel[i] / tope) * 100}%` }} /></span><b>{porNivel[i]}</b></li>
            ))}
          </ul>
        </section>
        <section className="adm-caja">
          <h3>Mejores puntajes</h3>
          <ol className="adm-top">
            {top.map((u) => (<li key={u.id}><span>{u.nombre_usuario}</span><b>{u.puntaje_total}</b></li>))}
            {!top.length && <li className="adm-vacio">Sin datos todavía</li>}
          </ol>
        </section>
      </div>
    </div>
  );
}

// ── Usuarios ──────────────────────────────────────────────────────────────────────────────────────
function Usuarios({ usuarios, onAccion, yo, puedeRoles }) {
  const [texto, setTexto] = useState('');
  const [detalle, setDetalle] = useState(null);
  const lista = useMemo(() => {
    const t = texto.trim().toLowerCase();
    if (!t) return usuarios;
    return usuarios.filter((u) => [u.nombre_usuario, u.codigo_estudiante, u.correo, u.id].some((x) => String(x || '').toLowerCase().includes(t)));
  }, [usuarios, texto]);
  return (
    <div className={`adm-usuarios ${detalle ? 'con-detalle' : ''}`}>
      <div className="adm-barra-busqueda">
        <input type="search" value={texto} onChange={(e) => setTexto(e.target.value)} placeholder="Buscar por nombre, código, correo o ID…" aria-label="Buscar usuario" />
        <span className="adm-cuenta">{lista.length} de {usuarios.length}</span>
      </div>
      <div className="adm-tabla-wrap">
        <table className="adm-tabla">
          <thead><tr><th>Jugador</th><th>Rol</th><th>Nivel</th><th>Racha</th><th>Horas</th><th>Comodines</th><th>Inventario</th><th>Última conexión</th></tr></thead>
          <tbody>
            {lista.map((u) => (
              <tr key={u.id} tabIndex={0} className={detalle?.id === u.id ? 'sel' : ''} onClick={() => setDetalle(u)} onKeyDown={(e) => e.key === 'Enter' && setDetalle(u)}>
                <td><b>{u.nombre_usuario}</b><small>{u.codigo_estudiante || 'sin código'}</small></td>
                <td><Insignia rol={u.rol} /></td>
                <td>Nivel {u.nivel}</td>
                <td>{u.racha_actual} <small>máx. {u.racha_maxima}</small></td>
                <td>{formatoHoras(u.segundos_jugados)}</td>
                <td>{u.comodines}</td>
                <td className="adm-pronto">Próximamente</td>
                <td>{hace(u.ultima_conexion)}</td>
              </tr>
            ))}
            {!lista.length && <tr><td colSpan={8} className="adm-vacio">No hay usuarios que coincidan.</td></tr>}
          </tbody>
        </table>
      </div>
      {detalle && (
        <aside className="adm-detalle" aria-label={`Información de ${detalle.nombre_usuario}`}>
          <button type="button" className="adm-x" onClick={() => setDetalle(null)} aria-label="Cerrar detalle">×</button>
          <h3>{detalle.nombre_usuario} <Insignia rol={detalle.rol} /></h3>
          <dl>
            <dt>ID del juego</dt><dd className="adm-mono">{detalle.id}</dd>
            <dt>Código</dt><dd>{detalle.codigo_estudiante || '—'}</dd>
            <dt>Correo</dt><dd>{detalle.correo}</dd>
            <dt>Celular</dt><dd data-testid="ficha-celular">{detalle.telefono || '—'}</dd>
            <dt>Nivel en el que está</dt><dd>Nivel {detalle.nivel} ({detalle.niveles_completados} completados)</dd>
            <dt>Racha</dt><dd>{detalle.racha_actual} días (máxima {detalle.racha_maxima})</dd>
            <dt>Puntos</dt><dd>{detalle.puntaje_total}</dd>
            <dt>Horas jugadas</dt><dd>{formatoHoras(detalle.segundos_jugados)}</dd>
            <dt>Comodines</dt><dd>{detalle.comodines}</dd>
            <dt>Inventario</dt><dd className="adm-pronto">Aún no disponible</dd>
            <dt>Última conexión</dt><dd>{hace(detalle.ultima_conexion)}</dd>
            <dt>Registrado</dt><dd>{detalle.fecha_registro ? new Date(detalle.fecha_registro).toLocaleDateString('es-PE') : '—'}</dd>
          </dl>
          <div className="adm-acciones">
            <button type="button" className="adm-btn" disabled={esOtroAdmin(detalle, yo)} title={esOtroAdmin(detalle, yo) ? 'No puedes cambiar la contraseña de otro administrador' : undefined}
              onClick={() => onAccion('contrasena', detalle)}>Cambiar contraseña</button>
            {puedeRoles && <button type="button" className="adm-btn" disabled={detalle.id === yo} onClick={() => onAccion('roles', detalle)}>Asignar rol</button>}
            <button type="button" className="adm-btn adm-btn-peligro" disabled={detalle.rol === 'administrador'} onClick={() => onAccion('eliminar', detalle)}>Eliminar cuenta</button>
          </div>
        </aside>
      )}
    </div>
  );
}

// ── Validador: antes de una accion delicada se envia un codigo por SMS al celular del administrador ─
const ESPERA_SMS = 30;     // segundos antes de poder pedir otro SMS (debe coincidir con "sms_max_frequency" de Supabase)
const MAX_INTENTOS = 5;    // codigos equivocados permitidos por cada SMS; despues hay que pedir otro
const MENSAJES_SMS = {
  SIN_CELULAR: 'Tu cuenta de administrador no tiene celular en la base de datos (usuario.telefono). Ejecuta database/utilidades/25_celular_admin.sql en Supabase.',
  CODIGO_SMS_INVALIDO: 'El código no coincide con el SMS que te enviamos (o ya venció).',
  SMS_INCOMPLETO: 'El código del SMS tiene exactamente 6 números.',
  SMS_SIN_ENVIAR: 'Todavía no se envió ningún SMS. Pide el código primero.',
  SMS_BLOQUEADO: `Te equivocaste ${MAX_INTENTOS} veces. Pide un código nuevo para seguir.`,
  SMS_ESPERA: 'Espera un momento antes de pedir otro código.',
  TEL_INVALIDO: 'El celular de tu cuenta no es válido (+51 y 9 dígitos).',
  OTRA_CUENTA: 'Ese celular pertenece a otra cuenta. Se cerró la sesión por seguridad.',
  SMS_FALLO: 'No se pudo enviar el SMS. Inténtalo de nuevo en un momento.',
};

// Mensaje para un fallo al enviar el SMS. Si Supabase/Twilio dio un motivo, se agrega (y se deja en la consola, F12)
function mensajeEnvio(err) {
  if (err?.causa) console.warn('[SMS admin]', err.causa);
  const base = MENSAJES_SMS[err?.codigo] || err?.message || MENSAJES_SMS.SMS_FALLO;
  return err?.codigo === 'SMS_FALLO' && err.causa?.message ? `${base} Motivo: ${err.causa.message}` : base;
}

// Al abrirse envia el SMS y solo deja confirmar con el codigo de ESE SMS: Supabase lo compara con el ultimo enviado
// (pedir otro anula el anterior) y la base exige que la sesion se haya verificado asi (database/migraciones/24).
function Confirmar({ titulo, texto, boton, peligro, onConfirmar, onCancelar }) {
  const [admin, setAdmin] = useState(null);            // { id, telefono } de la sesion
  const [codigoSms, setCodigoSms] = useState('');
  const [enviado, setEnviado] = useState(false);       // ya salio un SMS que se puede usar
  const [smsListo, setSmsListo] = useState(false);     // el SMS ya se verifico pero la accion fallo: se puede reintentar sin otro
  const [intentos, setIntentos] = useState(0);
  const [espera, setEspera] = useState(0);
  const [enviando, setEnviando] = useState(false);
  const [verificando, setVerificando] = useState(false);
  const [error, setError] = useState('');
  const [aviso, setAviso] = useState('');
  const inicio = useRef(false);
  const bloqueado = intentos >= MAX_INTENTOS;

  useEffect(() => {
    const t = (e) => { if (e.key === 'Escape') { e.stopPropagation(); onCancelar(); } };
    window.addEventListener('keydown', t, true);
    return () => window.removeEventListener('keydown', t, true);
  }, [onCancelar]);
  useEffect(() => {
    if (espera <= 0) return undefined;
    const t = setTimeout(() => setEspera((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [espera]);

  const pedirSms = async (nuevo) => {
    setEnviando(true); setError(''); setAviso('');
    try {
      const a = admin || await celularAdmin();
      setAdmin(a);
      if (!a.telefono) throw Object.assign(new Error('SIN_CELULAR'), { codigo: 'SIN_CELULAR' });
      await enviarSmsAdmin(a.telefono);
      setEnviado(true); setSmsListo(false); setIntentos(0); setCodigoSms(''); setEspera(ESPERA_SMS);
      if (nuevo) setAviso('Te enviamos un código nuevo. El anterior ya no sirve.');
    } catch (err) {
      setError(mensajeEnvio(err));
      if (err.codigo === 'SMS_ESPERA') setEspera(ESPERA_SMS);
    } finally { setEnviando(false); }
  };
  // El SMS sale apenas se abre la ventana (una sola vez)
  useEffect(() => { if (!inicio.current) { inicio.current = true; pedirSms(false); } }); // eslint-disable-line react-hooks/exhaustive-deps

  const ejecutar = async () => {
    try { await onConfirmar(); }
    catch (err) {
      setVerificando(false);
      if (err.codigo === 'SMS_REQUERIDO') { setSmsListo(false); setEnviado(false); setError(`${err.message} Pide un código nuevo.`); return; }
      setError(err.message || 'No se pudo completar la acción.');
    }
  };

  const verificar = async (e) => {
    e.preventDefault();
    if (verificando || enviando) return;
    setError(''); setAviso('');
    if (smsListo) { setVerificando(true); await ejecutar(); return; }
    if (!enviado) { setError(MENSAJES_SMS.SMS_SIN_ENVIAR); return; }
    if (bloqueado) { setError(MENSAJES_SMS.SMS_BLOQUEADO); return; }
    if (!/^[0-9]{6}$/.test(codigoSms)) { setError(MENSAJES_SMS.SMS_INCOMPLETO); return; }
    setVerificando(true);
    try { await verificarSmsAdmin(admin.telefono, codigoSms, admin.id); }
    catch (err) {
      setVerificando(false); setCodigoSms('');
      if (err.codigo !== 'CODIGO_SMS_INVALIDO') { setError(MENSAJES_SMS[err.codigo] || MENSAJES_SMS.CODIGO_SMS_INVALIDO); return; }
      const n = intentos + 1;
      setIntentos(n);
      setError(n >= MAX_INTENTOS ? MENSAJES_SMS.SMS_BLOQUEADO : `${MENSAJES_SMS.CODIGO_SMS_INVALIDO} Te quedan ${MAX_INTENTOS - n} ${MAX_INTENTOS - n === 1 ? 'intento' : 'intentos'}.`);
      return;
    }
    setSmsListo(true);
    await ejecutar();
  };

  const puedeConfirmar = smsListo || (enviado && !bloqueado && codigoSms.length === 6);
  return (
    <div className="adm-modal-velo" role="presentation">
      <form className="adm-modal" role="alertdialog" aria-modal="true" aria-labelledby="adm-modal-t" onSubmit={verificar}>
        <h3 id="adm-modal-t">{titulo}</h3>
        <p>{texto}</p>
        <p className="adm-ayuda" role="status">
          {enviando ? 'Enviando el código por SMS a tu celular…'
            : enviado ? <>Te enviamos un código de 6 dígitos al <b>{enmascararTelefono(admin?.telefono)}</b>. Escríbelo para confirmar.</>
            : 'Para confirmar te enviaremos un código por SMS a tu celular.'}
        </p>
        {!smsListo && (
          <label className="adm-campo">
            <span>Código SMS</span>
            <input type="text" inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={codigoSms} placeholder="••••••" autoFocus
              disabled={!enviado || bloqueado || verificando} aria-invalid={!!error}
              onChange={(e) => setCodigoSms(e.target.value.replace(/\D/g, '').slice(0, 6))} aria-label="Código SMS" data-testid="codigo-sms-admin" />
          </label>
        )}
        <div className="adm-reenviar">
          <span>{enviado ? '¿No te llegó el SMS?' : 'Pide el código SMS'}</span>
          <button type="button" className="adm-btn" onClick={() => pedirSms(enviado)} disabled={espera > 0 || enviando || verificando} data-testid="reenviar-sms-admin">
            {enviando ? 'Enviando…' : espera > 0 ? `Enviar código de nuevo (${espera} s)` : enviado ? 'Enviar código de nuevo' : 'Enviar código'}
          </button>
        </div>
        {aviso && <p className="adm-exito" role="status">{aviso}</p>}
        {error && <p className="adm-error" role="alert">{error}</p>}
        <div className="adm-acciones">
          <button type="button" className="adm-btn" onClick={onCancelar} disabled={verificando}>Cancelar</button>
          <button type="submit" className={`adm-btn ${peligro ? 'adm-btn-peligro' : 'adm-btn-ok'}`} disabled={!puedeConfirmar || verificando}>{verificando ? 'Verificando…' : boton}</button>
        </div>
      </form>
    </div>
  );
}

// ── Buscar al usuario objetivo (para eliminar o cambiar contrasena) ─────────────────────────────
function BuscarUsuario({ inicial, onEncontrado, onLimpiar }) {
  const [texto, setTexto] = useState(inicial?.id || '');
  const [error, setError] = useState('');
  const [buscando, setBuscando] = useState(false);
  const buscar = useCallback(async (t) => {
    const x = String(t).trim();
    setError('');
    if (!esIdOCodigo(x)) { setError('Escribe el ID del juego (formato largo con guiones) o el código del usuario (U + 8 números).'); return; }
    setBuscando(true);
    try {
      const lista = await adminUsuarios(x, 5);
      const u = lista.find((f) => f.id.toLowerCase() === x.toLowerCase() || f.codigo_estudiante === x);
      if (!u) { setError('No existe un usuario con ese ID o código.'); onLimpiar(); } else onEncontrado(u);
    } catch (e) { setError(e.message); onLimpiar(); }
    finally { setBuscando(false); }
  }, [onEncontrado, onLimpiar]);
  useEffect(() => { if (inicial?.id) buscar(inicial.id); /* eslint-disable-next-line */ }, []);
  return (
    <form className="adm-buscar" onSubmit={(e) => { e.preventDefault(); buscar(texto); }}>
      <label className="adm-campo">
        <span>ID del juego o código del usuario</span>
        <input value={texto} onChange={(e) => { setTexto(e.target.value); onLimpiar(); }} placeholder="Ej.: 2b49b0e6-fd78-4eca-8b98-edcbdaaa6078 o U24000002" autoComplete="off" aria-label="ID del juego" />
      </label>
      <button type="submit" className="adm-btn" disabled={!texto.trim() || buscando}>{buscando ? 'Buscando…' : 'Buscar'}</button>
      {error && <p className="adm-error" role="alert">{error}</p>}
    </form>
  );
}

function FichaUsuario({ u }) {
  return (
    <div className="adm-ficha">
      <b>{u.nombre_usuario}</b> <Insignia rol={u.rol} />
      <span>{u.codigo_estudiante || 'sin código'} · Nivel {u.nivel} · {u.puntaje_total} puntos · {formatoHoras(u.segundos_jugados)}</span>
      <small className="adm-mono">{u.id}</small>
    </div>
  );
}

// ── Eliminar cuenta ───────────────────────────────────────────────────────────────────────────────
function Eliminar({ inicial, onCambio }) {
  const [objetivo, setObjetivo] = useState(null);
  const [confirmando, setConfirmando] = useState(false);
  const [hecho, setHecho] = useState('');
  const limpiar = useCallback(() => setObjetivo(null), []);
  const eliminar = async () => {
    const r = await adminEliminarUsuario(objetivo.id);
    setConfirmando(false); setObjetivo(null); setHecho(`Se eliminó la cuenta de ${r.nombre_usuario} (${r.codigo_estudiante || 'sin código'}).`);
    onCambio();
  };
  return (
    <div className="adm-form">
      <h2>Eliminar una cuenta</h2>
      <p className="adm-ayuda">Se borran su perfil, su progreso, sus comodines, su lugar en el ranking y su cuenta de acceso. No se puede deshacer.</p>
      {hecho && <p className="adm-exito" role="status">{hecho}</p>}
      <BuscarUsuario inicial={inicial} onEncontrado={(u) => { setObjetivo(u); setHecho(''); }} onLimpiar={limpiar} />
      {objetivo && (
        <div className="adm-resultado">
          <FichaUsuario u={objetivo} />
          {objetivo.rol === 'administrador'
            ? <p className="adm-error" role="alert">No se puede eliminar a un administrador desde el panel.</p>
            : <button type="button" className="adm-btn adm-btn-peligro" onClick={() => setConfirmando(true)}>Eliminar esta cuenta</button>}
        </div>
      )}
      {confirmando && objetivo && (
        <Confirmar peligro titulo="¿Eliminar esta cuenta?" boton="Sí, eliminar"
          texto={`Vas a eliminar la cuenta de ${objetivo.nombre_usuario} (${objetivo.codigo_estudiante || 'sin código'}). Perderá todo su progreso y no se puede deshacer.`}
          onConfirmar={eliminar} onCancelar={() => setConfirmando(false)} />
      )}
    </div>
  );
}

// ── Cambiar contrasena ────────────────────────────────────────────────────────────────────────────
function Contrasena({ inicial, yo }) {
  const [objetivo, setObjetivo] = useState(null);
  const [nueva, setNueva] = useState('');
  const [repetir, setRepetir] = useState('');
  const [ver, setVer] = useState(false);
  const [confirmando, setConfirmando] = useState(false);
  const [hecho, setHecho] = useState('');
  const limpiar = useCallback(() => setObjetivo(null), []);
  const problema = nueva.length < 6 ? 'La contraseña debe tener al menos 6 caracteres.'
    : nueva.length > 72 ? 'La contraseña puede tener como máximo 72 caracteres.'
    : nueva !== repetir ? 'Las dos contraseñas no coinciden.' : '';
  const cambiar = async () => {
    const r = await adminCambiarContrasena(objetivo.id, nueva);
    setConfirmando(false); setNueva(''); setRepetir(''); setHecho(`Se cambió la contraseña de ${r.nombre_usuario} (${r.codigo_estudiante || 'sin código'}).`);
  };
  return (
    <div className="adm-form">
      <h2>Cambiar la contraseña de un usuario</h2>
      <p className="adm-ayuda">Define una contraseña nueva para su cuenta. La persona la usará la próxima vez que inicie sesión.</p>
      {hecho && <p className="adm-exito" role="status">{hecho}</p>}
      <BuscarUsuario inicial={inicial} onEncontrado={(u) => { setObjetivo(u); setHecho(''); }} onLimpiar={limpiar} />
      {objetivo && (
        <div className="adm-resultado">
          <FichaUsuario u={objetivo} />
          {esOtroAdmin(objetivo, yo) ? <p className="adm-error" role="alert">No puedes cambiar la contraseña de otro administrador.</p> : <>
          <label className="adm-campo"><span>Contraseña nueva</span>
            <span className="adm-clave"><input type={ver ? 'text' : 'password'} value={nueva} onChange={(e) => setNueva(e.target.value)} autoComplete="new-password" aria-label="Contraseña nueva" />
              <button type="button" onClick={() => setVer((v) => !v)} aria-label={ver ? 'Ocultar contraseñas' : 'Mostrar contraseñas'}>{ver ? 'Ocultar' : 'Ver'}</button></span></label>
          <label className="adm-campo"><span>Repite la contraseña</span>
            <input type={ver ? 'text' : 'password'} value={repetir} onChange={(e) => setRepetir(e.target.value)} autoComplete="new-password" aria-label="Repite la contraseña" /></label>
          {(nueva || repetir) && problema && <p className="adm-error" role="alert">{problema}</p>}
          <button type="button" className="adm-btn adm-btn-ok" disabled={!!problema} onClick={() => setConfirmando(true)}>Cambiar contraseña</button>
          </>}
        </div>
      )}
      {confirmando && objetivo && (
        <Confirmar titulo="¿Cambiar la contraseña?" boton="Sí, cambiar"
          texto={`Vas a cambiar la contraseña de ${objetivo.nombre_usuario} (${objetivo.codigo_estudiante || 'sin código'}).`}
          onConfirmar={cambiar} onCancelar={() => setConfirmando(false)} />
      )}
    </div>
  );
}

// ── Asignar rol (solo el super administrador) ─────────────────────────────────────────────────────
function Roles({ inicial, yo, onCambio }) {
  const [objetivo, setObjetivo] = useState(null);
  const [roles, setRoles] = useState([]);
  const [rol, setRol] = useState('');
  const [errorRoles, setErrorRoles] = useState('');
  const [confirmando, setConfirmando] = useState(false);
  const [hecho, setHecho] = useState('');
  const limpiar = useCallback(() => { setObjetivo(null); setRol(''); }, []);
  useEffect(() => { adminRoles().then(setRoles).catch((e) => setErrorRoles(e.message)); }, []);
  const problema = !objetivo ? '' : objetivo.id === yo ? 'No puedes cambiar tu propio rol.'
    : !rol ? 'Elige el rol nuevo.' : rol === objetivo.rol ? `Ese usuario ya tiene el rol ${rol}.` : '';
  const asignar = async () => {
    const r = await adminAsignarRol(objetivo.id, rol);
    setConfirmando(false); setObjetivo(null); setRol('');
    setHecho(`${r.nombre_usuario} (${r.codigo_estudiante || 'sin código'}) pasó de ${r.rol_anterior} a ${r.rol_nuevo}.`);
    onCambio();
  };
  return (
    <div className="adm-form">
      <h2>Asignar el rol de un usuario</h2>
      <p className="adm-ayuda">Solo el super administrador puede usar esta sección. El cambio se aplica la próxima vez que la persona entre al juego.</p>
      {errorRoles && <p className="adm-error" role="alert">{errorRoles}</p>}
      {hecho && <p className="adm-exito" role="status">{hecho}</p>}
      <BuscarUsuario inicial={inicial} onEncontrado={(u) => { setObjetivo(u); setRol(''); setHecho(''); }} onLimpiar={limpiar} />
      {objetivo && (
        <div className="adm-resultado">
          <FichaUsuario u={objetivo} />
          <label className="adm-campo"><span>Rol nuevo</span>
            <select value={rol} onChange={(e) => setRol(e.target.value)} disabled={objetivo.id === yo} aria-label="Rol nuevo" data-testid="rol-nuevo">
              <option value="">Elige un rol…</option>
              {roles.map((r) => <option key={r.nombre} value={r.nombre} disabled={r.nombre === objetivo.rol}>{r.nombre}{r.nombre === objetivo.rol ? ' (actual)' : ''}</option>)}
            </select></label>
          {problema && (rol || objetivo.id === yo) && <p className="adm-error" role="alert">{problema}</p>}
          <button type="button" className="adm-btn adm-btn-ok" disabled={!!problema} onClick={() => setConfirmando(true)}>Asignar rol</button>
        </div>
      )}
      {confirmando && objetivo && (
        <Confirmar titulo="¿Cambiar el rol?" boton="Sí, asignar"
          texto={`Vas a cambiar el rol de ${objetivo.nombre_usuario} (${objetivo.codigo_estudiante || 'sin código'}) de ${objetivo.rol} a ${rol}.`}
          onConfirmar={asignar} onCancelar={() => setConfirmando(false)} />
      )}
    </div>
  );
}

// ── Panel ─────────────────────────────────────────────────────────────────────────────────────────
export default function AdminPanel({ sesion, onCerrar }) {
  const [seccion, setSeccion] = useState('resumen');
  const [resumen, setResumen] = useState(null);
  const [usuarios, setUsuarios] = useState(null);
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(true);
  const [objetivo, setObjetivo] = useState(null);     // usuario elegido en la lista, para precargar eliminar / contrasena

  const cargar = useCallback(async () => {
    setCargando(true); setError('');
    try {
      const [r, u] = await Promise.all([adminResumen(), adminUsuarios('', 500)]);
      setResumen(r); setUsuarios(u);
    } catch (e) { setError(e.message); }
    finally { setCargando(false); }
  }, []);
  useEffect(() => { cargar(); }, [cargar]);
  useEffect(() => {
    const t = (e) => { if (e.key === 'Escape') onCerrar(); };
    window.addEventListener('keydown', t);
    return () => window.removeEventListener('keydown', t);
  }, [onCerrar]);

  const irA = (id, u) => { setObjetivo(u || null); setSeccion(id); };
  const yo = sesion?.id;
  const puedeRoles = (sesion?.permisos || []).includes('asignar_rol');     // solo el super administrador (la base lo vuelve a comprobar)

  return (
    <div className="adm-velo" onMouseDown={(e) => e.target === e.currentTarget && onCerrar()}>
      <div className="adm" role="dialog" aria-modal="true" aria-label="Panel de administración">
        <aside className="adm-lateral">
          <div className="adm-marca"><span className="adm-corona"><CrownIcon size={34} /></span><span>ADMIN</span></div>
          <nav aria-label="Secciones del panel">
            {SECCIONES.filter((s) => !s.soloSuper || puedeRoles).map((s) => (
              <button key={s.id} type="button" className={`adm-nav ${seccion === s.id ? 'activa' : ''}`} disabled={s.pronto}
                aria-current={seccion === s.id ? 'page' : undefined} onClick={() => irA(s.id, null)}>
                <span className="adm-nav-i" aria-hidden="true">{s.icono}</span><span>{s.nombre}</span>{s.pronto && <em>pronto</em>}
              </button>
            ))}
          </nav>
          <button type="button" className="adm-nav adm-salir" onClick={onCerrar}><span className="adm-nav-i" aria-hidden="true">←</span><span>Cerrar panel</span></button>
        </aside>
        <main className="adm-main">
          <header className="adm-cab">
            <div><h1>Panel de administración</h1><span>Sesión de {sesion?.usuario || 'administrador'}</span></div>
            <button type="button" className="adm-btn" onClick={cargar} disabled={cargando}>{cargando ? 'Actualizando…' : 'Actualizar'}</button>
          </header>
          {error && <p className="adm-error adm-error-gral" role="alert">{error}</p>}
          {cargando && !resumen && !error && <p className="adm-cargando">Cargando…</p>}
          {resumen && usuarios && (
            <>
              {seccion === 'resumen' && <Resumen resumen={resumen} usuarios={usuarios} />}
              {seccion === 'usuarios' && <Usuarios usuarios={usuarios} onAccion={irA} yo={yo} puedeRoles={puedeRoles} />}
              {seccion === 'eliminar' && <Eliminar key={objetivo?.id || 'e'} inicial={objetivo} onCambio={cargar} />}
              {seccion === 'contrasena' && <Contrasena key={objetivo?.id || 'c'} inicial={objetivo} yo={yo} />}
              {seccion === 'roles' && puedeRoles && <Roles key={objetivo?.id || 'r'} inicial={objetivo} yo={yo} onCambio={cargar} />}
            </>
          )}
        </main>
      </div>
    </div>
  );
}
