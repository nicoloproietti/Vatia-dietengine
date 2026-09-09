import { useCallback } from 'react';
import { messages } from './messages.ts';

/**
 * Vatia è in italiano e basta — niente selettore lingua, niente stato.
 * Resta un `t()` come unico punto di accesso alle stringhe, così i testi
 * dell'interfaccia vivono in un file solo invece che sparsi nel JSX.
 */
export function useLocale(): { t: (key: string) => string } {
  const t = useCallback((key: string) => messages[key] ?? key, []);
  return { t };
}
