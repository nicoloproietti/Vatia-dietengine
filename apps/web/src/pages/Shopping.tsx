import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { weekAggregatedByFood } from '@vatia/diet-engine';
import { usePlan } from '../state/PlanContext.tsx';
import { useSetNavAction } from '../state/NavActionContext.tsx';
import { EmptyState } from '../components/EmptyState.tsx';
import { IconCheckCircleFilled } from '../components/Icons.tsx';
import { shoppingGroupLabel, sortShoppingGroups } from '../lib/shoppingGroups.ts';
import { formatNumber } from '../lib/format.ts';

/**
 * Grammi totali della settimana, raggruppati come nello scaffale del
 * supermercato, non come nel database. Le spunte sono per la spesa in
 * corso: si azzerano quando si torna qui, non c'è nulla da ricordare.
 */
export function ShoppingPage() {
  const { weekPlan } = usePlan();
  const navigate = useNavigate();
  const [checked, setChecked] = useState<Set<string>>(new Set());

  const rows = useMemo(() => weekAggregatedByFood(weekPlan), [weekPlan]);

  const groups = useMemo(() => {
    const byGroup = new Map<string, typeof rows>();
    for (const row of rows) {
      const label = shoppingGroupLabel(row.food.category);
      const list = byGroup.get(label) ?? [];
      list.push(row);
      byGroup.set(label, list);
    }
    return sortShoppingGroups([...byGroup.keys()]).map((label) => ({ label, items: byGroup.get(label)! }));
  }, [rows]);

  function toggle(id: string) {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function exportText() {
    const text = groups
      .map((g) => `${g.label}\n${g.items.map((r) => `- ${r.food.name} — ${formatNumber(r.grams)} g`).join('\n')}`)
      .join('\n\n');
    if (navigator.canShare?.({ text })) {
      try {
        await navigator.share({ text, title: 'Lista della spesa' });
        return;
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') return;
      }
    }
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      /* niente clipboard disponibile: l'utente può ancora leggerla a schermo */
    }
  }

  useSetNavAction(rows.length > 0 ? { label: 'Esporta', onClick: exportText } : null);

  const totaleAlimenti = rows.length;

  return (
    <div className="stack">
      {rows.length === 0 ? (
        <EmptyState>Nessun alimento nel piano. Costruisci qualche pasto per popolare la lista.</EmptyState>
      ) : (
        <>
          <p className="lede" style={{ marginTop: 0 }}>
            Somma dei grammi della settimana · {formatNumber(totaleAlimenti)} alimenti
          </p>
          {groups.map((g) => (
            <div key={g.label}>
              <div className="shop-group-label">{g.label}</div>
              <div className="ios-group">
                {g.items.map((r) => {
                  const isChecked = checked.has(r.food.id);
                  return (
                    <button
                      key={r.food.id}
                      type="button"
                      className={`ios-row shop-row${isChecked ? ' is-checked' : ''}`}
                      onClick={() => toggle(r.food.id)}
                    >
                      <span className="shop-row-check">{isChecked && <IconCheckCircleFilled size={22} />}</span>
                      <span className="shop-row-name">{r.food.name}</span>
                      <span className="shop-row-grams mono">{formatNumber(r.grams)} g</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
          <p className="small" style={{ marginTop: 8 }}>
            Esporta copia la lista come testo: si incolla in Note, in un messaggio, dove serve. Nessuna rete.
          </p>
        </>
      )}

      <div className="btn-row-center">
        <button type="button" className="link" onClick={() => navigate('/oggi')}>Torna a Oggi</button>
      </div>
    </div>
  );
}
