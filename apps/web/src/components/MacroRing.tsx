import { formatNumber } from '../lib/format.ts';

interface MacroRingProps {
  label: string;
  value: number;
  target: number;
  color: string;         // CSS var, e.g. "var(--c-kcal)"
  unit?: string;         // "" for kcal, "g" for macros
  size?: number;
  mobile?: boolean;      // compact variant (64px, per design system)
}

/**
 * Circular macro/kcal ring. Overshoot beyond 5% of target switches the
 * ring, value and label to the danger color — but the delta text below
 * is always shown, so the state reads without relying on color alone.
 */
export function MacroRing({ label, value, target, color, unit = '', size, mobile = false }: MacroRingProps) {
  const boxSize = size ?? (mobile ? 64 : 96);
  const stroke = mobile ? 6 : 8;
  const r = (boxSize - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const pct = target > 0 ? Math.min(value / target, 1) : 0;
  const over = value > target * 1.05;
  const fillColor = over ? 'var(--danger)' : color;

  const deltaPct = target > 0 ? Math.round((value / target - 1) * 100) : 0;
  const deltaText = Math.abs(deltaPct) <= 2 ? 'a target' : (deltaPct > 0 ? `+${deltaPct}%` : `${deltaPct}%`);

  return (
    <div className={`mb-ring ${mobile ? 'is-mobile' : ''}`}>
      <div className="mb-ring-svg" style={{ width: boxSize, height: boxSize }}>
        <svg width={boxSize} height={boxSize} viewBox={`0 0 ${boxSize} ${boxSize}`}>
          <circle
            cx={boxSize / 2} cy={boxSize / 2} r={r}
            fill="none"
            stroke="var(--line)"
            strokeWidth={stroke}
          />
          <circle
            cx={boxSize / 2} cy={boxSize / 2} r={r}
            fill="none"
            stroke={fillColor}
            strokeWidth={stroke}
            strokeDasharray={circ}
            strokeDashoffset={circ * (1 - pct)}
            strokeLinecap="round"
            transform={`rotate(-90 ${boxSize / 2} ${boxSize / 2})`}
            style={{ transition: 'stroke-dashoffset 350ms cubic-bezier(.4,0,.2,1), stroke 200ms ease' }}
          />
        </svg>
        <div className="mb-ring-center">
          <span className="mb-ring-val" style={{ color: fillColor }}>{formatNumber(value)}{unit}</span>
          <span className="mb-ring-tgt">/ {formatNumber(target)}{unit}</span>
        </div>
      </div>
      <span className="mb-ring-label" style={{ color: fillColor }}>{label}</span>
      <span className="mb-ring-delta">{deltaText}</span>
    </div>
  );
}
