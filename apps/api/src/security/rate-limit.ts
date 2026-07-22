import { ApiError, ErrorCodes } from "@nela/shared";
import { env } from "../config.js";

type Bucket = {
  count: number;
  resetAt: number;
};

const memoryBuckets = new Map<string, Bucket>();

async function incrRedis(
  key: string,
  windowMs: number,
): Promise<{ count: number; resetAt: number } | null> {
  if (!env.REDIS_URL) return null;
  try {
    // Optional Redis: use REST-less TCP via dynamic import if ioredis is present.
    // Keep a soft stub — when Redis URL is set but client unavailable, fall back.
    return null;
  } catch {
    return null;
  }
}

function incrMemory(
  key: string,
  windowMs: number,
): { count: number; resetAt: number } {
  const now = Date.now();
  const existing = memoryBuckets.get(key);
  if (!existing || existing.resetAt <= now) {
    const bucket = { count: 1, resetAt: now + windowMs };
    memoryBuckets.set(key, bucket);
    return bucket;
  }
  existing.count += 1;
  return existing;
}

export async function enforceRateLimit(input: {
  key: string;
  limit: number;
  windowMs: number;
}): Promise<void> {
  const redis = await incrRedis(input.key, input.windowMs);
  const bucket = redis ?? incrMemory(input.key, input.windowMs);
  if (bucket.count > input.limit) {
    throw new ApiError(
      ErrorCodes.RATE_LIMITED,
      "Too many requests. Please retry later.",
      429,
      { resetAt: new Date(bucket.resetAt).toISOString() },
    );
  }
}
