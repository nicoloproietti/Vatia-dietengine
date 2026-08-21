import { describe, expect, it } from 'vitest';
import { allocateMeal } from '../src/allocation.js';
import { validateAllocation } from '../src/validation.js';
import type { Food, MealSelection, MealTarget } from '../src/types.js';

const chicken: Food = {
  id: 'chicken',
  name: 'Petto di pollo',
  kcal_per_100g: 165,
  protein_per_100g: 31,
  carbs_per_100g: 0,
  fat_per_100g: 3.6,
};

const rice: Food = {
  id: 'rice',
  name: 'Riso basmati (cotto)',
  kcal_per_100g: 130,
  protein_per_100g: 2.7,
  carbs_per_100g: 28,
  fat_per_100g: 0.3,
};

const zucchini: Food = {
  id: 'zucchini',
  name: 'Zucchine',
  kcal_per_100g: 17,
  protein_per_100g: 1.2,
  carbs_per_100g: 3.1,
  fat_per_100g: 0.3,
};

const oil: Food = {
  id: 'oil',
  name: 'Olio extravergine di oliva',
  kcal_per_100g: 884,
  protein_per_100g: 0,
  carbs_per_100g: 0,
  fat_per_100g: 100,
};

const lunchTarget: MealTarget = {
  kcal: 720,
  protein_g: 55,
  carbs_g: 85,
  fat_g: 22,
};

describe('allocateMeal', () => {
  it('produces one allocated item per selected food (with fat)', () => {
    const sel: MealSelection = {
      protein: chicken,
      carb: rice,
      veg: zucchini,
      fat: oil,
    };
    const r = allocateMeal(lunchTarget, sel);
    expect(r.items).toHaveLength(4);
    expect(r.items.map((i) => i.role)).toEqual([
      'veg',
      'protein',
      'carb',
      'fat',
    ]);
  });

  it('omits fat item when no fat food is selected', () => {
    const sel: MealSelection = { protein: chicken, carb: rice, veg: zucchini };
    const r = allocateMeal(lunchTarget, sel);
    expect(r.items).toHaveLength(3);
    expect(r.items.every((i) => i.role !== 'fat')).toBe(true);
  });

  it('lands within macro tolerance for a realistic lunch (with added fat)', () => {
    const sel: MealSelection = {
      protein: chicken,
      carb: rice,
      veg: zucchini,
      fat: oil,
    };
    const r = allocateMeal(lunchTarget, sel);
    const report = validateAllocation(r);
    expect(report.severity).not.toBe('fail');
  });

  it('grams are rounded to the configured step per role', () => {
    const sel: MealSelection = {
      protein: chicken,
      carb: rice,
      veg: zucchini,
      fat: oil,
    };
    const r = allocateMeal(lunchTarget, sel);
    const protein = r.items.find((i) => i.role === 'protein')!;
    const carb = r.items.find((i) => i.role === 'carb')!;
    const veg = r.items.find((i) => i.role === 'veg')!;
    expect(protein.grams % 5).toBe(0);
    expect(carb.grams % 5).toBe(0);
    expect(veg.grams % 10).toBe(0);
  });

  it('respects per-role clamps (protein food capped at max)', () => {
    // Absurd target should trigger the upper clamp on protein.
    const impossible: MealTarget = {
      kcal: 4000,
      protein_g: 500,
      carbs_g: 400,
      fat_g: 80,
    };
    const sel: MealSelection = { protein: chicken, carb: rice, veg: zucchini };
    const r = allocateMeal(impossible, sel);
    const protein = r.items.find((i) => i.role === 'protein')!;
    expect(protein.grams).toBeLessThanOrEqual(350);
  });

  it('reports a non-zero deviation when target is impossible to hit', () => {
    const impossible: MealTarget = {
      kcal: 4000,
      protein_g: 500,
      carbs_g: 400,
      fat_g: 80,
    };
    const sel: MealSelection = { protein: chicken, carb: rice, veg: zucchini };
    const r = allocateMeal(impossible, sel);
    expect(Math.abs(r.deviation_pct.protein)).toBeGreaterThan(10);
  });

  it('totals kcal are consistent with the reported grams', () => {
    const sel: MealSelection = {
      protein: chicken,
      carb: rice,
      veg: zucchini,
      fat: oil,
    };
    const r = allocateMeal(lunchTarget, sel);
    const kcalRecomputed = r.items.reduce(
      (acc, it) => acc + (it.food.kcal_per_100g * it.grams) / 100,
      0,
    );
    expect(r.totals.kcal).toBeCloseTo(kcalRecomputed, 0);
  });
});
