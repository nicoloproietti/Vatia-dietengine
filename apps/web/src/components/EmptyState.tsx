interface Props {
  /** Copy that names the concrete next action, e.g. "Nessun pasto ancora
   *  costruito per giovedì. Parti dalla colazione: scegli gli alimenti,
   *  i grammi li calcola Vatia." */
  children: string;
}

/** Dashed-border placeholder that always tells the user what to do next. */
export function EmptyState({ children }: Props) {
  return <div className="empty-state">{children}</div>;
}
