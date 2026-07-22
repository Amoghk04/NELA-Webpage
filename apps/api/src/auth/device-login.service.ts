import {
  ApiError,
  ErrorCodes,
  type DevicePollResponse,
  type DeviceStartResponse,
} from "@nela/shared";
import { env } from "../config.js";
import { prisma } from "../db/prisma.js";
import {
  generateOpaqueToken,
  generateUserCode,
  hashWithPepper,
} from "../security/crypto.js";
import { writeAuditLog } from "../security/audit-log.js";
import { createDeviceForUser } from "./session.service.js";
import { issueTokenPair } from "./token.service.js";

function hashDeviceCode(deviceCode: string): string {
  return hashWithPepper(deviceCode, env.REFRESH_TOKEN_PEPPER);
}

/** Normalize user-facing codes like "ABCD-EFGH" / "abcd efgh" → "ABCDEFGH". */
export function normalizeUserCode(userCode: string): string {
  return userCode.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
}

function hashUserCode(userCode: string): string {
  return hashWithPepper(normalizeUserCode(userCode), env.REFRESH_TOKEN_PEPPER);
}

function formatUserCodeDisplay(userCode: string): string {
  const normalized = normalizeUserCode(userCode);
  if (normalized.length !== 8) return normalized;
  return `${normalized.slice(0, 4)}-${normalized.slice(4)}`;
}

export async function startDeviceLogin(input: {
  deviceName?: string;
}): Promise<DeviceStartResponse> {
  const deviceCode = generateOpaqueToken(32);
  const userCode = generateUserCode();
  const userCodeDisplay = formatUserCodeDisplay(userCode);
  const expiresIn = env.DEVICE_LOGIN_TTL_SECONDS;
  const expiresAt = new Date(Date.now() + expiresIn * 1000);

  await prisma.deviceLoginSession.create({
    data: {
      deviceCodeHash: hashDeviceCode(deviceCode),
      userCodeHash: hashUserCode(userCode),
      userCodeDisplay,
      deviceName: input.deviceName ?? null,
      status: "pending",
      expiresAt,
    },
  });

  const verificationUrl = `${env.PUBLIC_WEB_URL}/account/link-device`;

  await writeAuditLog({
    action: "device_login.start",
    metadata: { deviceName: input.deviceName ?? null },
  });

  return {
    deviceCode,
    userCode: userCodeDisplay,
    verificationUrl,
    expiresIn,
    interval: env.DEVICE_POLL_INTERVAL_SECONDS,
  };
}

export async function getPendingSessionByDeviceCode(deviceCode: string) {
  const session = await prisma.deviceLoginSession.findUnique({
    where: { deviceCodeHash: hashDeviceCode(deviceCode) },
  });
  if (!session) {
    throw new ApiError(
      ErrorCodes.DEVICE_CODE_INVALID,
      "Unknown device code",
      404,
    );
  }
  if (session.expiresAt.getTime() < Date.now() && session.status === "pending") {
    await prisma.deviceLoginSession.update({
      where: { id: session.id },
      data: { status: "expired" },
    });
    throw new ApiError(
      ErrorCodes.DEVICE_CODE_EXPIRED,
      "Device code expired",
      410,
    );
  }
  return session;
}

export async function approveDeviceLogin(input: {
  deviceCode: string;
  userId: string;
}): Promise<void> {
  const session = await getPendingSessionByDeviceCode(input.deviceCode);
  if (session.status !== "pending") {
    throw new ApiError(
      ErrorCodes.DEVICE_CODE_INVALID,
      `Device login is ${session.status}`,
      400,
    );
  }

  await prisma.deviceLoginSession.update({
    where: { id: session.id },
    data: {
      status: "approved",
      approvedUserId: input.userId,
      approvedAt: new Date(),
    },
  });

  await writeAuditLog({
    userId: input.userId,
    action: "device_login.approved",
    metadata: { sessionId: session.id },
  });
}

/**
 * Approve a pending desktop device login using the 8-character user code.
 * Requires an already-authenticated browser session (caller passes userId).
 */
