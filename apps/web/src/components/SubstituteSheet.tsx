import { useMemo, useState } from 'react';
import {
  calcNutrition,
  solveOptimalGrams,
  sumTotals,
  type Food,
  type MealItem,
  type MealTargets,
} from '@vatia/diet-engine';
import { useFoods } from '../state/FoodsContext.tsx';
import { Drawer } from './Drawer.tsx';
import { formatNumber, formatSigned } from '../lib/format.ts';

interface Props {
  open: boolean;
  /** L'alimento da sostituire, la sua posizione e i grammi che aveva. */
  oldFood: Food | null;
  oldGrams: number;
  itemIdx: number;
  /** Tutti gli alimenti del pasto, nello stesso ordine degli item. */
  allFoods: Food[];
  target: MealTargets;
  onClose: () => void;
  /** Il pasto ricalcolato dal solver con l'alimento nuovo al posto del vecchio. */
  onConfirm: (items: MealItem[]) => void;
}

/**
 * Sostituzione al volo: "oggi niente pollo, ho il tacchino". Sceglie un
 * candidato e il solver ricalcola i grammi di tutto il pasto per
 * restare sul target — non solo quelli dell'alimento cambiato.
 */
export function SubstituteSheet({ open, oldFood, oldGrams, itemIdx, allFoods, target, onClose, onConfirm }: Props) {
  const { similarTo, search } = useFoods();
  const [query, setQuery] = useState('');
  const [pickedId, setPickedId] = useState<string | null>(null);

  const candidati = useMemo(() => {
    if (!oldFood) return [];
    if (query.trim().length >= 2) return search(query).filter((f) => f.id !== oldFood.id);
    return similarTo(oldFood);
  }, [oldFood, query, similarTo, search]);

  const picked = candidati.find((f) => f.id === pickedId) ?? null;

  const preview = useMemo(() => {
    if (!picked || !oldFood) return null;
    const nuoviAlimenti = allFoods.map((f, i) => (i === itemIdx ? picked : f));
    const grammi = solveOptimalGrams(nuoviAlimenti, target);
    const items: MealItem[] = nuoviAlimenti.map((food, i) => ({
      food, grams: grammi[i]!, nutrition: calcNutrition(food, grammi[i]!),
    }));
    return { items, totali: sumTotals(items) };
  }, [picked, oldFood, allFoods, itemIdx, target]);

  function chiudi() {
    setQuery(''); setPickedId(null);
    onClose();
  }
  function confermaSostituzione() {
    if (!preview) return;
    onConfirm(preview.items);
    chiudi();
  }

  return (
    <Drawer
      open={open && oldFood != null}
      onClose={chiudi}
      title={oldFood ? `Al posto di ${oldFood.name.split(',')[0]}` : ''}
      footer={
        preview && (
          <div className="sub-confirm">
            <span>
              <span className="sub-confirm-label">Il pasto diventa</span>
              <span className="sub-confirm-value mono">
                {formatNumber(preview.totali.kcal)} kcal ·{' '}
                {formatSigned(Math.round(((preview.totali.kcal - target.kcal) / target.kcal) * 1000) / 10)}%
              </span>
            </span>
            <button type="button" onClick={confermaSostituzione}>Sostituisci</button>
          </div>
        )
      }
    >
      <p className="small" style={{ marginBottom: 14 }}>
        Nel pasto di oggi. I grammi si ricalcolano da soli per restare sul target: {formatNumber(target.kcal)} kcal.
      </p>

      {query.trim().length < 2 && <span className="ios-caption">Simili, dal tuo archivio</span>}
      <div className="ios-group sub-candidates">
        {candidati.length === 0 ? (
          <div className="ios-row"><span className="ios-row-title small">Nessun candidato trovato.</span></div>
        ) : (
          candidati.map((f) => {
            const attivo = f.id === pickedId;
            const item = attivo ? preview?.items[itemIdx] : undefined;
            return (
              <button
                key={f.id}
                type="button"
                className={`ios-row sub-row ${attivo ? 'is-picked' : ''}`}
                onClick={() => setPickedId(f.id)}
              >
                <span className="ios-row-main">
                  <span className={`ios-row-title ${attivo ? 'is-strong' : ''}`}>{f.name}</span>
                  <span className="ios-row-sub mono">
                    {formatNumber(f.kcal_per_100g)} kcal/100 g · {formatNumber(f.protein_per_100g, 1)} P
                  </span>
                </span>
                <span className="sub-row-grams">
                  <span className={`mono ${attivo ? 'is-strong' : ''}`}>
                    {item ? `${formatNumber(item.grams)} g` : '—'}
                  </span>
                  <span className="small">da {formatNumber(oldGrams)} g</span>
                </span>
              </button>
            );
          })
        )}
      </div>

      <input
        type="text"
        placeholder="Cerca un altro alimento…"
        value={query}
        onChange={(e) => { setQuery(e.target.value); setPickedId(null); }}
        style={{ marginTop: 14 }}
      />
    </Drawer>
  );
}
