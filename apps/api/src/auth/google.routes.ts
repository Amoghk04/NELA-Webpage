import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { ApiError, ErrorCodes } from "@nela/shared";
import { env } from "../config.js";
import { buildGoogleAuthUrl, loginWithGoogleCode } from "./google.service.js";
import {
  approveDeviceLogin,
  issueTokensForApprovedDevice,
  startDeviceLogin,
} from "./device-login.service.js";
import { createWebExchange } from "./web-exchange.js";

const stateSchema = z.object({
  deviceCode: z.string().min(8),
  returnTo: z.string().optional(),
  /** web = browser login; device = approving a desktop device code */
  source: z.enum(["web", "device"]).default("device"),
});

function encodeState(payload: z.infer<typeof stateSchema>): string {
  return Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
}

function decodeState(state: string): z.infer<typeof stateSchema> {
  try {
    const json = Buffer.from(state, "base64url").toString("utf8");
    return stateSchema.parse(JSON.parse(json));
  } catch {
    throw new ApiError(ErrorCodes.VALIDATION_ERROR, "Invalid OAuth state", 400);
  }
}

function safeReturnTo(returnTo: string | undefined): string | undefined {
  if (!returnTo) return undefined;
  return returnTo.startsWith("/") ? returnTo : undefined;
}

export async function googleAuthRoutes(app: FastifyInstance): Promise<void> {
  /**
   * Browser-only Google sign-in. Creates a short-lived device session and
   * redirects straight to Google — no desktop app required.
   */
  app.get("/v1/auth/google/web/start", async (request, reply) => {
    const query = z
      .object({
        returnTo: z.string().optional(),
      })
      .parse(request.query);

    const started = await startDeviceLogin({ deviceName: "NELA Web" });
    const state = encodeState({
      deviceCode: started.deviceCode,
      returnTo: safeReturnTo(query.returnTo),
      source: "web",
    });
    return reply.redirect(buildGoogleAuthUrl(state));
  });

  /** Desktop / existing device-code approval flow. */
  app.get("/v1/auth/google/start", async (request, reply) => {
    const query = z
      .object({
        deviceCode: z.string().min(8),
        returnTo: z.string().optional(),
        source: z.enum(["web", "device"]).optional(),
      })
      .parse(request.query);

    const state = encodeState({
      deviceCode: query.deviceCode,
      returnTo: safeReturnTo(query.returnTo),
      source: query.source ?? "device",
    });
    return reply.redirect(buildGoogleAuthUrl(state));
  });

  app.get("/v1/auth/google/callback", async (request, reply) => {
    const query = z
      .object({
        code: z.string().optional(),
        state: z.string().optional(),
        error: z.string().optional(),
      })
      .parse(request.query);

    if (query.error || !query.code || !query.state) {
      const web = new URL("/login", env.PUBLIC_WEB_URL);
      web.searchParams.set("error", query.error ?? "oauth_failed");
      return reply.redirect(web.toString());
    }

    const state = decodeState(query.state);
    const user = await loginWithGoogleCode(query.code);
    await approveDeviceLogin({
      deviceCode: state.deviceCode,
      userId: user.id,
    });

    const web = new URL("/login", env.PUBLIC_WEB_URL);

    // Browser login: issue tokens immediately and hand back a one-time exchange code
    // so React remounts cannot lose a one-shot device poll.
    if (state.source === "web") {
      const tokens = await issueTokensForApprovedDevice(state.deviceCode);
      if (!tokens) {
        web.searchParams.set("error", "login_failed");
        return reply.redirect(web.toString());
      }
      const exchange = createWebExchange(tokens);
      web.searchParams.set("exchange", exchange);
      web.searchParams.set("source", "web");
      if (state.returnTo) web.searchParams.set("returnTo", state.returnTo);
      return reply.redirect(web.toString());
    }

    web.searchParams.set("deviceCode", state.deviceCode);
    web.searchParams.set("signedIn", "1");
    web.searchParams.set("source", state.source);
    if (state.returnTo) {
      web.searchParams.set("returnTo", state.returnTo);
    }
    return reply.redirect(web.toString());
  });
}
