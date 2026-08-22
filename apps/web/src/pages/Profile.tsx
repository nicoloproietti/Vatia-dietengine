import { useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Activity, Goal, Sex } from '@vatia/diet-engine';
import { computeDailyTargets } from '@vatia/diet-engine';
import { useLocale } from '../i18n/LocaleContext.tsx';
import { useProfile, type StoredProfile } from '../state/ProfileContext.tsx';
import { ChoiceList, WizardShell } from '../components/Wizard.tsx';
import { csvToProfile, downloadText, profileToCsv } from '../lib/csv.ts';

const ACTIVITIES: Activity[] = ['sedentary', 'light', 'moderate', 'active', 'very_active'];
const GOALS: Goal[] = ['lose', 'maintain', 'gain'];
const TOTAL_STEPS = 6;

export function ProfilePage() {
  const { t } = useLocale();
  const { profile, setProfile } = useProfile();
  const navigate = useNavigate();
  const fileRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState(0);
  const [sex, setSex] = useState<Sex | null>(profile?.sex ?? null);
  const [age, setAge] = useState<number | ''>(profile?.age ?? '');
  const [weight, setWeight] = useState<number | ''>(profile?.weight_kg ?? '');
  const [height, setHeight] = useState<number | ''>(profile?.height_cm ?? '');
  const [activity, setActivity] = useState<Activity | null>(profile?.activity ?? null);
  const [goal, setGoal] = useState<Goal | null>(profile?.goal ?? null);
  const [excludes, setExcludes] = useState<string>(profile?.excludes.join(', ') ?? '');

  const complete: StoredProfile | null = useMemo(() => {
    if (sex && typeof age === 'number' && typeof weight === 'number' && typeof height === 'number' && activity && goal) {
      return {
        sex, age, weight_kg: weight, height_cm: height, activity, goal,
        excludes: excludes.split(',').map((s) => s.trim()).filter(Boolean),
      };
    }
    return null;
  }, [sex, age, weight, height, activity, goal, excludes]);

  const targets = useMemo(
    () => complete ? computeDailyTargets(complete) : null,
    [complete],
  );

  function finish() {
    if (!complete) return;
    setProfile(complete);
    navigate('/setup');
  }

  function onExport() {
    if (complete) downloadText('vatia-profile.csv', profileToCsv(complete));
  }
  async function onImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const p = csvToProfile(await file.text());
      setSex(p.sex); setAge(p.age); setWeight(p.weight_kg); setHeight(p.height_cm);
      setActivity(p.activity); setGoal(p.goal);
      setExcludes(p.excludes.join(', '));
      setProfile(p);
      setStep(TOTAL_STEPS - 1); // jump to review
    } catch { alert(t('error.generic')); }
    if (fileRef.current) fileRef.current.value = '';
  }

  const back = step > 0 ? () => setStep(step - 1) : undefined;
  const next = () => setStep((s) => Math.min(TOTAL_STEPS - 1, s + 1));

  // ─── Step content ─────────────────────────────────────────────────────

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
          onChange={(v) => { setSex(v); }}
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
        onBack={back} onNext={next}
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

  if (step === 4) {
    return (
      <WizardShell
        step={4} total={TOTAL_STEPS}
        sectionLabel={t('wizard.section.profile')}
        question={t('wizard.q.goal')}
        canNext={goal != null}
        onBack={back} onNext={next}
      >
        <ChoiceList<Goal>
          value={goal}
          onChange={setGoal}
          options={GOALS.map((g) => ({
            value: g,
            label: t(`profile.goal.${g}`).split(' (')[0]!,
            hint: t(`profile.goal.${g}`).includes('(')
              ? t(`profile.goal.${g}`).split(' (')[1]?.replace(')', '')
              : undefined,
          }))}
        />
      </WizardShell>
    );
  }

  // Step 5: excludes + review + finish
  return (
    <WizardShell
      step={5} total={TOTAL_STEPS}
      sectionLabel={t('wizard.section.profile')}
      question={t('wizard.q.excludes')}
      help={t('wizard.q.excludes.help')}
      canNext={complete != null}
      nextLabel={t('wizard.compute')}
      onBack={back}
      onNext={finish}
    >
      <label>
        <span className="label-text">{t('profile.exclude')}</span>
        <input
          type="text"
          placeholder={t('exclude.example')}
          value={excludes}
          onChange={(e) => setExcludes(e.target.value)}
        />
      </label>

      {targets && (
        <div style={{ marginTop: 32 }}>
          <div className="wizard-step-meta"><span>{t('targets.title')}</span><span /></div>
          <div className="macro-row">
            <div><small>{t('targets.bmr')}</small><strong>{targets.bmr.toFixed(0)}</strong></div>
            <div><small>{t('targets.tdee')}</small><strong>{targets.tdee.toFixed(0)}</strong></div>
            <div><small>{t('targets.kcal')}</small><strong>{targets.kcal.toFixed(0)}</strong></div>
            <div>
              <small>P · C · F</small>
              <strong className="mono">{targets.protein_g}/{targets.carbs_g}/{targets.fat_g}</strong>
              <span className="sub">g</span>
            </div>
          </div>
          <p className="small" style={{ marginTop: 12 }}>{t('targets.formula_note')}</p>

          <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
            <button type="button" className="ghost" onClick={onExport}>{t('profile.export')}</button>
            <button type="button" className="ghost" onClick={() => fileRef.current?.click()}>{t('profile.import')}</button>
            <input ref={fileRef} type="file" accept=".csv,text/csv" hidden onChange={onImport} />
          </div>
        </div>
      )}
    </WizardShell>
  );
}
