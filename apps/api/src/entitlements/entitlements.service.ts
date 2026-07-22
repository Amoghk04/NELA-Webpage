import { ApiError, ErrorCodes, PLAN_LIMITS, type CloudPlan } from "@nela/shared";
import { prisma } from "../db/prisma.js";

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
    },
    update: {},
  });
}

export async function getEntitlementResponse(userId: string) {
  const entitlement = await prisma.entitlement.findUnique({
    where: { userId },
  });
  const plan = (entitlement?.plan ?? "free") as CloudPlan;
  const limits = PLAN_LIMITS[plan] ?? PLAN_LIMITS.free;
  const bucket = await getOrCreateUsageBucket(userId);
  const includedUsd =
    entitlement?.includedUsdMonthly ?? limits.includedUsdMonthly;
  const usedUsd = bucket.usedUsd;
  const remainingUsd = Math.max(0, includedUsd - usedUsd);

  let status = entitlement?.status ?? limits.defaultStatus;
  if (
    entitlement?.cloudEnabled &&
    status === "active" &&
    includedUsd > 0 &&
    remainingUsd <= 0
  ) {
    status = "quota_exhausted";
  }

  return {
    cloudEnabled: entitlement?.cloudEnabled ?? limits.cloudEnabled,
    plan,
    status: status as typeof status & string,
    quota: {
      includedUsd,
      usedUsd,
      remainingUsd,
    },
    limits: {
      maxInputTokens:
        entitlement?.maxInputTokens ?? limits.maxInputTokens,
      maxOutputTokens:
        entitlement?.maxOutputTokens ?? limits.maxOutputTokens,
      requestsPerMinute:
        entitlement?.requestsPerMinute ?? limits.requestsPerMinute,
    },
  };
}

export async function assertCloudAllowed(userId: string) {
  const entitlement = await getEntitlementResponse(userId);

  if (!entitlement.cloudEnabled || entitlement.plan === "free") {
    throw new ApiError(
      ErrorCodes.UPGRADE_REQUIRED,
      "Cloud inference requires an active Starter or Pro plan",
      402,
    );
  }

  if (entitlement.status === "inactive" || entitlement.status === "cancelled") {
    throw new ApiError(
      ErrorCodes.UPGRADE_REQUIRED,
      "Cloud entitlement is inactive",
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
