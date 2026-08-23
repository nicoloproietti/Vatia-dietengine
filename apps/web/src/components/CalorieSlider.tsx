import { useEffect, useRef, useState } from 'react';
import { useLocale } from '../i18n/LocaleContext.tsx';
import { formatNumber, formatSigned } from '../lib/format.ts';

interface Props {
  value: number;
  tdee: number;
  bmr: number;
  onChange: (kcal: number) => void;
}

const MIN = 1200;
const MAX = 3600;
const ZONE_GAP = 100;      // neutral half-width either side of TDEE (200 kcal total)
const ZONE_THRESHOLD = 80; // ± around TDEE that still counts as maintenance
const KCAL_PER_KG = 7700;

/**
 * kcal slider — Vatia design system spec. TDEE is anchored on the track
 * with a 200 kcal neutral gap either side (deficit ends at TDEE−100,
 * surplus starts at TDEE+100); the big editable number is the source of
 * truth, the range input is the drag surface.
 */
export function CalorieSlider({ value, tdee, bmr, onChange }: Props) {
  const { t } = useLocale();
  const focused = useRef(false);
  const [local, setLocal] = useState(String(value));

  useEffect(() => {
    if (!focused.current) setLocal(String(value));
  }, [value]);

  const clamp = (n: number) => Math.max(MIN, Math.min(MAX, n));
  const pos = (v: number) => Math.max(0, Math.min(100, ((v - MIN) / (MAX - MIN)) * 100));

  const diff = value - tdee;
  const isDeficit = diff < -ZONE_THRESHOLD;
  const isSurplus = diff > ZONE_THRESHOLD;
  const zone = isDeficit ? 'deficit' : isSurplus ? 'surplus' : 'maintain';
  const monthlyKg = ((diff * 7) / KCAL_PER_KG) * 30;
  const zoneColor =
    isDeficit ? 'var(--c-carbs)' :
    isSurplus ? 'var(--accent)' :
                'var(--ink-3)';

  const deficitWidth = pos(tdee - ZONE_GAP);
  const surplusWidth = 100 - pos(tdee + ZONE_GAP);

  return (
    <div className="cs">
      <span className="cs-eyebrow mono">Slider kcal · TDEE come riferimento</span>
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
            const n = clamp(Number(local) || MIN);
            setLocal(String(n));
            onChange(n);
          }}
          aria-label="Calorie al giorno"
        />
        <span className="cs-suffix">kcal / giorno</span>
      </div>

      <div className="cs-track">
        <div className="cs-zone cs-zone-deficit" style={{ width: `${deficitWidth}%` }} />
        <div className="cs-zone cs-zone-surplus" style={{ width: `${surplusWidth}%` }} />
        <input
          type="range"
          className="cs-range"
          min={MIN}
          max={MAX}
          step={10}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          aria-label="Calorie al giorno"
        />
        <div className="cs-tick" style={{ left: `${pos(tdee)}%` }} title={`TDEE ${tdee}`} />
        <div className="cs-thumb-shadow" style={{ left: `${pos(value)}%`, background: zoneColor }} />
      </div>

      <div className="cs-status">
        <span className={`cs-zone-badge is-${zone}`} style={{ color: zoneColor }}>
          {zone === 'deficit' && t('setup.dailyKcal.deficit')}
          {zone === 'surplus' && t('setup.dailyKcal.surplus')}
          {zone === 'maintain' && t('setup.dailyKcal.maintain')}
        </span>
        <span className="small mono">
          {formatSigned(diff)} kcal vs TDEE · stima {formatSigned(monthlyKg, 1)} kg / mese
        </span>
        <span className="small mono cs-anchor-right">
          TDEE {formatNumber(tdee)} · BMR {formatNumber(bmr)}
        </span>
      </div>
    </div>
  );
}
