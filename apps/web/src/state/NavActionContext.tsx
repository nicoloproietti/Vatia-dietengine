import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

export interface NavAction {
  label: string;
  onClick: () => void;
  disabled?: boolean | undefined;
}

interface NavActionContextValue {
  action: NavAction | null;
  setNavAction: (action: NavAction | null) => void;
}

const NavActionContext = createContext<NavActionContextValue | null>(null);

/**
 * Alcune schermate (Lista della spesa) hanno un'azione di testo nella
 * nav bar invece di un bottone in fondo alla pagina — com'è in iOS.
 * Le pagine la registrano al mount e la ritirano allo smontaggio.
 */
export function NavActionProvider({ children }: { children: ReactNode }) {
  const [action, setNavAction] = useState<NavAction | null>(null);
  const value = useMemo(() => ({ action, setNavAction }), [action]);
  return <NavActionContext.Provider value={value}>{children}</NavActionContext.Provider>;
}

export function useNavAction() {
  const ctx = useContext(NavActionContext);
  if (!ctx) throw new Error('useNavAction va usato dentro NavActionProvider');
  return ctx;
}

/** Registra l'azione mentre il componente chiamante è montato; la ritira allo smontaggio. */
export function useSetNavAction(action: NavAction | null) {
  const { setNavAction } = useNavAction();
  const { label, onClick, disabled } = action ?? { label: undefined, onClick: undefined, disabled: undefined };
  useEffect(() => {
    if (!label || !onClick) {
      setNavAction(null);
      return;
    }
    setNavAction({ label, onClick, disabled });
    return () => setNavAction(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [label, onClick, disabled]);
}
