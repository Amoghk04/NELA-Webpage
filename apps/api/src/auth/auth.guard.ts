import type { FastifyRequest } from "fastify";
import { ApiError, ErrorCodes } from "@nela/shared";
import { prisma } from "../db/prisma.js";
import { verifyAccessToken } from "./token.service.js";
import { touchDevice } from "./session.service.js";

export type AuthContext = {
  userId: string;
  deviceId: string;
  email: string;
};

export async function requireAuth(
  request: FastifyRequest,
): Promise<AuthContext> {
  const header = request.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    throw new ApiError(ErrorCodes.UNAUTHORIZED, "Missing bearer token", 401);
  }
  const token = header.slice("Bearer ".length).trim();
  const payload = await verifyAccessToken(token);

  const device = await prisma.device.findUnique({
    where: { id: payload.deviceId },
  });
  if (!device || device.userId !== payload.sub || device.revokedAt) {
    throw new ApiError(ErrorCodes.UNAUTHORIZED, "Device session revoked", 401);
  }

  await touchDevice(device.id);

  return {
    userId: payload.sub,
    deviceId: payload.deviceId,
    email: payload.email,
  };
}
