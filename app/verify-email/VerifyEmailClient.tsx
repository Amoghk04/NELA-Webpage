'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { apiFetch } from '@/lib/nela-api';
import type { EmailVerifyResponse } from '@/lib/api-types';
import { friendlyErrorFromUnknown } from '@/lib/friendlyError';

type State =
  | { kind: 'loading' }
  | { kind: 'ok'; email: string; message: string }
  | { kind: 'error'; message: string };

export default function VerifyEmailClient() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token')?.trim() ?? '';
  const [state, setState] = useState<State>({ kind: 'loading' });

  useEffect(() => {
    if (!token) {
      setState({
        kind: 'error',
        message:
          'This verification link is missing a token. Open the link from your email, or request a new one on the sign-in page.',
      });
      return;
    }

    let cancelled = false;
    void (async () => {
      try {
        const result = await apiFetch<EmailVerifyResponse>('/v1/auth/email/verify', {
          method: 'POST',
          auth: false,
          body: JSON.stringify({ token }),
        });
        if (!cancelled) {
          setState({
            kind: 'ok',
            email: result.email,
            message: result.message,
          });
        }
      } catch (err) {
        if (!cancelled) {
          setState({ kind: 'error', message: friendlyErrorFromUnknown(err) });
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [token]);

  return (
    <main className="min-h-screen px-4 pb-16 pt-24 sm:px-6 sm:pt-28">
      <div className="mx-auto max-w-lg">
        <h1 className="mb-3 font-space text-3xl font-bold tracking-tight sm:text-4xl">
          Verify email
        </h1>
        <p className="mb-8" style={{ color: 'var(--text-secondary)' }}>
          Confirming your NELA Cloud account.
        </p>

        <div
          className="rounded-2xl border p-5"
          style={{
            borderColor: 'var(--border-primary)',
            background: 'var(--bg-card)',
          }}
        >
          {state.kind === 'loading' ? (
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              Verifying…
            </p>
          ) : null}
          {state.kind === 'ok' ? (
            <>
              <p className="text-sm" style={{ color: 'var(--text-primary)' }}>
                {state.message}
              </p>
              <p className="mt-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
                Signed up as {state.email}
              </p>
              <Link
                href="/login?verified=1"
                className="mt-6 inline-flex w-full items-center justify-center rounded-full px-5 py-3 font-semibold"
                style={{ background: 'var(--accent)', color: 'var(--bg-primary)' }}
              >
                Continue to sign in
              </Link>
            </>
          ) : null}
          {state.kind === 'error' ? (
            <>
              <p className="text-sm" style={{ color: '#e11d48' }}>
                {state.message}
              </p>
              <Link
                href="/login"
                className="mt-6 inline-flex w-full items-center justify-center rounded-full border px-5 py-3 font-semibold"
                style={{ borderColor: 'var(--border-primary)' }}
              >
                Back to sign in
              </Link>
            </>
          ) : null}
        </div>
      </div>
    </main>
  );
}
