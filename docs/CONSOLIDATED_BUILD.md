# VibeOS — Roadmap + Spec Kit + Consolidated Build (Oct 2025)

> **Scope:** Unify Local MCP (mcp-nn), Prompt Library, Research Engine, One‑Shot‑MVP, Persona Squad, Archivist/File Manager, Multi‑format Output, Whiteboard/Code Mixer/Showroom, Crime‑Map Playground, Social Playground, API Manager (TradeOps + LLMs), and Historian — into an autonomous studio stack.

## 1) TL;DR / Decision
Ship VibeOS as a layered system: **Agent Layer over Knowledge + Ops**, with modular UIs (Whiteboard, Showroom, Playgrounds) and a **Spec‑Kit canon** to keep it consistent. Build it repo‑first in `local-mcp`, then integrate with NarcoNations(.com/.org), TradeOps API manager, and dev tools (Code Mixer + Component Lib).

---

## 2) Why / Trade‑offs
- **Why now:** You already have the bones (MCP, Showroom, Spec‑Kit, map work). Consolidating gives compounding velocity.
- **Trade‑offs:**
  - Broader scope → more moving parts. Fix via strict **Spec‑Kit**, cadence, and acceptance criteria.
  - Local vs Cloud LLMs → route by task sensitivity, cost, and latency.
  - Fancy UIs vs delivery → ship minimum viable surfaces, iterate.

---

## 3) System Architecture (Layers)
| Layer | Role | Examples |
|---|---|---|
| **User** | UI, dashboards, whiteboard, playgrounds | Whiteboard OS, Showroom, Social/Crime‑Map playgrounds |
| **Agent** | Personas, teams, modes | Strategy Board, Ideas Lab, PM, FE/BE, DevOps, Research, Ethics, Historian |
| **Knowledge** | Sources + embeddings | Obsidian, Supabase, Git repos, Uploads, Dossiers |
| **Ops** | Automation + orchestration | n8n, Vercel Cron, GitHub PR flows, MCP tools |
| **Compute** | Local + cloud models | gguf (llama.cpp/ollama), OpenAI/Perplexity, rerankers |
| **Security** | Auth, scopes, vault | API tokens, model scopes per persona/task |

---

## 4) Product Surfaces
### 4.1 Whiteboard OS
Spatial command surface → sketch → spec → tasks.
- Features: node graph, swimlanes (SB/IL/PM/FE/BE/DevOps/Research/Copy/Ethics), prompt panels, export to Spec‑Kit.
- Actions: 
  - `Export → SPEC-KIT` (creates/updates docs)
  - `Hand off → One‑Shot‑MVP`
  - `Route → Persona Panel` (ship/audit)

### 4.2 Code Mixer + Component Library + Showroom
- Rapid FE layouting from tokens.
- A11y checks, simple e2e tests.
- Auto add to `/showroom` index.

### 4.3 Prompt Library + Optimiser
- Save/score/lint/AB test prompts.
- Persona‑aware rewrites; embeddings + tags.
- CLI examples:
```bash
vibe prompt save "Narco tone explainer"
vibe prompt optimize ./prompt.md
vibe prompt test --local gguf --openai gpt-5
```

### 4.4 Research Engine
- Query → research plan → structured notes (Facts / Insights / Sources).
- Modes: Academic / Narrative.
- Export: Obsidian, DOCS/, Supabase table, Dossier MD.

### 4.5 One‑Shot‑MVP Generator
- Input: natural language → build spec + scaffold (ARCHITECTURE.md, ROUTES.md, DATA_MODEL.md, API + tests, components, PR stub).
- Option: Codex hand‑off.

### 4.6 Persona Engine
- Teams: PM, System Architect, FE, BE, DevOps, Data/AI, Research, Copy/Brand, Mkt Ops, Ethics, Archivist, Librarian, File Manager.
- Modes: Solo / Panel / Offensive (ship) / Defensive (audit).

### 4.7 Archivist + File Manager
- Sources: Obsidian, Supabase, local vault, repos, uploads, whiteboard snaps, showroom.
- Ops: tag, chunk, embed, backup, normalize, smart link.

