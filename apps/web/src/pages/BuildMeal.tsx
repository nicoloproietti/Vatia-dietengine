import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  DEFAULT_MEAL_NAMES,
  computeDailyTargets,
  computeItemNutrition,
  mealTargetsFor,
  sumTotals,
  type Food,
  type MealItem,
  type SavedMeal,
} from '@vatia/diet-engine';
import { useLocale } from '../i18n/LocaleContext.tsx';
import { useProfile } from '../state/ProfileContext.tsx';
import { usePlan } from '../state/PlanContext.tsx';
import { supabase, type FoodRow } from '../lib/supabaseClient.ts';
import { toEngineFood } from '../lib/foods.ts';

export function BuildMealPage() {
  const { t } = useLocale();
  const { profile } = useProfile();
  const { mealCount, distribution, weekPlan, saveMeal } = usePlan();
  const navigate = useNavigate();
  const params = useParams();

  const dayIdx = Number(params.day);
  const mealIdx = Number(params.meal);

  if (!profile) { navigate('/profile'); return null; }
  if (!Number.isFinite(dayIdx) || !Number.isFinite(mealIdx)) { navigate('/week'); return null; }

  const daily = useMemo(() => computeDailyTargets(profile), [profile]);
  const target = useMemo(() => mealTargetsFor(daily, distribution, mealIdx), [daily, distribution, mealIdx]);
  const names = DEFAULT_MEAL_NAMES[mealCount] ?? DEFAULT_MEAL_NAMES[3]!;

  const existing: SavedMeal | undefined = weekPlan[dayIdx]?.[mealIdx];
  const [items, setItems] = useState<MealItem[]>(existing?.items ?? []);
  const [q, setQ] = useState('');
  const [results, setResults] = useState<Food[]>([]);
  const [loading, setLoading] = useState(false);

  const totals = useMemo(() => sumTotals(items), [items]);

  // Debounced search on foods.name.ilike
  useEffect(() => {
    const term = q.trim();
    if (term.length < 2) { setResults([]); return; }
    let cancelled = false;
    setLoading(true);
    const timer = setTimeout(async () => {
      const excludes = profile.excludes;
      let query = supabase
        .from('foods')
        .select('id,name,category,macro_category,kcal,protein,carbs,fat,usable_for_meal_generator')
        .eq('usable_for_meal_generator', true)
        .ilike('name', `%${term}%`)
        .order('name')
        .limit(30);
      const { data, error } = await query;
      if (cancelled) return;
      setLoading(false);
      if (error) { setResults([]); return; }
      let rows = ((data ?? []) as FoodRow[]).map(toEngineFood);
      if (excludes.length) {
        rows = rows.filter((r) => !excludes.some((e) => r.name.toLowerCase().includes(e.toLowerCase())));
      }
      setResults(rows);
    }, 220);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [q, profile]);

  function addFood(food: Food, grams: number) {
    if (!grams || grams <= 0) return;
    // Merge if already present
    const idx = items.findIndex((it) => it.food.id === food.id);
    if (idx >= 0) {
      const next = [...items];
      const merged = next[idx]!.grams + grams;
      next[idx] = { food, grams: merged, nutrition: computeItemNutrition(food, merged) };
      setItems(next);
    } else {
      setItems([...items, { food, grams, nutrition: computeItemNutrition(food, grams) }]);
    }
    setQ(''); setResults([]);
  }

  function updateGrams(idx: number, grams: number) {
    setItems((prev) => prev.map((it, i) =>
      i === idx ? { ...it, grams, nutrition: computeItemNutrition(it.food, grams) } : it,
    ));
  }
  function remove(idx: number) {
    setItems((prev) => prev.filter((_, i) => i !== idx));
  }

  function save() {
    const meal: SavedMeal = {
      items,
      totals: sumTotals(items),
      updated_at: new Date().toISOString(),
    };
    saveMeal(dayIdx, mealIdx, meal);
    navigate('/week');
  }

  return (
    <div className="stack">
      <span className="eyebrow">{t('nav.week')} · {names[mealIdx]}</span>
      <h1>{t('builder.title')}</h1>

      <div className="bar-stack">
        <Bar label="kcal" value={totals.kcal} target={target.kcal} />
        <Bar label="Proteine" value={totals.protein_g} target={target.protein_g} unit="g" />
        <Bar label="Carboidrati" value={totals.carbs_g} target={target.carbs_g} unit="g" />
        <Bar label="Grassi" value={totals.fat_g} target={target.fat_g} unit="g" />
      </div>

      {/* Search */}
      <div style={{ marginTop: 24 }}>
        <label>
          <span className="label-text">Cerca alimento</span>
          <input
            type="text"
            placeholder={t('builder.searchPlaceholder')}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            autoFocus
          />
        </label>
        {loading && <p className="small">…</p>}
        {results.length > 0 && (
          <ul className="search-results">
            {results.map((f) => <SearchResultRow key={f.id} food={f} onAdd={addFood} />)}
          </ul>
        )}
      </div>

      {/* Items */}
      <section style={{ marginTop: 24 }}>
        <div className="wizard-step-meta">
          <span>Alimenti nel pasto</span>
          <span className="mono">{items.length}</span>
        </div>
        {items.length === 0 ? (
          <p className="small">{t('builder.empty')}</p>
        ) : (
          <ul className="meal-items editable">
            {items.map((it, i) => (
              <li key={i} className="meal-item-row">
                <span className="item-name">{it.food.name}</span>
                <input
                  className="mono item-grams"
                  type="number" min={5} max={1000}
                  value={it.grams}
                  onChange={(e) => updateGrams(i, Number(e.target.value))}
                />
                <span className="mono small">
                  {it.nutrition.kcal} kcal · P{it.nutrition.protein_g} C{it.nutrition.carbs_g} F{it.nutrition.fat_g}
                </span>
                <button type="button" className="ghost" onClick={() => remove(i)}>{t('builder.remove')}</button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <div className="btn-row">
        <button type="button" className="link" onClick={() => navigate('/week')}>← {t('builder.cancel')}</button>
        <div className="right">
          <button type="button" onClick={save} disabled={items.length === 0}>{t('builder.save')}</button>
        </div>
      </div>
    </div>
  );
}

function SearchResultRow({ food, onAdd }: { food: Food; onAdd: (f: Food, g: number) => void }) {
  const [g, setG] = useState<number>(100);
  return (
    <li className="search-result">
      <div className="search-result-main">
        <span className="item-name">{food.name}</span>
        <span className="small mono">{food.kcal_per_100g} kcal · P{food.protein_per_100g} C{food.carbs_per_100g} F{food.fat_per_100g} / 100g</span>
      </div>
      <input className="mono grams-mini" type="number" min={5} max={1000} value={g}
             onChange={(e) => setG(Number(e.target.value))} />
      <button type="button" className="secondary" onClick={() => onAdd(food, g)}>+</button>
    </li>
  );
}

function Bar({ label, value, target, unit }: { label: string; value: number; target: number; unit?: string }) {
  const pct = target > 0 ? (value / target) * 100 : 0;
  const clamped = Math.min(100, pct);
  const over = pct > 105;
  return (
    <div className="bar-row">
      <span className="bar-label">{label}</span>
      <span className="bar-track">
        <span className={`bar-fill ${over ? 'is-over' : ''}`} style={{ width: `${clamped}%` }} />
      </span>
      <span className="bar-value mono">
        {Math.round(value)}{unit ?? ''} <span style={{ color: 'var(--ink-3)' }}>/ {Math.round(target)}{unit ?? ''}</span>
      </span>
    </div>
  );
}
