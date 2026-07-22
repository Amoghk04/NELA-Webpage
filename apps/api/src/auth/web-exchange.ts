import { ApiError, ErrorCodes, type AuthTokenResponse } from "@nela/shared";
import { generateOpaqueToken, hashWithPepper } from "../security/crypto.js";
import { env } from "../config.js";

type ExchangeEntry = {
  payload: AuthTokenResponse;
  expiresAt: number;
};

const exchanges = new Map<string, ExchangeEntry>();

function hashCode(code: string): string {
  return hashWithPepper(code, env.REFRESH_TOKEN_PEPPER);
}

function pruneExpired(): void {
  const now = Date.now();
  for (const [key, value] of exchanges) {
    if (value.expiresAt <= now) exchanges.delete(key);
  }
}

/** Create a one-time code the browser can exchange for tokens (2 min TTL). */
export function createWebExchange(payload: AuthTokenResponse): string {
  pruneExpired();
  const code = generateOpaqueToken(32);
  exchanges.set(hashCode(code), {
    payload,
    expiresAt: Date.now() + 120_000,
  });
  return code;
}

export function consumeWebExchange(code: string): AuthTokenResponse {
  pruneExpired();
  const key = hashCode(code);
  const entry = exchanges.get(key);
  exchanges.delete(key);
  if (!entry || entry.expiresAt <= Date.now()) {
    throw new ApiError(
      ErrorCodes.AUTH_EXCHANGE_INVALID,
      "Sign-in session expired. Please try again.",
      400,
    );
  }
  return entry.payload;
}
