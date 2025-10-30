# Operations — Workers, Scheduling, and Alerts

This document summarizes the production hooks introduced in the VibeOS adapter to support
semi-autonomous orchestration.

## Feature Flags

| Flag | Description | Default |
| --- | --- | --- |
| `FF_JOBS_WORKER` | Enables the background worker loop (`worker/jobs.ts`). | `false` |
| `FF_COST_TELEMETRY` | Collects and surfaces provider usage and service health telemetry. | `false` |
| `FF_EVALS` | Unlocks Eval Lab workflows. | `false` |
| `FF_MAP_PIPELINE` | Allows the map build pipeline to enqueue jobs. | `false` |
| `FF_SOCIAL_PIPELINE` | Enables social rendering + publish stubs. | `false` |

Set the flags in your deployment environment (Vercel/Next.js) using `true`/`false` string values.

## Worker Runtime

- Entry point: `examples/next-adapter/worker/jobs.ts`
- Run locally: `node examples/next-adapter/worker/jobs.ts`
- Vercel: provision a background function or use [Vercel Cron](https://vercel.com/docs/cron-jobs) to hit `/api/jobs/dispatch`
  for scheduled jobs. The worker polls the `jobs` table for `queued` entries and tracks lifecycle events via the Historian.

## Cron & Scheduler Hooks

Recommend two cron entries:

1. `*/5 * * * *` → `POST https://your-app.vercel.app/api/jobs/dispatch` with payload `{ "kind": "map:build" }`
2. `0 * * * *` → `POST https://your-app.vercel.app/api/metrics/refresh` (future hook) to snapshot daily telemetry.

For **n8n** users, configure a webhook node that forwards job payloads to `/api/jobs/dispatch` with the appropriate API key scope.

## Alerts

- `/api/health` probes provider availability and persists records in the `service_health` table.
- When error rates or costs spike, historian `alert` events are emitted (see `lib/telemetry/metrics.ts`).
- Extend the alert hooks to notify Slack/email by watching the `events` table for `alert` kinds.

## Historian Integration

Every job lifecycle emits an event (`job.queued`, `job.running`, `job.done`, `job.error`) for visibility across the studio dashboards.

## USE_MOCKS

If `USE_MOCKS=true`, the worker and telemetry endpoints gracefully fall back to deterministic mock payloads so the
Vercel build remains green without external credentials.
