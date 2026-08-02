export declare const ErrorCodes: {
    readonly UNAUTHORIZED: "UNAUTHORIZED";
    readonly FORBIDDEN: "FORBIDDEN";
    readonly NOT_FOUND: "NOT_FOUND";
    readonly VALIDATION_ERROR: "VALIDATION_ERROR";
    readonly RATE_LIMITED: "RATE_LIMITED";
    readonly DEVICE_CODE_INVALID: "DEVICE_CODE_INVALID";
    readonly DEVICE_CODE_EXPIRED: "DEVICE_CODE_EXPIRED";
    readonly DEVICE_CODE_DENIED: "DEVICE_CODE_DENIED";
    readonly REFRESH_TOKEN_INVALID: "REFRESH_TOKEN_INVALID";
    readonly REFRESH_TOKEN_REUSED: "REFRESH_TOKEN_REUSED";
    readonly GOOGLE_OAUTH_NOT_CONFIGURED: "GOOGLE_OAUTH_NOT_CONFIGURED";
    readonly GOOGLE_OAUTH_FAILED: "GOOGLE_OAUTH_FAILED";
    readonly INVALID_CREDENTIALS: "INVALID_CREDENTIALS";
    readonly EMAIL_ALREADY_EXISTS: "EMAIL_ALREADY_EXISTS";
    readonly AUTH_EXCHANGE_INVALID: "AUTH_EXCHANGE_INVALID";
    readonly RAZORPAY_NOT_CONFIGURED: "RAZORPAY_NOT_CONFIGURED";
    readonly RAZORPAY_WEBHOOK_INVALID: "RAZORPAY_WEBHOOK_INVALID";
    readonly OPENROUTER_NOT_CONFIGURED: "OPENROUTER_NOT_CONFIGURED";
    readonly OPENROUTER_FAILED: "OPENROUTER_FAILED";
    readonly CLOUD_BUSY: "CLOUD_BUSY";
    readonly UPGRADE_REQUIRED: "UPGRADE_REQUIRED";
    readonly QUOTA_EXHAUSTED: "QUOTA_EXHAUSTED";
    readonly FAST_QUOTA_EXHAUSTED: "FAST_QUOTA_EXHAUSTED";
    readonly CLOUD_CONTEXT_NOT_CONFIRMED: "CLOUD_CONTEXT_NOT_CONFIRMED";
    readonly INTERNAL_ERROR: "INTERNAL_ERROR";
};
export type ErrorCode = (typeof ErrorCodes)[keyof typeof ErrorCodes];
export declare class ApiError extends Error {
    readonly code: ErrorCode;
    readonly statusCode: number;
    readonly details?: unknown;
    constructor(code: ErrorCode, message: string, statusCode?: number, details?: unknown);
}
export declare function isApiError(error: unknown): error is ApiError;
//# sourceMappingURL=errors.d.ts.map