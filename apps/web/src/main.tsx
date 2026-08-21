import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
// HashRouter (not HashRouter) so the SPA works on GitHub Pages
// without a server-side rewrite: navigation stays in the URL fragment.
import { HashRouter } from 'react-router-dom';
import { App } from './App.tsx';
import { LocaleProvider } from './i18n/LocaleContext.tsx';
import { ProfileProvider } from './state/ProfileContext.tsx';
import { ThemeProvider } from './state/ThemeContext.tsx';
import './styles.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <LocaleProvider>
        <ProfileProvider>
          <HashRouter>
            <App />
          </HashRouter>
        </ProfileProvider>
      </LocaleProvider>
    </ThemeProvider>
  </StrictMode>,
);
