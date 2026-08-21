import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  allocateMeal,
  computeDailyTargets,
  DEFAULT_MEAL_SPLIT,
  splitDailyIntoMeals,
} from '@vatia/diet-engine';
import type {
  AllocationResult,
  Food,
  MealKey,
  MealSelection,
  MealTarget,
} from '@vatia/diet-engine';
import { useLocale } from '../i18n/LocaleContext.tsx';
import { useProfile } from '../state/ProfileContext.tsx';
import { supabase } from '../lib/supabaseClient.ts';
import type { FoodRow, SeasonalityInfo } from '../lib/supabaseClient.ts';
import { fetchSeasonality, toEngineFood } from '../lib/foods.ts';
import { downloadText, planToCsv } from '../lib/csv.ts';
import { openPlanPrintView } from '../lib/pdf.ts';

interface StoredPick {
  meal: MealKey;
  selection: { protein: string; carb: string; veg: string; fat: string | null };
}

export function PlanResultPage() {
  const { t } = useLocale();
  const { profile } = useProfile();
  const navigate = useNavigate();

  const [pick, setPick] = useState<StoredPick | null>(null);
  const [selection, setSelection] = useState<MealSelection | null>(null);
  const [seasonality, setSeasonality] = useState<Record<string, SeasonalityInfo | null>>({});
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const raw = sessionStorage.getItem('vatia:mealPick:v1');
    if (!raw || !profile) { navigate('/meal'); return; }
    const parsed = JSON.parse(raw) as StoredPick;
    setPick(parsed);

    const ids = [parsed.selection.protein, parsed.selection.carb, parsed.selection.veg];
    if (parsed.selection.fat) ids.push(parsed.selection.fat);

    supabase
      .from('foods')
      .select('id,name,category,macro_category,kcal,protein,carbs,fat,usable_for_meal_generator')
      .in('id', ids)
      .then(({ data, error: e }) => {
        if (e) { setError(e.message); return; }
        const rows = (data ?? []) as FoodRow[];
        const byId: Record<string, Food> = {};
        rows.forEach((r) => (byId[r.id] = toEngineFood(r)));
        const sel: MealSelection = {
          protein: byId[parsed.selection.protein]!,
          carb: byId[parsed.selection.carb]!,
          veg: byId[parsed.selection.veg]!,
          ...(parsed.selection.fat && byId[parsed.selection.fat]
            ? { fat: byId[parsed.selection.fat] }
            : {}),
        };
        setSelection(sel);
        Promise.all(ids.map((id) => fetchSeasonality(id).then((s) => [id, s] as const)))
          .then((entries) => setSeasonality(Object.fromEntries(entries)))
          .catch(() => { /* seasonality is optional */ });
      });
  }, [profile, navigate]);

  const { target, result } = useMemo(() => {
    if (!profile || !pick || !selection) {
      return { target: null as MealTarget | null, result: null as AllocationResult | null };
    }
    const daily = computeDailyTargets(profile);
    const meals = splitDailyIntoMeals(daily, DEFAULT_MEAL_SPLIT);
    const target = meals[pick.meal];
    return { target, result: allocateMeal(target, selection) };
  }, [profile, pick, selection]);

  if (error) return <p className="small" style={{ color: 'var(--danger)' }}>{error}</p>;
  if (!pick || !selection || !target || !result) return <p className="small">…</p>;

  return (
    <div className="stack">
      <h1>{t('plan.title')} · {t(`meal.${pick.meal}`)}</h1>

      <div className="card">
        <div className="macro-row">
          <div><small>{t('plan.target')}</small><strong>{target.kcal.toFixed(0)} kcal</strong>
            P {target.protein_g} · C {target.carbs_g} · F {target.fat_g}</div>
          <div><small>{t('plan.actual')}</small><strong>{result.totals.kcal.toFixed(0)} kcal</strong>
            P {result.totals.protein_g} · C {result.totals.carbs_g} · F {result.totals.fat_g}</div>
          <div><small>{t('plan.deviation')}</small>
            kcal {result.deviation_pct.kcal}% · P {result.deviation_pct.protein}%
            · C {result.deviation_pct.carbs}% · F {result.deviation_pct.fat}%</div>
          <div><small>Sc/Km0</small>
            <strong>
              {Object.values(seasonality).filter((s) => s?.is_in_season).length}·
              {Object.values(seasonality).filter((s) => s?.is_local).length}
            </strong>
          </div>
        </div>
      </div>

      {result.items.map((it) => {
        const s = seasonality[it.food.id] ?? null;
        return (
          <div key={it.food.id} className="card">
            <h3>{it.food.name}</h3>
            <p className="small" style={{ margin: '0 0 0.5rem' }}>
              <strong>{it.grams} g</strong> · {it.role}
              {s?.is_in_season && <span className="badge in-season">{t('plan.badge.in_season')}</span>}
              {s?.is_local && <span className="badge km0">{t('plan.badge.km0')}</span>}
            </p>
            <p className="small" style={{ margin: 0 }}>
              per 100g · {it.food.kcal_per_100g} kcal ·
              P {it.food.protein_per_100g} / C {it.food.carbs_per_100g} / F {it.food.fat_per_100g}
            </p>
            <p style={{ marginTop: '0.4rem' }}>
              <SubstituteButton foodId={it.food.id} />
            </p>
          </div>
        );
      })}

      <div className="actions-row">
        <button
          type="button"
          onClick={() =>
            openPlanPrintView(pick.meal, target, result, {
              title: t('plan.title'),
              target: t('plan.target'),
              actual: t('plan.actual'),
              deviation: t('plan.deviation'),
              footer: t('footer.rebuild'),
            })
          }
        >
          {t('plan.export_pdf')}
        </button>
        <button
          type="button"
          className="secondary"
          onClick={() =>
            downloadText(`vatia-plan-${pick.meal}.csv`, planToCsv(target, result))
          }
        >
          {t('plan.export_csv')}
        </button>
        <button type="button" className="secondary" onClick={() => navigate('/meal')}>
          {t('plan.back')}
        </button>
      </div>
    </div>
  );
}

function SubstituteButton({ foodId }: { foodId: string }) {
  const { t } = useLocale();
  const [loading, setLoading] = useState(false);
  const [suggestion, setSuggestion] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function ask() {
    setLoading(true); setError(null); setSuggestion(null);
    try {
      const { data, error: e } = await supabase.functions.invoke('substitute-food', {
        body: { food_id: foodId },
      });
      if (e) throw e;
      const payload = data as { suggestion?: { name: string; reason?: string } } | null;
      if (!payload?.suggestion) throw new Error(t('error.generic'));
      setSuggestion(
        payload.suggestion.name +
          (payload.suggestion.reason ? ` — ${payload.suggestion.reason}` : ''),
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : t('error.generic'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button type="button" className="secondary" onClick={ask} disabled={loading}>
        {t('plan.substitute')}
      </button>
      {suggestion && <span className="small" style={{ marginLeft: '0.6rem' }}>→ {suggestion}</span>}
      {error && <span className="small" style={{ marginLeft: '0.6rem', color: 'var(--danger)' }}>{error}</span>}
    </>
  );
}
