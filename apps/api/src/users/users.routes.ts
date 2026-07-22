import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { toUserProfileDto, updateUserProfile } from "./users.service.js";
import { requireAuth } from "../auth/auth.guard.js";

export async function usersRoutes(app: FastifyInstance): Promise<void> {
  app.get("/v1/me", async (request) => {
    const auth = await requireAuth(request);
    return toUserProfileDto(auth.userId);
  });

  app.patch("/v1/me", async (request) => {
    const auth = await requireAuth(request);
    const body = z
      .object({
        name: z.string().min(1).max(120).optional(),
        avatarUrl: z.string().max(2_000_000).nullable().optional(),
      })
      .refine((value) => value.name !== undefined || value.avatarUrl !== undefined, {
        message: "Provide name and/or avatarUrl",
      })
      .parse(request.body ?? {});

    return updateUserProfile(auth.userId, body);
  });
}
