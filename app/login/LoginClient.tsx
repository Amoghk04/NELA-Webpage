'use client';

import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  apiFetch,
  clearTokens,
  getApiBaseUrl,
  storeTokens,
} from '@/lib/nela-api';
import type { DevicePollResponse } from '@nela/shared';

export default function LoginClient() {
  const searchParams = useSearchParams();
  const deviceCode = searchParams.get('deviceCode');
  const error = searchParams.get('error');
  const [status, setStatus] = useState<string>('Ready');
  const [manualCode, setManualCode] = useState(deviceCode ?? '');

  const googleStartUrl = useMemo(() => {
    const code = manualCode || deviceCode;
    if (!code) return null;
    const url = new URL(`${getApiBaseUrl()}/v1/auth/google/start`);
    url.searchParams.set('deviceCode', code);
    url.searchParams.set('returnTo', '/account');
    return url.toString();
  }, [manualCode, deviceCode]);

  useEffect(() => {
    if (!deviceCode) return;
    setManualCode(deviceCode);
  }, [deviceCode]);

  useEffect(() => {
    if (!deviceCode) return;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const shouldWebPoll =
      searchParams.get('signedIn') === '1' &&
      sessionStorage.getItem('nela_web_device_login') === deviceCode;

    if (!shouldWebPoll) {
      if (searchParams.get('signedIn') === '1') {
        setStatus('Signed in. You can return to NELA Desktop.');
      }
      return;
    }

    const poll = async () => {
      try {
        const result = await apiFetch<DevicePollResponse>('/v1/auth/device/poll', {
          method: 'POST',
          auth: false,
          body: JSON.stringify({ deviceCode }),
        });
        if (cancelled) return;
        if (result.status === 'pending') {
          setStatus('Finishing sign-in…');
          timer = setTimeout(poll, 1500);
          return;
        }
        if (result.status === 'approved') {
          storeTokens({
            accessToken: result.accessToken,
            refreshToken: result.refreshToken,
          });
          window.localStorage.setItem(
            'nela_profile',
            JSON.stringify(result.profile),
          );
          sessionStorage.removeItem('nela_web_device_login');
          setStatus('Signed in. Redirecting…');
          const returnTo = searchParams.get('returnTo') || '/account';
          window.location.href = returnTo.startsWith('/') ? returnTo : '/account';
          return;
        }
        setStatus(`Login ${result.status}`);
      } catch (err) {
        if (!cancelled) {
          setStatus(err instanceof Error ? err.message : 'Poll failed');
        }
      }
    };

    void poll();

    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [deviceCode, searchParams]);

  const startWebDeviceLogin = async () => {
    try {
      clearTokens();
      const started = await apiFetch<{
        deviceCode: string;
      }>('/v1/auth/device/start', {
        method: 'POST',
        auth: false,
        body: JSON.stringify({ deviceName: 'NELA Web' }),
      });
      sessionStorage.setItem('nela_web_device_login', started.deviceCode);
      window.location.href = `/login?deviceCode=${encodeURIComponent(started.deviceCode)}`;
    } catch (err) {
      setStatus(err instanceof Error ? err.message : 'Failed to start login');
    }
  };

  return (
    <main className="min-h-screen pt-28 px-6 pb-16">
      <div className="max-w-lg mx-auto">
        <h1 className="font-space text-4xl font-bold tracking-tight mb-3">
          Sign in to NELA Cloud
        </h1>
        <p className="mb-8" style={{ color: 'var(--text-secondary)' }}>
          Continue with Google to approve a desktop device login or access your
          account dashboard.
        </p>

        {error ? (
          <p className="mb-4 text-sm" style={{ color: '#e11d48' }}>
            OAuth error: {error}
          </p>
        ) : null}

        {deviceCode ? (
          <div
            className="mb-6 p-4 rounded-2xl border"
            style={{
              borderColor: 'var(--border-primary)',
              background: 'var(--bg-card)',
            }}
          >
            <p className="text-sm mb-2" style={{ color: 'var(--text-secondary)' }}>
              Device login pending
            </p>
            <code className="text-sm break-all">{deviceCode}</code>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => void startWebDeviceLogin()}
            className="mb-6 w-full rounded-full px-5 py-3 font-medium border"
            style={{
              borderColor: 'var(--border-primary)',
              color: 'var(--text-primary)',
            }}
          >
            Start web sign-in
          </button>
        )}

        {googleStartUrl ? (
          <a
            href={googleStartUrl}
            className="inline-flex w-full items-center justify-center rounded-full px-5 py-3 font-semibold"
            style={{ background: 'var(--accent)', color: 'var(--bg-primary)' }}
            onClick={() => setStatus('Redirecting to Google…')}
          >
            Continue with Google
          </a>
        ) : (
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            Start a device login from NELA Desktop, or use “Start web sign-in”.
          </p>
        )}

        <p className="mt-6 text-sm" style={{ color: 'var(--text-tertiary)' }}>
          {status}
        </p>

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
