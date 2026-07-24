import {
  ApiError,
  ErrorCodes,
  type CloudChatRequest,
  type CloudIntent,
} from "@nela/shared";
import {
  assertModeAllowed,
  getEntitlementResponse,
} from "../entitlements/entitlements.service.js";
import { enforceRateLimit } from "../security/rate-limit.js";
import { env } from "../config.js";
import { resolveCloudMode } from "./auto-router.js";
import {
  estimateCostUsd,
  markModelFailure,
  markModelSuccess,
  selectModelFallbacks,
} from "./model-policy.js";
import {
  approximateTokensFromMessages,
  recordUsageEvent,
} from "./usage-meter.js";
import {
  openRouterChatCompletions,
  toOpenRouterMessages,
} from "../openrouter/openrouter.client.js";
import { buildCachedOpenRouterRequest } from "../openrouter/prompt-cache.js";
import {
  acquireKey,
  laneForMode,
  markKeyCooldown,
} from "../openrouter/key-pool.js";
import type { ModelCandidate } from "./model-catalog.js";

function assertPrivacy(privacy: CloudChatRequest["privacy"]): void {
  if (privacy.containsFileContext && !privacy.userConfirmedCloudContext) {
    throw new ApiError(
      ErrorCodes.CLOUD_CONTEXT_NOT_CONFIRMED,
      "File-derived context requires explicit user confirmation before cloud send",
      403,
    );
  }
}

function needsVision(
  intent: CloudIntent | undefined,
  messages: CloudChatRequest["messages"],
): boolean {
  if (intent === "vision") return true;
  return messages.some((m) =>
    typeof m.content === "string" &&
    /data:image\/|!\[[^\]]*\]\(/.test(m.content),
  );
}

async function callWithFallbacks(input: {
  candidates: ModelCandidate[];
  lane: "free" | "paid";
  messages: CloudChatRequest["messages"];
  stream: boolean;
  maxTokens: number;
  temperature?: number;
  tools?: CloudChatRequest["tools"];
  tool_choice?: CloudChatRequest["tool_choice"];
  response_format?: CloudChatRequest["response_format"];
  /** Sticky OpenRouter session for prompt-cache routing. */
  sessionId?: string;
}): Promise<{
  upstream: Response;
  model: ModelCandidate;
}> {
  const tried: string[] = [];
  let lastError: unknown;
  const orMessages = toOpenRouterMessages(input.messages);

  for (const model of input.candidates) {
    tried.push(model.id);
    let pooled;
    try {
      pooled = await acquireKey(input.lane);
    } catch (err) {
      lastError = err;
      break;
    }

    try {
      const upstream = await openRouterChatCompletions(
        buildCachedOpenRouterRequest({
          model: model.id,
          messages: orMessages,
          stream: input.stream,
          max_tokens: input.maxTokens,
          temperature: input.temperature,
          tools: input.tools,
          tool_choice: input.tool_choice,
          response_format: input.response_format,
          sessionId: input.sessionId,
        }),
        pooled.apiKey,
      );

      if (!upstream.ok) {
        const errBody = (await upstream.text()).slice(0, 500);
        markModelFailure(model.id);
        if (upstream.status === 429 || upstream.status >= 500) {
          markKeyCooldown({
            id: pooled.id,
            source: pooled.source,
            apiKey: pooled.apiKey,
          });
        }
        lastError = new ApiError(
          ErrorCodes.CLOUD_BUSY,
          "Cloud is busy, try again shortly",
          503,
          {
            model: model.id,
            status: upstream.status,
            body: errBody,
          },
        );
        continue;
      }

      markModelSuccess(model.id);
      return { upstream, model };
    } catch (err) {
      markModelFailure(model.id);
      markKeyCooldown({
        id: pooled.id,
        source: pooled.source,
        apiKey: pooled.apiKey,
      });
      lastError = err;
    }
  }

  if (lastError instanceof ApiError) throw lastError;
  throw new ApiError(
    ErrorCodes.CLOUD_BUSY,
    "Cloud is busy, try again shortly",
    503,
    { tried },
  );
}

