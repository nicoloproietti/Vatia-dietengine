import {
  KCAL_PER_G,
  emptyMealTotals,
  macrosToKcal,
} from './calculations.js';
import type {
  AllocatedItem,
  AllocationResult,
  AllocationTotals,
  DeviationPct,
  Food,
  FoodRole,
  MealSelection,
  MealTarget,
} from './types.js';

export interface AllocationOptions {
  /** grams of vegetables to include by default (portion size) */
  veg_grams?: number;
  /** min/max grams enforced per role (safety clamps) */
  clamps?: Partial<Record<FoodRole, { min: number; max: number }>>;
  /** rounding step in grams per role */
  round_step?: Partial<Record<FoodRole, number>>;
}

const DEFAULT_CLAMPS: Record<FoodRole, { min: number; max: number }> = {
  protein: { min: 30, max: 350 },
  carb: { min: 20, max: 400 },
  veg: { min: 50, max: 400 },
  fat: { min: 3, max: 60 },
};

const DEFAULT_ROUND_STEP: Record<FoodRole, number> = {
  protein: 5,
  carb: 5,
  veg: 10,
  fat: 1,
};

const DEFAULT_VEG_GRAMS = 150;

/**
 * Sequentially allocates grams to each food in a meal selection so the
 * combined macros land as close as possible to the target.
 *
 * Order matters: veg is fixed (portion), then protein food is sized to
 * hit residual protein, then carb food to hit residual carbs, then the
 * optional fat food tops up residual fat. This mirrors how a nutritionist
 * builds a plate and keeps the math transparent — no black box solver.
 */
export function allocateMeal(
  target: MealTarget,
  selection: MealSelection,
  options: AllocationOptions = {},
): AllocationResult {
  const clamps = { ...DEFAULT_CLAMPS, ...(options.clamps ?? {}) };
  const roundStep = { ...DEFAULT_ROUND_STEP, ...(options.round_step ?? {}) };
  const vegGrams = options.veg_grams ?? DEFAULT_VEG_GRAMS;

  const items: AllocatedItem[] = [];
  const running = emptyMealTotals();

  // 1. veg — fixed portion
  const vegItem = makeItem(
    selection.veg,
    'veg',
    vegGrams,
    clamps.veg,
    roundStep.veg,
  );
  items.push(vegItem);
  addContribution(running, vegItem);

  // 2. protein — size to hit residual protein target
  const residualProtein1 = Math.max(0, target.protein_g - running.protein_g);
  const proteinGrams = solveGramsForMacro(
    selection.protein.protein_per_100g,
    residualProtein1,
  );
  const proteinItem = makeItem(
    selection.protein,
    'protein',
    proteinGrams,
    clamps.protein,
    roundStep.protein,
  );
  items.push(proteinItem);
  addContribution(running, proteinItem);

  // 3. carb — size to hit residual carbs target
  const residualCarbs = Math.max(0, target.carbs_g - running.carbs_g);
  const carbGrams = solveGramsForMacro(
    selection.carb.carbs_per_100g,
    residualCarbs,
  );
  const carbItem = makeItem(
    selection.carb,
    'carb',
    carbGrams,
    clamps.carb,
    roundStep.carb,
  );
  items.push(carbItem);
  addContribution(running, carbItem);

  // 4. optional fat — top up residual fat target
  if (selection.fat) {
    const residualFat = Math.max(0, target.fat_g - running.fat_g);
    const fatGrams = solveGramsForMacro(
      selection.fat.fat_per_100g,
      residualFat,
    );
    const fatItem = makeItem(
      selection.fat,
      'fat',
      fatGrams,
      clamps.fat,
      roundStep.fat,
    );
    items.push(fatItem);
    addContribution(running, fatItem);
  }

  const totals: AllocationTotals = {
    kcal: round1(running.kcal),
    protein_g: round1(running.protein_g),
    carbs_g: round1(running.carbs_g),
    fat_g: round1(running.fat_g),
  };

  return {
    items,
    totals,
    deviation_pct: computeDeviation(totals, target),
  };
}

function makeItem(
  food: Food,
  role: FoodRole,
  desiredGrams: number,
  clamp: { min: number; max: number },
  step: number,
): AllocatedItem {
  const clamped = Math.min(clamp.max, Math.max(clamp.min, desiredGrams));
  const grams = Math.max(0, Math.round(clamped / step) * step);
  return { food, role, grams };
}

function addContribution(
  totals: AllocationTotals,
  item: AllocatedItem,
): void {
  const factor = item.grams / 100;
  totals.protein_g += item.food.protein_per_100g * factor;
  totals.carbs_g += item.food.carbs_per_100g * factor;
  totals.fat_g += item.food.fat_per_100g * factor;
  totals.kcal +=
    item.food.kcal_per_100g > 0
      ? item.food.kcal_per_100g * factor
      : macrosToKcal({
          protein_g: item.food.protein_per_100g * factor,
          carbs_g: item.food.carbs_per_100g * factor,
          fat_g: item.food.fat_per_100g * factor,
        });
}

function solveGramsForMacro(
  macroPer100g: number,
  targetMacroGrams: number,
): number {
  if (macroPer100g <= 0) return 0;
  return (targetMacroGrams / macroPer100g) * 100;
}

function computeDeviation(
  totals: AllocationTotals,
  target: MealTarget,
): DeviationPct {
  return {
    kcal: pctDiff(totals.kcal, target.kcal),
    protein: pctDiff(totals.protein_g, target.protein_g),
    carbs: pctDiff(totals.carbs_g, target.carbs_g),
    fat: pctDiff(totals.fat_g, target.fat_g),
  };
}

function pctDiff(actual: number, target: number): number {
  if (target <= 0) return 0;
  return round1(((actual - target) / target) * 100);
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

// re-exported for consumers that build totals themselves
export { KCAL_PER_G };
