import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  DEFAULT_MEAL_NAMES,
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
import { MacroRing } from '../components/MacroRing.tsx';

const CAT_LABEL: Record<string, string> = {
  cereali: 'Cereali',
  legumi: 'Legumi',
  carne: 'Carne',
  pesce: 'Pesce',
  latticini: 'Latticini',
  uova: 'Uova',
  grassi_condimenti: 'Grassi',
  verdura: 'Verdura',
  frutta: 'Frutta',
  piatti_pronti: 'Piatti pronti',
  dolci_snack: 'Dolci',
  bevande: 'Bevande',
  altro: 'Altro',
};
const CAT_KEY: Record<string, string> = {
  cereali: 'cereali', legumi: 'legumi', carne: 'carne', pesce: 'pesce',
  latticini: 'latticini', uova: 'uova', grassi_condimenti: 'grassi',
  verdura: 'verdura', frutta: 'frutta',
};

type Phase = 'compose' | 'adjust';

export function BuildMealPage() {
  const { t } = useLocale();
  const { profile } = useProfile();
  const { targetKcal, dailyMacroPct, mealCount, distribution, weekPlan, saveMeal } = usePlan();
  const navigate = useNavigate();
  const params = useParams();

  const dayIdx = Number(params.day);
  const mealIdx = Number(params.meal);

  if (!profile) { navigate('/profile'); return null; }
  if (!Number.isFinite(dayIdx) || !Number.isFinite(mealIdx)) { navigate('/week'); return null; }

  const daily = useMemo(() => {
    const base = computeDailyTargets(profile, targetKcal ?? undefined);
    return { ...base, ...dailyMacrosFromPct(base.kcal, dailyMacroPct) };
  }, [profile, targetKcal, dailyMacroPct]);
  const target = useMemo(() => mealTargetsFor(daily, distribution, mealIdx), [daily, distribution, mealIdx]);
  const names = DEFAULT_MEAL_NAMES[mealCount] ?? DEFAULT_MEAL_NAMES[3]!;
  const mealName = names[mealIdx] ?? '—';

  const existing: SavedMeal | undefined = weekPlan[dayIdx]?.[mealIdx];

  const [phase, setPhase] = useState<Phase>(existing ? 'adjust' : 'compose');
  const [selected, setSelected] = useState<Food[]>(existing?.items.map((it) => it.food) ?? []);
  const [items, setItems] = useState<MealItem[]>(existing?.items ?? []);
  const [q, setQ] = useState('');
  const [results, setResults] = useState<Food[]>([]);
  const [loading, setLoading] = useState(false);
  const searchInput = useRef<HTMLInputElement>(null);

  // ── Debounced search on foods.name (Supabase ilike) ─────────────────
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

  // ── Actions ─────────────────────────────────────────────────────────

  function pickFood(food: Food) {
    if (selected.some((f) => f.id === food.id)) return;
    setSelected([...selected, food]);
    setQ(''); setResults([]);
    setTimeout(() => searchInput.current?.focus(), 30);
  }

  function unpick(id: string) {
    setSelected(selected.filter((f) => f.id !== id));
  }

  function calculate() {
    if (selected.length === 0) return;
    const grams = solveOptimalGrams(selected, target);
    const next: MealItem[] = selected.map((food, i) => ({
      food,
      grams: grams[i]!,
      nutrition: calcNutrition(food, grams[i]!),
    }));
    setItems(next);
    setPhase('adjust');
  }

  function updateGrams(idx: number, grams: number) {
    setItems((prev) => prev.map((it, i) =>
      i === idx ? { ...it, grams, nutrition: computeItemNutrition(it.food, grams) } : it,
    ));
  }

  function removeItem(idx: number) {
    setItems((prev) => prev.filter((_, i) => i !== idx));
  }

  function backToCompose() {
    setSelected(items.map((it) => it.food));
    setPhase('compose');
  }

  function save() {
    if (items.length === 0) return;
    const meal: SavedMeal = {
      items,
      totals: sumTotals(items),
      updated_at: new Date().toISOString(),
    };
    saveMeal(dayIdx, mealIdx, meal);
    navigate('/week');
  }

  // Totals — verdure DO count in the totals (unlike the gestionale) since
  // our Supabase data includes reliable macros for them; consistent with
  // the daily-total display on /week.
  const totals = useMemo(() => sumTotals(items), [items]);

  // ── Render ──────────────────────────────────────────────────────────

  return (
    <div>
      <span className="eyebrow">{t('nav.week')} · {mealName}</span>
      <h1>{t('builder.title')}</h1>

      {/* Target strip */}
      <div className="mb-target-strip">
        <span className="label">Target</span>
        <span className="val" style={{ color: 'var(--c-kcal)' }}>{target.kcal} kcal</span>
        <span className="val" style={{ color: 'var(--c-protein)' }}>{target.protein_g}g P</span>
        <span className="val" style={{ color: 'var(--c-carbs)' }}>{target.carbs_g}g C</span>
        <span className="val" style={{ color: 'var(--c-fat)' }}>{target.fat_g}g F</span>
      </div>

      {/* Macro rings — always visible so the target is legible even in compose */}
      <div className="mb-rings">
        <MacroRing label="kcal" value={totals.kcal} target={target.kcal} color="var(--c-kcal)" />
        <MacroRing label="Proteine" value={totals.protein_g} target={target.protein_g} unit="g" color="var(--c-protein)" />
        <MacroRing label="Carbo" value={totals.carbs_g} target={target.carbs_g} unit="g" color="var(--c-carbs)" />
        <MacroRing label="Grassi" value={totals.fat_g} target={target.fat_g} unit="g" color="var(--c-fat)" />
      </div>

      {/* ────── COMPOSE phase ────── */}
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
          {loading && <p className="small">…</p>}
          {results.length > 0 && (
            <div className="mb-results" role="listbox">
              {results.map((f) => <SearchRow key={f.id} food={f} onPick={pickFood} disabled={selected.some((s) => s.id === f.id)} />)}
            </div>
          )}

          {/* Selected list */}
          {selected.length === 0 ? (
            <div className="mb-hint-empty">Aggiungi almeno un alimento per calcolare i grammi.</div>
          ) : (
            <div className="mb-selected">
              {selected.map((f) => (
                <div key={f.id} className="mb-selected-item">
                  <CatChip cat={f.category} />
                  <span className="mb-name">{f.name}</span>
                  <button type="button" className="mb-remove" onClick={() => unpick(f.id)} aria-label="Rimuovi">✕</button>
                </div>
              ))}
            </div>
          )}

          <div className="btn-row">
            <button type="button" className="link" onClick={() => navigate('/week')}>← {t('builder.cancel')}</button>
            <div className="right">
              <button type="button" onClick={calculate} disabled={selected.length === 0}>
                Calcola grammi →
              </button>
            </div>
          </div>
        </section>
      )}

      {/* ────── ADJUST phase ────── */}
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
                  <CatChip cat={it.food.category} />
                  <div>
                    <div className="mb-adjust-name">{it.food.name}</div>
                    <div className="mb-adjust-nutri">
                      {!veg && <span className="c-k">{it.nutrition.kcal} kcal</span>}
                      <span className="c-p">{it.nutrition.protein_g}g P</span>
                      <span className="c-c">{it.nutrition.carbs_g}g C</span>
                      <span className="c-f">{it.nutrition.fat_g}g F</span>
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
              <button type="button" className="secondary" onClick={() => navigate('/week')}>{t('builder.cancel')}</button>
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
          <CatChip cat={food.category} />
          {!veg && (
            <>
              <span>{food.kcal_per_100g} kcal</span>
              <span className="c-p">{food.protein_per_100g}g P</span>
              <span className="c-c">{food.carbs_per_100g}g C</span>
              <span className="c-f">{food.fat_per_100g}g F</span>
              <span style={{ color: 'var(--ink-3)' }}>/ 100g</span>
            </>
          )}
        </span>
      </div>
    </div>
  );
}

function CatChip({ cat }: { cat?: string | undefined }) {
  if (!cat) return null;
  const key = CAT_KEY[cat] ?? 'altro';
  const label = CAT_LABEL[cat] ?? cat;
  return <span className={`cat-chip cat-${key}`}>{label}</span>;
}
