import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
// HashRouter (not HashRouter) so the SPA works on GitHub Pages
// without a server-side rewrite: navigation stays in the URL fragment.
import { HashRouter } from 'react-router-dom';
import { App } from './App.tsx';
import { LocaleProvider } from './i18n/LocaleContext.tsx';
import { PlanProvider } from './state/PlanContext.tsx';
import { ProfileProvider } from './state/ProfileContext.tsx';
import { ThemeProvider } from './state/ThemeContext.tsx';
import './styles.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <LocaleProvider>
        <ProfileProvider>
          <PlanProvider>
            <HashRouter>
              <App />
            </HashRouter>
          </PlanProvider>
        </ProfileProvider>
      </LocaleProvider>
    </ThemeProvider>
  </StrictMode>,
);
