export async function adminFetch<T>(path: string, init?: RequestInit): Promise<T> {
  // Always go through the Next proxy so the httpOnly cookie is attached.
  const normalized = path.startsWith('/') ? path.slice(1) : path;
  const res = await fetch(`/api/admin/proxy/${normalized}`, {
    ...init,
    credentials: 'same-origin',
    cache: 'no-store',
  });
  if (res.status === 401) {
    throw new Error('Admin session expired');
  }
  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as {
      message?: string;
    } | null;
    throw new Error(body?.message ?? `Admin request failed (${res.status})`);
  }
  return res.json() as Promise<T>;
}

export async function adminLogin(password: string): Promise<void> {
  const res = await fetch('/api/admin/login', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ password }),
    credentials: 'same-origin',
  });
  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as {
      message?: string;
    } | null;
    throw new Error(body?.message ?? 'Invalid admin password');
  }
}

export async function adminLogout(): Promise<void> {
  await fetch('/api/admin/logout', {
    method: 'POST',
    credentials: 'same-origin',
  });
}
