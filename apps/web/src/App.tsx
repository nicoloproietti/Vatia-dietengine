import { Link, Navigate, NavLink, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { useLocale } from './i18n/LocaleContext.tsx';
import { useTheme } from './state/ThemeContext.tsx';
import { useProfile } from './state/ProfileContext.tsx';
import { LandingPage } from './pages/Landing.tsx';
import { ImportPromptPage } from './pages/ImportPrompt.tsx';
import { ProfilePage } from './pages/Profile.tsx';
import { SetupPage } from './pages/Setup.tsx';
import { PianoPage } from './pages/Piano.tsx';
import { BuildMealPage } from './pages/BuildMeal.tsx';
import { ShoppingPage } from './pages/Shopping.tsx';
import { IconBag, IconChevronLeft, IconPlan, IconSliders } from './components/Icons.tsx';

/** Sezioni radice: hanno la tab bar e nessun tasto indietro. */
const TAB_ROOTS = ['/piano', '/setup', '/shopping'];

export function App() {
  const { t } = useLocale();
  const { profile } = useProfile();
  const { pathname } = useLocation();

  const showTabBar = profile != null && TAB_ROOTS.includes(pathname);

  return (
    <div className={`app-shell ${showTabBar ? 'has-tabbar' : ''}`}>
      <NavBar />
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

      {showTabBar ? <TabBar /> : null}

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

  const isHome = pathname === '/';
  const isTabRoot = TAB_ROOTS.includes(pathname);
  const showBack = !isHome && !isTabRoot;

  const title = isHome ? '' : titleFor(pathname, t);
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
        {/* Il marchio resta solo fuori dalle sezioni con tab bar */}
        {!showBack && !isTabRoot && <Link to="/" className="brand">{t('brand')}</Link>}
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

/** Tab bar di sistema: le tre sezioni dell'app. */
function TabBar() {
  const { t } = useLocale();
  const tabs = [
    { to: '/piano',    label: t('nav.tab.plan'),     Icon: IconPlan },
    { to: '/setup',    label: t('nav.tab.setup'),    Icon: IconSliders },
    { to: '/shopping', label: t('nav.tab.shopping'), Icon: IconBag },
  ];

  return (
    <nav className="tabbar" aria-label={t('brand')}>
      {tabs.map(({ to, label, Icon }) => (
        <NavLink
          key={to}
          to={to}
          className={({ isActive }) => `tabbar-item ${isActive ? 'is-active' : ''}`}
        >
          {({ isActive }) => (
            <>
              <span className="tabbar-icon"><Icon filled={isActive} /></span>
              <span className="tabbar-label">{label}</span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
}

type Translate = (key: string) => string;

function titleFor(pathname: string, t: Translate): string {
  if (pathname.startsWith('/build/')) return t('builder.title');
  if (pathname === '/import') return t('import.eyebrow');
  if (pathname === '/profile') return t('nav.profile');
  if (pathname === '/setup') return t('nav.tab.setup');
  if (pathname === '/piano') return t('nav.tab.plan');
  if (pathname === '/shopping') return t('nav.tab.shopping');
  return '';
}

function backLabelFor(pathname: string, t: Translate): string {
  if (pathname.startsWith('/build/')) return t('nav.tab.plan');
  if (pathname === '/import') return t('brand');
  return t('nav.back');
}
