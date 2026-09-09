/**
 * Minimal stroke icons in the SF Symbols idiom — 1.9px strokes, round
 * caps, 24px grid. Inline SVG only: no icon font, no external assets.
 */

interface IconProps {
  size?: number;
  filled?: boolean;
}

const base = (size: number) => ({
  width: size,
  height: size,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.9,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
});

/** Piano — calendario settimanale */
export function IconPlan({ size = 25, filled = false }: IconProps) {
  return (
    <svg {...base(size)} strokeWidth={filled ? 2.3 : 1.9}>
      <rect x="3" y="5" width="18" height="16" rx="3.5" />
      <path d="M3 10h18M8 3v4M16 3v4" />
      {filled && <path d="M7.5 14h3M13.5 14h3M7.5 17.5h3M13.5 17.5h3" strokeWidth={1.9} />}
    </svg>
  );
}

/** Impostazioni — cursori */
export function IconSliders({ size = 25, filled = false }: IconProps) {
  return (
    <svg {...base(size)} strokeWidth={filled ? 2.3 : 1.9}>
      <path d="M4 7h9M17 7h3M4 17h3M11 17h9" />
      <circle cx="15" cy="7" r="2.4" fill={filled ? 'currentColor' : 'none'} />
      <circle cx="9" cy="17" r="2.4" fill={filled ? 'currentColor' : 'none'} />
    </svg>
  );
}

/** Spesa — borsa */
export function IconBag({ size = 25, filled = false }: IconProps) {
  return (
    <svg {...base(size)} strokeWidth={filled ? 2.3 : 1.9}>
      <path d="M5 8h14l-1 12.2a1.8 1.8 0 0 1-1.8 1.8H7.8A1.8 1.8 0 0 1 6 20.2z" />
      <path d="M9 8V6.2a3 3 0 0 1 6 0V8" />
    </svg>
  );
}

export function IconChevronLeft({ size = 21 }: IconProps) {
  return (
    <svg {...base(size)} strokeWidth={2.4}>
      <path d="M15 5l-7 7 7 7" />
    </svg>
  );
}

export function IconChevronRight({ size = 19 }: IconProps) {
  return (
    <svg {...base(size)} strokeWidth={2.4}>
      <path d="M9.5 5l7 7-7 7" />
    </svg>
  );
}

export function IconSearch({ size = 18 }: IconProps) {
  return (
    <svg {...base(size)} strokeWidth={2.1}>
      <circle cx="10.5" cy="10.5" r="6.5" />
      <path d="M15.4 15.4L21 21" />
    </svg>
  );
}
