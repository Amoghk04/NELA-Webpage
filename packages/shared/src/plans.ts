import type { CloudPlan, EntitlementStatus } from "./contracts.js";

export interface PlanLimits {
  cloudEnabled: boolean;
  includedUsdMonthly: number;
  maxInputTokens: number;
  maxOutputTokens: number;
  requestsPerMinute: number;
  defaultStatus: EntitlementStatus;
  /** Daily Fast-mode free requests (OpenRouter free models). */
  fastFreeDailyLimit: number;
}

/** Default daily Fast allowance for free and unpaid users. */
export const DEFAULT_FAST_FREE_DAILY_LIMIT = 20;

export const PLAN_LIMITS: Record<CloudPlan, PlanLimits> = {
  free: {
    // Fast-only cloud is allowed separately; paid Smart/Deep need cloudEnabled.
    cloudEnabled: false,
    includedUsdMonthly: 0,
    maxInputTokens: 32_768,
    maxOutputTokens: 2_048,
    requestsPerMinute: 10,
    defaultStatus: "active",
    fastFreeDailyLimit: DEFAULT_FAST_FREE_DAILY_LIMIT,
  },
  starter: {
    cloudEnabled: true,
    includedUsdMonthly: 4,
    maxInputTokens: 64_000,
    maxOutputTokens: 4_096,
    requestsPerMinute: 20,
    defaultStatus: "active",
    fastFreeDailyLimit: 100,
  },
  pro: {
    cloudEnabled: true,
    includedUsdMonthly: 20,
    maxInputTokens: 128_000,
    maxOutputTokens: 8_192,
    requestsPerMinute: 60,
    defaultStatus: "active",
    fastFreeDailyLimit: 500,
  },
};

export function isPaidPlan(plan: CloudPlan): plan is "starter" | "pro" {
  return plan === "starter" || plan === "pro";
}
