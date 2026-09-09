import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import type { Food } from '@vatia/diet-engine';
import { searchFoods } from '../lib/foodsDb.ts';

/** Un alimento aggiunto a mano: stessi campi di quelli CREA, per 100 g. */
export interface CustomFood {
  id: string;
  name: string;
  category: string;
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
}

export type CustomFoodInput = Omit<CustomFood, 'id'>;

interface FoodsValue {
  customFoods: CustomFood[];
  addFood: (input: CustomFoodInput) => Food;
  removeFood: (id: string) => void;
  replaceAll: (foods: CustomFood[]) => void;
  /** Cerca fra i tuoi alimenti e i 900 del database, i tuoi per primi. */
  search: (term: string) => Food[];
}

const FoodsCtx = createContext<FoodsValue | null>(null);
const STORAGE_KEY = 'vatia:custom-foods:v1';

function load(): CustomFood[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as CustomFood[]) : [];
  } catch {
    return [];
  }
}

export function toEngineFood(f: CustomFood): Food {
  return {
    id: f.id,
    name: f.name,
    kcal_per_100g: f.kcal,
    protein_per_100g: f.protein,
    carbs_per_100g: f.carbs,
    fat_per_100g: f.fat,
    category: f.category,
  };
}

function normalize(s: string): string {
  return s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

export function FoodsProvider({ children }: { children: ReactNode }) {
  const [customFoods, setCustomFoods] = useState<CustomFood[]>(load);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(customFoods));
    } catch { /* ignore */ }
  }, [customFoods]);

  const addFood = useCallback((input: CustomFoodInput): Food => {
    const food: CustomFood = { ...input, id: `mio_${Date.now().toString(36)}` };
    setCustomFoods((prev) => [food, ...prev]);
    return toEngineFood(food);
  }, []);

  const removeFood = useCallback((id: string) => {
    setCustomFoods((prev) => prev.filter((f) => f.id !== id));
  }, []);

  const replaceAll = useCallback((foods: CustomFood[]) => setCustomFoods(foods), []);

  const search = useCallback((term: string): Food[] => {
    const q = normalize(term.trim());
    if (q.length < 2) return [];
    const tokens = q.split(/\s+/).filter(Boolean);
    const mine = customFoods
      .filter((f) => {
        const n = normalize(f.name);
        return tokens.every((tk) => n.includes(tk));
      })
      .map(toEngineFood);
    return [...mine, ...searchFoods(term)];
  }, [customFoods]);

  const value = useMemo<FoodsValue>(
    () => ({ customFoods, addFood, removeFood, replaceAll, search }),
    [customFoods, addFood, removeFood, replaceAll, search],
  );
  return <FoodsCtx.Provider value={value}>{children}</FoodsCtx.Provider>;
}

export function useFoods(): FoodsValue {
  const ctx = useContext(FoodsCtx);
  if (!ctx) throw new Error('useFoods deve stare dentro FoodsProvider');
  return ctx;
}
