import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import type { WeightEntry } from '@vatia/diet-engine';

interface WeightValue {
  /** In ordine crescente di data — la prima è la pesata di partenza. */
  entries: WeightEntry[];
  addEntry: (date: string, kg: number) => void;
  removeEntry: (date: string) => void;
  /** Il TDEE ricalibrato che l'utente ha scelto di adottare, se l'ha fatto. */
  adoptedTdee: number | null;
  adoptTdee: (kcal: number) => void;
  /** Ricalibrazioni già viste e scartate, per non ripresentarle uguali. */
  dismissedTdee: number | null;
  dismissTdee: (kcal: number) => void;
  snapshot: () => Persisted;
  restore: (data: unknown) => void;
}

const WeightCtx = createContext<WeightValue | null>(null);
const STORAGE_KEY = 'vatia:weight:v1';

interface Persisted {
  entries: WeightEntry[];
  adoptedTdee: number | null;
  dismissedTdee: number | null;
}

function load(): Persisted {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const p = JSON.parse(raw) as Partial<Persisted>;
      return {
        entries: Array.isArray(p.entries) ? p.entries : [],
        adoptedTdee: p.adoptedTdee ?? null,
        dismissedTdee: p.dismissedTdee ?? null,
      };
    }
  } catch { /* ignore */ }
  return { entries: [], adoptedTdee: null, dismissedTdee: null };
}

function sortByDate(entries: WeightEntry[]): WeightEntry[] {
  return [...entries].sort((a, b) => a.date.localeCompare(b.date));
}

export function WeightProvider({ children }: { children: ReactNode }) {
  const initial = load();
  const [entries, setEntries] = useState<WeightEntry[]>(initial.entries);
  const [adoptedTdee, setAdoptedTdee] = useState<number | null>(initial.adoptedTdee);
  const [dismissedTdee, setDismissedTdee] = useState<number | null>(initial.dismissedTdee);

  useEffect(() => {
    try {
      const payload: Persisted = { entries, adoptedTdee, dismissedTdee };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch { /* ignore */ }
  }, [entries, adoptedTdee, dismissedTdee]);

  const addEntry = useCallback((date: string, kg: number) => {
    setEntries((prev) => sortByDate([...prev.filter((e) => e.date !== date), { date, kg }]));
  }, []);

  const removeEntry = useCallback((date: string) => {
    setEntries((prev) => prev.filter((e) => e.date !== date));
  }, []);

  const adoptTdee = useCallback((kcal: number) => {
    setAdoptedTdee(kcal);
    setDismissedTdee(null);
  }, []);

  const dismissTdee = useCallback((kcal: number) => {
    setDismissedTdee(kcal);
  }, []);

  const snapshot = useCallback((): Persisted => ({ entries, adoptedTdee, dismissedTdee }), [entries, adoptedTdee, dismissedTdee]);

  const restore = useCallback((data: unknown) => {
    if (!data || typeof data !== 'object') return;
    const p = data as Partial<Persisted>;
    setEntries(Array.isArray(p.entries) ? sortByDate(p.entries) : []);
    setAdoptedTdee(p.adoptedTdee ?? null);
    setDismissedTdee(p.dismissedTdee ?? null);
  }, []);

  const value = useMemo<WeightValue>(() => ({
    entries, addEntry, removeEntry, adoptedTdee, adoptTdee, dismissedTdee, dismissTdee, snapshot, restore,
  }), [entries, addEntry, removeEntry, adoptedTdee, adoptTdee, dismissedTdee, dismissTdee, snapshot, restore]);

  return <WeightCtx.Provider value={value}>{children}</WeightCtx.Provider>;
}

export function useWeight(): WeightValue {
  const ctx = useContext(WeightCtx);
  if (!ctx) throw new Error('useWeight deve stare dentro WeightProvider');
  return ctx;
}
