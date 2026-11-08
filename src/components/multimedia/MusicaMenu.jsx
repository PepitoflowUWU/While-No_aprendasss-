import { useEffect } from 'react';
import { iniciarMusicaMenu, pausarMusicaMenu, alCambiarVisibilidad } from '../../audio/musicaMenu';
import { useMusicaActiva } from '../../audio/preferencias';

// Musica del menu (Inicio, Crear cuenta, Iniciar sesion, Seleccion de personaje). `sonando` es false en el mundo:
// alli se pausa y suena la musica del mundo. Respeta la preferencia de musica de Opciones.
export default function MusicaMenu({ sonando }) {
  const activa = useMusicaActiva();
  useEffect(() => {
    if (!(sonando && activa)) { pausarMusicaMenu(); return undefined; }
    iniciarMusicaMenu();
    document.addEventListener('visibilitychange', alCambiarVisibilidad);
    return () => document.removeEventListener('visibilitychange', alCambiarVisibilidad);
  }, [sonando, activa]);
  useEffect(() => () => pausarMusicaMenu(), []);
  return null;
}
