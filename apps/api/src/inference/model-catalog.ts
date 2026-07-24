import type { ResolvedCloudMode } from "@nela/shared";

export type ModelCandidate = {
  id: string;
  mode: ResolvedCloudMode;
  inputCostPer1M: number;
  outputCostPer1M: number;
  isFree: boolean;
  contextLength: number;
  supportsVision: boolean;
  priority: number;
  enabled: boolean;
};

/**
 * Static allowlist per mode. Verified against GET https://openrouter.ai/api/v1/models.
 *
 * Fast / Smart — OpenRouter free tier (`:free` / openrouter/free).
 * Deep — paid frontier flagships cheaper than Claude Fable / Opus and GPT-5.6
 *         (e.g. Kimi K3, MiniMax M2.7, DeepSeek V4 Pro, GLM-5.x). No free models.
 *
 * Slugs go stale — re-check OpenRouter when calls 404.
 */
export const MODEL_CATALOG: ModelCandidate[] = [
  // ── Fast (free) ───────────────────────────────────────────────────────
  {
    id: "openrouter/free",
    mode: "fast",
    inputCostPer1M: 0,
    outputCostPer1M: 0,
    isFree: true,
    contextLength: 200_000,
    supportsVision: true,
    priority: 100,
    enabled: true,
  },
  {
    id: "nvidia/nemotron-nano-9b-v2:free",
    mode: "fast",
    inputCostPer1M: 0,
    outputCostPer1M: 0,
    isFree: true,
    contextLength: 128_000,
    supportsVision: false,
    priority: 95,
    enabled: true,
  },
  {
    id: "openai/gpt-oss-20b:free",
    mode: "fast",
    inputCostPer1M: 0,
    outputCostPer1M: 0,
    isFree: true,
    contextLength: 131_072,
    supportsVision: false,
    priority: 90,
    enabled: true,
  },
  {
    id: "inclusionai/ling-3.0-flash:free",
    mode: "fast",
    inputCostPer1M: 0,
    outputCostPer1M: 0,
    isFree: true,
    contextLength: 262_144,
    supportsVision: false,
    priority: 85,
    enabled: true,
  },
  {
    id: "poolside/laguna-xs-2.1:free",
    mode: "fast",
    inputCostPer1M: 0,
    outputCostPer1M: 0,
    isFree: true,
    contextLength: 262_144,
    supportsVision: false,
    priority: 80,
    enabled: true,
  },

  // ── Smart (free) ──────────────────────────────────────────────────────
  {
    id: "google/gemma-4-26b-a4b-it:free",
    mode: "smart",
    inputCostPer1M: 0,
    outputCostPer1M: 0,
    isFree: true,
    contextLength: 262_144,
    supportsVision: true,
    priority: 100,
    enabled: true,
  },
  {
    id: "google/gemma-4-31b-it:free",
    mode: "smart",
    inputCostPer1M: 0,
    outputCostPer1M: 0,
    isFree: true,
    contextLength: 262_144,
    supportsVision: true,
    priority: 95,
    enabled: true,
  },
  {
    id: "nvidia/nemotron-3-nano-30b-a3b:free",
    mode: "smart",
    inputCostPer1M: 0,
    outputCostPer1M: 0,
    isFree: true,
    contextLength: 256_000,
    supportsVision: false,
    priority: 90,
    enabled: true,
  },
  {
    id: "nvidia/nemotron-nano-12b-v2-vl:free",
    mode: "smart",
    inputCostPer1M: 0,
    outputCostPer1M: 0,
    isFree: true,
    contextLength: 128_000,
    supportsVision: true,
    priority: 85,
    enabled: true,
  },
  {
    id: "poolside/laguna-s-2.1:free",
    mode: "smart",
    inputCostPer1M: 0,
    outputCostPer1M: 0,
    isFree: true,
    contextLength: 262_144,
    supportsVision: false,
    priority: 80,
    enabled: true,
  },
  {
    id: "cohere/north-mini-code:free",
    mode: "smart",
    inputCostPer1M: 0,
    outputCostPer1M: 0,
    isFree: true,
    contextLength: 256_000,
    supportsVision: false,
    priority: 75,
    enabled: true,
  },

  // ── Deep (paid flagships — cheaper than Claude Fable/Opus & GPT-5.6) ──
  {
    id: "moonshotai/kimi-k3",
    mode: "deep",
    inputCostPer1M: 3,
    outputCostPer1M: 15,
    isFree: false,
    contextLength: 1_048_576,
    supportsVision: true,
    priority: 100,
    enabled: true,
  },
  {
    id: "minimax/minimax-m2.7",
    mode: "deep",
    inputCostPer1M: 0.25,
    outputCostPer1M: 1,
    isFree: false,
    contextLength: 204_800,
    supportsVision: false,
    priority: 98,
    enabled: true,
  },
  {
    id: "minimax/minimax-m3",
    mode: "deep",
    inputCostPer1M: 0.3,
    outputCostPer1M: 1.2,
    isFree: false,
    contextLength: 1_048_576,
    supportsVision: true,
    priority: 96,
    enabled: true,
  },
  {
    id: "moonshotai/kimi-k2.6",
    mode: "deep",
    inputCostPer1M: 0.684,
    outputCostPer1M: 3.42,
    isFree: false,
    contextLength: 262_144,
    supportsVision: true,
    priority: 94,
    enabled: true,
  },
  {
    id: "moonshotai/kimi-k2.7-code",
    mode: "deep",
    inputCostPer1M: 0.78,
    outputCostPer1M: 3.5,
    isFree: false,
    contextLength: 262_144,
    supportsVision: true,
    priority: 92,
    enabled: true,
  },
  {
    id: "deepseek/deepseek-v4-pro",
    mode: "deep",
    inputCostPer1M: 0.435,
    outputCostPer1M: 0.87,
    isFree: false,
    contextLength: 1_048_576,
    supportsVision: false,
    priority: 90,
    enabled: true,
  },
  {
    id: "z-ai/glm-5.2",
    mode: "deep",
    inputCostPer1M: 0.774,
    outputCostPer1M: 2.433,
    isFree: false,
    contextLength: 1_048_576,
    supportsVision: false,
    priority: 88,
    enabled: true,
  },
  {
    id: "z-ai/glm-5.1",
    mode: "deep",
    inputCostPer1M: 0.966,
    outputCostPer1M: 3.036,
    isFree: false,
    contextLength: 204_800,
    supportsVision: false,
    priority: 86,
    enabled: true,
  },
  {
    id: "qwen/qwen3.7-max",
    mode: "deep",
    inputCostPer1M: 1.475,
    outputCostPer1M: 4.425,
    isFree: false,
    contextLength: 1_000_000,
    supportsVision: false,
    priority: 84,
    enabled: true,
  },
  {
    id: "moonshotai/kimi-k2.5",
    mode: "deep",
    inputCostPer1M: 0.57,
    outputCostPer1M: 2.85,
    isFree: false,
    contextLength: 262_144,
    supportsVision: true,
    priority: 82,
    enabled: true,
  },
  {
    id: "moonshotai/kimi-k2-thinking",
    mode: "deep",
    inputCostPer1M: 0.6,
    outputCostPer1M: 2.5,
    isFree: false,
    contextLength: 262_144,
    supportsVision: false,
    priority: 80,
    enabled: true,
  },
  {
    id: "deepseek/deepseek-r1-0528",
    mode: "deep",
    inputCostPer1M: 0.5,
    outputCostPer1M: 2.15,
    isFree: false,
    contextLength: 163_840,
    supportsVision: false,
    priority: 78,
    enabled: true,
  },
  {
    id: "x-ai/grok-4.3",
    mode: "deep",
    inputCostPer1M: 1.25,
    outputCostPer1M: 2.5,
    isFree: false,
    contextLength: 1_000_000,
    supportsVision: true,
    priority: 76,
    enabled: true,
  },
  {
    id: "x-ai/grok-4.5",
    mode: "deep",
    inputCostPer1M: 2,
    outputCostPer1M: 6,
    isFree: false,
    contextLength: 500_000,
    supportsVision: true,
    priority: 74,
    enabled: true,
  },
  {
    id: "minimax/minimax-m2.5",
    mode: "deep",
    inputCostPer1M: 0.15,
    outputCostPer1M: 0.9,
    isFree: false,
    contextLength: 204_800,
    supportsVision: false,
    priority: 72,
    enabled: true,
  },
  {
    id: "qwen/qwen3-max-thinking",
    mode: "deep",
    inputCostPer1M: 0.78,
    outputCostPer1M: 3.9,
    isFree: false,
    contextLength: 262_144,
    supportsVision: false,
    priority: 70,
    enabled: true,
  },
  {
    id: "z-ai/glm-5",
    mode: "deep",
    inputCostPer1M: 0.95,
    outputCostPer1M: 2.55,
    isFree: false,
    contextLength: 204_800,
    supportsVision: false,
    priority: 68,
    enabled: true,
  },
  {
    id: "meta-llama/llama-4-maverick",
    mode: "deep",
    inputCostPer1M: 0.2,
    outputCostPer1M: 0.8,
    isFree: false,
    contextLength: 1_048_576,
    supportsVision: true,
    priority: 66,
    enabled: true,
  },
  {
    id: "mistralai/mistral-large-2512",
    mode: "deep",
    inputCostPer1M: 0.5,
    outputCostPer1M: 1.5,
    isFree: false,
    contextLength: 262_144,
    supportsVision: true,
    priority: 64,
    enabled: true,
  },
  {
    id: "deepseek/deepseek-v3.2",
    mode: "deep",
    inputCostPer1M: 0.269,
    outputCostPer1M: 0.4,
    isFree: false,
    contextLength: 163_840,
    supportsVision: false,
    priority: 62,
    enabled: true,
  },
];

export function getCatalogEntry(modelId: string): ModelCandidate | undefined {
  return MODEL_CATALOG.find((m) => m.id === modelId);
}

export function estimateCostUsdFromCatalog(input: {
  promptTokens: number;
  completionTokens: number;
  model: string;
}): number {
  const entry = getCatalogEntry(input.model);
  if (entry) {
    return (
      (input.promptTokens * entry.inputCostPer1M) / 1_000_000 +
      (input.completionTokens * entry.outputCostPer1M) / 1_000_000
    );
  }
  if (input.model.endsWith(":free") || input.model === "openrouter/free") {
    return 0;
  }
  const isPremium =
    input.model.includes("gpt-4o") && !input.model.includes("mini");
  const inputRate = isPremium ? 2.5 / 1_000_000 : 0.15 / 1_000_000;
  const outputRate = isPremium ? 10 / 1_000_000 : 0.6 / 1_000_000;
  return (
    input.promptTokens * inputRate + input.completionTokens * outputRate
  );
}
