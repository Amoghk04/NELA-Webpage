import { ApiError, ErrorCodes } from "@nela/shared";
import { env } from "../config.js";
import { upsertGoogleUser } from "../users/users.service.js";
import { writeAuditLog } from "../security/audit-log.js";

export type GoogleUserInfo = {
  sub: string;
  email: string;
  name?: string;
  picture?: string;
  email_verified?: boolean;
};

export function isGoogleConfigured(): boolean {
  return Boolean(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET);
}

export function buildGoogleAuthUrl(state: string): string {
  if (!isGoogleConfigured()) {
    throw new ApiError(
      ErrorCodes.GOOGLE_OAUTH_NOT_CONFIGURED,
      "Google OAuth is not configured. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET.",
      503,
    );
  }

  const params = new URLSearchParams({
    client_id: env.GOOGLE_CLIENT_ID!,
    redirect_uri: env.GOOGLE_REDIRECT_URI,
    response_type: "code",
    scope: "openid email profile",
    access_type: "offline",
    include_granted_scopes: "true",
    prompt: "select_account",
    state,
  });

  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

export async function exchangeGoogleCode(code: string): Promise<GoogleUserInfo> {
  if (!isGoogleConfigured()) {
    throw new ApiError(
      ErrorCodes.GOOGLE_OAUTH_NOT_CONFIGURED,
      "Google OAuth is not configured",
      503,
    );
  }

  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: env.GOOGLE_CLIENT_ID!,
      client_secret: env.GOOGLE_CLIENT_SECRET!,
      redirect_uri: env.GOOGLE_REDIRECT_URI,
      grant_type: "authorization_code",
    }),
  });

  if (!tokenRes.ok) {
    const text = await tokenRes.text();
    throw new ApiError(
      ErrorCodes.GOOGLE_OAUTH_FAILED,
      "Google token exchange failed",
      502,
      { body: text.slice(0, 500) },
    );
  }

  const tokenJson = (await tokenRes.json()) as { access_token?: string };
  if (!tokenJson.access_token) {
    throw new ApiError(
      ErrorCodes.GOOGLE_OAUTH_FAILED,
      "Google token response missing access_token",
      502,
    );
  }

  const userRes = await fetch("https://openidconnect.googleapis.com/v1/userinfo", {
    headers: { Authorization: `Bearer ${tokenJson.access_token}` },
  });

  if (!userRes.ok) {
    throw new ApiError(
      ErrorCodes.GOOGLE_OAUTH_FAILED,
      "Failed to fetch Google userinfo",
      502,
    );
  }

  const info = (await userRes.json()) as GoogleUserInfo;
  if (!info.sub || !info.email) {
    throw new ApiError(
      ErrorCodes.GOOGLE_OAUTH_FAILED,
      "Google userinfo missing sub/email",
      502,
    );
  }

  return info;
}

export async function loginWithGoogleCode(code: string) {
  const info = await exchangeGoogleCode(code);
  const user = await upsertGoogleUser({
    googleSub: info.sub,
    email: info.email,
    name: info.name ?? null,
    avatarUrl: info.picture ?? null,
  });

  await writeAuditLog({
    userId: user.id,
    action: "auth.google.login",
    metadata: { email: user.email },
  });

  return user;
}
