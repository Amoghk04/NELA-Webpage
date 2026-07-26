'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { apiFetch, getAccessToken } from '@/lib/nela-api';
import type { BillingManageResponse, CheckoutResponse } from '@/lib/api-types';

export default function BillingClient() {
  const searchParams = useSearchParams();
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const autoStarted = useRef(false);

  const ensureAuth = (nextPath?: string) => {
    if (!getAccessToken()) {
      const next = nextPath ?? '/account/billing';
      window.location.href = `/login?next=${encodeURIComponent(next)}`;
      return false;
    }
    return true;
  };

  const checkout = async (plan: 'starter' | 'pro') => {
    if (!ensureAuth(`/account/billing?plan=${plan}&auto=1`)) return;
    setBusy(true);
    setMessage(null);
    try {
      const res = await apiFetch<CheckoutResponse>(
        '/v1/billing/razorpay/checkout',
        {
          method: 'POST',
          body: JSON.stringify({ plan }),
        },
      );
      if (!res.checkoutUrl) {
        throw new Error('No Razorpay checkout URL returned');
      }
      // Hosted Razorpay page (subscription short_url or payment link)
      window.location.href = res.checkoutUrl;
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Checkout failed');
      setBusy(false);
    }
  };

  const manage = async () => {
    if (!ensureAuth()) return;
    setBusy(true);
    setMessage(null);
    try {
      const res = await apiFetch<BillingManageResponse>(
        '/v1/billing/razorpay/manage',
        { method: 'POST', body: '{}' },
      );
      window.location.href = res.manageUrl;
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Manage failed');
      setBusy(false);
    }
  };

  useEffect(() => {
    if (autoStarted.current) return;

    if (searchParams.get('paid') === '1') {
      setMessage(
        'Payment received. Entitlements activate after Razorpay webhook confirmation.',
      );
      return;
    }

    const plan = searchParams.get('plan');
    const auto = searchParams.get('auto') === '1';
    if (auto && (plan === 'starter' || plan === 'pro')) {
      autoStarted.current = true;
      void checkout(plan);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run once on mount for ?auto=1
  }, [searchParams]);

  const isPaidReturn = searchParams.get('paid') === '1';

  return (
    <main className="min-h-screen px-4 pb-16 pt-24 sm:px-6 sm:pt-28">
      <div className="mx-auto max-w-2xl">
        <h1 className="mb-2 font-space text-3xl font-bold tracking-tight sm:text-4xl">
          Billing
        </h1>
        <p className="mb-8" style={{ color: 'var(--text-secondary)' }}>
          Pay Now opens Razorpay hosted checkout using your configured test or
          live keys. Entitlements activate from webhooks after payment succeeds.
        </p>

        <div className="mb-6 flex flex-wrap gap-3">
          <button
            type="button"
            disabled={busy}
            onClick={() => void checkout('starter')}
            className="rounded-full px-5 py-2 font-medium disabled:opacity-60"
            style={{ background: 'var(--accent)', color: 'var(--bg-primary)' }}
          >
            {busy ? 'Opening Razorpay…' : 'Pay Now — Starter'}
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => void checkout('pro')}
            className="rounded-full border px-5 py-2 font-medium disabled:opacity-60"
            style={{ borderColor: 'var(--border-primary)' }}
          >
            Pay Now — Pro
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => void manage()}
            className="rounded-full border px-5 py-2 font-medium disabled:opacity-60"
            style={{ borderColor: 'var(--border-primary)' }}
          >
            Manage subscription
          </button>
        </div>

        {message ? (
          <p
            className="mb-4 text-sm"
            style={{
              color: isPaidReturn ? 'var(--accent)' : '#e11d48',
            }}
          >
            {message}
          </p>
        ) : null}

        <Link href="/account" style={{ color: 'var(--accent)' }}>
          ← Back to account
        </Link>
      </div>
    </main>
  );
}
