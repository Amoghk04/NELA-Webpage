const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

export function getApiBaseUrl(): string {
  return API_BASE.replace(/\/$/, "");
}

export function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem("nela_access_token");
}

export function getRefreshToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem("nela_refresh_token");
}

export function storeTokens(input: {
  accessToken: string;
  refreshToken: string;
}): void {
  window.localStorage.setItem("nela_access_token", input.accessToken);
  window.localStorage.setItem("nela_refresh_token", input.refreshToken);
}

export function clearTokens(): void {
  window.localStorage.removeItem("nela_access_token");
  window.localStorage.removeItem("nela_refresh_token");
  window.localStorage.removeItem("nela_profile");
}

export async function apiFetch<T>(
  path: string,
  init: RequestInit & { auth?: boolean } = {},
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

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(
      (err as { message?: string }).message ??
        `API ${res.status} ${res.statusText}`,
    );
  }

  return (await res.json()) as T;
}
