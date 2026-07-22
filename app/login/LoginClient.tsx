'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { apiFetch, getApiBaseUrl } from '@/lib/nela-api';
import type { AuthTokenResponse } from '@nela/shared';
import { useAuth } from '@/components/AuthProvider';

type Mode = 'login' | 'register';

export default function LoginClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated, isReady, setSession } = useAuth();
  const deviceCode = searchParams.get('deviceCode');
  const source = searchParams.get('source');
  const exchange = searchParams.get('exchange');
  const error = searchParams.get('error');
  const signedIn = searchParams.get('signedIn') === '1';
  const [status, setStatus] = useState('Ready');
  const [busy, setBusy] = useState(false);
  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  const returnTo = '/account';

  const webGoogleStartUrl = useMemo(() => {
    const url = new URL(`${getApiBaseUrl()}/v1/auth/google/web/start`);
    url.searchParams.set('returnTo', '/account');
    return url.toString();
  }, []);

  const deviceGoogleStartUrl = useMemo(() => {
    if (!deviceCode) return null;
    const url = new URL(`${getApiBaseUrl()}/v1/auth/google/start`);
    url.searchParams.set('deviceCode', deviceCode);
    url.searchParams.set('returnTo', returnTo);
    url.searchParams.set('source', 'device');
    return url.toString();
  }, [deviceCode, returnTo]);

  const isDesktopApproval = Boolean(deviceCode) && !signedIn && !exchange;
  const isCompleting = Boolean(exchange) || (signedIn && source === 'web');

  useEffect(() => {
    if (!isReady || deviceCode || exchange || signedIn) return;
    if (isAuthenticated) router.replace(returnTo);
  }, [isReady, isAuthenticated, deviceCode, exchange, signedIn, router, returnTo]);

  useEffect(() => {
    if (!exchange) return;
    let cancelled = false;

    void (async () => {
      try {
        setStatus('Finishing sign-in…');
        const result = await apiFetch<AuthTokenResponse>('/v1/auth/web/exchange', {
          method: 'POST',
          auth: false,
          body: JSON.stringify({ code: exchange }),
        });
        setSession(result);
        setStatus('Signed in. Redirecting…');
        router.replace(returnTo);
      } catch (err) {
        if (!cancelled) {
          setStatus(err instanceof Error ? err.message : 'Sign-in failed');
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [exchange, setSession, router, returnTo]);

  const submitEmail = async (event: FormEvent) => {
    event.preventDefault();
    setFormError(null);
    setBusy(true);
    try {
      const path =
        mode === 'register' ? '/v1/auth/email/register' : '/v1/auth/email/login';
      const result = await apiFetch<AuthTokenResponse>(path, {
        method: 'POST',
        auth: false,
        body: JSON.stringify({
          email,
          password,
          name: mode === 'register' ? name || undefined : undefined,
          deviceName: 'NELA Web',
        }),
      });
      setSession(result);
      setStatus('Signed in. Redirecting…');
      router.replace(returnTo);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Authentication failed');
      setBusy(false);
    }
  };

  return (
    <main className="min-h-screen px-4 pb-16 pt-24 sm:px-6 sm:pt-28">
      <div className="mx-auto max-w-lg">
        <h1 className="mb-3 font-space text-3xl font-bold tracking-tight sm:text-4xl">
          Sign in to NELA Cloud
        </h1>
        <p className="mb-8" style={{ color: 'var(--text-secondary)' }}>
          {isDesktopApproval
            ? 'Approve this desktop login with your Google account.'
            : 'Use Google or email — no desktop app required.'}
        </p>

        {error ? (
          <p className="mb-4 text-sm" style={{ color: '#e11d48' }}>
            OAuth error: {error}
          </p>
        ) : null}

        {isCompleting ? (
          <div
            className="mb-6 rounded-2xl border p-4"
            style={{
              borderColor: 'var(--border-primary)',
              background: 'var(--bg-card)',
            }}
          >
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              Completing browser sign-in…
            </p>
          </div>
        ) : null}

        {isDesktopApproval ? (
          <div
            className="mb-6 rounded-2xl border p-4"
            style={{
              borderColor: 'var(--border-primary)',
              background: 'var(--bg-card)',
            }}
          >
            <p className="mb-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
              Desktop device login pending
            </p>
            <code className="break-all text-sm">{deviceCode}</code>
          </div>
        ) : null}

        {!isCompleting ? (
          <>
            {isDesktopApproval && deviceGoogleStartUrl ? (
              <a
                href={deviceGoogleStartUrl}
                className="mb-6 inline-flex w-full items-center justify-center rounded-full px-5 py-3 font-semibold"
                style={{ background: 'var(--accent)', color: 'var(--bg-primary)' }}
                onClick={() => setStatus('Redirecting to Google…')}
              >
                Approve with Google
              </a>
            ) : (
              <>
                <a
                  href={webGoogleStartUrl}
                  className="mb-4 inline-flex w-full items-center justify-center rounded-full px-5 py-3 font-semibold"
                  style={{ background: 'var(--accent)', color: 'var(--bg-primary)' }}
                  onClick={() => setStatus('Redirecting to Google…')}
                >
                  Continue with Google
                </a>

                <div className="relative mb-6 text-center text-sm" style={{ color: 'var(--text-tertiary)' }}>
                  <span
                    className="relative z-10 px-3"
                    style={{ background: 'var(--bg-primary)' }}
                  >
                    or
                  </span>
                  <span
                    className="absolute left-0 right-0 top-1/2 h-px"
                    style={{ background: 'var(--border-primary)' }}
                  />
                </div>

                <div className="mb-4 flex gap-2">
                  <button
                    type="button"
                    className="flex-1 rounded-full px-4 py-2 text-sm font-medium border"
                    style={{
                      borderColor: 'var(--border-primary)',
                      background: mode === 'login' ? 'var(--bg-card)' : 'transparent',
                    }}
                    onClick={() => setMode('login')}
                  >
                    Sign in
                  </button>
                  <button
                    type="button"
                    className="flex-1 rounded-full px-4 py-2 text-sm font-medium border"
                    style={{
                      borderColor: 'var(--border-primary)',
                      background: mode === 'register' ? 'var(--bg-card)' : 'transparent',
                    }}
                    onClick={() => setMode('register')}
                  >
                    Create account
                  </button>
                </div>

                <form onSubmit={(e) => void submitEmail(e)} className="space-y-3">
                  {mode === 'register' ? (
                    <label className="block text-sm">
                      <span className="mb-1 block" style={{ color: 'var(--text-secondary)' }}>
                        Name
                      </span>
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full rounded-xl border px-4 py-3 outline-none"
                        style={{
                          borderColor: 'var(--border-primary)',
                          background: 'var(--bg-card)',
                          color: 'var(--text-primary)',
                        }}
                        autoComplete="name"
                      />
                    </label>
                  ) : null}
                  <label className="block text-sm">
                    <span className="mb-1 block" style={{ color: 'var(--text-secondary)' }}>
                      Email
                    </span>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full rounded-xl border px-4 py-3 outline-none"
                      style={{
                        borderColor: 'var(--border-primary)',
                        background: 'var(--bg-card)',
                        color: 'var(--text-primary)',
                      }}
                      autoComplete="email"
                    />
                  </label>
                  <label className="block text-sm">
                    <span className="mb-1 block" style={{ color: 'var(--text-secondary)' }}>
                      Password
                    </span>
                    <input
                      type="password"
                      required
                      minLength={8}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full rounded-xl border px-4 py-3 outline-none"
                      style={{
                        borderColor: 'var(--border-primary)',
                        background: 'var(--bg-card)',
                        color: 'var(--text-primary)',
                      }}
                      autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
                    />
                  </label>
                  {formError ? (
                    <p className="text-sm" style={{ color: '#e11d48' }}>
                      {formError}
                    </p>
                  ) : null}
                  <button
                    type="submit"
                    disabled={busy}
                    className="w-full rounded-full px-5 py-3 font-semibold border disabled:opacity-60"
                    style={{ borderColor: 'var(--border-primary)' }}
                  >
                    {busy
                      ? 'Please wait…'
                      : mode === 'register'
                        ? 'Create account'
                        : 'Sign in with email'}
                  </button>
                </form>
              </>
            )}
          </>
        ) : null}

        <p className="mt-6 text-sm" style={{ color: 'var(--text-tertiary)' }}>
          {status}
        </p>

        {!isDesktopApproval && !isCompleting ? (
          <p className="mt-4 text-sm" style={{ color: 'var(--text-secondary)' }}>
            Signing in from NELA Desktop? Open the link shown in the app, then
            approve with Google here.
          </p>
        ) : null}

        <p className="mt-10 text-sm" style={{ color: 'var(--text-secondary)' }}>
          By continuing you agree to our{' '}
          <a href="/terms" style={{ color: 'var(--accent)' }}>
            Terms
          </a>{' '}
          and{' '}
          <a href="/privacy" style={{ color: 'var(--accent)' }}>
            Privacy Policy
          </a>
          .
        </p>
      </div>
    </main>
  );
}
