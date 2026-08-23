import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
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
import { Drawer } from '../components/Drawer.tsx';
import { BuildMealPanel, type BuilderPhase } from '../components/BuildMealPanel.tsx';
import { DaySelector } from '../components/DaySelector.tsx';
import { TargetBar } from '../components/TargetBar.tsx';
import { EmptyState } from '../components/EmptyState.tsx';
import { formatNumber } from '../lib/format.ts';

interface OpenSlot { day: number; meal: number }

/**
 * The workspace: settings summary strip on top, week grid in the
 * middle, day-total bars at the bottom, and the meal builder in a
 * slide-over drawer (bottom sheet on mobile). Everything is on one
 * page — the user rarely navigates once they get here.
 */
export function PianoPage() {
  const { t } = useLocale();
  const { profile } = useProfile();
  const {
    targetKcal, dailyMacroPct, mealCount, distribution, weekPlan,
    clearMeal, copyMealToWeek, clearWeek,
  } = usePlan();
  const navigate = useNavigate();
  const [search, setSearch] = useSearchParams();

  if (!profile) { navigate('/import'); return null; }

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

  // Drawer state — supports deep-link via ?day=&meal= for bookmarks / redirect
  const [open, setOpen] = useState<OpenSlot | null>(null);
  const [builderPhase, setBuilderPhase] = useState<BuilderPhase>('compose');
  useEffect(() => {
    const d = Number(search.get('day'));
    const m = Number(search.get('meal'));
    if (Number.isFinite(d) && Number.isFinite(m) && search.get('day') !== null) {
      setOpen({ day: d, meal: m });
      setActiveDay(d);
    }
  }, [search]);

  function openBuilder(day: number, meal: number) {
    setOpen({ day, meal });
    setSearch({ day: String(day), meal: String(meal) }, { replace: true });
  }
  function closeBuilder() {
    setOpen(null);
    if (search.get('day') !== null) setSearch({}, { replace: true });
  }

  const totalDone = DAYS_IT.filter((_, i) => (weekPlan[i] ? Object.keys(weekPlan[i]).length : 0) >= mealCount).length;
  const mealsCompleted = Object.keys(weekPlan).reduce((s, d) => s + Object.keys(weekPlan[Number(d)] ?? {}).length, 0);

  const drawerEyebrow = builderPhase === 'compose' ? 'Fase 1 · scegli' : 'Fase 2 · regola';
  const drawerTitle = open ? `${DAYS_IT[open.day]} · ${names[open.meal] ?? ''}` : '';

  return (
    <>
      {/* ── Settings summary strip ── */}
      <section className="piano-strip">
        <div className="piano-strip-cell">
          <span className="piano-strip-label">Profilo</span>
          <span className="piano-strip-val mono">
            {profile.age}a · {profile.weight_kg}kg · {profile.height_cm}cm
          </span>
        </div>
        <div className="piano-strip-cell">
          <span className="piano-strip-label">kcal / giorno</span>
          <span className="piano-strip-val mono">{formatNumber(daily.kcal)}</span>
        </div>
        <div className="piano-strip-cell">
          <span className="piano-strip-label">P · C · F</span>
          <span className="piano-strip-val mono">
            <span style={{ color: 'var(--c-protein)' }}>{formatNumber(daily.protein_g)}</span> ·{' '}
            <span style={{ color: 'var(--c-carbs)' }}>{formatNumber(daily.carbs_g)}</span> ·{' '}
            <span style={{ color: 'var(--c-fat)' }}>{formatNumber(daily.fat_g)}</span> g
          </span>
        </div>
        <div className="piano-strip-cell">
          <span className="piano-strip-label">Pasti</span>
          <span className="piano-strip-val mono">{mealCount}</span>
        </div>
        <div className="piano-strip-actions">
          <button type="button" className="secondary" onClick={() => navigate('/setup')}>
            Modifica
          </button>
        </div>
      </section>

      {/* ── Header ── */}
      <div className="piano-header">
        <div>
          <span className="eyebrow">{t('nav.week')}</span>
          <h1 style={{ fontSize: 'clamp(28px, 4vw, 40px)', margin: 0 }}>{t('week.title')}</h1>
          <p className="small mono" style={{ marginTop: 8 }}>
            {totalDone}/7 giorni completi · {mealsCompleted}/{mealCount * 7} pasti
          </p>
        </div>
      </div>

      {/* ── Day selector ── */}
      <DaySelector
        days={DAYS_SHORT_IT}
        value={activeDay}
        onChange={setActiveDay}
        doneByDay={doneByDay}
        mealsPerDay={mealCount}
      />

      <div className="wizard-step-meta" style={{ marginTop: 20 }}>
        <span>{DAYS_IT[activeDay]}</span>
        <span className="mono">{formatNumber(dayTotal.kcal)} / {formatNumber(daily.kcal)} kcal</span>
      </div>

      {/* ── Meal list ── */}
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
              <div className="meal-row-header">
                <div>
                  <h3 style={{ margin: 0 }}>{names[mi]}</h3>
                  <span className="small mono">
                    {done
                      ? `target ${formatNumber(target.kcal)} kcal · fatto ${formatNumber(saved!.totals.kcal)} kcal`
                      : `target ${formatNumber(target.kcal)} kcal · da costruire`}
                  </span>
                </div>
                <div className="meal-row-actions">
                  {done && (
                    <>
                      <button type="button" className="secondary" onClick={() => openBuilder(activeDay, mi)}>
                        {t('week.editMeal')}
                      </button>
                      <button type="button" className="ghost" onClick={() => copyMealToWeek(activeDay, mi)}>
                        {t('week.copyToWeek')}
                      </button>
                      <button type="button" className="ghost" onClick={() => clearMeal(activeDay, mi)}>
                        {t('week.clearMeal')}
                      </button>
                    </>
                  )}
                  {!done && (
                    <button type="button" onClick={() => openBuilder(activeDay, mi)}>
                      {t('week.buildMeal')} →
                    </button>
                  )}
                </div>
              </div>
              {done && (
                <ul className="meal-items">
                  {saved!.items.map((it, i) => (
                    <li key={`${it.food.id}-${i}`}>
                      <span>{it.food.name}</span>
                      <span className="mono">{formatNumber(it.grams)} g</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          );
        })}
      </div>

      {/* ── Day totals bars ── */}
      <div className="wizard-step-meta" style={{ marginTop: 32 }}>
        <span>{t('week.dayTotals')}</span>
        <span className="mono">
          P {formatNumber(dayTotal.protein_g)}/{formatNumber(daily.protein_g)} ·{' '}
          C {formatNumber(dayTotal.carbs_g)}/{formatNumber(daily.carbs_g)} ·{' '}
          F {formatNumber(dayTotal.fat_g)}/{formatNumber(daily.fat_g)}
        </span>
      </div>
      <div className="bar-stack">
        <TargetBar label="kcal"        value={dayTotal.kcal}      target={daily.kcal}      color="var(--c-kcal)" />
        <TargetBar label="Proteine"    value={dayTotal.protein_g} target={daily.protein_g} color="var(--c-protein)" unit="g" />
        <TargetBar label="Carboidrati" value={dayTotal.carbs_g}   target={daily.carbs_g}   color="var(--c-carbs)"   unit="g" />
        <TargetBar label="Grassi"      value={dayTotal.fat_g}     target={daily.fat_g}     color="var(--c-fat)"     unit="g" />
      </div>

      <div className="btn-row">
        <button type="button" className="link" onClick={() => navigate('/setup')}>← Impostazioni</button>
        <div className="right">
          <button type="button" className="ghost" onClick={() => navigate('/shopping')}>{t('week.shopping')}</button>
          <button type="button" className="ghost" onClick={() => {
            if (confirm('Sicuro? Svuota tutti i pasti della settimana.')) clearWeek();
          }}>
            {t('week.clearWeek')}
          </button>
        </div>
      </div>

      {/* ── Drawer (slide-over / bottom sheet) ── */}
      <Drawer
        open={open != null}
        onClose={closeBuilder}
        eyebrow={open ? drawerEyebrow : undefined}
        title={drawerTitle || t('builder.title')}
      >
        {open && (
          <BuildMealPanel
            dayIdx={open.day}
            mealIdx={open.meal}
            onDone={closeBuilder}
            onPhaseChange={setBuilderPhase}
          />
        )}
      </Drawer>
    </>
  );
}
