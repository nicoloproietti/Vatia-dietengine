import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  DAYS_IT, DAYS_SHORT_IT,
  DEFAULT_MEAL_NAMES,
  computeDailyTargets,
  dailyMacrosFromPct,
  dailyMealTargets,
  dayTotals,
} from '@vatia/diet-engine';
import { useLocale } from '../i18n/LocaleContext.tsx';
import { useProfile } from '../state/ProfileContext.tsx';
import { usePlan } from '../state/PlanContext.tsx';

export function WeekPage() {
  const { t } = useLocale();
  const { profile } = useProfile();
  const { targetKcal, dailyMacroPct, mealCount, distribution, weekPlan, clearMeal, copyMealToWeek, clearWeek } = usePlan();
  const navigate = useNavigate();

  const [activeDay, setActiveDay] = useState(0);

  if (!profile) { navigate('/profile'); return null; }

  const daily = useMemo(() => {
    const base = computeDailyTargets(profile, targetKcal ?? undefined);
    return { ...base, ...dailyMacrosFromPct(base.kcal, dailyMacroPct) };
  }, [profile, targetKcal, dailyMacroPct]);
  const targets = useMemo(() => dailyMealTargets(daily, distribution), [daily, distribution]);
  const names = DEFAULT_MEAL_NAMES[mealCount] ?? DEFAULT_MEAL_NAMES[3]!;

  const dayPlan = weekPlan[activeDay] ?? {};
  const dayTotal = useMemo(() => dayTotals(dayPlan), [dayPlan]);

  return (
    <div className="stack">
      <span className="eyebrow">{t('nav.week')}</span>
      <h1>{t('week.title')}</h1>
      <p className="lede">{t('week.subtitle')}</p>

      {/* Day switcher */}
      <div className="day-tabs" role="tablist">
        {DAYS_SHORT_IT.map((label, idx) => {
          const done = Object.keys(weekPlan[idx] ?? {}).length;
          const total = mealCount;
          return (
            <button
              key={idx}
              type="button"
              role="tab"
              aria-selected={activeDay === idx}
              className={`day-tab ${activeDay === idx ? 'is-active' : ''} ${done === total ? 'is-complete' : ''}`}
              onClick={() => setActiveDay(idx)}
            >
              <span className="day-tab-label">{label}</span>
              <span className="day-tab-progress mono">{done}/{total}</span>
            </button>
          );
        })}
      </div>

      {/* Day heading */}
      <div className="wizard-step-meta" style={{ marginTop: 20 }}>
        <span>{DAYS_IT[activeDay]}</span>
        <span className="mono">{dayTotal.kcal} / {daily.kcal} kcal</span>
      </div>

      {/* Meals list */}
      <div className="meal-list">
        {Array.from({ length: mealCount }, (_, mi) => {
          const target = targets[mi]!;
          const saved = dayPlan[mi];
          const done = !!saved;
          return (
            <div key={mi} className={`meal-row ${done ? 'is-done' : ''}`}>
              <div className="meal-row-header">
                <div>
                  <h3 style={{ margin: 0 }}>{names[mi]}</h3>
                  <span className="small mono">
                    {done
                      ? `${Math.round(saved!.totals.kcal)} / ${target.kcal} kcal`
                      : `${target.kcal} kcal · P ${target.protein_g} · C ${target.carbs_g} · F ${target.fat_g}`}
                  </span>
                </div>
                <div className="meal-row-actions">
                  {done && (
                    <>
                      <button type="button" className="ghost" onClick={() => copyMealToWeek(activeDay, mi)}>
                        {t('week.copyToWeek')}
                      </button>
                      <button type="button" className="ghost" onClick={() => clearMeal(activeDay, mi)}>
                        {t('week.clearMeal')}
                      </button>
                    </>
                  )}
                  <button
                    type="button"
                    className={done ? 'secondary' : ''}
                    onClick={() => navigate(`/build/${activeDay}/${mi}`)}
                  >
                    {done ? t('week.editMeal') : t('week.buildMeal')} →
                  </button>
                </div>
              </div>
              {done && (
                <ul className="meal-items">
                  {saved!.items.map((it) => (
                    <li key={it.food.id}>
                      <span>{it.food.name}</span>
                      <span className="mono">{it.grams} g</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          );
        })}
      </div>

      {/* Day bars vs target */}
      <div className="wizard-step-meta" style={{ marginTop: 32 }}>
        <span>{t('week.dayTotals')}</span>
        <span className="mono">P {Math.round(dayTotal.protein_g)}/{daily.protein_g} · C {Math.round(dayTotal.carbs_g)}/{daily.carbs_g} · F {Math.round(dayTotal.fat_g)}/{daily.fat_g}</span>
      </div>
      <div className="bar-stack">
        <Bar label="kcal" value={dayTotal.kcal} target={daily.kcal} />
        <Bar label="Proteine" value={dayTotal.protein_g} target={daily.protein_g} unit="g" />
        <Bar label="Carboidrati" value={dayTotal.carbs_g} target={daily.carbs_g} unit="g" />
        <Bar label="Grassi" value={dayTotal.fat_g} target={daily.fat_g} unit="g" />
      </div>

      <div className="btn-row">
        <button type="button" className="link" onClick={() => navigate('/setup')}>← {t('nav.setup')}</button>
        <div className="right">
          <button type="button" className="ghost" onClick={() => navigate('/shopping')}>{t('week.shopping')}</button>
          <button type="button" className="ghost" onClick={() => { if (confirm('Sicuro? Svuota tutti i pasti della settimana.')) clearWeek(); }}>
            {t('week.clearWeek')}
          </button>
        </div>
      </div>
    </div>
  );
}

/** Horizontal progress bar — flat, editorial. Turns accent when past target. */
function Bar({ label, value, target, unit }: { label: string; value: number; target: number; unit?: string }) {
  const pct = target > 0 ? (value / target) * 100 : 0;
  const clamped = Math.min(100, pct);
  const over = pct > 105;
  return (
    <div className="bar-row">
      <span className="bar-label">{label}</span>
      <span className="bar-track">
        <span
          className={`bar-fill ${over ? 'is-over' : ''}`}
          style={{ width: `${clamped}%` }}
        />
      </span>
      <span className="bar-value mono">
        {Math.round(value)}{unit ?? ''} <span style={{ color: 'var(--ink-3)' }}>/ {Math.round(target)}{unit ?? ''}</span>
      </span>
    </div>
  );
}
