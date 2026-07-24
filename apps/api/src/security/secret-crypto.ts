import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";
import { env } from "../config.js";

const ALGO = "aes-256-gcm";

function getKey(): Buffer | null {
  const raw = env.TOKEN_ENCRYPTION_KEY_BASE64;
  if (!raw) return null;
  const buf = Buffer.from(raw, "base64");
  if (buf.length !== 32) {
    throw new Error(
      "TOKEN_ENCRYPTION_KEY_BASE64 must decode to 32 bytes for AES-256-GCM",
    );
  }
  return buf;
}

/** Encrypt a secret for DB storage. Format: iv:tag:ciphertext (base64 parts). */
export function encryptSecret(plaintext: string): string {
  const key = getKey();
  if (!key) {
    // Dev fallback: store with a marker so we can still run without a key.
    // Production must set TOKEN_ENCRYPTION_KEY_BASE64.
    return `plain:${Buffer.from(plaintext, "utf8").toString("base64")}`;
  }
  const iv = randomBytes(12);
  const cipher = createCipheriv(ALGO, key, iv);
  const enc = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();
  return `${iv.toString("base64")}:${tag.toString("base64")}:${enc.toString("base64")}`;
}

export function decryptSecret(payload: string): string {
  if (payload.startsWith("plain:")) {
    return Buffer.from(payload.slice("plain:".length), "base64").toString(
      "utf8",
    );
  }
  const key = getKey();
  if (!key) {
    throw new Error(
      "Cannot decrypt ProviderKey without TOKEN_ENCRYPTION_KEY_BASE64",
    );
  }
  const [ivB64, tagB64, dataB64] = payload.split(":");
  if (!ivB64 || !tagB64 || !dataB64) {
    throw new Error("Invalid encrypted secret format");
  }
  const decipher = createDecipheriv(
    ALGO,
    key,
    Buffer.from(ivB64, "base64"),
  );
  decipher.setAuthTag(Buffer.from(tagB64, "base64"));
  return Buffer.concat([
    decipher.update(Buffer.from(dataB64, "base64")),
    decipher.final(),
  ]).toString("utf8");
}
