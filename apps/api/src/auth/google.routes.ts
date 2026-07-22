import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { ApiError, ErrorCodes } from "@nela/shared";
import { env } from "../config.js";
import { buildGoogleAuthUrl, loginWithGoogleCode } from "./google.service.js";
import { approveDeviceLogin } from "./device-login.service.js";

const stateSchema = z.object({
  deviceCode: z.string().min(8),
  returnTo: z.string().optional(),
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

export async function googleAuthRoutes(app: FastifyInstance): Promise<void> {
  app.get("/v1/auth/google/start", async (request, reply) => {
    const query = z
      .object({
        deviceCode: z.string().min(8),
        returnTo: z.string().optional(),
      })
      .parse(request.query);

    const state = encodeState({
      deviceCode: query.deviceCode,
      returnTo: query.returnTo,
    });
    const url = buildGoogleAuthUrl(state);
    return reply.redirect(url);
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

    // Desktop polls /v1/auth/device/poll itself. Only the web client should
    // poll from this page when it started the login (sessionStorage flag).
    const web = new URL("/login", env.PUBLIC_WEB_URL);
    web.searchParams.set("deviceCode", state.deviceCode);
    web.searchParams.set("signedIn", "1");
    if (state.returnTo) {
      web.searchParams.set("returnTo", state.returnTo);
    }
    return reply.redirect(web.toString());
  });
}
