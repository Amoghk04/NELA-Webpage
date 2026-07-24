/**
 * OpenRouter prompt caching helpers.
 *
 * Most providers (OpenAI, DeepSeek, Moonshot, Grok, …) cache automatically when
 * the prompt prefix is stable. Anthropic and Alibaba require explicit
 * `cache_control` breakpoints on content blocks (and optionally tools).
 *
 * We always:
 * 1. Mark the first system message with `cache_control` (stable identity / schemas).
 * 2. Mark the last tool definition so tool schemas are included in the cached prefix.
 * 3. Pass `session_id` for sticky provider routing across multi-turn / tool loops.
 * 4. For Anthropic models, also set top-level `cache_control` so the breakpoint
 *    advances with growing conversation history.
 *
 * @see https://openrouter.ai/docs/guides/best-practices/prompt-caching
 */

import type {
  OpenRouterChatMessage,
  OpenRouterChatRequest,
  OpenRouterTool,
} from "./openrouter.client.js";

export type CacheControl = {
  type: "ephemeral";
  /** Default 5m; 1h reduces repeated cache writes for long desktop sessions. */
  ttl?: "1h";
};

const DEFAULT_CACHE: CacheControl = { type: "ephemeral", ttl: "1h" };

export type OpenRouterTextPart = {
  type: "text";
  text: string;
  cache_control?: CacheControl;
};

/** Message content as accepted by OpenRouter Chat Completions. */
export type OpenRouterMessageContent =
  | string
  | null
  | OpenRouterTextPart[];

export type CachedOpenRouterChatMessage = Omit<
  OpenRouterChatMessage,
  "content"
> & {
  content?: OpenRouterMessageContent;
};

export type CachedOpenRouterTool = OpenRouterTool & {
  cache_control?: CacheControl;
};

export type CachedOpenRouterChatRequest = Omit<
  OpenRouterChatRequest,
  "messages" | "tools"
> & {
  messages: CachedOpenRouterChatMessage[];
  tools?: CachedOpenRouterTool[];
  /** Sticky routing key — maximizes cache hits across turns. */
  session_id?: string;
  /** Anthropic automatic caching (advancing breakpoint). */
  cache_control?: CacheControl;
};

function isAnthropicModel(model: string): boolean {
  const id = model.toLowerCase();
  return id.startsWith("anthropic/") || id.includes("claude");
}

/**
 * Convert the first system message to a text block with cache_control.
 * Leave later system messages as plain strings so dynamic session context
 * does not invalidate the cached identity/schema prefix.
 */
export function applyMessageCacheBreakpoints(
  messages: OpenRouterChatMessage[],
  cache: CacheControl = DEFAULT_CACHE,
): CachedOpenRouterChatMessage[] {
  let markedFirstSystem = false;

  return messages.map((m) => {
    if (
      !markedFirstSystem &&
      m.role === "system" &&
      typeof m.content === "string" &&
      m.content.length > 0
    ) {
      markedFirstSystem = true;
      return {
        ...m,
        content: [
          {
            type: "text",
            text: m.content,
            cache_control: cache,
          },
        ],
      };
    }
    return { ...m };
  });
}

/** Anthropic caches tool defs when the last tool carries cache_control. */
export function applyToolCacheBreakpoints(
  tools: OpenRouterTool[] | undefined,
  cache: CacheControl = DEFAULT_CACHE,
): CachedOpenRouterTool[] | undefined {
  if (!tools?.length) return tools;
  const last = tools.length - 1;
  return tools.map((tool, i) =>
    i === last ? { ...tool, cache_control: cache } : { ...tool },
  );
}

export function buildCachedOpenRouterRequest(input: {
  model: string;
  messages: OpenRouterChatMessage[];
  stream?: boolean;
  max_tokens?: number;
  temperature?: number;
  tools?: OpenRouterTool[];
  tool_choice?: OpenRouterChatRequest["tool_choice"];
  response_format?: OpenRouterChatRequest["response_format"];
  /** Desktop chat session / tool-loop sticky key (max 256 chars). */
  sessionId?: string;
}): CachedOpenRouterChatRequest {
  const messages = applyMessageCacheBreakpoints(input.messages);
  const tools = applyToolCacheBreakpoints(input.tools);

  const body: CachedOpenRouterChatRequest = {
    model: input.model,
    messages,
    stream: input.stream,
    max_tokens: input.max_tokens,
    temperature: input.temperature,
    tools,
    tool_choice: input.tool_choice,
    response_format: input.response_format,
  };

  const sessionId = input.sessionId?.trim().slice(0, 256);
  if (sessionId) {
    body.session_id = sessionId;
  }

  if (isAnthropicModel(input.model)) {
    // Advancing breakpoint for multi-turn chats on Anthropic endpoints.
    body.cache_control = DEFAULT_CACHE;
  }

  return body;
}
