import React, { createContext, useContext, useState } from 'react';

// AccountData: datos de la cuenta que viajan de "Crear cuenta" a "Selección de personaje".
// Nunca contiene la contraseña.
const Ctx = createContext(null);

export function AccountProvider({ children }) {
  const [cuenta, setCuenta] = useState(null);
  // Borrador de Crear cuenta SOLO en memoria (no se guarda en storage ni cookies): permite volver desde Selección con los datos escritos.
  const [borrador, setBorrador] = useState(null);
  const fijarPersonaje = (personaje_id) => setCuenta((c) => (c ? { ...c, personaje_id } : c));
  const limpiar = () => { setCuenta(null); setBorrador(null); };
  return <Ctx.Provider value={{ cuenta, setCuenta, borrador, setBorrador, fijarPersonaje, limpiar }}>{children}</Ctx.Provider>;
}

export const useCuenta = () => useContext(Ctx);
