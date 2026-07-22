import { ApiError, ErrorCodes } from "@nela/shared";
import { env } from "../config.js";

export type OpenRouterChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

export type OpenRouterChatRequest = {
  model: string;
  messages: OpenRouterChatMessage[];
  stream?: boolean;
  max_tokens?: number;
  temperature?: number;
};

export function isOpenRouterConfigured(): boolean {
  return Boolean(env.OPENROUTER_API_KEY);
}

export async function openRouterChatCompletions(
  body: OpenRouterChatRequest,
): Promise<Response> {
  if (!isOpenRouterConfigured()) {
    throw new ApiError(
      ErrorCodes.OPENROUTER_NOT_CONFIGURED,
      "OPENROUTER_API_KEY is not configured",
      503,
    );
  }

  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.OPENROUTER_API_KEY}`,
      "content-type": "application/json",
      "HTTP-Referer": env.OPENROUTER_SITE_URL,
      "X-Title": env.OPENROUTER_APP_TITLE,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok && !body.stream) {
    const text = await res.text();
    throw new ApiError(
      ErrorCodes.OPENROUTER_FAILED,
      "OpenRouter request failed",
      502,
      { status: res.status, body: text.slice(0, 800) },
    );
  }

  return res;
}