export async function runCloudChat(input: {
  userId: string;
  requestId: string;
  body: CloudChatRequest;
}): Promise<Response> {
  assertPrivacy(input.body.privacy);

  const intent = input.body.intent ?? "quick_chat";
  const vision = needsVision(intent, input.body.messages);

  const soft = await getEntitlementResponse(input.userId);

  const { requestedMode, resolvedMode } = resolveCloudMode({
    mode: input.body.mode,
    messages: input.body.messages,
    intent,
    needsVision: vision,
    paidWithQuota: soft.paidCloud,
  });

  const entitlement = await assertModeAllowed(input.userId, resolvedMode);

  await enforceRateLimit({
    key: `ai:${input.userId}`,
    limit: Math.max(1, entitlement.limits.requestsPerMinute),
    windowMs: 60_000,
  });

  const candidates = selectModelFallbacks({
    mode: resolvedMode,
    needsVision: vision,
  });
  if (candidates.length === 0) {
    throw new ApiError(
      ErrorCodes.CLOUD_BUSY,
      "Cloud is busy, try again shortly",
      503,
    );
  }

  const maxTokens = Math.min(
    input.body.generation?.maxTokens ?? entitlement.limits.maxOutputTokens,
    entitlement.limits.maxOutputTokens || 4096,
  );

  // Free OpenRouter models use the free key lane even for Smart/Deep quality tiers.
  const lane = candidates[0]!.isFree ? "free" : laneForMode(resolvedMode);
  let selectedModel = candidates[0]!.id;

  if (env.PROMPT_LOGGING_ENABLED) {
    // Intentionally no-op logging of prompt contents unless explicitly enabled.
  }

  try {
    const { upstream, model } = await callWithFallbacks({
      candidates,
      lane,
      messages: input.body.messages,
      stream: input.body.stream,
      maxTokens,
      temperature: input.body.generation?.temperature,
      tools: input.body.tools,
      tool_choice: input.body.tool_choice,
      response_format: input.body.response_format,
      sessionId: input.body.client?.sessionId,
    });
    selectedModel = model.id;

    const countFastFree =
      resolvedMode === "fast" && !entitlement.paidCloud && model.isFree;

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
      const estimatedCostUsd = model.isFree
        ? 0
        : estimateCostUsd({
            promptTokens,
            completionTokens,
            model: model.id,
          });

      await recordUsageEvent({
        userId: input.userId,
        requestId: input.requestId,
        intent,
        requestedMode,
        resolvedMode,
        selectedModel: model.id,
        keyLane: lane,
        promptTokens,
        completionTokens,
        totalTokens:
          json.usage?.total_tokens ?? promptTokens + completionTokens,
        estimatedCostUsd,
        status: "ok",
        countFastFree,
      });

      const payload = {
        ...json,
        nela: {
          requestedMode,
          resolvedMode,
        },
      };

      return new Response(JSON.stringify(payload), {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    }

    const promptApprox = approximateTokensFromMessages(input.body.messages);
    const completionApprox = Math.min(
      maxTokens,
      Math.ceil(promptApprox * 0.5),
    );
    const streamCost = model.isFree
      ? 0
      : estimateCostUsd({
          promptTokens: promptApprox,
          completionTokens: completionApprox,
          model: model.id,
        });

    // Don't block the OpenRouter SSE body on DB metering — start piping ASAP.
    void recordUsageEvent({
      userId: input.userId,
      requestId: input.requestId,
      intent,
      requestedMode,
      resolvedMode,
      selectedModel: model.id,
      keyLane: lane,
      promptTokens: promptApprox,
      completionTokens: completionApprox,
      totalTokens: promptApprox + completionApprox,
      estimatedCostUsd: streamCost,
      status: "streaming",
      countFastFree,
    }).catch(() => undefined);

    return upstream;
  } catch (err) {
    const code =
      err instanceof ApiError ? err.code : ErrorCodes.OPENROUTER_FAILED;
    await recordUsageEvent({
      userId: input.userId,
      requestId: input.requestId,
      intent,
      requestedMode,
      resolvedMode,
      selectedModel,
      keyLane: lane,
      status: "error",
      errorCode: code,
    });
    throw err;
  }
}

export function asArtifactPlanRequest(
  body: Omit<CloudChatRequest, "intent" | "mode"> & {
    intent?: CloudIntent;
    mode?: CloudChatRequest["mode"];
  },
): CloudChatRequest {
  return {
    ...body,
    mode: body.mode ?? "deep",
    intent: "artifact_plan",
    stream: body.stream,
    messages: body.messages,
    privacy: body.privacy,
  };
}
