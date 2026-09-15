const GROUP_LABEL: Record<string, string> = {
  carne: 'Carne e pesce',
  pesce: 'Carne e pesce',
  cereali: 'Cereali e derivati',
  legumi: 'Legumi',
  latticini: 'Latticini e uova',
  uova: 'Latticini e uova',
  verdura: 'Verdura e frutta',
  frutta: 'Verdura e frutta',
  grassi_condimenti: 'Grassi e condimenti',
  piatti_pronti: 'Piatti pronti',
  dolci_snack: 'Dolci e snack',
  bevande: 'Bevande',
};

const GROUP_ORDER = [
  'Carne e pesce',
  'Cereali e derivati',
  'Legumi',
  'Latticini e uova',
  'Verdura e frutta',
  'Grassi e condimenti',
  'Piatti pronti',
  'Dolci e snack',
  'Bevande',
  'Altro',
];

/** Categoria CREA (stretta) → gruppo della lista della spesa (largo, per lo scaffale). */
export function shoppingGroupLabel(category: string | undefined): string {
  return (category && GROUP_LABEL[category]) ?? 'Altro';
}

export function sortShoppingGroups(labels: string[]): string[] {
  return [...labels].sort((a, b) => GROUP_ORDER.indexOf(a) - GROUP_ORDER.indexOf(b));
}
