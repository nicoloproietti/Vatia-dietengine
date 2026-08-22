import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Activity, Sex } from '@vatia/diet-engine';
import { computeDailyTargets } from '@vatia/diet-engine';
import { useLocale } from '../i18n/LocaleContext.tsx';
import { useProfile, type StoredProfile } from '../state/ProfileContext.tsx';
import { ChoiceList, WizardShell } from '../components/Wizard.tsx';

const ACTIVITIES: Activity[] = ['sedentary', 'light', 'moderate', 'active', 'very_active'];
const TOTAL_STEPS = 4;

export function ProfilePage() {
  const { t } = useLocale();
  const { profile, setProfile } = useProfile();
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
    if (!complete) return;
    setProfile(complete);
    navigate('/setup');
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

  // Step 3 (last): activity + inline review (BMR/TDEE/kcal only, no macros)
  return (
    <WizardShell
      step={3} total={TOTAL_STEPS}
      sectionLabel={t('wizard.section.profile')}
      question={t('wizard.q.activity')}
      canNext={complete != null}
      nextLabel={t('wizard.compute')}
      onBack={back}
      onNext={finish}
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

      {targets && (
        <div style={{ marginTop: 32 }}>
          <div className="wizard-step-meta"><span>{t('targets.title')}</span><span /></div>
          <div className="macro-row" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
            <div><small>{t('targets.bmr')}</small><strong>{targets.bmr.toFixed(0)}</strong></div>
            <div><small>{t('targets.tdee')}</small><strong>{targets.tdee.toFixed(0)}</strong></div>
            <div>
              <small>{t('targets.kcal')} <span style={{ textTransform: 'none' }}>(mant.)</span></small>
              <strong>{targets.kcal.toFixed(0)}</strong>
            </div>
          </div>
        </div>
      )}
    </WizardShell>
  );
}
