import { prisma } from "../db/prisma.js";
import {
  getOrCreateFastDailyBucket,
  getOrCreateUsageBucket,
} from "../entitlements/entitlements.service.js";

export async function recordUsageEvent(input: {
  userId: string;
  requestId: string;
  intent: string;
  requestedMode?: string | null;
  resolvedMode?: string | null;
  selectedModel: string;
  keyLane?: string | null;
  promptTokens?: number | null;
  completionTokens?: number | null;
  totalTokens?: number | null;
  estimatedCostUsd?: number | null;
  status: string;
  errorCode?: string | null;
  /** Increment daily Fast free counter when true. */
  countFastFree?: boolean;
}): Promise<void> {
  await prisma.usageEvent.create({
    data: {
      userId: input.userId,
      requestId: input.requestId,
      intent: input.intent,
      requestedMode: input.requestedMode ?? null,
      resolvedMode: input.resolvedMode ?? null,
      selectedModel: input.selectedModel,
      keyLane: input.keyLane ?? null,
      promptTokens: input.promptTokens ?? null,
      completionTokens: input.completionTokens ?? null,
      totalTokens: input.totalTokens ?? null,
      estimatedCostUsd: input.estimatedCostUsd ?? null,
      status: input.status,
      errorCode: input.errorCode ?? null,
    },
  });

  const cost = input.estimatedCostUsd ?? 0;
  const bucket = await getOrCreateUsageBucket(input.userId);
  if (cost > 0) {
    await prisma.usageBucket.update({
      where: { id: bucket.id },
      data: {
        usedUsd: { increment: cost },
        requestCount: { increment: 1 },
      },
    });
  } else {
    await prisma.usageBucket.update({
      where: { id: bucket.id },
      data: { requestCount: { increment: 1 } },
    });
  }

  if (input.countFastFree) {
    const fastBucket = await getOrCreateFastDailyBucket(input.userId);
    await prisma.usageBucket.update({
      where: { id: fastBucket.id },
      data: { fastRequestCount: { increment: 1 } },
    });
  }
}

/** Rough token estimate from character length (for streaming pre-metering). */
export function approximateTokensFromMessages(
  messages: { content?: string | null }[],
): number {
  const chars = messages.reduce((n, m) => n + (m.content?.length ?? 0), 0);
  return Math.max(1, Math.ceil(chars / 4));
}
