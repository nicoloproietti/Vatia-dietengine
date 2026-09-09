import { useRef, useState } from 'react';
import { useProfile } from '../state/ProfileContext.tsx';
import { csvToProfile } from '../lib/csv.ts';

interface Props {
  label: string;
  className?: string;
  /** Chiamata dopo un ripristino riuscito. */
  onRestored?: () => void;
}

/**
 * Ripristino del profilo da un backup CSV.
 *
 * Non serve nell'uso normale — il profilo vive nel telefono — ma è
 * l'unica via di ritorno se si cambia dispositivo o si svuotano i dati
 * di Safari.
 */
export function RestoreBackup({ label, className = 'link', onRestored }: Props) {
  const { setProfile } = useProfile();
  const fileRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    try {
      setProfile(csvToProfile(await file.text()));
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
      <input ref={fileRef} type="file" accept=".csv,text/csv" hidden onChange={onFile} />
      {error && (
        <p className="small" style={{ color: 'var(--danger)', padding: '0 16px 12px' }}>{error}</p>
      )}
    </>
  );
}
