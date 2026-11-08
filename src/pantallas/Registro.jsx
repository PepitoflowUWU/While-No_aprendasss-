import React, { useEffect, useRef, useState } from 'react';
import { PixelButton } from '../components/comun/UI.jsx';
import GameBackground from '../components/comun/GameBackground.jsx';
import PasoIndicador from '../components/comun/PasoIndicador.jsx';
import Mayus from '../components/comun/Mayus.jsx';
import { Icono } from '../components/comun/PixelArt.jsx';
import { useCuenta } from '../context/AccountContext.jsx';
import Campo from '../components/comun/CampoReg.jsx';
import {
  validarCodigo, correoDe, nombreUsuarioDe, codigoEjemplo, validarCelular, telefonoDe, celularDe,
} from '../servicios/cuenta.js';
import { codigoDisponible, crearCuentaAuth, enviarCodigoSms } from '../supabase/autenticacion.js';
import '../estilos/registro.css';

const REQS = [
  { id: 'len', texto: 'Mínimo 8 caracteres', ok: (p) => p.length >= 8 },
  { id: 'may', texto: '1 mayúscula', ok: (p) => /[A-ZÁÉÍÓÚÑ]/.test(p) },
  { id: 'num', texto: '1 número', ok: (p) => /\d/.test(p) },
];
const ETIQUETAS = ['', 'Débil', 'Regular', 'Buena', 'Fuerte'];

// Lo que se le muestra al estudiante cuando algo falla al crear la cuenta o al enviar el SMS
const MENSAJES = {
  CODIGO_DUPLICADO: 'Ese código ya tiene una cuenta',
  CLAVE_DEBIL: 'La contraseña no cumple los requisitos de seguridad',
  TEL_EN_USO: 'Ese celular ya está registrado con otra cuenta',
  TEL_INVALIDO: 'Revisa tu número de celular',
  SMS_ESPERA: 'Espera un minuto antes de pedir otro código',
  SMS_FALLO: 'No se pudo enviar el SMS. Inténtalo de nuevo en un momento',
  CONFIRMAR_CORREO: 'No se pudo activar la cuenta. Inténtalo de nuevo más tarde',
};

function fuerza(p) {
  if (!p) return 0;
  let s = 0;
  if (p.length >= 8) s++;
  if (/[A-ZÁÉÍÓÚÑ]/.test(p) && /[a-záéíóúñ]/.test(p)) s++;
  if (/\d/.test(p)) s++;
  if (p.length >= 12 || /[^A-Za-z0-9]/.test(p)) s++;
  return s;
}

