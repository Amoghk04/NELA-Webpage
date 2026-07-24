# Local infrastructure for NELA API

## Start Postgres

```bash
docker compose -f infra/docker-compose.yml up -d
```

## Optional Redis

```bash
docker compose -f infra/docker-compose.yml --profile redis up -d
```

Without Redis, the API uses an in-memory rate-limit store.

## Apply schema

From repo root (after copying `.env.example` → `.env`):

```bash
npx prisma migrate dev --name init
# or for local prototyping:
npx prisma db push
```

## Deploy split (Vercel + Render)

Keep this monorepo. Do **not** move the API to a separate repo for OpenRouter.

| Host | What | Secrets |
|------|------|---------|
| **Vercel** | Next.js marketing + account UI (`next build`) | `NEXT_PUBLIC_API_URL` only — **no** OpenRouter / Razorpay / JWT secrets |
| **Render** (or Fly/Railway) | Long-running `@nela/api` (`npm run build:api` then `node apps/api/dist/server.js`) | `DATABASE_URL`, `OPENROUTER_*`, `JWT_*`, Razorpay when ready |

### Render env (OpenRouter pool)

- `OPENROUTER_API_KEY_FREE` — Fast lane (free models)
- `OPENROUTER_API_KEY_PAID` — Smart/Deep lane
- `OPENROUTER_API_KEY` — optional legacy fallback for both
- `OPENROUTER_MANAGEMENT_KEY` — optional; enables `ensurePool` via Management API
- `TOKEN_ENCRYPTION_KEY_BASE64` — 32-byte key to encrypt DB `ProviderKey` rows
- `CLOUD_ENTITLEMENT_OVERRIDE=pro` — Phase-1 stub to test Smart/Deep without Razorpay

Desktop and the web app call `PUBLIC_API_URL` on Render. OpenRouter keys never leave the API process.

### Razorpay (Phase 2)

Checkout already stubs when Razorpay keys are missing. When billing is finished, webhooks continue to call `syncEntitlementFromPlan` — the same entitlement gates used by OpenRouter modes. Remove or lock `CLOUD_ENTITLEMENT_OVERRIDE` to non-prod after that.
