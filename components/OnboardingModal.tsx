'use client';

import { useMemo, useState } from 'react';
import { apiFetch } from '@/lib/nela-api';
import type { UserProfileDto } from '@/lib/api-types';
import {
  ONBOARDING_FIELDS,
  ONBOARDING_OCCUPATIONS,
  type OnboardingFieldId,
  type OnboardingOccupationId,
} from '@/lib/onboarding';
import { friendlyErrorFromUnknown } from '@/lib/friendlyError';
import { useAuth } from '@/components/AuthProvider';

type Step = 0 | 1;

export default function OnboardingModal() {
  const { user, isReady, isAuthenticated, setSession, refreshUser } = useAuth();
  const [step, setStep] = useState<Step>(0);
  const [occupation, setOccupation] = useState<OnboardingOccupationId | null>(
    null,
  );
  const [field, setField] = useState<OnboardingFieldId | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const open = useMemo(
    () =>
      isReady &&
      isAuthenticated &&
      Boolean(user) &&
      user?.onboardingCompleted === false,
    [isReady, isAuthenticated, user],
  );

  if (!open || !user) return null;

  const persist = async (input: {
    occupation?: OnboardingOccupationId | null;
    field?: OnboardingFieldId | null;
    completeOnboarding?: boolean;
  }) => {
    setBusy(true);
    setError(null);
    try {
      const updated = await apiFetch<UserProfileDto>('/v1/me', {
        method: 'PATCH',
        body: JSON.stringify(input),
      });
      const accessToken = window.localStorage.getItem('nela_access_token');
      const refreshToken = window.localStorage.getItem('nela_refresh_token');
      if (accessToken && refreshToken) {
        setSession({ accessToken, refreshToken, profile: updated });
      } else {
        await refreshUser();
      }
    } catch (err) {
      setError(friendlyErrorFromUnknown(err));
      throw err;
    } finally {
      setBusy(false);
    }
  };

  const skip = async () => {
    try {
      await persist({ completeOnboarding: true });
    } catch {
      // error shown
    }
  };

  const next = async () => {
    try {
      if (step === 0) {
        if (occupation) {
          await persist({ occupation });
        }
        setStep(1);
        return;
      }
      await persist({
        ...(field ? { field } : {}),
        completeOnboarding: true,
      });
    } catch {
      // error shown
    }
  };

  const options = step === 0 ? ONBOARDING_OCCUPATIONS : ONBOARDING_FIELDS;
  const selected = step === 0 ? occupation : field;
  const title =
    step === 0 ? 'What best describes you?' : 'What field are you in?';
  const subtitle =
    step === 0
      ? 'This helps us tailor NELA to how you work.'
      : 'Pick the area closest to your work or studies.';

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center px-4"
      style={{ background: 'rgba(8, 10, 14, 0.55)' }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="onboarding-title"
    >
      <div
        className="w-full max-w-md rounded-3xl border p-6 shadow-xl sm:p-7"
        style={{
          borderColor: 'var(--border-primary)',
          background: 'var(--bg-primary)',
        }}
      >
        <p className="mb-2 text-xs font-medium uppercase tracking-wide" style={{ color: 'var(--text-tertiary)' }}>
          Step {step + 1} of 2
        </p>
        <h2
          id="onboarding-title"
          className="mb-2 font-space text-2xl font-bold tracking-tight"
        >
          {title}
        </h2>
        <p className="mb-5 text-sm" style={{ color: 'var(--text-secondary)' }}>
          {subtitle}
        </p>

        <div className="mb-6 flex flex-wrap gap-2">
          {options.map((opt) => {
            const isSelected = selected === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                disabled={busy}
                onClick={() => {
                  if (step === 0) {
                    setOccupation(opt.id as OnboardingOccupationId);
                  } else {
                    setField(opt.id as OnboardingFieldId);
                  }
                }}
                className="rounded-full border px-3.5 py-2 text-sm font-medium transition disabled:opacity-60"
                style={{
                  borderColor: isSelected ? 'var(--accent)' : 'var(--border-primary)',
                  background: isSelected ? 'var(--bg-card)' : 'transparent',
                  color: 'var(--text-primary)',
                }}
              >
                {opt.label}
              </button>
            );
          })}
        </div>

        {error ? (
          <p className="mb-4 text-sm" style={{ color: '#e11d48' }}>
            {error}
          </p>
        ) : null}

        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            disabled={busy}
            onClick={() => void skip()}
            className="text-sm font-medium disabled:opacity-60"
            style={{ color: 'var(--text-secondary)' }}
          >
            Skip
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => void next()}
            className="rounded-full px-5 py-2.5 text-sm font-semibold disabled:opacity-60"
            style={{ background: 'var(--accent)', color: 'var(--bg-primary)' }}
          >
            {busy ? 'Saving…' : step === 1 ? 'Finish' : 'Next'}
          </button>
        </div>
      </div>
    </div>
  );
}
