# Codex Build Prompt — UI: VibeOS Ultimate Dashboard (M1)

> **Objective**: Transform the adapter app into a cinematic, responsive, token‑driven **OS Dashboard** that surfaces every major system (Ingest, Corpus, Knowledge, Search, Historian, API Manager, Workroom, MVP, Prompt Library, Research, Map, Social). Ship a cohesive UI shell, widgets, and micro‑interactions. Wire to existing endpoints where available; use typed mocks elsewhere.

Repo / Branch
- repo: **NarcoNations/local-mcp**
- base: **feat/ingest-pipeline-m1** (fallback: main if missing)
- new branch: **build/ui-vibeos-dashboard-m1**

Stack / Constraints
- Next.js 14 (App Router) + TypeScript
- Tailwind CSS with **design tokens** (Narco Noir / VibeLabz Clean) — no hardcoded hex
- Framer Motion for micro‑interactions; respect `prefers-reduced-motion`
- Radix primitives optional (Tooltip/Popover/Dropdown) — keep deps minimal
- A11y: keyboard‑first navigation, visible focus rings, aria labels, landmark roles
- Mobile‑first, responsive to ≥320px; desktop wide up to 1440+

Design DNA (tokens)
- **Narco Noir (Dark)** — black base, deep red accents, neon‑cyan highlights, muted gold for emphasis
- **VibeLabz Clean (Light)** — white/soft grey base, subtle cyan accents, soft shadow/glass depth
- Theme toggled by `<html class="theme-dark">` vs `theme-light`; tokens via CSS variables loaded in `globals.css`

Deliverables
1) **Tailwind + Tokens**
   - Add Tailwind (if not already) to `examples/next-adapter` with `tailwind.config.ts`, `postcss.config.js`, `app/globals.css`
   - Define CSS variables for both themes (no hex literals in components)
   - Utility classes: focus rings, surface elevations, card borders, glass variant (light theme only)

2) **AppShell 2.0**
   - Replace basic header with a modular shell: **Sidebar Dock** + **Top Command Bar** + **Workspace**
   - Sidebar: icons + labels for Dashboard, Ingest, Corpus, Knowledge, Search, Historian, API Manager, Workroom, MVP, Prompts, Research, Map, Social, Settings
   - Command Bar: left = breadcrumb / page title; center = global search input; right = theme toggle + user stub + Cmd+K palette button
   - Responsiveness: collapsible sidebar (auto on mobile), sticky top bar, content uses CSS grid

3) **Dashboard page** (`/`) — widget grid (cards)
   - **Quick Actions**: Upload file (→ /ingest), Paste Chat Export URL (→ /corpus), Index Knowledge (→ /knowledge), New MVP Brief (→ /mvp)
   - **Historian Now**: last 10 events (source, kind, ts), filter chips
   - **Ingest Status**: last 5 conversions (slug, files, storage flag)
   - **Corpus Stats**: conversations/messages counts
   - **Knowledge**: latest indexed slugs + “Index” CTA
   - **Search**: compact search box → navigates to /search?q=
   - **API Manager**: Alpha probe form (symbol+fn) and LLM probe (task/prompt)
   - **Playgrounds**: Map and Social entry tiles
   - **Workroom & MVP**: CTA tiles (open panels)
   - Cards animate in (staggered fade/raise), hover affordances, reduced‑motion safe

4) **Feature pages** (style pass + forms)
   - **/ingest**: file drop zone → POST /api/ingest/convert; success toast + link to Historian
   - **/corpus**: URL form → POST /api/ingest/chatgpt; show counts; guard rails for big files
   - **/knowledge**: table of knowledge (slug, created_at, files) + Index buttons calling /api/knowledge/index
   - **/search**: full‑width search bar; results list with snippet, score, source (knowledge_id/slug); empty state
   - **/timeline**: filters (source, kind), pager, relative times; pill badges; monospace ts in tooltip
   - **/api-manager**: two panels (Feed probe, LLM probe) with result viewer
   - **/workroom**: lanes layout with draggable stickies (DOM‑only for now) + Export JSON button
   - **/mvp**: textarea + (optional) brief.json upload; POST to /api/mvp/generate (stub); modal with result summary
   - **/library/prompts**: list/detail with Run button (→ /api/llm) and linter placeholder
   - **/research**: query+objectives form → stubbed structured response (Facts/Insights/Sources)
   - **/play/map**: empty container with MapLibre placeholder message
   - **/play/social**: template selector (thumbnail/short/post) and enqueue stub

5) **Components** (under `examples/next-adapter/src/components`)
   - `Surface.tsx` — base panel with variants: subdued, elevated, glass (light only); accepts `as`, `title`, `toolbar`
   - `Stat.tsx` — compact stat block (label, value, delta)
   - `Card.tsx` — flexible card shell with header/content/footer slots
   - `Pill.tsx` — status chip (success/warn/error/info)
   - `Toolbar.tsx` — page/tool action bar with density control
   - `CommandPalette.tsx` — Cmd+K (list of routes, actions: upload file, new brief, search focus)
   - `Toast.tsx` — minimal toasts via context provider

6) **Hooks & Utils**
   - `useTheme()` — read/write html class + persist in localStorage
   - `usePrefersReducedMotion()`
   - `useShortcuts()` — register global shortcuts (Cmd+K to open palette; / to focus search)
   - `cn()` utility for class composition

7) **Motion**
   - Framer Motion variants: `fadeInUp`, `scaleIn`, `stagger`
   - Respect `prefers-reduced-motion` → no movement, only opacity

8) **Data wiring**
   - Where endpoints exist, call them; otherwise provide **typed mock data** in `/src/mocks` behind a `USE_MOCKS` flag (env or constant)
   - All fetches with error + loading states; never crash the page

9) **Testing & Screens**
   - Lighthouse check: no major a11y violations; contentful paint not regressing due to animations
   - Playwright (or Vitest) smoke for dashboard rendering and command palette open
   - Generate 4 screenshots: dashboard (desktop/mobile) + timeline (desktop/mobile) → `public/_checks/*.png` and reference in PR

10) **Docs**
   - Update `examples/next-adapter/README.md` → quickstart, theme switch, keyboard shortcuts, screenshots

Acceptance Criteria
- Compiles on Vercel; renders mobile→desktop well
- No hardcoded colors; tokens verified in CSS
- Keyboard shortcuts: Cmd+K palette; `/` focuses global search; `t` toggles theme
- Dashboard shows widgets with real data where available and mocks otherwise
- All pages reachable from sidebar and command palette
- A11y: visible focus rings; landmark usage; aria labels on actionable icons

Git Hygiene
- Commits in logical units:
  - chore(ui): add tailwind + tokens + globals
  - feat(shell): AppShell 2.0 (sidebar/topbar/workspace)
  - feat(dashboard): widgets + motions + quick actions
  - feat(pages): ingest/corpus/knowledge/search/timeline/api-manager
  - feat(workroom/mvp/prompts/research/play): placeholders + forms
  - chore(dx): README, screenshots, tests
- Open PR name: **ui(m1): VibeOS Ultimate Dashboard — shell, widgets, motions**

Notes
- Keep dependencies lean. Avoid shadcn codegen; prefer our own small components.
- If Tailwind already present, extend with tokens; do not duplicate.
- Use semantic HTML; `role="navigation"`, `role="search"`, `role="main"`.
- Provide `// EDIT HERE` comments where brand tokens or copy can be tweaked.
