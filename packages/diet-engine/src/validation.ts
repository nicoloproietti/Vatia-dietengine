import type { AllocationResult, DeviationPct, MealTarget } from './types.js';

export interface Tolerances {
  kcal_pct: number;
  protein_pct: number;
  carbs_pct: number;
  fat_pct: number;
}

/** Default absolute-percentage tolerances a meal should stay within. */
export const DEFAULT_TOLERANCES: Tolerances = {
  kcal_pct: 10,
  protein_pct: 15,
  carbs_pct: 15,
  fat_pct: 20,
};

export type ValidationSeverity = 'ok' | 'warn' | 'fail';

export interface ValidationIssue {
  macro: keyof DeviationPct;
  actual_pct: number;
  tolerance_pct: number;
  severity: ValidationSeverity;
}

export interface ValidationReport {
  severity: ValidationSeverity;
  issues: ValidationIssue[];
}

export function validateAllocation(
  result: AllocationResult,
  tolerances: Tolerances = DEFAULT_TOLERANCES,
): ValidationReport {
  const checks: Array<[keyof DeviationPct, number]> = [
    ['kcal', tolerances.kcal_pct],
    ['protein', tolerances.protein_pct],
    ['carbs', tolerances.carbs_pct],
    ['fat', tolerances.fat_pct],
  ];

  const issues: ValidationIssue[] = [];
  for (const [macro, tol] of checks) {
    const actual = Math.abs(result.deviation_pct[macro]);
    if (actual <= tol) continue;
    issues.push({
      macro,
      actual_pct: result.deviation_pct[macro],
      tolerance_pct: tol,
      severity: actual > tol * 2 ? 'fail' : 'warn',
    });
  }

  const severity: ValidationSeverity = issues.some((i) => i.severity === 'fail')
    ? 'fail'
    : issues.length > 0
      ? 'warn'
      : 'ok';

  return { severity, issues };
}

export function isWithinTolerance(
  result: AllocationResult,
  target: MealTarget,
  tolerances: Tolerances = DEFAULT_TOLERANCES,
): boolean {
  void target; // target is already baked into result.deviation_pct
  return validateAllocation(result, tolerances).severity !== 'fail';
}
