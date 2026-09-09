import { Navigate, useNavigate } from 'react-router-dom';
import { useLocale } from '../i18n/LocaleContext.tsx';
import { useProfile } from '../state/ProfileContext.tsx';
import { RestoreBackup } from '../components/RestoreBackup.tsx';

export function LandingPage() {
  const { t } = useLocale();
  const { profile } = useProfile();
  const navigate = useNavigate();

  // Chi ha già il profilo sul telefono non deve ripassare dalla
  // presentazione: l'app si apre sul piano.
  if (profile) return <Navigate to="/piano" replace />;

  return (
    <div>
      <section className="hero">
        <span className="eyebrow">{t('landing.manifesto.title')}</span>
        <h1>{t('landing.title')}</h1>
        <p className="lede">{t('landing.lede')}</p>
        <div className="cta-row">
          <button type="button" onClick={() => navigate('/profile')}>{t('landing.cta')}</button>
        </div>
        <p className="small" style={{ marginTop: 14 }}>
          <RestoreBackup label="Ho un backup, ripristinalo" onRestored={() => navigate('/setup')} />
        </p>
      </section>

      <section className="pitch-grid">
        <div className="pitch-item">
          <h4>{t('landing.pitch.formula.title')}</h4>
          <p>{t('landing.pitch.formula.body')}</p>
        </div>
        <div className="pitch-item">
          <h4>{t('landing.pitch.privacy.title')}</h4>
          <p>{t('landing.pitch.privacy.body')}</p>
        </div>
        <div className="pitch-item">
          <h4>{t('landing.pitch.italian.title')}</h4>
          <p>{t('landing.pitch.italian.body')}</p>
        </div>
        <div className="pitch-item">
          <h4>{t('landing.pitch.honest.title')}</h4>
          <p>{t('landing.pitch.honest.body')}</p>
        </div>
      </section>
    </div>
  );
}
