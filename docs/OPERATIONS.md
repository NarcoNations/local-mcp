# Operations — Workers, Cron, and Alerts

This adapter ships with opt-in workers controlled via feature flags. Toggle the following environment variables (`true`/`false`) before deploying:

- `FF_JOBS_WORKER` — enables the background poller in `examples/next-adapter/worker/jobs.ts`.
- `FF_MAP_PIPELINE` — unlocks map build jobs + policy gates.
- `FF_SOCIAL_PIPELINE` — enables social rendering + publishing stubs.
- `FF_COST_TELEMETRY` — surfaces provider usage + service health dashboards.
- `FF_EVALS` — turns on Eval Lab endpoints + leaderboard UI.

## Worker Runtime

The worker polls the `jobs` table every few seconds and routes to handlers based on `kind`. When deploying to Vercel, run the worker as a separate Node process (e.g. `vercel cron` background function or a persistent container) with `FF_JOBS_WORKER=true`.

```
node -r dotenv/config examples/next-adapter/worker/jobs.ts
```

Each lifecycle transition writes to Historian (`events` table) and updates `jobs.status` (`queued → running → done|error`).

## Dispatch + Cron

- `/api/jobs/dispatch` enqueues jobs; protect with API keys scoped to `admin:*`.
- Vercel Cron: schedule `POST https://<host>/api/jobs/dispatch` with job payloads for periodic tasks (e.g. map refresh).
- n8n: configure outgoing webhook → `/api/jobs/dispatch` or domain-specific stubs (`/api/social/render`).

Documented cron suggestions:

| Cadence | Endpoint | Purpose |
| ------- | -------- | ------- |
| hourly  | `/api/metrics.json` | cache-bust dashboards |
| daily   | `/api/map/build`    | refresh primary layer |
| weekly  | `/api/social/render`| generate teaser assets |

## Alerts

Health telemetry writes to `service_health`. When `error_rate` or costs breach thresholds, emit Historian alerts (stubbed in handlers). Extend by forwarding Historian `alert` events to Slack, email, or PagerDuty.

## Local Safety Nets

- Set `USE_MOCKS=true` to run without Supabase credentials. Mock datasets power metrics, evals, and policy views.
- Provide `NEXT_PUBLIC_DEMO_KEY=demo-key` for local UI buttons (pairs with mock API-key validation).

Keep environments mobile-first: every dashboard is designed responsive for phone → cinematic desktop layouts.
