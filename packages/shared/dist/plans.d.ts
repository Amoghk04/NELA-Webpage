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
export declare const DEFAULT_FAST_FREE_DAILY_LIMIT = 20;
export declare const PLAN_LIMITS: Record<CloudPlan, PlanLimits>;
export declare function isPaidPlan(plan: CloudPlan): plan is "starter" | "pro";
//# sourceMappingURL=plans.d.ts.map