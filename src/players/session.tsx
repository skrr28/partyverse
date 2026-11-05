/**
 * Sesión de invitado (autenticación anónima de Supabase) y perfil del jugador.
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabaseConfig } from '@/backend/config';
import { getSupabase } from '@/backend/supabase';
import { api } from '@/backend/api';
import { PartyError, toPartyError } from '@/backend/errors';
import type { Profile } from '@/backend/types';

type Status = 'unconfigured' | 'loading' | 'signedOut' | 'signedIn';

interface SessionValue {
  status: Status;
  userId: string | null;
  profile: Profile | null;
  /** true cuando ya se consultó el perfil del usuario actual (exista o no). */
  profileLoaded: boolean;
  profileError: PartyError | null;
  signInAsGuest: () => Promise<void>;
  saveProfile: (nickname: string, avatar: string) => Promise<Profile>;
  reloadProfile: () => Promise<void>;
  signOut: () => Promise<void>;
}

const SessionContext = createContext<SessionValue | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<Status>(supabaseConfig.isConfigured ? 'loading' : 'unconfigured');
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [profileLoadedFor, setProfileLoadedFor] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<PartyError | null>(null);
  const userId = session?.user.id ?? null;

  useEffect(() => {
    if (!supabaseConfig.isConfigured) return;
    const supabase = getSupabase();
    let mounted = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setSession(data.session);
      setStatus(data.session ? 'signedIn' : 'signedOut');
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      setStatus(s ? 'signedIn' : 'signedOut');
      if (!s) setProfile(null);
    });
    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const reloadProfile = useCallback(async () => {
    if (!userId) return;
    setProfileError(null);
    try {
      setProfile(await api.getMyProfile(userId));
      setProfileLoadedFor(userId);
    } catch (e) {
      setProfileError(toPartyError(e));
    }
  }, [userId]);

  useEffect(() => {
    reloadProfile();
  }, [reloadProfile]);

  const signInAsGuest = useCallback(async () => {
    const { error } = await getSupabase().auth.signInAnonymously();
    if (error) {
      if (/anonymous sign-ins are disabled/i.test(error.message)) {
        throw new PartyError(
          'ANON_DISABLED',
          'Los accesos de invitado están desactivados en Supabase (Authentication → Sign In / Providers → Anonymous).',
        );
      }
      throw toPartyError(error);
    }
  }, []);

  const saveProfile = useCallback(async (nickname: string, avatar: string) => {
    const p = await api.upsertProfile(nickname, avatar);
    setProfile(p);
    if (userId) setProfileLoadedFor(userId);
    return p;
  }, [userId]);

  const signOut = useCallback(async () => {
    await getSupabase().auth.signOut();
  }, []);

  const profileLoaded = userId !== null && profileLoadedFor === userId;
  const value = useMemo(
    () => ({ status, userId, profile, profileLoaded, profileError, signInAsGuest, saveProfile, reloadProfile, signOut }),
    [status, userId, profile, profileLoaded, profileError, signInAsGuest, saveProfile, reloadProfile, signOut],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionValue {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error('useSession debe usarse dentro de <SessionProvider>');
  return ctx;
}
