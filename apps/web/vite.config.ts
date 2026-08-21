import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// GitHub Pages serves the app at https://<user>.github.io/<repo>/, so the
// bundle must know its base path. Configurable via VITE_BASE for other
// hosts (Vercel/Netlify: VITE_BASE=/).
const base = process.env.VITE_BASE ?? '/Vatia-dietengine/';

export default defineConfig({
  base,
  plugins: [react()],
  build: {
    target: 'es2022',
    sourcemap: true,
  },
});
