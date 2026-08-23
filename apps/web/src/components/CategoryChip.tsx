const CAT_LABEL: Record<string, string> = {
  cereali: 'Cereali', legumi: 'Legumi', carne: 'Carne', pesce: 'Pesce',
  latticini: 'Latticini', uova: 'Uova', grassi_condimenti: 'Grassi',
  verdura: 'Verdura', frutta: 'Frutta', piatti_pronti: 'Piatti pronti',
  dolci_snack: 'Dolci', bevande: 'Bevande', altro: 'Altro',
};

const CAT_KEY: Record<string, string> = {
  cereali: 'cereali', legumi: 'legumi', carne: 'carne', pesce: 'pesce',
  latticini: 'latticini', uova: 'uova', grassi_condimenti: 'grassi',
  verdura: 'verdura', frutta: 'frutta',
};

/**
 * Category pill. Text is `var(--surface)` on every color except
 * cereali/latticini/uova, which need dark ink to hold AA contrast in
 * both themes (those three swatches are light/yellow-ish).
 */
export function CategoryChip({ cat }: { cat?: string | undefined }) {
  if (!cat) return null;
  const key = CAT_KEY[cat] ?? 'altro';
  const label = CAT_LABEL[cat] ?? cat;
  return <span className={`cat-chip cat-${key}`}>{label}</span>;
}
