import type { CapacitorConfig } from '@capacitor/cli';

/**
 * Involucro nativo iOS.
 *
 * Vatia resta la stessa app: Capacitor prende la cartella `dist` e la
 * mette dentro un guscio Xcode. Niente plugin, niente rete — il
 * database alimenti è già nel bundle e i dati stanno sul dispositivo.
 *
 * Da costruire con `npm run build:native` (base "/" invece del
 * sottopercorso di GitHub Pages).
 */
const config: CapacitorConfig = {
  appId: 'it.nicoloproietti.vatia',
  appName: 'Vatia',
  webDir: 'dist',
  ios: {
    contentInset: 'always',
    backgroundColor: '#ffffff',
  },
};

export default config;
