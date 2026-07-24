'use client';

import { useState } from 'react';
import Link from 'next/link';
import { apiFetch, getAccessToken } from '@/lib/nela-api';
import type { CheckoutResponse } from '@nela/shared';

const plans = [
  {
    id: 'free',
    name: 'Free',
    price: '$0',
    blurb: 'Private local mode forever. Cloud inference locked.',
  },
  {
    id: 'starter',
    name: 'Starter',
    price: 'From $4 credit',
    blurb: 'Fast Cloud with monthly included usage and standard limits.',
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 'From $20 credit',
    blurb: 'Higher quotas, deeper reasoning models, artifact planning.',
  },
] as const;

export default function PricingPage() {
  const [busyPlan, setBusyPlan] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const payNow = async (plan: 'starter' | 'pro') => {
    if (!getAccessToken()) {
      window.location.href = `/login?next=${encodeURIComponent(`/account/billing?plan=${plan}&auto=1`)}`;
      return;
    }

    setBusyPlan(plan);
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
      window.location.href = res.checkoutUrl;
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Checkout failed');
      setBusyPlan(null);
    }
  };

  return (
    <main className="min-h-screen pt-28 px-6 pb-16">
      <div className="max-w-4xl mx-auto">
        <h1 className="font-space text-4xl md:text-5xl font-bold tracking-tight mb-3">
          Pricing
        </h1>
        <p className="mb-12 max-w-2xl" style={{ color: 'var(--text-secondary)' }}>
          Local-first by default. Pay only when you want Fast Cloud through NELA
          Cloud.
        </p>

        {message ? (
          <p className="mb-6 text-sm" style={{ color: '#e11d48' }}>
            {message}
          </p>
        ) : null}

        <div className="grid md:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className="p-6 rounded-2xl border"
              style={{
                borderColor: 'var(--border-primary)',
                background: 'var(--bg-card)',
              }}
            >
              <h2 className="font-space text-2xl font-bold mb-1">{plan.name}</h2>
              <p className="mb-4 font-medium" style={{ color: 'var(--accent)' }}>
                {plan.price}
              </p>
              <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>
                {plan.blurb}
              </p>
              {plan.id === 'free' ? (
                <Link
                  href="/download"
                  className="inline-flex rounded-full px-4 py-2 text-sm font-semibold"
                  style={{
                    background: 'var(--accent)',
                    color: 'var(--bg-primary)',
                  }}
                >
                  Download
                </Link>
              ) : (
                <button
                  type="button"
                  disabled={busyPlan !== null}
                  onClick={() => void payNow(plan.id)}
                  className="inline-flex rounded-full px-4 py-2 text-sm font-semibold disabled:opacity-60"
                  style={{
                    background: 'var(--accent)',
                    color: 'var(--bg-primary)',
                  }}
                >
                  {busyPlan === plan.id ? 'Opening Razorpay…' : 'Pay Now'}
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
