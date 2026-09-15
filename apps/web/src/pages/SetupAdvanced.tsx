import { useMemo } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import {
  ACTIVITY_MULTIPLIER,
  DEFAULT_MEAL_NAMES,
  bmrMifflinStJeor,
  computeDailyTargets,
  dailyMacrosFromPct,
  defaultDistribution,
  mealTargetsFor,
  type MealDistribution,
  type MealMacroPct,
} from '@vatia/diet-engine';
import { useLocale } from '../i18n/LocaleContext.tsx';
import { useProfile } from '../state/ProfileContext.tsx';
import { usePlan } from '../state/PlanContext.tsx';

/**
 * Come pesa ogni pasto sulla giornata, e come si dividono i macro
 * pasto per pasto. Si tocca una volta, quando si decide il ritmo della
 * giornata — non è roba da vedere ogni volta che si apre "I tuoi
 * numeri", per questo sta dietro "Avanzate".
 */
export function SetupAdvancedPage() {
  const { t } = useLocale();
  const { profile } = useProfile();
  const { targetKcal, dailyMacroPct, mealCount, distribution, setDistribution, setTargetKcal } = usePlan();
  const navigate = useNavigate();

  if (!profile) return <Navigate to="/profile" replace />;

  const bmr = useMemo(() => Math.round(bmrMifflinStJeor(profile)), [profile]);
  const tdee = useMemo(() => Math.round(bmr * ACTIVITY_MULTIPLIER[profile.activity]), [bmr, profile.activity]);
  const kcal = targetKcal ?? tdee;
  const daily = useMemo(() => {
    const base = computeDailyTargets(profile, kcal);
    return { ...base, ...dailyMacrosFromPct(kcal, dailyMacroPct) };
  }, [profile, kcal, dailyMacroPct]);
  const names = DEFAULT_MEAL_NAMES[mealCount] ?? DEFAULT_MEAL_NAMES[3]!;

  const kcalSum = distribution.kcalPct.reduce((a, b) => a + b, 0);
  const macroWarnings = distribution.mealMacros
    .map((m, i) => ({ i, sum: m.protein + m.carbs + m.fat }))
    .filter((x) => x.sum !== 100);

  function updateKcalPct(i: number, v: number) {
    const next: MealDistribution = {
      ...distribution,
      kcalPct: distribution.kcalPct.map((x, idx) => (idx === i ? clamp(v, 0, 100) : x)),
    };
    setDistribution(next);
  }
  function updateMacro(i: number, key: keyof MealMacroPct, v: number) {
    const next: MealDistribution = {
      ...distribution,
      mealMacros: distribution.mealMacros.map((m, idx) =>
        idx === i ? { ...m, [key]: clamp(v, 0, 100) } : m,
      ),
    };
    setDistribution(next);
  }

  function fatto() {
    if (kcalSum !== 100 && kcalSum > 0) {
      const norm = distribution.kcalPct.map((v) => Math.round((v * 100) / kcalSum));
      const drift = 100 - norm.reduce((a, b) => a + b, 0);
      if (drift !== 0 && norm.length > 0) norm[0] = (norm[0] ?? 0) + drift;
      setDistribution({ ...distribution, kcalPct: norm });
    }
    navigate(-1);
  }

  return (
    <div className="stack">
      <h1>Avanzate</h1>
      <p className="lede">Il peso di ogni pasto sulla giornata, e i macro pasto per pasto.</p>

      <div className="section-head">
        <span className="ios-caption">{t('setup.kcalPct')}</span>
        <span className="ios-caption mono">{kcalSum}% / 100%</span>
      </div>

      <div className="meal-config">
        {Array.from({ length: mealCount }, (_, i) => {
          const target = mealTargetsFor(daily, distribution, i);
          const kcalV = distribution.kcalPct[i] ?? 0;
          const macros = distribution.mealMacros[i]!;
          return (
            <details key={i} className="meal-config-row" open={i < 2}>
              <summary>
                <span className="meal-config-name">{names[i]}</span>
                <span className="meal-config-kcal mono">{target.kcal} kcal</span>
                <span className="meal-config-bar">
                  <span className="meal-config-bar-fill" style={{ width: `${Math.min(100, kcalV)}%` }} />
                </span>
                <span className="meal-config-pct mono">{kcalV}%</span>
              </summary>
              <div className="meal-config-body">
                <div className="grid-2" style={{ alignItems: 'end' }}>
                  <label>
                    <span className="label-text">% kcal</span>
                    <input
                      type="number" min={0} max={100}
                      value={kcalV}
                      onChange={(e) => updateKcalPct(i, Number(e.target.value))}
                    />
                  </label>
                  <div className="mono small">
                    <span style={{ color: 'var(--c-protein)' }}>P {target.protein_g}g</span> ·{' '}
                    <span style={{ color: 'var(--c-carbs)' }}>C {target.carbs_g}g</span> ·{' '}
                    <span style={{ color: 'var(--c-fat)' }}>F {target.fat_g}g</span>
                  </div>
                </div>
                <div className="grid-3" style={{ marginTop: 12 }}>
                  <label>
                    <span className="label-text" style={{ color: 'var(--c-protein)' }}>% Proteine</span>
                    <input type="number" min={0} max={100}
                           value={macros.protein}
                           onChange={(e) => updateMacro(i, 'protein', Number(e.target.value))} />
                  </label>
                  <label>
                    <span className="label-text" style={{ color: 'var(--c-carbs)' }}>% Carbo</span>
                    <input type="number" min={0} max={100}
                           value={macros.carbs}
                           onChange={(e) => updateMacro(i, 'carbs', Number(e.target.value))} />
                  </label>
                  <label>
                    <span className="label-text" style={{ color: 'var(--c-fat)' }}>% Grassi</span>
                    <input type="number" min={0} max={100}
                           value={macros.fat}
                           onChange={(e) => updateMacro(i, 'fat', Number(e.target.value))} />
                  </label>
                </div>
                <p className="small" style={{ marginTop: 4 }}>{t('setup.macroPct.hint')}</p>
              </div>
            </details>
          );
        })}
      </div>

      {kcalSum !== 100 && <p className="small" style={{ color: 'var(--warn)', marginTop: 8 }}>{t('setup.warn.notHundred')}</p>}
      {macroWarnings.length > 0 && <p className="small" style={{ color: 'var(--warn)' }}>{t('setup.warn.mealMacros')}</p>}

      <div className="btn-row">
        <button
          type="button" className="link"
          onClick={() => { setDistribution(defaultDistribution(mealCount)); setTargetKcal(tdee); }}
        >
          {t('setup.reset')}
        </button>
        <div className="right">
          <button type="button" onClick={fatto}>Fatto</button>
        </div>
      </div>
    </div>
  );
}

function clamp(v: number, lo: number, hi: number): number {
  if (!Number.isFinite(v)) return lo;
  return Math.min(hi, Math.max(lo, v));
}
