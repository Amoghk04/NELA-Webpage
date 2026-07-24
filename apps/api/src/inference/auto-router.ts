import type {
  CloudChatMessage,
  CloudIntent,
  CloudMode,
  ResolvedCloudMode,
} from "@nela/shared";

const DEEP_KEYWORDS =
  /\b(prove|proof|step by step|step-by-step|reason carefully|architecture|design a system|formal|theorem|derive|optimize globally|refactor entire|end-to-end|comprehensive analysis)\b/i;

const SMART_KEYWORDS =
  /\b(refactor|implement|debug|code|summarize|compare|explain how|write a|generate|plan|outline|analyze)\b/i;

function totalContentLength(messages: CloudChatMessage[]): number {
  return messages.reduce((sum, m) => sum + (m.content?.length ?? 0), 0);
}

function userMessageCount(messages: CloudChatMessage[]): number {
  return messages.filter((m) => m.role === "user").length;
}

function hasCodeFence(messages: CloudChatMessage[]): boolean {
  return messages.some(
    (m) => typeof m.content === "string" && m.content.includes("```"),
  );
}

/**
 * v1 Auto classifier: heuristics only (no extra LLM call).
 * Returns the preferred quality tier before entitlement clamping.
 */
export function classifyQueryComplexity(input: {
  messages: CloudChatMessage[];
  intent?: CloudIntent;
  needsVision?: boolean;
}): ResolvedCloudMode {
  if (input.intent === "deep_reasoning" || input.intent === "artifact_plan") {
    return "deep";
  }
  if (input.intent === "vision" || input.needsVision) {
    return "smart";
  }
  if (
    input.intent === "cheap_background" ||
    input.intent === "quick_chat"
  ) {
    return "fast";
  }

  const text = input.messages
    .map((m) => (typeof m.content === "string" ? m.content : ""))
    .join("\n");
  const len = totalContentLength(input.messages);
  const turns = userMessageCount(input.messages);

  if (DEEP_KEYWORDS.test(text) || len > 12_000 || turns >= 8) {
    return "deep";
  }
  if (
    SMART_KEYWORDS.test(text) ||
    hasCodeFence(input.messages) ||
    len > 1_500 ||
    turns >= 3
  ) {
    return "smart";
  }
  return "fast";
}

/**
 * Resolve requested mode to a concrete tier, then clamp unpaid users to Fast.
 */
export function resolveCloudMode(input: {
  mode: CloudMode;
  messages: CloudChatMessage[];
  intent?: CloudIntent;
  needsVision?: boolean;
  paidWithQuota: boolean;
}): { requestedMode: CloudMode; resolvedMode: ResolvedCloudMode; clamped: boolean } {
  const preferred =
    input.mode === "auto"
      ? classifyQueryComplexity({
          messages: input.messages,
          intent: input.intent,
          needsVision: input.needsVision,
        })
      : input.mode;

  if (preferred !== "fast" && !input.paidWithQuota) {
    return {
      requestedMode: input.mode,
      resolvedMode: "fast",
      clamped: true,
    };
  }

  return {
    requestedMode: input.mode,
    resolvedMode: preferred,
    clamped: false,
  };
}
