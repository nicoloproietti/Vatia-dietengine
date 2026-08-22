import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLocale } from '../i18n/LocaleContext.tsx';
import { useProfile } from '../state/ProfileContext.tsx';
import { csvToProfile } from '../lib/csv.ts';

/**
 * First page after the landing CTA. Asks the user whether they already
 * have a Vatia profile CSV. Choosing "no" continues to the profile
 * wizard; a valid upload jumps straight to /setup.
 */
export function ImportPromptPage() {
  const { t } = useLocale();
  const { setProfile } = useProfile();
  const navigate = useNavigate();
  const fileRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    try {
      const p = csvToProfile(await file.text());
      setProfile(p);
      navigate('/setup');
    } catch {
      setError(t('import.error'));
    } finally {
      if (fileRef.current) fileRef.current.value = '';
    }
  }

  return (
    <div className="stack">
      <span className="eyebrow">{t('import.eyebrow')}</span>
      <h1>{t('import.question')}</h1>
      <p className="lede">{t('import.help')}</p>

      <div className="choice-group" style={{ marginTop: 24 }}>
        <button
          type="button"
          className="choice"
          onClick={() => fileRef.current?.click()}
        >
          <span>{t('import.yes')}</span>
          <span className="choice-hint">{t('import.yes.hint')}</span>
        </button>
        <button
          type="button"
          className="choice"
          onClick={() => navigate('/profile')}
        >
          <span>{t('import.no')}</span>
          <span className="choice-hint">{t('import.no.hint')}</span>
        </button>
      </div>

      <input
        ref={fileRef}
        type="file"
        accept=".csv,text/csv"
        hidden
        onChange={onFile}
      />

      {error && <p className="small" style={{ color: 'var(--danger)' }}>{error}</p>}
    </div>
  );
}
