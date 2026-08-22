import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  DEFAULT_MEAL_NAMES,
  computeDailyTargets,
  defaultDistribution,
  mealTargetsFor,
  type MealDistribution,
  type MealMacroPct,
} from '@vatia/diet-engine';
import { useLocale } from '../i18n/LocaleContext.tsx';
import { useProfile } from '../state/ProfileContext.tsx';
import { usePlan } from '../state/PlanContext.tsx';

const MEAL_OPTIONS = [2, 3, 4, 5, 6];

export function SetupPage() {
  const { t } = useLocale();
  const { profile } = useProfile();
  const { mealCount, setMealCount, distribution, setDistribution } = usePlan();
  const navigate = useNavigate();

  if (!profile) { navigate('/profile'); return null; }

  const daily = useMemo(() => computeDailyTargets(profile), [profile]);
  const names = DEFAULT_MEAL_NAMES[mealCount] ?? DEFAULT_MEAL_NAMES[3]!;

  const kcalSum = distribution.kcalPct.reduce((a, b) => a + b, 0);
  const macroWarnings = distribution.mealMacros
    .map((m, i) => ({ i, sum: m.protein + m.carbs + m.fat }))
    .filter((x) => x.sum !== 100);

  function updateKcal(i: number, v: number) {
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

  function goWeek() {
    // Auto-normalise kcalPct so it sums exactly to 100
    if (kcalSum !== 100 && kcalSum > 0) {
      const norm = distribution.kcalPct.map((v) => Math.round((v * 100) / kcalSum));
      const drift = 100 - norm.reduce((a, b) => a + b, 0);
      if (drift !== 0 && norm.length > 0) norm[0] = (norm[0] ?? 0) + drift;
      setDistribution({ ...distribution, kcalPct: norm });
    }
    navigate('/week');
  }

  return (
    <div className="stack">
      <span className="eyebrow">{t('nav.setup')}</span>
      <h1>{t('setup.title')}</h1>
      <p className="lede">{t('setup.subtitle')}</p>

      {/* Meal count selector */}
      <section style={{ marginTop: 8 }}>
        <div className="wizard-step-meta">
          <span>{t('setup.mealCount')}</span>
          <span className="mono">{daily.kcal} kcal · P {daily.protein_g} · C {daily.carbs_g} · F {daily.fat_g} g/g</span>
        </div>
        <div className="stepper">
          {MEAL_OPTIONS.map((n) => (
            <button
              key={n}
              type="button"
              className={`stepper-btn ${mealCount === n ? 'is-selected' : ''}`}
              onClick={() => setMealCount(n)}
              aria-pressed={mealCount === n}
            >
              {n}
            </button>
          ))}
        </div>
        <p className="small" style={{ marginTop: 8 }}>{t('setup.mealCount.hint')}</p>
      </section>

      {/* Per-meal config */}
      <section style={{ marginTop: 32 }}>
        <div className="wizard-step-meta">
          <span>{t('setup.kcalPct')}</span>
          <span className="mono">{kcalSum}% / 100%</span>
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
                        onChange={(e) => updateKcal(i, Number(e.target.value))}
                      />
                    </label>
                    <div className="mono small">
                      P {target.protein_g}g · C {target.carbs_g}g · F {target.fat_g}g
                    </div>
                  </div>
                  <div className="grid-3" style={{ marginTop: 12 }}>
                    <label>
                      <span className="label-text">% Proteine</span>
                      <input type="number" min={0} max={100}
                             value={macros.protein}
                             onChange={(e) => updateMacro(i, 'protein', Number(e.target.value))} />
                    </label>
                    <label>
                      <span className="label-text">% Carboidrati</span>
                      <input type="number" min={0} max={100}
                             value={macros.carbs}
                             onChange={(e) => updateMacro(i, 'carbs', Number(e.target.value))} />
                    </label>
                    <label>
                      <span className="label-text">% Grassi</span>
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
      </section>

      <div className="btn-row">
        <button type="button" className="link" onClick={() => setDistribution(defaultDistribution(mealCount))}>
          {t('setup.reset')}
        </button>
        <div className="right">
          <button type="button" onClick={goWeek}>{t('setup.continue')} →</button>
        </div>
      </div>
    </div>
  );
}

function clamp(v: number, lo: number, hi: number): number {
  if (!Number.isFinite(v)) return lo;
  return Math.min(hi, Math.max(lo, v));
}
