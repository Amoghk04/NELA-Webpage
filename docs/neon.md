# Neon setup & CLI

NELA uses **Neon** (hosted Postgres). There is no local Docker Postgres.

Schema source of truth: `prisma/schema.prisma`  
Apply to Neon: `npm run db:push` (or orchestrator **Push schema**)

---

## One-time setup

### 1. Neon account & project

1. Create an account at [console.neon.tech](https://console.neon.tech)
2. Create an organization and a project (e.g. **Nela-test**)
3. Note the **org ID** and **project ID** from the console (or CLI below)

### 2. Auth the Neon CLI

```bash
npx neonctl@latest auth
# or after install:
npx neon auth
```

Follow the browser login. On Windows PowerShell, `npx neon …` is enough; you do not need a global `neon` binary.

### 3. Project context (`.neon`)

Optional but convenient. In the `NELA-Webpage` root:

```json
{
  "orgId": "<your-org-id>",
  "projectId": "<your-project-id>"
}
```

- Contains **no secrets** — only IDs
- Lets CLI commands omit `--org-id` / `--project-id`
- This repo gitignores `.neon`; recreate it anytime from the CLI/console

Without `.neon`, pass IDs explicitly on each command (see below).

### 4. Pull connection strings into `.env`

From `NELA-Webpage`:

```bash
npx neon env pull
# with explicit project if no .neon:
npx neon env pull --project-id <project-id>
```

This writes (among others):

| Variable | Use |
|----------|-----|
| `DATABASE_URL` | Pooled URL — app / Prisma runtime |
| `DATABASE_URL_UNPOOLED` | Direct URL — prefer if pooler ever causes migrate/`db push` issues |
| `NEON_BRANCH` | Branch that was pulled (often `production`) |

`.env` is gitignored. Never commit it.

### 5. Sync schema

```bash
npm run db:push
```

Or use **nela-dev-orchestrator → Push schema / Schema (db:push)**.

Then start the API (`npm run dev:api` or orchestrator **Start** on API).

---

## Day-to-day schema changes

1. Edit `prisma/schema.prisma`
2. `npm run db:push`
3. Restart API if the Prisma client needs regenerating (`dev:api` already runs `db:generate`)

Do **not** use Prisma migrations for this project. Row browsing/editing can use the orchestrator **Database** tab or Neon SQL editor; table/column design stays in `schema.prisma`.

---

## Neon CLI cheat sheet

Run from `NELA-Webpage` unless noted. Prefer `npx neon …` (or `npx neonctl@latest …`).

### Auth & whoami

```bash
npx neon auth
npx neon me
```

### Orgs & projects

```bash
npx neon orgs list --output json
npx neon projects list --org-id <org-id> --output json
npx neon projects create --name <name> --org-id <org-id> --output json
```

### Branches

```bash
npx neon branches list --project-id <project-id>
```

### Connection string

```bash
npx neon connection-string --project-id <project-id>
# or with .neon present:
npx neon connection-string
```

### Env pull / refresh

```bash
npx neon env pull
```

Re-run after rotating credentials or switching the default branch.

### Init (agent / interactive)

```bash
npx neonctl@latest init
```

Interactive wizard. Agent mode (`--agent --data '…'`) is for AI-assisted onboarding; you usually do not need it again once `.env` is set.

---

## With vs without `.neon`

| Task | With `.neon` | Without `.neon` |
|------|--------------|-----------------|
| `env pull` | `npx neon env pull` | `npx neon env pull --project-id <id>` |
| List branches | `npx neon branches list` | add `--project-id <id>` |
| Connection string | `npx neon connection-string` | add `--project-id <id>` |

App runtime never reads `.neon` — only `DATABASE_URL` in `.env`.

---

## How the app uses Neon

```
prisma/schema.prisma
        │
        ▼  npm run db:push
     Neon Postgres
        ▲
        │  DATABASE_URL
apps/api (Prisma + @prisma/adapter-pg)
```

- Orchestrator DB tab also reads `DATABASE_URL` from `NELA-Webpage/.env`
- No Docker / `docker compose` for the database

---

## Deploy

Set the same Neon `DATABASE_URL` (and optionally `DATABASE_URL_UNPOOLED`) on the API host (e.g. Render). Run `npm run db:push` against that URL when the schema changes.

See [deploy.md](./deploy.md) for the Vercel + Render split.

---

## Console

[https://console.neon.tech](https://console.neon.tech) — SQL editor, branches, usage, connection details.

Docs: [https://neon.com/docs](https://neon.com/docs)
