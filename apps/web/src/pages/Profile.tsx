import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Activity, Sex } from '@vatia/diet-engine';
import { computeDailyTargets } from '@vatia/diet-engine';
import { useLocale } from '../i18n/LocaleContext.tsx';
import { useProfile, type StoredProfile } from '../state/ProfileContext.tsx';
import { usePlan } from '../state/PlanContext.tsx';
import { ChoiceList, WizardShell } from '../components/Wizard.tsx';
import { formatNumber } from '../lib/format.ts';

const ACTIVITIES: Activity[] = ['sedentary', 'light', 'moderate', 'active', 'very_active'];
const TOTAL_STEPS = 5;
/** Vatia parte da un deficit moderato, non dal mantenimento — si perde peso solo mangiando meno. */
const STARTING_DEFICIT_RATIO = 0.84;

export function ProfilePage() {
  const { t } = useLocale();
  const { profile, setProfile } = useProfile();
  const { setTargetKcal } = usePlan();
  const navigate = useNavigate();

  const [step, setStep] = useState(0);
  const [sex, setSex] = useState<Sex | null>(profile?.sex ?? null);
  const [age, setAge] = useState<number | ''>(profile?.age ?? '');
  const [weight, setWeight] = useState<number | ''>(profile?.weight_kg ?? '');
  const [height, setHeight] = useState<number | ''>(profile?.height_cm ?? '');
  const [activity, setActivity] = useState<Activity | null>(profile?.activity ?? null);

  const complete: StoredProfile | null = useMemo(() => {
    if (sex && typeof age === 'number' && typeof weight === 'number' && typeof height === 'number' && activity) {
      return { sex, age, weight_kg: weight, height_cm: height, activity };
    }
    return null;
  }, [sex, age, weight, height, activity]);

  const targets = useMemo(
    () => complete ? computeDailyTargets(complete) : null,
    [complete],
  );

  function finish() {
    if (!complete || !targets) return;
    setProfile(complete);
    setTargetKcal(Math.round((targets.tdee * STARTING_DEFICIT_RATIO) / 10) * 10);
    navigate('/oggi');
  }

  const back = step > 0 ? () => setStep(step - 1) : undefined;
  const next = () => setStep((s) => Math.min(TOTAL_STEPS - 1, s + 1));

  // ─── Steps ───────────────────────────────────────────────────────────

  if (step === 0) {
    return (
      <WizardShell
        step={0} total={TOTAL_STEPS}
        sectionLabel={t('wizard.section.profile')}
        question={t('wizard.q.sex')}
        help={t('wizard.q.sex.help')}
        canNext={sex != null}
        onNext={next}
      >
        <ChoiceList<Sex>
          value={sex}
          onChange={setSex}
          options={[
            { value: 'male',   label: t('profile.sex.male') },
            { value: 'female', label: t('profile.sex.female') },
          ]}
        />
      </WizardShell>
    );
  }

  if (step === 1) {
    return (
      <WizardShell
        step={1} total={TOTAL_STEPS}
        sectionLabel={t('wizard.section.profile')}
        question={t('wizard.q.age')}
        canNext={typeof age === 'number' && age >= 12 && age <= 100}
        onBack={back} onNext={next}
      >
        <label>
          <span className="label-text">{t('profile.age')}</span>
          <input
            className="measure-input"
            type="number" min={12} max={100} inputMode="numeric" autoFocus
            value={age}
            onChange={(e) => setAge(e.target.value === '' ? '' : Number(e.target.value))}
          />
        </label>
      </WizardShell>
    );
  }

  if (step === 2) {
    const ok = typeof weight === 'number' && weight >= 30 && weight <= 250
      && typeof height === 'number' && height >= 130 && height <= 220;
    return (
      <WizardShell
        step={2} total={TOTAL_STEPS}
        sectionLabel={t('wizard.section.profile')}
        question={t('wizard.q.body')}
        help={t('wizard.q.body.help')}
        canNext={ok}
        onBack={back} onNext={next}
      >
        <div className="dual-input">
          <label>
            <span className="label-text">{t('profile.weight')}</span>
            <input
              className="measure-input"
              type="number" min={30} max={250} step={0.1} inputMode="decimal" autoFocus
              value={weight}
              onChange={(e) => setWeight(e.target.value === '' ? '' : Number(e.target.value))}
            />
          </label>
          <label>
            <span className="label-text">{t('profile.height')}</span>
            <input
              className="measure-input"
              type="number" min={130} max={220} inputMode="numeric"
              value={height}
              onChange={(e) => setHeight(e.target.value === '' ? '' : Number(e.target.value))}
            />
          </label>
        </div>
      </WizardShell>
    );
  }

  if (step === 3) {
    return (
      <WizardShell
        step={3} total={TOTAL_STEPS}
        sectionLabel={t('wizard.section.profile')}
        question={t('wizard.q.activity')}
        canNext={activity != null}
        onBack={back}
        onNext={next}
      >
        <ChoiceList<Activity>
          value={activity}
          onChange={setActivity}
          options={ACTIVITIES.map((a) => ({
            value: a,
            label: t(`profile.activity.${a}`).split(' (')[0]!,
            hint: t(`profile.activity.${a}`).includes('(')
              ? t(`profile.activity.${a}`).split(' (')[1]?.replace(')', '')
              : undefined,
          }))}
        />
      </WizardShell>
    );
  }

  // Step 4 (last): "Ecco i tuoi numeri" — la revisione, non un'altra domanda.
  const startingKcal = targets ? Math.round((targets.tdee * STARTING_DEFICIT_RATIO) / 10) * 10 : 0;
  return (
    <WizardShell
      step={4} total={TOTAL_STEPS}
      sectionLabel={t('wizard.section.profile')}
      question={t('wizard.review')}
      help="Calcolati con Mifflin-St Jeor. Sono una stima: nelle prime settimane il peso reale dirà se è giusta."
      canNext={complete != null}
      nextLabel="Comincia"
      onBack={back}
      onNext={finish}
    >
      {targets && (
        <>
          <div className="ios-group setup-card">
            <div className="setup-card-row">
              <span>Metabolismo basale</span>
              <span className="mono is-strong">{formatNumber(targets.bmr)}</span>
            </div>
            <p className="setup-card-note">Quel che consumi restando a letto tutto il giorno</p>
          </div>
          <div className="ios-group setup-card" style={{ marginTop: 12 }}>
            <div className="setup-card-row">
              <span>Consumo giornaliero</span>
              <span className="mono is-strong" style={{ color: 'var(--accent)' }}>{formatNumber(targets.tdee)}</span>
            </div>
            <p className="setup-card-note">
              {formatNumber(targets.bmr)} × {formatNumber(targets.tdee / targets.bmr, 2)} per l'attività dichiarata
            </p>
          </div>
          <div className="ios-group setup-card" style={{ marginTop: 12 }}>
            <div className="setup-card-row">
              <span>Per restare uguale</span>
              <span className="mono is-strong">{formatNumber(targets.tdee)}</span>
            </div>
            <p className="setup-card-note">Mangiare meno fa scendere il peso, mangiare più lo fa salire. Quanto meno lo decidi tu.</p>
          </div>
          <p className="wizard-help" style={{ marginTop: 20 }}>
            Vatia parte da <span className="mono" style={{ color: 'var(--ink)' }}>{formatNumber(startingKcal)} kcal</span>, un deficit moderato.
            Lo cambi quando vuoi da &ldquo;I tuoi numeri&rdquo;.
          </p>
        </>
      )}
    </WizardShell>
  );
}
