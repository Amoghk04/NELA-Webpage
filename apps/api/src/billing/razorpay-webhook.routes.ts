import type { FastifyInstance } from "fastify";
import { sha256 } from "../security/crypto.js";
import { prisma } from "../db/prisma.js";
import { verifyRazorpayWebhookSignature } from "./razorpay.client.js";
import { upsertSubscriptionFromRazorpay } from "./subscription-sync.service.js";
import { writeAuditLog } from "../security/audit-log.js";

type RazorpayWebhookPayload = {
  event?: string;
  payload?: {
    subscription?: {
      entity?: {
        id?: string;
        plan_id?: string;
        status?: string;
        notes?: Record<string, string>;
        current_start?: number;
        current_end?: number;
        cancel_at_cycle_end?: boolean;
      };
    };
  };
};

function resolvePlan(
  notes: Record<string, string> | undefined,
): "starter" | "pro" {
  const plan = notes?.nela_plan;
  if (plan === "pro") return "pro";
  return "starter";
}

export async function razorpayWebhookRoutes(
  app: FastifyInstance,
): Promise<void> {
  app.post("/v1/webhooks/razorpay", async (request, reply) => {
    const rawBody =
      (request as { rawBody?: Buffer }).rawBody ??
      Buffer.from(JSON.stringify(request.body ?? {}), "utf8");

    const signature = request.headers["x-razorpay-signature"];
    verifyRazorpayWebhookSignature(
      rawBody,
      typeof signature === "string" ? signature : undefined,
    );

    const payloadHash = sha256(rawBody.toString("utf8"));

    let parsed: RazorpayWebhookPayload;
    try {
      parsed =
        typeof request.body === "object" && request.body !== null
          ? (request.body as RazorpayWebhookPayload)
          : (JSON.parse(
              typeof rawBody === "string" ? rawBody : rawBody.toString("utf8"),
            ) as RazorpayWebhookPayload);
    } catch {
      return reply.code(400).send({ error: "invalid_json" });
    }

    const eventType = parsed.event ?? "unknown";
    const entity = parsed.payload?.subscription?.entity;
    const razorpayEventId =
      (request.headers["x-razorpay-event-id"] as string | undefined) ??
      (entity?.id ? `${entity.id}:${eventType}:${payloadHash.slice(0, 12)}` : null);

    if (razorpayEventId) {
      const existing = await prisma.razorpayWebhookEvent.findUnique({
        where: { razorpayEventId },
      });
      if (existing) {
        return reply.code(200).send({ ok: true, duplicate: true });
      }
    }

    await prisma.razorpayWebhookEvent.create({
      data: {
        razorpayEventId,
        eventType,
        payloadHash,
      },
    });

    if (entity?.id && entity.status) {
      const notes = entity.notes ?? {};
      const userId = notes.nela_user_id;
      if (userId) {
        await upsertSubscriptionFromRazorpay({
          userId,
          razorpaySubscriptionId: entity.id,
          razorpayPlanId: entity.plan_id ?? null,
          plan: resolvePlan(notes),
          status: entity.status,
          currentPeriodStart: entity.current_start
            ? new Date(entity.current_start * 1000)
            : null,
          currentPeriodEnd: entity.current_end
            ? new Date(entity.current_end * 1000)
            : null,
          cancelAtPeriodEnd: Boolean(entity.cancel_at_cycle_end),
        });
      }
    }

    await writeAuditLog({
      action: "billing.webhook.processed",
      metadata: { eventType, razorpayEventId },
    });

    return reply.code(200).send({ ok: true });
  });
}
