import { KCAL_PER_G } from './calculations.js';
import type { Food } from './types.js';
import type { MealTargets } from './weekly.js';

/**
 * Optimal-grams solver ported from the Vatia gestionale
 * (src/utils/mealOptimizer.js).
 *
 * Given a list of foods and a per-meal target (kcal + protein/carbs/fat in
 * grams), returns the grams each food should have to land as close as
 * possible to the target. Verdure are fixed at 200g total (excluded from
 * the optimisation), the rest is solved via weighted Gauss-Jordan.
 */

/** Total grams of vegetables per meal (split evenly across selected veg). */
export const VERDURE_GRAMS = 200;
const MIN_GRAMS = 10;

/** A food counts as "verdura" if its category is `verdura` or `verdure`. */
export function isVerdura(food: Food & { category?: string }): boolean {
  const cat = (food as { category?: string }).category;
  return cat === 'verdura' || cat === 'verdure';
}

export function calcNutrition(food: Food, grams: number): { kcal: number; protein_g: number; carbs_g: number; fat_g: number } {
  const g = Number(grams);
  if (!g || g <= 0) return { kcal: 0, protein_g: 0, carbs_g: 0, fat_g: 0 };
  const f = g / 100;
  const protein_g = round1(food.protein_per_100g * f);
  const carbs_g = round1(food.carbs_per_100g * f);
  const fat_g = round1(food.fat_per_100g * f);
  const kcal = Math.round(protein_g * KCAL_PER_G.protein + carbs_g * KCAL_PER_G.carbs + fat_g * KCAL_PER_G.fat);
  return { kcal, protein_g, carbs_g, fat_g };
}

/** Small Gauss-Jordan on an n×n system (destructive on a copy). */
function gaussJordan(A: number[][], b: number[]): number[] {
  const n = A.length;
  if (n === 0) return [];
  const M: number[][] = A.map((row, i) => [...row, b[i] ?? 0]);
  for (let col = 0; col < n; col++) {
    let pivRow = col;
    for (let row = col + 1; row < n; row++) {
      if (Math.abs(M[row]![col]!) > Math.abs(M[pivRow]![col]!)) pivRow = row;
    }
    [M[col], M[pivRow]] = [M[pivRow]!, M[col]!];
    const pivot = M[col]![col]!;
    if (Math.abs(pivot) < 1e-12) continue;
    for (let k = col; k <= n; k++) M[col]![k] = (M[col]![k] ?? 0) / pivot;
    for (let row = 0; row < n; row++) {
      if (row === col) continue;
      const factor = M[row]![col]!;
      for (let k = col; k <= n; k++) M[row]![k] = (M[row]![k] ?? 0) - factor * (M[col]![k] ?? 0);
    }
  }
  return Array.from({ length: n }, (_, i) => M[i]![n] ?? 0);
}

/**
 * Weighted least-squares grams solver. Iteratively clamps foods that
 * fall below MIN_GRAMS to MIN and re-solves for the rest, then applies
 * a per-category equalisation (so two proteins don't end up 100g vs 10g).
 * Returns rounded grams, in the same order as `foods`. Verdure grams are
 * distributed as VERDURE_GRAMS / verdureCount.
 */
export function solveOptimalGrams(
  foods: Food[],
  target: MealTargets,
): number[] {
  const nonVeg = foods.filter((f) => !isVerdura(f));
  const n = nonVeg.length;
  const veg = foods.filter(isVerdura);
  const vegGrams = veg.length > 0 ? Math.round(VERDURE_GRAMS / veg.length) : VERDURE_GRAMS;

  if (n === 0 || target.kcal <= 0) {
    return foods.map((f) => (isVerdura(f) ? vegGrams : MIN_GRAMS));
  }

  const cols = nonVeg.map((f) => [
    (f.protein_per_100g * KCAL_PER_G.protein + f.carbs_per_100g * KCAL_PER_G.carbs + f.fat_per_100g * KCAL_PER_G.fat) / 100,
    f.protein_per_100g / 100,
    f.carbs_per_100g / 100,
    f.fat_per_100g / 100,
  ]);

  const t = [target.kcal, target.protein_g, target.carbs_g, target.fat_g];
  const W = [2, 5, 1, 3];

  const buildSystem = (freeIdx: number[]) => {
    const nf = freeIdx.length;
    const G = Array.from({ length: nf }, (_, r) =>
      Array.from({ length: nf }, (_, c) =>
        W.reduce((s, wk, k) => s + wk * cols[freeIdx[r]!]![k]! * cols[freeIdx[c]!]![k]!, 0),
      ),
    );
    const fixed = Array.from({ length: n }, (_, i) => i).filter((i) => !freeIdx.includes(i));
    const bAdj = t.map((tk, k) => tk - fixed.reduce((s, j) => s + MIN_GRAMS * cols[j]![k]!, 0));
    const rhs = Array.from({ length: nf }, (_, r) =>
      W.reduce((s, wk, k) => s + wk * cols[freeIdx[r]!]![k]! * bAdj[k]!, 0),
    );
    return { G, rhs };
  };

  let freeIdx = Array.from({ length: n }, (_, i) => i);
  let g = new Array<number>(n).fill(0);

  for (let attempt = 0; attempt <= n; attempt++) {
    if (freeIdx.length === 0) break;
    const { G, rhs } = buildSystem(freeIdx);
    const gFree = gaussJordan(G, rhs);
    freeIdx.forEach((fi, r) => { g[fi] = gFree[r] ?? 0; });
    const belowIdx = freeIdx.findIndex((_, r) => (gFree[r] ?? 0) < MIN_GRAMS);
    if (belowIdx === -1) break;
    g[freeIdx[belowIdx]!] = MIN_GRAMS;
    freeIdx = freeIdx.filter((_, r) => r !== belowIdx);
  }

  g = g.map((gi) => Math.max(MIN_GRAMS, gi));

  // Equalise within same-category groups
  const catGroups: Record<string, number[]> = {};
  nonVeg.forEach((f, i) => {
    const cat = (f as { category?: string }).category ?? 'unknown';
    if (!catGroups[cat]) catGroups[cat] = [];
    catGroups[cat]!.push(i);
  });
  for (const indices of Object.values(catGroups)) {
    if (indices.length < 2) continue;
    const total = indices.reduce((s, i) => s + (g[i] ?? 0), 0);
    const equal = Math.max(MIN_GRAMS, total / indices.length);
    for (const i of indices) g[i] = equal;
  }

  // Scale so total kcal matches target (best-effort)
  const totKcal = g.reduce((s, gi, i) => s + gi * cols[i]![0]!, 0);
  if (totKcal > 0) g = g.map((gi, i) => Math.max(MIN_GRAMS, (gi * target.kcal) / totKcal));

  const rounded = g.map((gi) => Math.max(MIN_GRAMS, Math.round(gi)));

  let nvIdx = 0;
  return foods.map((f) => (isVerdura(f) ? vegGrams : rounded[nvIdx++]!));
}

function round1(n: number): number { return Math.round(n * 10) / 10; }
