'use client';

import { FormEvent, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Crown, LogOut, Save } from 'lucide-react';
import { apiFetch } from '@/lib/nela-api';
import { useAuth } from '@/components/AuthProvider';
import type { EntitlementResponse, UserProfileDto } from '@nela/shared';

export default function AccountPage() {
  const router = useRouter();
  const { user, isAuthenticated, isReady, setSession, signOut } = useAuth();
  const [profile, setProfile] = useState<UserProfileDto | null>(user);
  const [entitlement, setEntitlement] = useState<EntitlementResponse | null>(
    null,
  );
  const [name, setName] = useState(user?.name ?? '');
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isReady) return;
    if (!isAuthenticated) {
      router.replace('/login');
      return;
    }

    let cancelled = false;
    void (async () => {
      try {
        const [me, ent] = await Promise.all([
          apiFetch<UserProfileDto>('/v1/me'),
          apiFetch<EntitlementResponse>('/v1/me/entitlement'),
        ]);
        if (cancelled) return;
        setProfile(me);
        setName(me.name);
        setEntitlement(ent);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load account');
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isReady, isAuthenticated, router]);

  useEffect(() => {
    if (user) {
      setProfile(user);
      setName(user.name);
    }
  }, [user]);

  const plan = (profile?.plan ?? 'free').toLowerCase();
  const isPaid = plan === 'starter' || plan === 'pro';
  const planTitle = plan === 'pro' ? 'Pro' : plan === 'starter' ? 'Starter' : 'Free';

  const handleSave = async (event: FormEvent) => {
    event.preventDefault();
    if (!profile) return;
    setSaving(true);
    setError(null);
    setNotice(null);
    try {
      const updated = await apiFetch<UserProfileDto>('/v1/me', {
        method: 'PATCH',
        body: JSON.stringify({ name }),
      });
      setProfile(updated);
      const accessToken = window.localStorage.getItem('nela_access_token');
      const refreshToken = window.localStorage.getItem('nela_refresh_token');
      if (accessToken && refreshToken) {
        setSession({ accessToken, refreshToken, profile: updated });
      }
      setNotice('Profile saved');
      setTimeout(() => setNotice(null), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    router.replace('/');
  };

  return (
    <main className="min-h-screen px-4 pb-16 pt-24 sm:px-6 sm:pt-28">
      <div className="mx-auto max-w-2xl">
        <h1 className="mb-2 font-space text-3xl font-bold tracking-tight sm:text-4xl">
          Profile
        </h1>
        <p className="mb-8" style={{ color: 'var(--text-secondary)' }}>
          Manage your NELA Cloud profile, plan, and quota.
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
          <>
            <div
              className="mb-6 flex items-start gap-3 rounded-2xl border p-4"
              style={{
                borderColor: 'var(--border-primary)',
                background: isPaid ? 'var(--accent-glow)' : 'var(--bg-card)',
              }}
            >
              <Crown className="mt-0.5 h-4 w-4 shrink-0" style={{ color: 'var(--accent)' }} />
              <div>
                <p className="font-semibold">{planTitle} plan</p>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                  {isPaid
                    ? 'Your plan is managed by NELA Cloud.'
                    : 'Upgrade anytime from Billing when you are ready.'}
                </p>
              </div>
            </div>

            <div
              className="mb-6 rounded-2xl border p-6"
              style={{
                borderColor: 'var(--border-primary)',
                background: 'var(--bg-card)',
              }}
            >
              <div className="mb-6 flex items-center gap-4">
                {profile.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={profile.avatarUrl}
                    alt=""
                    className="h-16 w-16 rounded-full object-cover"
                  />
                ) : (
                  <div
                    className="flex h-16 w-16 items-center justify-center rounded-full text-xl font-semibold"
                    style={{ background: 'var(--bg-secondary)' }}
                  >
                    {profile.name.slice(0, 1).toUpperCase()}
                  </div>
                )}
                <div>
                  <p className="text-lg font-semibold">{profile.name}</p>
                  <p style={{ color: 'var(--text-secondary)' }}>{profile.email}</p>
                  <p className="mt-1 text-xs" style={{ color: 'var(--text-tertiary)' }}>
                    Signed in with {profile.authProvider === 'google' ? 'Google' : 'email'}
                    {' · '}
                    Status: {profile.entitlementStatus}
                  </p>
                </div>
              </div>

              <form onSubmit={(e) => void handleSave(e)} className="space-y-3">
                <label className="block text-sm">
                  <span className="mb-1 block" style={{ color: 'var(--text-secondary)' }}>
                    Display name
                  </span>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full rounded-xl border px-4 py-3 outline-none"
                    style={{
                      borderColor: 'var(--border-primary)',
                      background: 'var(--bg-secondary)',
                      color: 'var(--text-primary)',
                    }}
                    autoComplete="name"
                  />
                </label>
                <label className="block text-sm">
                  <span className="mb-1 block" style={{ color: 'var(--text-secondary)' }}>
                    Email
                  </span>
                  <input
                    type="email"
                    value={profile.email}
                    disabled
                    className="w-full rounded-xl border px-4 py-3 opacity-70"
                    style={{
                      borderColor: 'var(--border-primary)',
                      background: 'var(--bg-secondary)',
                      color: 'var(--text-primary)',
                    }}
                  />
                </label>
                {notice ? (
                  <p className="text-sm" style={{ color: 'var(--accent)' }}>
                    {notice}
                  </p>
                ) : null}
                <button
                  type="submit"
                  disabled={saving || !name.trim() || name === profile.name}
                  className="inline-flex items-center gap-2 rounded-full px-5 py-2 font-medium disabled:opacity-50"
                  style={{ background: 'var(--accent)', color: 'var(--bg-primary)' }}
                >
                  <Save className="h-4 w-4" />
                  {saving ? 'Saving…' : 'Save'}
                </button>
              </form>
            </div>
          </>
        ) : (
          <p style={{ color: 'var(--text-secondary)' }}>Loading profile…</p>
        )}

        {entitlement ? (
          <div
            className="mb-6 rounded-2xl border p-6"
            style={{
              borderColor: 'var(--border-primary)',
              background: 'var(--bg-card)',
            }}
          >
            <h2 className="mb-2 font-semibold">Cloud entitlement</h2>
            <p className="mb-1 text-sm">
              Cloud enabled: {entitlement.cloudEnabled ? 'yes' : 'no'}
            </p>
            <p className="mb-1 text-sm">
              Quota: ${entitlement.quota.usedUsd.toFixed(2)} / $
              {entitlement.quota.includedUsd.toFixed(2)} used
              {' '}(${entitlement.quota.remainingUsd.toFixed(2)} remaining)
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
            href="/account/link-device"
            className="rounded-full px-5 py-2 font-medium border"
            style={{ borderColor: 'var(--border-primary)' }}
          >
            Link desktop
          </Link>
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
            onClick={() => void handleSignOut()}
            className="inline-flex items-center gap-2 rounded-full px-5 py-2 font-medium border"
            style={{ borderColor: 'var(--border-primary)' }}
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </div>
      </div>
    </main>
  );
}
