/** Un chilo di grasso corrisponde a circa 7 700 kcal — la stessa costante usata nel resto dell'app. */
export const KCAL_PER_KG = 7700;

export interface WeightEntry {
  /** ISO date, es. `2026-09-15`. */
  date: string;
  kg: number;
}

export interface TdeeRecalibration {
  /** TDEE stimato dal peso reale, invece che dalla formula. */
  realTdee: number;
  predictedLossKg: number;
  realLossKg: number;
  days: number;
}

function daysBetween(a: string, b: string): number {
  return Math.round((new Date(b).getTime() - new Date(a).getTime()) / 86_400_000);
}

/**
 * Confronta quanto la formula prevedeva perdere con quanto è stato perso
 * davvero, e ne deriva un TDEE più vicino alla realtà. Richiede almeno
 * due pesate a più di una settimana di distanza: sotto quella soglia il
 * rumore giorno-per-giorno (acqua, digestione) rende il confronto inutile.
 */
export function recalibrateTdee(
  entries: WeightEntry[],
  formulaTdee: number,
  targetKcal: number,
): TdeeRecalibration | null {
  if (entries.length < 2) return null;
  const sorted = [...entries].sort((a, b) => a.date.localeCompare(b.date));
  const first = sorted[0]!;
  const last = sorted[sorted.length - 1]!;
  const days = daysBetween(first.date, last.date);
  if (days < 7) return null;

  const dailyDeficit = formulaTdee - targetKcal;
  const predictedLossKg = (dailyDeficit * days) / KCAL_PER_KG;
  const realLossKg = first.kg - last.kg;
  const realDailyDeficitKcal = (realLossKg / days) * KCAL_PER_KG;
  const realTdee = Math.round(targetKcal + realDailyDeficitKcal);

  return { realTdee, predictedLossKg, realLossKg, days };
}
