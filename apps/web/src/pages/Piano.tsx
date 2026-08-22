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
import { BuildMealPanel } from '../components/BuildMealPanel.tsx';

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

  // Drawer state — supports deep-link via ?day=&meal= for bookmarks / redirect
  const [open, setOpen] = useState<OpenSlot | null>(null);
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

  const totalDone = DAYS_IT.filter((_, i) => Object.keys(weekPlan[i] ?? {}).length >= mealCount).length;

  return (
    <>
      {/* ── Settings summary strip ── */}
      <section className="piano-strip">
        <div className="piano-strip-cell">
          <span className="piano-strip-label">Profilo</span>
          <span className="piano-strip-val">
            {profile.age}a · {profile.weight_kg}kg · {profile.height_cm}cm
          </span>
        </div>
        <div className="piano-strip-cell">
          <span className="piano-strip-label">kcal / giorno</span>
          <span className="piano-strip-val mono">{daily.kcal}</span>
        </div>
        <div className="piano-strip-cell">
          <span className="piano-strip-label">P · C · F</span>
          <span className="piano-strip-val mono">
            <span style={{ color: 'var(--c-protein)' }}>{daily.protein_g}</span> ·{' '}
            <span style={{ color: 'var(--c-carbs)' }}>{daily.carbs_g}</span> ·{' '}
            <span style={{ color: 'var(--c-fat)' }}>{daily.fat_g}</span> g
          </span>
        </div>
        <div className="piano-strip-cell">
          <span className="piano-strip-label">Pasti</span>
          <span className="piano-strip-val">{mealCount}</span>
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
          <p className="small" style={{ marginTop: 8 }}>
            {totalDone}/7 giorni completi · {Object.keys(weekPlan).reduce((s, d) => s + Object.keys(weekPlan[Number(d)] ?? {}).length, 0)}/{mealCount * 7} pasti
          </p>
        </div>
      </div>

      {/* ── Day tabs ── */}
      <div className="day-tabs">
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

      <div className="wizard-step-meta" style={{ marginTop: 20 }}>
        <span>{DAYS_IT[activeDay]}</span>
        <span className="mono">{dayTotal.kcal} / {daily.kcal} kcal</span>
      </div>

      {/* ── Meal list ── */}
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
                    onClick={() => openBuilder(activeDay, mi)}
                  >
                    {done ? t('week.editMeal') : t('week.buildMeal')} →
                  </button>
                </div>
              </div>
              {done && (
                <ul className="meal-items">
                  {saved!.items.map((it, i) => (
                    <li key={`${it.food.id}-${i}`}>
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

      {/* ── Day totals bars ── */}
      <div className="wizard-step-meta" style={{ marginTop: 32 }}>
        <span>{t('week.dayTotals')}</span>
        <span className="mono">
          P {Math.round(dayTotal.protein_g)}/{daily.protein_g} ·{' '}
          C {Math.round(dayTotal.carbs_g)}/{daily.carbs_g} ·{' '}
          F {Math.round(dayTotal.fat_g)}/{daily.fat_g}
        </span>
      </div>
      <div className="bar-stack">
        <Bar label="kcal"        value={dayTotal.kcal}      target={daily.kcal}      color="var(--c-kcal)"    />
        <Bar label="Proteine"    value={dayTotal.protein_g} target={daily.protein_g} color="var(--c-protein)" unit="g" />
        <Bar label="Carboidrati" value={dayTotal.carbs_g}   target={daily.carbs_g}   color="var(--c-carbs)"   unit="g" />
        <Bar label="Grassi"      value={dayTotal.fat_g}     target={daily.fat_g}     color="var(--c-fat)"     unit="g" />
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
        eyebrow={open ? `${DAYS_IT[open.day]} · ${names[open.meal] ?? ''}` : undefined}
        title={t('builder.title')}
      >
        {open && <BuildMealPanel dayIdx={open.day} mealIdx={open.meal} onDone={closeBuilder} />}
      </Drawer>
    </>
  );
}

function Bar({ label, value, target, color, unit }: { label: string; value: number; target: number; color: string; unit?: string }) {
  const pct = target > 0 ? (value / target) * 100 : 0;
  const clamped = Math.min(100, pct);
  const over = pct > 105;
  return (
    <div className="bar-row">
      <span className="bar-label">{label}</span>
      <span className="bar-track">
        <span
          className={`bar-fill ${over ? 'is-over' : ''}`}
          style={{ width: `${clamped}%`, background: over ? 'var(--danger)' : color }}
        />
      </span>
      <span className="bar-value mono">
        {Math.round(value)}{unit ?? ''} <span style={{ color: 'var(--ink-3)' }}>/ {Math.round(target)}{unit ?? ''}</span>
      </span>
    </div>
  );
}
