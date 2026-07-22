'use client';

import { useState } from 'react';
import Link from 'next/link';
import { apiFetch, getAccessToken } from '@/lib/nela-api';
import type { BillingManageResponse, CheckoutResponse } from '@nela/shared';

export default function BillingPage() {
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const ensureAuth = () => {
    if (!getAccessToken()) {
      window.location.href = '/login';
      return false;
    }
    return true;
  };

  const checkout = async (plan: 'starter' | 'pro') => {
    if (!ensureAuth()) return;
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

  return (
    <main className="min-h-screen pt-28 px-6 pb-16">
      <div className="max-w-2xl mx-auto">
        <h1 className="font-space text-4xl font-bold tracking-tight mb-2">
          Billing
        </h1>
        <p className="mb-8" style={{ color: 'var(--text-secondary)' }}>
          Upgrade or manage your Razorpay subscription. Entitlements activate
          from webhooks, not checkout redirects alone.
        </p>

        <div className="flex flex-wrap gap-3 mb-6">
          <button
            type="button"
            disabled={busy}
            onClick={() => void checkout('starter')}
            className="rounded-full px-5 py-2 font-medium"
            style={{ background: 'var(--accent)', color: 'var(--bg-primary)' }}
          >
            Upgrade to Starter
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => void checkout('pro')}
            className="rounded-full px-5 py-2 font-medium border"
            style={{ borderColor: 'var(--border-primary)' }}
          >
            Upgrade to Pro
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => void manage()}
            className="rounded-full px-5 py-2 font-medium border"
            style={{ borderColor: 'var(--border-primary)' }}
          >
            Manage subscription
          </button>
        </div>

        {message ? (
          <p className="text-sm mb-4" style={{ color: '#e11d48' }}>
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
