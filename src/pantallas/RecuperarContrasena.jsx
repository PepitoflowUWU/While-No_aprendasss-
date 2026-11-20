import React, { useEffect, useState } from 'react';
import { PixelButton } from '../components/comun/UI.jsx';
import GameBackground from '../components/comun/GameBackground.jsx';
import Campo from '../components/comun/CampoReg.jsx';
import { Icono } from '../components/comun/PixelArt.jsx';
import { validarCelular, telefonoDe, enmascararTelefono } from '../servicios/cuenta.js';
import { enviarSmsRecuperacion, verificarSmsRecuperacion, cambiarContrasena } from '../supabase/autenticacion.js';
import '../estilos/registro.css';

// ¿OLVIDASTE TU CONTRASEÑA? (desde Iniciar sesión), en 3 pasos:
//  1) el estudiante escribe el celular vinculado a su cuenta y le llega un código por SMS (Twilio, vía Supabase);
//  2) escribe el código de 6 dígitos;
//  3) elige la contraseña nueva (mismas reglas que al crear la cuenta). Luego vuelve a Iniciar sesión.
const ESPERA = 30;
const REQS = [
  { id: 'len', texto: 'Mínimo 8 caracteres', ok: (p) => p.length >= 8 },
  { id: 'may', texto: '1 mayúscula', ok: (p) => /[A-ZÁÉÍÓÚÑ]/.test(p) },
  { id: 'num', texto: '1 número', ok: (p) => /\d/.test(p) },
];
const MENSAJES = {
  TEL_INVALIDO: 'Revisa tu número de celular',
  TEL_SIN_CUENTA: 'Ese celular no está vinculado a ninguna cuenta',
  SMS_ESPERA: 'Espera un momento antes de pedir otro código',
  SMS_FALLO: 'No se pudo enviar el SMS. Inténtalo de nuevo en un momento',
  CODIGO_SMS_INVALIDO: 'Código incorrecto o vencido. Revisa el SMS o pide uno nuevo',
  CLAVE_DEBIL: 'La contraseña no cumple los requisitos de seguridad',
  CLAVE_IGUAL: 'La contraseña nueva debe ser distinta de la anterior',
  REAUTENTICAR: 'Por seguridad, vuelve a pedir el código SMS e inténtalo otra vez',
  CAMBIO_FALLO: 'No se pudo cambiar la contraseña. Inténtalo de nuevo',
};

