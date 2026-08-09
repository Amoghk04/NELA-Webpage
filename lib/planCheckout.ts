import type { CloudPlan, EntitlementStatus } from './api-types';

export type PaidPlan = 'starter' | 'pro';

const PLAN_RANK: Record<string, number> = {
  free: 0,
  starter: 1,
  pro: 2,
};

function planLabel(plan: string): string {
  if (plan === 'pro') return 'Pro';
  if (plan === 'starter') return 'Starter';
  return 'Free';
}

/**
 * Effective rank for checkout gating. Inactive / cancelled count as free
 * (they may repurchase). Active, past_due, and quota_exhausted keep the plan.
 */
export function activeSubscriptionRank(input: {
  plan?: string | null;
  status?: string | null;
  paidCloud?: boolean | null;
}): number {
  const plan = (input.plan ?? 'free').toLowerCase();
  const status = (input.status ?? '').toLowerCase();
  if (status === 'inactive' || status === 'cancelled') return 0;
  if (plan !== 'starter' && plan !== 'pro') return 0;
  if (
    input.paidCloud === true ||
    status === 'active' ||
    status === 'quota_exhausted' ||
    status === 'past_due'
  ) {
    return PLAN_RANK[plan] ?? 0;
  }
  // Unknown status with a paid plan name — be conservative and treat as owned.
  if (input.paidCloud !== false) return PLAN_RANK[plan] ?? 0;
  return 0;
}

export function effectiveCloudPlan(input: {
  plan?: string | null;
  status?: string | null;
  paidCloud?: boolean | null;
}): CloudPlan {
  const rank = activeSubscriptionRank(input);
  if (rank >= 2) return 'pro';
  if (rank >= 1) return 'starter';
  return 'free';
}

export type PlanCheckoutDecision = {
  allowed: boolean;
  /** Why checkout is blocked (user-facing). */
  reason?: string;
  /** Short button label when blocked or upgrading. */
  ctaLabel?: string;
};

/** Whether the user may open Razorpay for a subscription plan. */
export function evaluatePlanCheckout(input: {
  plan?: string | null;
  status?: string | null | EntitlementStatus;
  paidCloud?: boolean | null;
  target: PaidPlan;
}): PlanCheckoutDecision {
  const currentRank = activeSubscriptionRank(input);
  const targetRank = PLAN_RANK[input.target] ?? 0;
  const current = effectiveCloudPlan(input);
  const currentName = planLabel(current);
  const targetName = planLabel(input.target);

  if (currentRank <= 0) {
    return { allowed: true, ctaLabel: 'Get now' };
  }

  if (currentRank > targetRank) {
    return {
      allowed: false,
      reason: `You're already on ${currentName}, which is a higher tier than ${targetName}.`,
      ctaLabel: 'Higher plan active',
    };
  }

  if (currentRank === targetRank) {
    return {
      allowed: false,
      reason: `You're already on the ${currentName} plan.`,
      ctaLabel: 'Current plan',
    };
  }

  return {
    allowed: true,
    ctaLabel: `Upgrade to ${targetName}`,
  };
}
