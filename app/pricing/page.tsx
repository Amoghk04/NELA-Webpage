'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { apiFetch, getAccessToken, getApiBaseUrl } from '@/lib/nela-api';
import type {
  BillingPricesResponse,
  CheckoutResponse,
  ConfirmCheckoutResponse,
  CreditPackId,
  EntitlementResponse,
} from '@/lib/api-types';

export default function PricingPage() {
  const [prices, setPrices] = useState<BillingPricesResponse | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch(`${getApiBaseUrl()}/v1/billing/prices`);
        if (!res.ok) throw new Error('Failed to load prices');
        const data = (await res.json()) as BillingPricesResponse;
        if (!cancelled) setPrices(data);
      } catch {
        if (!cancelled) {
          setPrices(null);
          setMessage('Could not load live prices. Showing defaults.');
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

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
              'Sign in to activate this payment, then open Billing → Confirm.',
            );
          }
          return;
        }
        const planParam = params.get('plan');
        const plan =
          planParam === 'starter' || planParam === 'pro' ? planParam : undefined;
        const packParam = params.get('pack');
        const packId =
          packParam === 'nano' || packParam === 'plus' || packParam === 'max'
            ? packParam
            : undefined;
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
              packId,
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
            confirmed.isPremium
              ? "You're on Premium — Smart and Deep are unlocked in Cloud."
              : 'Credits added — Smart and Deep are unlocked while your balance lasts.',
          );
          return;
        }
        const ent = await apiFetch<EntitlementResponse>('/v1/me/entitlement');
        if (cancelled) return;
        if (ent.isPremium || ent.paidCloud || ent.displayPlan === 'premium') {
          setSuccess(true);
          setMessage("You're unlocked for Smart and Deep in Cloud.");
        } else {
          setMessage(
            'Payment received but not active yet. Open Billing and tap Confirm.',
          );
        }
      } catch (err) {
        if (!cancelled) {
          setMessage(
            err instanceof Error
              ? err.message
              : 'Could not activate payment. Open Billing and tap Confirm.',
          );
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const payPlan = async (plan: 'starter' | 'pro') => {
    if (!getAccessToken()) {
      window.location.href = `/login?next=${encodeURIComponent(`/account/billing?plan=${plan}&auto=1`)}`;
      return;
    }
    setBusy(plan);
    setMessage(null);
    setSuccess(false);
    try {
      const res = await apiFetch<CheckoutResponse>(
        '/v1/billing/razorpay/checkout',
        {
          method: 'POST',
          body: JSON.stringify({ type: 'subscription', plan }),
        },
      );
      if (!res.checkoutUrl) throw new Error('No Razorpay checkout URL returned');
      window.location.href = res.checkoutUrl;
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Checkout failed');
      setBusy(null);
    }
  };

  const payPack = async (packId: CreditPackId) => {
    if (!getAccessToken()) {
      window.location.href = `/login?next=${encodeURIComponent(`/account/billing?pack=${packId}&auto=1`)}`;
      return;
    }
    setBusy(packId);
    setMessage(null);
    setSuccess(false);
    try {
      const res = await apiFetch<CheckoutResponse>(
        '/v1/billing/razorpay/checkout',
        {
          method: 'POST',
          body: JSON.stringify({ type: 'credits', packId }),
        },
      );
      if (!res.checkoutUrl) throw new Error('No Razorpay checkout URL returned');
      window.location.href = res.checkoutUrl;
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Checkout failed');
      setBusy(null);
    }
  };

  const freeLabel = prices?.plans.free.priceLabel ?? '₹0';
  const starterLabel = prices?.plans.starter.priceLabel ?? '₹399 / mo';
  const proLabel = prices?.plans.pro.priceLabel ?? '₹999 / mo';
  const starterCredits = prices?.plans.starter.monthlyCredits ?? 800;
  const proCredits = prices?.plans.pro.monthlyCredits ?? 2000;
  const fastLimit = prices?.fastFree.limit ?? 8;
  const fastWindow = prices?.fastFree.windowHours ?? 6;
  const packs = prices?.packs ?? [
    { id: 'nano' as const, label: 'Nano', credits: 200, priceLabel: '₹199', amountPaise: 19900 },
    { id: 'plus' as const, label: 'Plus', credits: 800, priceLabel: '₹799', amountPaise: 79900 },
    { id: 'max' as const, label: 'Max', credits: 2000, priceLabel: '₹1,799', amountPaise: 179900 },
  ];

  return (
    <main className="min-h-screen pt-28 px-6 pb-16">
      <div className="max-w-4xl mx-auto">
        <h1 className="font-space text-4xl md:text-5xl font-bold tracking-tight mb-3">
          Pricing
        </h1>
        <p className="mb-12 max-w-2xl" style={{ color: 'var(--text-secondary)' }}>
          Local-first by default. Cloud Fast: {fastLimit} / {fastWindow}h on Free.
          Premium grants monthly credits; pay-as-you-go packs top up the same wallet.
          {prices ? ` Prices for ${prices.country} (INR checkout).` : null}
        </p>

        {message ? (
          <p
            className="mb-6 text-sm"
            style={{ color: success ? 'var(--accent)' : '#e11d48' }}
          >
            {message}
          </p>
        ) : null}

        <div className="grid md:grid-cols-3 gap-6 mb-14">
          <div
            className="p-6 rounded-2xl border"
            style={{
              borderColor: 'var(--border-primary)',
              background: 'var(--bg-card)',
            }}
          >
            <h2 className="font-space text-2xl font-bold mb-1">Free</h2>
            <p className="mb-4 font-medium" style={{ color: 'var(--accent)' }}>
              {freeLabel}
            </p>
            <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>
              Private local modes forever. Cloud Fast {fastLimit}/{fastWindow}h.
              Buy credits anytime for Smart/Deep.
            </p>
            <Link
              href="/download"
              className="inline-flex rounded-full px-4 py-2 text-sm font-semibold"
              style={{ background: 'var(--accent)', color: 'var(--bg-primary)' }}
            >
              Download
            </Link>
          </div>

          <div
            className="p-6 rounded-2xl border"
            style={{
              borderColor: 'var(--border-primary)',
              background: 'var(--bg-card)',
            }}
          >
            <h2 className="font-space text-2xl font-bold mb-1">Starter</h2>
            <p className="mb-4 font-medium" style={{ color: 'var(--accent)' }}>
              {starterLabel}
            </p>
            <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>
              Premium Cloud: Smart + Deep with {starterCredits} credits / month.
            </p>
            <button
              type="button"
              disabled={busy !== null}
              onClick={() => void payPlan('starter')}
              className="inline-flex rounded-full px-4 py-2 text-sm font-semibold disabled:opacity-60"
              style={{ background: 'var(--accent)', color: 'var(--bg-primary)' }}
            >
              {busy === 'starter' ? 'Opening Razorpay…' : 'Pay Now'}
            </button>
          </div>

          <div
            className="p-6 rounded-2xl border"
            style={{
              borderColor: 'var(--border-primary)',
              background: 'var(--bg-card)',
            }}
          >
            <h2 className="font-space text-2xl font-bold mb-1">Pro</h2>
            <p className="mb-4 font-medium" style={{ color: 'var(--accent)' }}>
              {proLabel}
            </p>
            <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>
              Higher pool: {proCredits} credits / month, higher RPM, deeper work.
            </p>
            <button
              type="button"
              disabled={busy !== null}
              onClick={() => void payPlan('pro')}
              className="inline-flex rounded-full px-4 py-2 text-sm font-semibold disabled:opacity-60"
              style={{ background: 'var(--accent)', color: 'var(--bg-primary)' }}
            >
              {busy === 'pro' ? 'Opening Razorpay…' : 'Pay Now'}
            </button>
          </div>
        </div>

        <h2 className="font-space text-2xl font-bold mb-2">Buy credits</h2>
        <p className="mb-6 text-sm" style={{ color: 'var(--text-secondary)' }}>
          Pay as you go — packs roll over. Same wallet as subscription grants.
        </p>
        <div className="grid md:grid-cols-3 gap-6">
          {packs.map((pack) => (
            <div
              key={pack.id}
              className="p-6 rounded-2xl border"
              style={{
                borderColor: 'var(--border-primary)',
                background: 'var(--bg-card)',
              }}
            >
              <h3 className="font-space text-xl font-bold mb-1">{pack.label}</h3>
              <p className="mb-1 font-medium" style={{ color: 'var(--accent)' }}>
                {pack.priceLabel}
              </p>
              <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>
                {pack.credits} credits
              </p>
              <button
                type="button"
                disabled={busy !== null}
                onClick={() => void payPack(pack.id)}
                className="inline-flex rounded-full px-4 py-2 text-sm font-semibold disabled:opacity-60"
                style={{ background: 'var(--accent)', color: 'var(--bg-primary)' }}
              >
                {busy === pack.id ? 'Opening Razorpay…' : 'Buy'}
              </button>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
