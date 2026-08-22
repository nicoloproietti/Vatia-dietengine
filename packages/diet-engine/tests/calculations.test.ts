import { describe, expect, it } from 'vitest';
import {
  ACTIVITY_MULTIPLIER,
  DEFAULT_MEAL_SPLIT,
  bmrMifflinStJeor,
  computeDailyTargets,
  macrosToKcal,
  splitDailyIntoMeals,
  tdee,
} from '../src/calculations.js';
import type { Profile } from '../src/types.js';

describe('bmrMifflinStJeor', () => {
  it('matches known male reference (30y, 80kg, 180cm)', () => {
    // 10*80 + 6.25*180 - 5*30 + 5 = 800 + 1125 - 150 + 5 = 1780
    expect(
      bmrMifflinStJeor({ sex: 'male', weight_kg: 80, height_cm: 180, age: 30 }),
    ).toBe(1780);
  });

  it('matches known female reference (30y, 65kg, 165cm)', () => {
    // 10*65 + 6.25*165 - 5*30 - 161 = 650 + 1031.25 - 150 - 161 = 1370.25
    expect(
      bmrMifflinStJeor({
        sex: 'female',
        weight_kg: 65,
        height_cm: 165,
        age: 30,
      }),
    ).toBeCloseTo(1370.25, 4);
  });

  it('is monotonic in body weight', () => {
    const base = { sex: 'male', height_cm: 180, age: 30 } as const;
    const a = bmrMifflinStJeor({ ...base, weight_kg: 70 });
    const b = bmrMifflinStJeor({ ...base, weight_kg: 90 });
    expect(b).toBeGreaterThan(a);
  });
});

describe('tdee', () => {
  it('applies the activity multiplier', () => {
    expect(tdee(1500, 'sedentary')).toBeCloseTo(1500 * 1.2);
    expect(tdee(1500, 'very_active')).toBeCloseTo(
      1500 * ACTIVITY_MULTIPLIER.very_active,
    );
  });
});

describe('computeDailyTargets', () => {
  const profile: Profile = {
    sex: 'male',
    age: 30,
    weight_kg: 80,
    height_cm: 180,
    activity: 'moderate',
  };

  it('macros reconstruct the total kcal within rounding', () => {
    const t = computeDailyTargets(profile);
    expect(macrosToKcal(t)).toBeCloseTo(t.kcal, 0);
  });

  it('defaults to TDEE (maintenance) when no targetKcal is given', () => {
    const t = computeDailyTargets(profile);
    expect(t.kcal).toBeCloseTo(t.tdee, 0);
  });

  it('honours a caller-supplied targetKcal (deficit / surplus)', () => {
    const t = computeDailyTargets(profile);
    const deficit = computeDailyTargets(profile, t.tdee - 500);
    const surplus = computeDailyTargets(profile, t.tdee + 300);
    expect(deficit.kcal).toBeCloseTo(t.tdee - 500, 0);
    expect(surplus.kcal).toBeCloseTo(t.tdee + 300, 0);
  });

  it('never drops below the 1000 kcal floor even for aggressive deficits', () => {
    const t = computeDailyTargets(profile, 500);
    expect(t.kcal).toBeGreaterThanOrEqual(1000);
  });

  it('protein scales with body weight at the default 1.8 g/kg', () => {
    const t = computeDailyTargets(profile);
    expect(t.protein_g).toBeCloseTo(80 * 1.8, 1);
  });

  it('honours a custom protein_g_per_kg', () => {
    const t = computeDailyTargets({ ...profile, protein_g_per_kg: 2.2 });
    expect(t.protein_g).toBeCloseTo(80 * 2.2, 1);
  });

});

describe('splitDailyIntoMeals', () => {
  it('splits kcal by the default meal shares (sums back to the total)', () => {
    const targets = computeDailyTargets({
      sex: 'male',
      age: 30,
      weight_kg: 80,
      height_cm: 180,
      activity: 'moderate',
    });
    const meals = splitDailyIntoMeals(targets);
    const sum =
      meals.breakfast.kcal +
      meals.lunch.kcal +
      meals.snack.kcal +
      meals.dinner.kcal;
    expect(sum).toBeCloseTo(targets.kcal, 0);
  });

  it('rejects a split that does not sum to 1', () => {
    const targets = computeDailyTargets({
      sex: 'male',
      age: 30,
      weight_kg: 80,
      height_cm: 180,
      activity: 'moderate',
    });
    expect(() =>
      splitDailyIntoMeals(targets, {
        ...DEFAULT_MEAL_SPLIT,
        dinner: 0.9,
      }),
    ).toThrow();
  });
});
