# NELA Webpage

Next.js marketing + account UI. Talks to the NELA Cloud API over HTTP only
(`NEXT_PUBLIC_API_URL`). No shared packages with the backend.

## Run locally

1. Point `NEXT_PUBLIC_API_URL` at a running API (local default `http://localhost:3001`)
2. `npm install` then `npm run dev` → [http://localhost:3000](http://localhost:3000)

API response shapes used by the UI live in `lib/api-types.ts`.
