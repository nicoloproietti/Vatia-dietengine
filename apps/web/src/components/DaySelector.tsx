interface Props {
  /** Iniziali dei sette giorni, es. ['L','M','M','G','V','S','D']. */
  letters: string[];
  value: number;
  onChange: (idx: number) => void;
  /** Giorni con almeno un pasto costruito — un punto sotto la lettera. */
  doneByDay?: boolean[] | undefined;
}

/** Selettore giorni a lettera singola — un controllo segmentato, non sette pillole. */
export function DaySelector({ letters, value, onChange, doneByDay }: Props) {
  return (
    <div className="week-days" role="tablist">
      {letters.map((letter, idx) => (
        <button
          key={idx}
          type="button"
          role="tab"
          aria-selected={value === idx}
          className={`week-day ${value === idx ? 'is-active' : ''}`}
          onClick={() => onChange(idx)}
        >
          {letter}
          {doneByDay?.[idx] && <span className="week-day-dot" />}
        </button>
      ))}
    </div>
  );
}
