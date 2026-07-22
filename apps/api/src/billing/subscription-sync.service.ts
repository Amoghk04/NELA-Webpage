import type { CloudPlan } from "@nela/shared";
import { prisma } from "../db/prisma.js";
import { syncEntitlementFromPlan } from "../entitlements/entitlements.service.js";
import { writeAuditLog } from "../security/audit-log.js";

function mapRazorpayStatus(status: string): {
  entitlementStatus: string;
  cloudEnabled: boolean;
} {
  switch (status) {
    case "active":
    case "authenticated":
      return { entitlementStatus: "active", cloudEnabled: true };
    case "halted":
    case "pending":
      return { entitlementStatus: "past_due", cloudEnabled: false };
    case "cancelled":
    case "completed":
    case "expired":
      return { entitlementStatus: "cancelled", cloudEnabled: false };
    default:
      return { entitlementStatus: "inactive", cloudEnabled: false };
  }
}

export async function upsertSubscriptionFromRazorpay(input: {
  userId: string;
  razorpaySubscriptionId: string;
  razorpayPlanId?: string | null;
  plan: "starter" | "pro";
  status: string;
  currentPeriodStart?: Date | null;
  currentPeriodEnd?: Date | null;
  cancelAtPeriodEnd?: boolean;
}) {
  const sub = await prisma.subscription.upsert({
    where: { razorpaySubscriptionId: input.razorpaySubscriptionId },
    create: {
      userId: input.userId,
      provider: "razorpay",
      razorpaySubscriptionId: input.razorpaySubscriptionId,
      razorpayPlanId: input.razorpayPlanId ?? null,
      plan: input.plan,
      status: input.status,
      currentPeriodStart: input.currentPeriodStart ?? null,
      currentPeriodEnd: input.currentPeriodEnd ?? null,
      cancelAtPeriodEnd: input.cancelAtPeriodEnd ?? false,
    },
    update: {
      razorpayPlanId: input.razorpayPlanId ?? undefined,
      plan: input.plan,
      status: input.status,
      currentPeriodStart: input.currentPeriodStart ?? undefined,
      currentPeriodEnd: input.currentPeriodEnd ?? undefined,
      cancelAtPeriodEnd: input.cancelAtPeriodEnd ?? undefined,
    },
  });

  const mapped = mapRazorpayStatus(input.status);
  const plan: CloudPlan =
    mapped.cloudEnabled || input.status === "active" ? input.plan : "free";

  await syncEntitlementFromPlan({
    userId: input.userId,
    plan: mapped.cloudEnabled ? input.plan : "free",
    status: mapped.entitlementStatus,
    cloudEnabled: mapped.cloudEnabled,
  });

  await writeAuditLog({
    userId: input.userId,
    action: "billing.subscription.synced",
    metadata: {
      subscriptionId: sub.id,
      razorpaySubscriptionId: input.razorpaySubscriptionId,
      status: input.status,
      plan,
    },
  });

  return sub;
}
