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
  createRazorpayPaymentLink,
  createRazorpaySubscription,
  getCheckoutAmountPaise,
  getCheckoutCurrency,
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
      throw new ApiError(
        ErrorCodes.RAZORPAY_NOT_CONFIGURED,
        "Razorpay is not configured. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in NELA-Webpage/.env, then restart the API.",
        503,
      );
    }

    const planId = getRazorpayPlanId(body.plan);
    const notes = {
      nela_user_id: auth.userId,
      nela_plan: body.plan,
    };

    // Prefer recurring subscription when Razorpay plan IDs are configured.
    if (planId) {
      const subscription = await createRazorpaySubscription({
        planId,
        notes,
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
        metadata: {
          plan: body.plan,
          mode: "subscription",
          razorpaySubscriptionId: subscription.id,
        },
      });

      const checkoutUrl =
        subscription.short_url ??
        `${env.PUBLIC_WEB_URL}/account/billing?subscription_id=${subscription.id}`;

      return { checkoutUrl } satisfies CheckoutResponse;
    }

    // Keys-only path: hosted payment link (works with Razorpay test keys alone).
    const amountPaise = getCheckoutAmountPaise(body.plan);
    const currency = getCheckoutCurrency();
    const paymentLink = await createRazorpayPaymentLink({
      amountPaise,
      currency,
      description: `NELA ${body.plan === "pro" ? "Pro" : "Starter"} plan`,
      callbackUrl: `${env.PUBLIC_WEB_URL}/account/billing?paid=1&plan=${body.plan}`,
      notes,
    });

    await prisma.subscription.create({
      data: {
        userId: auth.userId,
        provider: "razorpay",
        razorpaySubscriptionId: paymentLink.id,
        razorpayPlanId: null,
        plan: body.plan,
        status: "created",
      },
    });

    await writeAuditLog({
      userId: auth.userId,
      action: "billing.checkout.created",
      metadata: {
        plan: body.plan,
        mode: "payment_link",
        razorpayPaymentLinkId: paymentLink.id,
        amountPaise,
        currency,
      },
    });

    return { checkoutUrl: paymentLink.short_url } satisfies CheckoutResponse;
  });

  app.post("/v1/billing/razorpay/manage", async (request) => {
    const auth = await requireAuth(request);

    if (!isRazorpayConfigured()) {
      throw new ApiError(
        ErrorCodes.RAZORPAY_NOT_CONFIGURED,
        "Razorpay is not configured. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in NELA-Webpage/.env.",
        503,
      );
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
