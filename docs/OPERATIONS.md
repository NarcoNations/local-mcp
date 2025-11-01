# Operations — Workers, Cron, Alerts

This stack ships with a lightweight job runtime and supporting observability so you can orchestrate research, publishing, and evaluation tasks without leaving free-tier constraints.

## Worker Runtime

- Enable the worker by setting `FF_JOBS_WORKER=true` alongside `SUPABASE_URL` and `SUPABASE_SERVICE_KEY`.
- Run the polling loop via `node examples/next-adapter/worker/jobs.ts` (wrap with pm2/forever in production).
- Job kinds shipped: `convert`, `embed`, `search-index`, `social:render`, `map:build`, `publish:site`.
- Historian receives `job.queued`, `job.done`, and `job.error` events for every transition.

## Dispatch API

- POST `/api/jobs/dispatch` with an API key that has `admin:*` scope to enqueue work.
- Example payload:
  ```json
  {
    "kind": "map:build",
    "payload": { "layer": "crime-index", "source_url": "https://example.com/crime.geojson" }
  }
  ```

## Scheduler Hooks

- Vercel Cron: schedule `https://<app>/api/health` (5 min) and `https://<app>/api/jobs/dispatch` (custom tasks) to keep the system warm.
- n8n/webhooks: the social pipeline accepts queued payloads and can forward to n8n when ready.

## Alerts & Health

- `/api/health` records latency snapshots into `service_health`.
- When costs or error rates spike, Historian emits `alert` events (extend `lib/observability.ts` for vendor hooks).
- Pull `/api/metrics.json` for dashboards; `/metrics` renders cost + latency widgets.

## Map + Social Pipelines

- Map jobs rely on `map_layers`, `map_tiles`, and `map_features` tables; builds output PMTiles references.
- Social jobs stage entries in `social_queue` and render assets in `social_assets`; publishing remains stubbed for n8n integration.

## MCP Publishing

- `/api/mcp/narconations/publish` stages Markdown + asset bundles in `publish_packages`.
- Approvals happen via `/publish` UI or POST `/api/mcp/narconations/approve`.

Keep feature flags off in environments without the relevant credentials to preserve a free-tier footprint.
