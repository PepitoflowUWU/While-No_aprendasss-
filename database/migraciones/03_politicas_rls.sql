-- =========================================================================================
-- while(no_aprendas) - POLITICAS RLS (RECOMENDADO antes de publicar el juego)
-- El navegador usa la clave PUBLICA, asi que la proteccion real son estas politicas.
-- IMPORTANTE: revisa antes de ejecutar. Si tus tablas ya tienen RLS activado con otras politicas, ajusta/mezcla.
-- Si las tablas tienen RLS DESACTIVADO, todo funciona, pero cualquiera podria leer y modificar datos con la clave publica.
-- =========================================================================================

-- Catalogos de solo lectura (contenido del juego). caso_prueba queda sin politica: no es legible desde el navegador.
do $$
declare t text;
begin
  foreach t in array array['personaje','rol','comodin','curso','unidad','nivel','leccion','ejercicio','alternativa']
  loop
    execute format('alter table %I enable row level security', t);
    execute format('drop policy if exists "lectura publica" on %I', t);
    execute format('create policy "lectura publica" on %I for select to anon, authenticated using (true)', t);
  end loop;
end $$;

-- Sin politicas = sin acceso desde el navegador (solo por las funciones de la base). caso_prueba solo expone lo no oculto.
alter table sesion_invitado enable row level security;
alter table caso_prueba     enable row level security;
-- Excepcion: las filas NO ocultas de caso_prueba (las filas de las tablas de verdad) si las lee el juego.
drop policy if exists "casos visibles" on caso_prueba;
create policy "casos visibles" on caso_prueba for select to anon, authenticated using (es_oculto = false);
alter table intento         enable row level security;

-- usuario: cada quien ve y modifica SOLO su fila. Al crearla, el rol tiene que ser "estudiante".
alter table usuario enable row level security;
drop policy if exists "usuario ve su fila"       on usuario;
drop policy if exists "usuario crea su fila"     on usuario;
drop policy if exists "usuario actualiza su fila" on usuario;
create policy "usuario ve su fila" on usuario for select to authenticated using (id = auth.uid());
create policy "usuario crea su fila" on usuario for insert to authenticated
  with check (id = auth.uid() and rol_id = (select r.id from rol r where r.nombre = 'estudiante'));
create policy "usuario actualiza su fila" on usuario for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());

-- configuracion, inventario y progreso: solo las filas propias
do $$
declare t text;
begin
  foreach t in array array['configuracion_usuario','inventario_comodin','progreso']
  loop
    execute format('alter table %I enable row level security', t);
    execute format('drop policy if exists "filas propias" on %I', t);
  end loop;
end $$;
create policy "filas propias" on configuracion_usuario for all to authenticated
  using (usuario_id = auth.uid()) with check (usuario_id = auth.uid());
create policy "filas propias" on inventario_comodin for all to authenticated
  using (usuario_id = auth.uid()) with check (usuario_id = auth.uid());
create policy "filas propias" on progreso for all to authenticated
  using (usuario_id = auth.uid()) with check (usuario_id = auth.uid() and sesion_invitado_id is null);
