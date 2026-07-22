import { ApiError, ErrorCodes } from "@nela/shared";
import { env } from "../config.js";
import { hmacSha256Hex, safeEqual } from "../security/crypto.js";

export function isRazorpayConfigured(): boolean {
  return Boolean(env.RAZORPAY_KEY_ID && env.RAZORPAY_KEY_SECRET);
}

function basicAuthHeader(): string {
  const raw = `${env.RAZORPAY_KEY_ID}:${env.RAZORPAY_KEY_SECRET}`;
  return `Basic ${Buffer.from(raw).toString("base64")}`;
}

export function verifyRazorpayWebhookSignature(
  rawBody: string | Buffer,
  signature: string | undefined,
): void {
  if (!env.RAZORPAY_WEBHOOK_SECRET) {
    throw new ApiError(
      ErrorCodes.RAZORPAY_NOT_CONFIGURED,
      "RAZORPAY_WEBHOOK_SECRET is not configured",
      503,
    );
  }
  if (!signature) {
    throw new ApiError(
      ErrorCodes.RAZORPAY_WEBHOOK_INVALID,
      "Missing X-Razorpay-Signature",
      401,
    );
  }
  const expected = hmacSha256Hex(env.RAZORPAY_WEBHOOK_SECRET, rawBody);
  if (!safeEqual(expected, signature)) {
    throw new ApiError(
      ErrorCodes.RAZORPAY_WEBHOOK_INVALID,
      "Invalid Razorpay webhook signature",
      401,
    );
  }
}

export async function createRazorpaySubscription(input: {
  planId: string;
  totalCount?: number;
  customerNotify?: number;
  notes?: Record<string, string>;
}): Promise<{ id: string; short_url?: string }> {
  if (!isRazorpayConfigured()) {
    throw new ApiError(
      ErrorCodes.RAZORPAY_NOT_CONFIGURED,
      "Razorpay keys are not configured. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET.",
      503,
    );
  }

  const res = await fetch("https://api.razorpay.com/v1/subscriptions", {
    method: "POST",
    headers: {
      Authorization: basicAuthHeader(),
      "content-type": "application/json",
    },
    body: JSON.stringify({
      plan_id: input.planId,
      total_count: input.totalCount ?? 12,
      customer_notify: input.customerNotify ?? 1,
      notes: input.notes ?? {},
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new ApiError(
      ErrorCodes.INTERNAL_ERROR,
      "Razorpay subscription create failed",
      502,
      { body: text.slice(0, 500) },
    );
  }

  return (await res.json()) as { id: string; short_url?: string };
}

export function getRazorpayPlanId(plan: "starter" | "pro"): string {
  const id =
    plan === "starter"
      ? env.RAZORPAY_PLAN_STARTER_ID
      : env.RAZORPAY_PLAN_PRO_ID;
  if (!id) {
    throw new ApiError(
      ErrorCodes.RAZORPAY_NOT_CONFIGURED,
      `Missing Razorpay plan id for ${plan}`,
      503,
    );
  }
  return id;
}
