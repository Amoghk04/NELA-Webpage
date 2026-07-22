'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import type { UserProfileDto } from '@nela/shared';
import {
  apiFetch,
  clearTokens,
  getAccessToken,
  getRefreshToken,
  getStoredProfile,
  refreshSession,
  storeSession,
  type StoredProfile,
} from '@/lib/nela-api';

type AuthContextValue = {
  user: UserProfileDto | null;
  isAuthenticated: boolean;
  isReady: boolean;
  setSession: (input: {
    accessToken: string;
    refreshToken: string;
    profile: UserProfileDto;
  }) => void;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue>({
  user: null,
  isAuthenticated: false,
  isReady: false,
  setSession: () => {},
  signOut: async () => {},
  refreshUser: async () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}

function toUser(profile: StoredProfile | UserProfileDto | null): UserProfileDto | null {
  if (!profile) return null;
  return profile as UserProfileDto;
}

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfileDto | null>(null);
  const [hasSession, setHasSession] = useState(false);
  const [isReady, setIsReady] = useState(false);

  const hydrateFromStorage = useCallback(() => {
    const tokenPresent = Boolean(getAccessToken() || getRefreshToken());
    setHasSession(tokenPresent);
    if (!tokenPresent) {
      setUser(null);
      return false;
    }
    setUser(toUser(getStoredProfile()));
    return true;
  }, []);

  const refreshUser = useCallback(async () => {
    if (!getAccessToken() && !getRefreshToken()) {
      setHasSession(false);
      setUser(null);
      return;
    }

    try {
      if (!getAccessToken()) {
        const ok = await refreshSession();
        if (!ok) {
          setHasSession(false);
          setUser(null);
          return;
        }
      }
      const me = await apiFetch<UserProfileDto>('/v1/me');
      const accessToken = getAccessToken();
      const refreshToken = getRefreshToken();
      if (accessToken && refreshToken) {
        storeSession({ accessToken, refreshToken, profile: me });
      }
      setHasSession(true);
      setUser(me);
    } catch {
      const ok = await refreshSession();
      if (ok) {
        try {
          const me = await apiFetch<UserProfileDto>('/v1/me');
          setHasSession(true);
          setUser(me);
          return;
        } catch {
          // fall through
        }
      }
      clearTokens();
      setHasSession(false);
      setUser(null);
    }
  }, []);

  useEffect(() => {
    const present = hydrateFromStorage();
    setIsReady(true);

    if (present) {
      void refreshUser();
    }

    const onStorage = (event: StorageEvent) => {
      if (
        event.key === 'nela_access_token' ||
        event.key === 'nela_refresh_token' ||
        event.key === 'nela_profile' ||
        event.key === null
      ) {
        hydrateFromStorage();
      }
    };

    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [hydrateFromStorage, refreshUser]);

  const setSession = useCallback(
    (input: {
      accessToken: string;
      refreshToken: string;
      profile: UserProfileDto;
    }) => {
      storeSession(input);
      setHasSession(true);
      setUser(input.profile);
    },
    [],
  );

  const signOut = useCallback(async () => {
    try {
      const refreshToken = getRefreshToken();
      await apiFetch('/v1/auth/logout', {
        method: 'POST',
        auth: false,
        body: JSON.stringify({ refreshToken }),
      });
    } catch {
      // Always clear local session even if the API call fails.
    }
    clearTokens();
    setHasSession(false);
    setUser(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated: hasSession || Boolean(user),
      isReady,
      setSession,
      signOut,
      refreshUser,
    }),
    [user, hasSession, isReady, setSession, signOut, refreshUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
