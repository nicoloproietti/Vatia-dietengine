import { useMemo, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import {
  DAYS_IT,
  DEFAULT_MEAL_NAMES,
  computeDailyTargets,
  dailyMacrosFromPct,
  dailyMealTargets,
  dayTotals,
} from '@vatia/diet-engine';
import { useLocale } from '../i18n/LocaleContext.tsx';
import { useProfile } from '../state/ProfileContext.tsx';
import { usePlan } from '../state/PlanContext.tsx';
import { dateKey, useEaten, weekdayIndex } from '../state/EatenContext.tsx';
import { DaySelector } from '../components/DaySelector.tsx';
import { IconChevronRight } from '../components/Icons.tsx';
import { formatNumber } from '../lib/format.ts';

const LETTERE = DAYS_IT.map((d) => d[0]!);

/**
 * La settimana: dove si costruisce il piano, non dove si vive — quello
 * è Oggi. Selettore a lettera singola, la card dei totali del giorno
 * in alto, i pasti come righe di navigazione.
 */
export function PianoPage() {
  const { t } = useLocale();
  const { profile } = useProfile();
  const { targetKcal, dailyMacroPct, mealCount, distribution, weekPlan, copyDayToWeek, clearWeek } = usePlan();
  const { eatenOn } = useEaten();
  const navigate = useNavigate();

  if (!profile) return <Navigate to="/" replace />;

  const daily = useMemo(() => {
    const base = computeDailyTargets(profile, targetKcal ?? undefined);
    return { ...base, ...dailyMacrosFromPct(base.kcal, dailyMacroPct) };
  }, [profile, targetKcal, dailyMacroPct]);

  const targets = useMemo(() => dailyMealTargets(daily, distribution), [daily, distribution]);
  const names = DEFAULT_MEAL_NAMES[mealCount] ?? DEFAULT_MEAL_NAMES[3]!;

  const [activeDay, setActiveDay] = useState(weekdayIndex());
  const dayPlan = weekPlan[activeDay] ?? {};
  const dayTotal = useMemo(() => dayTotals(dayPlan), [dayPlan]);

  const doneByDay = useMemo(
    () => DAYS_IT.map((_, i) => Object.keys(weekPlan[i] ?? {}).length > 0),
    [weekPlan],
  );

  const isOggi = activeDay === weekdayIndex();
  const eatenOggi = isOggi ? eatenOn(dateKey()) : {};

  return (
    <div className="stack">
      <DaySelector letters={LETTERE} value={activeDay} onChange={setActiveDay} doneByDay={doneByDay} />

      <h2 style={{ marginTop: 14 }}>{DAYS_IT[activeDay]}</h2>

      {/* ── Totali del giorno: una card sola, quattro barre ── */}
      <section className="week-totals">
        <div className="week-totals-head">
          <span>Totali del giorno</span>
          <span className="mono">{formatNumber(dayTotal.kcal)} / {formatNumber(daily.kcal)} kcal</span>
        </div>
        <MiniBar label="kcal"        value={dayTotal.kcal}      target={daily.kcal}      color="var(--c-kcal)" />
        <MiniBar label="proteine"    value={dayTotal.protein_g} target={daily.protein_g} color="var(--c-protein)" unit=" g" />
        <MiniBar label="carboidrati" value={dayTotal.carbs_g}   target={daily.carbs_g}   color="var(--c-carbs)"   unit=" g" />
        <MiniBar label="grassi"      value={dayTotal.fat_g}     target={daily.fat_g}     color="var(--c-fat)"     unit=" g" />
      </section>

      {/* ── Pasti: righe di navigazione, non azioni ── */}
      <div className="section-head" style={{ marginTop: 22 }}>
        <span className="ios-caption">Pasti</span>
      </div>
      <div className="ios-group">
        {Array.from({ length: mealCount }, (_, mi) => {
          const target = targets[mi]!;
          const saved = dayPlan[mi];
          const fatto = Boolean(isOggi && eatenOggi[mi]);
          const sottotitolo = !saved
            ? `Da costruire · target ${formatNumber(target.kcal)} kcal`
            : saved.items.map((it) => it.food.name).join(', ');
          return (
            <button
              key={mi}
              type="button"
              className="ios-row"
              onClick={() => navigate(`/build/${activeDay}/${mi}`)}
            >
              <span className="ios-row-main">
                <span className="ios-row-title">{names[mi]}</span>
                {!saved ? (
                  <span className="ios-row-sub" style={{ color: 'var(--accent)' }}>{sottotitolo}</span>
                ) : (
                  <span className="ios-row-sub">{sottotitolo}</span>
                )}
              </span>
              {saved && (
                <span className="ios-row-value mono" style={fatto ? { color: 'var(--ink-3)' } : undefined}>
                  {formatNumber(saved.totals.kcal)}
                </span>
              )}
              <span className="ios-chevron"><IconChevronRight /></span>
            </button>
          );
        })}
      </div>

      <div className="btn-row-center">
        <button
          type="button"
          className="secondary"
          onClick={() => copyDayToWeek(activeDay)}
          disabled={Object.keys(dayPlan).length === 0}
        >
          Copia {DAYS_IT[activeDay]!.toLowerCase()} su tutta la settimana
        </button>
      </div>

      <div className="btn-row-center">
        <button
          type="button"
          className="ghost danger"
          onClick={() => { if (confirm('Sicuro? Svuota tutti i pasti della settimana.')) clearWeek(); }}
        >
          {t('week.clearWeek')}
        </button>
      </div>
    </div>
  );
}

function MiniBar({ label, value, target, color, unit = '' }: {
  label: string; value: number; target: number; color: string; unit?: string;
}) {
  const pct = target > 0 ? Math.min(100, (value / target) * 100) : 0;
  return (
    <div className="week-bar">
      <div className="week-bar-head">
        <span>{label}</span>
        <span className="mono">{formatNumber(value)}{target > 0 ? ` / ${formatNumber(target)}${unit}` : unit}</span>
      </div>
      <div className="week-bar-track">
        <div className="week-bar-fill" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  );
}
