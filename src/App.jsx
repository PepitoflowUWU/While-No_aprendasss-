import { useEffect, useRef, useState } from 'react';
import Inicio from './pantallas/Inicio.jsx';
import SeleccionPersonaje from './pantallas/SeleccionPersonaje.jsx';
import VerificarCelular from './pantallas/VerificarCelular.jsx';
import Registro from './pantallas/Registro.jsx';
import IniciarSesion from './pantallas/IniciarSesion.jsx';
import Isla from './pantallas/Isla.jsx';
import IntroLogo from './components/multimedia/IntroLogo.jsx';
import MusicaMenu from './components/multimedia/MusicaMenu.jsx';
import { AccountProvider, useCuenta } from './context/AccountContext.jsx';
import { supabaseConfigurado } from './supabase/cliente.js';
import { finalizarRegistro, restaurarSesion, cerrarSesionAuth } from './supabase/autenticacion.js';
import { guardarMusica, guardarAnimaciones, registrarConexion } from './supabase/usuarios.js';
import {
  crearSesionInvitado, cerrarSesionInvitado, cerrarSesionInvitadoAlSalir, limpiarInvitadosAbandonados,
} from './supabase/invitados.js';
import { fijarMusica, leerMusica, fijarAnimaciones, leerAnimaciones } from './audio/preferencias.js';
import { activarEfectos } from './audio/efectos.js';

// Sesion de INVITADO: solo dura mientras la pestana este abierta (sessionStorage). Los usuarios registrados
// no se guardan aqui: Supabase Auth recuerda su sesion y el perfil se vuelve a leer de la base.
const KEY_INVITADO = 'wna-invitado';
const KEY_ANTIGUA = 'wna-sesion';           // clave de versiones anteriores: se borra para no dejar datos viejos
const leerInvitado = () => { try { return JSON.parse(sessionStorage.getItem(KEY_INVITADO)) || null; } catch { return null; } };
const guardarInvitado = (s) => { try { sessionStorage.setItem(KEY_INVITADO, JSON.stringify(s)); } catch { /* sin storage */ } };
const borrarInvitado = () => { try { sessionStorage.removeItem(KEY_INVITADO); } catch { /* sin storage */ } };

// Sesion del juego a partir del perfil de la tabla usuario.
const sesionDePerfil = (u) => ({
  id: u.id,
  usuario: u.nombre_usuario,
  invitado: false,
  personaje: u.personaje_id,
  personaje_id: u.personaje_id,
  permisos: u.permisos || [],
  esAdmin: (u.permisos || []).includes('panel_admin'),     // muestra la corona del panel (la base comprueba el permiso en cada accion)
  // Todo el progreso (puntos, rachas, comodines, lecciones, niveles y usos de comodines) viene del servidor
  db: { estado: u.estado, puntos: u.puntaje_total ?? 0 },
});

const MENSAJE_REGISTRO = {
  CODIGO_DUPLICADO: 'Ese código ya tiene una cuenta',
  CLAVE_DEBIL: 'La contraseña no cumple los requisitos de seguridad',
  CONFIRMAR_CORREO: 'No se pudo activar la cuenta. Inténtalo de nuevo más tarde',
  CODIGO_INVALIDO: 'El código debe ser U seguida de 8 números (ejemplo: U12345678)',
  CELULAR_SIN_VERIFICAR: 'Verifica tu celular con el código SMS para continuar',
  TEL_INVALIDO: 'Revisa tu número de celular (+51 y 9 dígitos)',
  TEL_EN_USO: 'Ese celular ya está registrado con otra cuenta',
  SIN_SESION: 'Tu sesión venció. Vuelve a crear la cuenta',
};

