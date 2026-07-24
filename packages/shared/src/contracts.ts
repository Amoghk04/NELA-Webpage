export type CloudPlan = "free" | "starter" | "pro";

export type EntitlementStatus =
  | "inactive"
  | "active"
  | "past_due"
  | "cancelled"
  | "quota_exhausted";

/** User-facing OpenRouter quality tier. Never expose underlying model IDs in UI. */
export type CloudMode = "fast" | "smart" | "deep" | "auto";

/** Resolved tier after Auto classification (never `auto`). */
export type ResolvedCloudMode = "fast" | "smart" | "deep";

export interface UserProfileDto {
  id: string;
  name: string;
  email: string;
  avatarUrl: string | null;
  authProvider: "google" | "email";
  plan: CloudPlan;
  entitlementStatus: EntitlementStatus;
  updatedAt: string;
}

export interface DeviceStartRequest {
  deviceName?: string;
}

export interface DeviceStartResponse {
  deviceCode: string;
  userCode: string;
  verificationUrl: string;
  expiresIn: number;
  interval: number;
}

export interface DevicePollRequest {
  deviceCode: string;
}

export interface DevicePollPendingResponse {
  status: "pending";
}

export interface DevicePollApprovedResponse {
  status: "approved";
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  profile: UserProfileDto;
}

export interface DevicePollDeniedResponse {
  status: "denied" | "expired";
}

export type DevicePollResponse =
  | DevicePollPendingResponse
  | DevicePollApprovedResponse
  | DevicePollDeniedResponse;

export interface AuthTokenResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  profile: UserProfileDto;
}

export interface EmailRegisterRequest {
  email: string;
  password: string;
  name?: string;
  deviceName?: string;
}

export interface EmailLoginRequest {
  email: string;
  password: string;
  deviceName?: string;
}

export interface WebExchangeRequest {
  code: string;
}

export interface UpdateProfileRequest {
  name?: string;
  avatarUrl?: string | null;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface RefreshTokenResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  profile: UserProfileDto;
}

export interface LogoutRequest {
  refreshToken?: string;
}

export interface EntitlementResponse {
  cloudEnabled: boolean;
  plan: CloudPlan;
  status: EntitlementStatus;
  /** True when Smart/Deep (paid lanes) are allowed. */
  paidCloud: boolean;
  quota: {
    includedUsd: number;
    usedUsd: number;
    remainingUsd: number;
  };
  fastFree: {
    limit: number;
    used: number;
    remaining: number;
  };
  limits: {
    maxInputTokens: number;
    maxOutputTokens: number;
    requestsPerMinute: number;
  };
}

export interface CheckoutRequest {
  plan: "starter" | "pro";
}

export interface CheckoutResponse {
  checkoutUrl: string;
}

export interface BillingManageResponse {
  manageUrl: string;
}

export type CloudIntent =
  | "quick_chat"
  | "summarize"
  | "rag_answer"
  | "artifact_plan"
  | "deep_reasoning"
  | "vision"
  | "cheap_background";

/** OpenAI-compatible tool call emitted by the assistant. */
export interface CloudToolCallFunction {
  name: string;
  arguments: string;
}

export interface CloudToolCall {
  id: string;
  type: "function";
  function: CloudToolCallFunction;
}

/** OpenAI-compatible function tool definition (desktop is the tool host). */
export interface CloudToolFunctionDef {
  name: string;
  description?: string;
  parameters?: Record<string, unknown>;
}

export interface CloudToolDefinition {
  type: "function";
  function: CloudToolFunctionDef;
}

export type CloudToolChoice =
  | "none"
  | "auto"
  | "required"
  | { type: "function"; function: { name: string } };

export interface CloudResponseFormat {
  type: "json_object" | "text";
}

export interface CloudChatMessage {
  role: "system" | "user" | "assistant" | "tool";
  /** Text content; may be null when assistant emits tool_calls only. */
  content?: string | null;
  tool_calls?: CloudToolCall[];
  tool_call_id?: string;
  name?: string;
}

export interface CloudChatRequest {
  /** Primary UX control for OpenRouter quality. */
  mode: CloudMode;
  /** Optional capability hint (e.g. vision). Defaults to quick_chat when omitted. */
  intent?: CloudIntent;
  messages: CloudChatMessage[];
  stream: boolean;
  privacy: {
    containsFileContext: boolean;
    userConfirmedCloudContext: boolean;
    contextSource?: string;
  };
  generation?: {
    maxTokens?: number;
    temperature?: number;
  };
  /** OpenAI-style tools; executed on the desktop client, not the API. */
  tools?: CloudToolDefinition[];
  tool_choice?: CloudToolChoice;
  /** Prefer json_object for artifact_plan on cloud (no GBNF). */
  response_format?: CloudResponseFormat;
  client?: {
    appVersion?: string;
    platform?: string;
    workspaceIdHash?: string;
  };
}

export interface ArtifactPlanRequest extends Omit<CloudChatRequest, "intent"> {
  intent?: "artifact_plan";
}

export interface CloudChatMeta {
  requestedMode: CloudMode;
  resolvedMode: ResolvedCloudMode;
  /** Internal only — omit from non-tech UI. */
  model?: string;
}
