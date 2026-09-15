import { describe, expect, it } from 'vitest';
import { recalibrateTdee } from '../src/weight.js';

describe('recalibrateTdee', () => {
  it('returns null with fewer than two entries', () => {
    expect(recalibrateTdee([{ date: '2026-09-01', kg: 82 }], 2697, 2200)).toBeNull();
  });

  it('returns null when entries span less than a week', () => {
    const entries = [
      { date: '2026-09-01', kg: 82 },
      { date: '2026-09-03', kg: 81.5 },
    ];
    expect(recalibrateTdee(entries, 2697, 2200)).toBeNull();
  });

  it('estimates a lower real TDEE when weight loss undershoots the formula prediction', () => {
    // Formula predicts a 660 kcal/day deficit (2697 - 2037) over 28 days = 2.4 kg lost.
    // Only 1.6 kg was actually lost, so the real TDEE must be lower than the formula's.
    const entries = [
      { date: '2026-08-18', kg: 82.0 },
      { date: '2026-09-15', kg: 80.4 },
    ];
    const result = recalibrateTdee(entries, 2697, 2037);
    expect(result).not.toBeNull();
    expect(result!.days).toBe(28);
    expect(result!.realLossKg).toBeCloseTo(1.6, 5);
    expect(result!.predictedLossKg).toBeCloseTo(2.4, 1);
    expect(result!.realTdee).toBeLessThan(2697);
  });

  it('estimates a higher real TDEE when weight loss overshoots the formula prediction', () => {
    const entries = [
      { date: '2026-08-18', kg: 82.0 },
      { date: '2026-09-15', kg: 78.5 },
    ];
    const result = recalibrateTdee(entries, 2697, 2037);
    expect(result!.realTdee).toBeGreaterThan(2697);
  });
});