// Flujo: home → register (paso 1: cuenta + celular, se envia el SMS) → verify (paso 2: codigo SMS) → character (paso 3: aqui se crea el perfil) → map (isla).
// Si ya hay sesión, "Iniciar partida" va directo al mapa.
function Juego() {
  const { cuenta, setCuenta, borrador, setBorrador, fijarPersonaje, limpiar } = useCuenta();
  const [sesion, setSesion] = useState(null);
  const [pantalla, setPantalla] = useState('home');
  const [accesoAbierto, setAccesoAbierto] = useState(false); // al volver de Crear cuenta / Iniciar sesión, Inicio muestra las opciones de acceso
  const sesionRef = useRef(null);
  sesionRef.current = sesion;

  // ÚNICA función de navegación: REEMPLAZA la pantalla actual por la de destino (sin pila ni historial).
  // Cada VOLVER tiene un destino fijo; ningún callback encadena pantallas.
  const ir = (destino) => {
    if (destino === 'home') setAccesoAbierto(pantalla === 'register' || pantalla === 'login');
    setPantalla(destino);
  };

  // Al abrir la app: limpia invitados abandonados y recupera la sesion (invitado de esta pestana o usuario registrado).
  useEffect(() => {
    let vivo = true;
    try { localStorage.removeItem(KEY_ANTIGUA); } catch { /* sin storage */ }
    limpiarInvitadosAbandonados();
    (async () => {
      const g = leerInvitado();
      if (g) {                                   // recarga de la pestana: el registro temporal se vuelve a crear
        const idInvitado = await crearSesionInvitado();
        const s = { ...g, idInvitado };
        guardarInvitado(s);
        if (vivo) setSesion(s);
        return;
      }
      if (!supabaseConfigurado) return;
      try {
        const perfil = await restaurarSesion();
        if (vivo && perfil) { aplicarPreferencias(perfil); setSesion(sesionDePerfil(perfil)); }
      } catch (e) { console.warn('[Supabase] No se pudo restaurar la sesión:', e?.message || e); }
    })();
    return () => { vivo = false; };
  }, []);

  // Ultima conexion (se muestra en la ficha del ranking): al abrir la sesion, cada 2 minutos mientras el juego
  // esta visible y al volver a la pestana. Al cerrar sesion se registra por ultima vez (ver salir()).
  const idUsuario = sesion && !sesion.invitado ? sesion.id : null;
  useEffect(() => {
    if (!idUsuario) return undefined;
    const avisar = () => registrarConexion(idUsuario).catch((e) => console.warn('[Supabase] conexion:', e?.message || e));
    avisar();
    const t = setInterval(() => { if (document.visibilityState === 'visible') avisar(); }, 120000);
    const alVolver = () => { if (document.visibilityState === 'visible') avisar(); };
    document.addEventListener('visibilitychange', alVolver);
    return () => { clearInterval(t); document.removeEventListener('visibilitychange', alVolver); };
  }, [idUsuario]);

  // Cerrar la pestana: borra el registro temporal del invitado (si el navegador se cierra sin avisar,
  // limpiarInvitadosAbandonados y la funcion programada de la base lo borran cuando vence).
  useEffect(() => {
    const alSalir = () => { const s = sesionRef.current; if (s?.invitado && s.idInvitado) cerrarSesionInvitadoAlSalir(s.idInvitado); };
    window.addEventListener('pagehide', alSalir);
    return () => window.removeEventListener('pagehide', alSalir);
  }, []);

  function aplicarPreferencias(perfil) {
    fijarMusica(perfil.musica_activada);       // las preferencias guardadas mandan al iniciar sesion
    fijarAnimaciones(perfil.animaciones_activadas);
    activarEfectos(perfil.sonido_activado);
  }

  // Musica (Opciones): se aplica ya y, si hay una cuenta, se guarda en configuracion_usuario.
  const cambiarMusica = (valor) => {
    fijarMusica(valor);
    const s = sesionRef.current;
    if (s && !s.invitado && s.id) guardarMusica(s.id, valor).catch((e) => console.warn('[Supabase] musica:', e?.message || e));
  };

  // Animaciones y efectos (Opciones): igual que la musica, se aplica ya y se guarda en configuracion_usuario si hay cuenta.
  const cambiarAnimaciones = (valor) => {
    fijarAnimaciones(valor);
    const s = sesionRef.current;
    if (s && !s.invitado && s.id) guardarAnimaciones(s.id, valor).catch((e) => console.warn('[Supabase] animaciones:', e?.message || e));
  };

  const abrirInvitado = async (personaje_id) => {
    const idInvitado = await crearSesionInvitado();
    const s = {
      id: null, usuario: 'Invitado', invitado: true,
      personaje: personaje_id, personaje_id, idInvitado,
    };
    guardarInvitado(s);
    setSesion(s);
    setPantalla('map');
  };

  // Selección de personaje: invitado → sesión temporal; cuenta nueva → se crea en Supabase con el personaje elegido.
  const elegirPersonaje = async (personaje_id) => {
    fijarPersonaje(personaje_id);
    if (!cuenta || cuenta.invitado) { await abrirInvitado(personaje_id); return; }
    try {
      const perfil = await finalizarRegistro({
        codigo: cuenta.codigo_estudiante, personajeId: personaje_id, musica: leerMusica(), animaciones: leerAnimaciones(),
      });
      setBorrador(null);
      setCuenta({ ...perfil, personaje_id, invitado: false });
      aplicarPreferencias(perfil);
      setSesion(sesionDePerfil(perfil));
      setPantalla('map');
    } catch (err) {
      console.warn('[Supabase] Registro:', err?.causa?.message || err?.message || err);
      // Se vuelve a Crear cuenta con los datos escritos y el motivo del rechazo
      // Si el error no tiene un mensaje propio, se muestra el motivo que devolvio Supabase (ayuda a encontrar el problema)
      const detalle = (err?.causa?.message || (err?.codigo ? '' : err?.message) || '').slice(0, 120);
      const mensaje = MENSAJE_REGISTRO[err.codigo]
        || `No se pudo crear la cuenta${err?.codigo ? ` [${err.codigo}]` : ''}${detalle ? `: ${detalle}` : ''}`;
      setBorrador({ ...(borrador || {}), error: mensaje });
      setPantalla(err.codigo === 'CELULAR_SIN_VERIFICAR' ? 'verify' : 'register');   // si falta verificar el celular se vuelve a ese paso
    }
  };

  // Iniciar sesión -> MAPA directo. El perfil (personaje, puntos, rachas, preferencias) viene de Supabase.
  const entrarConPerfil = (perfil) => {
    setCuenta({ ...perfil, invitado: false });
    aplicarPreferencias(perfil);
    setSesion(sesionDePerfil(perfil));
    setPantalla('map');
  };

  const salir = () => {
    const s = sesionRef.current;
    if (s?.invitado) { cerrarSesionInvitado(s.idInvitado); borrarInvitado(); }
    else {
      // Antes de cerrar la sesion se anota la ultima conexion; la cuenta y sus datos permanecen en Supabase
      registrarConexion(s?.id).catch(() => {}).finally(() => cerrarSesionAuth());
    }
    setSesion(null);
    limpiar();
    setAccesoAbierto(false);
    setPantalla('home');
  };

  return (
    <div className="app">
      {/* Musica del menu: suena en todas las pantallas previas al mundo y se pausa al entrar (alli suena la del mundo) */}
      <MusicaMenu sonando={pantalla !== 'map'} />
      {!supabaseConfigurado && (
        <div role="alert" style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 9999, padding: '6px 10px', textAlign: 'center',
          background: '#a02020', color: '#fff', font: '700 13px system-ui, sans-serif' }}>
          Sin conexión con la base de datos: faltan VITE_SUPABASE_URL o VITE_SUPABASE_PUBLISHABLE_KEY en este despliegue.
        </div>
      )}
      {pantalla === 'home' && <Inicio go={ir} hayCuenta={!!sesion} accesoInicial={accesoAbierto} onMusica={cambiarMusica} onAnimaciones={cambiarAnimaciones} />}
      {pantalla === 'register' && <Registro go={ir} />}
      {pantalla === 'verify' && <VerificarCelular go={ir} />}
      {pantalla === 'login' && <IniciarSesion go={ir} onEntrar={entrarConPerfil} />}
      {pantalla === 'character' && <SeleccionPersonaje go={ir} onPick={elegirPersonaje} />}
      {pantalla === 'map' && sesion && <Isla sesion={sesion} onSalir={salir} onMusica={cambiarMusica} onAnimaciones={cambiarAnimaciones} />}
    </div>
  );
}

// La intro se muestra SOLO al cargar la app (no cada vez que se vuelve a Inicio).
// Inicio se monta por debajo cuando el mosaico cubre la pantalla y queda quieto mientras el mosaico se retira.
export default function App() {
  const [intro, setIntro] = useState(true);
  const [montar, setMontar] = useState(false);
  return (
    <AccountProvider>
      {montar && <div className="inicio-wrap"><Juego /></div>}
      {intro && (
        <IntroLogo
          onMontarInicio={() => setMontar(true)}
          onFin={() => setIntro(false)}
        />
      )}
    </AccountProvider>
  );
}
