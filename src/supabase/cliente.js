// Unico punto de conexion con Supabase. Ningun componente ni pantalla crea su propio cliente.
// Solo se usa la clave PUBLICA (publishable); la seguridad real la dan las politicas RLS de la base.
import { createClient } from '@supabase/supabase-js';

const URL = import.meta.env.VITE_SUPABASE_URL;
const CLAVE = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

export const supabaseConfigurado = Boolean(URL && CLAVE);
export const configSupabase = { url: URL, clave: CLAVE };

export const supabase = supabaseConfigurado
  ? createClient(URL, CLAVE, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false },
    })
  : null;

if (!supabaseConfigurado) {
  console.warn('[Supabase] Faltan VITE_SUPABASE_URL o VITE_SUPABASE_PUBLISHABLE_KEY en .env');
}

// Devuelve el cliente o lanza un error claro (para las funciones del resto de la carpeta).
export function cliente() {
  if (!supabase) throw new Error('SUPABASE_NO_CONFIGURADO');
  return supabase;
}

// Codigos de error de Postgres que nos interesan.
export const PG = { UNICO: '23505', CHECK: '23514', PERMISO: '42501' };
