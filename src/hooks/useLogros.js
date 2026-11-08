import { useCallback, useEffect, useMemo, useState } from 'react';
import { itemsDeLogros, ordenarLogros, metricasDe } from '../datos/logros.js';
import { logrosReclamados, reclamarLogro, reclamarLogros, logrosDestacados, guardarLogrosDestacados } from '../supabase/logros.js';

const KEY = 'wna_logros_invitado';
const KEY_DEST = 'wna_logros_destacados_invitado';
const leerLocal = (k = KEY) => { try { return JSON.parse(sessionStorage.getItem(k) || '[]'); } catch { return []; } };
const guardarLocal = (arr, k = KEY) => { try { sessionStorage.setItem(k, JSON.stringify(arr)); } catch { /* sin almacenamiento */ } };
export const MAX_DESTACADOS = 3;

// Logros del jugador: el avance sale de su progreso y lo reclamado, de la base (un invitado solo en su pestana).
export function useLogros(sesion, p) {
  const invitado = !!sesion?.invitado || !sesion?.id;
  const [reclamados, setReclamados] = useState(() => new Set(invitado ? leerLocal() : []));
  const [cargado, setCargado] = useState(invitado);
  const [error, setError] = useState('');
  const [ocupado, setOcupado] = useState(false);
  const [destacadosRaw, setDestacadosRaw] = useState(() => (invitado ? leerLocal(KEY_DEST) : []));

  const cargar = useCallback(async () => {
    if (invitado) return;
    try { setReclamados(new Set(await logrosReclamados())); setError(''); }
    catch (e) { setError(e.message); }
    finally { setCargado(true); }
    try { setDestacadosRaw(await logrosDestacados()); } catch { /* sin la migracion 31: sin destacados */ }
  }, [invitado]);
  useEffect(() => { cargar(); }, [cargar, sesion?.id]);

  // Un invitado que reinicia su progreso pierde tambien sus logros
  const sinProgreso = metricasDe(p).lecciones_completadas === 0;
  useEffect(() => {
    if (invitado && sinProgreso && reclamados.size) { setReclamados(new Set()); guardarLocal([]); setDestacadosRaw([]); guardarLocal([], KEY_DEST); }
  }, [invitado, sinProgreso, reclamados]);

  const items = useMemo(() => ordenarLogros(itemsDeLogros(p, reclamados)), [p, reclamados]);
  const pendientes = items.filter((i) => i.reclamable).length;
  const obtenidos = useMemo(() => items.filter((i) => i.reclamado), [items]);

  const reclamar = async (codigo) => {
    const l = items.find((i) => i.codigo === codigo);
    if (!l?.reclamable || ocupado) return false;
    setOcupado(true); setError('');
    try {
      if (invitado) { const sig = new Set(reclamados).add(codigo); setReclamados(sig); guardarLocal([...sig]); }
      else { await reclamarLogro(codigo); setReclamados((s) => new Set(s).add(codigo)); }
      return true;
    } catch (e) { setError(e.message); return false; }
    finally { setOcupado(false); }
  };

  const reclamarTodos = async () => {
    if (!pendientes || ocupado) return 0;
    setOcupado(true); setError('');
    try {
      const codigos = items.filter((i) => i.reclamable).map((i) => i.codigo);
      if (invitado) { const sig = new Set([...reclamados, ...codigos]); setReclamados(sig); guardarLocal([...sig]); return codigos.length; }
      const hechos = await reclamarLogros();
      setReclamados((s) => new Set([...s, ...hechos]));
      return hechos.length;
    } catch (e) { setError(e.message); return 0; }
    finally { setOcupado(false); }
  };

  // Logros destacados: hasta 3 de los obtenidos, en el orden que eligio el jugador
  const destacados = useMemo(
    () => destacadosRaw.map((c) => obtenidos.find((o) => o.codigo === c)).filter(Boolean).slice(0, MAX_DESTACADOS),
    [destacadosRaw, obtenidos],
  );
  const guardarDestacados = async (codigos) => {
    const lista = [...new Set(codigos)].filter((c) => reclamados.has(c)).slice(0, MAX_DESTACADOS);
    if (invitado) { setDestacadosRaw(lista); guardarLocal(lista, KEY_DEST); return true; }
    setDestacadosRaw(await guardarLogrosDestacados(lista));   // si falla, el error llega a quien llamo
    return true;
  };

  return { items, pendientes, obtenidos, total: items.length, cargado, error, ocupado, reclamar, reclamarTodos, recargar: cargar, destacados, guardarDestacados };
}
