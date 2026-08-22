import { useEffect, type ReactNode } from 'react';

interface DrawerProps {
  open: boolean;
  onClose: () => void;
  title: string;
  eyebrow?: string | undefined;
  children: ReactNode;
  /** Optional actions rendered in the drawer's sticky footer */
  footer?: ReactNode | undefined;
}

/**
 * Right-side slide-over on desktop (≥ 640px), bottom-sheet on mobile.
 * The week grid behind stays visible on desktop (~60% width visible);
 * on mobile the sheet takes ~92dvh.
 *
 * Closes on ESC and on backdrop click. Body scroll is locked while open.
 */
export function Drawer({ open, onClose, title, eyebrow, children, footer }: DrawerProps) {
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="drawer-root" role="dialog" aria-modal="true" aria-label={title}>
      <div className="drawer-backdrop" onClick={onClose} />
      <aside className="drawer-panel">
        <header className="drawer-header">
          <div>
            {eyebrow && <span className="drawer-eyebrow">{eyebrow}</span>}
            <h2 className="drawer-title">{title}</h2>
          </div>
          <button
            type="button"
            className="drawer-close"
            onClick={onClose}
            aria-label="Chiudi"
          >
            ✕
          </button>
        </header>
        <div className="drawer-body">{children}</div>
        {footer && <footer className="drawer-footer">{footer}</footer>}
      </aside>
    </div>
  );
}
