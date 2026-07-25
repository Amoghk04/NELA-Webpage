import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { requireAuth } from "../auth/auth.guard.js";
import { getEntitlementResponse } from "./entitlements.service.js";
import { bearerSecurity } from "../swagger/security.js";

export async function entitlementsRoutes(
  app: FastifyInstance,
): Promise<void> {
  const r = app.withTypeProvider<ZodTypeProvider>();

  r.get(
    "/v1/me/entitlement",
    {
      schema: {
        tags: ["Entitlements"],
        summary: "Cloud plan, quotas, and feature flags",
        security: [...bearerSecurity],
      },
    },
    async (request) => {
      const auth = await requireAuth(request);
      return getEntitlementResponse(auth.userId);
    },
  );
}
