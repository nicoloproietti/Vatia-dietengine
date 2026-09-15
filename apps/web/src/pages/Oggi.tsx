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
import { IconCheckCircle, IconChevronRight } from '../components/Icons.tsx';
import { formatNumber, formatSigned } from '../lib/format.ts';

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

  const indici = Array.from({ length: mealCount }, (_, i) => i);
  const tuttoFatto = indici.every((i) => eaten[i]);
  // ADESSO va sul primo pasto già pronto e non mangiato — non sul primo
  // in assoluto: se hai costruito la cena prima dello spuntino, è la
  // cena quella da mangiare adesso, non uno spuntino che non esiste.
  const prossimoPronto = indici.find((i) => !eaten[i] && dayPlan[i]);

  const data = `${DAYS_IT[giorno]} ${oggi.getDate()} ${MESI[oggi.getMonth()]}`;

  // Contesto settimanale: quanto sei sopra/sotto il piano dal lunedì a
  // oggi, contando solo i giorni in cui hai davvero spuntato qualcosa —
  // altrimenti un giorno mai apparso sembrerebbe un digiuno totale.
  const contestoSettimanale = useMemo(() => {
    let delta = mangiato - daily.kcal;
    for (let offset = 0; offset < giorno; offset++) {
      const d = new Date(oggi);
      d.setDate(oggi.getDate() - (giorno - offset));
      const eatenQuelGiorno = eatenOn(dateKey(d));
      const idxMangiati = Object.keys(eatenQuelGiorno).filter((k) => eatenQuelGiorno[Number(k)]);
      if (idxMangiati.length === 0) continue;
      const pianoQuelGiorno = weekPlan[offset] ?? {};
      const kcalQuelGiorno = idxMangiati.reduce(
        (s, k) => s + (pianoQuelGiorno[Number(k)]?.totals.kcal ?? 0), 0,
      );
      delta += kcalQuelGiorno - daily.kcal;
    }
    return Math.round(delta);
  }, [mangiato, daily.kcal, giorno, oggi, eatenOn, weekPlan]);

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
        {oltre && (
          <p className="oggi-hero-context">
            Sulla settimana sei a {formatSigned(contestoSettimanale)} kcal rispetto al piano.
            Un giorno non cambia il conto.
          </p>
        )}
      </section>

      {/* I pasti */}
      <div className="section-head">
        <span className="ios-caption">I pasti di oggi</span>
      </div>

      <div className="ios-group oggi-meals">
        {Array.from({ length: mealCount }, (_, i) => {
          const pasto = dayPlan[i];
          const fatto = Boolean(eaten[i]);
          const daPreparare = !pasto;
          const isProssimo = i === prossimoPronto;

          // Mangiato: riga sola, si fa da parte — tocca per annullare.
          if (fatto && pasto) {
            return (
              <button
                key={i}
                type="button"
                className="oggi-row is-eaten"
                onClick={() => toggle(key, i)}
              >
                <span className="oggi-row-check"><IconCheckCircle /></span>
                <span className="oggi-row-main">
                  <span className="oggi-row-name">{names[i]}</span>
                  <span className="oggi-row-kcal mono">{formatNumber(pasto.totals.kcal)} kcal</span>
                </span>
                <span className="oggi-row-tag">mangiato</span>
              </button>
            );
          }

          // Da preparare: solo testo in accento e chevron, tutta la riga naviga.
          if (daPreparare) {
            return (
              <button
                key={i}
                type="button"
                className="oggi-row"
                onClick={() => navigate(`/build/${giorno}/${i}`)}
              >
                <span className="oggi-row-main">
                  <span className="oggi-row-name">{names[i]}</span>
                  <span className="oggi-row-prepare">
                    Preparalo · target {formatNumber(targets[i]!.kcal)} kcal
                  </span>
                </span>
                <span className="ios-chevron"><IconChevronRight /></span>
              </button>
            );
          }

          // Pronto da mangiare: superficie di rilievo, etichetta ADESSO
          // solo sul prossimo pasto in ordine, azione piena nella riga.
          // Due bottoni distinti — non uno dentro l'altro — perché il
          // tocco sul testo apre il pasto e il tocco sulla pillola spunta.
          const ingredienti = pasto.items.map((it) => it.food.name).join(', ');
          return (
            <div key={i} className="oggi-row is-ready">
              <button
                type="button"
                className="oggi-row-main-btn"
                onClick={() => navigate(`/build/${giorno}/${i}`)}
              >
                <span className="oggi-row-main">
                  <span className="oggi-row-name-line">
                    <span className="oggi-row-name is-strong">{names[i]}</span>
                    {isProssimo && <span className="oggi-adesso">ADESSO</span>}
                  </span>
                  <span className="oggi-row-kcal mono">
                    {formatNumber(pasto.totals.kcal)} kcal ·{' '}
                    {formatNumber(pasto.totals.protein_g)} P ·{' '}
                    {formatNumber(pasto.totals.carbs_g)} C ·{' '}
                    {formatNumber(pasto.totals.fat_g)} G
                  </span>
                  <span className="oggi-row-ingredienti">{ingredienti}</span>
                </span>
              </button>
              <button type="button" className="oggi-row-cta" onClick={() => toggle(key, i)}>
                L&rsquo;ho mangiato
              </button>
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
        <button type="button" className="ios-row" onClick={() => navigate('/peso')}>
          <span className="ios-row-title">Peso e verifica</span>
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
