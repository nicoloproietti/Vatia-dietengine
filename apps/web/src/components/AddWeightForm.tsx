import { useState } from 'react';
import { dateKey } from '../state/EatenContext.tsx';

interface Props {
  onSave: (date: string, kg: number) => void;
  onCancel: () => void;
}

/** Data e peso — un form di due campi, non merita di più. */
export function AddWeightForm({ onSave, onCancel }: Props) {
  const [date, setDate] = useState(dateKey());
  const [kg, setKg] = useState<number | ''>('');

  const valid = kg !== '' && kg > 0 && kg < 400 && date !== '';

  function submit() {
    if (!valid) return;
    onSave(date, Number(kg));
  }

  return (
    <div>
      <div className="ios-group">
        <label className="ios-row af-field">
          <span className="ios-row-title">Data</span>
          <input type="date" value={date} max={dateKey()} onChange={(e) => setDate(e.target.value)} />
        </label>
        <label className="ios-row af-field">
          <span className="ios-row-title">Peso</span>
          <span className="af-num">
            <input
              type="number" min={0} step="0.1" inputMode="decimal"
              value={kg}
              placeholder="0"
              autoFocus
              onChange={(e) => setKg(e.target.value === '' ? '' : Number(e.target.value))}
            />
            <span className="af-unit">kg</span>
          </span>
        </label>
      </div>

      <div className="btn-row">
        <button type="button" className="link" onClick={onCancel}>Annulla</button>
        <div className="right">
          <button type="button" onClick={submit} disabled={!valid}>Salva</button>
        </div>
      </div>
    </div>
  );
}
