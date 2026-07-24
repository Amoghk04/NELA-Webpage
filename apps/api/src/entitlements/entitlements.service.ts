import {
  ApiError,
  ErrorCodes,
  PLAN_LIMITS,
  isPaidPlan,
  type CloudPlan,
  type EntitlementResponse,
  type ResolvedCloudMode,
} from "@nela/shared";
import { prisma } from "../db/prisma.js";
import { env } from "../config.js";

function currentMonthWindow(now = new Date()): {
  periodStart: Date;
  periodEnd: Date;
} {
  const periodStart = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1),
  );
  const periodEnd = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1),
  );
  return { periodStart, periodEnd };
}

function currentDayWindow(now = new Date()): {
  periodStart: Date;
  periodEnd: Date;
} {
  const periodStart = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
  );
  const periodEnd = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1),
  );
  return { periodStart, periodEnd };
}

export async function getOrCreateUsageBucket(userId: string) {
  const { periodStart, periodEnd } = currentMonthWindow();
  return prisma.usageBucket.upsert({
    where: {
      userId_periodStart_periodEnd: { userId, periodStart, periodEnd },
    },
    create: {
      userId,
      periodStart,
      periodEnd,
      usedUsd: 0,
      requestCount: 0,
      fastRequestCount: 0,
    },
    update: {},
  });
}

export async function getOrCreateFastDailyBucket(userId: string) {
  const { periodStart, periodEnd } = currentDayWindow();
  return prisma.usageBucket.upsert({
    where: {
      userId_periodStart_periodEnd: { userId, periodStart, periodEnd },
    },
    create: {
      userId,
      periodStart,
      periodEnd,
      usedUsd: 0,
      requestCount: 0,
      fastRequestCount: 0,
    },
    update: {},
  });
}

function applyOverride(plan: CloudPlan): {
  plan: CloudPlan;
  cloudEnabled: boolean;
  status: string;
} {
  const override = env.CLOUD_ENTITLEMENT_OVERRIDE;
  if (!override) {
    return { plan, cloudEnabled: false, status: "inactive" };
  }
  const limits = PLAN_LIMITS[override];
  return {
    plan: override,
    cloudEnabled: limits.cloudEnabled || isPaidPlan(override),
    status: limits.defaultStatus,
  };
}

export async function getEntitlementResponse(
  userId: string,
): Promise<EntitlementResponse> {
  const entitlement = await prisma.entitlement.findUnique({
    where: { userId },
  });

  let plan = (entitlement?.plan ?? "free") as CloudPlan;
  let cloudEnabled = entitlement?.cloudEnabled ?? PLAN_LIMITS.free.cloudEnabled;
  let status = entitlement?.status ?? PLAN_LIMITS[plan].defaultStatus;

  // Phase-1 stub: env override unlocks paid modes without Razorpay.
  if (env.CLOUD_ENTITLEMENT_OVERRIDE) {
    const o = applyOverride(plan);
    plan = o.plan;
    cloudEnabled = PLAN_LIMITS[plan].cloudEnabled || isPaidPlan(plan);
    status = PLAN_LIMITS[plan].defaultStatus;
  }

  const limits = PLAN_LIMITS[plan] ?? PLAN_LIMITS.free;
  const bucket = await getOrCreateUsageBucket(userId);
  const fastBucket = await getOrCreateFastDailyBucket(userId);

  const includedUsd =
    entitlement?.includedUsdMonthly ?? limits.includedUsdMonthly;
  // When override forces a paid plan, use plan's included USD if DB still free.
  const effectiveIncluded =
    env.CLOUD_ENTITLEMENT_OVERRIDE && isPaidPlan(plan)
      ? limits.includedUsdMonthly
      : includedUsd;

  const usedUsd = bucket.usedUsd;
  const remainingUsd = Math.max(0, effectiveIncluded - usedUsd);

  if (
    cloudEnabled &&
    status === "active" &&
    effectiveIncluded > 0 &&
    remainingUsd <= 0
  ) {
    status = "quota_exhausted";
  }

  const fastLimit = limits.fastFreeDailyLimit;
  const fastUsed = fastBucket.fastRequestCount;
  const paidCloud =
    isPaidPlan(plan) &&
    cloudEnabled &&
    status !== "inactive" &&
    status !== "cancelled" &&
    remainingUsd > 0;

  return {
    cloudEnabled: true,
    plan,
    status: status as EntitlementResponse["status"],
    paidCloud,
    quota: {
      includedUsd: effectiveIncluded,
      usedUsd,
      remainingUsd,
    },
    fastFree: {
      limit: fastLimit,
      used: fastUsed,
      remaining: Math.max(0, fastLimit - fastUsed),
    },
    limits: {
      maxInputTokens:
        entitlement?.maxInputTokens && entitlement.maxInputTokens > 0
          ? entitlement.maxInputTokens
          : limits.maxInputTokens,
      maxOutputTokens:
        entitlement?.maxOutputTokens && entitlement.maxOutputTokens > 0
          ? entitlement.maxOutputTokens
          : limits.maxOutputTokens,
      requestsPerMinute:
        entitlement?.requestsPerMinute && entitlement.requestsPerMinute > 0
          ? entitlement.requestsPerMinute
          : Math.max(1, limits.requestsPerMinute),
    },
  };
}

