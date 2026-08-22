import { Link } from 'react-router-dom';
import { useLocale } from '../i18n/LocaleContext.tsx';

export function LandingPage() {
  const { t } = useLocale();
  return (
    <div>
      <section className="hero">
        <span className="eyebrow">{t('landing.manifesto.title')}</span>
        <h1>{t('landing.title')}</h1>
        <p className="lede">{t('landing.lede')}</p>
        <div className="cta-row">
          <Link to="/profile">
            <button type="button">{t('landing.cta')} →</button>
          </Link>
        </div>
      </section>

      <hr />

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
