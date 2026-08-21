import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Food, FoodRole, MealKey } from '@vatia/diet-engine';
import { useLocale } from '../i18n/LocaleContext.tsx';
import { useProfile } from '../state/ProfileContext.tsx';
import { fetchFoodsForRole } from '../lib/foods.ts';

const MEALS: MealKey[] = ['breakfast', 'lunch', 'snack', 'dinner'];

type Selection = Record<Exclude<FoodRole, never>, Food | null>;
const EMPTY: Selection = { protein: null, carb: null, veg: null, fat: null };

export function MealBuilderPage() {
  const { t } = useLocale();
  const { profile } = useProfile();
  const navigate = useNavigate();
  const [meal, setMeal] = useState<MealKey>('lunch');
  const [foods, setFoods] = useState<Record<FoodRole, Food[]>>({
    protein: [], carb: [], veg: [], fat: [],
  });
  const [sel, setSel] = useState<Selection>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!profile) { navigate('/profile'); return; }
    let cancelled = false;
    setLoading(true);
    setError(null);
    Promise.all(
      (['protein', 'carb', 'veg', 'fat'] as FoodRole[]).map((role) =>
        fetchFoodsForRole(role, profile.excludes).then((list) => [role, list] as const),
      ),
    )
      .then((entries) => {
        if (cancelled) return;
        setFoods(Object.fromEntries(entries) as Record<FoodRole, Food[]>);
      })
      .catch((e: Error) => !cancelled && setError(e.message))
      .finally(() => !cancelled && setLoading(false));
    return () => { cancelled = true; };
  }, [profile, navigate]);

  const ready = useMemo(
    () => sel.protein != null && sel.carb != null && sel.veg != null,
    [sel],
  );

  function submit() {
    if (!ready) return;
    const payload = {
      meal,
      selection: {
        protein: sel.protein!.id,
        carb: sel.carb!.id,
        veg: sel.veg!.id,
        fat: sel.fat?.id ?? null,
      },
    };
    sessionStorage.setItem('vatia:mealPick:v1', JSON.stringify(payload));
    navigate('/plan');
  }

  return (
    <div className="stack">
      <h1>{t('meal.title')}</h1>
      <p className="small">{t('meal.pick')}</p>

      <label>
        <span>{t('meal.select_meal')}</span>
        <select value={meal} onChange={(e) => setMeal(e.target.value as MealKey)}>
          {MEALS.map((m) => <option key={m} value={m}>{t(`meal.${m}`)}</option>)}
        </select>
      </label>

      {loading && <p className="small">…</p>}
      {error && <p className="small" style={{ color: 'var(--danger)' }}>{error}</p>}

      {(['protein', 'carb', 'veg', 'fat'] as FoodRole[]).map((role) => (
        <RolePicker
          key={role}
          label={t(`meal.${role}`)}
          foods={foods[role]}
          value={sel[role]}
          onChange={(f) => setSel((s) => ({ ...s, [role]: f }))}
          missingMsg={t('error.no_foods')}
        />
      ))}

      <button type="button" onClick={submit} disabled={!ready}>{t('meal.compute')}</button>
    </div>
  );
}

function RolePicker({
  label, foods, value, onChange, missingMsg,
}: {
  label: string;
  foods: Food[];
  value: Food | null;
  onChange: (f: Food | null) => void;
  missingMsg: string;
}) {
  return (
    <div className="card">
      <label>
        <span>{label}</span>
        {foods.length === 0 ? (
          <p className="small" style={{ margin: 0 }}>{missingMsg}</p>
        ) : (
          <select
            value={value?.id ?? ''}
            onChange={(e) => {
              const id = e.target.value;
              onChange(id ? foods.find((f) => f.id === id) ?? null : null);
            }}
          >
            <option value="">—</option>
            {foods.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name} · {f.kcal_per_100g} kcal · P {f.protein_per_100g} / C {f.carbs_per_100g} / F {f.fat_per_100g}
              </option>
            ))}
          </select>
        )}
      </label>
    </div>
  );
}
