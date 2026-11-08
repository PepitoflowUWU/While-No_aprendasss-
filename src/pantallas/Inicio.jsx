import React, { useState } from 'react';
import { PixelButton, Title } from '../components/comun/UI.jsx';
import GameBackground from '../components/comun/GameBackground.jsx';
import Mayus from '../components/comun/Mayus.jsx';
import { useCuenta } from '../context/AccountContext.jsx';
import OpcionesModal from '../components/jugador/OpcionesModal.jsx';
import { useMusicaActiva, useAnimaciones } from '../audio/preferencias.js';

// Menú principal. "INICIAR PARTIDA" cambia los botones por las opciones de acceso.
export default function Inicio({ go, hayCuenta = false, accesoInicial = false, onMusica, onAnimaciones }) {
  const { setCuenta } = useCuenta();
  const [acceso, setAcceso] = useState(accesoInicial);
  const [opciones, setOpciones] = useState(false);
  const musicaActiva = useMusicaActiva();
  const animacionesActivas = useAnimaciones();

  const entrarInvitado = () => {
    setCuenta({ invitado: true, nombre_usuario: 'Invitado', personaje_id: '' });
    go('character');
  };

  return (
    <GameBackground>
      <main className="home-content">
        <Title>while(no_aprendas)</Title>
        {!acceso ? (
          <div className="home-buttons">
            <PixelButton onClick={() => (hayCuenta ? go('map') : setAcceso(true))}>▶ INICIAR PARTIDA</PixelButton>
            <PixelButton onClick={() => setOpciones(true)}>⚙ CONFIGURACION</PixelButton>
            <PixelButton onClick={() => alert('Extras de ejemplo')}>★ EXTRAS</PixelButton>
          </div>
        ) : (
          <div className="home-buttons">
            <PixelButton onClick={() => go('login')}><Mayus>INICIAR SESIÓN</Mayus></PixelButton>
            <PixelButton onClick={() => go('register')}>CREAR CUENTA</PixelButton>
            <PixelButton onClick={entrarInvitado}>ENTRAR COMO INVITADO</PixelButton>
            <PixelButton className="secondary" onClick={() => setAcceso(false)}>← VOLVER</PixelButton>
          </div>
        )}
      </main>
      {opciones && <OpcionesModal musicaActiva={musicaActiva} onMusica={onMusica} animacionesActivas={animacionesActivas} onAnimaciones={onAnimaciones} onCerrar={() => setOpciones(false)} />}
    </GameBackground>
  );
}
