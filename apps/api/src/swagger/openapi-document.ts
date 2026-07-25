/**
 * OpenAPI 3 document for NELA Cloud API.
 * Served by @fastify/swagger (static mode) + Swagger UI at /docs.
 *
 * Runtime validation remains Zod in route handlers; this document is the
 * human/API-client contract for exploration and desktop/web integration.
 */

import { env } from "../config.js";

const errorSchema = {
  type: "object",
  required: ["code", "message"],
  properties: {
    code: { type: "string" },
    message: { type: "string" },
    details: {},
    requestId: { type: "string" },
  },
} as const;

const userProfileSchema = {
  type: "object",
  required: [
    "id",
    "name",
    "email",
    "avatarUrl",
    "authProvider",
    "plan",
    "entitlementStatus",
    "updatedAt",
  ],
  properties: {
    id: { type: "string" },
    name: { type: "string" },
    email: { type: "string", format: "email" },
    avatarUrl: { type: "string", nullable: true },
    authProvider: { type: "string", enum: ["google", "email"] },
    plan: { type: "string", enum: ["free", "starter", "pro"] },
    entitlementStatus: {
      type: "string",
      enum: [
        "inactive",
        "active",
        "past_due",
        "cancelled",
        "quota_exhausted",
      ],
    },
    updatedAt: { type: "string", format: "date-time" },
  },
} as const;

const authTokenSchema = {
  type: "object",
  required: ["accessToken", "refreshToken", "expiresIn", "profile"],
  properties: {
    accessToken: { type: "string" },
    refreshToken: { type: "string" },
    expiresIn: { type: "integer" },
    profile: userProfileSchema,
  },
} as const;

const chatMessageSchema = {
  type: "object",
  required: ["role"],
  properties: {
    role: {
      type: "string",
      enum: ["system", "user", "assistant", "tool"],
    },
    content: { type: "string", nullable: true },
    tool_calls: {
      type: "array",
      items: {
        type: "object",
        required: ["id", "type", "function"],
        properties: {
          id: { type: "string" },
          type: { type: "string", enum: ["function"] },
          function: {
            type: "object",
            required: ["name", "arguments"],
            properties: {
              name: { type: "string" },
              arguments: { type: "string" },
            },
          },
        },
      },
    },
    tool_call_id: { type: "string" },
    name: { type: "string" },
  },
} as const;

const cloudChatBodySchema = {
  type: "object",
  required: ["mode", "messages", "stream", "privacy"],
  properties: {
    mode: {
      type: "string",
      enum: ["fast", "smart", "deep", "auto"],
      description: "OpenRouter quality tier (Auto classifies server-side).",
    },
    intent: {
      type: "string",
      enum: [
        "quick_chat",
        "summarize",
        "rag_answer",
        "artifact_plan",
        "deep_reasoning",
        "vision",
        "cheap_background",
      ],
    },
    messages: {
      type: "array",
      minItems: 1,
      items: chatMessageSchema,
    },
    stream: { type: "boolean", default: false },
    privacy: {
      type: "object",
      required: ["containsFileContext", "userConfirmedCloudContext"],
      properties: {
        containsFileContext: { type: "boolean" },
        userConfirmedCloudContext: { type: "boolean" },
        contextSource: { type: "string" },
      },
    },
    generation: {
      type: "object",
      properties: {
        maxTokens: { type: "integer", minimum: 1 },
        temperature: { type: "number", minimum: 0, maximum: 2 },
      },
    },
    tools: {
      type: "array",
      items: {
        type: "object",
        required: ["type", "function"],
        properties: {
          type: { type: "string", enum: ["function"] },
          function: {
            type: "object",
            required: ["name"],
            properties: {
              name: { type: "string" },
              description: { type: "string" },
              parameters: { type: "object", additionalProperties: true },
            },
          },
        },
      },
    },
    tool_choice: {
      description: "none | auto | required | specific function",
      oneOf: [
        { type: "string", enum: ["none", "auto", "required"] },
        {
          type: "object",
          required: ["type", "function"],
          properties: {
            type: { type: "string", enum: ["function"] },
            function: {
              type: "object",
              required: ["name"],
              properties: { name: { type: "string" } },
            },
          },
        },
      ],
    },
    response_format: {
      type: "object",
      required: ["type"],
      properties: {
        type: { type: "string", enum: ["json_object", "text"] },
      },
    },
    client: {
      type: "object",
      properties: {
        appVersion: { type: "string" },
        platform: { type: "string" },
        workspaceIdHash: { type: "string" },
        sessionId: {
          type: "string",
          maxLength: 256,
          description: "Sticky OpenRouter session for prompt caching",
        },
      },
    },
  },
} as const;

