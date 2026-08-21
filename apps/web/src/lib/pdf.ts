import type { AllocationResult, MealKey, MealTarget } from '@vatia/diet-engine';

/**
 * Opens a printable HTML page in a new window; the user picks
 * "Save as PDF" from the browser's print dialog. This avoids pulling
 * in jsPDF (~100kB) for a feature that browsers do natively.
 */
export function openPlanPrintView(
  meal: MealKey,
  target: MealTarget,
  result: AllocationResult,
  labels: { title: string; target: string; actual: string; deviation: string; footer: string },
) {
  const w = window.open('', '_blank', 'noopener,noreferrer');
  if (!w) return;
  const rows = result.items
    .map(
      (it) => `
      <tr>
        <td>${escapeHtml(it.food.name)}</td>
        <td>${it.role}</td>
        <td style="text-align:right">${it.grams} g</td>
      </tr>`,
    )
    .join('');

  const dev = result.deviation_pct;
  w.document.write(`<!doctype html>
<html><head><meta charset="utf-8"><title>${escapeHtml(labels.title)} · ${meal}</title>
<style>
  body { font: 15px -apple-system, sans-serif; color: #1c1c1c; margin: 40px; max-width: 640px; }
  h1 { font-size: 20px; margin: 0 0 4px; }
  .muted { color: #57544b; margin-bottom: 24px; }
  table { border-collapse: collapse; width: 100%; margin: 16px 0; }
  td, th { padding: 6px 8px; border-bottom: 1px solid #e0dbcf; text-align: left; }
  .row { display: flex; gap: 24px; }
  .row div { border: 1px solid #e0dbcf; padding: 8px 10px; border-radius: 4px; flex: 1; }
  strong { display: block; font-size: 16px; }
  small { color: #57544b; }
  @media print { body { margin: 20mm; } button { display: none; } }
</style></head>
<body>
  <h1>${escapeHtml(labels.title)} · ${escapeHtml(meal)}</h1>
  <p class="muted">Vatia · portfolio rebuild — not a medical device</p>
  <table>
    <thead><tr><th>Alimento / Food</th><th>Ruolo</th><th style="text-align:right">Grammi</th></tr></thead>
    <tbody>${rows}</tbody>
  </table>
  <div class="row">
    <div><small>${escapeHtml(labels.target)}</small><strong>${target.kcal.toFixed(0)} kcal</strong>
      P ${target.protein_g} · C ${target.carbs_g} · F ${target.fat_g}</div>
    <div><small>${escapeHtml(labels.actual)}</small><strong>${result.totals.kcal.toFixed(0)} kcal</strong>
      P ${result.totals.protein_g} · C ${result.totals.carbs_g} · F ${result.totals.fat_g}</div>
    <div><small>${escapeHtml(labels.deviation)}</small>
      kcal ${dev.kcal}% · P ${dev.protein}% · C ${dev.carbs}% · F ${dev.fat}%</div>
  </div>
  <p class="muted" style="margin-top:32px;font-size:13px">${escapeHtml(labels.footer)}</p>
  <button onclick="window.print()">Print / Save as PDF</button>
</body></html>`);
  w.document.close();
  w.focus();
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[c] as string);
}
