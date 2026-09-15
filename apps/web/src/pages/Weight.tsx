import { useMemo, useState } from 'react';
import { Navigate } from 'react-router-dom';
import {
  ACTIVITY_MULTIPLIER,
  bmrMifflinStJeor,
  recalibrateTdee,
} from '@vatia/diet-engine';
import { useProfile } from '../state/ProfileContext.tsx';
import { usePlan } from '../state/PlanContext.tsx';
import { useWeight } from '../state/WeightContext.tsx';
import { useSetNavAction } from '../state/NavActionContext.tsx';
import { Drawer } from '../components/Drawer.tsx';
import { AddWeightForm } from '../components/AddWeightForm.tsx';
import { EmptyState } from '../components/EmptyState.tsx';
import { formatDayMonth, formatNumber, formatSigned } from '../lib/format.ts';

const KCAL_PER_KG = 7700;

/**
 * L'unico posto dove la formula viene messa alla prova dal peso reale.
 * Oggi propone target da un BMR calcolato; qui si vede se ha ragione, e
 * si può correggerla — senza toccare il codice, solo con qualche pesata.
 */
export function WeightPage() {
  const { profile } = useProfile();
  const { targetKcal } = usePlan();
  const { entries, addEntry, removeEntry, adoptedTdee, adoptTdee, dismissedTdee, dismissTdee } = useWeight();
  const [addOpen, setAddOpen] = useState(false);

  useSetNavAction({ label: 'Aggiungi', onClick: () => setAddOpen(true) });

  if (!profile) return <Navigate to="/" replace />;

  const formulaTdee = useMemo(
    () => Math.round(bmrMifflinStJeor(profile) * ACTIVITY_MULTIPLIER[profile.activity]),
    [profile],
  );
  const kcal = targetKcal ?? formulaTdee;

  const start = entries[0];
  const current = entries[entries.length - 1];

  const recal = useMemo(() => {
    const result = recalibrateTdee(entries, formulaTdee, kcal);
    if (!result) return null;
    if (adoptedTdee === result.realTdee) return null;
    if (dismissedTdee === result.realTdee) return null;
    if (Math.abs(result.realTdee - formulaTdee) < 100) return null;
    return result;
  }, [entries, formulaTdee, kcal, adoptedTdee, dismissedTdee]);

  const chart = useMemo(() => {
    if (!start || !current || start.date === current.date) return null;
    return buildWeightChart(entries, formulaTdee, kcal);
  }, [entries, start, current, formulaTdee, kcal]);

  const registrazioni = [...entries].reverse();

  return (
    <div className="stack">
      {!start ? (
        <EmptyState>
          Nessuna pesata ancora. Aggiungine una per iniziare a confrontare la formula con la realtà.
        </EmptyState>
      ) : (
        <>
          <section className="ios-group setup-card">
            <p className="weight-start-note">
              Sei partito da {formatNumber(start.kg, 1)} kg il {formatDayMonth(start.date)}
            </p>
            <div className="weight-current">
              <span className="weight-current-value mono">{formatNumber(current!.kg, 1)}</span>
              <span className="weight-current-unit">
                kg{entries.length > 1 && ` · ${formatSigned(current!.kg - start.kg, 1)} in ${weeksLabel(chart?.days ?? 0)}`}
              </span>
            </div>
            {chart && (
              <>
                <div className="weight-chart-wrap">
                  <svg className="weight-chart" viewBox="0 0 300 100" preserveAspectRatio="none" fill="none">
                    <path d={chart.predictedPath} stroke="var(--ink-3)" strokeWidth={1.5} strokeDasharray="4 4" />
                    <path d={chart.realPath} stroke="var(--accent)" strokeWidth={2.5} />
                  </svg>
                </div>
                <div className="weight-legend">
                  <span className="weight-legend-item"><span className="weight-legend-dot" style={{ background: 'var(--accent)' }} />reale</span>
                  <span className="weight-legend-item"><span className="weight-legend-dot weight-legend-dot-dashed" />previsto dalla formula</span>
                </div>
              </>
            )}
          </section>

          {recal && (
            <section className="ios-group setup-card" style={{ marginTop: 22 }}>
              <p className="weight-recal-title">
                {recal.realTdee < formulaTdee ? 'La formula sta sovrastimando' : 'La formula sta sottostimando'}
              </p>
              <p className="weight-recal-body">
                Prevedeva {formatSigned(-recal.predictedLossKg, 1)} kg, ne hai {recal.realLossKg >= 0 ? 'persi' : 'presi'}{' '}
                {formatNumber(Math.abs(recal.realLossKg), 1)}. Sul tuo storico il TDEE reale è circa{' '}
                <span className="mono" style={{ color: 'var(--ink)' }}>{formatNumber(recal.realTdee)} kcal</span>, non {formatNumber(formulaTdee)}.
                Puoi tenere il valore della formula o usare il misurato.
              </p>
              <div className="weight-recal-actions">
                <button type="button" onClick={() => adoptTdee(recal.realTdee)}>
                  Usa {formatNumber(recal.realTdee)}
                </button>
                <button type="button" className="secondary" onClick={() => dismissTdee(recal.realTdee)}>
                  Tieni la formula
                </button>
              </div>
            </section>
          )}

          <div className="section-head" style={{ marginTop: 22 }}>
            <span className="ios-caption">Registrazioni</span>
          </div>
          <div className="ios-group">
            {registrazioni.map((e) => (
              <div key={e.date} className="ios-row weight-entry-row">
                <span className="ios-row-title">{formatDayMonth(e.date)}</span>
                <span className="ios-row-value mono">{formatNumber(e.kg, 1)} kg</span>
                <button
                  type="button"
                  className="weight-delete"
                  onClick={() => removeEntry(e.date)}
                >
                  Elimina
                </button>
              </div>
            ))}
          </div>
          <p className="small" style={{ marginTop: 8 }}>
            Il rosso compare solo qui: è l'unico posto dove qualcosa viene cancellato.
          </p>
        </>
      )}

      <Drawer open={addOpen} onClose={() => setAddOpen(false)} title="Nuova pesata">
        <AddWeightForm
          onSave={(date, kg) => { addEntry(date, kg); setAddOpen(false); }}
          onCancel={() => setAddOpen(false)}
        />
      </Drawer>
    </div>
  );
}

