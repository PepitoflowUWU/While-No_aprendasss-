-- =========================================================================================
-- while(no_aprendas) - MUNEÑO MINI DEL MAPA (personaje.imagen_mini_url)
-- La tarjeta de seleccion, la ficha del ranking y los avatares siguen usando personaje.imagen_url (imagen grande).
-- El muñeco que camina por el mapa usa imagen_mini_url. Si un enlace no carga, el juego usa la imagen grande.
-- Se puede ejecutar mas de una vez.
-- =========================================================================================

alter table personaje add column if not exists imagen_mini_url varchar(255);

update personaje set imagen_mini_url = 'https://nbvvesjfntqxfgcikeyq.supabase.co/storage/v1/object/public/personajes/personajesSeleccionable/Chica/chica-mini.png'
where id = 'd0000000-0000-0000-0000-000000000001';   -- Chica

update personaje set imagen_mini_url = 'https://nbvvesjfntqxfgcikeyq.supabase.co/storage/v1/object/public/personajes/personajesSeleccionable/Chico/perro-mini.png'
where id = 'd0000000-0000-0000-0000-000000000002';   -- Chico (revisa el nombre del archivo: dice "perro-mini")

-- (El personaje Perro se quito del juego: ver 22_quitar_perro_y_conteo_genero.sql)

-- Comprobacion: los 3 jugables deben tener imagen_url (grande) e imagen_mini_url (mini). Los guias no llevan mini.
select nombre, tipo, imagen_url, imagen_mini_url from personaje order by id;
