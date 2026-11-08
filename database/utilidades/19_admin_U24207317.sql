-- =========================================================================================
-- while(no_aprendas) - DAR EL ROL DE ADMINISTRADOR AL USUARIO U24207317
-- Despues de esto ese usuario ve la corona en el mapa (panel de administracion) y sigue pudiendo jugar con normalidad.
-- Requiere haber ejecutado antes 18_panel_admin.sql. Se puede repetir sin problema.
-- Cambiar el rol de un jugador exige autorizacion: este script la declara solo dentro de su propia transaccion.
-- =========================================================================================
do $admin$
declare v_rol uuid; v_n int;
begin
  select id into v_rol from rol where nombre = 'administrador';
  if v_rol is null then raise exception 'No existe el rol administrador: ejecuta primero 18_panel_admin.sql.'; end if;

  perform set_config('app.cambio_autorizado', 'true', true);
  update usuario set rol_id = v_rol where codigo_estudiante = 'U24207317';
  get diagnostics v_n = row_count;
  if v_n = 0 then raise exception 'No existe ningún usuario con el código U24207317 en la tabla usuario.'; end if;
end $admin$;

select u.nombre_usuario, u.codigo_estudiante, r.nombre as rol
from usuario u join rol r on r.id = u.rol_id where u.codigo_estudiante = 'U24207317';
