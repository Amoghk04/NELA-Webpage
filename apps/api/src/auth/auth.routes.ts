import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
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
import { bearerSecurity } from "../swagger/security.js";

const deviceStartBody = z.object({
  deviceName: z.string().max(120).optional(),
});

const devicePollBody = z.object({
  deviceCode: z.string().min(8),
});

const deviceApproveBody = z.object({
  userCode: z.string().min(8).max(16),
});

const emailRegisterBody = z.object({
  email: z.string().email().max(320),
  password: z.string().min(8).max(128),
  name: z.string().min(1).max(120).optional(),
  deviceName: z.string().max(120).optional(),
});

const emailLoginBody = z.object({
  email: z.string().email().max(320),
  password: z.string().min(8).max(128),
  deviceName: z.string().max(120).optional(),
});

const webExchangeBody = z.object({
  code: z.string().min(16),
});

const refreshBody = z.object({
  refreshToken: z.string().min(16),
});

const logoutBody = z.object({
  refreshToken: z.string().min(16).optional(),
});

export async function authRoutes(app: FastifyInstance): Promise<void> {
  const r = app.withTypeProvider<ZodTypeProvider>();

  r.post(
    "/v1/auth/device/start",
    {
      schema: {
        tags: ["Auth"],
        summary: "Start desktop device login",
        security: [],
        body: deviceStartBody,
      },
    },
    async (request) => {
      await enforceRateLimit({
        key: `device-start:${request.ip}`,
        limit: 30,
        windowMs: 60_000,
      });
      return startDeviceLogin({ deviceName: request.body.deviceName });
    },
  );

  r.post(
    "/v1/auth/device/poll",
    {
      schema: {
        tags: ["Auth"],
        summary: "Poll device login status",
        security: [],
        body: devicePollBody,
      },
    },
    async (request) => {
      await enforceRateLimit({
        key: `device-poll:${request.ip}`,
        limit: 120,
        windowMs: 60_000,
      });
      return pollDeviceLogin(request.body.deviceCode);
    },
  );

  /** Authenticated browser user links a desktop device via the 8-char code. */
  r.post(
    "/v1/auth/device/approve",
    {
      schema: {
        tags: ["Auth"],
        summary: "Approve a device code (browser, authenticated)",
        security: [...bearerSecurity],
        body: deviceApproveBody,
      },
    },
    async (request) => {
      const auth = await requireAuth(request);
      await enforceRateLimit({
        key: `device-approve:${auth.userId}`,
        limit: 20,
        windowMs: 60_000,
      });
      return approveDeviceLoginByUserCode({
        userCode: request.body.userCode,
        userId: auth.userId,
      });
    },
  );

  r.post(
    "/v1/auth/email/register",
    {
      schema: {
        tags: ["Auth"],
        summary: "Register with email + password",
        security: [],
        body: emailRegisterBody,
      },
    },
    async (request) => {
      await enforceRateLimit({
        key: `email-register:${request.ip}`,
        limit: 10,
        windowMs: 60_000,
      });
      return registerWithEmail(request.body);
    },
  );

  r.post(
    "/v1/auth/email/login",
    {
      schema: {
        tags: ["Auth"],
        summary: "Login with email + password",
        security: [],
        body: emailLoginBody,
      },
    },
    async (request) => {
      await enforceRateLimit({
        key: `email-login:${request.ip}`,
        limit: 20,
        windowMs: 60_000,
      });
      return loginWithEmail(request.body);
    },
  );

  r.post(
    "/v1/auth/web/exchange",
    {
      schema: {
        tags: ["Auth"],
        summary: "Exchange one-time web OAuth code for tokens",
        security: [],
        body: webExchangeBody,
      },
    },
    async (request) => {
      await enforceRateLimit({
        key: `web-exchange:${request.ip}`,
        limit: 30,
        windowMs: 60_000,
      });
      return consumeWebExchange(request.body.code);
    },
  );

  r.post(
    "/v1/auth/refresh",
    {
      schema: {
        tags: ["Auth"],
        summary: "Rotate refresh token",
        security: [],
        body: refreshBody,
      },
    },
    async (request) => rotateRefreshToken(request.body.refreshToken),
  );

  r.post(
    "/v1/auth/logout",
    {
      schema: {
        tags: ["Auth"],
        summary: "Revoke refresh token (optional)",
        security: [],
        body: logoutBody,
      },
    },
    async (request) => {
      if (request.body.refreshToken) {
        await revokeByRefreshToken(request.body.refreshToken);
      }
      return { ok: true };
    },
  );

  await app.register(googleAuthRoutes);
}
