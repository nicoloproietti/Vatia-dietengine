import { Link, Navigate, Route, Routes } from 'react-router-dom';
import { useLocale } from './i18n/LocaleContext.tsx';
import { useTheme } from './state/ThemeContext.tsx';
import { LandingPage } from './pages/Landing.tsx';
import { ImportPromptPage } from './pages/ImportPrompt.tsx';
import { ProfilePage } from './pages/Profile.tsx';
import { SetupPage } from './pages/Setup.tsx';
import { PianoPage } from './pages/Piano.tsx';
import { BuildMealPage } from './pages/BuildMeal.tsx';
import { ShoppingPage } from './pages/Shopping.tsx';

export function App() {
  const { t, locale, setLocale } = useLocale();
  const { theme, toggle } = useTheme();
  return (
    <>
      <header className="topbar">
        <Link to="/" className="brand">{t('brand')}</Link>
        <div className="topbar-actions">
          <button
            type="button"
            className="icon-btn"
            onClick={toggle}
            aria-label="Toggle theme"
            title={theme === 'dark' ? 'Light mode' : 'Dark mode'}
          >
            {theme === 'dark' ? '☀' : '☾'}
          </button>
          <button
            type="button"
            className="icon-btn"
            onClick={() => setLocale(locale === 'it' ? 'en' : 'it')}
            aria-label="Switch language"
          >
            {locale === 'it' ? 'EN' : 'IT'}
          </button>
        </div>
      </header>
      <main className="container">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/import" element={<ImportPromptPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/setup" element={<SetupPage />} />
          <Route path="/piano" element={<PianoPage />} />
          <Route path="/build/:day/:meal" element={<BuildMealPage />} />
          <Route path="/shopping" element={<ShoppingPage />} />
          {/* Legacy redirects — bookmarks and older links keep working. */}
          <Route path="/week" element={<Navigate to="/piano" replace />} />
          <Route path="/meal" element={<Navigate to="/setup" replace />} />
          <Route path="/plan" element={<Navigate to="/piano" replace />} />
        </Routes>
      </main>
      <footer className="footer">
        {t('footer.rebuild')} · <a href="https://github.com/nicoloproietti/Vatia-dietengine">{t('footer.repo')}</a>
      </footer>
    </>
  );
}
