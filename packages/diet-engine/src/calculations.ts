import type {
  Activity,
  DailyPlan,
  DailyTargets,
  Goal,
  MealKey,
  MealTarget,
  Profile,
  Sex,
} from './types.js';

/** kcal per gram of each macronutrient (Atwater factors) */
export const KCAL_PER_G = { protein: 4, carbs: 4, fat: 9 } as const;

export const ACTIVITY_MULTIPLIER: Record<Activity, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  very_active: 1.9,
};

/** kcal delta applied to TDEE for each goal */
export const GOAL_KCAL_DELTA: Record<Goal, number> = {
  lose: -500,
  maintain: 0,
  gain: 300,
};

export const DEFAULT_PROTEIN_G_PER_KG = 1.8;
export const DEFAULT_FAT_PCT_KCAL = 0.25;

export const DEFAULT_MEAL_SPLIT: Record<MealKey, number> = {
  breakfast: 0.25,
  lunch: 0.4,
  snack: 0.1,
  dinner: 0.25,
};

/**
 * Mifflin-St Jeor Basal Metabolic Rate.
 * Male:   10*kg + 6.25*cm - 5*age + 5
 * Female: 10*kg + 6.25*cm - 5*age - 161
 */
export function bmrMifflinStJeor(profile: {
  sex: Sex;
  weight_kg: number;
  height_cm: number;
  age: number;
}): number {
  const { sex, weight_kg, height_cm, age } = profile;
  const base = 10 * weight_kg + 6.25 * height_cm - 5 * age;
  return sex === 'male' ? base + 5 : base - 161;
}

export function tdee(bmr: number, activity: Activity): number {
  return bmr * ACTIVITY_MULTIPLIER[activity];
}

export function computeDailyTargets(profile: Profile): DailyTargets {
  const bmr = bmrMifflinStJeor(profile);
  const tdeeValue = tdee(bmr, profile.activity);
  const kcal = Math.max(1000, tdeeValue + GOAL_KCAL_DELTA[profile.goal]);

  const proteinPerKg = profile.protein_g_per_kg ?? DEFAULT_PROTEIN_G_PER_KG;
  const fatPct = profile.fat_pct_kcal ?? DEFAULT_FAT_PCT_KCAL;

  const protein_g = round1(proteinPerKg * profile.weight_kg);
  const fat_g = round1((kcal * fatPct) / KCAL_PER_G.fat);
  const proteinKcal = protein_g * KCAL_PER_G.protein;
  const fatKcal = fat_g * KCAL_PER_G.fat;
  const carbs_g = round1(
    Math.max(0, (kcal - proteinKcal - fatKcal) / KCAL_PER_G.carbs),
  );

  return {
    bmr: round1(bmr),
    tdee: round1(tdeeValue),
    kcal: round1(kcal),
    protein_g,
    carbs_g,
    fat_g,
  };
}

export function splitDailyIntoMeals(
  targets: DailyTargets,
  split: Record<MealKey, number> = DEFAULT_MEAL_SPLIT,
): DailyPlan {
  assertSplitSumsToOne(split);
  const meals = {} as DailyPlan;
  (Object.keys(split) as MealKey[]).forEach((meal) => {
    const share = split[meal];
    meals[meal] = {
      kcal: round1(targets.kcal * share),
      protein_g: round1(targets.protein_g * share),
      carbs_g: round1(targets.carbs_g * share),
      fat_g: round1(targets.fat_g * share),
    };
  });
  return meals;
}

export function macrosToKcal(t: {
  protein_g: number;
  carbs_g: number;
  fat_g: number;
}): number {
  return (
    t.protein_g * KCAL_PER_G.protein +
    t.carbs_g * KCAL_PER_G.carbs +
    t.fat_g * KCAL_PER_G.fat
  );
}

export function emptyMealTotals(): MealTarget {
  return { kcal: 0, protein_g: 0, carbs_g: 0, fat_g: 0 };
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

function assertSplitSumsToOne(split: Record<MealKey, number>): void {
  const sum = Object.values(split).reduce((a, b) => a + b, 0);
  if (Math.abs(sum - 1) > 1e-6) {
    throw new Error(
      `meal split must sum to 1, got ${sum.toFixed(4)}`,
    );
  }
}
