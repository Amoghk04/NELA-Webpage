import {
  ApiError,
  ErrorCodes,
  type CloudChatRequest,
  type CloudIntent,
} from "@nela/shared";
import { assertCloudAllowed } from "../entitlements/entitlements.service.js";
import { enforceRateLimit } from "../security/rate-limit.js";
import { env } from "../config.js";
import {
  estimateCostUsd,
  selectModelForIntent,
} from "./model-policy.js";
import { recordUsageEvent } from "./usage-meter.js";
import { openRouterChatCompletions } from "../openrouter/openrouter.client.js";

function assertPrivacy(privacy: CloudChatRequest["privacy"]): void {
  if (privacy.containsFileContext && !privacy.userConfirmedCloudContext) {
    throw new ApiError(
      ErrorCodes.CLOUD_CONTEXT_NOT_CONFIRMED,
      "File-derived context requires explicit user confirmation before cloud send",
      403,
    );
  }
}

export async function runCloudChat(input: {
  userId: string;
  requestId: string;
  body: CloudChatRequest;
}): Promise<Response> {
  assertPrivacy(input.body.privacy);

  const entitlement = await assertCloudAllowed(input.userId);

  await enforceRateLimit({
    key: `ai:${input.userId}`,
    limit: Math.max(1, entitlement.limits.requestsPerMinute),
    windowMs: 60_000,
  });

  const model = selectModelForIntent(input.body.intent);
  const maxTokens = Math.min(
    input.body.generation?.maxTokens ?? entitlement.limits.maxOutputTokens,
    entitlement.limits.maxOutputTokens || 4096,
  );

  if (env.PROMPT_LOGGING_ENABLED) {
    // Intentionally no-op logging of prompt contents unless explicitly enabled.
  }

  try {
    const upstream = await openRouterChatCompletions({
      model,
      messages: input.body.messages,
      stream: input.body.stream,
      max_tokens: maxTokens,
      temperature: input.body.generation?.temperature,
    });

    if (!input.body.stream) {
      const json = (await upstream.json()) as {
        usage?: {
          prompt_tokens?: number;
          completion_tokens?: number;
          total_tokens?: number;
        };
      };
      const promptTokens = json.usage?.prompt_tokens ?? 0;
      const completionTokens = json.usage?.completion_tokens ?? 0;
      const estimatedCostUsd = estimateCostUsd({
        promptTokens,
        completionTokens,
        model,
      });

      await recordUsageEvent({
        userId: input.userId,
        requestId: input.requestId,
        intent: input.body.intent,
        selectedModel: model,
        promptTokens,
        completionTokens,
        totalTokens: json.usage?.total_tokens ?? promptTokens + completionTokens,
        estimatedCostUsd,
        status: "ok",
      });

      return new Response(JSON.stringify(json), {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    }

    // Stream path: tee usage as approximate after stream completes is hard without
    // buffering; record a minimal event now and rely on client completion later.
    await recordUsageEvent({
      userId: input.userId,
      requestId: input.requestId,
      intent: input.body.intent,
      selectedModel: model,
      status: "streaming",
      estimatedCostUsd: 0,
    });

    return upstream;
  } catch (err) {
    const code =
      err instanceof ApiError ? err.code : ErrorCodes.OPENROUTER_FAILED;
    await recordUsageEvent({
      userId: input.userId,
      requestId: input.requestId,
      intent: input.body.intent,
      selectedModel: model,
      status: "error",
      errorCode: code,
    });
    throw err;
  }
}

export function asArtifactPlanRequest(
  body: Omit<CloudChatRequest, "intent"> & { intent?: CloudIntent },
): CloudChatRequest {
  return {
    ...body,
    intent: "artifact_plan",
  };
}
