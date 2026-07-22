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

function hashUserCode(userCode: string): string {
  return hashWithPepper(userCode.toUpperCase(), env.REFRESH_TOKEN_PEPPER);
}

export async function startDeviceLogin(input: {
  deviceName?: string;
}): Promise<DeviceStartResponse> {
  const deviceCode = generateOpaqueToken(32);
  const userCode = generateUserCode();
  const expiresIn = env.DEVICE_LOGIN_TTL_SECONDS;
  const expiresAt = new Date(Date.now() + expiresIn * 1000);

  await prisma.deviceLoginSession.create({
    data: {
      deviceCodeHash: hashDeviceCode(deviceCode),
      userCodeHash: hashUserCode(userCode),
      userCodeDisplay: userCode,
      deviceName: input.deviceName ?? null,
      status: "pending",
      expiresAt,
    },
  });

  const verificationUrl = `${env.PUBLIC_WEB_URL}/login?deviceCode=${encodeURIComponent(deviceCode)}`;

  await writeAuditLog({
    action: "device_login.start",
    metadata: { deviceName: input.deviceName ?? null },
  });

  return {
    deviceCode,
    userCode,
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

  // One-time consumption: mark as consumed by flipping to denied after issue,
  // or delete. We expire the session after token issuance.
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

  await prisma.deviceLoginSession.update({
    where: { id: session.id },
    data: { status: "expired" },
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