/**
 * @deprecated Prefer assertModeAllowed — Fast is allowed without paid plan.
 */
export async function assertCloudAllowed(userId: string) {
  return assertModeAllowed(userId, "smart");
}

export async function assertModeAllowed(
  userId: string,
  resolvedMode: ResolvedCloudMode,
): Promise<EntitlementResponse> {
  const entitlement = await getEntitlementResponse(userId);

  if (resolvedMode === "fast") {
    if (entitlement.paidCloud) {
      return entitlement;
    }
    if (entitlement.fastFree.remaining <= 0) {
      throw new ApiError(
        ErrorCodes.FAST_QUOTA_EXHAUSTED,
        "Daily free Fast requests used up. Upgrade or buy credits for Smart / Deep, or wait for reset.",
        402,
      );
    }
    return entitlement;
  }

  // Smart / Deep require paid entitlement + remaining USD.
  if (!entitlement.paidCloud) {
    throw new ApiError(
      ErrorCodes.UPGRADE_REQUIRED,
      "Smart and Deep modes require an active plan or credits",
      402,
    );
  }

  if (
    entitlement.status === "quota_exhausted" ||
    entitlement.quota.remainingUsd <= 0
  ) {
    throw new ApiError(
      ErrorCodes.QUOTA_EXHAUSTED,
      "Monthly cloud quota exhausted",
      402,
    );
  }

  return entitlement;
}

/**
 * Production writer for paid entitlements once Razorpay webhooks are live.
 * Phase 1 OpenRouter does not require this — use CLOUD_ENTITLEMENT_OVERRIDE or
 * manually upsert Entitlement rows for Smart/Deep testing.
 */
export async function syncEntitlementFromPlan(input: {
  userId: string;
  plan: CloudPlan;
  status: string;
  cloudEnabled?: boolean;
}) {
  const limits = PLAN_LIMITS[input.plan] ?? PLAN_LIMITS.free;
  return prisma.entitlement.upsert({
    where: { userId: input.userId },
    create: {
      userId: input.userId,
      plan: input.plan,
      status: input.status,
      cloudEnabled: input.cloudEnabled ?? limits.cloudEnabled,
      includedUsdMonthly: limits.includedUsdMonthly,
      maxInputTokens: limits.maxInputTokens,
      maxOutputTokens: limits.maxOutputTokens,
      requestsPerMinute: limits.requestsPerMinute,
    },
    update: {
      plan: input.plan,
      status: input.status,
      cloudEnabled: input.cloudEnabled ?? limits.cloudEnabled,
      includedUsdMonthly: limits.includedUsdMonthly,
      maxInputTokens: limits.maxInputTokens,
      maxOutputTokens: limits.maxOutputTokens,
      requestsPerMinute: limits.requestsPerMinute,
    },
  });
}
