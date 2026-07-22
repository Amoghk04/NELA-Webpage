'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { apiFetch, clearTokens, getAccessToken } from '@/lib/nela-api';
import type { EntitlementResponse, UserProfileDto } from '@nela/shared';

export default function AccountPage() {
  const [profile, setProfile] = useState<UserProfileDto | null>(null);
  const [entitlement, setEntitlement] = useState<EntitlementResponse | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!getAccessToken()) {
      window.location.href = '/login';
      return;
    }

    void (async () => {
      try {
        const [me, ent] = await Promise.all([
          apiFetch<UserProfileDto>('/v1/me'),
          apiFetch<EntitlementResponse>('/v1/me/entitlement'),
        ]);
        setProfile(me);
        setEntitlement(ent);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load account');
      }
    })();
  }, []);

  const signOut = async () => {
    try {
      const refreshToken = window.localStorage.getItem('nela_refresh_token');
      await apiFetch('/v1/auth/logout', {
        method: 'POST',
        auth: false,
        body: JSON.stringify({ refreshToken }),
      });
    } catch {
      // ignore
    }
    clearTokens();
    window.location.href = '/';
  };

  return (
    <main className="min-h-screen pt-28 px-6 pb-16">
      <div className="max-w-2xl mx-auto">
        <h1 className="font-space text-4xl font-bold tracking-tight mb-2">
          Account
        </h1>
        <p className="mb-8" style={{ color: 'var(--text-secondary)' }}>
          Manage your NELA Cloud profile and plan.
        </p>

        {error ? (
          <p className="mb-4" style={{ color: '#e11d48' }}>
            {error}{' '}
            <Link href="/login" style={{ color: 'var(--accent)' }}>
              Sign in again
            </Link>
          </p>
        ) : null}

        {profile ? (
          <div
            className="p-6 rounded-2xl border mb-6"
            style={{
              borderColor: 'var(--border-primary)',
              background: 'var(--bg-card)',
            }}
          >
            <div className="flex items-center gap-4 mb-4">
              {profile.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={profile.avatarUrl}
                  alt=""
                  className="w-14 h-14 rounded-full"
                />
              ) : null}
              <div>
                <p className="font-semibold text-lg">{profile.name}</p>
                <p style={{ color: 'var(--text-secondary)' }}>{profile.email}</p>
              </div>
            </div>
            <p className="text-sm">
              Plan: <strong>{profile.plan}</strong> · Status:{' '}
              <strong>{profile.entitlementStatus}</strong>
            </p>
          </div>
        ) : (
          <p style={{ color: 'var(--text-secondary)' }}>Loading profile…</p>
        )}

        {entitlement ? (
          <div
            className="p-6 rounded-2xl border mb-6"
            style={{
              borderColor: 'var(--border-primary)',
              background: 'var(--bg-card)',
            }}
          >
            <h2 className="font-semibold mb-2">Cloud entitlement</h2>
            <p className="text-sm mb-1">
              Enabled: {entitlement.cloudEnabled ? 'yes' : 'no'}
            </p>
            <p className="text-sm mb-1">
              Quota: ${entitlement.quota.usedUsd.toFixed(2)} / $
              {entitlement.quota.includedUsd.toFixed(2)} used
            </p>
            <p className="text-sm">
              Limits: {entitlement.limits.requestsPerMinute} rpm ·{' '}
              {entitlement.limits.maxInputTokens} in /{' '}
              {entitlement.limits.maxOutputTokens} out tokens
            </p>
          </div>
        ) : null}

        <div className="flex flex-wrap gap-3">
          <Link
            href="/account/billing"
            className="rounded-full px-5 py-2 font-medium"
            style={{ background: 'var(--accent)', color: 'var(--bg-primary)' }}
          >
            Billing
          </Link>
          <Link
            href="/pricing"
            className="rounded-full px-5 py-2 font-medium border"
            style={{ borderColor: 'var(--border-primary)' }}
          >
            Pricing
          </Link>
          <button
            type="button"
            onClick={() => void signOut()}
            className="rounded-full px-5 py-2 font-medium border"
            style={{ borderColor: 'var(--border-primary)' }}
          >
            Sign out
          </button>
        </div>
      </div>
    </main>
  );
}
