# Codex Build Prompt — Phase 2 (M2): VibeOS Core + UI Integration

> **Objective**: Build Phase 2 on top of Phase 1 (ingest → embeddings → search → API Manager → Historian) and the **Ultimate OS Dashboard** UI. This phase productionises the pipelines, adds multi‑provider API Manager, prompt+research systems, background jobs, department dashboards, and MCP adapters for NarcoNations.com/.org — while keeping a free‑tier posture and clean tokens-only design.

Repo / Branch
- repo: **NarcoNations/local-mcp**
- base: **main** (if PRs from Phase 1 and the UI branch are not merged, checkout their heads and rebase; otherwise continue)
- new branch: **build/m2-vibeos-core-ui-integration**

Assumptions
- Next.js 14 App Router + TypeScript in `examples/next-adapter/`
- Supabase (DB/Storage) + pgvector; Xenova for local CPU embeddings
- Phase 1 endpoints exist (convert, chatgpt ingest, search stub), UI shell from UI M1
- No hardcoded hex anywhere (tokens only), a11y‑first, mobile‑first

────────────────────────────────────────────────────────
SCOPE — Deliverables (ship in this order)
────────────────────────────────────────────────────────

0) **Sync & Sanity**
- Ensure `examples/next-adapter` compiles. If UI M1 branch exists, rebase or merge it first into this branch.
- Add/keep Tailwind + tokens (Narco Noir / VibeLabz Clean). Do not duplicate configs.

1) **API Manager v1 (multi‑provider, caching, DTOs)**
- Package: `packages/api-manager`
  - Add providers: **Finnhub (free)**, **Tiingo (free tier)**, keep Alpha Vantage; placeholder for Polygon (guard 403).
  - Normalise responses via **DTOs** using **Zod**: `QuoteDTO`, `TimeseriesDTO`, `CompanyDTO`.
  - Add **in-memory LRU cache** (TTL default 60s) + optional **Supabase cache** table (`api_cache`: key, provider, payload, ts).
  - Enforce **rate‑limit backoff** and provider‑specific retry logic.
  - Add `GET /api/feeds/:provider` route(s) in adapter that call the package and return normalised DTOs.
  - Historian emit: `api.feed` with timing + status.

2) **LLM Router v1 (policy + runs)**
- Extend `packages/api-manager/src/providers/llm/router.ts`:
  - Policy config (TS or YAML in `config/llm-routing`): model preferences per task, cost/latency caps, local fallback.
  - Add `/api/llm/run` endpoint → input `{ task, prompt, modelHint? }`, persist **prompt_runs** table (id, task, model, prompt_hash, cost_est, latency_ms, ok, output_preview).
  - Historian: `api.llm` events for each run.

3) **Prompt Library v1 (CRUD + tests + scoring)**
- DB: tables `prompts` (id, title, body_md, tags[], version, created_at, updated_at), `prompt_runs` (already above).
- UI: `/library/prompts` list/detail/create/edit; version bump on save; tag chips; “Run” opens modal → choose models (multi‑select) → run via `/api/llm/run` in parallel; show outputs side‑by‑side; allow 1–5 scoring + notes; save to `prompt_runs`.
- Linter: simple checks (length, forbidden phrases, missing variables).

4) **Research Engine v1 (plan → notes → export)**
- Endpoint: `/api/research/run` accepts `{ query, objectives[], mode: 'academic'|'narrative' }`; produces structured payload `{ plan, facts[], insights[], sources[] }` using LLM router.
- UI: `/research` shows editable plan + results; buttons: “Export to Obsidian ZIP” (bundle MD files with front‑matter) and “Save to Knowledge” (create `knowledge` + `knowledge_files`).
- Historian: `research.run` with counts + duration.

5) **Ingest Hardening (background jobs + idempotency)**
- Add **job queue** strategy: for M2, implement a simple **Supabase table `jobs`** (id, kind, payload, status, started_at, finished_at, error) + `/api/jobs/:id` poller; provide optional **n8n webhook integration** for external processing.
- Convert `/api/ingest/convert` and `/api/knowledge/index` to create a job and return `{ jobId }` by default; keep `?inline=true` to run inline for dev.
- Idempotency: compute content hash; skip duplicate inserts/embeddings for identical content.
- Filetype: detect MIME + extension, reject unknowns gracefully.
- Error handling: structured error shapes; Historian `error` events with `meta`.

6) **Embeddings & Search v1**
- Move embeddings generation to background job (`kind='embed'`) using Xenova MiniLM.
- Add **FTS fallback** using Postgres `to_tsvector` on `messages.text` and/or `knowledge_files` (optional path).
- Search endpoint `/api/search` supports filters: `type=['knowledge'|'messages']`, `date_from`, `date_to`, `tags[]`, `limit`, `offset`; return highlighted snippets.
- UI: `/search` add filters + highlight + provenance links (open source doc/conv in context).

7) **Historian v1**
- Add `/timeline/[id]` detail page; event `meta` pretty viewer; link back to source entity (knowledge slug, job id, etc.).
- Add `/metrics` page: simple KPI tiles (ingest per day, avg latency, cache hit rate, LLM cost est.).
- Retention: add `events_retention_days` config; cleanup job (cron-ready function) with soft cap.

