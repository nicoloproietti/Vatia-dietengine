/**
 * Numeric formatting per the Vatia design system: every number in the UI
 * renders in mono with tabular-nums, thousands grouped by a thin space
 * (U+2009), true minus (U+2212) instead of hyphen-minus, comma decimals
 * (Italian convention). Never render a number in the proportional sans.
 */

const THIN_SPACE = ' ';
const TRUE_MINUS = '−';

export function formatNumber(value: number, decimals = 0): string {
  const negative = value < 0;
  const abs = Math.abs(value);
  const rounded = decimals > 0 ? abs.toFixed(decimals) : String(Math.round(abs));
  const [intPart, decPart] = rounded.split('.');
  const grouped = groupThousands(intPart ?? '0');
  const withDecimals = decPart ? `${grouped},${decPart}` : grouped;
  return negative ? `${TRUE_MINUS}${withDecimals}` : withDecimals;
}

/** Signed variant — always shows a leading + or true minus. */
export function formatSigned(value: number, decimals = 0): string {
  if (value === 0) return formatNumber(0, decimals);
  const formatted = formatNumber(Math.abs(value), decimals);
  return value > 0 ? `+${formatted}` : `${TRUE_MINUS}${formatted}`;
}

function groupThousands(digits: string): string {
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, THIN_SPACE);
}
