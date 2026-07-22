import type { FastifyInstance } from "fastify";
import { toUserProfileDto } from "./users.service.js";
import { requireAuth } from "../auth/auth.guard.js";

export async function usersRoutes(app: FastifyInstance): Promise<void> {
  app.get("/v1/me", async (request) => {
    const auth = await requireAuth(request);
    return toUserProfileDto(auth.userId);
  });
}
