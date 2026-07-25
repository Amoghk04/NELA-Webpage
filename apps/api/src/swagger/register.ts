import type { FastifyInstance } from "fastify";
import swagger from "@fastify/swagger";
import swaggerUi from "@fastify/swagger-ui";
import { env } from "../config.js";
import { buildOpenApiDocument } from "./openapi-document.js";

/**
 * Registers OpenAPI + Swagger UI at `/docs` (raw JSON via `/docs/json`).
 * Disabled in production unless SWAGGER_ENABLED=true.
 */
export function isSwaggerEnabled(): boolean {
  if (env.SWAGGER_ENABLED === true) return true;
  if (env.SWAGGER_ENABLED === false) return false;
  return env.NODE_ENV !== "production";
}

export async function registerSwagger(app: FastifyInstance): Promise<void> {
  if (!isSwaggerEnabled()) {
    app.log.info("Swagger UI disabled (set SWAGGER_ENABLED=true to enable)");
    return;
  }

  await app.register(swagger, {
    mode: "static",
    specification: {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- OpenAPI 3.1 doc vs plugin's 3.0 Document type
      document: buildOpenApiDocument() as any,
    },
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
