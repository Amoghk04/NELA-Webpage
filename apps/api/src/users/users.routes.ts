import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";
import { toUserProfileDto, updateUserProfile } from "./users.service.js";
import { requireAuth } from "../auth/auth.guard.js";
import { bearerSecurity } from "../swagger/security.js";

const patchMeBody = z
  .object({
    name: z.string().min(1).max(120).optional(),
    avatarUrl: z.string().max(2_000_000).nullable().optional(),
  })
  .refine((value) => value.name !== undefined || value.avatarUrl !== undefined, {
    message: "Provide name and/or avatarUrl",
  });

export async function usersRoutes(app: FastifyInstance): Promise<void> {
  const r = app.withTypeProvider<ZodTypeProvider>();

  r.get(
    "/v1/me",
    {
      schema: {
        tags: ["Users"],
        summary: "Current user profile",
        security: [...bearerSecurity],
      },
    },
    async (request) => {
      const auth = await requireAuth(request);
      return toUserProfileDto(auth.userId);
    },
  );

  r.patch(
    "/v1/me",
    {
      schema: {
        tags: ["Users"],
        summary: "Update name and/or avatar",
        security: [...bearerSecurity],
        body: patchMeBody,
      },
    },
    async (request) => {
      const auth = await requireAuth(request);
      return updateUserProfile(auth.userId, request.body);
    },
  );
}
