import { ApiError, ErrorCodes } from "@nela/shared";
import { prisma } from "../db/prisma.js";
import { env } from "../config.js";
import { encryptSecret } from "../security/secret-crypto.js";
import type { KeyLane } from "./key-pool.js";

const KEYS_URL = "https://openrouter.ai/api/v1/keys";

export function isManagementConfigured(): boolean {
  return Boolean(env.OPENROUTER_MANAGEMENT_KEY);
}

async function managementFetch(
  path: string,
  init?: RequestInit,
): Promise<Response> {
  if (!env.OPENROUTER_MANAGEMENT_KEY) {
    throw new ApiError(
      ErrorCodes.OPENROUTER_NOT_CONFIGURED,
      "OPENROUTER_MANAGEMENT_KEY is not configured",
      503,
    );
  }
  return fetch(`${KEYS_URL}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${env.OPENROUTER_MANAGEMENT_KEY}`,
      "content-type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
}

export type CreatedOpenRouterKey = {
  hash: string;
  name: string;
  key: string;
  limit?: number | null;
};

/**
 * Create a completion API key via OpenRouter Management API.
 * Plaintext `key` is only returned once.
 */
export async function createOpenRouterKey(input: {
  name: string;
  limit?: number;
  limitReset?: "daily" | "weekly" | "monthly" | null;
}): Promise<CreatedOpenRouterKey> {
  const res = await managementFetch("", {
    method: "POST",
    body: JSON.stringify({
      name: input.name,
      limit: input.limit,
      limit_reset: input.limitReset ?? undefined,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new ApiError(
      ErrorCodes.OPENROUTER_FAILED,
      "Failed to create OpenRouter key",
      502,
      { status: res.status, body: text.slice(0, 800) },
    );
  }

  // OpenRouter shape: { data: { hash, name, limit, ... }, key: "sk-or-..." }
  // Plaintext `key` is top-level (returned only once); hash lives under `data`.
  const json = (await res.json()) as {
    data?: { hash?: string; name?: string; limit?: number | null };
    hash?: string;
    name?: string;
    key?: string;
    limit?: number | null;
  };
  const hash = json.data?.hash ?? json.hash;
  const key = json.key;
  if (!key || !hash) {
    throw new ApiError(
      ErrorCodes.OPENROUTER_FAILED,
      "OpenRouter key create response missing key/hash",
      502,
      {
        hasTopLevelKey: Boolean(json.key),
        hasDataHash: Boolean(json.data?.hash),
        topLevelKeys: Object.keys(json),
      },
    );
  }
  return {
    hash,
    name: json.data?.name ?? json.name ?? input.name,
    key,
    limit: json.data?.limit ?? json.limit ?? input.limit ?? null,
  };
}

export async function disableOpenRouterKey(hash: string): Promise<void> {
  const res = await managementFetch(`/${hash}`, {
    method: "PATCH",
    body: JSON.stringify({ disabled: true }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new ApiError(
      ErrorCodes.OPENROUTER_FAILED,
      "Failed to disable OpenRouter key",
      502,
      { status: res.status, body: text.slice(0, 800) },
    );
  }
}

async function countHealthyKeys(lane: KeyLane): Promise<number> {
  return prisma.providerKey.count({
    where: {
      provider: "openrouter",
      lane,
      disabled: false,
    },
  });
}

/**
 * Ensure at least `minKeys` healthy DB keys exist for a lane.
 * No-ops when Management API is not configured (env keys still work).
 */
export async function ensurePool(input: {
  lane: KeyLane;
  minKeys?: number;
  creditLimitUsd?: number;
}): Promise<{ created: number; total: number }> {
  const minKeys = input.minKeys ?? 1;
  const existing = await countHealthyKeys(input.lane);
  if (existing >= minKeys) {
    return { created: 0, total: existing };
  }
  if (!isManagementConfigured()) {
    return { created: 0, total: existing };
  }

  let created = 0;
  for (let i = existing; i < minKeys; i += 1) {
    const name = `nela-${env.NODE_ENV}-${input.lane}-${Date.now()}-${i}`;
    const orKey = await createOpenRouterKey({
      name,
      limit: input.creditLimitUsd,
      limitReset: "monthly",
    });
    await prisma.providerKey.create({
      data: {
        provider: "openrouter",
        lane: input.lane,
        name: orKey.name,
        externalHash: orKey.hash,
        encryptedKey: encryptSecret(orKey.key),
        creditLimitUsd: input.creditLimitUsd ?? null,
      },
    });
    created += 1;
  }

  return { created, total: existing + created };
}

/** Bootstrap both lanes to at least one key when management is configured. */
export async function ensureDefaultPools(): Promise<void> {
  if (!isManagementConfigured()) return;
  await ensurePool({ lane: "free", minKeys: 1 });
  await ensurePool({
    lane: "paid",
    minKeys: 1,
    creditLimitUsd: 50,
  });
}