function weeksLabel(days: number): string {
  const weeks = Math.round(days / 7);
  if (weeks <= 0) return `${days} giorni`;
  return weeks === 1 ? '1 settimana' : `${weeks} settimane`;
}

interface ChartResult {
  realPath: string;
  predictedPath: string;
  days: number;
}

/** Due linee su una griglia 0-300 × 0-100: peso reale, e dove sarebbe secondo la formula. */
function buildWeightChart(
  entries: Array<{ date: string; kg: number }>,
  formulaTdee: number,
  targetKcal: number,
): ChartResult {
  const sorted = [...entries].sort((a, b) => a.date.localeCompare(b.date));
  const t0 = new Date(sorted[0]!.date).getTime();
  const tLast = new Date(sorted[sorted.length - 1]!.date).getTime();
  const totalMs = Math.max(tLast - t0, 1);
  const days = Math.round(totalMs / 86_400_000);

  const dailyDeficit = formulaTdee - targetKcal;
  const predictedEndKg = sorted[0]!.kg - (dailyDeficit * days) / KCAL_PER_KG;

  const weights = sorted.map((e) => e.kg);
  const min = Math.min(...weights, predictedEndKg);
  const max = Math.max(...weights, predictedEndKg);
  const span = Math.max(max - min, 0.5);

  const x = (t: number) => ((t - t0) / totalMs) * 300;
  const y = (kg: number) => 100 - ((kg - min) / span) * 100;

  const realPath = sorted
    .map((e, i) => `${i === 0 ? 'M' : 'L'}${x(new Date(e.date).getTime()).toFixed(1)} ${y(e.kg).toFixed(1)}`)
    .join(' ');

  const predictedPath = `M0 ${y(sorted[0]!.kg).toFixed(1)} L300 ${y(predictedEndKg).toFixed(1)}`;

  return { realPath, predictedPath, days };
}
