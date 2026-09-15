import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';

/**
 * Cosa hai davvero mangiato, giorno per giorno.
 *
 * Il piano è un modello settimanale che si ripete; le spunte no. Vanno
 * legate alla data vera, altrimenti lunedì prossimo ti ritroveresti la
 * colazione già segnata. Le date vecchie si buttano da sole.
 */
type EatenMap = Record<string, Record<number, boolean>>;

interface EatenValue {
  /** Indici dei pasti segnati come mangiati in questa data. */
  eatenOn: (dateKey: string) => Record<number, boolean>;
  toggle: (dateKey: string, mealIdx: number) => void;
  clearDay: (dateKey: string) => void;
}

const EatenCtx = createContext<EatenValue | null>(null);
const STORAGE_KEY = 'vatia:eaten:v1';
const KEEP_DAYS = 60;

export function dateKey(d: Date = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** Lunedì = 0, come DAYS_IT. */
export function weekdayIndex(d: Date = new Date()): number {
  return (d.getDay() + 6) % 7;
}

function prune(map: EatenMap): EatenMap {
  const limit = new Date();
  limit.setDate(limit.getDate() - KEEP_DAYS);
  const cutoff = dateKey(limit);
  const out: EatenMap = {};
  for (const [k, v] of Object.entries(map)) {
    if (k >= cutoff) out[k] = v;
  }
  return out;
}

function load(): EatenMap {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? prune(parsed as EatenMap) : {};
  } catch {
    return {};
  }
}

export function EatenProvider({ children }: { children: ReactNode }) {
  const [map, setMap] = useState<EatenMap>(load);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
    } catch { /* ignore */ }
  }, [map]);

  const eatenOn = useCallback((key: string) => map[key] ?? {}, [map]);

  const toggle = useCallback((key: string, mealIdx: number) => {
    setMap((prev) => {
      const day = { ...(prev[key] ?? {}) };
      if (day[mealIdx]) delete day[mealIdx];
      else day[mealIdx] = true;
      return { ...prev, [key]: day };
    });
  }, []);

  const clearDay = useCallback((key: string) => {
    setMap((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }, []);

  const value = useMemo<EatenValue>(() => ({ eatenOn, toggle, clearDay }), [eatenOn, toggle, clearDay]);
  return <EatenCtx.Provider value={value}>{children}</EatenCtx.Provider>;
}

export function useEaten(): EatenValue {
  const ctx = useContext(EatenCtx);
  if (!ctx) throw new Error('useEaten deve stare dentro EatenProvider');
  return ctx;
}
