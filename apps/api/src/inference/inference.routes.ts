import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";
import { requireAuth } from "../auth/auth.guard.js";
import {
  asArtifactPlanRequest,
  runCloudChat,
} from "./inference.service.js";
import { bearerSecurity } from "../swagger/security.js";

const toolCallSchema = z.object({
  id: z.string(),
  type: z.literal("function"),
  function: z.object({
    name: z.string(),
    arguments: z.string(),
  }),
});

const chatSchema = z.object({
  mode: z.enum(["fast", "smart", "deep", "auto"]),
  intent: z
    .enum([
      "quick_chat",
      "summarize",
      "rag_answer",
      "artifact_plan",
      "deep_reasoning",
      "vision",
      "cheap_background",
    ])
    .optional(),
  messages: z
    .array(
      z.object({
        role: z.enum(["system", "user", "assistant", "tool"]),
        content: z.string().nullable().optional(),
        tool_calls: z.array(toolCallSchema).optional(),
        tool_call_id: z.string().optional(),
        name: z.string().optional(),
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
  tools: z
    .array(
      z.object({
        type: z.literal("function"),
        function: z.object({
          name: z.string(),
          description: z.string().optional(),
          parameters: z.record(z.unknown()).optional(),
        }),
      }),
    )
    .optional(),
  tool_choice: z
    .union([
      z.enum(["none", "auto", "required"]),
      z.object({
        type: z.literal("function"),
        function: z.object({ name: z.string() }),
      }),
    ])
    .optional(),
  response_format: z
    .object({
      type: z.enum(["json_object", "text"]),
    })
    .optional(),
  client: z
    .object({
      appVersion: z.string().optional(),
      platform: z.string().optional(),
      workspaceIdHash: z.string().optional(),
      sessionId: z.string().max(256).optional(),
    })
    .optional(),
});

const artifactPlanBody = chatSchema.omit({ intent: true }).extend({
  intent: z.literal("artifact_plan").optional(),
  mode: z.enum(["fast", "smart", "deep", "auto"]).optional(),
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

  const reader = upstream.body.getReader();
  reply.hijack();
  const res = reply.raw;
  res.writeHead(upstream.status, {
    "content-type": contentType ?? "text/event-stream",
    "cache-control": "no-cache, no-transform",
    connection: "keep-alive",
    "x-accel-buffering": "no",
    "x-request-id": reply.getHeader("x-request-id") as string | undefined,
  });
  // Flush headers immediately so clients can start reading SSE.
  if (typeof (res as { flushHeaders?: () => void }).flushHeaders === "function") {
    (res as { flushHeaders: () => void }).flushHeaders();
  }

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const ok = res.write(value);
      // Ask Node to flush when possible (compression / proxy buffering).
      const flushable = res as { flush?: () => void };
      if (typeof flushable.flush === "function") flushable.flush();
      if (!ok) {
        await new Promise<void>((resolve) => res.once("drain", resolve));
      }
    }
  } finally {
    res.end();
  }
}

export async function inferenceRoutes(app: FastifyInstance): Promise<void> {
  const r = app.withTypeProvider<ZodTypeProvider>();

  r.post(
    "/v1/ai/chat/completions",
    {
      schema: {
        tags: ["Inference"],
        summary: "Cloud chat completions (OpenRouter)",
        description:
          "Authenticated proxy to OpenRouter. Supports streaming SSE when stream=true. Tools execute on the desktop client.",
        security: [...bearerSecurity],
        body: chatSchema,
      },
    },
    async (request, reply) => {
      const auth = await requireAuth(request);
      const body = request.body;
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
    },
  );

  r.post(
    "/v1/ai/artifact-plan",
    {
      schema: {
        tags: ["Inference"],
        summary: "Artifact plan generation (JSON)",
        description:
          "Same as chat completions with artifact_plan intent. Prefer response_format json_object on cloud.",
        security: [...bearerSecurity],
        body: artifactPlanBody,
      },
    },
    async (request, reply) => {
      const auth = await requireAuth(request);
      const full = asArtifactPlanRequest({
        ...request.body,
        stream: request.body.stream ?? false,
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
    },
  );
}
