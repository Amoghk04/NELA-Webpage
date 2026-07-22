export const ErrorCodes = {
  UNAUTHORIZED: "UNAUTHORIZED",
  FORBIDDEN: "FORBIDDEN",
  NOT_FOUND: "NOT_FOUND",
  VALIDATION_ERROR: "VALIDATION_ERROR",
  RATE_LIMITED: "RATE_LIMITED",
  DEVICE_CODE_INVALID: "DEVICE_CODE_INVALID",
  DEVICE_CODE_EXPIRED: "DEVICE_CODE_EXPIRED",
  DEVICE_CODE_DENIED: "DEVICE_CODE_DENIED",
  REFRESH_TOKEN_INVALID: "REFRESH_TOKEN_INVALID",
  REFRESH_TOKEN_REUSED: "REFRESH_TOKEN_REUSED",
  GOOGLE_OAUTH_NOT_CONFIGURED: "GOOGLE_OAUTH_NOT_CONFIGURED",
  GOOGLE_OAUTH_FAILED: "GOOGLE_OAUTH_FAILED",
  RAZORPAY_NOT_CONFIGURED: "RAZORPAY_NOT_CONFIGURED",
  RAZORPAY_WEBHOOK_INVALID: "RAZORPAY_WEBHOOK_INVALID",
  OPENROUTER_NOT_CONFIGURED: "OPENROUTER_NOT_CONFIGURED",
  OPENROUTER_FAILED: "OPENROUTER_FAILED",
  UPGRADE_REQUIRED: "UPGRADE_REQUIRED",
  QUOTA_EXHAUSTED: "QUOTA_EXHAUSTED",
  CLOUD_CONTEXT_NOT_CONFIRMED: "CLOUD_CONTEXT_NOT_CONFIRMED",
  INTERNAL_ERROR: "INTERNAL_ERROR",
} as const;

export type ErrorCode = (typeof ErrorCodes)[keyof typeof ErrorCodes];

export class ApiError extends Error {
  readonly code: ErrorCode;
  readonly statusCode: number;
  readonly details?: unknown;

  constructor(
    code: ErrorCode,
    message: string,
    statusCode = 400,
    details?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
  }
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}
