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
  weight: unknown;
}

export function buildBackup(
  profile: StoredProfile | null,
  plan: unknown,
  customFoods: CustomFood[],
  weight: unknown,
): Backup {
  return { app: 'vatia', version: 1, exportedAt: new Date().toISOString(), profile, plan, customFoods, weight };
}

const LAST_BACKUP_KEY = 'vatia:last-backup:v1';

/** Quando è stato salvato l'ultimo backup, o null se mai. */
export function lastBackupAt(): Date | null {
  try {
    const raw = localStorage.getItem(LAST_BACKUP_KEY);
    if (!raw) return null;
    const d = new Date(raw);
    return Number.isNaN(d.getTime()) ? null : d;
  } catch {
    return null;
  }
}

export function markBackedUp(): void {
  try {
    localStorage.setItem(LAST_BACKUP_KEY, new Date().toISOString());
  } catch { /* ignore */ }
}

/** Giorni interi dall'ultimo backup; null se non ne è mai stato fatto uno. */
export function daysSinceBackup(): number | null {
  const at = lastBackupAt();
  if (!at) return null;
  return Math.floor((Date.now() - at.getTime()) / 86_400_000);
}

export function describeLastBackup(): string {
  const days = daysSinceBackup();
  if (days == null) return 'Non ne hai ancora fatto uno.';
  if (days === 0) return 'Ultimo backup: oggi.';
  if (days === 1) return 'Ultimo backup: ieri.';
  return `Ultimo backup: ${days} giorni fa.`;
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
      weight: parsed.weight ?? null,
    };
  }
  return {
    app: 'vatia',
    version: 1,
    exportedAt: '',
    profile: csvToProfile(trimmed),
    plan: null,
    customFoods: [],
    weight: null,
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
