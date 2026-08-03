'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { apiFetch, getAccessToken, getApiBaseUrl } from '@/lib/nela-api';
import type {
  BillingManageResponse,
  BillingPricesResponse,
  CheckoutResponse,
  ConfirmCheckoutResponse,
  CreditPackId,
} from '@/lib/api-types';

function q(params: URLSearchParams, key: string): string | undefined {
  const v = params.get(key);
  return v && v.trim() ? v.trim() : undefined;
}

export default function BillingClient() {
  const searchParams = useSearchParams();
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [success, setSuccess] = useState(false);
  const [prices, setPrices] = useState<BillingPricesResponse | null>(null);
  const autoStarted = useRef(false);
  const confirmStarted = useRef(false);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch(`${getApiBaseUrl()}/v1/billing/prices`);
        if (!res.ok) return;
        const data = (await res.json()) as BillingPricesResponse;
        if (!cancelled) setPrices(data);
      } catch {
        /* keep null */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const ensureAuth = (nextPath?: string) => {
    if (!getAccessToken()) {
      const next = nextPath ?? '/account/billing';
      window.location.href = `/login?next=${encodeURIComponent(next)}`;
      return false;
    }
    return true;
  };

  const checkoutPlan = async (plan: 'starter' | 'pro') => {
    if (!ensureAuth(`/account/billing?plan=${plan}&auto=1`)) return;
    setBusy(true);
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
      setBusy(false);
    }
  };

  const checkoutPack = async (packId: CreditPackId) => {
    if (!ensureAuth(`/account/billing?pack=${packId}&auto=1`)) return;
    setBusy(true);
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

  const confirmPaid = async () => {
    if (!ensureAuth('/account/billing?paid=1')) return;
    setBusy(true);
    setMessage('Confirming payment…');
    setSuccess(false);
    try {
      const planParam = searchParams.get('plan');
      const plan =
        planParam === 'starter' || planParam === 'pro' ? planParam : undefined;
      const packParam = searchParams.get('pack');
      const packId =
        packParam === 'nano' || packParam === 'plus' || packParam === 'max'
          ? packParam
          : undefined;
      const body = {
        plan,
        packId,
        paymentLinkId: q(searchParams, 'razorpay_payment_link_id'),
        razorpayPaymentId: q(searchParams, 'razorpay_payment_id'),
        razorpayPaymentLinkId: q(searchParams, 'razorpay_payment_link_id'),
        razorpayPaymentLinkReferenceId: q(
          searchParams,
          'razorpay_payment_link_reference_id',
        ),
        razorpayPaymentLinkStatus: q(
          searchParams,
          'razorpay_payment_link_status',
        ),
        razorpaySignature: q(searchParams, 'razorpay_signature'),
      };
      const res = await apiFetch<ConfirmCheckoutResponse>(
        '/v1/billing/razorpay/confirm',
        {
          method: 'POST',
          body: JSON.stringify(body),
        },
      );
      if (res.isPremium || res.paidCloud || res.displayPlan === 'premium') {
        setSuccess(true);
        setMessage(
          res.isPremium
            ? "You're on Premium — Smart and Deep are unlocked in Cloud."
            : 'Credits added — Smart and Deep unlocked while balance lasts.',
        );
      } else {
        setMessage(
          'Payment recorded, but not active yet. Wait a moment and tap Confirm again.',
        );
      }
    } catch (err) {
      setMessage(
        err instanceof Error
          ? err.message
          : 'Could not activate Premium from this payment',
      );
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    if (autoStarted.current) return;

    if (searchParams.get('paid') === '1') {
      if (confirmStarted.current) return;
      confirmStarted.current = true;
      autoStarted.current = true;
      void confirmPaid();
      return;
    }

    const plan = searchParams.get('plan');
    const pack = searchParams.get('pack');
    const auto = searchParams.get('auto') === '1';
    if (auto && (plan === 'starter' || plan === 'pro')) {
      autoStarted.current = true;
      void checkoutPlan(plan);
      return;
    }
    if (
      auto &&
      (pack === 'nano' || pack === 'plus' || pack === 'max')
    ) {
      autoStarted.current = true;
      void checkoutPack(pack);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const starterLabel = prices?.plans.starter.priceLabel ?? '₹399 / mo';
  const proLabel = prices?.plans.pro.priceLabel ?? '₹999 / mo';
  const packs = prices?.packs ?? [];

  return (
    <main className="min-h-screen px-4 pb-16 pt-24 sm:px-6 sm:pt-28">
      <div className="mx-auto max-w-2xl">
        <h1 className="mb-2 font-space text-3xl font-bold tracking-tight sm:text-4xl">
          Billing
        </h1>
        <p className="mb-8" style={{ color: 'var(--text-secondary)' }}>
          Subscriptions grant monthly credits. Packs top up the same wallet and
          roll over. Checkout is INR via Razorpay.
        </p>

        <div className="mb-6 flex flex-wrap gap-3">
          <button
            type="button"
            disabled={busy}
            onClick={() => void checkoutPlan('starter')}
            className="rounded-full px-5 py-2 font-medium disabled:opacity-60"
            style={{ background: 'var(--accent)', color: 'var(--bg-primary)' }}
          >
            {busy ? 'Working…' : `Starter — ${starterLabel}`}
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => void checkoutPlan('pro')}
            className="rounded-full border px-5 py-2 font-medium disabled:opacity-60"
            style={{ borderColor: 'var(--border-primary)' }}
          >
            Pro — {proLabel}
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
          <button
            type="button"
            disabled={busy}
            onClick={() => void confirmPaid()}
            className="rounded-full border px-5 py-2 font-medium disabled:opacity-60"
            style={{ borderColor: 'var(--border-primary)' }}
          >
            Confirm payment
          </button>
        </div>

        {packs.length > 0 ? (
          <div className="mb-6">
            <p className="mb-3 text-sm font-medium">Buy credits</p>
            <div className="flex flex-wrap gap-3">
              {packs.map((pack) => (
                <button
                  key={pack.id}
                  type="button"
                  disabled={busy}
                  onClick={() => void checkoutPack(pack.id)}
                  className="rounded-full border px-5 py-2 text-sm font-medium disabled:opacity-60"
                  style={{ borderColor: 'var(--border-primary)' }}
                >
                  {pack.label} — {pack.credits} cr · {pack.priceLabel}
                </button>
              ))}
            </div>
          </div>
        ) : null}

        {message ? (
          <p
            className="mb-4 text-sm"
            style={{
              color: success ? 'var(--accent)' : '#e11d48',
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
