import type { FastifyInstance } from "fastify";
import { z } from "zod";
import {
  pollDeviceLogin,
  startDeviceLogin,
  approveDeviceLoginByUserCode,
} from "./device-login.service.js";
import {
  revokeByRefreshToken,
  rotateRefreshToken,
} from "./token.service.js";
import { enforceRateLimit } from "../security/rate-limit.js";
import { googleAuthRoutes } from "./google.routes.js";
import {
  loginWithEmail,
  registerWithEmail,
} from "./email-auth.service.js";
import { consumeWebExchange } from "./web-exchange.js";
import { requireAuth } from "./auth.guard.js";

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

  /** Authenticated browser user links a desktop device via the 8-char code. */
  app.post("/v1/auth/device/approve", async (request) => {
    const auth = await requireAuth(request);
    await enforceRateLimit({
      key: `device-approve:${auth.userId}`,
      limit: 20,
      windowMs: 60_000,
    });
    const body = z
      .object({
        userCode: z.string().min(8).max(16),
      })
      .parse(request.body ?? {});
    return approveDeviceLoginByUserCode({
      userCode: body.userCode,
      userId: auth.userId,
    });
  });

  app.post("/v1/auth/email/register", async (request) => {
    await enforceRateLimit({
      key: `email-register:${request.ip}`,
      limit: 10,
      windowMs: 60_000,
    });
    const body = z
      .object({
        email: z.string().email().max(320),
        password: z.string().min(8).max(128),
        name: z.string().min(1).max(120).optional(),
        deviceName: z.string().max(120).optional(),
      })
      .parse(request.body ?? {});
    return registerWithEmail(body);
  });

  app.post("/v1/auth/email/login", async (request) => {
    await enforceRateLimit({
      key: `email-login:${request.ip}`,
      limit: 20,
      windowMs: 60_000,
    });
    const body = z
      .object({
        email: z.string().email().max(320),
        password: z.string().min(8).max(128),
        deviceName: z.string().max(120).optional(),
      })
      .parse(request.body ?? {});
    return loginWithEmail(body);
  });

  app.post("/v1/auth/web/exchange", async (request) => {
    await enforceRateLimit({
      key: `web-exchange:${request.ip}`,
      limit: 30,
      windowMs: 60_000,
    });
    const body = z
      .object({ code: z.string().min(16) })
      .parse(request.body ?? {});
    return consumeWebExchange(body.code);
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
