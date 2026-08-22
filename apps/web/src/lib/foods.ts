import type { Food, FoodRole } from '@vatia/diet-engine';
import { supabase, type FoodRow, type SeasonalityInfo } from './supabaseClient.ts';

/**
 * Map from our engine role to the source `macro_category` values.
 * `veg` doesn't have a dedicated macro_category in the CREA schema — we
 * derive it from the `category` column (verdura/ortaggi).
 */
const MACRO_BY_ROLE: Record<Exclude<FoodRole, 'veg'>, string> = {
  protein: 'protein_source',
  carb: 'carb_source',
  fat: 'fat_source',
};

export async function fetchFoodsForRole(
  role: FoodRole,
  excludes: string[] = [],
): Promise<Food[]> {
  let query = supabase
    .from('foods')
    .select('id,name,category,macro_category,kcal,protein,carbs,fat,usable_for_meal_generator')
    .eq('usable_for_meal_generator', true)
    .order('name');

  if (role === 'veg') {
    query = query.in('category', ['verdura', 'ortaggi', 'ortaggi_frutti']);
  } else {
    query = query.eq('macro_category', MACRO_BY_ROLE[role]);
  }

  const { data, error } = await query.limit(500);
  if (error) throw error;
  const rows = (data ?? []) as FoodRow[];
  const filtered = excludes.length
    ? rows.filter((r) => !excludes.some((e) => r.name.toLowerCase().includes(e.toLowerCase())))
    : rows;

  return filtered.map(toEngineFood);
}

export function toEngineFood(row: FoodRow): Food {
  return {
    id: row.id,
    name: row.name,
    kcal_per_100g: row.kcal ?? 0,
    protein_per_100g: row.protein ?? 0,
    carbs_per_100g: row.carbs ?? 0,
    fat_per_100g: row.fat ?? 0,
    ...(row.category ? { category: row.category } : {}),
    ...(row.macro_category ? { macro_category: row.macro_category } : {}),
  };
}

export async function fetchSeasonality(foodId: string): Promise<SeasonalityInfo | null> {
  const { data, error } = await supabase.rpc('food_seasonality', {
    p_food_id: foodId,
  });
  if (error) throw error;
  const first = (data as SeasonalityInfo[] | null)?.[0];
  return first ?? null;
}
