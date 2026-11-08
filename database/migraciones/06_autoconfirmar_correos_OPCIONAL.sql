-- =========================================================================================
-- OPCIONAL - Red de seguridad: marca como confirmado todo correo nuevo en Authentication.
-- El juego NO verifica correos (son solo "codigo@utp.edu.pe"). Con "Confirm email" apagado esto no hace falta;
-- si alguna vez se vuelve a activar por error, este trigger evita que los registros se bloqueen.
-- Ejecutalo aparte: si tu rol no tiene permiso sobre auth.users, dara error y no afecta al resto.
-- =========================================================================================
create or replace function autoconfirmar_correo()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if NEW.email_confirmed_at is null then NEW.email_confirmed_at := now(); end if;
  return NEW;
end $$;
revoke all on function autoconfirmar_correo() from public, anon, authenticated;

drop trigger if exists trg_autoconfirmar on auth.users;
create trigger trg_autoconfirmar before insert on auth.users
for each row execute function autoconfirmar_correo();
