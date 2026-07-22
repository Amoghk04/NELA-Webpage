import { createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import bcrypt from "bcryptjs";

export function sha256(input: string): string {
  return createHash("sha256").update(input).digest("hex");
}

export function hashWithPepper(value: string, pepper: string): string {
  return sha256(`${pepper}:${value}`);
}

export async function hashSecret(value: string): Promise<string> {
  return bcrypt.hash(value, 12);
}

export async function verifySecret(
  value: string,
  hash: string,
): Promise<boolean> {
  return bcrypt.compare(value, hash);
}

export function generateOpaqueToken(bytes = 32): string {
  return randomBytes(bytes).toString("base64url");
}

export function generateUserCode(): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const raw = randomBytes(8);
  let code = "";
  for (let i = 0; i < 8; i += 1) {
    code += alphabet[raw[i]! % alphabet.length];
  }
  return `${code.slice(0, 4)}-${code.slice(4)}`;
}

export function safeEqual(a: string, b: string): boolean {
  const aBuf = Buffer.from(a);
  const bBuf = Buffer.from(b);
  if (aBuf.length !== bBuf.length) return false;
  return timingSafeEqual(aBuf, bBuf);
}

export function hmacSha256Hex(secret: string, payload: string | Buffer): string {
  return createHmac("sha256", secret).update(payload).digest("hex");
}
