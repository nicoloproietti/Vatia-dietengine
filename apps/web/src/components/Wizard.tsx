import { useEffect, type ReactNode } from 'react';
import { useLocale } from '../i18n/LocaleContext.tsx';

interface WizardShellProps {
  step: number;              // 0-based
  total: number;
  sectionLabel: string;      // e.g. "Profilo"
  question: string;          // big display question
  help?: string | undefined;
  canNext: boolean;
  nextLabel?: string | undefined;
  onNext: () => void;
  onBack?: (() => void) | undefined;
  children: ReactNode;
}

export function WizardShell({
  step, total, sectionLabel, question, help,
  canNext, nextLabel, onNext, onBack, children,
}: WizardShellProps) {
  const { t } = useLocale();

  // Enter advances when allowed and focus isn't on a select/textarea.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key !== 'Enter') return;
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === 'TEXTAREA' || tag === 'SELECT') return;
      if (canNext) {
        e.preventDefault();
        onNext();
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [canNext, onNext]);

  const dots = Array.from({ length: total }, (_, i) => {
    const cls =
      i < step ? 'is-done' :
      i === step ? 'is-current' : '';
    return <span key={i} className={cls} />;
  });

  return (
    <div className="wizard">
      <div className="wizard-progress" role="progressbar"
           aria-valuenow={step + 1} aria-valuemin={1} aria-valuemax={total}>
        {dots}
      </div>

      <div className="wizard-step-meta">
        <span>{sectionLabel}</span>
        <span className="mono">{String(step + 1).padStart(2, '0')} / {String(total).padStart(2, '0')}</span>
      </div>

      <h1 className="wizard-question">{question}</h1>
      {help && <p className="wizard-help">{help}</p>}

      <div className="wizard-body">{children}</div>

      <div className="btn-row">
        {onBack ? (
          <button type="button" className="link" onClick={onBack}>
            ← {t('wizard.back')}
          </button>
        ) : <span />}
        <div className="right">
          <button type="button" onClick={onNext} disabled={!canNext}>
            {nextLabel ?? t('wizard.next')} →
          </button>
        </div>
      </div>
    </div>
  );
}

interface ChoiceListProps<T extends string> {
  options: Array<{ value: T; label: string; hint?: string | undefined }>;
  value: T | null;
  onChange: (v: T) => void;
}

export function ChoiceList<T extends string>({ options, value, onChange }: ChoiceListProps<T>) {
  return (
    <div className="choice-group">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          className={`choice ${value === o.value ? 'is-selected' : ''}`}
          onClick={() => onChange(o.value)}
          aria-pressed={value === o.value}
        >
          <span>{o.label}</span>
          {o.hint && <span className="choice-hint">{o.hint}</span>}
        </button>
      ))}
    </div>
  );
}
