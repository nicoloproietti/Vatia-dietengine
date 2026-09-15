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
import { useFoods } from '../state/FoodsContext.tsx';
import { AddFoodForm } from './AddFoodForm.tsx';
import { SubstituteSheet } from './SubstituteSheet.tsx';
import { formatNumber } from '../lib/format.ts';
import { MacroRing } from './MacroRing.tsx';
import { CAT_LABEL, CategoryChip } from './CategoryChip.tsx';
import { EmptyState } from './EmptyState.tsx';
import { IconSearch } from './Icons.tsx';

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
  const { search } = useFoods();

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
  const [calculating, setCalculating] = useState(false);
  const [addingFood, setAddingFood] = useState(false);
  const [catFilter, setCatFilter] = useState<string | null>(null);
  const [substituteIdx, setSubstituteIdx] = useState<number | null>(null);
  const searchInput = useRef<HTMLInputElement>(null);

  // Ricerca nel database locale: nessuna rete, nessuna attesa
  useEffect(() => {
    if (phase !== 'compose') { setResults([]); return; }
    setResults(search(q));
  }, [q, phase, search]);

  // I chip di categoria si costruiscono da quello che la ricerca ha
  // davvero trovato — mai una lista fissa che potrebbe filtrare a vuoto.
  const categorieTrovate = useMemo(() => {
    const seen = new Map<string, number>();
    for (const f of results) {
      if (!f.category) continue;
      seen.set(f.category, (seen.get(f.category) ?? 0) + 1);
    }
    return [...seen.keys()].sort((a, b) => (seen.get(b) ?? 0) - (seen.get(a) ?? 0));
  }, [results]);
  useEffect(() => { setCatFilter(null); }, [q]);
  const resultsFiltrati = catFilter ? results.filter((f) => f.category === catFilter) : results;

  function pickFood(food: Food) {
    if (selected.some((f) => f.id === food.id)) { unpick(food.id); return; }
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

  function ricalcola() {
    const foods = items.map((it) => it.food);
    const grammi = solveOptimalGrams(foods, target);
    setItems(foods.map((food, i) => ({ food, grams: grammi[i]!, nutrition: calcNutrition(food, grammi[i]!) })));
  }

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
            <span className="mb-search-icon"><IconSearch /></span>
            <input
              ref={searchInput}
              type="text"
              placeholder="Cerca alimento…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
            {q && <button type="button" className="mb-search-clear" onClick={() => { setQ(''); setResults([]); }}>✕</button>}
          </div>
          {q.trim().length >= 2 && results.length === 0 && !addingFood && (
            <div className="mb-noresult">
              <p className="small">Nessun alimento trovato per «{q.trim()}».</p>
              <button type="button" className="secondary" onClick={() => setAddingFood(true)}>
                Aggiungilo tu
              </button>
            </div>
          )}

          {addingFood && (
            <AddFoodForm
              initialName={q.trim()}
              onAdded={(food) => { setAddingFood(false); pickFood(food); }}
              onCancel={() => setAddingFood(false)}
            />
          )}
          {categorieTrovate.length > 0 && (
            <div className="mb-chips">
              <button
                type="button"
                className={`mb-chip ${catFilter === null ? 'is-active' : ''}`}
                onClick={() => setCatFilter(null)}
              >
                Tutti
              </button>
              {categorieTrovate.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  className={`mb-chip ${catFilter === cat ? 'is-active' : ''}`}
                  onClick={() => setCatFilter(cat)}
                >
                  {CAT_LABEL[cat] ?? cat}
                </button>
              ))}
            </div>
          )}
          {results.length > 0 && (
            <div className="mb-results" role="listbox">
              {resultsFiltrati.map((f) => (
                <SearchRow key={f.id} food={f} onPick={pickFood} selected={selected.some((s) => s.id === f.id)} />
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
            <button type="button" className="link" onClick={onDone}>{t('builder.cancel')}</button>
            <div className="right">
              <button type="button" onClick={calculate} disabled={selected.length === 0 || calculating}>
                {calculating ? 'calcolo…' : 'Calcola i grammi'}
              </button>
            </div>
          </div>
        </section>
      )}

      {phase === 'adjust' && (
        <section>
          <h2 className="mb-section-title">Regola le quantità</h2>
          <div className="mb-adjust">
            {items.map((it, i) => {
              const veg = isVerdura(it.food);
              return (
                <div key={it.food.id} className="mb-adjust-row">
                  <button
                    type="button"
                    className="mb-adjust-main"
                    onClick={() => setSubstituteIdx(i)}
                    aria-label={`Sostituisci ${it.food.name}`}
                  >
                    <div className="mb-adjust-name">{it.food.name}</div>
                    <div className="mb-adjust-nutri">
                      <CategoryChip cat={it.food.category} />
                      {!veg && <span className="c-k">{formatNumber(it.nutrition.kcal)} kcal</span>}
                      <span className="c-p">{formatNumber(it.nutrition.protein_g, 1)}g P</span>
                      <span className="c-c">{formatNumber(it.nutrition.carbs_g, 1)}g C</span>
                      <span className="c-f">{formatNumber(it.nutrition.fat_g, 1)}g F</span>
                    </div>
                  </button>
                  <div className="mb-adjust-controls">
                    <span className="mb-stepper">
                      <button
                        type="button" className="mb-stepper-btn"
                        onClick={() => updateGrams(i, Math.max(0, it.grams - 5))}
                        aria-label={`Togli 5 g di ${it.food.name}`}
                      >−</button>
                      <input
                        className="mb-stepper-val"
                        type="number" min={0} max={1000}
                        value={it.grams}
                        onChange={(e) => updateGrams(i, Number(e.target.value))}
                        aria-label={`Grammi di ${it.food.name}`}
                      />
                      <button
                        type="button" className="mb-stepper-btn"
                        onClick={() => updateGrams(i, it.grams + 5)}
                        aria-label={`Aggiungi 5 g di ${it.food.name}`}
                      >+</button>
                    </span>
                    <button type="button" className="mb-remove" onClick={() => removeItem(i)} aria-label={t('builder.remove')}>✕</button>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="sub-links">
            <button type="button" className="link" onClick={ricalcola}>Ricalcola con il solver</button>
            <span className="small">Tocca il nome di un alimento per sostituirlo</span>
          </div>

          <div className="btn-row">
            <button type="button" className="link" onClick={backToCompose}>Aggiungi altri alimenti</button>
            <div className="right">
              <button type="button" className="secondary" onClick={onDone}>{t('builder.cancel')}</button>
              <button type="button" onClick={save}>{t('builder.save')}</button>
            </div>
          </div>
        </section>
      )}

      <SubstituteSheet
        open={substituteIdx != null}
        oldFood={substituteIdx != null ? items[substituteIdx]?.food ?? null : null}
        oldGrams={substituteIdx != null ? items[substituteIdx]?.grams ?? 0 : 0}
        itemIdx={substituteIdx ?? 0}
        allFoods={items.map((it) => it.food)}
        target={target}
        onClose={() => setSubstituteIdx(null)}
        onConfirm={(newItems) => setItems(newItems)}
      />
    </div>
  );
}

function SearchRow({ food, onPick, selected }: { food: Food; onPick: (f: Food) => void; selected: boolean }) {
  const veg = isVerdura(food);
  return (
    <div className="mb-result-row" role="option" aria-selected={selected} onClick={() => onPick(food)}>
      <div className="mb-result-left">
        <span className="mb-result-name">{food.name}</span>
        <span className="mb-result-meta">
          <span className="mb-result-cat">{CAT_LABEL[food.category ?? ''] ?? 'Altro'} · per 100 g</span>
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
      <span className={`mb-toggle ${selected ? 'is-on' : ''}`} aria-hidden="true">
        <span className="mb-toggle-bar" />
        {!selected && <span className="mb-toggle-bar is-vertical" />}
      </span>
    </div>
  );
}
