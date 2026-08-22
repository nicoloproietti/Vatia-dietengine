import type { AllocationTotals, DailyTargets, Food } from './types.js';
import { KCAL_PER_G } from './calculations.js';

/** Named meal templates by count (Italian day patterns). */
export const DEFAULT_MEAL_NAMES: Record<number, string[]> = {
  2: ['Pranzo', 'Cena'],
  3: ['Colazione', 'Pranzo', 'Cena'],
  4: ['Colazione', 'Spuntino', 'Pranzo', 'Cena'],
  5: ['Colazione', 'Spuntino', 'Pranzo', 'Spuntino', 'Cena'],
  6: ['Colazione', 'Spuntino', 'Pranzo', 'Spuntino', 'Cena', 'Spuntino'],
};

/** Default kcal distribution (percent per meal) by count. */
const DEFAULT_KCAL_PCT: Record<number, number[]> = {
  2: [45, 55],
  3: [25, 40, 35],
  4: [25, 10, 40, 25],
  5: [20, 10, 35, 10, 25],
  6: [20, 10, 30, 10, 25, 5],
};

/** Default macro split (percent of that meal's kcal). Same for every meal. */
export const DEFAULT_MEAL_MACRO_PCT = { protein: 30, carbs: 45, fat: 25 };

export interface MealMacroPct { protein: number; carbs: number; fat: number }

export interface MealDistribution {
  /** length === mealCount; ideally sums to 100 */
  kcalPct: number[];
  /** length === mealCount; each entry sums to 100 */
  mealMacros: MealMacroPct[];
}

export function defaultDistribution(mealCount: number): MealDistribution {
  const kcalPct = DEFAULT_KCAL_PCT[mealCount] ?? buildEqualKcal(mealCount);
  const mealMacros = Array.from({ length: mealCount }, () => ({ ...DEFAULT_MEAL_MACRO_PCT }));
  return { kcalPct, mealMacros };
}

function buildEqualKcal(n: number): number[] {
  const base = Math.floor(100 / n);
  const rem = 100 - base * n;
  return Array.from({ length: n }, (_, i) => base + (i < rem ? 1 : 0));
}

export interface MealTargets {
  kcal: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
}

/** Per-meal absolute targets computed from the daily total + distribution. */
export function mealTargetsFor(
  daily: DailyTargets,
  dist: MealDistribution,
  mealIndex: number,
): MealTargets {
  const pct = dist.kcalPct[mealIndex] ?? 0;
  const kcal = Math.round((daily.kcal * pct) / 100);
  const mm = dist.mealMacros[mealIndex] ?? DEFAULT_MEAL_MACRO_PCT;
  return {
    kcal,
    protein_g: Math.round((kcal * mm.protein) / 100 / KCAL_PER_G.protein),
    carbs_g:   Math.round((kcal * mm.carbs)   / 100 / KCAL_PER_G.carbs),
    fat_g:     Math.round((kcal * mm.fat)     / 100 / KCAL_PER_G.fat),
  };
}

/** All per-meal targets for the day. */
export function dailyMealTargets(
  daily: DailyTargets,
  dist: MealDistribution,
): MealTargets[] {
  return dist.kcalPct.map((_, i) => mealTargetsFor(daily, dist, i));
}

/** A single food entry saved to a meal. */
export interface MealItem {
  food: Food;
  grams: number;
  nutrition: AllocationTotals;
}

export interface SavedMeal {
  items: MealItem[];
  totals: AllocationTotals;
  updated_at?: string;
}

/** weekPlan[dayIndex][mealIndex] = SavedMeal | undefined. Day 0 = Monday. */
export type WeekPlan = Record<number, Record<number, SavedMeal | undefined>>;

export const DAYS_IT = ['Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato', 'Domenica'];
export const DAYS_EN = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
export const DAYS_SHORT_IT = ['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'];
export const DAYS_SHORT_EN = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export function emptyWeekPlan(): WeekPlan {
  return { 0: {}, 1: {}, 2: {}, 3: {}, 4: {}, 5: {}, 6: {} };
}

/** Sum of a food entry's contribution (also computes kcal from macros as a check). */
export function computeItemNutrition(food: Food, grams: number): AllocationTotals {
  const factor = grams / 100;
  const protein = round1(food.protein_per_100g * factor);
  const carbs = round1(food.carbs_per_100g * factor);
  const fat = round1(food.fat_per_100g * factor);
  const kcalFromMacros = protein * KCAL_PER_G.protein + carbs * KCAL_PER_G.carbs + fat * KCAL_PER_G.fat;
  const kcal = food.kcal_per_100g > 0 ? Math.round(food.kcal_per_100g * factor) : Math.round(kcalFromMacros);
  return { kcal, protein_g: protein, carbs_g: carbs, fat_g: fat };
}

export function sumTotals(items: MealItem[]): AllocationTotals {
  return items.reduce<AllocationTotals>(
    (acc, it) => ({
      kcal: acc.kcal + it.nutrition.kcal,
      protein_g: round1(acc.protein_g + it.nutrition.protein_g),
      carbs_g: round1(acc.carbs_g + it.nutrition.carbs_g),
      fat_g: round1(acc.fat_g + it.nutrition.fat_g),
    }),
    { kcal: 0, protein_g: 0, carbs_g: 0, fat_g: 0 },
  );
}

/** Aggregate a whole day's saved meals. */
export function dayTotals(dayPlan: Record<number, SavedMeal | undefined>): AllocationTotals {
  const items: MealItem[] = [];
  for (const key of Object.keys(dayPlan)) {
    const meal = dayPlan[Number(key)];
    if (meal) items.push(...meal.items);
  }
  return sumTotals(items);
}

/** Aggregate the whole week (used for shopping list totals). */
export function weekAggregatedByFood(week: WeekPlan): Array<{ food: Food; grams: number }> {
  const acc = new Map<string, { food: Food; grams: number }>();
  for (const day of Object.values(week)) {
    for (const meal of Object.values(day)) {
      if (!meal) continue;
      for (const it of meal.items) {
        const existing = acc.get(it.food.id);
        if (existing) existing.grams = round1(existing.grams + it.grams);
        else acc.set(it.food.id, { food: it.food, grams: it.grams });
      }
    }
  }
  return [...acc.values()].sort((a, b) => a.food.name.localeCompare(b.food.name));
}

function round1(n: number): number { return Math.round(n * 10) / 10; }
