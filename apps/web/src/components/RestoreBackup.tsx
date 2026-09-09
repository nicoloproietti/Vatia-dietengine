import { useRef, useState } from 'react';
import { useProfile } from '../state/ProfileContext.tsx';
import { usePlan } from '../state/PlanContext.tsx';
import { useFoods } from '../state/FoodsContext.tsx';
import { parseBackup } from '../lib/backup.ts';

interface Props {
  label: string;
  className?: string;
  /** Chiamata dopo un ripristino riuscito. */
  onRestored?: () => void;
}

/**
 * Ripristino da un file di backup: profilo, settimana e alimenti
 * aggiunti a mano. Non serve nell'uso normale — i dati vivono nel
 * telefono — ma è l'unica via di ritorno se si cambia dispositivo.
 */
export function RestoreBackup({ label, className = 'link', onRestored }: Props) {
  const { setProfile } = useProfile();
  const { restore } = usePlan();
  const { replaceAll } = useFoods();
  const fileRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    try {
      const backup = parseBackup(await file.text());
      if (backup.profile) setProfile(backup.profile);
      if (backup.plan) restore(backup.plan);
      replaceAll(backup.customFoods);
      onRestored?.();
    } catch {
      setError('Questo file non è un backup di Vatia.');
    } finally {
      if (fileRef.current) fileRef.current.value = '';
    }
  }

  return (
    <>
      <button type="button" className={className} onClick={() => fileRef.current?.click()}>
        {label}
      </button>
      <input
        ref={fileRef}
        type="file"
        accept="application/json,.json,.csv,text/csv"
        hidden
        onChange={onFile}
      />
      {error && (
        <p className="small" style={{ color: 'var(--danger)', padding: '0 16px 12px' }}>{error}</p>
      )}
    </>
  );
}
