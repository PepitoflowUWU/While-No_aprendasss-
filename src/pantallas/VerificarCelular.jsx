import React, { useEffect, useRef, useState } from 'react';
import { PixelButton } from '../components/comun/UI.jsx';
import GameBackground from '../components/comun/GameBackground.jsx';
import PasoIndicador from '../components/comun/PasoIndicador.jsx';
import { Icono } from '../components/comun/PixelArt.jsx';
import Campo from '../components/comun/CampoReg.jsx';
import { useCuenta } from '../context/AccountContext.jsx';
import { enmascararTelefono } from '../servicios/cuenta.js';
import { enviarCodigoSms, verificarCodigoSms } from '../supabase/autenticacion.js';
import '../estilos/registro.css';

const ESPERA = 30;     // segundos antes de poder pedir otro SMS (debe coincidir con "sms_max_frequency" de Supabase)
const MENSAJES = {
  CODIGO_SMS_INVALIDO: 'Código incorrecto o vencido. Revisa el SMS o pide uno nuevo',
  SMS_ESPERA: 'Espera un momento antes de pedir otro código',
  TEL_EN_USO: 'Ese celular ya está registrado con otra cuenta',
  TEL_INVALIDO: 'Revisa tu número de celular',
  SMS_FALLO: 'No se pudo enviar el SMS. Inténtalo de nuevo en un momento',
};

// Paso 2: el estudiante escribe el codigo de 6 digitos que Twilio le envio por SMS. Solo si coincide con el que se envio
// se continua (paso 3: elegir personaje y crear el perfil).
export default function VerificarCelular({ go }) {
  const { borrador, setBorrador } = useCuenta();
  const telefono = borrador?.telefono || '';
  const [codigo, setCodigo] = useState('');
  const [error, setError] = useState(borrador?.error ?? '');
  const [aviso, setAviso] = useState('');
  const [verificando, setVerificando] = useState(false);
  const [reenviando, setReenviando] = useState(false);
  const [listo, setListo] = useState(false);
  const [espera, setEspera] = useState(ESPERA);
  const timer = useRef(0);

  useEffect(() => { if (!telefono) go('register'); /* sin numero (recarga de la pagina): se vuelve a Crear cuenta */ }, []); // eslint-disable-line
  useEffect(() => () => clearTimeout(timer.current), []);
  useEffect(() => {
    if (espera <= 0) return undefined;
    const t = setTimeout(() => setEspera((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [espera]);

  async function verificar(e) {
    e.preventDefault();
    if (codigo.length !== 6 || verificando || listo) return;
    setVerificando(true); setError(''); setAviso('');
    try {
      await verificarCodigoSms(telefono, codigo);
      setListo(true);
      setBorrador({ ...(borrador || {}), celularVerificado: true, error: '' });
      timer.current = setTimeout(() => go('character'), 800);
    } catch (err) {
      setVerificando(false); setCodigo('');
      setError(MENSAJES[err?.codigo] || MENSAJES.CODIGO_SMS_INVALIDO);
    }
  }

  async function reenviar() {
    if (espera > 0 || reenviando || listo) return;
    setReenviando(true); setError(''); setAviso('');
    try {
      await enviarCodigoSms(telefono);
      setEspera(ESPERA); setCodigo('');
      setAviso('Te enviamos un código nuevo. El anterior ya no sirve.');
    } catch (err) {
      setError(MENSAJES[err?.codigo] || MENSAJES.SMS_FALLO);
      if (err?.codigo === 'SMS_ESPERA') setEspera(ESPERA);
    } finally { setReenviando(false); }
  }

  return (
    <GameBackground>
      <div className="reg-screen">
        <PasoIndicador paso={2} />
        <form className="reg-panel" onSubmit={verificar} noValidate aria-busy={verificando}>
          <div className="reg-header">
            <h1>VERIFICA TU CELULAR</h1>
            <p>Te enviamos un código de 6 dígitos por SMS al <b className="reg-tel-mask">{enmascararTelefono(telefono)}</b></p>
          </div>

          <div className="reg-fields">
            <Campo id="codigo-sms" etiqueta="CÓDIGO DE 6 DÍGITOS" icono="phone" ayuda="Puede tardar unos segundos en llegar"
              error={error} ok={listo ? '¡Celular verificado!' : ''}>
              <input id="codigo-sms" className="reg-input reg-codigo-sms" type="text" inputMode="numeric" autoComplete="one-time-code" maxLength={6}
                value={codigo} placeholder="••••••" disabled={listo} aria-invalid={!!error} aria-describedby="codigo-sms-ayuda codigo-sms-msg"
                onChange={(e) => setCodigo(e.target.value.replace(/\D/g, '').slice(0, 6))} autoFocus />
            </Campo>
            <p className="reg-msg reg-aviso" role="status" aria-live="polite">{aviso}</p>
          </div>

          <div className="reg-actions">
            <PixelButton className="secondary" onClick={() => go('register')} disabled={verificando || listo}>← CAMBIAR NÚMERO</PixelButton>
            <button type="submit" className={`pixel-button ${codigo.length !== 6 || verificando || listo ? 'pixel-disabled' : ''}`} disabled={codigo.length !== 6 || verificando || listo}>
              {listo ? '¡LISTO!' : verificando ? (<>VERIFICANDO<span className="px-load" aria-hidden="true"><i /><i /><i /></span></>) : 'VERIFICAR →'}
            </button>
          </div>

          <div className="reg-links">
            <button type="button" onClick={reenviar} disabled={espera > 0 || reenviando || listo}>
              {reenviando ? 'ENVIANDO…' : espera > 0 ? `REENVIAR CÓDIGO EN ${espera} s` : 'REENVIAR CÓDIGO'}
            </button>
          </div>
        </form>
      </div>
    </GameBackground>
  );
}