export default function Registro({ go }) {
  const { cuenta, setCuenta, borrador, setBorrador } = useCuenta();
  const [codigo, setCodigo] = useState(cuenta && !cuenta.invitado ? cuenta.codigo_estudiante : '');
  const [ejemplo] = useState(codigoEjemplo); // código de ejemplo distinto cada vez que se abre la pantalla
  const [pass, setPass] = useState(borrador?.pass ?? '');   // datos ya escritos al volver desde Selección
  const [pass2, setPass2] = useState(borrador?.pass2 ?? '');
  const [celular, setCelular] = useState(celularDe(borrador?.telefono));   // 9 digitos; el +51 se agrega solo
  const [ver, setVer] = useState(false);
  const [tocado, setTocado] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [creada, setCreada] = useState(false);
  const [errorEnvio, setErrorEnvio] = useState(borrador?.error ?? '');   // error al crear la cuenta en el paso 2 (vuelve aqui)
  const timer = useRef(0);
  useEffect(() => () => clearTimeout(timer.current), []);

  const formatoOk = validarCodigo(codigo);
  const correo = formatoOk ? correoDe(codigo) : '';
  const usuario = formatoOk ? nombreUsuarioDe(codigo) : '';
  // vista previa: la base de datos asigna el nombre final (agrega .2, .3 si ya existe otro igual)
  const dup = false;
  const errCodigo = '';
  const errUsuario = '';
  const celularOk = validarCelular(celular);
  const telefono = celularOk ? telefonoDe(celular) : '';
  const errPass2 = pass2 && pass2 !== pass ? 'Las contraseñas no coinciden' : '';
  const passOk = REQS.every((r) => r.ok(pass));
  const valido = formatoOk && !dup && celularOk && passOk && pass2 !== '' && pass === pass2;
  const nivel = fuerza(pass);

  async function enviar(e) {
    e.preventDefault();
    if (!valido || enviando) return;
    setEnviando(true); setErrorEnvio('');
    try {
      // Paso 1: se comprueba que el codigo este libre, se crea la cuenta de acceso y Twilio envia el SMS con el codigo.
      // El perfil del jugador (tabla usuario) NO se crea hasta que el celular quede verificado (paso 2) y se elija el personaje (paso 3).
      const libre = await codigoDisponible(codigo);
      if (libre === false) throw Object.assign(new Error('CODIGO_DUPLICADO'), { codigo: 'CODIGO_DUPLICADO' });
      const cod = codigo;
      const { celularVerificado } = await crearCuentaAuth({ codigo: cod, password: pass, telefono });
      if (!celularVerificado) await enviarCodigoSms(telefono);
      const datos = {
        codigo_estudiante: cod, correo_institucional: correoDe(cod), nombre_usuario: nombreUsuarioDe(cod),
        invitado: false, personaje_id: '',
      };
      setBorrador({ pass, pass2, telefono, celularVerificado });   // solo en memoria, para volver atras con los datos escritos
      setCuenta(datos);
      setCreada(true);
      timer.current = setTimeout(() => go(celularVerificado ? 'character' : 'verify'), 900);
    } catch (err) {
      setEnviando(false);
      setErrorEnvio(MENSAJES[err?.codigo] || 'No se pudo crear la cuenta. Inténtalo de nuevo');
    }
  }

  return (
    <GameBackground>
      <div className="reg-screen">
        <PasoIndicador paso={1} />
        <form className="reg-panel" onSubmit={enviar} noValidate aria-busy={enviando}>
          <div className="reg-header">
            <h1>CREAR CUENTA</h1>
            <p>¡Tu aventura comienza aquí!</p>
          </div>

          <div className="reg-fields">
            <Campo id="codigo" etiqueta="CÓDIGO DE ESTUDIANTE" icono="id" ayuda="Es el código que te dio la universidad" error={errCodigo}>
              <input id="codigo" className="reg-input" value={codigo} maxLength={9} autoComplete="username" autoCapitalize="characters" spellCheck="false"
                placeholder={`Ej: ${ejemplo}`} aria-invalid={!!errCodigo || (codigo !== '' && !formatoOk)} aria-describedby="codigo-ayuda codigo-msg"
                onChange={(e) => setCodigo(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 9))} onBlur={() => setTocado(true)} />
            </Campo>

            <Campo id="correo" etiqueta="CORREO INSTITUCIONAL" icono="mail"
              ayuda={codigo ? null : 'Se genera con tu código'}
              error={codigo && !formatoOk ? 'El código debe verse así: U12345678' : ''}
              ok={formatoOk ? '¡Código válido!' : ''}>
              <input id="correo" className="reg-input" readOnly value={correo} placeholder="tu_código@utp.edu.pe" aria-describedby="correo-ayuda correo-msg" />
            </Campo>

            <Campo id="usuario" etiqueta="NOMBRE DE USUARIO" icono="user" ayuda="Lo usarás para iniciar sesión" error={errUsuario}>
              <input id="usuario" className="reg-input" readOnly value={usuario} placeholder="Jugador + 4 últimos números" aria-invalid={!!errUsuario} aria-describedby="usuario-ayuda usuario-msg" />
            </Campo>

            <Campo id="celular" etiqueta="CELULAR" icono="phone" ayuda="Te enviaremos un código por SMS para verificar tu número"
              error={celular && !celularOk ? 'Ingresa tu celular de 9 dígitos (empieza con 9)' : ''} ok={celularOk ? '¡Número válido!' : ''}>
              <div className="reg-tel">
                <span className="reg-prefijo" aria-hidden="true">+51</span>
                <input id="celular" className="reg-input" type="tel" inputMode="numeric" autoComplete="tel-national" maxLength={9} value={celular}
                  placeholder="9XX XXX XXX" aria-invalid={celular !== '' && !celularOk} aria-describedby="celular-ayuda celular-msg"
                  onChange={(e) => setCelular(e.target.value.replace(/\D/g, '').slice(0, 9))} />
              </div>
            </Campo>

            <Campo id="pass" etiqueta="CONTRASEÑA" icono="lock" ayuda="Elige una contraseña que recuerdes">
              <div className="reg-pass">
                <input id="pass" className="reg-input" type={ver ? 'text' : 'password'} value={pass} autoComplete="new-password"
                  aria-describedby="pass-ayuda pass-req" onChange={(e) => setPass(e.target.value)} />
                <button type="button" className="reg-eye" onClick={() => setVer((v) => !v)} aria-pressed={ver}
                  aria-label={ver ? 'Ocultar contraseña' : 'Mostrar contraseña'}>
                  <Icono nombre={ver ? 'eyeOff' : 'eye'} size={3} />
                </button>
              </div>
              <ul id="pass-req" className="reg-reqs" aria-label="Requisitos de la contraseña">
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
              <div className="reg-strength" role="img" aria-label={`Fortaleza de la contraseña: ${ETIQUETAS[nivel] || 'vacía'}`}>
                <div className="reg-bars" aria-hidden="true">
                  {[1, 2, 3, 4].map((n) => <i key={n} className={nivel >= n ? `on l${nivel}` : ''} />)}
                </div>
                <span aria-hidden="true">{ETIQUETAS[nivel]}</span>
              </div>
            </Campo>

            <Campo id="pass2" etiqueta="CONFIRMAR CONTRASEÑA" icono="lock" ayuda="Escríbela otra vez" error={errPass2}>
              <input id="pass2" className="reg-input" type={ver ? 'text' : 'password'} value={pass2} autoComplete="new-password"
                aria-invalid={!!errPass2} aria-describedby="pass2-ayuda pass2-msg" onChange={(e) => setPass2(e.target.value)} />
            </Campo>
          </div>

          <p className={`reg-msg reg-msg-envio ${creada ? 'ok' : ''}`} aria-live="assertive">
            {creada ? (<><Icono nombre="check" size={2} /> <span>{borrador?.celularVerificado ? '¡Listo!' : '¡Código enviado por SMS!'}</span></>)
              : errorEnvio ? (<><Icono nombre="cross" size={2} /> <span>{errorEnvio}</span></>) : null}
          </p>

          <div className="reg-actions">
            <PixelButton className="secondary" onClick={() => { setBorrador(null); go('home'); }} disabled={enviando}>← VOLVER</PixelButton>
            <button type="submit" className={`pixel-button ${!valido || enviando ? 'pixel-disabled' : ''}`} disabled={!valido || enviando}>
              {creada ? '¡LISTO!' : enviando ? (<>ENVIANDO<span className="px-load" aria-hidden="true"><i /><i /><i /></span></>) : 'ENVIAR CÓDIGO →'}
            </button>
          </div>

          <div className="reg-links">
            <button type="button" onClick={() => { setBorrador(null); go('login'); }} disabled={enviando}>¿YA TIENES CUENTA? INICIA <Mayus>SESIÓN</Mayus></button>
          </div>
        </form>
      </div>
    </GameBackground>
  );
}
