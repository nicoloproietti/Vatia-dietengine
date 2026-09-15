import { Link, Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { useLocale } from './i18n/LocaleContext.tsx';
import { useTheme } from './state/ThemeContext.tsx';
import { useProfile } from './state/ProfileContext.tsx';
import { LandingPage } from './pages/Landing.tsx';
import { ProfilePage } from './pages/Profile.tsx';
import { SetupPage } from './pages/Setup.tsx';
import { SetupProfilePage } from './pages/SetupProfile.tsx';
import { SetupAdvancedPage } from './pages/SetupAdvanced.tsx';
import { SetupFoodsPage } from './pages/SetupFoods.tsx';
import { OggiPage } from './pages/Oggi.tsx';
import { PianoPage } from './pages/Piano.tsx';
import { BuildMealPage } from './pages/BuildMeal.tsx';
import { ShoppingPage } from './pages/Shopping.tsx';
import { IconChevronLeft } from './components/Icons.tsx';

/** La casa dell'app: nessun tasto indietro, si torna sempre qui. */
const HOME = '/oggi';

export function App() {
  const { t } = useLocale();
  const { profile } = useProfile();
  const { pathname } = useLocation();

  return (
    <div className="app-shell">
      <NavBar />
      <main className="container">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/setup" element={<SetupPage />} />
          <Route path="/setup/profilo" element={<SetupProfilePage />} />
          <Route path="/setup/avanzate" element={<SetupAdvancedPage />} />
          <Route path="/setup/alimenti" element={<SetupFoodsPage />} />
          <Route path="/oggi" element={<OggiPage />} />
          <Route path="/piano" element={<PianoPage />} />
          <Route path="/build/:day/:meal" element={<BuildMealPage />} />
          <Route path="/shopping" element={<ShoppingPage />} />
          {/* Legacy redirects — bookmarks and older links keep working. */}
          <Route path="/week" element={<Navigate to="/piano" replace />} />
          <Route path="/import" element={<Navigate to="/" replace />} />
          <Route path="/meal" element={<Navigate to="/setup" replace />} />
          <Route path="/plan" element={<Navigate to="/piano" replace />} />
        </Routes>
      </main>

      {/* Una volta dentro l'app il footer sparisce: le app non ne hanno. */}
      {profile == null && (
        <footer className="footer">
          {t('footer.rebuild')} ·{' '}
          <a href="https://github.com/nicoloproietti/Vatia-dietengine">{t('footer.repo')}</a>
        </footer>
      )}
    </div>
  );
}

/** Nav bar traslucida: indietro a sinistra, titolo al centro, azioni a destra. */
function NavBar() {
  const { t } = useLocale();
  const { theme, toggle } = useTheme();
  const { pathname } = useLocation();
  const navigate = useNavigate();

  const isLanding = pathname === '/';
  const isHome = pathname === HOME;
  const showBack = !isLanding && !isHome;

  const title = isLanding ? '' : titleFor(pathname, t);
  const backLabel = backLabelFor(pathname, t);

  return (
    <header className="topbar">
      <div className="topbar-left">
        {showBack && (
          <button type="button" className="nav-back" onClick={() => navigate(-1)}>
            <IconChevronLeft />
            <span>{backLabel}</span>
          </button>
        )}
        {/* Il marchio resta solo sulla presentazione iniziale */}
        {isLanding && <Link to="/" className="brand">{t('brand')}</Link>}
      </div>

      <span className="topbar-title">{title}</span>

      <div className="topbar-actions">
        <button
          type="button"
          className="icon-btn"
          onClick={toggle}
          aria-label={theme === 'dark' ? 'Tema chiaro' : 'Tema scuro'}
        >
          {theme === 'dark' ? '☀' : '☾'}
        </button>
      </div>
    </header>
  );
}

type Translate = (key: string) => string;

function titleFor(pathname: string, t: Translate): string {
  if (pathname.startsWith('/build/')) return t('builder.title');
  if (pathname === '/profile') return t('nav.profile');
  if (pathname === '/setup') return 'I tuoi numeri';
  if (pathname === '/setup/profilo') return 'Profilo e attività';
  if (pathname === '/setup/avanzate') return 'Avanzate';
  if (pathname === '/setup/alimenti') return 'I tuoi alimenti';
  if (pathname === '/piano') return 'La settimana';
  if (pathname === '/shopping') return t('nav.tab.shopping');
  if (pathname === HOME) return 'Oggi';
  return '';
}

/** Si torna a Oggi, tranne dalle sotto-pagine di "I tuoi numeri". */
function backLabelFor(pathname: string, t: Translate): string {
  if (pathname === '/profile') return t('nav.back');
  if (pathname.startsWith('/setup/')) return 'I tuoi numeri';
  return 'Oggi';
}
