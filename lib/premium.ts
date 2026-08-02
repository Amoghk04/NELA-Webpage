/** Shared Premium helpers for webpage chrome (per-user, server-driven). */

export function isPremiumAccount(input: {
  plan?: string | null;
  displayPlan?: string | null;
  isPremium?: boolean | null;
  paidCloud?: boolean | null;
  entitlementStatus?: string | null;
  status?: string | null;
}): boolean {
  if (input.paidCloud === true) return true;
  if (input.isPremium === true) return true;
  if (input.displayPlan === 'premium') return true;
  if (input.isPremium === false || input.displayPlan === 'free') return false;

  const plan = (input.plan ?? 'free').toLowerCase();
  if (plan !== 'starter' && plan !== 'pro') return false;

  const status = (input.status ?? input.entitlementStatus ?? '').toLowerCase();
  if (status === 'inactive' || status === 'cancelled') return false;

  // Legacy fallback only when premium fields were omitted by an older API.
  if (input.isPremium === undefined && input.displayPlan === undefined) {
    return true;
  }
  return false;
}
