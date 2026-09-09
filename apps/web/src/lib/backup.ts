import type { StoredProfile } from '../state/ProfileContext.tsx';
import type { CustomFood } from '../state/FoodsContext.tsx';
import { csvToProfile } from './csv.ts';

/**
 * Un backup è una fotografia completa: profilo, piano della settimana e
 * alimenti aggiunti a mano. Prima esportavamo solo il profilo, e chi lo
 * ripristinava si ritrovava la settimana vuota.
 */
export interface Backup {
  app: 'vatia';
  version: 1;
  exportedAt: string;
  profile: StoredProfile | null;
  plan: unknown;
  customFoods: CustomFood[];
}

export function buildBackup(
  profile: StoredProfile | null,
  plan: unknown,
  customFoods: CustomFood[],
): Backup {
  return { app: 'vatia', version: 1, exportedAt: new Date().toISOString(), profile, plan, customFoods };
}

export function backupFilename(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `vatia-${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}.json`;
}

/**
 * Legge un backup. Accetta anche i vecchi CSV di solo profilo: chi ne
 * ha uno salvato da prima deve poterlo ancora usare.
 */
export function parseBackup(text: string): Backup {
  const trimmed = text.trim();
  if (trimmed.startsWith('{')) {
    const parsed = JSON.parse(trimmed) as Partial<Backup>;
    if (parsed.app !== 'vatia') throw new Error('Non è un backup di Vatia');
    return {
      app: 'vatia',
      version: 1,
      exportedAt: parsed.exportedAt ?? '',
      profile: parsed.profile ?? null,
      plan: parsed.plan ?? null,
      customFoods: Array.isArray(parsed.customFoods) ? parsed.customFoods : [],
    };
  }
  return {
    app: 'vatia',
    version: 1,
    exportedAt: '',
    profile: csvToProfile(trimmed),
    plan: null,
    customFoods: [],
  };
}

/**
 * Consegna il file all'utente. Su iPhone passa dal foglio di
 * condivisione, così si può salvare in iCloud Drive o in File; altrove
 * scarica e basta.
 */
export async function shareBackup(filename: string, content: string): Promise<'shared' | 'downloaded'> {
  const type = 'application/json';
  const file = new File([content], filename, { type });

  if (navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: 'Backup Vatia' });
      return 'shared';
    } catch (err) {
      // L'utente ha annullato: non è un errore da segnalare.
      if (err instanceof DOMException && err.name === 'AbortError') return 'shared';
    }
  }

  const url = URL.createObjectURL(new Blob([content], { type }));
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 0);
  return 'downloaded';
}
