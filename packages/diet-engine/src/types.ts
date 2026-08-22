export type Sex = 'male' | 'female';

export type Activity =
  | 'sedentary'
  | 'light'
  | 'moderate'
  | 'active'
  | 'very_active';

export type Goal = 'lose' | 'maintain' | 'gain';

export interface Profile {
  sex: Sex;
  age: number;
  weight_kg: number;
  height_cm: number;
  activity: Activity;
  goal: Goal;
  /** grams of protein per kg of body weight (default 1.8) */
  protein_g_per_kg?: number;
  /** fraction of kcal from fat (default 0.25) */
  fat_pct_kcal?: number;
}

export interface DailyTargets {
  bmr: number;
  tdee: number;
  kcal: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
}

export type MealKey = 'breakfast' | 'lunch' | 'snack' | 'dinner';

export interface MealTarget {
  kcal: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
}

export type DailyPlan = Record<MealKey, MealTarget>;

export interface Food {
  id: string;
  name: string;
  kcal_per_100g: number;
  protein_per_100g: number;
  carbs_per_100g: number;
  fat_per_100g: number;
  /** Source CREA category — e.g. `cereali`, `carne`, `verdura` — used by the solver and UI grouping. */
  category?: string;
  /** Broad macro role from the source — `carb_source`, `protein_source`, `fat_source`. */
  macro_category?: string;
}

export type FoodRole = 'protein' | 'carb' | 'veg' | 'fat';

export interface MealSelection {
  protein: Food;
  carb: Food;
  veg: Food;
  /** optional added fat source (e.g. olive oil, nuts) */
  fat?: Food;
}

export interface AllocatedItem {
  food: Food;
  role: FoodRole;
  grams: number;
}

export interface AllocationTotals {
  kcal: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
}

export interface DeviationPct {
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface AllocationResult {
  items: AllocatedItem[];
  totals: AllocationTotals;
  deviation_pct: DeviationPct;
}
