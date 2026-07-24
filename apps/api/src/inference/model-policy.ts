import { ApiError, ErrorCodes, type ResolvedCloudMode } from "@nela/shared";
import {
  estimateCostUsdFromCatalog,
  MODEL_CATALOG,
  type ModelCandidate,
} from "./model-catalog.js";

export type ModelHealth = {
  successCount: number;
  failCount: number;
  lastErrorAt?: number;
  circuitOpenUntil?: number;
};

const healthByModel = new Map<string, ModelHealth>();
const CIRCUIT_MS = 60_000;
const MAX_FALLBACKS = 3;

function getHealth(modelId: string): ModelHealth {
  let h = healthByModel.get(modelId);
  if (!h) {
    h = { successCount: 0, failCount: 0 };
    healthByModel.set(modelId, h);
  }
  return h;
}

export function markModelSuccess(modelId: string): void {
  const h = getHealth(modelId);
  h.successCount += 1;
  h.circuitOpenUntil = undefined;
}

export function markModelFailure(modelId: string): void {
  const h = getHealth(modelId);
  h.failCount += 1;
  h.lastErrorAt = Date.now();
  h.circuitOpenUntil = Date.now() + CIRCUIT_MS;
}

function reliabilityScore(modelId: string): number {
  const h = getHealth(modelId);
  const total = h.successCount + h.failCount;
  if (total === 0) return 0.5;
  return h.successCount / total;
}

function isCircuitOpen(modelId: string, now = Date.now()): boolean {
  const h = getHealth(modelId);
  return Boolean(h.circuitOpenUntil && h.circuitOpenUntil > now);
}

export type SelectModelInput = {
  mode: ResolvedCloudMode;
  needsVision?: boolean;
  minContextLength?: number;
  /** Models already tried in this request (fallbacks). */
  excludeIds?: string[];
};

function scoreCandidate(c: ModelCandidate): number {
  const reliability = reliabilityScore(c.id);
  if (c.isFree || c.mode === "fast") {
    return c.priority * 10 + reliability * 100;
  }
  const avgCost = (c.inputCostPer1M + c.outputCostPer1M) / 2;
  const costScore = 1 / (1 + avgCost);
  return c.priority * 5 + costScore * 80 + reliability * 40;
}

export function listCandidates(input: SelectModelInput): ModelCandidate[] {
  const exclude = new Set(input.excludeIds ?? []);
  return MODEL_CATALOG.filter((c) => {
    if (!c.enabled || c.mode !== input.mode) return false;
    if (exclude.has(c.id)) return false;
    if (input.mode === "fast" && !c.isFree) return false;
    if (input.needsVision && !c.supportsVision) return false;
    if (
      input.minContextLength &&
      c.contextLength < input.minContextLength
    ) {
      return false;
    }
    if (isCircuitOpen(c.id)) return false;
    return true;
  }).sort((a, b) => scoreCandidate(b) - scoreCandidate(a));
}

export function selectModel(input: SelectModelInput): ModelCandidate {
  const ranked = listCandidates(input);
  if (ranked.length === 0) {
    throw new ApiError(
      ErrorCodes.CLOUD_BUSY,
      "Cloud is busy, try again shortly",
      503,
    );
  }
  return ranked[0]!;
}

export function selectModelFallbacks(input: SelectModelInput): ModelCandidate[] {
  return listCandidates(input).slice(0, MAX_FALLBACKS);
}

/** @deprecated Prefer selectModel({ mode }). Kept for tests/compat. */
export function selectModelForIntent(intent: string): string {
  if (
    intent === "artifact_plan" ||
    intent === "deep_reasoning" ||
    intent === "vision"
  ) {
    return selectModel({
      mode: "deep",
      needsVision: intent === "vision",
    }).id;
  }
  return selectModel({ mode: "smart" }).id;
}

export function estimateCostUsd(input: {
  promptTokens: number;
  completionTokens: number;
  model: string;
}): number {
  return estimateCostUsdFromCatalog(input);
}
