# Next.js Adapter — Production Sandboxed Stack

This example ships a minimal **Next.js 14** playground that:

- Proxies uploads to the **md-convert** worker (`/api/ingest/convert`).
- Streams Alpha Vantage + LLM probes through the **local MCP HTTP bridge** (`MCP_HTTP_URL`).
- Optionally mirrors converted ZIPs into **Supabase Storage**.
The example Next.js 14 app now includes the full VibeOS production surface: job orchestration, policy gates, eval lab, map/social pipelines, NarcoNations MCP publish, and the Workroom → Build Brief hand-off.

> Everything lives under `examples/next-adapter/` so you can iterate without touching the main monorepo.

## Quick start

```bash
cd examples/next-adapter
npm i
cp .env.example .env.local
# update MD_CONVERT_URL, MCP_HTTP_URL, and any Supabase/API keys
npm run dev
```

The adapter expects the MCP HTTP bridge to be running locally (default `http://localhost:3030`). See the root README for bridge commands.

## Env
- `MD_CONVERT_URL` (e.g. `http://localhost:8000`)
- `INGEST_SUPABASE` = `true` to enable Supabase writes (optional)
- `SUPABASE_URL` / `SUPABASE_ANON_KEY`
- `SUPABASE_BUCKET_FILES` (default: `files`)
- `MCP_HTTP_URL` – Base URL for the local MCP HTTP bridge (`http://localhost:3030` in dev)
- `ALPHA_VANTAGE_KEY` / `OPENAI_API_KEY` – forwarded to the bridge for feed + LLM probes

## Notes
- Uses `unzipit` to unpack the worker ZIP in-memory.
- If Supabase is **disabled**, the convert route returns a JSON summary (filenames, bytes).
- `/api/feeds/alpha` and `/api/llm` simply proxy to the MCP HTTP bridge, so you get unified caching, telemetry, and Supabase logging from the core server.
- Front‑matter insertion/merge is left as a TODO (depends on your markdown policy).
npm install
cp .env.example .env.local
# toggle feature flags as needed (all default to false)
npm run dev
```

Visit:

- `/metrics` — cost, latency, and health dashboards
- `/evals` — Eval Lab leaderboard (enable `FF_EVALS=true`)
- `/policy` — Ethics Council log (enable map/social flags)
- `/play/map` — PMTiles pipeline (enable `FF_MAP_PIPELINE=true`)
- `/play/social` — social render/publish queue (enable `FF_SOCIAL_PIPELINE=true`)
- `/publish` — MCP package approvals
- `/mvp` — Build briefs, generate docs, dispatch jobs

## Feature Flags

- `FF_JOBS_WORKER` — enable background worker runtime
- `FF_COST_TELEMETRY` — reserved for future paid-provider cost hooks
- `FF_EVALS` — unlock Eval Lab
- `FF_MAP_PIPELINE` — allow map build API + UI
- `FF_SOCIAL_PIPELINE` — allow social render/publish workflow

## Core Env Vars

- `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_KEY`
- `API_HMAC_SECRET` (optional HMAC on API calls)
- `OPENAI_API_KEY` (if routing to OpenAI via API manager)

## Worker Runtime

- Implement custom job handlers in `worker/jobs.ts` (`// EDIT HERE` markers).
- Run the worker with `node --loader ts-node/esm worker/jobs.ts` or bundle it.
- Historian and `audit` tables track state transitions automatically.

## Observability

- `/api/metrics.json` powers external dashboards.
- `/api/health` inserts composite checks into `service_health`.
- Alerts emit Historian `alert` events when thresholds exceed defaults.

## Policy & Security

- `middleware.ts` enforces API key scopes (`api_keys` table) and optional HMAC signatures.
- `lib/policy.ts` houses Ethics Council rules with `// EDIT HERE` guardrails for custom policy tuning.
- `docs/SECURITY.md` covers scopes, audit, and RLS reminders.

## Build Briefs & MCP Publish

- POST `/api/mvp/briefs` → capture briefs; `/api/mvp/generate` → create skeleton doc (data URL) stored in `build_briefs`.
- `/api/mcp/narconations/publish` stages Markdown bundles into `publish_packages`; approve via `/publish` UI.

## Legacy Ingest Route

- `/api/ingest/convert` still proxies to `md-convert` with optional Supabase storage. Set `MD_CONVERT_URL` + `INGEST_SUPABASE=true` to activate.
