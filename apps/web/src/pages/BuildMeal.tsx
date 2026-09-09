import { useMemo, useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { DAYS_IT, DEFAULT_MEAL_NAMES } from '@vatia/diet-engine';
import { usePlan } from '../state/PlanContext.tsx';
import { BuildMealPanel, type BuilderPhase } from '../components/BuildMealPanel.tsx';

/**
 * Full-screen meal builder. Own route (not a drawer) — building a meal is
 * the app's main task, so it gets the whole screen, its own back button
 * and its own phase eyebrow, same as the rest of the wizard-style flow.
 */
export function BuildMealPage() {
  const { day, meal } = useParams();
  const navigate = useNavigate();
  const { mealCount } = usePlan();
  const [phase, setPhase] = useState<BuilderPhase>('compose');

  const dayIdx = Number(day);
  const mealIdx = Number(meal);
  const valid = Number.isInteger(dayIdx) && dayIdx >= 0 && dayIdx < 7
    && Number.isInteger(mealIdx) && mealIdx >= 0 && mealIdx < mealCount;

  const names = DEFAULT_MEAL_NAMES[mealCount] ?? DEFAULT_MEAL_NAMES[3]!;
  const mealName = useMemo(() => names[mealIdx] ?? '', [names, mealIdx]);

  if (!valid) return <Navigate to="/piano" replace />;

  function backToPiano() { navigate('/piano'); }

  const eyebrow = phase === 'compose' ? 'Fase 1 · scegli' : 'Fase 2 · regola';

  return (
    <div className="stack">
      <span className="eyebrow" style={{ color: 'var(--accent)' }}>{eyebrow}</span>
      <h1 style={{ margin: 0 }}>{mealName}</h1>
      <p className="small" style={{ marginTop: 4 }}>{DAYS_IT[dayIdx]}</p>

      <div style={{ marginTop: 14 }}>
        <BuildMealPanel
          dayIdx={dayIdx}
          mealIdx={mealIdx}
          onDone={backToPiano}
          onPhaseChange={setPhase}
        />
      </div>
    </div>
  );
}
