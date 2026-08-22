import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { weekAggregatedByFood } from '@vatia/diet-engine';
import { useLocale } from '../i18n/LocaleContext.tsx';
import { usePlan } from '../state/PlanContext.tsx';
import { downloadText } from '../lib/csv.ts';

export function ShoppingPage() {
  const { t } = useLocale();
  const { weekPlan } = usePlan();
  const navigate = useNavigate();

  const rows = useMemo(() => weekAggregatedByFood(weekPlan), [weekPlan]);

  function exportCsv() {
    const header = 'food,total_grams,kcal_per_100g,protein_per_100g,carbs_per_100g,fat_per_100g\n';
    const body = rows
      .map((r) => [csvEscape(r.food.name), r.grams, r.food.kcal_per_100g, r.food.protein_per_100g, r.food.carbs_per_100g, r.food.fat_per_100g].join(','))
      .join('\n');
    downloadText('vatia-shopping.csv', header + body);
  }

  return (
    <div className="stack">
      <span className="eyebrow">{t('nav.week')}</span>
      <h1>{t('shopping.title')}</h1>
      <p className="lede">{t('shopping.subtitle')}</p>

      {rows.length === 0 ? (
        <p className="small">{t('shopping.empty')}</p>
      ) : (
        <ul className="meal-items">
          {rows.map((r) => (
            <li key={r.food.id}>
              <span>{r.food.name}</span>
              <span className="mono">{Math.round(r.grams)} g</span>
            </li>
          ))}
        </ul>
      )}

      <div className="btn-row">
        <button type="button" className="link" onClick={() => navigate('/piano')}>← {t('nav.week')}</button>
        <div className="right">
          <button type="button" onClick={exportCsv} disabled={rows.length === 0}>{t('shopping.export')}</button>
        </div>
      </div>
    </div>
  );
}

function csvEscape(v: string): string {
  if (/[",\n]/.test(v)) return `"${v.replace(/"/g, '""')}"`;
  return v;
}
