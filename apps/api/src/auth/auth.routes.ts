import type { FastifyInstance } from "fastify";
import { z } from "zod";
import {
  pollDeviceLogin,
  startDeviceLogin,
} from "./device-login.service.js";
import {
  revokeByRefreshToken,
  rotateRefreshToken,
} from "./token.service.js";
import { enforceRateLimit } from "../security/rate-limit.js";
import { googleAuthRoutes } from "./google.routes.js";

export async function authRoutes(app: FastifyInstance): Promise<void> {
  app.post("/v1/auth/device/start", async (request) => {
    await enforceRateLimit({
      key: `device-start:${request.ip}`,
      limit: 30,
      windowMs: 60_000,
    });
    const body = z
      .object({ deviceName: z.string().max(120).optional() })
      .parse(request.body ?? {});
    return startDeviceLogin({ deviceName: body.deviceName });
  });

  app.post("/v1/auth/device/poll", async (request) => {
    await enforceRateLimit({
      key: `device-poll:${request.ip}`,
      limit: 120,
      windowMs: 60_000,
    });
    const body = z
      .object({ deviceCode: z.string().min(8) })
      .parse(request.body ?? {});
    return pollDeviceLogin(body.deviceCode);
  });

  app.post("/v1/auth/refresh", async (request) => {
    const body = z
      .object({ refreshToken: z.string().min(16) })
      .parse(request.body ?? {});
    return rotateRefreshToken(body.refreshToken);
  });

  app.post("/v1/auth/logout", async (request) => {
    const body = z
      .object({ refreshToken: z.string().min(16).optional() })
      .parse(request.body ?? {});
    if (body.refreshToken) {
      await revokeByRefreshToken(body.refreshToken);
    }
    return { ok: true };
  });

  await app.register(googleAuthRoutes);
}
