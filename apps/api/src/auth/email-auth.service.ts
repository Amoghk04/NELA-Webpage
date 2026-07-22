import {
  ApiError,
  ErrorCodes,
  PLAN_LIMITS,
  type AuthTokenResponse,
} from "@nela/shared";
import { prisma } from "../db/prisma.js";
import { hashSecret, verifySecret } from "../security/crypto.js";
import { writeAuditLog } from "../security/audit-log.js";
import { createDeviceForUser } from "./session.service.js";
import { issueTokenPair } from "./token.service.js";
import {
  ensureFreeEntitlement,
} from "../users/users.service.js";

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

const passwordSchema = {
  min: 8,
  max: 128,
};

function assertPassword(password: string): void {
  if (password.length < passwordSchema.min || password.length > passwordSchema.max) {
    throw new ApiError(
      ErrorCodes.VALIDATION_ERROR,
      `Password must be between ${passwordSchema.min} and ${passwordSchema.max} characters`,
      400,
    );
  }
}

async function issueSessionForUser(input: {
  userId: string;
  email: string;
  deviceName?: string;
}): Promise<AuthTokenResponse> {
  const device = await createDeviceForUser({
    userId: input.userId,
    deviceName: input.deviceName ?? "NELA App",
  });
  const tokens = await issueTokenPair({
    userId: input.userId,
    deviceId: device.id,
    email: input.email,
  });
  return tokens;
}

export async function registerWithEmail(input: {
  email: string;
  password: string;
  name?: string;
  deviceName?: string;
}): Promise<AuthTokenResponse> {
  const email = normalizeEmail(input.email);
  assertPassword(input.password);

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    throw new ApiError(
      ErrorCodes.EMAIL_ALREADY_EXISTS,
      "An account with this email already exists. Sign in instead.",
      409,
    );
  }

  const passwordHash = await hashSecret(input.password);
  const name = input.name?.trim() || email.split("@")[0] || "NELA User";

  const user = await prisma.user.create({
    data: {
      email,
      name,
      passwordHash,
      entitlement: {
        create: {
          cloudEnabled: PLAN_LIMITS.free.cloudEnabled,
          plan: "free",
          status: PLAN_LIMITS.free.defaultStatus,
          includedUsdMonthly: PLAN_LIMITS.free.includedUsdMonthly,
          maxInputTokens: PLAN_LIMITS.free.maxInputTokens,
          maxOutputTokens: PLAN_LIMITS.free.maxOutputTokens,
          requestsPerMinute: PLAN_LIMITS.free.requestsPerMinute,
        },
      },
    },
  });

  await writeAuditLog({
    userId: user.id,
    action: "auth.email.register",
    metadata: { email },
  });

  return issueSessionForUser({
    userId: user.id,
    email: user.email,
    deviceName: input.deviceName,
  });
}

export async function loginWithEmail(input: {
  email: string;
  password: string;
  deviceName?: string;
}): Promise<AuthTokenResponse> {
  const email = normalizeEmail(input.email);
  assertPassword(input.password);

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user?.passwordHash) {
    throw new ApiError(
      ErrorCodes.INVALID_CREDENTIALS,
      "Invalid email or password",
      401,
    );
  }

  const ok = await verifySecret(input.password, user.passwordHash);
  if (!ok) {
    throw new ApiError(
      ErrorCodes.INVALID_CREDENTIALS,
      "Invalid email or password",
      401,
    );
  }

  await ensureFreeEntitlement(user.id);

  await writeAuditLog({
    userId: user.id,
    action: "auth.email.login",
    metadata: { email },
  });

  return issueSessionForUser({
    userId: user.id,
    email: user.email,
    deviceName: input.deviceName,
  });
}
