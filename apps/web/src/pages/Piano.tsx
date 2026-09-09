import { useMemo, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
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
import { DaySelector } from '../components/DaySelector.tsx';
import { TargetBar } from '../components/TargetBar.tsx';
import { EmptyState } from '../components/EmptyState.tsx';
import { IconChevronRight } from '../components/Icons.tsx';
import { formatNumber } from '../lib/format.ts';

/**
 * The workspace: settings summary strip on top, week grid in the
 * middle, day-total bars at the bottom. Building a meal navigates to
 * its own full-screen route (/build/:day/:meal) — meal construction is
 * the app's main task, so it gets the whole screen rather than an
 * overlay on top of the week plan.
 */
export function PianoPage() {
  const { t } = useLocale();
  const { profile } = useProfile();
  const {
    targetKcal, dailyMacroPct, mealCount, distribution, weekPlan,
    clearMeal, copyMealToWeek, clearWeek,
  } = usePlan();
  const navigate = useNavigate();

  if (!profile) return <Navigate to="/import" replace />;

  const daily = useMemo(() => {
    const base = computeDailyTargets(profile, targetKcal ?? undefined);
    return { ...base, ...dailyMacrosFromPct(base.kcal, dailyMacroPct) };
  }, [profile, targetKcal, dailyMacroPct]);

  const targets = useMemo(() => dailyMealTargets(daily, distribution), [daily, distribution]);
  const names = DEFAULT_MEAL_NAMES[mealCount] ?? DEFAULT_MEAL_NAMES[3]!;

  const [activeDay, setActiveDay] = useState(0);
  const dayPlan = weekPlan[activeDay] ?? {};
  const dayTotal = useMemo(() => dayTotals(dayPlan), [dayPlan]);
  const dayDoneCount = Object.keys(dayPlan).length;

  const doneByDay = useMemo(
    () => DAYS_IT.map((_, i) => Object.keys(weekPlan[i] ?? {}).length),
    [weekPlan],
  );

  function openBuilder(day: number, meal: number) {
    navigate(`/build/${day}/${meal}`);
  }

  const totalDone = DAYS_IT.filter((_, i) => (weekPlan[i] ? Object.keys(weekPlan[i]).length : 0) >= mealCount).length;
  const mealsCompleted = Object.keys(weekPlan).reduce((s, d) => s + Object.keys(weekPlan[Number(d)] ?? {}).length, 0);

  return (
    <>
      {/* ── Large title ── */}
      <div className="piano-header">
        <div>
          <h1 style={{ margin: 0 }}>{t('week.title')}</h1>
          <p className="small mono" style={{ marginTop: 6 }}>
            {totalDone}/7 giorni completi · {mealsCompleted}/{mealCount * 7} pasti
          </p>
        </div>
      </div>

      {/* ── I tuoi numeri: lista raggruppata, etichetta a sinistra, valore a destra ── */}
      <span className="ios-caption">I tuoi numeri</span>
      <section className="ios-group piano-summary">
        <div className="ios-row">
          <span className="ios-row-title">Calorie al giorno</span>
          <span className="ios-row-value mono is-strong">{formatNumber(daily.kcal)} kcal</span>
        </div>
        <div className="ios-row">
          <span className="ios-row-main">
            <span className="ios-row-title">Macro</span>
            <span className="ios-row-sub">prot. · carb. · grassi</span>
          </span>
          <span className="ios-row-value mono">
            <span style={{ color: 'var(--c-protein)' }}>{formatNumber(daily.protein_g)}</span>
            {' · '}
            <span style={{ color: 'var(--c-carbs)' }}>{formatNumber(daily.carbs_g)}</span>
            {' · '}
            <span style={{ color: 'var(--c-fat)' }}>{formatNumber(daily.fat_g)}</span> g
          </span>
        </div>
        <div className="ios-row">
          <span className="ios-row-title">Pasti al giorno</span>
          <span className="ios-row-value mono">{mealCount}</span>
        </div>
        <div className="ios-row">
          <span className="ios-row-title">Profilo</span>
          <span className="ios-row-value mono">
            {profile.age} anni · {profile.weight_kg} kg · {profile.height_cm} cm
          </span>
        </div>
        <button type="button" className="ios-row is-action" onClick={() => navigate('/setup')}>
          Modifica i numeri
        </button>
      </section>

      {/* ── Day selector ── */}
      <DaySelector
        days={DAYS_SHORT_IT}
        value={activeDay}
        onChange={setActiveDay}
        doneByDay={doneByDay}
        mealsPerDay={mealCount}
      />

      {/* ── Meal list ── */}
      <div className="section-head">
        <span className="ios-caption">{DAYS_IT[activeDay]}</span>
        <span className="ios-caption mono">
          {formatNumber(dayTotal.kcal)} / {formatNumber(daily.kcal)} kcal
        </span>
      </div>

      {dayDoneCount === 0 ? (
        <EmptyState>
          {`Nessun pasto ancora costruito per ${DAYS_IT[activeDay]!.toLowerCase()}. Parti da ${(names[0] ?? '').toLowerCase()}: scegli gli alimenti, i grammi li calcola Vatia.`}
        </EmptyState>
      ) : null}

      <div className="meal-list">
        {Array.from({ length: mealCount }, (_, mi) => {
          const target = targets[mi]!;
          const saved = dayPlan[mi];
          const done = !!saved;
          return (
            <div key={mi} className={`meal-row ${done ? 'is-done' : ''}`}>
              <button
                type="button"
                className="meal-row-header"
                onClick={() => openBuilder(activeDay, mi)}
              >
                <span className="ios-row-main">
                  <span className="ios-row-title">{names[mi]}</span>
                  <span className="ios-row-sub mono">
                    {done
                      ? `target ${formatNumber(target.kcal)} kcal · fatto ${formatNumber(saved!.totals.kcal)} kcal`
                      : `target ${formatNumber(target.kcal)} kcal · da costruire`}
                  </span>
                </span>
                <span className="ios-chevron"><IconChevronRight /></span>
              </button>

              {done && (
                <>
                  <ul className="meal-items">
                    {saved!.items.map((it, i) => (
                      <li key={`${it.food.id}-${i}`}>
                        <span>{it.food.name}</span>
                        <span className="mono">{formatNumber(it.grams)} g</span>
                      </li>
                    ))}
                  </ul>
                  <div className="meal-row-actions">
                    <button type="button" className="ghost" onClick={() => copyMealToWeek(activeDay, mi)}>
                      {t('week.copyToWeek')}
                    </button>
                    <button type="button" className="ghost danger" onClick={() => clearMeal(activeDay, mi)}>
                      {t('week.clearMeal')}
                    </button>
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>

      {/* ── Day totals bars ── */}
      <div className="section-head" style={{ marginTop: 26 }}>
        <span className="ios-caption">{t('week.dayTotals')}</span>
      </div>
      <div className="bar-stack">
        <TargetBar label="kcal"        value={dayTotal.kcal}      target={daily.kcal}      color="var(--c-kcal)" />
        <TargetBar label="Proteine"    value={dayTotal.protein_g} target={daily.protein_g} color="var(--c-protein)" unit="g" />
        <TargetBar label="Carboidrati" value={dayTotal.carbs_g}   target={daily.carbs_g}   color="var(--c-carbs)"   unit="g" />
        <TargetBar label="Grassi"      value={dayTotal.fat_g}     target={daily.fat_g}     color="var(--c-fat)"     unit="g" />
      </div>

      {/* Le altre sezioni stanno nella tab bar: qui resta solo l'azione distruttiva. */}
      <div className="btn-row-center">
        <button
          type="button"
          className="ghost danger"
          onClick={() => { if (confirm('Sicuro? Svuota tutti i pasti della settimana.')) clearWeek(); }}
        >
          {t('week.clearWeek')}
        </button>
      </div>
    </>
  );
}
