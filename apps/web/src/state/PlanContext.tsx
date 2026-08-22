import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import {
  defaultDistribution,
  emptyWeekPlan,
  type MealDistribution,
  type SavedMeal,
  type WeekPlan,
} from '@vatia/diet-engine';

interface PlanValue {
  mealCount: number;
  setMealCount: (n: number) => void;
  distribution: MealDistribution;
  setDistribution: (d: MealDistribution) => void;
  weekPlan: WeekPlan;
  saveMeal: (dayIdx: number, mealIdx: number, meal: SavedMeal) => void;
  clearMeal: (dayIdx: number, mealIdx: number) => void;
  copyMealToWeek: (fromDay: number, mealIdx: number) => void;
  clearWeek: () => void;
}

const PlanCtx = createContext<PlanValue | null>(null);
const STORAGE_KEY = 'vatia:plan:v1';

interface Persisted {
  mealCount: number;
  distribution: MealDistribution;
  weekPlan: WeekPlan;
}

function load(): Persisted {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as Persisted;
  } catch { /* ignore */ }
  const mealCount = 4;
  return {
    mealCount,
    distribution: defaultDistribution(mealCount),
    weekPlan: emptyWeekPlan(),
  };
}

export function PlanProvider({ children }: { children: ReactNode }) {
  const initial = load();
  const [mealCount, setMealCountState] = useState<number>(initial.mealCount);
  const [distribution, setDistribution] = useState<MealDistribution>(initial.distribution);
  const [weekPlan, setWeekPlan] = useState<WeekPlan>(initial.weekPlan);

  useEffect(() => {
    try {
      const payload: Persisted = { mealCount, distribution, weekPlan };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch { /* ignore */ }
  }, [mealCount, distribution, weekPlan]);

  const setMealCount = useCallback((n: number) => {
    setMealCountState(n);
    setDistribution(defaultDistribution(n));
    setWeekPlan(emptyWeekPlan());
  }, []);

  const saveMeal = useCallback((dayIdx: number, mealIdx: number, meal: SavedMeal) => {
    setWeekPlan((prev) => ({
      ...prev,
      [dayIdx]: { ...(prev[dayIdx] ?? {}), [mealIdx]: meal },
    }));
  }, []);

  const clearMeal = useCallback((dayIdx: number, mealIdx: number) => {
    setWeekPlan((prev) => {
      const day = { ...(prev[dayIdx] ?? {}) };
      delete day[mealIdx];
      return { ...prev, [dayIdx]: day };
    });
  }, []);

  const copyMealToWeek = useCallback((fromDay: number, mealIdx: number) => {
    setWeekPlan((prev) => {
      const source = prev[fromDay]?.[mealIdx];
      if (!source) return prev;
      const next: WeekPlan = { ...prev };
      for (let d = 0; d < 7; d++) {
        if (d === fromDay) continue;
        next[d] = { ...(prev[d] ?? {}), [mealIdx]: source };
      }
      return next;
    });
  }, []);

  const clearWeek = useCallback(() => setWeekPlan(emptyWeekPlan()), []);

  const value = useMemo<PlanValue>(() => ({
    mealCount, setMealCount,
    distribution, setDistribution,
    weekPlan, saveMeal, clearMeal, copyMealToWeek, clearWeek,
  }), [mealCount, setMealCount, distribution, weekPlan, saveMeal, clearMeal, copyMealToWeek, clearWeek]);

  return <PlanCtx.Provider value={value}>{children}</PlanCtx.Provider>;
}

export function usePlan(): PlanValue {
  const ctx = useContext(PlanCtx);
  if (!ctx) throw new Error('usePlan must be used inside PlanProvider');
  return ctx;
}
