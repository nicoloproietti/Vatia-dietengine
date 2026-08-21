import { Link } from 'react-router-dom';
import { useLocale } from '../i18n/LocaleContext.tsx';

export function LandingPage() {
  const { t } = useLocale();
  return (
    <div className="stack">
      <section className="hero">
        <h1>{t('landing.title')}</h1>
        <p className="lede">{t('landing.lede')}</p>
        <Link to="/profile">
          <button type="button">{t('landing.cta')} →</button>
        </Link>
      </section>

      <hr />

      <section>
        <h2>{t('landing.manifesto.title')}</h2>
        <p>{t('landing.manifesto.body')}</p>
      </section>

      <section>
        <h2>{t('landing.trust.title')}</h2>
        <ul className="trust-list">
          <li>{t('landing.trust.no_tracking')}</li>
          <li>{t('landing.trust.no_server_data')}</li>
          <li>{t('landing.trust.no_ai_lock')}</li>
          <li>{t('landing.trust.no_hype')}</li>
        </ul>
      </section>
    </div>
  );
}
