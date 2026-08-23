import { useEffect, useMemo, useRef, useState } from 'react';
import {
  calcNutrition,
  computeDailyTargets,
  computeItemNutrition,
  dailyMacrosFromPct,
  isVerdura,
  mealTargetsFor,
  solveOptimalGrams,
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
import { formatNumber } from '../lib/format.ts';
import { MacroRing } from './MacroRing.tsx';
import { CategoryChip } from './CategoryChip.tsx';
import { EmptyState } from './EmptyState.tsx';

export type BuilderPhase = 'compose' | 'adjust';

interface Props {
  dayIdx: number;
  mealIdx: number;
  /** Called after Save or Cancel — the drawer should close */
  onDone: () => void;
  /** Reported on mount and on every phase change, so the drawer header can show "Fase 1 · scegli" / "Fase 2 · regola". */
  onPhaseChange?: (phase: BuilderPhase) => void;
}

/**
 * The meal builder as a self-contained panel. Rendered inside its own
 * full-screen route (BuildMeal.tsx) — meal construction is the app's
 * main task, so it owns the whole screen rather than an overlay.
 */
export function BuildMealPanel({ dayIdx, mealIdx, onDone, onPhaseChange }: Props) {
  const { t } = useLocale();
  const { profile } = useProfile();
  const { targetKcal, dailyMacroPct, distribution, weekPlan, saveMeal } = usePlan();

  if (!profile) return null;

  const daily = useMemo(() => {
    const base = computeDailyTargets(profile, targetKcal ?? undefined);
    return { ...base, ...dailyMacrosFromPct(base.kcal, dailyMacroPct) };
  }, [profile, targetKcal, dailyMacroPct]);

  const target = useMemo(
    () => mealTargetsFor(daily, distribution, mealIdx),
    [daily, distribution, mealIdx],
  );

  const existing: SavedMeal | undefined = weekPlan[dayIdx]?.[mealIdx];

  const [phase, setPhaseState] = useState<BuilderPhase>(existing ? 'adjust' : 'compose');
  const setPhase = (p: BuilderPhase) => { setPhaseState(p); onPhaseChange?.(p); };
  useEffect(() => { onPhaseChange?.(phase); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const [selected, setSelected] = useState<Food[]>(existing?.items.map((it) => it.food) ?? []);
  const [items, setItems] = useState<MealItem[]>(existing?.items ?? []);
  const [q, setQ] = useState('');
  const [results, setResults] = useState<Food[]>([]);
  const [loading, setLoading] = useState(false);
  const [calculating, setCalculating] = useState(false);
  const searchInput = useRef<HTMLInputElement>(null);

  // Debounced Supabase search
  useEffect(() => {
    if (phase !== 'compose') return;
    const term = q.trim();
    if (term.length < 2) { setResults([]); return; }
    let cancelled = false;
    setLoading(true);
    const timer = setTimeout(async () => {
      const { data, error } = await supabase
        .from('foods')
        .select('id,name,category,macro_category,kcal,protein,carbs,fat,usable_for_meal_generator')
        .eq('usable_for_meal_generator', true)
        .ilike('name', `%${term}%`)
        .order('name')
        .limit(30);
      if (cancelled) return;
      setLoading(false);
      if (error) { setResults([]); return; }
      setResults(((data ?? []) as FoodRow[]).map(toEngineFood));
    }, 200);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [q, phase]);

  function pickFood(food: Food) {
    if (selected.some((f) => f.id === food.id)) return;
    setSelected([...selected, food]);
    setQ(''); setResults([]);
    setTimeout(() => searchInput.current?.focus(), 30);
  }
  function unpick(id: string) { setSelected(selected.filter((f) => f.id !== id)); }

  function calculate() {
    if (selected.length === 0) return;
    setCalculating(true);
    // Synchronous solver, but the explicit state gives the user feedback
    // (per design-system rule: loading is always named in mono, never a
    // bare spinner) even though this resolves almost instantly.
    const grams = solveOptimalGrams(selected, target);
    setItems(selected.map((food, i) => ({
      food, grams: grams[i]!, nutrition: calcNutrition(food, grams[i]!),
    })));
    setCalculating(false);
    setPhase('adjust');
  }

  function updateGrams(idx: number, grams: number) {
    setItems((prev) => prev.map((it, i) =>
      i === idx ? { ...it, grams, nutrition: computeItemNutrition(it.food, grams) } : it,
    ));
  }
  function removeItem(idx: number) { setItems((prev) => prev.filter((_, i) => i !== idx)); }

  function backToCompose() {
    setSelected(items.map((it) => it.food));
    setPhase('compose');
  }

  function save() {
    if (items.length === 0) return;
    saveMeal(dayIdx, mealIdx, {
      items,
      totals: sumTotals(items),
      updated_at: new Date().toISOString(),
    });
    onDone();
  }

  const totals = useMemo(() => sumTotals(items), [items]);

  return (
    <div>
      {/* Target strip */}
      <div className="mb-target-strip" style={{ paddingTop: 0 }}>
        <span className="label">Target</span>
        <span className="val mono" style={{ color: 'var(--c-kcal)' }}>{formatNumber(target.kcal)} kcal</span>
        <span className="val mono" style={{ color: 'var(--c-protein)' }}>{formatNumber(target.protein_g)}g P</span>
        <span className="val mono" style={{ color: 'var(--c-carbs)' }}>{formatNumber(target.carbs_g)}g C</span>
        <span className="val mono" style={{ color: 'var(--c-fat)' }}>{formatNumber(target.fat_g)}g F</span>
      </div>

      {/* Rings */}
      <div className="mb-rings">
        <MacroRing label="kcal" value={totals.kcal} target={target.kcal} color="var(--c-kcal)" />
        <MacroRing label="Proteine" value={totals.protein_g} target={target.protein_g} unit="g" color="var(--c-protein)" />
        <MacroRing label="Carbo" value={totals.carbs_g} target={target.carbs_g} unit="g" color="var(--c-carbs)" />
        <MacroRing label="Grassi" value={totals.fat_g} target={target.fat_g} unit="g" color="var(--c-fat)" />
      </div>

      {phase === 'compose' && (
        <section className="mb-compose">
          <h2>Scegli gli alimenti</h2>
          <div className="mb-search">
            <input
              ref={searchInput}
              type="text"
              placeholder="Cerca alimento…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              autoFocus
            />
            {q && <button type="button" className="mb-search-clear" onClick={() => { setQ(''); setResults([]); }}>✕</button>}
          </div>
          {loading && <p className="small mono">cerco…</p>}
          {results.length > 0 && (
            <div className="mb-results" role="listbox">
              {results.map((f) => (
                <SearchRow key={f.id} food={f} onPick={pickFood} disabled={selected.some((s) => s.id === f.id)} />
              ))}
            </div>
          )}

          {selected.length === 0 ? (
            <EmptyState>Aggiungi almeno un alimento per calcolare i grammi.</EmptyState>
          ) : (
            <div className="mb-selected">
              {selected.map((f) => (
                <div key={f.id} className="mb-selected-item">
                  <CategoryChip cat={f.category} />
                  <span className="mb-name">{f.name}</span>
                  <button type="button" className="mb-remove" onClick={() => unpick(f.id)} aria-label="Rimuovi">✕</button>
                </div>
              ))}
            </div>
          )}

          <div className="btn-row">
            <button type="button" className="link" onClick={onDone}>← {t('builder.cancel')}</button>
            <div className="right">
              <button type="button" onClick={calculate} disabled={selected.length === 0 || calculating}>
                {calculating ? 'calcolo…' : 'Calcola i grammi →'}
              </button>
            </div>
          </div>
        </section>
      )}

      {phase === 'adjust' && (
        <section>
          <h2 style={{ fontSize: 16, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            Regola le quantità
          </h2>
          <div className="mb-adjust">
            {items.map((it, i) => {
              const veg = isVerdura(it.food);
              return (
                <div key={it.food.id} className="mb-adjust-row">
                  <CategoryChip cat={it.food.category} />
                  <div>
                    <div className="mb-adjust-name">{it.food.name}</div>
                    <div className="mb-adjust-nutri">
                      {!veg && <span className="c-k">{formatNumber(it.nutrition.kcal)} kcal</span>}
                      <span className="c-p">{formatNumber(it.nutrition.protein_g, 1)}g P</span>
                      <span className="c-c">{formatNumber(it.nutrition.carbs_g, 1)}g C</span>
                      <span className="c-f">{formatNumber(it.nutrition.fat_g, 1)}g F</span>
                    </div>
                  </div>
                  <input
                    className="mb-grams"
                    type="number" min={5} max={1000}
                    value={it.grams}
                    onChange={(e) => updateGrams(i, Number(e.target.value))}
                    aria-label={`Grammi di ${it.food.name}`}
                  />
                  <button type="button" className="mb-remove" onClick={() => removeItem(i)} aria-label={t('builder.remove')}>✕</button>
                </div>
              );
            })}
          </div>

          <div className="btn-row">
            <button type="button" className="link" onClick={backToCompose}>← Aggiungi altri alimenti</button>
            <div className="right">
              <button type="button" className="secondary" onClick={onDone}>{t('builder.cancel')}</button>
              <button type="button" onClick={save}>{t('builder.save')}</button>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

function SearchRow({ food, onPick, disabled }: { food: Food; onPick: (f: Food) => void; disabled: boolean }) {
  const veg = isVerdura(food);
  return (
    <div
      className="mb-result-row"
      role="option"
      aria-selected={disabled}
      style={disabled ? { opacity: 0.4, cursor: 'not-allowed' } : undefined}
      onClick={() => !disabled && onPick(food)}
    >
      <div className="mb-result-left">
        <span className="mb-result-name">{food.name}</span>
        <span className="mb-result-meta">
          <CategoryChip cat={food.category} />
          {!veg && (
            <>
              <span>{formatNumber(food.kcal_per_100g)} kcal</span>
              <span className="c-p">P {formatNumber(food.protein_per_100g, 1)}</span>
              <span className="c-c">C {formatNumber(food.carbs_per_100g, 1)}</span>
              <span className="c-f">G {formatNumber(food.fat_per_100g, 1)}</span>
            </>
          )}
        </span>
      </div>
    </div>
  );
}
