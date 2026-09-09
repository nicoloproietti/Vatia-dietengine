import { useState } from 'react';
import type { Food } from '@vatia/diet-engine';
import { useFoods, type CustomFoodInput } from '../state/FoodsContext.tsx';

const CATEGORIES: Array<{ value: string; label: string }> = [
  { value: 'carne', label: 'Carne' },
  { value: 'pesce', label: 'Pesce' },
  { value: 'uova', label: 'Uova' },
  { value: 'latticini', label: 'Latticini' },
  { value: 'cereali', label: 'Cereali' },
  { value: 'legumi', label: 'Legumi' },
  { value: 'verdura', label: 'Verdura' },
  { value: 'frutta', label: 'Frutta' },
  { value: 'grassi_condimenti', label: 'Grassi e condimenti' },
  { value: 'dolci_snack', label: 'Dolci e snack' },
  { value: 'piatti_pronti', label: 'Piatti pronti' },
  { value: 'altro', label: 'Altro' },
];

interface Props {
  /** Nome suggerito, di solito quello che l'utente stava cercando. */
  initialName?: string;
  onAdded: (food: Food) => void;
  onCancel: () => void;
}

/**
 * Aggiunge un alimento al database personale. I valori sono per 100 g,
 * come sull'etichetta della confezione: è da lì che si copiano.
 */
export function AddFoodForm({ initialName = '', onAdded, onCancel }: Props) {
  const { addFood } = useFoods();
  const [name, setName] = useState(initialName);
  const [category, setCategory] = useState('altro');
  const [kcal, setKcal] = useState<number | ''>('');
  const [protein, setProtein] = useState<number | ''>('');
  const [carbs, setCarbs] = useState<number | ''>('');
  const [fat, setFat] = useState<number | ''>('');

  const num = (v: number | '') => (v === '' ? 0 : v);
  const valid = name.trim().length >= 2 && kcal !== '';

  function submit() {
    if (!valid) return;
    const input: CustomFoodInput = {
      name: name.trim(),
      category,
      kcal: num(kcal),
      protein: num(protein),
      carbs: num(carbs),
      fat: num(fat),
    };
    onAdded(addFood(input));
  }

  // Le kcal dichiarate dovrebbero corrispondere ai macro (4/4/9).
  const fromMacros = num(protein) * 4 + num(carbs) * 4 + num(fat) * 9;
  const mismatch = kcal !== '' && fromMacros > 0 && Math.abs(fromMacros - num(kcal)) > num(kcal) * 0.2;

  return (
    <div className="add-food">
      <div className="section-head">
        <span className="ios-caption">Nuovo alimento · valori per 100 g</span>
      </div>

      <div className="ios-group">
        <label className="ios-row af-field">
          <span className="ios-row-title">Nome</span>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Es. Yogurt greco 0%"
            autoFocus
          />
        </label>
        <label className="ios-row af-field">
          <span className="ios-row-title">Categoria</span>
          <select value={category} onChange={(e) => setCategory(e.target.value)}>
            {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
        </label>
        <NumRow label="Calorie" unit="kcal" value={kcal} onChange={setKcal} />
        <NumRow label="Proteine" unit="g" value={protein} onChange={setProtein} color="var(--c-protein)" />
        <NumRow label="Carboidrati" unit="g" value={carbs} onChange={setCarbs} color="var(--c-carbs)" />
        <NumRow label="Grassi" unit="g" value={fat} onChange={setFat} color="var(--c-fat)" />
      </div>

      {mismatch && (
        <p className="small" style={{ marginTop: 8 }}>
          Dai macro verrebbero circa {Math.round(fromMacros)} kcal invece di {num(kcal)}.
          Controlla l'etichetta — se è giusta così, va bene lo stesso.
        </p>
      )}

      <div className="btn-row">
        <button type="button" className="link" onClick={onCancel}>Annulla</button>
        <div className="right">
          <button type="button" onClick={submit} disabled={!valid}>Aggiungi</button>
        </div>
      </div>
    </div>
  );
}

function NumRow({ label, unit, value, onChange, color }: {
  label: string;
  unit: string;
  value: number | '';
  onChange: (v: number | '') => void;
  color?: string;
}) {
  return (
    <label className="ios-row af-field">
      <span className="ios-row-title" style={color ? { color } : undefined}>{label}</span>
      <span className="af-num">
        <input
          type="number" min={0} step="0.1" inputMode="decimal"
          value={value}
          placeholder="0"
          onChange={(e) => onChange(e.target.value === '' ? '' : Number(e.target.value))}
        />
        <span className="af-unit">{unit}</span>
      </span>
    </label>
  );
}
