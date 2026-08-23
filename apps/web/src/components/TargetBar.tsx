import { formatNumber, formatSigned } from '../lib/format.ts';

interface Props {
  label: string;
  value: number;
  target: number;
  color: string;
  unit?: string;
}

/** Horizontal target-vs-actual bar. Delta is always stated as text, never color-only. */
export function TargetBar({ label, value, target, color, unit = '' }: Props) {
  const pct = target > 0 ? (value / target) * 100 : 0;
  const clamped = Math.min(100, pct);
  const over = pct > 105;
  const delta = target > 0 ? value - target : 0;

  return (
    <div className="bar-row">
      <span className="bar-label">{label}</span>
      <span className="bar-track">
        <span
          className={`bar-fill ${over ? 'is-over' : ''}`}
          style={{ width: `${clamped}%`, background: over ? 'var(--danger)' : color }}
        />
      </span>
      <span className="bar-value mono">
        {formatNumber(value)}{unit} <span style={{ color: 'var(--ink-3)' }}>/ {formatNumber(target)}{unit} · {formatSigned(delta)}{unit}</span>
      </span>
    </div>
  );
}
