import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!url || !key) {
  throw new Error(
    'VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY missing. Copy apps/web/.env.example to .env.',
  );
}

export const supabase = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false },
});

export interface FoodRow {
  id: string;
  name: string;
  category: string | null;
  macro_category: string | null;
  kcal: number | null;
  protein: number | null;
  carbs: number | null;
  fat: number | null;
  usable_for_meal_generator: boolean;
}

export interface SeasonalityInfo {
  food_id: string;
  food_name: string;
  matched_family: string | null;
  is_in_season: boolean;
  is_local: boolean;
  matched_toponym: string | null;
}
