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
