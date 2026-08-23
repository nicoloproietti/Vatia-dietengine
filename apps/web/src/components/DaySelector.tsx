interface Props {
  days: string[];        // short labels, e.g. DAYS_SHORT_IT
  value: number;
  onChange: (idx: number) => void;
  /** completed meals per day index, used for the progress line + complete state */
  doneByDay: number[];
  mealsPerDay: number;
}

/** 7-day tab row with per-day completion (e.g. "3/4"). */
export function DaySelector({ days, value, onChange, doneByDay, mealsPerDay }: Props) {
  return (
    <div className="day-tabs" role="tablist">
      {days.map((label, idx) => {
        const done = doneByDay[idx] ?? 0;
        const complete = done === mealsPerDay;
        return (
          <button
            key={idx}
            type="button"
            role="tab"
            aria-selected={value === idx}
            className={`day-tab ${value === idx ? 'is-active' : ''} ${complete ? 'is-complete' : ''}`}
            onClick={() => onChange(idx)}
          >
            <span className="day-tab-label">{label}</span>
            <span className="day-tab-progress mono">{done}/{mealsPerDay}</span>
          </button>
        );
      })}
    </div>
  );
}
