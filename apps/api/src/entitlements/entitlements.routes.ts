import type { FastifyInstance } from "fastify";
import { requireAuth } from "../auth/auth.guard.js";
import { getEntitlementResponse } from "./entitlements.service.js";

export async function entitlementsRoutes(
  app: FastifyInstance,
): Promise<void> {
  app.get("/v1/me/entitlement", async (request) => {
    const auth = await requireAuth(request);
    return getEntitlementResponse(auth.userId);
  });
}
