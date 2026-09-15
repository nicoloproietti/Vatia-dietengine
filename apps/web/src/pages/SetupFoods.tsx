import { useState } from 'react';
import { useFoods } from '../state/FoodsContext.tsx';
import { AddFoodForm } from '../components/AddFoodForm.tsx';
import { formatNumber } from '../lib/format.ts';

/** I tuoi alimenti: quelli che hai aggiunto a mano perché non erano nei 900 CREA. */
export function SetupFoodsPage() {
  const { customFoods, removeFood } = useFoods();
  const [addingFood, setAddingFood] = useState(false);

  return (
    <div className="stack">
      <h1>I tuoi alimenti</h1>
      <p className="lede">
        I 900 alimenti CREA sono già dentro l'app. Qui finiscono quelli che aggiungi tu,
        copiando i valori dall'etichetta.
      </p>

      <div className="ios-group">
        {customFoods.length === 0 ? (
          <div className="ios-row">
            <span className="ios-row-main">
              <span className="ios-row-title">Nessuno, per ora</span>
            </span>
          </div>
        ) : (
          customFoods.map((f) => (
            <div key={f.id} className="ios-row">
              <span className="ios-row-main">
                <span className="ios-row-title">{f.name}</span>
                <span className="ios-row-sub mono">
                  {formatNumber(f.kcal)} kcal · {formatNumber(f.protein, 1)}P ·{' '}
                  {formatNumber(f.carbs, 1)}C · {formatNumber(f.fat, 1)}G
                </span>
              </span>
              <button
                type="button" className="mb-remove"
                onClick={() => removeFood(f.id)}
                aria-label={`Elimina ${f.name}`}
              >✕</button>
            </div>
          ))
        )}
        {!addingFood && (
          <button type="button" className="ios-row is-action" onClick={() => setAddingFood(true)}>
            Aggiungi un alimento
          </button>
        )}
      </div>

      {addingFood && (
        <AddFoodForm onAdded={() => setAddingFood(false)} onCancel={() => setAddingFood(false)} />
      )}
    </div>
  );
}
