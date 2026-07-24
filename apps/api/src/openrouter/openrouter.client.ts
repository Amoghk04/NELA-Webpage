import { ApiError, ErrorCodes, type CloudChatMessage } from "@nela/shared";
import { env } from "../config.js";
import { isOpenRouterPoolConfigured } from "./key-pool.js";
import type { CachedOpenRouterChatRequest } from "./prompt-cache.js";

export type OpenRouterChatMessage = {
  role: "system" | "user" | "assistant" | "tool";
  content?: string | null;
  tool_calls?: Array<{
    id: string;
    type: "function";
    function: { name: string; arguments: string };
  }>;
  tool_call_id?: string;
  name?: string;
};

export type OpenRouterTool = {
  type: "function";
  function: {
    name: string;
    description?: string;
    parameters?: Record<string, unknown>;
  };
};

export type OpenRouterChatRequest = {
  model: string;
  messages: OpenRouterChatMessage[];
  stream?: boolean;
  max_tokens?: number;
  temperature?: number;
  tools?: OpenRouterTool[];
  tool_choice?:
    | "none"
    | "auto"
    | "required"
    | { type: "function"; function: { name: string } };
  response_format?: { type: "json_object" | "text" };
};

export function isOpenRouterConfigured(): boolean {
  return isOpenRouterPoolConfigured();
}

/** Map shared CloudChatMessage[] into OpenRouter wire shape. */
export function toOpenRouterMessages(
  messages: CloudChatMessage[],
): OpenRouterChatMessage[] {
  return messages.map((m) => {
    const out: OpenRouterChatMessage = {
      role: m.role,
      content: m.content ?? (m.role === "assistant" && m.tool_calls ? null : ""),
    };
    if (m.tool_calls?.length) out.tool_calls = m.tool_calls;
    if (m.tool_call_id) out.tool_call_id = m.tool_call_id;
    if (m.name) out.name = m.name;
    return out;
  });
}

/** Caller handles non-OK status (fallback / cooldown). */
export async function openRouterChatCompletions(
  body: OpenRouterChatRequest | CachedOpenRouterChatRequest,
  apiKey: string,
): Promise<Response> {
  if (!apiKey) {
    throw new ApiError(
      ErrorCodes.OPENROUTER_NOT_CONFIGURED,
      "OPENROUTER_API_KEY is not configured",
      503,
    );
  }

  return fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "content-type": "application/json",
      "HTTP-Referer": env.OPENROUTER_SITE_URL,
      "X-Title": env.OPENROUTER_APP_TITLE,
      ...(typeof (body as CachedOpenRouterChatRequest).session_id === "string"
        ? {
            "x-session-id": (body as CachedOpenRouterChatRequest).session_id!,
          }
        : {}),
    },
    body: JSON.stringify(body),
  });
}