8) **MCP Adapters for NarcoNations.com / .org**
- Create `examples/next-adapter/app/api/mcp/narconations/[action]/route.ts` with actions: `index`, `search`, `publish` (stubs ok).
- Secure with `X-API-Key` header; key list from env.
- Implement `index`: accepts URL → fetches, converts via md‑convert, saves as knowledge; `search`: proxy `/api/search`; `publish`: TODO stub (will target CMS later).

9) **Playgrounds (Map + Social)**
- **Map**: integrate **MapLibre** (no API keys) with local PMTiles demo; layer toggles (routes, cities), camera controls, click tooltip (placeholder).
- **Social**: template presets (thumbnail, short, post) with form → POST to `/api/social/queue` (stub) which would forward to n8n later.

10) **Department Dashboards**
- Add routes under `/dept/*`: `sales`, `marketing`, `manufacturing`, `strategy-board`, `ideas-lab`.
- Each page: 3–6 tiles with KPIs (mock or real if available), quick actions (open workroom lane, create MVP brief, schedule research run).
- Use tokenised components; charts with lightweight lib (if used, obey tokens; avoid fixed colors).

11) **CI/CD & Tests**
- GitHub Action: typecheck + build + (optional) Playwright smokes on adapter pages (dashboard loads, command palette opens, ingest form renders).
- Add ESLint + Prettier configs aligned with repo.
- Save UI **screenshots** (desktop/mobile for dashboard & timeline) to `examples/next-adapter/public/_checks/` and attach in PR description.

12) **Security & Config**
- Zod validate all API payloads.
- Add CORS guard for API routes (local + Vercel domain allowlist).
- Supabase RLS templates for new tables (`api_cache`, `jobs`, `prompts`, `prompt_runs`).
- Rate limit `/api/*` with simple token bucket per IP (in-memory; env override).

13) **Docs**
- Update `docs/SPEC-INDEX-VIBEOS.md` with Phase 2 modules.
- Add `docs/OPERATIONS.md` (jobs, retention, rate limits, caches).
- Update `examples/next-adapter/README.md` with Phase 2 quickstart, envs, and smoke tests.

────────────────────────────────────────────────────────
ACCEPTANCE CRITERIA (must pass)
────────────────────────────────────────────────────────
- **Build & A11y**: Vercel build passes; no a11y criticals; keyboard navigation for shell, palette, forms.
- **API Manager**: `GET /api/feeds/alpha|finnhub|tiingo` returns normalised DTOs; 60s cache works; backoff on 429; Historian entries emitted.
- **LLM Router**: `/api/llm/run` persists `prompt_runs` with latency + model; policy file respected (local fallback when hint includes 'local' or on provider failure).
- **Prompt Library**: CRUD + versioning; run multi‑model; scoring saved; linter flags basic issues.
- **Research Engine**: returns structured plan/facts/insights/sources; export ZIP downloads; Save to Knowledge writes records.
- **Ingest**: convert + index routes can enqueue jobs and poll status; `?inline=true` still works in dev; idempotency prevents duplicate embeds.
- **Search**: filters work; highlights present; opens provenance context; p95 < 500ms on small corpora.
- **Historian**: detail pages render; metrics page shows computed KPIs; retention job available.
- **MCP**: `index` creates knowledge from a URL; `search` proxies; `publish` stub secured by API key.
- **Playgrounds**: Map shows PMTiles demo; Social enqueues stub requests.
- **Departments**: Pages load with tokenised KPIs + quick actions; accessible and responsive.
- **Screenshots**: 4 PNGs updated under `public/_checks` and linked in PR.

────────────────────────────────────────────────────────
GIT / PR HYGIENE
────────────────────────────────────────────────────────
- Commits (examples):
  - feat(api-manager): add finnhub/tiingo drivers + DTOs + cache
  - feat(llm): router policy + prompt_runs + /api/llm/run
  - feat(prompts): CRUD UI + scorer + linter
  - feat(research): plan→export + save to knowledge
  - feat(ingest): jobs + idempotency + inline switch
  - feat(embeddings/search): job runner + filters + highlight
  - feat(historian): detail + metrics + retention
  - feat(mcp): narconations adapters (index/search/publish)
  - feat(playgrounds): maplibre + social queue
  - feat(dept): dashboards (sales/marketing/manufacturing/strategy-board/ideas-lab)
  - chore(ci): github actions + lint + screenshots
  - docs: ops guide + spec index updates
- Open PR title: **build(m2): VibeOS Core+UI — API manager, LLM router, prompts, research, jobs, search, MCP, depts**
- Mention dependency: “Built to merge cleanly with Phase 1 and UI M1 branches.”

Notes
- Keep deps lean; free‑tier only.
- No hardcoded hex; tokens only.
- Respect `prefers-reduced-motion`; provide accessible focus states.
- Provide `// EDIT HERE` markers where branding, tokens, or model policies can be tweaked.
