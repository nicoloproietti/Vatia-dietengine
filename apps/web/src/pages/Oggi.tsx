import { useMemo } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import {
  DAYS_IT,
  DEFAULT_MEAL_NAMES,
  computeDailyTargets,
  dailyMacrosFromPct,
  dailyMealTargets,
} from '@vatia/diet-engine';
import { useProfile } from '../state/ProfileContext.tsx';
import { usePlan } from '../state/PlanContext.tsx';
import { dateKey, useEaten, weekdayIndex } from '../state/EatenContext.tsx';
import { IconChevronRight } from '../components/Icons.tsx';
import { formatNumber } from '../lib/format.ts';

const MESI = [
  'gennaio', 'febbraio', 'marzo', 'aprile', 'maggio', 'giugno',
  'luglio', 'agosto', 'settembre', 'ottobre', 'novembre', 'dicembre',
];

/**
 * La casa dell'app: cosa mangi oggi, e quanto ti resta.
 *
 * Una domanda per volta, dall'alto in basso. Il pasto da fare adesso è
 * quello in evidenza; gli altri stanno sotto, in chiaro.
 */
export function OggiPage() {
  const { profile } = useProfile();
  const { targetKcal, dailyMacroPct, mealCount, distribution, weekPlan } = usePlan();
  const { eatenOn, toggle } = useEaten();
  const navigate = useNavigate();

  if (!profile) return <Navigate to="/" replace />;

  const oggi = new Date();
  const key = dateKey(oggi);
  const giorno = weekdayIndex(oggi);

  const daily = useMemo(() => {
    const base = computeDailyTargets(profile, targetKcal ?? undefined);
    return { ...base, ...dailyMacrosFromPct(base.kcal, dailyMacroPct) };
  }, [profile, targetKcal, dailyMacroPct]);

  const targets = useMemo(() => dailyMealTargets(daily, distribution), [daily, distribution]);
  const names = DEFAULT_MEAL_NAMES[mealCount] ?? DEFAULT_MEAL_NAMES[3]!;
  const dayPlan = weekPlan[giorno] ?? {};
  const eaten = eatenOn(key);

  // Solo i pasti spuntati contano: è quello che hai mangiato davvero.
  const mangiato = useMemo(() => {
    let kcal = 0;
    for (let i = 0; i < mealCount; i++) {
      if (eaten[i] && dayPlan[i]) kcal += dayPlan[i]!.totals.kcal;
    }
    return Math.round(kcal);
  }, [eaten, dayPlan, mealCount]);

  const restano = Math.max(0, daily.kcal - mangiato);
  const pct = daily.kcal > 0 ? Math.min(100, (mangiato / daily.kcal) * 100) : 0;
  const oltre = mangiato > daily.kcal;

  const prossimo = Array.from({ length: mealCount }, (_, i) => i).find((i) => !eaten[i]);
  const tuttoFatto = prossimo == null;

  const data = `${DAYS_IT[giorno]} ${oggi.getDate()} ${MESI[oggi.getMonth()]}`;

  return (
    <div className="stack">
      <div className="oggi-header">
        <h1 style={{ margin: 0 }}>Oggi</h1>
        <p className="small" style={{ marginTop: 4 }}>{data}</p>
      </div>

      {/* Il numero che conta */}
      <section className="oggi-hero">
        <span className="oggi-hero-label">
          {tuttoFatto ? 'Hai finito la giornata' : oltre ? 'Sei oltre di' : 'Ti restano'}
        </span>
        <span className="oggi-hero-value mono">
          {formatNumber(oltre ? mangiato - daily.kcal : restano)}
          <span className="oggi-hero-unit"> kcal</span>
        </span>
        <span className="oggi-bar">
          <span
            className={`oggi-bar-fill ${oltre ? 'is-over' : ''}`}
            style={{ width: `${oltre ? 100 : pct}%` }}
          />
        </span>
        <span className="oggi-hero-sub mono">
          {formatNumber(mangiato)} / {formatNumber(daily.kcal)} kcal mangiate
        </span>
      </section>

      {/* I pasti */}
      <div className="section-head">
        <span className="ios-caption">I pasti di oggi</span>
      </div>

      <div className="meal-list">
        {Array.from({ length: mealCount }, (_, i) => {
          const pasto = dayPlan[i];
          const fatto = Boolean(eaten[i]);
          const daPreparare = !pasto;
          const isProssimo = i === prossimo;

          return (
            <div key={i} className={`oggi-meal ${fatto ? 'is-eaten' : ''} ${isProssimo ? 'is-next' : ''}`}>
              <button
                type="button"
                className="oggi-meal-main"
                onClick={() => navigate(`/build/${giorno}/${i}`)}
              >
                <span className="ios-row-main">
                  <span className="ios-row-title">{names[i]}</span>
                  <span className="ios-row-sub">
                    {daPreparare
                      ? 'Non l’hai ancora preparato'
                      : fatto
                        ? `Mangiato · ${formatNumber(pasto.totals.kcal)} kcal`
                        : `${formatNumber(pasto.totals.kcal)} kcal · ${pasto.items.length} alimenti`}
                  </span>
                </span>
                <span className="ios-chevron"><IconChevronRight /></span>
              </button>

              {daPreparare ? (
                <button
                  type="button"
                  className="oggi-meal-action is-prepare"
                  onClick={() => navigate(`/build/${giorno}/${i}`)}
                >
                  Preparalo · target {formatNumber(targets[i]!.kcal)} kcal
                </button>
              ) : (
                <button
                  type="button"
                  className={`oggi-meal-action ${fatto ? 'is-done' : ''}`}
                  onClick={() => toggle(key, i)}
                >
                  {fatto ? 'Mangiato' : 'L’ho mangiato'}
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Il resto dell'app, fuori dai piedi */}
      <div className="section-head" style={{ marginTop: 26 }}>
        <span className="ios-caption">Altro</span>
      </div>
      <div className="ios-group">
        <button type="button" className="ios-row" onClick={() => navigate('/piano')}>
          <span className="ios-row-title">Tutta la settimana</span>
          <span className="ios-chevron"><IconChevronRight /></span>
        </button>
        <button type="button" className="ios-row" onClick={() => navigate('/shopping')}>
          <span className="ios-row-title">Lista della spesa</span>
          <span className="ios-chevron"><IconChevronRight /></span>
        </button>
        <button type="button" className="ios-row" onClick={() => navigate('/setup')}>
          <span className="ios-row-title">I tuoi numeri</span>
          <span className="ios-chevron"><IconChevronRight /></span>
        </button>
      </div>
    </div>
  );
}
