import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Activity, Goal, Profile, Sex } from '@vatia/diet-engine';
import { computeDailyTargets } from '@vatia/diet-engine';
import { useLocale } from '../i18n/LocaleContext.tsx';
import { useProfile } from '../state/ProfileContext.tsx';
import { csvToProfile, downloadText, profileToCsv } from '../lib/csv.ts';

const ACTIVITIES: Activity[] = ['sedentary', 'light', 'moderate', 'active', 'very_active'];
const GOALS: Goal[] = ['lose', 'maintain', 'gain'];

export function ProfilePage() {
  const { t } = useLocale();
  const { profile, setProfile } = useProfile();
  const navigate = useNavigate();
  const fileRef = useRef<HTMLInputElement>(null);

  const [sex, setSex] = useState<Sex>(profile?.sex ?? 'male');
  const [age, setAge] = useState<number>(profile?.age ?? 30);
  const [weight, setWeight] = useState<number>(profile?.weight_kg ?? 75);
  const [height, setHeight] = useState<number>(profile?.height_cm ?? 175);
  const [activity, setActivity] = useState<Activity>(profile?.activity ?? 'moderate');
  const [goal, setGoal] = useState<Goal>(profile?.goal ?? 'maintain');
  const [excludes, setExcludes] = useState<string>(profile?.excludes.join(', ') ?? '');

  const built: Profile = { sex, age, weight_kg: weight, height_cm: height, activity, goal };
  const targets = computeDailyTargets(built);

  function save(e: React.FormEvent) {
    e.preventDefault();
    setProfile({
      ...built,
      excludes: excludes.split(',').map((s) => s.trim()).filter(Boolean),
    });
    navigate('/meal');
  }

  function onExport() {
    if (!profile) {
      setProfile({
        ...built,
        excludes: excludes.split(',').map((s) => s.trim()).filter(Boolean),
      });
    }
    downloadText(
      'vatia-profile.csv',
      profileToCsv({
        ...built,
        excludes: excludes.split(',').map((s) => s.trim()).filter(Boolean),
      }),
    );
  }

  async function onImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    try {
      const p = csvToProfile(text);
      setSex(p.sex); setAge(p.age); setWeight(p.weight_kg); setHeight(p.height_cm);
      setActivity(p.activity); setGoal(p.goal);
      setExcludes(p.excludes.join(', '));
      setProfile(p);
    } catch {
      alert(t('error.generic'));
    }
    if (fileRef.current) fileRef.current.value = '';
  }

  return (
    <form className="stack" onSubmit={save}>
      <h1>{t('profile.title')}</h1>
      <p className="small">{t('profile.subtitle')}</p>

      <div className="card">
        <div className="grid-2">
          <label>
            <span>{t('profile.sex')}</span>
            <select value={sex} onChange={(e) => setSex(e.target.value as Sex)}>
              <option value="male">{t('profile.sex.male')}</option>
              <option value="female">{t('profile.sex.female')}</option>
            </select>
          </label>
          <label>
            <span>{t('profile.age')}</span>
            <input type="number" min={15} max={100} value={age} onChange={(e) => setAge(+e.target.value)} />
          </label>
          <label>
            <span>{t('profile.weight')}</span>
            <input type="number" min={30} max={250} step={0.1} value={weight} onChange={(e) => setWeight(+e.target.value)} />
          </label>
          <label>
            <span>{t('profile.height')}</span>
            <input type="number" min={130} max={220} value={height} onChange={(e) => setHeight(+e.target.value)} />
          </label>
          <label>
            <span>{t('profile.activity')}</span>
            <select value={activity} onChange={(e) => setActivity(e.target.value as Activity)}>
              {ACTIVITIES.map((a) => (
                <option key={a} value={a}>{t(`profile.activity.${a}`)}</option>
              ))}
            </select>
          </label>
          <label>
            <span>{t('profile.goal')}</span>
            <select value={goal} onChange={(e) => setGoal(e.target.value as Goal)}>
              {GOALS.map((g) => (
                <option key={g} value={g}>{t(`profile.goal.${g}`)}</option>
              ))}
            </select>
          </label>
        </div>
        <label style={{ marginTop: '0.9rem' }}>
          <span>{t('profile.exclude')}</span>
          <input
            type="text"
            placeholder={t('exclude.example')}
            value={excludes}
            onChange={(e) => setExcludes(e.target.value)}
          />
        </label>
      </div>

      <div className="card">
        <h2>{t('targets.title')}</h2>
        <div className="macro-row">
          <div><small>{t('targets.bmr')}</small><strong>{targets.bmr.toFixed(0)}</strong></div>
          <div><small>{t('targets.tdee')}</small><strong>{targets.tdee.toFixed(0)}</strong></div>
          <div><small>{t('targets.kcal')}</small><strong>{targets.kcal.toFixed(0)}</strong></div>
          <div>
            <small>{t('targets.protein')} · {t('targets.carbs')} · {t('targets.fat')}</small>
            <strong>{targets.protein_g}/{targets.carbs_g}/{targets.fat_g} g</strong>
          </div>
        </div>
        <p className="small" style={{ marginTop: '0.8rem' }}>{t('targets.formula_note')}</p>
      </div>

      <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
        <button type="submit">{t('profile.save')}</button>
        <button type="button" className="secondary" onClick={onExport}>{t('profile.export')}</button>
        <button type="button" className="secondary" onClick={() => fileRef.current?.click()}>
          {t('profile.import')}
        </button>
        <input ref={fileRef} type="file" accept=".csv,text/csv" hidden onChange={onImport} />
      </div>
    </form>
  );
}
