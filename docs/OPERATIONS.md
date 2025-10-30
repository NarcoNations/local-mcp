# Operations Guide — VibeOS Adapter (M3)

## Workers & Scheduling
- `examples/next-adapter/worker/jobs.ts` polls the Supabase `jobs` table when `FF_JOBS_WORKER=true`.
- Queue jobs via `POST /api/jobs/dispatch` with scope `admin:*`.
- Recommended cadence:
  - **Vercel Cron** (UTC):
    - `*/5 * * * *` → `https://your-app.vercel.app/api/health`
    - `*/10 * * * *` → `https://your-app.vercel.app/api/map/build` with pre-configured payload (n8n proxy)
  - **n8n** (optional): trigger render/publish webhooks for social campaigns.
- Worker writes Historian events on job start/finish/error and records durations.

## Feature Flags (env)
- `FF_JOBS_WORKER` — enable worker runtime.
- `FF_COST_TELEMETRY` — store provider usage + health metrics.
- `FF_EVALS` — enable live LLM calls in evals (mocked when false).
- `FF_MAP_PIPELINE` — allow `/api/map/build` to queue jobs.
- `FF_SOCIAL_PIPELINE` — allow `/api/social/render` pipeline.

## Alerts & Health
- `/api/health` performs lightweight HEAD checks and writes to `service_health`.
- Cost spikes and error budgets (computed in `/metrics`) should be watched; hook Historian alerts into Slack/Email downstream.
- `docs/EVALS.md` and `docs/SECURITY.md` outline dataset and scope guardrails.

## Storage & Tables (Supabase)
Key tables touched in M3:
- `jobs`, `provider_usage`, `service_health`, `evals`, `eval_runs`, `policy_checks`, `map_layers`, `map_tiles`, `map_features`, `social_queue`, `social_assets`, `publish_packages`, `build_briefs`, `api_keys`, `audit`.

Run migrations via Supabase SQL editor or migration tooling; ensure RLS is enabled where appropriate.
