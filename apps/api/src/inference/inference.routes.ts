import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { requireAuth } from "../auth/auth.guard.js";
import {
  asArtifactPlanRequest,
  runCloudChat,
} from "./inference.service.js";

const chatSchema = z.object({
  intent: z.enum([
    "quick_chat",
    "summarize",
    "rag_answer",
    "artifact_plan",
    "deep_reasoning",
    "vision",
    "cheap_background",
  ]),
  messages: z
    .array(
      z.object({
        role: z.enum(["system", "user", "assistant"]),
        content: z.string(),
      }),
    )
    .min(1),
  stream: z.boolean().default(false),
  privacy: z.object({
    containsFileContext: z.boolean(),
    userConfirmedCloudContext: z.boolean(),
    contextSource: z.string().optional(),
  }),
  generation: z
    .object({
      maxTokens: z.number().int().positive().optional(),
      temperature: z.number().min(0).max(2).optional(),
    })
    .optional(),
  client: z
    .object({
      appVersion: z.string().optional(),
      platform: z.string().optional(),
      workspaceIdHash: z.string().optional(),
    })
    .optional(),
});

async function pipeUpstream(
  reply: import("fastify").FastifyReply,
  upstream: Response,
): Promise<void> {
  reply.status(upstream.status);
  const contentType = upstream.headers.get("content-type");
  if (contentType) reply.header("content-type", contentType);

  if (!upstream.body) {
    const text = await upstream.text();
    return reply.send(text);
  }

  // Node fetch ReadableStream → Fastify
  const reader = upstream.body.getReader();
  reply.hijack();
  const res = reply.raw;
  res.writeHead(upstream.status, {
    "content-type": contentType ?? "text/event-stream",
    "cache-control": "no-cache",
    connection: "keep-alive",
    "x-request-id": reply.getHeader("x-request-id") as string | undefined,
  });

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      res.write(value);
    }
  } finally {
    res.end();
  }
}

export async function inferenceRoutes(app: FastifyInstance): Promise<void> {
  app.post("/v1/ai/chat/completions", async (request, reply) => {
    const auth = await requireAuth(request);
    const body = chatSchema.parse(request.body ?? {});
    const upstream = await runCloudChat({
      userId: auth.userId,
      requestId: request.requestId,
      body,
    });

    if (body.stream) {
      await pipeUpstream(reply, upstream);
      return;
    }

    const json = await upstream.json();
    return reply.send(json);
  });

  app.post("/v1/ai/artifact-plan", async (request, reply) => {
    const auth = await requireAuth(request);
    const partial = chatSchema.omit({ intent: true }).extend({
      intent: z.literal("artifact_plan").optional(),
    });
    const body = partial.parse(request.body ?? {});
    const full = asArtifactPlanRequest({
      ...body,
      stream: body.stream ?? false,
    });

    const upstream = await runCloudChat({
      userId: auth.userId,
      requestId: request.requestId,
      body: full,
    });

    if (full.stream) {
      await pipeUpstream(reply, upstream);
      return;
    }

    const json = await upstream.json();
    return reply.send(json);
  });
}
