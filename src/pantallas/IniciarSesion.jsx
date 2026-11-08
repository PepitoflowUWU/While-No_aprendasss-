import { supabaseConfigurado } from '../supabase/cliente.js';
import React, { useState } from 'react';
import { PixelButton } from '../components/comun/UI.jsx';
import GameBackground from '../components/comun/GameBackground.jsx';
import Mayus from '../components/comun/Mayus.jsx';
import Campo from '../components/comun/CampoReg.jsx';
import { Icono } from '../components/comun/PixelArt.jsx';
import { useCuenta } from '../context/AccountContext.jsx';
import { validarCorreo } from '../servicios/cuenta.js';
import { iniciarSesion } from '../supabase/autenticacion.js';
import '../estilos/registro.css';

// Pantalla INICIAR SESIÓN (sin "PASO 1 DE 2"). Valida con Supabase Auth; la contraseña no se guarda en ningún lado.
export default function IniciarSesion({ go, onEntrar }) {
  const { setCuenta } = useCuenta();
  const [correo, setCorreo] = useState('');
  const [pass, setPass] = useState('');
  const [ver, setVer] = useState(false);
  const [tocado, setTocado] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [errEnvio, setErrEnvio] = useState('');

  const correoOk = validarCorreo(correo);
  const errCorreo = correo && !correoOk && (tocado || correo.length >= 20)
    ? 'Revisa tu correo: debe verse así U12345678@utp.edu.pe' : '';
  const valido = correoOk && pass !== '';

  async function enviar(e) {
    e.preventDefault();
    if (!valido || enviando) return;
    setEnviando(true); setErrEnvio('');
    try {
      const perfil = await iniciarSesion({ correo, password: pass });
      setPass('');               // se limpia el campo apenas se envía
      onEntrar(perfil);          // MAPA directo: App abre la sesión con el perfil y el personaje guardados en Supabase
    } catch (err) {
      setPass('');
      setEnviando(false);
      setErrEnvio({
        CREDENCIALES: 'Correo o contraseña incorrectos',
        SIN_PERFIL: 'Esta cuenta aún no tiene perfil de jugador',
        CONFIRMAR_CORREO: 'Confirma tu correo para poder entrar',
      }[err.codigo] || (!supabaseConfigurado
        ? 'Sin conexión con la base de datos: faltan las variables de Supabase en este despliegue'
        : `No se pudo conectar (${String(err?.message || err).slice(0, 80)}). Inténtalo de nuevo`));
    }
  }

  const invitado = () => {
    setCuenta({ invitado: true, nombre_usuario: 'Invitado', personaje_id: '' });
    go('character');
  };

  return (
    <GameBackground>
      <div className="reg-screen">
        <form className="reg-panel" onSubmit={enviar} noValidate aria-busy={enviando}>
          <div className="reg-header">
            <h1><Mayus>INICIAR SESIÓN</Mayus></h1>
            <p>¡Qué bueno verte de nuevo!</p>
          </div>

          <div className="reg-fields">
            <Campo id="correo" etiqueta="CORREO INSTITUCIONAL" icono="mail" ayuda="Es el correo que se creó con tu código" error={errCorreo}>
              <input id="correo" className="reg-input reg-input-sm" value={correo} autoComplete="username" inputMode="email" autoCapitalize="none" spellCheck="false"
                placeholder="tu_código@utp.edu.pe" aria-invalid={!!errCorreo} aria-describedby="correo-ayuda correo-msg"
                onChange={(e) => setCorreo(e.target.value.replace(/\s/g, ''))} onBlur={() => setTocado(true)} />
            </Campo>

            <Campo id="pass" etiqueta="CONTRASEÑA" icono="lock" error={errEnvio}>
              <div className="reg-pass">
                <input id="pass" className="reg-input" type={ver ? 'text' : 'password'} value={pass} autoComplete="current-password"
                  onChange={(e) => { setPass(e.target.value); setErrEnvio(''); }} />
                <button type="button" className="reg-eye" onClick={() => setVer((v) => !v)} aria-pressed={ver}
                  aria-label={ver ? 'Ocultar contraseña' : 'Mostrar contraseña'}>
                  <Icono nombre={ver ? 'eyeOff' : 'eye'} size={3} />
                </button>
              </div>
            </Campo>
          </div>

          <div className="reg-actions">
            <PixelButton className="secondary" onClick={() => go('home')} disabled={enviando}>← VOLVER</PixelButton>
            <button type="submit" className={`pixel-button ${!valido || enviando ? 'pixel-disabled' : ''}`} disabled={!valido || enviando}>
              {enviando ? (<>ENTRANDO<span className="px-load" aria-hidden="true"><i /><i /><i /></span></>) : 'ENTRAR →'}
            </button>
          </div>

          <div className="reg-links">
            <button type="button" onClick={() => go('register')} disabled={enviando}>¿NO TIENES CUENTA? CREA UNA</button>
            <button type="button" onClick={invitado} disabled={enviando}>PROBAR COMO INVITADO (3 NIVELES)</button>
          </div>
        </form>
      </div>
    </GameBackground>
  );
}
