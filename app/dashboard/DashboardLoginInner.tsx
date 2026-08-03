'use client';

import { FormEvent, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { adminLogin } from '@/lib/admin-api';

export default function DashboardLoginInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await adminLogin(password);
      const next = searchParams.get('next');
      router.replace(
        next && next.startsWith('/dashboard/') ? next : '/dashboard/overview',
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6">
      <h1 className="mb-2 font-space text-2xl font-bold">Admin</h1>
      <p className="mb-6 text-sm" style={{ color: 'var(--text-secondary)' }}>
        Separate password login. Not linked from the public site.
      </p>
      <form onSubmit={(e) => void onSubmit(e)} className="space-y-3">
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Admin password"
          className="w-full rounded-xl border px-4 py-3"
          style={{
            borderColor: 'var(--border-primary)',
            background: 'var(--bg-secondary)',
          }}
          autoComplete="current-password"
        />
        {error ? (
          <p className="text-sm" style={{ color: '#e11d48' }}>
            {error}
          </p>
        ) : null}
        <button
          type="submit"
          disabled={busy || !password}
          className="rounded-full px-5 py-2 font-medium disabled:opacity-50"
          style={{ background: 'var(--accent)', color: 'var(--bg-primary)' }}
        >
          {busy ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    </main>
  );
}
