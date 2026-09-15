import { useEffect, useMemo, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import {
  ACTIVITY_MULTIPLIER,
  bmrMifflinStJeor,
  computeDailyTargets,
  dailyMacrosFromPct,
} from '@vatia/diet-engine';
import { useLocale } from '../i18n/LocaleContext.tsx';
import { useProfile } from '../state/ProfileContext.tsx';
import { usePlan } from '../state/PlanContext.tsx';
import { useFoods } from '../state/FoodsContext.tsx';
import { CalorieSlider } from '../components/CalorieSlider.tsx';
import { MacroSplit } from '../components/MacroSplit.tsx';
import { MealStepper } from '../components/MealStepper.tsx';
import { RestoreBackup } from '../components/RestoreBackup.tsx';
import { Drawer } from '../components/Drawer.tsx';
import { IconChevronRight } from '../components/Icons.tsx';
import { backupFilename, buildBackup, describeLastBackup, markBackedUp, shareBackup } from '../lib/backup.ts';
import { formatNumber } from '../lib/format.ts';

const MEAL_OPTIONS = [2, 3, 4, 5, 6];

/**
 * "I tuoi numeri" — l'hub delle impostazioni, non un questionario da
 * scorrere. In cima quello che si guarda spesso (fabbisogno, kcal del
 * giorno, macro); sotto una lista di righe verso quello che si tocca
 * una volta sola (profilo, avanzate, i tuoi alimenti, backup).
 */
export function SetupPage() {
  const { t } = useLocale();
  const { profile } = useProfile();
  const { targetKcal, setTargetKcal, dailyMacroPct, setDailyMacroPct, mealCount, setMealCount, snapshot } = usePlan();
  const { customFoods } = useFoods();
  const [backupInfo, setBackupInfo] = useState(describeLastBackup);
  const [mealCountOpen, setMealCountOpen] = useState(false);
  const navigate = useNavigate();

  if (!profile) return <Navigate to="/profile" replace />;

  const bmr = useMemo(() => Math.round(bmrMifflinStJeor(profile)), [profile]);
  const tdee = useMemo(() => Math.round(bmr * ACTIVITY_MULTIPLIER[profile.activity]), [bmr, profile.activity]);

  // La prima volta che si arriva qui, si parte dal TDEE.
  useEffect(() => {
    if (targetKcal == null) setTargetKcal(tdee);
  }, [targetKcal, tdee, setTargetKcal]);

  const kcal = targetKcal ?? tdee;
  const daily = useMemo(() => {
    const base = computeDailyTargets(profile, kcal);
    return { ...base, ...dailyMacrosFromPct(kcal, dailyMacroPct) };
  }, [profile, kcal, dailyMacroPct]);

  const attivitaLabel = t(`profile.activity.${profile.activity}`).split(' (')[0];
  const moltiplicatore = ACTIVITY_MULTIPLIER[profile.activity];
  const formula = profile.sex === 'male'
    ? `10 × ${profile.weight_kg} kg + 6,25 × ${profile.height_cm} cm − 5 × ${profile.age} anni + 5`
    : `10 × ${profile.weight_kg} kg + 6,25 × ${profile.height_cm} cm − 5 × ${profile.age} anni − 161`;

  return (
    <div className="stack">
      <h1>{t('setup.title')}</h1>

      {/* ── Fabbisogno ── */}
      <section className="ios-group setup-card">
        <div className="setup-card-row">
          <span>BMR · Mifflin-St Jeor</span>
          <span className="mono">{formatNumber(bmr)} kcal</span>
        </div>
        <div className="setup-card-row">
          <span>TDEE · attività {attivitaLabel?.toLowerCase()} ×{formatNumber(moltiplicatore, 2)}</span>
          <span className="mono is-strong">{formatNumber(tdee)} kcal</span>
        </div>
        <p className="setup-card-note">{formula}</p>
      </section>

      {/* ── Quanto mangi al giorno ── */}
      <div className="section-head" style={{ marginTop: 22 }}>
        <span className="ios-caption">{t('setup.dailyKcal')}</span>
      </div>
      <CalorieSlider value={kcal} tdee={tdee} bmr={bmr} onChange={setTargetKcal} />

      {/* ── Come dividi i macro ── */}
      <div className="section-head" style={{ marginTop: 22 }}>
        <span className="ios-caption">{t('setup.macroPct.title')}</span>
        <span className="ios-caption mono">
          {formatNumber(daily.protein_g)} · {formatNumber(daily.carbs_g)} · {formatNumber(daily.fat_g)} g
        </span>
      </div>
      <MacroSplit value={dailyMacroPct} kcal={kcal} onChange={setDailyMacroPct} />

      {/* ── Il resto: righe verso quello che si tocca una volta ── */}
      <div className="section-head" style={{ marginTop: 22 }}>
        <span className="ios-caption">Altro</span>
      </div>
      <div className="ios-group">
        <button type="button" className="ios-row" onClick={() => setMealCountOpen(true)}>
          <span className="ios-row-title">{t('setup.mealCount')}</span>
          <span className="ios-row-value mono">{mealCount}</span>
          <span className="ios-chevron"><IconChevronRight /></span>
        </button>
        <button type="button" className="ios-row" onClick={() => navigate('/setup/alimenti')}>
          <span className="ios-row-title">I tuoi alimenti</span>
          <span className="ios-row-value mono">{formatNumber(customFoods.length)}</span>
          <span className="ios-chevron"><IconChevronRight /></span>
        </button>
        <button type="button" className="ios-row" onClick={() => navigate('/setup/profilo')}>
          <span className="ios-row-title">Profilo e attività</span>
          <span className="ios-chevron"><IconChevronRight /></span>
        </button>
        <button type="button" className="ios-row" onClick={() => navigate('/setup/avanzate')}>
          <span className="ios-row-main">
            <span className="ios-row-title">Avanzate</span>
            <span className="ios-row-sub">peso dei pasti, macro per pasto</span>
          </span>
          <span className="ios-chevron"><IconChevronRight /></span>
        </button>
      </div>

      {/* ── Backup ── */}
      <div className="section-head" style={{ marginTop: 22 }}>
        <span className="ios-caption">Backup</span>
      </div>
      <div className="ios-group">
        <div className="ios-row">
          <span className="ios-row-main">
            <span className="ios-row-title">I dati sono su questo telefono</span>
            <span className="ios-row-sub">
              Vatia li ricorda da sola. Il backup salva profilo, settimana e i tuoi
              alimenti in un file: su iPhone scegli iCloud Drive e lo ritrovi su
              qualsiasi dispositivo. {backupInfo}
            </span>
          </span>
        </div>
        <button
          type="button"
          className="ios-row is-action"
          onClick={async () => {
            const data = buildBackup(profile, snapshot(), customFoods);
            await shareBackup(backupFilename(), JSON.stringify(data, null, 2));
            markBackedUp();
            setBackupInfo(describeLastBackup());
          }}
        >
          Salva un backup
        </button>
        <RestoreBackup label="Ripristina da un backup" className="ios-row is-action" />
      </div>

      <Drawer open={mealCountOpen} onClose={() => setMealCountOpen(false)} title={t('setup.mealCount')}>
        <MealStepper value={mealCount} options={MEAL_OPTIONS} onChange={(n) => { setMealCount(n); setMealCountOpen(false); }} />
        <p className="small" style={{ marginTop: 12 }}>{t('setup.mealCount.hint')}</p>
      </Drawer>
    </div>
  );
}
