import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import type { Profile } from '@vatia/diet-engine';

export interface StoredProfile extends Profile {
  excludes: string[];
}

function migrate(raw: unknown): StoredProfile | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;
  // Drop legacy `goal` field (present in v1 exports) — the engine no
  // longer chooses a goal for the user; daily kcal is decided in setup.
  if ('goal' in r) delete r.goal;
  if (typeof r.sex !== 'string' || typeof r.age !== 'number') return null;
  return r as unknown as StoredProfile;
}

interface ProfileValue {
  profile: StoredProfile | null;
  setProfile: (p: StoredProfile | null) => void;
}

const ProfileCtx = createContext<ProfileValue | null>(null);
const STORAGE_KEY = 'vatia:profile:v1';

function loadInitial(): StoredProfile | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return migrate(JSON.parse(raw));
  } catch {
    return null;
  }
}

export function ProfileProvider({ children }: { children: ReactNode }) {
  const [profile, setProfileState] = useState<StoredProfile | null>(loadInitial);

  useEffect(() => {
    try {
      if (profile) localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
      else localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
  }, [profile]);

  const setProfile = useCallback((p: StoredProfile | null) => setProfileState(p), []);
  const value = useMemo(() => ({ profile, setProfile }), [profile, setProfile]);
  return <ProfileCtx.Provider value={value}>{children}</ProfileCtx.Provider>;
}

export function useProfile(): ProfileValue {
  const ctx = useContext(ProfileCtx);
  if (!ctx) throw new Error('useProfile must be used inside ProfileProvider');
  return ctx;
}
