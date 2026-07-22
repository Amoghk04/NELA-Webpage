import Fastify from "fastify";
import cors from "@fastify/cors";
import helmet from "@fastify/helmet";
import { ApiError, isApiError } from "@nela/shared";
import { ZodError } from "zod";
import { env } from "./config.js";
import { requestIdHook } from "./security/request-id.js";
import { authRoutes } from "./auth/auth.routes.js";
import { usersRoutes } from "./users/users.routes.js";
import { entitlementsRoutes } from "./entitlements/entitlements.routes.js";
import { billingRoutes } from "./billing/billing.routes.js";
import { razorpayWebhookRoutes } from "./billing/razorpay-webhook.routes.js";
import { inferenceRoutes } from "./inference/inference.routes.js";
import { prisma } from "./db/prisma.js";

async function buildServer() {
  const app = Fastify({
    logger: {
      level: env.LOG_LEVEL,
    },
    // Needed for Razorpay signature verification
    bodyLimit: 2 * 1024 * 1024,
  });

  // Preserve raw body for webhook signature checks
  app.addContentTypeParser(
    "application/json",
    { parseAs: "buffer" },
    (req, body, done) => {
      const buf = body as Buffer;
      (req as { rawBody?: Buffer }).rawBody = buf;
      try {
        const json = buf.length ? JSON.parse(buf.toString("utf8")) : {};
        done(null, json);
      } catch (err) {
        done(err as Error, undefined);
      }
    },
  );

  await app.register(helmet, {
    contentSecurityPolicy: false,
  });
  await app.register(cors, {
    origin: [env.PUBLIC_WEB_URL, env.PUBLIC_API_URL],
    credentials: true,
  });

  app.addHook("onRequest", requestIdHook);

  app.setErrorHandler((error, request, reply) => {
    if (error instanceof ZodError) {
      return reply.code(400).send({
        code: "VALIDATION_ERROR",
        message: "Request validation failed",
        details: error.flatten(),
        requestId: request.requestId,
      });
    }

    if (isApiError(error)) {
      return reply.code(error.statusCode).send({
        code: error.code,
        message: error.message,
        details: error.details,
        requestId: request.requestId,
      });
    }

    if (error instanceof ApiError) {
      return reply.code(error.statusCode).send({
        code: error.code,
        message: error.message,
        details: error.details,
        requestId: request.requestId,
      });
    }

    request.log.error(error);
    return reply.code(500).send({
      code: "INTERNAL_ERROR",
      message: "Internal server error",
      requestId: request.requestId,
    });
  });

  app.get("/healthz", async () => ({ ok: true }));

  await app.register(authRoutes);
  await app.register(usersRoutes);
  await app.register(entitlementsRoutes);
  await app.register(billingRoutes);
  await app.register(razorpayWebhookRoutes);
  await app.register(inferenceRoutes);

  return app;
}

async function main() {
  const app = await buildServer();

  const shutdown = async () => {
    await app.close();
    await prisma.$disconnect();
    process.exit(0);
  };
  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);

  await app.listen({ port: env.API_PORT, host: "0.0.0.0" });
  app.log.info(`NELA API listening on ${env.PUBLIC_API_URL}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
