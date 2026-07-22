import type { FastifyReply, FastifyRequest } from "fastify";
import { randomUUID } from "node:crypto";

declare module "fastify" {
  interface FastifyRequest {
    requestId: string;
  }
}

export async function requestIdHook(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const incoming = request.headers["x-request-id"];
  const requestId =
    typeof incoming === "string" && incoming.length > 0
      ? incoming
      : randomUUID();
  request.requestId = requestId;
  reply.header("x-request-id", requestId);
}
