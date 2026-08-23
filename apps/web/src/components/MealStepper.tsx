interface Props {
  value: number;
  options: number[];
  onChange: (n: number) => void;
}

/** 2–6 meal-count pill selector. */
export function MealStepper({ value, options, onChange }: Props) {
  return (
    <div className="stepper">
      {options.map((n) => (
        <button
          key={n}
          type="button"
          className={`stepper-btn ${value === n ? 'is-selected' : ''}`}
          onClick={() => onChange(n)}
          aria-pressed={value === n}
        >
          {n}
        </button>
      ))}
    </div>
  );
}
