import type { FastifyInstance } from "fastify";
import { z } from "zod";
import {
  ApiError,
  ErrorCodes,
  type CheckoutResponse,
  type BillingManageResponse,
} from "@nela/shared";
import { env } from "../config.js";
import { requireAuth } from "../auth/auth.guard.js";
import { prisma } from "../db/prisma.js";
import {
  createRazorpaySubscription,
  getRazorpayPlanId,
  isRazorpayConfigured,
} from "./razorpay.client.js";
import { writeAuditLog } from "../security/audit-log.js";

export async function billingRoutes(app: FastifyInstance): Promise<void> {
  app.post("/v1/billing/razorpay/checkout", async (request) => {
    const auth = await requireAuth(request);
    const body = z
      .object({ plan: z.enum(["starter", "pro"]) })
      .parse(request.body ?? {});

    if (!isRazorpayConfigured()) {
      // Graceful stub structure when keys missing
      const stub: CheckoutResponse = {
        checkoutUrl: `${env.PUBLIC_WEB_URL}/account/billing?stub=checkout&plan=${body.plan}&error=razorpay_not_configured`,
      };
      await writeAuditLog({
        userId: auth.userId,
        action: "billing.checkout.stub",
        metadata: { plan: body.plan },
      });
      return stub;
    }

    let planId: string;
    try {
      planId = getRazorpayPlanId(body.plan);
    } catch (err) {
      if (err instanceof ApiError) {
        return {
          checkoutUrl: `${env.PUBLIC_WEB_URL}/account/billing?stub=checkout&plan=${body.plan}&error=razorpay_plan_missing`,
        } satisfies CheckoutResponse;
      }
      throw err;
    }

    const subscription = await createRazorpaySubscription({
      planId,
      notes: {
        nela_user_id: auth.userId,
        nela_plan: body.plan,
      },
    });

    await prisma.subscription.create({
      data: {
        userId: auth.userId,
        provider: "razorpay",
        razorpaySubscriptionId: subscription.id,
        razorpayPlanId: planId,
        plan: body.plan,
        status: "created",
      },
    });

    await writeAuditLog({
      userId: auth.userId,
      action: "billing.checkout.created",
      metadata: { plan: body.plan, razorpaySubscriptionId: subscription.id },
    });

    const checkoutUrl =
      subscription.short_url ??
      `${env.PUBLIC_WEB_URL}/account/billing?subscription_id=${subscription.id}`;

    return { checkoutUrl } satisfies CheckoutResponse;
  });

  app.post("/v1/billing/razorpay/manage", async (request) => {
    const auth = await requireAuth(request);

    if (!isRazorpayConfigured()) {
      const stub: BillingManageResponse = {
        manageUrl: `${env.PUBLIC_WEB_URL}/account/billing?stub=manage&error=razorpay_not_configured`,
      };
      return stub;
    }

    const latest = await prisma.subscription.findFirst({
      where: { userId: auth.userId, provider: "razorpay" },
      orderBy: { updatedAt: "desc" },
    });

    if (!latest?.razorpaySubscriptionId) {
      throw new ApiError(
        ErrorCodes.NOT_FOUND,
        "No Razorpay subscription found for this account",
        404,
      );
    }

    // Razorpay customer portal is merchant-hosted; return account billing page
    // with subscription context for the dashboard to manage.
    return {
      manageUrl: `${env.PUBLIC_WEB_URL}/account/billing?subscription_id=${latest.razorpaySubscriptionId}`,
    } satisfies BillingManageResponse;
  });
}
