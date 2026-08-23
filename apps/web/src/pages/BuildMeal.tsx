import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
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

  if (!valid) { navigate('/piano', { replace: true }); return null; }

  function backToPiano() { navigate('/piano'); }

  const eyebrow = phase === 'compose' ? 'Fase 1 · scegli' : 'Fase 2 · regola';

  return (
    <div className="stack">
      <button type="button" className="link" onClick={backToPiano} style={{ alignSelf: 'flex-start' }}>
        ← {DAYS_IT[dayIdx]}
      </button>
      <span className="eyebrow">{eyebrow}</span>
      <h1 style={{ fontSize: 'clamp(26px, 4vw, 36px)', margin: 0 }}>
        {DAYS_IT[dayIdx]} · {mealName}
      </h1>

      <div style={{ marginTop: 16 }}>
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