### 4.8 Multi‑format Output Transformer
- Any input → copy deck, exec brief, tweet thread, blog, datasheet, PRD, Notion/Obsidian page, code comments, MD doc pack.

### 4.9 Crime‑Map Playground
- MapLibre/PMTiles; seed data; route heat; filters; composes with NarcoNations.org content.

### 4.10 Social Playground
- Thumbnails, shorts/long form, copy bundles; later pipeline to auto‑posting via n8n.

### 4.11 Historian
- Time‑stamped log of pivots, milestones; snapshots of artefacts; diff heatmap per repo.

---

## 5) Spec‑Kit — New Docs
Create under `/docs/spec-kit/`:
- `17-AGENT_TEAM.md` — persona roster + modes
- `18-PROMPT_LIBRARY.md` — vault, optimizer, scoring
- `19-RESEARCH_ENGINE.md` — query → structured intelligence
- `20-MVP_GENERATOR.md` — one‑shot build system
- `21-ARCHIVIST.md` — file mgmt + ingest brain
- `22-MULTIFORMAT_OUTPUT.md` — doc transformer
- `23-LLM_ROUTING.md` — local/cloud selection stack
- `24-WHITEBOARD_OS.md` — spatial command system

Also add: `SPEC-INDEX-VIBEOS.md` to index these and cross‑link to existing spec stack.

---

## 6) API Manager (TradeOps + LLMs)
- **Goal:** unifies free/OSS market data feeds + LLM providers with rate/plan awareness.
- **Feeds:** AlphaVantage, Finnhub (free), Tiingo/EODHD (free tiers where possible).
- **LLMs:** local gguf (via ollama/llama.cpp) + OpenAI/Perplexity with routing policy.
- **Rules:** free tier by default; per‑task model map; retries/backoff; caching.

---

## 7) Integration Targets
- **NarcoNations.com / .org:** components, narrative tie‑ins, ethics/education framing.
- **TradeOps:** API Manager, prompt library reuse, Social Playground for market content.
- **Code Mixer + Comp‑Lib:** consistent tokens, Showroom docs, PR stubs.

---

## 8) Detailed Build Plan (Milestones)
### M1 — Repo & Docs (Week 1)
- Branch: `spec/vibeos-docs-m1`
- Add `/docs/spec-kit` new files + `CONSOLIDATED_BUILD.md` (this doc).
- Seed Prompt Library schema (Supabase + MD mirror).
- Basic Historian log.

### M2 — Agent Layer & Routing (Weeks 2–3)
- Persona engine (SB/IL/PM/FE/BE/DevOps/Research/Copy/Ethics/Archivist/Historian).
- Model router (local ↔ cloud) with policy YAML.

### M3 — Whiteboard OS + Showroom Hooks (Weeks 3–4)
- Minimal whiteboard (nodes, lanes, export to Spec‑Kit).
- Showroom autodiscovery + A11y/test hooks.

### M4 — Prompt Library + Research Engine (Week 5)
- CLI + UI; scoring + lint.
- Research: plan → notes (Facts/Insights/Sources).

### M5 — One‑Shot‑MVP + Playgrounds (Weeks 6–7)
- MVP generator scaffold + PR stub.
- Crime‑Map + Social playgrounds (MVP).

### M6 — API Manager + Ops (Week 8)
- Free‑tier feeds + retries/caching.
- n8n workflows; Vercel Cron.

---

## 9) Acceptance Criteria (per Milestone)
- Documentation: up‑to‑date Spec‑Kit + CHANGELOG.
- Tests: unit on routers/utils; e2e smoke for UIs; lints pass.
- Performance: fast renders; minimal deps; no hardcoded hex; tokens only.
- A11y: keyboard nav, focus states, aria where needed.

---

## 10) Risks & Mitigations
- Scope creep → lock scope via milestone DoD + SB approvals.
- Rate limits → cache + backoff + queues.
- Model drift → router + evaluator tests; prompt lints.
- Fragmentation → Historian + Archivist enforce structure.

---

## 11) Next Steps
1) Create branch `docs/vibeos-cbd-oct2025`.
2) Add this file and Spec‑Kit stubs.
3) Open PR; request review from Strategy Board + Ops Coordinator.
4) Merge → kick off M1 tasks.
