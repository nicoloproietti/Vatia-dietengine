import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { App } from './App.tsx';
import { LocaleProvider } from './i18n/LocaleContext.tsx';
import { ProfileProvider } from './state/ProfileContext.tsx';
import './styles.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <LocaleProvider>
      <ProfileProvider>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </ProfileProvider>
    </LocaleProvider>
  </StrictMode>,
);