export function buildOpenApiDocument() {
  return {
    openapi: "3.0.3",
    info: {
      title: "NELA Cloud API",
      description:
        "Backend for NELA desktop and web: auth, entitlements, billing, and OpenRouter-backed cloud inference.\n\n" +
        "Use **Authorize** with a Bearer access token from email login, device poll, or refresh.",
      version: "0.1.0",
      contact: { name: "NELA" },
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
          description: "Access token from /v1/auth/email/login or device poll",
        },
      },
      schemas: {
        ApiError: errorSchema,
        UserProfile: userProfileSchema,
        AuthTokenResponse: authTokenSchema,
        CloudChatRequest: cloudChatBodySchema,
      },
    },
    paths: {
      "/healthz": {
        get: {
          tags: ["Health"],
          summary: "Health check",
          security: [],
          responses: {
            200: {
              description: "API is up",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: { ok: { type: "boolean" } },
                  },
                },
              },
            },
          },
        },
      },

      "/v1/auth/device/start": {
        post: {
          tags: ["Auth"],
          summary: "Start desktop device login",
          security: [],
          requestBody: {
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    deviceName: { type: "string", maxLength: 120 },
                  },
                },
              },
            },
          },
          responses: {
            200: {
              description: "Device + user codes",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    required: [
                      "deviceCode",
                      "userCode",
                      "verificationUrl",
                      "expiresIn",
                      "interval",
                    ],
                    properties: {
                      deviceCode: { type: "string" },
                      userCode: { type: "string" },
                      verificationUrl: { type: "string" },
                      expiresIn: { type: "integer" },
                      interval: { type: "integer" },
                    },
                  },
                },
              },
            },
          },
        },
      },

      "/v1/auth/device/poll": {
        post: {
          tags: ["Auth"],
          summary: "Poll device login status",
          security: [],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["deviceCode"],
                  properties: {
                    deviceCode: { type: "string", minLength: 8 },
                  },
                },
              },
            },
          },
          responses: {
            200: {
              description: "pending | approved | denied | expired",
              content: {
                "application/json": {
                  schema: {
                    oneOf: [
                      {
                        type: "object",
                        properties: {
                          status: { type: "string", enum: ["pending"] },
                        },
                      },
                      {
                        allOf: [
                          {
                            type: "object",
                            properties: {
                              status: { type: "string", enum: ["approved"] },
                            },
                          },
                          { $ref: "#/components/schemas/AuthTokenResponse" },
                        ],
                      },
                      {
                        type: "object",
                        properties: {
                          status: {
                            type: "string",
                            enum: ["denied", "expired"],
                          },
                        },
                      },
                    ],
                  },
                },
              },
            },
          },
        },
      },

      "/v1/auth/device/approve": {
        post: {
          tags: ["Auth"],
          summary: "Approve a device code (browser, authenticated)",
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["userCode"],
                  properties: {
                    userCode: { type: "string", minLength: 8, maxLength: 16 },
                  },
                },
              },
            },
          },
          responses: {
            200: {
              description: "Device approved",
              content: {
                "application/json": {
                  schema: { type: "object", additionalProperties: true },
                },
              },
            },
            401: {
              description: "Unauthorized",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ApiError" },
                },
              },
            },
          },
        },
      },

      "/v1/auth/email/register": {
        post: {
          tags: ["Auth"],
          summary: "Register with email + password",
          security: [],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["email", "password"],
                  properties: {
                    email: { type: "string", format: "email" },
                    password: { type: "string", minLength: 8, maxLength: 128 },
                    name: { type: "string", maxLength: 120 },
                    deviceName: { type: "string", maxLength: 120 },
                  },
                },
              },
            },
          },
          responses: {
            200: {
              description: "Tokens + profile",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/AuthTokenResponse" },
                },
              },
            },
          },
        },
      },

      "/v1/auth/email/login": {
        post: {
          tags: ["Auth"],
          summary: "Login with email + password",
          security: [],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["email", "password"],
                  properties: {
                    email: { type: "string", format: "email" },
                    password: { type: "string", minLength: 8, maxLength: 128 },
                    deviceName: { type: "string", maxLength: 120 },
                  },
                },
              },
            },
          },
          responses: {
            200: {
              description: "Tokens + profile",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/AuthTokenResponse" },
                },
              },
            },
          },
        },
      },

      "/v1/auth/web/exchange": {
        post: {
          tags: ["Auth"],
          summary: "Exchange one-time web OAuth code for tokens",
          security: [],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["code"],
                  properties: {
                    code: { type: "string", minLength: 16 },
                  },
                },
              },
            },
          },
          responses: {
            200: {
              description: "Tokens + profile",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/AuthTokenResponse" },
                },
              },
            },
          },
        },
      },

      "/v1/auth/refresh": {
        post: {
          tags: ["Auth"],
          summary: "Rotate refresh token",
          security: [],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["refreshToken"],
                  properties: {
                    refreshToken: { type: "string", minLength: 16 },
                  },
                },
              },
            },
          },
          responses: {
            200: {
              description: "New tokens",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    required: ["accessToken", "refreshToken", "expiresIn"],
                    properties: {
                      accessToken: { type: "string" },
                      refreshToken: { type: "string" },
                      expiresIn: { type: "integer" },
                    },
                  },
                },
              },
            },
          },
        },
      },

      "/v1/auth/logout": {
        post: {
          tags: ["Auth"],
          summary: "Revoke refresh token (optional)",
          security: [],
          requestBody: {
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    refreshToken: { type: "string", minLength: 16 },
                  },
                },
              },
            },
          },
          responses: {
            200: {
              description: "Logged out",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: { ok: { type: "boolean" } },
                  },
                },
              },
            },
          },
        },
      },

      "/v1/auth/google/web/start": {
        get: {
          tags: ["Auth"],
          summary: "Start browser Google OAuth (redirect)",
          security: [],
          parameters: [
            {
              name: "returnTo",
              in: "query",
              schema: { type: "string" },
              description: "Relative path after login",
            },
          ],
          responses: {
            302: { description: "Redirect to Google" },
          },
        },
      },

      "/v1/auth/google/start": {
        get: {
          tags: ["Auth"],
          summary: "Start Google OAuth for a device code (redirect)",
          security: [],
          parameters: [
            {
              name: "deviceCode",
              in: "query",
              required: true,
              schema: { type: "string", minLength: 8 },
            },
            {
              name: "returnTo",
              in: "query",
              schema: { type: "string" },
            },
            {
              name: "source",
              in: "query",
              schema: { type: "string", enum: ["web", "device"] },
            },
          ],
          responses: {
            302: { description: "Redirect to Google" },
          },
        },
      },

      "/v1/auth/google/callback": {
        get: {
          tags: ["Auth"],
          summary: "Google OAuth callback (redirect)",
          security: [],
          parameters: [
            { name: "code", in: "query", schema: { type: "string" } },
            { name: "state", in: "query", schema: { type: "string" } },
            { name: "error", in: "query", schema: { type: "string" } },
          ],
          responses: {
            302: { description: "Redirect to web app or device success" },
          },
        },
      },

      "/v1/me": {
        get: {
          tags: ["Users"],
          summary: "Current user profile",
          security: [{ bearerAuth: [] }],
          responses: {
            200: {
              description: "Profile",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/UserProfile" },
                },
              },
            },
            401: {
              description: "Unauthorized",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ApiError" },
                },
              },
            },
          },
        },
        patch: {
          tags: ["Users"],
          summary: "Update name and/or avatar",
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    name: { type: "string", minLength: 1, maxLength: 120 },
                    avatarUrl: {
                      type: "string",
                      nullable: true,
                      maxLength: 2_000_000,
                    },
                  },
                },
              },
            },
          },
          responses: {
            200: {
              description: "Updated profile",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/UserProfile" },
                },
              },
            },
          },
        },
      },

      "/v1/me/entitlement": {
        get: {
          tags: ["Entitlements"],
          summary: "Cloud plan, quotas, and feature flags",
          security: [{ bearerAuth: [] }],
          responses: {
            200: {
              description: "Entitlement snapshot",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    additionalProperties: true,
                    properties: {
                      plan: {
                        type: "string",
                        enum: ["free", "starter", "pro"],
                      },
                      cloudEnabled: { type: "boolean" },
                      paidCloud: { type: "boolean" },
                      fastFree: { type: "boolean" },
                    },
                  },
                },
              },
            },
          },
        },
      },

      "/v1/billing/razorpay/checkout": {
        post: {
          tags: ["Billing"],
          summary: "Create Razorpay checkout / payment link",
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["plan"],
                  properties: {
                    plan: { type: "string", enum: ["starter", "pro"] },
                  },
                },
              },
            },
          },
          responses: {
            200: {
              description: "Hosted checkout URL",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    required: ["checkoutUrl"],
                    properties: {
                      checkoutUrl: { type: "string", format: "uri" },
                    },
                  },
                },
              },
            },
            503: {
              description: "Razorpay not configured",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ApiError" },
                },
              },
            },
          },
        },
      },

      "/v1/billing/razorpay/manage": {
        post: {
          tags: ["Billing"],
          summary: "Get subscription manage URL",
          security: [{ bearerAuth: [] }],
          responses: {
            200: {
              description: "Manage URL",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    required: ["manageUrl"],
                    properties: {
                      manageUrl: { type: "string", format: "uri" },
                    },
                  },
                },
              },
            },
          },
        },
      },

      "/v1/webhooks/razorpay": {
        post: {
          tags: ["Webhooks"],
          summary: "Razorpay webhook receiver",
          description:
            "Verified via `X-Razorpay-Signature`. Not for browser use.",
          security: [],
          requestBody: {
            content: {
              "application/json": {
                schema: { type: "object", additionalProperties: true },
              },
            },
          },
          responses: {
            200: {
              description: "Acknowledged",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: { ok: { type: "boolean" } },
                  },
                },
              },
            },
          },
        },
      },

      "/v1/ai/chat/completions": {
        post: {
          tags: ["Inference"],
          summary: "Cloud chat completions (OpenRouter)",
          description:
            "Authenticated proxy to OpenRouter. Supports streaming SSE when `stream: true`. " +
            "Tools are executed on the desktop client, not this API.",
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/CloudChatRequest" },
              },
            },
          },
          responses: {
            200: {
              description:
                "OpenAI-compatible JSON (non-stream) or text/event-stream (stream)",
              content: {
                "application/json": {
                  schema: { type: "object", additionalProperties: true },
                },
                "text/event-stream": {
                  schema: { type: "string" },
                },
              },
            },
            401: {
              description: "Unauthorized",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ApiError" },
                },
              },
            },
            403: {
              description: "Privacy / entitlement blocked",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ApiError" },
                },
              },
            },
            503: {
              description: "Cloud busy / OpenRouter unavailable",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ApiError" },
                },
              },
            },
          },
        },
      },

      "/v1/ai/artifact-plan": {
        post: {
          tags: ["Inference"],
          summary: "Artifact plan generation (JSON)",
          description:
            "Same as chat completions with artifact_plan intent. Prefer `response_format: { type: \"json_object\" }` on cloud.",
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  allOf: [
                    { $ref: "#/components/schemas/CloudChatRequest" },
                    {
                      type: "object",
                      properties: {
                        intent: {
                          type: "string",
                          enum: ["artifact_plan"],
                        },
                        mode: {
                          type: "string",
                          enum: ["fast", "smart", "deep", "auto"],
                        },
                      },
                    },
                  ],
                },
              },
            },
          },
          responses: {
            200: {
              description: "Plan JSON or SSE stream",
              content: {
                "application/json": {
                  schema: { type: "object", additionalProperties: true },
                },
              },
            },
          },
        },
      },
    },
  };
}
