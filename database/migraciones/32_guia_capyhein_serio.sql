-- =========================================================================================
-- while(no_aprendas) - NUEVA IMAGEN DEL PERSONAJE GUIA: CapyheinSerio (primer plano, "ahora hay que ponernos serios")
-- Se usa en la presentacion de los niveles 4 y 5 (leccion 1): fondo oscuro y el guia hablandole al jugador.
-- Storage: personajes/PersonajesGuia/CapyHein/capyheinSerio.png
-- Ejecutar UNA vez (repetible).
-- =========================================================================================
insert into personaje (id, nombre, tipo, descripcion, imagen_url, imagen_mini_url) values
  ('d0000000-0000-0000-0000-000000000011', 'CapyheinSerio', 'guia', 'El guía en primer plano, serio, antes de los niveles difíciles.',
   'https://nbvvesjfntqxfgcikeyq.supabase.co/storage/v1/object/public/personajes/PersonajesGuia/CapyHein/capyheinSerio.png',
   null)
on conflict (id) do update set nombre = excluded.nombre, tipo = excluded.tipo, descripcion = excluded.descripcion,
  imagen_url = excluded.imagen_url;

-- Comprobacion: deben salir 6 imagenes del guia (las 5 de antes y CapyheinSerio)
--   select id, nombre, imagen_url from personaje where tipo = 'guia' order by id;
