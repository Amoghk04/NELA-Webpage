import { prisma } from "../db/prisma.js";
import { getOrCreateUsageBucket } from "../entitlements/entitlements.service.js";

export async function recordUsageEvent(input: {
  userId: string;
  requestId: string;
  intent: string;
  selectedModel: string;
  promptTokens?: number | null;
  completionTokens?: number | null;
  totalTokens?: number | null;
  estimatedCostUsd?: number | null;
  status: string;
  errorCode?: string | null;
}): Promise<void> {
  await prisma.usageEvent.create({
    data: {
      userId: input.userId,
      requestId: input.requestId,
      intent: input.intent,
      selectedModel: input.selectedModel,
      promptTokens: input.promptTokens ?? null,
      completionTokens: input.completionTokens ?? null,
      totalTokens: input.totalTokens ?? null,
      estimatedCostUsd: input.estimatedCostUsd ?? null,
      status: input.status,
      errorCode: input.errorCode ?? null,
    },
  });

  if (input.estimatedCostUsd && input.estimatedCostUsd > 0) {
    const bucket = await getOrCreateUsageBucket(input.userId);
    await prisma.usageBucket.update({
      where: { id: bucket.id },
      data: {
        usedUsd: { increment: input.estimatedCostUsd },
        requestCount: { increment: 1 },
      },
    });
  } else {
    const bucket = await getOrCreateUsageBucket(input.userId);
    await prisma.usageBucket.update({
      where: { id: bucket.id },
      data: { requestCount: { increment: 1 } },
    });
  }
}
