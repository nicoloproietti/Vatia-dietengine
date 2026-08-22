interface MacroRingProps {
  label: string;
  value: number;
  target: number;
  color: string;         // CSS var name (--c-kcal) OR any color token
  unit?: string;         // "kcal" default hidden; e.g. "g"
  size?: number;
}

/**
 * Circular macro/kcal ring — ported concept from the gestionale
 * (MealBuilder.jsx MacroRing). SVG is inline; overshoot turns the ring
 * to the danger color.
 */
export function MacroRing({ label, value, target, color, unit, size = 84 }: MacroRingProps) {
  const stroke = 8;
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const pct = target > 0 ? Math.min(value / target, 1) : 0;
  const over = value > target * 1.05;
  const fillColor = over ? 'var(--danger)' : color;

  return (
    <div className="mb-ring">
      <div className="mb-ring-svg" style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <circle
            cx={size / 2} cy={size / 2} r={r}
            fill="none"
            stroke="var(--line)"
            strokeWidth={stroke}
          />
          <circle
            cx={size / 2} cy={size / 2} r={r}
            fill="none"
            stroke={fillColor}
            strokeWidth={stroke}
            strokeDasharray={circ}
            strokeDashoffset={circ * (1 - pct)}
            strokeLinecap="round"
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
            style={{ transition: 'stroke-dashoffset .35s cubic-bezier(.4,0,.2,1), stroke .2s ease' }}
          />
        </svg>
        <div className="mb-ring-center">
          <span className="mb-ring-val" style={{ color: fillColor }}>{Math.round(value)}{unit ?? ''}</span>
          <span className="mb-ring-tgt">/ {Math.round(target)}{unit ?? ''}</span>
        </div>
      </div>
      <span className="mb-ring-label" style={{ color: fillColor }}>{label}</span>
    </div>
  );
}