export async function approveDeviceLoginByUserCode(input: {
  userCode: string;
  userId: string;
}): Promise<{ ok: true; deviceName: string | null }> {
  const normalized = normalizeUserCode(input.userCode);
  if (normalized.length !== 8) {
    throw new ApiError(
      ErrorCodes.VALIDATION_ERROR,
      "Enter the 8-character code shown in the desktop app",
      400,
    );
  }

  const session = await prisma.deviceLoginSession.findUnique({
    where: { userCodeHash: hashUserCode(normalized) },
  });

  if (!session) {
    throw new ApiError(
      ErrorCodes.DEVICE_CODE_INVALID,
      "Invalid device code. Check the code in NELA Desktop and try again.",
      404,
    );
  }

  if (session.expiresAt.getTime() < Date.now()) {
    if (session.status === "pending") {
      await prisma.deviceLoginSession.update({
        where: { id: session.id },
        data: { status: "expired" },
      });
    }
    throw new ApiError(
      ErrorCodes.DEVICE_CODE_EXPIRED,
      "This device code has expired. Start a new sign-in from the desktop app.",
      410,
    );
  }

  if (session.status !== "pending") {
    throw new ApiError(
      ErrorCodes.DEVICE_CODE_INVALID,
      `This device code is already ${session.status}`,
      400,
    );
  }

  await prisma.deviceLoginSession.update({
    where: { id: session.id },
    data: {
      status: "approved",
      approvedUserId: input.userId,
      approvedAt: new Date(),
    },
  });

  await writeAuditLog({
    userId: input.userId,
    action: "device_login.approved_by_user_code",
    metadata: {
      sessionId: session.id,
      deviceName: session.deviceName,
    },
  });

  return { ok: true, deviceName: session.deviceName };
}

export async function pollDeviceLogin(
  deviceCode: string,
): Promise<DevicePollResponse> {
  const session = await prisma.deviceLoginSession.findUnique({
    where: { deviceCodeHash: hashDeviceCode(deviceCode) },
  });

  if (!session) {
    throw new ApiError(
      ErrorCodes.DEVICE_CODE_INVALID,
      "Unknown device code",
      404,
    );
  }

  if (session.status === "pending") {
    if (session.expiresAt.getTime() < Date.now()) {
      await prisma.deviceLoginSession.update({
        where: { id: session.id },
        data: { status: "expired" },
      });
      return { status: "expired" };
    }
    return { status: "pending" };
  }

  if (session.status === "denied") {
    return { status: "denied" };
  }

  if (session.status === "expired") {
    return { status: "expired" };
  }

  if (session.status !== "approved" || !session.approvedUserId) {
    throw new ApiError(
      ErrorCodes.DEVICE_CODE_INVALID,
      "Device login is not approved",
      400,
    );
  }

  // Atomically claim the approved session so concurrent polls can't double-issue.
  const claimed = await prisma.deviceLoginSession.updateMany({
    where: { id: session.id, status: "approved" },
    data: { status: "expired" },
  });
  if (claimed.count !== 1) {
    return { status: "expired" };
  }

  const user = await prisma.user.findUnique({
    where: { id: session.approvedUserId },
  });
  if (!user) {
    throw new ApiError(ErrorCodes.NOT_FOUND, "Approved user not found", 404);
  }

  const device = await createDeviceForUser({
    userId: user.id,
    deviceName: session.deviceName,
  });

  const tokens = await issueTokenPair({
    userId: user.id,
    deviceId: device.id,
    email: user.email,
  });

  await writeAuditLog({
    userId: user.id,
    action: "device_login.polled_approved",
    metadata: { deviceId: device.id },
  });

  return {
    status: "approved",
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
    expiresIn: tokens.expiresIn,
    profile: tokens.profile,
  };
}

/** Issue tokens for an already-approved device session (used by web OAuth callback). */
export async function issueTokensForApprovedDevice(
  deviceCode: string,
): Promise<{
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  profile: import("@nela/shared").UserProfileDto;
} | null> {
  const result = await pollDeviceLogin(deviceCode);
  if (result.status !== "approved") return null;
  return {
    accessToken: result.accessToken,
    refreshToken: result.refreshToken,
    expiresIn: result.expiresIn,
    profile: result.profile,
  };
}
