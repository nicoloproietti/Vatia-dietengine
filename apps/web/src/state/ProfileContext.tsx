import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import type { Profile } from '@vatia/diet-engine';

export interface StoredProfile extends Profile {
  excludes: string[];
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
    return JSON.parse(raw) as StoredProfile;
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
