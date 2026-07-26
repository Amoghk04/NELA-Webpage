/**
 * Frontend-owned API response shapes for the NELA Cloud HTTP API.
 * Kept in this repo only — not shared with nela-backend. If the API
 * contract changes, update these types to match the backend responses.
 */

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
  authProvider: "google" | "email";
  plan: CloudPlan;
  entitlementStatus: EntitlementStatus;
  updatedAt: string;
}

export interface AuthTokenResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  profile: UserProfileDto;
}

export interface EntitlementResponse {
  cloudEnabled: boolean;
  plan: CloudPlan;
  status: EntitlementStatus;
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

export interface CheckoutResponse {
  checkoutUrl: string;
}

export interface BillingManageResponse {
  manageUrl: string;
}
