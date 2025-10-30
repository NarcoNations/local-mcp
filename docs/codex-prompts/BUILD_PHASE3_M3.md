# Codex Build Prompt — Phase 3 (M3): Production + Autonomy

> **Objective**: Evolve VibeOS from working MVP (M1) + integrated Core/UI (M2) into a **production-grade, semi-autonomous studio stack**. Add resilient job orchestration, cost & model telemetry, map + social publishing pipelines, policy gates (Ethics Council), stronger security, and advanced evaluations. Keep free-tier posture with optional paid toggles guarded by env flags.

Repo / Branch
- repo: **NarcoNations/local-mcp**
- base: **main** (merge M1 + UI + M2 first or rebase this branch atop their heads)
- new branch: **build/m3-production-autonomy**

Assumptions
- Next.js 14 App Router + TS in `examples/next-adapter/`
- Supabase DB/Storage + pgvector; Xenova embeddings for CPU
- Tailwind tokens (Narco Noir / VibeLabz Clean) present; a11y-first, mobile-first
- M2 delivered: API Manager v1, LLM Router v1, Prompt Library v1, Research v1, Jobs table, Search v1, Historian v1, MCP stubs, Dept dashboards

────────────────────────────────────────────────────────
SCOPE — Deliverables (ship in this order)
────────────────────────────────────────────────────────

0) **Sync & Safety**
- Ensure branch compiles on CI. Keep `USE_MOCKS` flag path for any missing upstream creds.
- Add feature flags via env (boolean strings):
  - `FF_JOBS_WORKER` (enable worker runtime)
  - `FF_COST_TELEMETRY`
  - `FF_EVALS`
  - `FF_MAP_PIPELINE`
  - `FF_SOCIAL_PIPELINE`
  - default all **false**

1) **Job Orchestration v2 (Workers + Scheduler)**
- Create a minimal **job runner** under `examples/next-adapter/worker/jobs.ts` that polls `jobs` table and executes handlers for kinds: `convert`, `embed`, `search-index`, `social:render`, `map:build`, `publish:site`.
- Add a small **dispatcher** `/api/jobs/dispatch` to enqueue jobs (secured by API key).
- Add **scheduler hooks** for Vercel Cron (document crons) and optional **n8n** webhooks.
- Job lifecycles: `queued→running→done|error`; write durations; Historian events for state transitions.

2) **Cost, Latency & Health Telemetry**
- DB tables: `provider_usage` (provider, model, op, tokens_in, tokens_out, cost_est, latency_ms, ts, meta), `service_health` (name, status, latency_p95, error_rate, ts).
- Wire telemetry in API Manager (feeds) + LLM Router (runs). Estimate costs using static maps per model/provider; aggregate daily.
- UI: `/metrics` expands to include cost charts (daily/weekly), latency percentiles, error budget.
- Export `/api/metrics.json` (public, sanitized) for external dashboards later.

3) **Model & Prompt Evaluations (Eval Lab v1)**
- Create `evals` table (id, name, type, dataset_ref, created_at) and `eval_runs` (id, eval_id, model, prompt_id?, started_at, finished_at, metrics jsonb).
- Add `/api/evals/run` to execute a small canned dataset against N models via LLM Router; compute simple metrics (BLEU-ish for exactness; length; latency; judge-Lite prompt).
- UI: `/evals` page to pick eval set + models, run, and display a **leaderboard** with sortable metrics; link to prompt versions used.

4) **Policy Gates (Ethics Council) + Shadow Self**
- Add `policy_checks` module (TS) that can be called before publish or auto-actions; rules include: content safety (no illegal instructions), brand/ethics keywords, crisis messaging injectors.
- `Shadow Self` mode: counter-argument/risks summary injected into Historian for actions with scope `publish:*` and `social:*`.
- UI surface: when FF enabled, `/policy` shows last 20 gated actions with pass/fail + reasons; allows re-run (manual approval).

5) **Map Pipeline (Crime Map) v1**
- Schema: `map_layers` (id, name, type, source_url, updated_at, status), `map_tiles` (id, layer_id, pmtiles_url, built_at, meta), `map_features` (id, layer_id, feature jsonb, bbox, updated_at).
- Add `/api/map/build` job to fetch a GeoJSON (from S3 or local), validate, simplify (topojson if needed), and produce a **PMTiles** (local generation with tilejson stub).
- UI: `/play/map` upgraded with layer list, toggles, and “Build Tiles” button (enqueues job).
- Provenance & Historian events on build start/finish; retries on failure with exponential backoff.

6) **Social Publishing Pipeline v1**
- Schema: `social_queue` (id, template, payload jsonb, status, scheduled_at, posted_at, error), `social_assets` (id, queue_id, url, kind).
- `/api/social/render` job renders images (HTML→PNG via headless Chromium) and optional video slate (image+audio stub).
- `/api/social/publish` is a **stubbed** poster that logs intent to Historian; integration to be done later via n8n.
- UI: `/play/social` adds template preview, schedule field, render button (enqueues), publish button (stub).

