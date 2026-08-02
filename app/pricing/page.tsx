'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { apiFetch, getAccessToken } from '@/lib/nela-api';
import type {
  CheckoutResponse,
  ConfirmCheckoutResponse,
  EntitlementResponse,
} from '@/lib/api-types';

const plans = [
  {
    id: 'free',
    name: 'Free',
    price: '$0',
    blurb:
      'Private local Fast/Smart/Deep forever. Cloud Fast included; Smart/Deep require Premium.',
  },
  {
    id: 'starter',
    name: 'Starter',
    price: 'From $4 credit',
    blurb:
      'Premium Cloud: unlock Smart and Deep plus monthly included usage.',
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 'From $20 credit',
    blurb:
      'Premium Cloud with higher quotas, deeper reasoning, and artifact planning.',
  },
] as const;

export default function PricingPage() {
  const [busyPlan, setBusyPlan] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const paid = params.get('paid') === '1';
    if (!paid) return;
    let cancelled = false;
    void (async () => {
      try {
        if (!getAccessToken()) {
          if (!cancelled) {
            setMessage(
              'Sign in to activate Premium for this payment, then open Billing → Confirm Premium.',
            );
          }
          return;
        }
        const planParam = params.get('plan');
        const plan =
          planParam === 'starter' || planParam === 'pro' ? planParam : undefined;
        const q = (key: string) => {
          const v = params.get(key);
          return v && v.trim() ? v.trim() : undefined;
        };
        const confirmed = await apiFetch<ConfirmCheckoutResponse>(
          '/v1/billing/razorpay/confirm',
          {
            method: 'POST',
            body: JSON.stringify({
              plan,
              paymentLinkId: q('razorpay_payment_link_id'),
              razorpayPaymentId: q('razorpay_payment_id'),
              razorpayPaymentLinkId: q('razorpay_payment_link_id'),
              razorpayPaymentLinkReferenceId: q(
                'razorpay_payment_link_reference_id',
              ),
              razorpayPaymentLinkStatus: q('razorpay_payment_link_status'),
              razorpaySignature: q('razorpay_signature'),
            }),
          },
        );
        if (cancelled) return;
        if (
          confirmed.isPremium ||
          confirmed.paidCloud ||
          confirmed.displayPlan === 'premium'
        ) {
          setSuccess(true);
          setMessage(
            "You're on Premium — Smart and Deep are unlocked in Cloud.",
          );
          return;
        }
        const ent = await apiFetch<EntitlementResponse>('/v1/me/entitlement');
        if (cancelled) return;
        if (ent.isPremium || ent.paidCloud || ent.displayPlan === 'premium') {
          setSuccess(true);
          setMessage(
            "You're on Premium — Smart and Deep are unlocked in Cloud.",
          );
        } else {
          setMessage(
            'Payment received but Premium is not active yet. Open Billing and tap Confirm Premium.',
          );
        }
      } catch (err) {
        if (!cancelled) {
          setMessage(
            err instanceof Error
              ? err.message
              : 'Could not activate Premium. Open Billing and tap Confirm Premium.',
          );
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const payNow = async (plan: 'starter' | 'pro') => {
    if (!getAccessToken()) {
      window.location.href = `/login?next=${encodeURIComponent(`/account/billing?plan=${plan}&auto=1`)}`;
      return;
    }

    setBusyPlan(plan);
    setMessage(null);
    setSuccess(false);
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
          Local-first by default. Cloud Fast is included on Free. Upgrade to
          Premium (Starter or Pro) for Smart and Deep in Cloud.
        </p>

        {message ? (
          <p
            className="mb-6 text-sm"
            style={{ color: success ? 'var(--accent)' : '#e11d48' }}
          >
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
