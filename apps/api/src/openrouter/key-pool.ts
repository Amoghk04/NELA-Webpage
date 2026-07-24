import { ApiError, ErrorCodes } from "@nela/shared";
import { prisma } from "../db/prisma.js";
import { env } from "../config.js";
import { decryptSecret } from "../security/secret-crypto.js";

export type KeyLane = "free" | "paid";

export type PooledKey = {
  id: string;
  lane: KeyLane;
  apiKey: string;
  source: "db" | "env";
};

type CooldownEntry = { until: number };
const envCooldowns = new Map<string, CooldownEntry>();
const COOLDOWN_MS = 60_000;
let rrFree = 0;
let rrPaid = 0;

/**
 * Optional env completion keys (legacy / bootstrap).
 * Prefer Management API → encrypted ProviderKey rows; leave these empty in production.
 */
function envKeysForLane(lane: KeyLane): string[] {
  const keys: string[] = [];
  if (lane === "free") {
    if (env.OPENROUTER_API_KEY_FREE) keys.push(env.OPENROUTER_API_KEY_FREE);
  } else if (env.OPENROUTER_API_KEY_PAID) {
    keys.push(env.OPENROUTER_API_KEY_PAID);
  }
  // Legacy single key is usable for both lanes as last resort.
  if (env.OPENROUTER_API_KEY) keys.push(env.OPENROUTER_API_KEY);
  return [...new Set(keys.filter(Boolean))];
}

function isEnvCooling(key: string, now = Date.now()): boolean {
  const c = envCooldowns.get(key);
  return Boolean(c && c.until > now);
}

export function markKeyCooldown(input: {
  id: string;
  source: "db" | "env";
  apiKey?: string;
}): void {
  const until = Date.now() + COOLDOWN_MS;
  if (input.source === "env" && input.apiKey) {
    envCooldowns.set(input.apiKey, { until });
    return;
  }
  void prisma.providerKey
    .update({
      where: { id: input.id },
      data: { cooldownUntil: new Date(until) },
    })
    .catch(() => undefined);
}

async function loadDbKeys(lane: KeyLane): Promise<PooledKey[]> {
  const now = new Date();
  const rows = await prisma.providerKey.findMany({
    where: {
      provider: "openrouter",
      lane,
      disabled: false,
      OR: [{ cooldownUntil: null }, { cooldownUntil: { lt: now } }],
    },
    orderBy: { createdAt: "asc" },
  });

  return rows.map((row) => ({
    id: row.id,
    lane,
    apiKey: decryptSecret(row.encryptedKey),
    source: "db" as const,
  }));
}

async function countDbKeys(): Promise<number> {
  return prisma.providerKey.count({
    where: { provider: "openrouter", disabled: false },
  });
}

/**
 * Acquire a completion key for the given lane (free = Fast, paid = Smart/Deep).
 * Prefers DB keys minted by the Management API; env completion keys are legacy fallback only.
 */
export async function acquireKey(lane: KeyLane): Promise<PooledKey> {
  const dbKeys = await loadDbKeys(lane);
  const envList = envKeysForLane(lane).filter((k) => !isEnvCooling(k));

  const pool: PooledKey[] = [
    ...dbKeys,
    ...envList.map((apiKey, i) => ({
      id: `env:${lane}:${i}`,
      lane,
      apiKey,
      source: "env" as const,
    })),
  ];

  if (pool.length === 0) {
    throw new ApiError(
      ErrorCodes.OPENROUTER_NOT_CONFIGURED,
      env.OPENROUTER_MANAGEMENT_KEY
        ? "OpenRouter Management key is set but no completion keys are in the pool yet. Restart the API so ensurePool can mint them, or check management-key permissions."
        : "No OpenRouter keys configured. Set OPENROUTER_MANAGEMENT_KEY (preferred) or OPENROUTER_API_KEY_FREE / OPENROUTER_API_KEY_PAID / OPENROUTER_API_KEY.",
      503,
    );
  }

  const idx =
    lane === "free"
      ? rrFree++ % pool.length
      : rrPaid++ % pool.length;
  return pool[idx]!;
}

export function laneForMode(mode: "fast" | "smart" | "deep"): KeyLane {
  return mode === "fast" ? "free" : "paid";
}

/** True if we can serve completions: DB pool keys, env keys, or management key (will mint on boot). */
export async function isOpenRouterPoolConfiguredAsync(): Promise<boolean> {
  if (
    env.OPENROUTER_API_KEY ||
    env.OPENROUTER_API_KEY_FREE ||
    env.OPENROUTER_API_KEY_PAID ||
    env.OPENROUTER_MANAGEMENT_KEY
  ) {
    return true;
  }
  return (await countDbKeys()) > 0;
}

export function isOpenRouterPoolConfigured(): boolean {
  return Boolean(
    env.OPENROUTER_API_KEY ||
      env.OPENROUTER_API_KEY_FREE ||
      env.OPENROUTER_API_KEY_PAID ||
      env.OPENROUTER_MANAGEMENT_KEY,
  );
}
