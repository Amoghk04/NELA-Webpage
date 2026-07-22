import {
  ApiError,
  ErrorCodes,
  type UserProfileDto,
} from "@nela/shared";
import { env } from "../config.js";
import { prisma } from "../db/prisma.js";
import {
  generateOpaqueToken,
  hashWithPepper,
} from "../security/crypto.js";
import { toUserProfileDto } from "../users/users.service.js";
import { SignJWT, jwtVerify } from "jose";

export type AccessTokenPayload = {
  sub: string;
  deviceId: string;
  email: string;
};

const accessSecret = new TextEncoder().encode(env.JWT_ACCESS_SECRET);

/** Maps rotated-away refresh token hashes → deviceId for reuse detection. */
const rotatedRefreshHashes = new Map<
  string,
  { deviceId: string; expiresAt: number }
>();

function rememberRotatedHash(hash: string, deviceId: string): void {
  const ttlMs = 7 * 24 * 60 * 60 * 1000;
  rotatedRefreshHashes.set(hash, {
    deviceId,
    expiresAt: Date.now() + ttlMs,
  });
  // Opportunistic cleanup
  if (rotatedRefreshHashes.size > 10_000) {
    const now = Date.now();
    for (const [key, value] of rotatedRefreshHashes) {
      if (value.expiresAt <= now) rotatedRefreshHashes.delete(key);
    }
  }
}

export async function signAccessToken(
  payload: AccessTokenPayload,
): Promise<{ token: string; expiresIn: number }> {
  const expiresIn = env.ACCESS_TOKEN_TTL_SECONDS;
  const token = await new SignJWT({
    email: payload.email,
    deviceId: payload.deviceId,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime(`${expiresIn}s`)
    .sign(accessSecret);

  return { token, expiresIn };
}

export async function verifyAccessToken(
  token: string,
): Promise<AccessTokenPayload> {
  try {
    const { payload } = await jwtVerify(token, accessSecret);
    if (!payload.sub || typeof payload.deviceId !== "string") {
      throw new Error("invalid");
    }
    return {
      sub: payload.sub,
      deviceId: payload.deviceId,
      email: typeof payload.email === "string" ? payload.email : "",
    };
  } catch {
    throw new ApiError(
      ErrorCodes.UNAUTHORIZED,
      "Invalid or expired access token",
      401,
    );
  }
}

export function hashRefreshToken(refreshToken: string): string {
  return hashWithPepper(refreshToken, env.REFRESH_TOKEN_PEPPER);
}

export async function issueTokenPair(input: {
  userId: string;
  deviceId: string;
  email: string;
}): Promise<{
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  profile: UserProfileDto;
}> {
  const refreshToken = generateOpaqueToken(48);
  const refreshTokenHash = hashRefreshToken(refreshToken);

  await prisma.device.update({
    where: { id: input.deviceId },
    data: {
      refreshTokenHash,
      lastSeenAt: new Date(),
      revokedAt: null,
    },
  });

  const { token: accessToken, expiresIn } = await signAccessToken({
    sub: input.userId,
    deviceId: input.deviceId,
    email: input.email,
  });

  const profile = await toUserProfileDto(input.userId);

  return { accessToken, refreshToken, expiresIn, profile };
}

export async function rotateRefreshToken(refreshToken: string): Promise<{
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  profile: UserProfileDto;
}> {
  const refreshTokenHash = hashRefreshToken(refreshToken);

  const reused = rotatedRefreshHashes.get(refreshTokenHash);
  if (reused && reused.expiresAt > Date.now()) {
    await prisma.device.update({
      where: { id: reused.deviceId },
      data: { revokedAt: new Date(), refreshTokenHash: null },
    });
    rotatedRefreshHashes.delete(refreshTokenHash);
    throw new ApiError(
      ErrorCodes.REFRESH_TOKEN_REUSED,
      "Refresh token reuse detected; device revoked",
      401,
    );
  }

  const device = await prisma.device.findFirst({
    where: { refreshTokenHash },
    include: { user: true },
  });

  if (!device) {
    throw new ApiError(
      ErrorCodes.REFRESH_TOKEN_INVALID,
      "Invalid refresh token",
      401,
    );
  }

  if (device.revokedAt) {
    throw new ApiError(
      ErrorCodes.REFRESH_TOKEN_REUSED,
      "Refresh token reuse detected; device revoked",
      401,
    );
  }

  rememberRotatedHash(refreshTokenHash, device.id);

  await prisma.device.update({
    where: { id: device.id },
    data: { refreshTokenHash: null },
  });

  return issueTokenPair({
    userId: device.userId,
    deviceId: device.id,
    email: device.user.email,
  });
}

export async function revokeByRefreshToken(
  refreshToken: string,
): Promise<void> {
  const refreshTokenHash = hashRefreshToken(refreshToken);
  await prisma.device.updateMany({
    where: { refreshTokenHash },
    data: {
      revokedAt: new Date(),
      refreshTokenHash: null,
    },
  });
}

export async function revokeDevice(deviceId: string): Promise<void> {
  await prisma.device.update({
    where: { id: deviceId },
    data: {
      revokedAt: new Date(),
      refreshTokenHash: null,
    },
  });
}
