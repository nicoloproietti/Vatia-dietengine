import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { type Locale, messages } from './messages.ts';

interface LocaleValue {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: (key: string) => string;
}

const LocaleCtx = createContext<LocaleValue | null>(null);

function initialLocale(): Locale {
  try {
    const stored = localStorage.getItem('vatia:locale');
    if (stored === 'it' || stored === 'en') return stored;
  } catch {
    // ignored: private mode / disabled storage
  }
  return navigator.language.startsWith('it') ? 'it' : 'en';
}

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(initialLocale);

  useEffect(() => {
    try {
      localStorage.setItem('vatia:locale', locale);
    } catch { /* ignore */ }
    document.documentElement.lang = locale;
  }, [locale]);

  const setLocale = useCallback((l: Locale) => setLocaleState(l), []);
  const t = useCallback(
    (key: string) => messages[locale][key] ?? key,
    [locale],
  );

  const value = useMemo(() => ({ locale, setLocale, t }), [locale, setLocale, t]);
  return <LocaleCtx.Provider value={value}>{children}</LocaleCtx.Provider>;
}

export function useLocale(): LocaleValue {
  const ctx = useContext(LocaleCtx);
  if (!ctx) throw new Error('useLocale must be used inside LocaleProvider');
  return ctx;
}
