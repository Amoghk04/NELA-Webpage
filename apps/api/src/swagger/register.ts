import type { FastifyInstance } from "fastify";
import swagger from "@fastify/swagger";
import swaggerUi from "@fastify/swagger-ui";
import {
  jsonSchemaTransform,
  serializerCompiler,
  validatorCompiler,
} from "fastify-type-provider-zod";
import { env } from "../config.js";

/**
 * Registers OpenAPI + Swagger UI at `/docs`.
 * Spec is built dynamically from Fastify route `schema` (Zod via
 * fastify-type-provider-zod) — new endpoints appear automatically.
 *
 * Disabled in production unless SWAGGER_ENABLED=true.
 */
export function isSwaggerEnabled(): boolean {
  if (env.SWAGGER_ENABLED === true) return true;
  if (env.SWAGGER_ENABLED === false) return false;
  return env.NODE_ENV !== "production";
}

/** Zod compilers required whenever routes declare Zod schemas. */
export function setupZodTypeProvider(app: FastifyInstance): void {
  app.setValidatorCompiler(validatorCompiler);
  app.setSerializerCompiler(serializerCompiler);
}

export async function registerSwagger(app: FastifyInstance): Promise<void> {
  if (!isSwaggerEnabled()) {
    app.log.info("Swagger UI disabled (set SWAGGER_ENABLED=true to enable)");
    return;
  }

  await app.register(swagger, {
    openapi: {
      openapi: "3.0.3",
      info: {
        title: "NELA Cloud API",
        description:
          "Backend for NELA desktop and web: auth, entitlements, billing, and OpenRouter-backed cloud inference.\n\n" +
          "Docs are generated from live Fastify routes. Use **Authorize** with a Bearer access token.",
        version: "0.1.0",
      },
      servers: [
        {
          url: env.PUBLIC_API_URL,
          description: "Configured PUBLIC_API_URL",
        },
      ],
      tags: [
        { name: "Health", description: "Liveness" },
        { name: "Auth", description: "Email, device link, Google, sessions" },
        { name: "Users", description: "Profile" },
        { name: "Entitlements", description: "Plan and cloud quotas" },
        { name: "Billing", description: "Razorpay checkout" },
        { name: "Webhooks", description: "Provider callbacks" },
        { name: "Inference", description: "Cloud chat and artifact plans" },
      ],
      components: {
        securitySchemes: {
          bearerAuth: {
            type: "http",
            scheme: "bearer",
            bearerFormat: "JWT",
            description:
              "Access token from /v1/auth/email/login or device poll",
          },
        },
      },
    },
    transform: jsonSchemaTransform,
    // Include routes even if they omit tags (still auto-discovered).
    hideUntagged: false,
  });

  await app.register(swaggerUi, {
    routePrefix: "/docs",
    uiConfig: {
      docExpansion: "list",
      deepLinking: true,
      persistAuthorization: true,
      tryItOutEnabled: true,
    },
    staticCSP: true,
  });

  app.log.info(`Swagger UI available at ${env.PUBLIC_API_URL}/docs`);
}