7) **MCP Publishing for NarcoNations.com/.org v2**
- Implement `/api/mcp/narconations/publish` to stage a **Publish Package**: { content_md, assets[], meta } with policy checks; save to Storage; emit Historian event with link.
- Add `/publish` page: lists ready packages with approve button (calls policy + marks approved). Export endpoint for the CMS to fetch.

8) **Whiteboard → Product → Build Hand‑off**
- Workroom lane export now creates a **Build Brief** entity and persists it (`build_briefs`) with fields: title, lanes json, acceptance criteria, owner, status.
- Add `/api/mvp/generate` to transform a brief into a ZIP with skeleton docs (improve stub), attach to `build_briefs` and Historian.
- UI: `/mvp` shows list of briefs with status; “Send to Jobs” enqueues `publish:site` or `search-index` depending on type.

9) **Access, Scopes, and Audit**
- Introduce API key scopes: `feeds:*`, `llm:*`, `ingest:*`, `publish:*`, `social:*`, `map:*`, `admin:*`. Table `api_keys` (id, name, scopes[], created_at, last_used_at).
- Middleware validates scope for `/api/*`. HMAC signature optional for server-to-server calls.
- Audit log table `audit` (ts, user/api_key, action, resource, meta). Historian mirrors critical audit events.

10) **Observability & Alerts**
- Simple `/api/health` checks provider availability; record to `service_health`.
- Add alerting stubs: when error_rate > threshold or cost spikes, insert Historian `alert` events (later wire to email/webhook).

11) **Testing & Load**
- Expand Playwright flows: dashboard smoke, ingest → job → finish, search with filters, prompt run modal, eval run, policy gate fail/pass.
- Optional: include a `k6` script under `tools/load/` for `/api/search` and `/api/llm/run` with low concurrency (document only; don’t run in CI).

12) **Docs & DX**
- `docs/OPERATIONS.md`: add workers, cron, alerts.
- `docs/SECURITY.md`: API key scopes, HMAC, audit, RLS reminders.
- `docs/EVALS.md`: how to define small datasets and run leaderboards.
- Update adapter README with new pages and feature flags.

────────────────────────────────────────────────────────
ACCEPTANCE CRITERIA (must pass)
────────────────────────────────────────────────────────
- **Workers & Jobs**: With `FF_JOBS_WORKER=true`, the worker polls and processes jobs; API dispatch enqueues and status transitions write to Historian.
- **Telemetry**: `/metrics` shows daily cost estimates, latency percentiles, and provider health cards; `/api/metrics.json` returns sanitized metrics.
- **Evals**: `/evals` runs on a small dataset over ≥2 models; leaderboard renders metrics; results persisted in `eval_runs`.
- **Policy**: Gated actions (publish/social) are evaluated; fail blocks action and logs reasons; `/policy` lists pass/fail with re-run.
- **Map**: `/play/map` can enqueue a build and show tile availability; `map_layers` updated; Historian records build lifecycle.
- **Social**: `/play/social` can render assets (PNG) and queue a publish stub; queue status visible; Historian records.
- **MCP Publish**: `/publish` shows packages; approve writes status and links to stored bundle; CMS can fetch the package via a signed URL.
- **Access & Audit**: `/api/*` routes reject missing scope; audit entries visible; critical actions mirrored in Historian.
- **Tests**: Core Playwright smokes pass locally; CI builds succeed.
- **Docs**: New docs present and accurate.

────────────────────────────────────────────────────────
GIT / PR HYGIENE
────────────────────────────────────────────────────────
- Commit groups (example):
  - feat(jobs): worker + dispatcher + historian lifecycle
  - feat(metrics): provider usage + service health + metrics API
  - feat(evals): datasets + runs + leaderboard UI
  - feat(policy): ethics gate + shadow self + /policy UI
  - feat(map): pmtiles build job + UI toggles
  - feat(social): render queue + assets + publish stub
  - feat(mcp): publish packages + approvals + signed fetch
  - feat(workroom/mvp): briefs persistence + generate upgrade
  - feat(security): API key scopes + HMAC + audit
  - test(e2e): Playwright flows
  - docs: operations, security, evals, readme updates
- Open PR title: **build(m3): Production + Autonomy — workers, telemetry, evals, policy, map/social, publish, audit**

Notes
- Free-tier posture; optional paid providers must be feature‑flagged off by default.
- No hardcoded hex; tokens only.
- Respect `prefers-reduced-motion`; keep a11y strong.
- Provide `// EDIT HERE` markers where policies, costs, and dataset definitions can be tuned.
