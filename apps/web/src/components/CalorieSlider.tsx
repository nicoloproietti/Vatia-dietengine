import { useEffect, useRef, useState } from 'react';
import { useLocale } from '../i18n/LocaleContext.tsx';

interface Props {
  value: number;
  tdee: number;
  onChange: (kcal: number) => void;
  min?: number;
  max?: number;
}

const KCAL_PER_KG = 7700;
const MAINTAIN_TOL = 50;   // ± around TDEE = maintenance

/**
 * kcal slider ported concept from the gestionale's CalorieSlider.
 * TDEE is shown as an anchor on the track; deficit / surplus zones
 * are colored differently. Big editable number is the source of truth.
 */
export function CalorieSlider({ value, tdee, onChange, min = 800, max = 5000 }: Props) {
  const { t } = useLocale();
  const focused = useRef(false);
  const [local, setLocal] = useState(String(value));

  useEffect(() => {
    if (!focused.current) setLocal(String(value));
  }, [value]);

  const clamp = (n: number) => Math.max(min, Math.min(max, n));
  const pct = (v: number) => Math.max(0, Math.min(100, ((v - min) / (max - min)) * 100));

  const diff = value - tdee;
  const isDeficit = diff < -MAINTAIN_TOL;
  const isSurplus = diff > MAINTAIN_TOL;
  const zone = isDeficit ? 'deficit' : isSurplus ? 'surplus' : 'maintain';
  const monthlyKg = ((Math.abs(diff) * 30) / KCAL_PER_KG).toFixed(1);
  const thumbColor =
    isDeficit ? 'var(--c-carbs)' :   // arancio (deficit)
    isSurplus ? 'var(--accent)'  :   // verde (surplus)
                'var(--ink-3)';      // maintain

  return (
    <div className="cs">
      <div className="cs-value">
        <input
          type="text"
          inputMode="numeric"
          className="cs-input"
          value={local}
          onChange={(e) => {
            const raw = e.target.value.replace(/\D/g, '');
            setLocal(raw);
            if (raw.length > 0) onChange(clamp(Number(raw)));
          }}
          onFocus={(e) => { focused.current = true; e.target.select(); }}
          onBlur={() => {
            focused.current = false;
            const n = clamp(Number(local) || min);
            setLocal(String(n));
            onChange(n);
          }}
          aria-label="Daily kcal"
        />
        <span className="cs-suffix">kcal / giorno</span>
      </div>

      <div className="cs-track">
        <div className="cs-zone cs-zone-deficit" style={{ width: `${pct(tdee)}%` }} />
        <div className="cs-zone cs-zone-surplus" style={{ width: `${100 - pct(tdee)}%` }} />
        <input
          type="range"
          className="cs-range"
          min={min}
          max={max}
          step={10}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          aria-label="Daily kcal slider"
        />
        <div className="cs-tick" style={{ left: `${pct(tdee)}%` }} title={`TDEE ${tdee}`} />
        <div className="cs-thumb-shadow" style={{ left: `${pct(value)}%`, background: thumbColor }} />
      </div>

      <div className="cs-legend">
        <span className="cs-anchor" style={{ left: `${pct(tdee)}%` }}>
          <span className="cs-anchor-label">TDEE</span>
          <span className="cs-anchor-val mono">{tdee}</span>
        </span>
      </div>

      <div className="cs-status">
        <span className={`cs-zone-badge is-${zone}`}>
          {zone === 'deficit' && t('setup.dailyKcal.deficit')}
          {zone === 'surplus' && t('setup.dailyKcal.surplus')}
          {zone === 'maintain' && t('setup.dailyKcal.maintain')}
        </span>
        {zone !== 'maintain' && (
          <span className="small mono">
            {diff > 0 ? '+' : ''}{Math.round(diff)} kcal · ≈{diff > 0 ? '+' : '−'}{monthlyKg} {t('setup.dailyKcal.perMonth')}
          </span>
        )}
      </div>
    </div>
  );
}
