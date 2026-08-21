import { Link, Route, Routes } from 'react-router-dom';
import { useLocale } from './i18n/LocaleContext.tsx';
import { LandingPage } from './pages/Landing.tsx';
import { ProfilePage } from './pages/Profile.tsx';
import { MealBuilderPage } from './pages/MealBuilder.tsx';
import { PlanResultPage } from './pages/PlanResult.tsx';

export function App() {
  const { t, locale, setLocale } = useLocale();
  return (
    <>
      <header className="topbar">
        <Link to="/" className="brand">{t('brand')}</Link>
        <button
          type="button"
          className="lang-toggle"
          onClick={() => setLocale(locale === 'it' ? 'en' : 'it')}
          aria-label="Switch language"
        >
          {locale === 'it' ? 'EN' : 'IT'}
        </button>
      </header>
      <main className="container">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/meal" element={<MealBuilderPage />} />
          <Route path="/plan" element={<PlanResultPage />} />
        </Routes>
      </main>
      <footer className="footer">
        {t('footer.rebuild')} · <a href="https://github.com/nicoloproietti/Vatia-dietengine">{t('footer.repo')}</a>
      </footer>
    </>
  );
}
