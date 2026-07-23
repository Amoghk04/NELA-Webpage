const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

const ACCESS_KEY = "nela_access_token";
const REFRESH_KEY = "nela_refresh_token";
const PROFILE_KEY = "nela_profile";

export type StoredProfile = {
  id: string;
  name: string;
  email: string;
  avatarUrl: string | null;
  authProvider: "google" | "email";
  plan: string;
  entitlementStatus: string;
  updatedAt: string;
};

export function getApiBaseUrl(): string {
  return API_BASE.replace(/\/$/, "");
}

export function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(ACCESS_KEY);
}

export function getRefreshToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(REFRESH_KEY);
}

export function getStoredProfile(): StoredProfile | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(PROFILE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as StoredProfile;
  } catch {
    return null;
  }
}

export function storeProfile(profile: StoredProfile): void {
  window.localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
}

export function storeTokens(input: {
  accessToken: string;
  refreshToken: string;
}): void {
  window.localStorage.setItem(ACCESS_KEY, input.accessToken);
  window.localStorage.setItem(REFRESH_KEY, input.refreshToken);
}

export function storeSession(input: {
  accessToken: string;
  refreshToken: string;
  profile: StoredProfile;
}): void {
  storeTokens(input);
  storeProfile(input.profile);
}

export function clearTokens(): void {
  window.localStorage.removeItem(ACCESS_KEY);
  window.localStorage.removeItem(REFRESH_KEY);
  window.localStorage.removeItem(PROFILE_KEY);
}

export function isLoggedIn(): boolean {
  return Boolean(getAccessToken() || getRefreshToken());
}

let refreshInFlight: Promise<boolean> | null = null;

/** Refresh access token using the stored refresh token. Dedupes concurrent calls. */
export async function refreshSession(): Promise<boolean> {
  if (typeof window === "undefined") return false;
  if (refreshInFlight) return refreshInFlight;

  refreshInFlight = (async () => {
    const refreshToken = getRefreshToken();
    if (!refreshToken) return false;

    try {
      const res = await fetch(`${getApiBaseUrl()}/v1/auth/refresh`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ refreshToken }),
      });

      if (!res.ok) {
        clearTokens();
        return false;
      }

      const data = (await res.json()) as {
        accessToken: string;
        refreshToken: string;
        profile: StoredProfile;
      };

      storeSession({
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
        profile: data.profile,
      });
      return true;
    } catch {
      return false;
    } finally {
      refreshInFlight = null;
    }
  })();

  return refreshInFlight;
}

export async function apiFetch<T>(
  path: string,
  init: RequestInit & { auth?: boolean; _retried?: boolean } = {},
): Promise<T> {
  const headers = new Headers(init.headers);
  if (!headers.has("content-type") && init.body) {
    headers.set("content-type", "application/json");
  }
  if (init.auth !== false) {
    const token = getAccessToken();
    if (token) headers.set("authorization", `Bearer ${token}`);
  }

  const res = await fetch(`${getApiBaseUrl()}${path}`, {
    ...init,
    headers,
  });

  if (res.status === 401 && init.auth !== false && !init._retried) {
    const refreshed = await refreshSession();
    if (refreshed) {
      return apiFetch<T>(path, { ...init, _retried: true });
    }
    clearTokens();
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(
      (err as { message?: string }).message ??
        `API ${res.status} ${res.statusText}`,
    );
  }

  return (await res.json()) as T;
}
