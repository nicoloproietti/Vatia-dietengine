import type { StoredProfile } from '../state/ProfileContext.tsx';
import type { AllocationResult, MealTarget } from '@vatia/diet-engine';

const PROFILE_FIELDS = [
  'sex',
  'age',
  'weight_kg',
  'height_cm',
  'activity',
  'protein_g_per_kg',
  'fat_pct_kcal',
  'excludes',
] as const;

export function profileToCsv(p: StoredProfile): string {
  const value = (k: (typeof PROFILE_FIELDS)[number]): string => {
    const v = (p as unknown as Record<string, unknown>)[k];
    if (v == null) return '';
    if (Array.isArray(v)) return v.join('|');
    return String(v);
  };
  const header = PROFILE_FIELDS.join(',');
  const row = PROFILE_FIELDS.map((k) => csvEscape(value(k))).join(',');
  return `${header}\n${row}\n`;
}

export function csvToProfile(csv: string): StoredProfile {
  const lines = csv.trim().split(/\r?\n/);
  if (lines.length < 2) throw new Error('CSV vuoto');
  const header = splitCsvLine(lines[0]!);
  const row = splitCsvLine(lines[1]!);
  const map: Record<string, string> = {};
  header.forEach((h, i) => (map[h] = row[i] ?? ''));

  return {
    sex: map.sex === 'female' ? 'female' : 'male',
    age: Number(map.age),
    weight_kg: Number(map.weight_kg),
    height_cm: Number(map.height_cm),
    activity: (map.activity as StoredProfile['activity']) || 'moderate',
    ...(map.protein_g_per_kg ? { protein_g_per_kg: Number(map.protein_g_per_kg) } : {}),
    ...(map.fat_pct_kcal ? { fat_pct_kcal: Number(map.fat_pct_kcal) } : {}),
    excludes: map.excludes ? map.excludes.split('|').filter(Boolean) : [],
  };
}

export function planToCsv(
  target: MealTarget,
  result: AllocationResult,
): string {
  const header = 'food,role,grams,kcal_per_100g,protein_per_100g,carbs_per_100g,fat_per_100g\n';
  const rows = result.items
    .map((it) =>
      [
        csvEscape(it.food.name),
        it.role,
        it.grams,
        it.food.kcal_per_100g,
        it.food.protein_per_100g,
        it.food.carbs_per_100g,
        it.food.fat_per_100g,
      ].join(','),
    )
    .join('\n');
  const totals = `\ntotals,,${result.totals.kcal},protein_g=${result.totals.protein_g},carbs_g=${result.totals.carbs_g},fat_g=${result.totals.fat_g}\n`;
  const targets = `target,,${target.kcal},protein_g=${target.protein_g},carbs_g=${target.carbs_g},fat_g=${target.fat_g}\n`;
  return header + rows + totals + targets;
}

export function downloadText(filename: string, content: string, mime = 'text/csv') {
  const blob = new Blob([content], { type: `${mime};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 0);
}

function csvEscape(v: string): string {
  if (/[",\n]/.test(v)) return `"${v.replace(/"/g, '""')}"`;
  return v;
}

function splitCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = '';
  let inQ = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (inQ) {
      if (c === '"' && line[i + 1] === '"') { cur += '"'; i++; }
      else if (c === '"') inQ = false;
      else cur += c;
    } else {
      if (c === ',') { out.push(cur); cur = ''; }
      else if (c === '"') inQ = true;
      else cur += c;
    }
  }
  out.push(cur);
  return out;
}
