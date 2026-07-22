import {
  ApiError,
  ErrorCodes,
  PLAN_LIMITS,
  type CloudPlan,
  type EntitlementStatus,
  type UserProfileDto,
} from "@nela/shared";
import { prisma } from "../db/prisma.js";

export async function ensureFreeEntitlement(userId: string) {
  return prisma.entitlement.upsert({
    where: { userId },
    create: {
      userId,
      cloudEnabled: PLAN_LIMITS.free.cloudEnabled,
      plan: "free",
      status: PLAN_LIMITS.free.defaultStatus,
      includedUsdMonthly: PLAN_LIMITS.free.includedUsdMonthly,
      maxInputTokens: PLAN_LIMITS.free.maxInputTokens,
      maxOutputTokens: PLAN_LIMITS.free.maxOutputTokens,
      requestsPerMinute: PLAN_LIMITS.free.requestsPerMinute,
    },
    update: {},
  });
}

export async function upsertGoogleUser(input: {
  googleSub: string;
  email: string;
  name?: string | null;
  avatarUrl?: string | null;
}) {
  const existingOauth = await prisma.oAuthAccount.findUnique({
    where: {
      provider_providerSubject: {
        provider: "google",
        providerSubject: input.googleSub,
      },
    },
    include: { user: true },
  });

  if (existingOauth) {
    const user = await prisma.user.update({
      where: { id: existingOauth.userId },
      data: {
        email: input.email,
        name: input.name ?? existingOauth.user.name,
        avatarUrl: input.avatarUrl ?? existingOauth.user.avatarUrl,
      },
    });
    await ensureFreeEntitlement(user.id);
    return user;
  }

  const existingByEmail = await prisma.user.findUnique({
    where: { email: input.email },
  });

  if (existingByEmail) {
    await prisma.oAuthAccount.create({
      data: {
        userId: existingByEmail.id,
        provider: "google",
        providerSubject: input.googleSub,
        email: input.email,
      },
    });
    const user = await prisma.user.update({
      where: { id: existingByEmail.id },
      data: {
        name: input.name ?? existingByEmail.name,
        avatarUrl: input.avatarUrl ?? existingByEmail.avatarUrl,
      },
    });
    await ensureFreeEntitlement(user.id);
    return user;
  }

  const user = await prisma.user.create({
    data: {
      email: input.email,
      name: input.name ?? null,
      avatarUrl: input.avatarUrl ?? null,
      oauthAccounts: {
        create: {
          provider: "google",
          providerSubject: input.googleSub,
          email: input.email,
        },
      },
      entitlement: {
        create: {
          cloudEnabled: PLAN_LIMITS.free.cloudEnabled,
          plan: "free",
          status: PLAN_LIMITS.free.defaultStatus,
          includedUsdMonthly: PLAN_LIMITS.free.includedUsdMonthly,
          maxInputTokens: PLAN_LIMITS.free.maxInputTokens,
          maxOutputTokens: PLAN_LIMITS.free.maxOutputTokens,
          requestsPerMinute: PLAN_LIMITS.free.requestsPerMinute,
        },
      },
    },
  });

  return user;
}

export async function getUserOrThrow(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { entitlement: true },
  });
  if (!user) {
    throw new ApiError(ErrorCodes.NOT_FOUND, "User not found", 404);
  }
  return user;
}

export async function toUserProfileDto(userId: string): Promise<UserProfileDto> {
  const user = await getUserOrThrow(userId);
  const plan = (user.entitlement?.plan ?? "free") as CloudPlan;
  const entitlementStatus = (user.entitlement?.status ??
    "inactive") as EntitlementStatus;

  const googleOauth = await prisma.oAuthAccount.findFirst({
    where: { userId, provider: "google" },
    select: { id: true },
  });

  return {
    id: user.id,
    name: user.name ?? user.email,
    email: user.email,
    avatarUrl: user.avatarUrl,
    authProvider: googleOauth ? "google" : "email",
    plan,
    entitlementStatus,
    updatedAt: user.updatedAt.toISOString(),
  };
}

export async function updateUserProfile(
  userId: string,
  input: { name?: string; avatarUrl?: string | null },
): Promise<UserProfileDto> {
  const data: { name?: string; avatarUrl?: string | null } = {};
  if (typeof input.name === "string") {
    const name = input.name.trim();
    if (!name) {
      throw new ApiError(ErrorCodes.VALIDATION_ERROR, "Name cannot be empty", 400);
    }
    if (name.length > 120) {
      throw new ApiError(ErrorCodes.VALIDATION_ERROR, "Name is too long", 400);
    }
    data.name = name;
  }
  if (input.avatarUrl !== undefined) {
    if (input.avatarUrl !== null && input.avatarUrl.length > 2_000_000) {
      throw new ApiError(
        ErrorCodes.VALIDATION_ERROR,
        "Avatar payload is too large",
        400,
      );
    }
    data.avatarUrl = input.avatarUrl;
  }

  await prisma.user.update({
    where: { id: userId },
    data,
  });

  return toUserProfileDto(userId);
}