export default function RecuperarContrasena({ go }) {
  const [paso, setPaso] = useState('telefono');     // telefono | codigo | clave | listo
  const [celular, setCelular] = useState('');
  const [codigo, setCodigo] = useState('');
  const [pass, setPass] = useState('');
  const [pass2, setPass2] = useState('');
  const [ver, setVer] = useState(false);
  const [error, setError] = useState('');
  const [aviso, setAviso] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [espera, setEspera] = useState(0);
  const telefono = telefonoDe(celular);

  useEffect(() => {
    if (espera <= 0) return undefined;
    const t = setTimeout(() => setEspera((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [espera]);

  const pedirSms = async (e) => {
    e?.preventDefault();
    if (!validarCelular(celular) || enviando || espera > 0) return;
    setEnviando(true); setError(''); setAviso('');
    try {
      await enviarSmsRecuperacion(telefono);
      setEspera(ESPERA); setCodigo('');
      if (paso === 'codigo') setAviso('Te enviamos un código nuevo. El anterior ya no sirve.');
      setPaso('codigo');
    } catch (err) {
      setError(MENSAJES[err?.codigo] || MENSAJES.SMS_FALLO);
      if (err?.codigo === 'SMS_ESPERA') setEspera(ESPERA);
    } finally { setEnviando(false); }
  };

  const verificar = async (e) => {
    e.preventDefault();
    if (codigo.length !== 6 || enviando) return;
    setEnviando(true); setError(''); setAviso('');
    try { await verificarSmsRecuperacion(telefono, codigo); setPaso('clave'); }
    catch (err) { setCodigo(''); setError(MENSAJES[err?.codigo] || MENSAJES.CODIGO_SMS_INVALIDO); }
    finally { setEnviando(false); }
  };

  const claveOk = REQS.every((r) => r.ok(pass));
  const errPass2 = pass2 && pass2 !== pass ? 'Las contraseñas no coinciden' : '';
  const guardar = async (e) => {
    e.preventDefault();
    if (!claveOk || pass !== pass2 || enviando) return;
    setEnviando(true); setError('');
    try { await cambiarContrasena(pass); setPass(''); setPass2(''); setPaso('listo'); }
    catch (err) {
      setError(MENSAJES[err?.codigo] || MENSAJES.CAMBIO_FALLO);
      if (err?.codigo === 'REAUTENTICAR') { setPaso('telefono'); setEspera(0); }
    } finally { setEnviando(false); }
  };

  const cargando = (txt) => (<>{txt}<span className="px-load" aria-hidden="true"><i /><i /><i /></span></>);

  return (
    <GameBackground>
      <div className="reg-screen">
        {paso === 'telefono' && (
          <form className="reg-panel" onSubmit={pedirSms} noValidate aria-busy={enviando}>
            <div className="reg-header">
              <h1>¿OLVIDASTE TU CONTRASEÑA?</h1>
              <p>Escribe el celular vinculado a tu cuenta y te enviaremos un código por SMS.</p>
            </div>
            <div className="reg-fields">
              <Campo id="rec-celular" etiqueta="CELULAR DE TU CUENTA" icono="phone" ayuda="El mismo número que verificaste al crear tu cuenta" error={error}>
                <div className="reg-tel">
                  <span className="reg-prefijo" aria-hidden="true">+51</span>
                  <input id="rec-celular" className="reg-input" type="tel" inputMode="numeric" autoComplete="tel-national" maxLength={9} value={celular}
                    placeholder="9XX XXX XXX" aria-invalid={!!error} aria-describedby="rec-celular-ayuda rec-celular-msg" autoFocus
                    onChange={(e) => { setCelular(e.target.value.replace(/\D/g, '').slice(0, 9)); setError(''); }} />
                </div>
              </Campo>
            </div>
            <div className="reg-actions">
              <PixelButton className="secondary" onClick={() => go('login')} disabled={enviando}>← VOLVER</PixelButton>
              <button type="submit" className={`pixel-button ${!validarCelular(celular) || enviando || espera > 0 ? 'pixel-disabled' : ''}`}
                disabled={!validarCelular(celular) || enviando || espera > 0}>
                {enviando ? cargando('ENVIANDO') : espera > 0 ? `ESPERA ${espera} s` : 'ENVIAR CÓDIGO →'}
              </button>
            </div>
          </form>
        )}

        {paso === 'codigo' && (
          <form className="reg-panel" onSubmit={verificar} noValidate aria-busy={enviando}>
            <div className="reg-header">
              <h1>REVISA TU CELULAR</h1>
              <p>Te enviamos un código de 6 dígitos por SMS al <b className="reg-tel-mask">{enmascararTelefono(telefono)}</b></p>
            </div>
            <div className="reg-fields">
              <Campo id="rec-codigo" etiqueta="CÓDIGO DE 6 DÍGITOS" icono="phone" ayuda="Puede tardar unos segundos en llegar" error={error}>
                <input id="rec-codigo" className="reg-input reg-codigo-sms" type="text" inputMode="numeric" autoComplete="one-time-code" maxLength={6}
                  value={codigo} placeholder="••••••" aria-invalid={!!error} aria-describedby="rec-codigo-ayuda rec-codigo-msg" autoFocus
                  onChange={(e) => { setCodigo(e.target.value.replace(/\D/g, '').slice(0, 6)); setError(''); }} />
              </Campo>
              <p className="reg-msg reg-aviso" role="status" aria-live="polite">{aviso}</p>
            </div>
            <div className="reg-actions">
              <PixelButton className="secondary" onClick={() => { setPaso('telefono'); setError(''); setAviso(''); }} disabled={enviando}>← CAMBIAR NÚMERO</PixelButton>
              <button type="submit" className={`pixel-button ${codigo.length !== 6 || enviando ? 'pixel-disabled' : ''}`} disabled={codigo.length !== 6 || enviando}>
                {enviando ? cargando('VERIFICANDO') : 'VERIFICAR →'}
              </button>
            </div>
            <div className="reg-links">
              <button type="button" onClick={pedirSms} disabled={espera > 0 || enviando}>
                {espera > 0 ? `REENVIAR CÓDIGO EN ${espera} s` : 'REENVIAR CÓDIGO'}
              </button>
            </div>
          </form>
        )}

        {paso === 'clave' && (
          <form className="reg-panel" onSubmit={guardar} noValidate aria-busy={enviando}>
            <div className="reg-header">
              <h1>NUEVA CONTRASEÑA</h1>
              <p>¡Celular verificado! Elige tu nueva contraseña.</p>
            </div>
            <div className="reg-fields">
              <Campo id="rec-pass" etiqueta="CONTRASEÑA NUEVA" icono="lock" ayuda="Elige una contraseña que recuerdes">
                <div className="reg-pass">
                  <input id="rec-pass" className="reg-input" type={ver ? 'text' : 'password'} value={pass} autoComplete="new-password" autoFocus
                    aria-describedby="rec-pass-ayuda rec-pass-req" onChange={(e) => { setPass(e.target.value); setError(''); }} />
                  <button type="button" className="reg-eye" onClick={() => setVer((v) => !v)} aria-pressed={ver}
                    aria-label={ver ? 'Ocultar contraseña' : 'Mostrar contraseña'}>
                    <Icono nombre={ver ? 'eyeOff' : 'eye'} size={3} />
                  </button>
                </div>
                <ul id="rec-pass-req" className="reg-reqs" aria-label="Requisitos de la contraseña">
                  {REQS.map((r) => {
                    const ok = r.ok(pass);
                    return (
                      <li key={r.id} className={ok ? 'ok' : 'no'}>
                        <Icono nombre={ok ? 'check' : 'cross'} size={2} />
                        <span>{r.texto}</span>
                        <span className="sr-only">{ok ? ' (cumplido)' : ' (pendiente)'}</span>
                      </li>
                    );
                  })}
                </ul>
              </Campo>
              <Campo id="rec-pass2" etiqueta="CONFIRMAR CONTRASEÑA" icono="lock" ayuda="Escríbela otra vez" error={errPass2 || error}>
                <input id="rec-pass2" className="reg-input" type={ver ? 'text' : 'password'} value={pass2} autoComplete="new-password"
                  aria-invalid={!!(errPass2 || error)} aria-describedby="rec-pass2-ayuda rec-pass2-msg" onChange={(e) => { setPass2(e.target.value); setError(''); }} />
              </Campo>
            </div>
            <div className="reg-actions">
              <span />
              <button type="submit" className={`pixel-button ${!claveOk || pass !== pass2 || enviando ? 'pixel-disabled' : ''}`} disabled={!claveOk || pass !== pass2 || enviando}>
                {enviando ? cargando('GUARDANDO') : 'GUARDAR →'}
              </button>
            </div>
          </form>
        )}

        {paso === 'listo' && (
          <div className="reg-panel" role="status">
            <div className="reg-header">
              <h1>¡CONTRASEÑA CAMBIADA!</h1>
              <p>Ya puedes iniciar sesión con tu contraseña nueva.</p>
            </div>
            <div className="reg-actions">
              <span />
              <PixelButton onClick={() => go('login')}>INICIAR SESIÓN →</PixelButton>
            </div>
          </div>
        )}
      </div>
    </GameBackground>
  );
}
