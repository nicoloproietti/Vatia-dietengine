import { dailyMacrosFromPct, type MacroPct } from '@vatia/diet-engine';
import { useLocale } from '../i18n/LocaleContext.tsx';
import { formatNumber } from '../lib/format.ts';

interface Props {
  value: MacroPct;
  kcal: number;
  onChange: (next: MacroPct) => void;
}

/**
 * Daily macro split — % Proteine / % Carbo / % Grassi with a segmented
 * bar preview and live grams derived from kcal. Ported concept from the
 * gestionale (src/components/MacroSplit.jsx), adapted to the fruit-veg
 * palette.
 */
export function MacroSplit({ value, kcal, onChange }: Props) {
  const { t } = useLocale();
  const grams = dailyMacrosFromPct(kcal, value);
  const total = value.protein + value.carbs + value.fat;
  const state = total === 100 ? 'ok' : total > 100 ? 'over' : 'under';
  const segDenom = Math.max(total, 1);

  function set(k: keyof MacroPct, raw: number) {
    const v = Math.max(0, Math.min(100, Math.round(raw) || 0));
    onChange({ ...value, [k]: v });
  }

  const config: Array<{ k: keyof MacroPct; label: string; color: string; g: number }> = [
    { k: 'protein', label: t('setup.macro.protein'), color: 'var(--c-protein)', g: grams.protein_g },
    { k: 'carbs',   label: t('setup.macro.carbs'),   color: 'var(--c-carbs)',   g: grams.carbs_g   },
    { k: 'fat',     label: t('setup.macro.fat'),     color: 'var(--c-fat)',     g: grams.fat_g     },
  ];

  return (
    <div className="ms">
      {/* Segmented preview bar */}
      <div className="ms-bar" role="img" aria-label="Macro split preview">
        {config.map((c) => (
          <div
            key={c.k}
            className="ms-bar-seg"
            style={{ width: `${(value[c.k] / segDenom) * 100}%`, background: c.color }}
            title={`${c.label}: ${value[c.k]}%`}
          />
        ))}
      </div>

      {/* Rows */}
      <div className="ms-rows">
        {config.map((c) => (
          <div key={c.k} className="ms-row">
            <span className="ms-dot" style={{ background: c.color }} />
            <span className="ms-name" style={{ color: c.color }}>{c.label}</span>
            <input
              type="number" min={0} max={100}
              className="ms-pct-input"
              value={value[c.k]}
              onChange={(e) => set(c.k, Number(e.target.value))}
              aria-label={`% ${c.label}`}
            />
            <span className="ms-pct-suffix">%</span>
            <span className="ms-grams mono">{formatNumber(c.g)} g</span>
          </div>
        ))}
      </div>

      {/* Total badge */}
      <div className="ms-total">
        <div className={`ms-total-fill is-${state}`} style={{ width: `${Math.min(100, total)}%` }} />
        <span className={`ms-total-badge is-${state}`}>
          {state === 'ok' && 'Somma 100% — a posto'}
          {state === 'over' && `Somma ${total}% — eccedono ${total - 100} punti`}
          {state === 'under' && `Somma ${total}% — mancano ${100 - total} punti`}
        </span>
      </div>
    </div>
  );
}
