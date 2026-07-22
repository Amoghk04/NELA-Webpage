import type { CloudPlan, EntitlementStatus } from "./contracts.js";

export interface PlanLimits {
  cloudEnabled: boolean;
  includedUsdMonthly: number;
  maxInputTokens: number;
  maxOutputTokens: number;
  requestsPerMinute: number;
  defaultStatus: EntitlementStatus;
}

export const PLAN_LIMITS: Record<CloudPlan, PlanLimits> = {
  free: {
    cloudEnabled: false,
    includedUsdMonthly: 0,
    maxInputTokens: 0,
    maxOutputTokens: 0,
    requestsPerMinute: 0,
    defaultStatus: "inactive",
  },
  starter: {
    cloudEnabled: true,
    includedUsdMonthly: 4,
    maxInputTokens: 64_000,
    maxOutputTokens: 4_096,
    requestsPerMinute: 20,
    defaultStatus: "active",
  },
  pro: {
    cloudEnabled: true,
    includedUsdMonthly: 20,
    maxInputTokens: 128_000,
    maxOutputTokens: 8_192,
    requestsPerMinute: 60,
    defaultStatus: "active",
  },
};

export function isPaidPlan(plan: CloudPlan): plan is "starter" | "pro" {
  return plan === "starter" || plan === "pro";
}
