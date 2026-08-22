import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Food, MealKey } from '@vatia/diet-engine';
import { useLocale } from '../i18n/LocaleContext.tsx';
import { useProfile } from '../state/ProfileContext.tsx';
import { fetchFoodsForRole } from '../lib/foods.ts';
import { WizardShell, ChoiceList } from '../components/Wizard.tsx';

const MEALS: MealKey[] = ['breakfast', 'lunch', 'snack', 'dinner'];
const TOTAL_STEPS = 5;

type Role = 'protein' | 'carb' | 'veg' | 'fat';

export function MealBuilderPage() {
  const { t } = useLocale();
  const { profile } = useProfile();
  const navigate = useNavigate();

  const [step, setStep] = useState(0);
  const [meal, setMeal] = useState<MealKey | null>(null);
  const [protein, setProtein] = useState<string | null>(null);
  const [carb, setCarb] = useState<string | null>(null);
  const [veg, setVeg] = useState<string | null>(null);
  const [fat, setFat] = useState<string | null>(null); // null = not chosen, '' = skipped

  const [foodsByRole, setFoodsByRole] = useState<Record<Role, Food[]>>({
    protein: [], carb: [], veg: [], fat: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!profile) { navigate('/profile'); return; }
    let cancelled = false;
    setLoading(true); setError(null);
    Promise.all(
      (['protein', 'carb', 'veg', 'fat'] as Role[]).map((r) =>
        fetchFoodsForRole(r, profile.excludes).then((list) => [r, list] as const),
      ),
    )
      .then((entries) => !cancelled && setFoodsByRole(Object.fromEntries(entries) as Record<Role, Food[]>))
      .catch((e: Error) => !cancelled && setError(e.message))
      .finally(() => !cancelled && setLoading(false));
    return () => { cancelled = true; };
  }, [profile, navigate]);

  function submit() {
    if (!meal || !protein || !carb || !veg) return;
    sessionStorage.setItem('vatia:mealPick:v1', JSON.stringify({
      meal,
      selection: { protein, carb, veg, fat: fat || null },
    }));
    navigate('/plan');
  }

  const back = step > 0 ? () => setStep(step - 1) : undefined;
  const next = () => setStep((s) => Math.min(TOTAL_STEPS - 1, s + 1));

  // ── Step 0: meal type ───────────────────────────────────
  if (step === 0) {
    return (
      <WizardShell
        step={0} total={TOTAL_STEPS}
        sectionLabel={t('wizard.section.meal')}
        question={t('wizard.q.meal')}
        canNext={meal != null}
        onNext={next}
      >
        <ChoiceList<MealKey>
          value={meal}
          onChange={setMeal}
          options={MEALS.map((m) => ({ value: m, label: t(`meal.${m}`) }))}
        />
      </WizardShell>
    );
  }

  // ── Steps 1-3: role picker ──────────────────────────────
  const roleForStep: Record<number, Role> = { 1: 'protein', 2: 'carb', 3: 'veg' };
  if (step >= 1 && step <= 3) {
    const role = roleForStep[step]!;
    const setter =
      role === 'protein' ? setProtein :
      role === 'carb'    ? setCarb    :
                           setVeg;
    const value =
      role === 'protein' ? protein :
      role === 'carb'    ? carb    :
                           veg;
    const q =
      role === 'protein' ? t('wizard.q.protein') :
      role === 'carb'    ? t('wizard.q.carb')    :
                           t('wizard.q.veg');

    return (
      <WizardShell
        step={step} total={TOTAL_STEPS}
        sectionLabel={t('wizard.section.meal')}
        question={q}
        canNext={value != null && value !== ''}
        onBack={back} onNext={next}
      >
        <FoodSelect
          foods={foodsByRole[role]}
          value={value}
          onChange={setter}
          loading={loading}
          error={error}
          missingMsg={t('error.no_foods')}
        />
      </WizardShell>
    );
  }

  // ── Step 4: fat (optional) + submit ─────────────────────
  return (
    <WizardShell
      step={4} total={TOTAL_STEPS}
      sectionLabel={t('wizard.section.meal')}
      question={t('wizard.q.fat')}
      help={t('wizard.q.fat.help')}
      canNext
      nextLabel={t('wizard.compute')}
      onBack={back} onNext={submit}
    >
      <FoodSelect
        foods={foodsByRole.fat}
        value={fat}
        onChange={setFat}
        loading={loading}
        error={error}
        missingMsg={t('error.no_foods')}
        allowSkip
        skipLabel={t('wizard.fat.skip')}
      />
    </WizardShell>
  );
}

function FoodSelect({
  foods, value, onChange, loading, error, missingMsg, allowSkip, skipLabel,
}: {
  foods: Food[];
  value: string | null;
  onChange: (id: string | null) => void;
  loading: boolean;
  error: string | null;
  missingMsg: string;
  allowSkip?: boolean;
  skipLabel?: string;
}) {
  if (loading) return <p className="small">…</p>;
  if (error) return <p className="error-text">{error}</p>;
  if (!foods.length) return <p className="small">{missingMsg}</p>;

  return (
    <>
      <label>
        <span className="label-text">Scegli</span>
        <select value={value ?? ''} onChange={(e) => onChange(e.target.value || null)}>
          <option value="">—</option>
          {foods.map((f) => (
            <option key={f.id} value={f.id}>
              {f.name} · {f.kcal_per_100g} kcal · P{f.protein_per_100g}/C{f.carbs_per_100g}/F{f.fat_per_100g}
            </option>
          ))}
        </select>
      </label>
      {allowSkip && (
        <button type="button" className="link"
                onClick={() => onChange('')}
                style={{ marginTop: -6 }}>
          {skipLabel} →
        </button>
      )}
    </>
  );
}
