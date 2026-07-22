import { config as loadDotenv } from "dotenv";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { existsSync } from "node:fs";

const here = dirname(fileURLToPath(import.meta.url));
const candidates = [
  resolve(here, "../../../.env"),
  resolve(here, "../../.env"),
  resolve(process.cwd(), ".env"),
  resolve(process.cwd(), "../../.env"),
];

for (const path of candidates) {
  if (existsSync(path)) {
    loadDotenv({ path });
    break;
  }
}

export type Env = {
  NODE_ENV: string;
  API_PORT: number;
  PUBLIC_WEB_URL: string;
  PUBLIC_API_URL: string;
  DATABASE_URL: string;
  REDIS_URL?: string;
  GOOGLE_CLIENT_ID?: string;
  GOOGLE_CLIENT_SECRET?: string;
  GOOGLE_REDIRECT_URI: string;
  JWT_ACCESS_SECRET: string;
  REFRESH_TOKEN_PEPPER: string;
  TOKEN_ENCRYPTION_KEY_BASE64?: string;
  RAZORPAY_KEY_ID?: string;
  RAZORPAY_KEY_SECRET?: string;
  RAZORPAY_WEBHOOK_SECRET?: string;
  RAZORPAY_PLAN_STARTER_ID?: string;
  RAZORPAY_PLAN_PRO_ID?: string;
  OPENROUTER_API_KEY?: string;
  OPENROUTER_SITE_URL: string;
  OPENROUTER_APP_TITLE: string;
  LOG_LEVEL: string;
  PROMPT_LOGGING_ENABLED: boolean;
  ACCESS_TOKEN_TTL_SECONDS: number;
  DEVICE_LOGIN_TTL_SECONDS: number;
  DEVICE_POLL_INTERVAL_SECONDS: number;
};

function required(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback;
  if (!value) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return value;
}

function optional(name: string): string | undefined {
  const value = process.env[name];
  return value && value.trim().length > 0 ? value : undefined;
}

export function loadEnv(): Env {
  return {
    NODE_ENV: process.env.NODE_ENV ?? "development",
    API_PORT: Number(process.env.API_PORT ?? "3001"),
    PUBLIC_WEB_URL: required("PUBLIC_WEB_URL", "http://localhost:3000"),
    PUBLIC_API_URL: required("PUBLIC_API_URL", "http://localhost:3001"),
    DATABASE_URL: required(
      "DATABASE_URL",
      "postgresql://postgres:postgres@localhost:5432/nela",
    ),
    REDIS_URL: optional("REDIS_URL"),
    GOOGLE_CLIENT_ID: optional("GOOGLE_CLIENT_ID"),
    GOOGLE_CLIENT_SECRET: optional("GOOGLE_CLIENT_SECRET"),
    GOOGLE_REDIRECT_URI: required(
      "GOOGLE_REDIRECT_URI",
      "http://localhost:3001/v1/auth/google/callback",
    ),
    JWT_ACCESS_SECRET: required(
      "JWT_ACCESS_SECRET",
      "dev-change-me-access-secret-min-32-chars",
    ),
    REFRESH_TOKEN_PEPPER: required(
      "REFRESH_TOKEN_PEPPER",
      "dev-change-me-refresh-pepper",
    ),
    TOKEN_ENCRYPTION_KEY_BASE64: optional("TOKEN_ENCRYPTION_KEY_BASE64"),
    RAZORPAY_KEY_ID: optional("RAZORPAY_KEY_ID"),
    RAZORPAY_KEY_SECRET: optional("RAZORPAY_KEY_SECRET"),
    RAZORPAY_WEBHOOK_SECRET: optional("RAZORPAY_WEBHOOK_SECRET"),
    RAZORPAY_PLAN_STARTER_ID: optional("RAZORPAY_PLAN_STARTER_ID"),
    RAZORPAY_PLAN_PRO_ID: optional("RAZORPAY_PLAN_PRO_ID"),
    OPENROUTER_API_KEY: optional("OPENROUTER_API_KEY"),
    OPENROUTER_SITE_URL: required("OPENROUTER_SITE_URL", "https://nela.ai"),
    OPENROUTER_APP_TITLE: required("OPENROUTER_APP_TITLE", "NELA"),
    LOG_LEVEL: process.env.LOG_LEVEL ?? "info",
    PROMPT_LOGGING_ENABLED: process.env.PROMPT_LOGGING_ENABLED === "true",
    ACCESS_TOKEN_TTL_SECONDS: Number(process.env.ACCESS_TOKEN_TTL_SECONDS ?? "900"),
    DEVICE_LOGIN_TTL_SECONDS: Number(process.env.DEVICE_LOGIN_TTL_SECONDS ?? "900"),
    DEVICE_POLL_INTERVAL_SECONDS: Number(
      process.env.DEVICE_POLL_INTERVAL_SECONDS ?? "5",
    ),
  };
}

export const env = loadEnv();
