/**
 * Frontend-owned API response shapes for the NELA Cloud HTTP API.
 * Kept in this repo only — not shared with nela-backend. If the API
 * contract changes, update these types to match the backend responses.
 */

export type CloudPlan = "free" | "starter" | "pro";

export type CreditPackId = "nano" | "plus" | "max";

export type DisplayPlan = "free" | "premium";

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
  displayPlan?: DisplayPlan;
  isPremium?: boolean;
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
  displayPlan?: DisplayPlan;
  isPremium?: boolean;
  paidCloud: boolean;
  credits?: {
    balance: number;
    packCredits: number;
    monthlyGrant: number;
  };
  quota: {
    includedUsd: number;
    usedUsd: number;
    remainingUsd: number;
  };
  fastFree: {
    limit: number;
    used: number;
    remaining: number;
    windowHours?: number;
    resetsAt?: string | null;
  };
  limits: {
    maxInputTokens: number;
    maxOutputTokens: number;
    requestsPerMinute: number;
  };
}

export interface BillingPricesResponse {
  country: string;
  currency: "INR";
  usdInrRate: number;
  plans: {
    free: { priceLabel: string; monthlyCredits: number; features: string[] };
    starter: {
      priceLabel: string;
      amountPaise: number;
      monthlyCredits: number;
      features: string[];
    };
    pro: {
      priceLabel: string;
      amountPaise: number;
      monthlyCredits: number;
      features: string[];
    };
  };
  packs: Array<{
    id: CreditPackId;
    label: string;
    credits: number;
    priceLabel: string;
    amountPaise: number;
  }>;
  fastFree: { limit: number; windowHours: number };
  orUsdPerCredit: number;
}

export interface CheckoutResponse {
  checkoutUrl: string;
}

export interface BillingManageResponse {
  manageUrl: string;
}

export interface ConfirmCheckoutResponse {
  ok: boolean;
  activated: boolean;
  plan: CloudPlan;
  status: EntitlementStatus;
  paidCloud: boolean;
  isPremium: boolean;
  displayPlan?: DisplayPlan;
}
