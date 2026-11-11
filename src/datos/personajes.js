// Datos de PRESENTACION de los personajes (color de fondo de la tarjeta, frases y tamano en el mapa).
// Los personajes en si (id, nombre, tipo, imagen_url) vienen SIEMPRE de la tabla `personaje` de Supabase
// (ver PersonajesContext.jsx); aqui solo se guarda lo que no esta en la base, indexado por su UUID.
// Las frases del guia son fijas: no hay llamadas a ninguna API de IA en esta pantalla.
export const PRESENTACION_JUGABLE = {
  'd0000000-0000-0000-0000-000000000001': { escala: 1, colorFondo: '#ff7eb6',   // Chica
    frase: 'Depura bugs antes del desayuno',
    guia: '¡Buena elección! Ella no deja pasar ni un bug.' },
  'd0000000-0000-0000-0000-000000000002': { escala: 1, colorFondo: '#ffd93d',       // Chico
    frase: 'Compila a la primera (casi siempre)',
    guia: '¡Ese compila a la primera! Casi siempre, eso sí.' },
  'd0000000-0000-0000-0000-000000000009': { escala: 1, colorFondo: '#c39bff', etiqueta: 'CHICA N',   // ChicaN (otra version de la Chica)
    frase: 'Refactoriza hasta los apuntes',
    guia: '¡Buena elección! Ella no deja pasar ni un bug.' },
  'd0000000-0000-0000-0000-000000000010': { escala: 1, colorFondo: '#7ee0a1', etiqueta: 'CHICO N',   // ChicoN (otra version del Chico)
    frase: 'Si no compila, lo vuelve a intentar',
    guia: '¡Ese compila a la primera! Casi siempre, eso sí.' },
};

// Seleccion en 2 pasos: primero Chica o Chico (tarjeta del personaje "base") y despues la version:
// la normal y la N. Una version que aun no este en la tabla `personaje` simplemente no se muestra.
export const GRUPOS_PERSONAJE = [
  { id: 'chica', nombre: 'CHICA', base: 'd0000000-0000-0000-0000-000000000001', versiones: ['d0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000009'] },
  { id: 'chico', nombre: 'CHICO', base: 'd0000000-0000-0000-0000-000000000002', versiones: ['d0000000-0000-0000-0000-000000000002', 'd0000000-0000-0000-0000-000000000010'] },
];
// Personajes que ya NO se ofrecen (se quitaron del juego): aunque sigan en la tabla `personaje`, no se muestran ni se pueden elegir.
export const PERSONAJES_RETIRADOS = ['d0000000-0000-0000-0000-000000000003'];   // Perro
export const PRESENTACION_POR_DEFECTO = { escala: 1, colorFondo: '#9ad1ff', frase: '', guia: '' };

// Que personaje guia (tabla `personaje`, tipo "guia") se muestra segun el animo del Capyhein.
export const ANIMO_GUIA = {
  serio:      'd0000000-0000-0000-0000-000000000004',   // CapyHeiner
  acertaste:  'd0000000-0000-0000-0000-000000000005',   // CapyheinAcertaste
  confundido: 'd0000000-0000-0000-0000-000000000006',   // CapyheinConfundido
  mal:        'd0000000-0000-0000-0000-000000000007',   // CapyheinMal
  riendose:   'd0000000-0000-0000-0000-000000000008',   // CapyheinRiendose
};

// Primer plano del guia (CapyheinSerio): presentacion de los niveles 4 y 5 (database/migraciones/32_guia_capyhein_serio.sql)
export const GUIA_PRIMER_PLANO = 'd0000000-0000-0000-0000-000000000011';

export const GUIA_DEFECTO = 'Elige a tu compañero. Es solo estético, no cambia tus preguntas.';

// El Mesías del Pront: guía del TUTORIAL del mapa (database/migraciones/33_guia_mesias.sql).
// Si la tabla aun no lo tiene, o su imagen no carga, se usa la copia del proyecto (public/assets/personajes/guia/).
export const MESIAS = {
  senala: { id: 'd0000000-0000-0000-0000-000000000012', local: 'assets/personajes/guia/mesias-senala.png' },   // señalando (explica un botón)
  pie:    { id: 'd0000000-0000-0000-0000-000000000013', local: 'assets/personajes/guia/mesias-pie.png' },      // de pie (explica algo general)
};
