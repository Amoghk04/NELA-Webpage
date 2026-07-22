export type CloudPlan = "free" | "starter" | "pro";

export type EntitlementStatus =
  | "inactive"
  | "active"
  | "past_due"
  | "cancelled"
  | "quota_exhausted";

export interface UserProfileDto {
  id: string;
  name: string;
  email: string;
  avatarUrl: string | null;
  authProvider: "google";
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
  quota: {
    includedUsd: number;
    usedUsd: number;
    remainingUsd: number;
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

export interface CloudChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface CloudChatRequest {
  intent: CloudIntent;
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
  client?: {
    appVersion?: string;
    platform?: string;
    workspaceIdHash?: string;
  };
}

export interface ArtifactPlanRequest extends Omit<CloudChatRequest, "intent"> {
  intent?: "artifact_plan";
}
