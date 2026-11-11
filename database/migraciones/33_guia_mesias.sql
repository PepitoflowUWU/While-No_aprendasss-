-- =========================================================================================
-- while(no_aprendas) - GUIA DEL TUTORIAL: El Mesías del Pront (2 poses)
-- Se usa en el tutorial del mapa (components/mapa/TutorialMesias.jsx): resalta cada boton y explica lo que hace.
--   * MesiasSenala: señalando (cuando explica un boton)
--   * MesiasPie:    de pie (cuando explica algo general)
-- ANTES de ejecutarlo, sube las 2 imagenes al bucket "personajes" de Supabase Storage con ESTOS nombres:
--   personajes/PersonajesGuia/Mesias/mesiasSenala.png
--   personajes/PersonajesGuia/Mesias/mesiasPie.png
-- (las imagenes estan en el proyecto: public/assets/personajes/guia/mesias-senala.png y mesias-pie.png).
-- Si las subes con otro nombre, cambia los enlaces de abajo. Mientras no esten, el juego usa la copia del proyecto.
-- Ejecutar UNA vez (repetible).
-- =========================================================================================
insert into personaje (id, nombre, tipo, descripcion, imagen_url, imagen_mini_url) values
  ('d0000000-0000-0000-0000-000000000012', 'MesiasSenala', 'guia', 'El Mesías del Pront señalando: explica cada botón en el tutorial.',
   'https://nbvvesjfntqxfgcikeyq.supabase.co/storage/v1/object/public/personajes/PersonajesGuia/Mesias/mesiasSenala.png', null),
  ('d0000000-0000-0000-0000-000000000013', 'MesiasPie', 'guia', 'El Mesías del Pront de pie: saluda y explica cómo se juega en el tutorial.',
   'https://nbvvesjfntqxfgcikeyq.supabase.co/storage/v1/object/public/personajes/PersonajesGuia/Mesias/mesiasPie.png', null)
on conflict (id) do update set nombre = excluded.nombre, tipo = excluded.tipo, descripcion = excluded.descripcion,
  imagen_url = excluded.imagen_url;

-- Comprobacion: deben salir las 2 poses del Mesías
--   select id, nombre, imagen_url from personaje where nombre like 'Mesias%' order by id;
