import { useEffect } from 'react';
import { iniciarMusicaMundo, detenerMusicaMundo, alCambiarVisibilidad } from '../../audio/musicaMundo';
import { useMusicaActiva } from '../../audio/preferencias';

// Se monta SOLO dentro de la pantalla del mundo: la música suena mientras esté abierta y se detiene al salir.
// Respeta la preferencia de música (Opciones / configuracion_usuario.musica_activada).
export default function MusicaMundo() {
  const activa = useMusicaActiva();
  useEffect(() => {
    if (!activa) return undefined;
    iniciarMusicaMundo();
    document.addEventListener('visibilitychange', alCambiarVisibilidad);
    return () => {
      document.removeEventListener('visibilitychange', alCambiarVisibilidad);
      detenerMusicaMundo();
    };
  }, [activa]);
  return null;
}
