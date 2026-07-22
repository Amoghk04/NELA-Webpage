import type { CloudIntent } from "@nela/shared";

/** OpenRouter model routing policy — never expose keys; models only. */
const INTENT_MODELS: Record<CloudIntent, string> = {
  quick_chat: "openai/gpt-4o-mini",
  summarize: "openai/gpt-4o-mini",
  rag_answer: "openai/gpt-4o-mini",
  artifact_plan: "openai/gpt-4o",
  deep_reasoning: "openai/gpt-4o",
  vision: "openai/gpt-4o",
  cheap_background: "openai/gpt-4o-mini",
};

export function selectModelForIntent(intent: CloudIntent): string {
  return INTENT_MODELS[intent] ?? INTENT_MODELS.quick_chat;
}

/** Rough USD estimate used for quota metering until provider cost is known. */
export function estimateCostUsd(input: {
  promptTokens: number;
  completionTokens: number;
  model: string;
}): number {
  const isPremium = input.model.includes("gpt-4o") && !input.model.includes("mini");
  const inputRate = isPremium ? 2.5 / 1_000_000 : 0.15 / 1_000_000;
  const outputRate = isPremium ? 10 / 1_000_000 : 0.6 / 1_000_000;
  return (
    input.promptTokens * inputRate + input.completionTokens * outputRate
  );
}
