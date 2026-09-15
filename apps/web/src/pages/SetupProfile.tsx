import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import type { Activity, Sex } from '@vatia/diet-engine';
import { useLocale } from '../i18n/LocaleContext.tsx';
import { useProfile } from '../state/ProfileContext.tsx';

const ACTIVITIES: Activity[] = ['sedentary', 'light', 'moderate', 'active', 'very_active'];

/**
 * Profilo e attività, modificabili dopo il primo avvio — prima
 * l'unico modo per correggere un numero sbagliato era ricominciare da
 * un CSV. Una schermata sola, non il questionario a passi: qui si
 * cambia un valore, non si racconta una storia.
 */
export function SetupProfilePage() {
  const { t } = useLocale();
  const { profile, setProfile } = useProfile();
  const navigate = useNavigate();

  if (!profile) return <Navigate to="/profile" replace />;

  const [sex, setSex] = useState<Sex>(profile.sex);
  const [age, setAge] = useState<number>(profile.age);
  const [weight, setWeight] = useState<number>(profile.weight_kg);
  const [height, setHeight] = useState<number>(profile.height_cm);
  const [activity, setActivity] = useState<Activity>(profile.activity);

  const valido = age >= 12 && age <= 100 && weight >= 30 && weight <= 250 && height >= 130 && height <= 220;

  function salva() {
    if (!valido) return;
    setProfile({ sex, age, weight_kg: weight, height_cm: height, activity });
    navigate(-1);
  }

  return (
    <div className="stack">
      <h1>Profilo e attività</h1>
      <p className="lede">Cambia un valore quando serve — non è un questionario da rifare.</p>

      <div className="ios-group">
        <div className="ios-row af-field">
          <span className="ios-row-title">Sesso</span>
          <select value={sex} onChange={(e) => setSex(e.target.value as Sex)}>
            <option value="male">{t('profile.sex.male')}</option>
            <option value="female">{t('profile.sex.female')}</option>
          </select>
        </div>
        <label className="ios-row af-field">
          <span className="ios-row-title">Età</span>
          <input
            type="number" min={12} max={100} inputMode="numeric"
            value={age}
            onChange={(e) => setAge(Number(e.target.value))}
          />
        </label>
        <label className="ios-row af-field">
          <span className="ios-row-title">Peso</span>
          <span className="af-num">
            <input
              type="number" min={30} max={250} step={0.1} inputMode="decimal"
              value={weight}
              onChange={(e) => setWeight(Number(e.target.value))}
            />
            <span className="af-unit">kg</span>
          </span>
        </label>
        <label className="ios-row af-field">
          <span className="ios-row-title">Altezza</span>
          <span className="af-num">
            <input
              type="number" min={130} max={220} inputMode="numeric"
              value={height}
              onChange={(e) => setHeight(Number(e.target.value))}
            />
            <span className="af-unit">cm</span>
          </span>
        </label>
      </div>

      <div className="section-head" style={{ marginTop: 22 }}>
        <span className="ios-caption">Attività</span>
      </div>
      <div className="ios-group">
        {ACTIVITIES.map((a) => {
          const label = t(`profile.activity.${a}`).split(' (')[0]!;
          const hint = t(`profile.activity.${a}`).includes('(')
            ? t(`profile.activity.${a}`).split(' (')[1]?.replace(')', '')
            : undefined;
          return (
            <button
              key={a}
              type="button"
              className="ios-row"
              onClick={() => setActivity(a)}
            >
              <span className="ios-row-main">
                <span className={`ios-row-title ${activity === a ? 'is-strong' : ''}`}>{label}</span>
                {hint && <span className="ios-row-sub">{hint}</span>}
              </span>
              {activity === a && <span className="setup-check" aria-hidden="true">✓</span>}
            </button>
          );
        })}
      </div>

      <div className="btn-row">
        <button type="button" className="link" onClick={() => navigate(-1)}>Annulla</button>
        <div className="right">
          <button type="button" onClick={salva} disabled={!valido}>Salva</button>
        </div>
      </div>
    </div>
  );
}
