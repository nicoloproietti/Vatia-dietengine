import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
// HashRouter (not HashRouter) so the SPA works on GitHub Pages
// without a server-side rewrite: navigation stays in the URL fragment.
import { HashRouter } from 'react-router-dom';
import { App } from './App.tsx';
import { PlanProvider } from './state/PlanContext.tsx';
import { ProfileProvider } from './state/ProfileContext.tsx';
import { ThemeProvider } from './state/ThemeContext.tsx';
import './styles.css';

// Profilo e piano vivono in localStorage, che il sistema può ripulire
// per fare spazio. Questa chiamata chiede di considerarli permanenti;
// se il browser dice di no, pazienza — resta il backup CSV.
if (navigator.storage?.persist) {
  navigator.storage.persist().catch(() => { /* niente da fare */ });
}

// Il service worker tiene i file in cache: dopo la prima apertura Vatia
// funziona anche senza connessione. In dev darebbe solo fastidio.
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`).catch(() => {
      // niente offline: l'app resta comunque usabile
    });
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <ProfileProvider>
        <PlanProvider>
          <HashRouter>
            <App />
          </HashRouter>
        </PlanProvider>
      </ProfileProvider>
    </ThemeProvider>
  </StrictMode>,
);
