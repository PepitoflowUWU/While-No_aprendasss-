-- =========================================================================================
-- while(no_aprendas) - LOGROS DESTACADOS: cada jugador elige hasta 3 de sus logros obtenidos para mostrarlos en su perfil
--  logro_usuario.destacado = posicion (1, 2 o 3) del logro entre los destacados; null = no destacado
--  mis_logros_destacados()            -> codigos destacados en orden
--  guardar_logros_destacados(text[])  -> la BASE comprueba: maximo 3, sin repetir y solo logros que el jugador ya reclamo
-- Ejecutar UNA vez, completo (todo o nada, repetible). Requiere haber ejecutado 20.
-- =========================================================================================
begin;

alter table logro_usuario add column if not exists destacado smallint check (destacado between 1 and 3);
create unique index if not exists logro_usuario_destacado_uq on logro_usuario (usuario_id, destacado) where destacado is not null;

create or replace function mis_logros_destacados()
returns text[] language plpgsql stable security definer set search_path = public as $$
declare v_uid uuid := exigir_estudiante();
begin
  return coalesce((select array_agg(codigo order by destacado) from logro_usuario
                   where usuario_id = v_uid and destacado is not null), '{}');
end $$;

create or replace function guardar_logros_destacados(p_codigos text[])
returns text[] language plpgsql security definer set search_path = public as $$
declare
  v_uid uuid := exigir_estudiante();
  v_lista text[] := coalesce(p_codigos, '{}');
  v_i int;
begin
  if cardinality(v_lista) > 3 then
    raise exception 'Solo puedes destacar hasta 3 logros.' using errcode = '22023';
  end if;
  if (select count(distinct c) from unnest(v_lista) c) <> cardinality(v_lista) then
    raise exception 'No repitas un logro en tus destacados.' using errcode = '22023';
  end if;
  if exists (select 1 from unnest(v_lista) c
             where not exists (select 1 from logro_usuario where usuario_id = v_uid and codigo = c)) then
    raise exception 'Solo puedes destacar logros que ya obtuviste.' using errcode = '22023';
  end if;

  update logro_usuario set destacado = null where usuario_id = v_uid and destacado is not null;
  for v_i in 1 .. cardinality(v_lista) loop
    update logro_usuario set destacado = v_i where usuario_id = v_uid and codigo = v_lista[v_i];
  end loop;
  return v_lista;
end $$;

revoke all on function mis_logros_destacados(), guardar_logros_destacados(text[]) from public, anon;
grant execute on function mis_logros_destacados(), guardar_logros_destacados(text[]) to authenticated;

commit;

-- Comprobacion (con tu cuenta en el juego): select codigo, destacado from logro_usuario where destacado is not null;
