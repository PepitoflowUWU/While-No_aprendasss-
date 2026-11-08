-- =========================================================================================
-- while(no_aprendas) - CELULAR DEL ADMINISTRADOR U24207317 (para recibir el codigo SMS del panel)
-- El administrador se creo antes de que el registro pidiera celular, asi que puede no tener uno. Sin celular verificado
-- el panel no puede enviarle el SMS y no deja eliminar cuentas ni cambiar contrasenas.
-- CAMBIA v_telefono por el celular REAL del administrador (+51 y 9 digitos) antes de ejecutarlo.
-- Se guarda ya verificado (tu respondes por el); el primer SMS del panel confirma que llega bien.
-- Requiere haber ejecutado antes 23. Se puede repetir sin problema.
-- =========================================================================================
do $cel$
declare
  v_codigo   text := 'U24207317';
  v_telefono text := '+51900000000';   -- CAMBIALO: celular REAL del administrador
  v_id uuid;
begin
  if v_telefono = '+51900000000' then raise exception 'Cambia v_telefono por el celular real del administrador.'; end if;
  if v_telefono !~ '^\+519[0-9]{8}$' then
    raise exception 'El celular debe ser de Perú: +51 y 9 dígitos (ejemplo: +51912345678).' using errcode = '23514';
  end if;

  select id into v_id from usuario where codigo_estudiante = v_codigo;
  if v_id is null then raise exception 'No existe ningún usuario con el código %.', v_codigo; end if;
  if exists (select 1 from auth.users where phone = substr(v_telefono, 2) and id <> v_id) then
    raise exception 'Ese celular ya está registrado con otra cuenta.' using errcode = '23505';
  end if;

  -- Authentication guarda el numero sin el + (51912345678)
  update auth.users set phone = substr(v_telefono, 2), phone_confirmed_at = now(), updated_at = now() where id = v_id;

  perform set_config('app.cambio_autorizado', 'true', true);   -- el celular es un dato protegido (database/migraciones/23)
  update usuario set telefono = v_telefono where id = v_id;
end $cel$;

select u.nombre_usuario, u.codigo_estudiante, u.telefono, a.phone_confirmed_at is not null as celular_verificado
from usuario u join auth.users a on a.id = u.id where u.codigo_estudiante = 'U24207317';
