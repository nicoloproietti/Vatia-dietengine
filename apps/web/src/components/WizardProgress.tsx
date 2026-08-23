interface Props {
  step: number;   // 0-based
  total: number;
  sectionLabel: string;
}

/** Segment progress bar + "passo NN / NN" meta row. */
export function WizardProgress({ step, total, sectionLabel }: Props) {
  const segments = Array.from({ length: total }, (_, i) => {
    const cls = i < step ? 'is-done' : i === step ? 'is-current' : '';
    return <span key={i} className={cls} />;
  });

  return (
    <>
      <div className="wizard-progress" role="progressbar"
           aria-valuenow={step + 1} aria-valuemin={1} aria-valuemax={total}>
        {segments}
      </div>
      <div className="wizard-step-meta">
        <span>passo {String(step + 1).padStart(2, '0')} / {String(total).padStart(2, '0')}</span>
        <span className="mono">{sectionLabel}</span>
      </div>
    </>
  );
}
