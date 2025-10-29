# 17A — DEPARTMENTS (Org Sections)

> **Goal:** Give each major **department** a clear mission, roles (personas), inputs/outputs, KPIs, cadence, interfaces, and guardrails, so VibeOS agents can operate like a real studio.

**Departments covered:** Sales · Marketing · Manufacturing · Strategy Board · Ideas Lab

---

## 🔶 Common Format (used below)
- **Mission** – why this department exists.
- **Scope** – boundaries; what is / isn’t owned.
- **Roles (Personas)** – who actually does the work (VibeOps Deck).
- **Inputs** – what this team consumes.
- **Outputs** – artifacts/deliverables this team produces.
- **KPIs** – success metrics (quant + qual).
- **Cadence** – rituals/rhythms.
- **Interfaces** – upstream/downstream handoffs.
- **Risks & Guardrails** – failure modes + Clean Intent controls.
- **Acceptance Criteria** – DoD for shipped work.

---

## 🟧 Sales
**Mission:** Convert qualified interest into revenue on ethical terms; keep pipeline clean and forecasts real.

**Scope:** B2B/B2C direct sales, partnerships, retail/wholesale for NarcoNations; excludes ad spend (Marketing owns).

**Roles (Personas):**
- **Black Desk** (BizDev, licensing, B2B).
- **Marketing Ops** (handoff automation, attribution sanity).
- **Shadow CFO** (pricing & margin checks).
- **Ops Coordinator** (CRM hygiene, follow‑ups, cadence).

**Inputs:** MQL/SQL lists, campaign intel, product sheets, pricing models, legal templates, availability/stock.

**Outputs:** Pipeline dashboard, proposals/quotes, partner MOUs, order forms, weekly forecast, win/loss notes.

**KPIs:** SQL rate, win rate, cycle length, ACV, gross margin, churn/returns, lead source ROI.

**Cadence:** Daily pipeline sweep; Tue/Thu outreach blocks; Fri forecast; monthly retro on win/loss.

**Interfaces:**
- ← Marketing (MQL→SQL rules, campaign context).
- → Manufacturing (POs, demand signal, lead time).
- ↔ Strategy Board (pricing exceptions, enterprise terms).

**Risks & Guardrails:** Over‑discounting; channel conflict; misaligned promises → **Guardrails:** pricing floors, SLA matrix, ethics checks on partners.

**Acceptance Criteria:** Each opportunity has source, stage, next action, owner; proposals align with approved price book; forecast variance < ±10%.

---

## 🟩 Marketing
**Mission:** Generate qualified demand, build brand equity, and convert attention into trackable outcomes.

**Scope:** Content, campaigns, landing pages, SEO/ASO, community; excludes sales closing and manufacturing promos.

**Roles (Personas):**
- **Copy Cartel** (copy, taglines, CTAs).
- **Social Ops** (channel‑native execution).
- **Narrative Syndicate** (long‑form, trailers, lore).
- **Video & Image Director** (visual production).
- **Campaign Systems Analyst** (analytics, attribution).
- **Head of Marketing** (orchestrates).

**Inputs:** Research Engine briefs, Prompt Library, product roadmaps, creative assets, ethics disclaimers.

**Outputs:** Content calendar, campaign kits, landing pages, ad sets, email/blog posts, PR packs, KPI dashboards.

**KPIs:** MQLs, CTR/CVR, CAC, SEO rankings, list growth, engagement quality, share of voice.

**Cadence:** Weekly editorial; bi‑weekly campaign reviews; quarterly brand health; always‑on social.

**Interfaces:**
- ↔ Sales (MQL→SQL handoff, messaging feedback).
- ↔ Strategy Board (positioning, crisis messaging).
- → Ideas Lab (creative briefs, asset asks).

**Risks & Guardrails:** Tone drift; clickbait; platform policy violations → **Guardrails:** Brand Vision & Tone Doc, crisis playbook, Clean Intent framing.

**Acceptance Criteria:** Every campaign has hypothesis, audience, offer, channel kit, KPI target, and post‑mortem with learnings logged.

---

## 🟦 Manufacturing
**Mission:** Ship premium physical product on time, on budget, at target quality.

**Scope:** Vendor selection, RFQs, DFM, pre‑press, proofs, QA/QC, logistics to hubs; excludes retail distribution contracts (Sales/BD).

**Roles (Personas):**
- **Ops Coordinator** (timeline, vendor comms).
- **Shadow CFO** (BOM, COGS, margin gates).
- **Art Cartel** (pre‑press, dielines, CMYK proofing).
- **Tech Syndicate** (file packaging automation, CI checks).

**Inputs:** Final assets, component specs, quantities, target MSRP & margin, compliance notes.

**Outputs:** RFQ pack, vendor comparison, signed PO, production schedule, proof approvals, QC checklists, shipment docs.

**KPIs:** Unit COGS vs target, on‑time rate, defect rate/RMA, lead time, freight cost %, cash‑flow timing.

**Cadence:** RFQ rounds; pre‑press sign‑off; weekly vendor stand‑ups during production; inbound QC on each lot.

**Interfaces:**
- ← Strategy Board (tiering, quality bar, budget).
- ↔ Sales (demand forecast; retail box requirements).
- → Ops/Logistics (3PL, fulfillment windows).

**Risks & Guardrails:** Scope creep; paper swaps; missed QC → **Guardrails:** locked BOM, change‑control, golden sample library, pre‑shipment inspection.

**Acceptance Criteria:** Vendor chosen via scored RFQ; proofs match spec; QC < 1.5% defect; delivery meets critical path to KS timelines.

---

## 🟨 Strategy Board
**Mission:** Set direction, allocate resources, remove blockers, and keep the system honest.

**Scope:** Prioritisation, sequencing, risk triage, pricing/packaging, ethics, partnerships.

**Roles (Personas):** Strategy Board, Shadow CFO, Black Desk, Ops Coordinator, Ethics Council.

**Inputs:** Department reports, KPI dashboards, cash model, risk register, market signals.

**Outputs:** Quarterly plan, sprint goals, green/red list, pricing & tier decisions, go/no‑go calls.

**KPIs:** Plan adherence, risk burn‑down, margin health, decision latency, ROI by bet.

**Cadence:** Weekly board; monthly deep‑dive; quarterly reset.

**Interfaces:** All departments.

**Risks & Guardrails:** Analysis paralysis; whiplash pivots → **Guardrails:** decision logs, change windows, ‘minimal viable shift’.

**Acceptance Criteria:** Each major decision has owner, rationale, constraints, budget, and review date — all logged to /docs + Supabase.

---

## 🟪 Ideas Lab
**Mission:** Generate, test, and package high‑leverage creative that ladders into strategy and ships.

**Scope:** Concepts, naming, narrative arcs, mechanics exploration, visual/look‑dev — not production.

**Roles (Personas):** Ideas Lab, NarcoNations Creative Director, Art Cartel, Prompt Forge, Reality Division.

**Inputs:** Research prompts, player feedback, brand pillars, open problems from Strategy Board.

**Outputs:** Concept packs, naming trees, moodboards, prototype scripts, test cards, ‘go to production’ briefs.

**KPIs:** Hit‑rate to production, concept quality scores, time‑to‑first‑prototype, reuse of assets.

**Cadence:** Weekly studio; rapid sprints for spikes; showcase to Strategy Board each cycle.

**Interfaces:**
- ↔ Marketing (campaign concepts, trailers).
- ↔ Game Design/Playtest Cell (mechanics stress tests).
- → Strategy Board (pitches with trade‑offs).

**Risks & Guardrails:** Premature polish; over‑indexing on novelty → **Guardrails:** test gates, budget caps, ethical filters (no glamorization).

**Acceptance Criteria:** Each concept ships with problem statement, constraints, three variants, risk notes, and a decision pathway.

---

### 📎 Appendix — Department ↔ Persona Map (quick view)
| Department     | Primary Personas | Secondary Personas | Key Outputs |
|----------------|------------------|--------------------|-------------|
| Sales          | Black Desk, Ops Coordinator | Shadow CFO, Marketing Ops | Pipeline, quotes, MOUs, forecast |
| Marketing      | Copy Cartel, Social Ops, Narrative Syndicate | Video & Image Director, Campaign Analyst | Calendar, landing pages, ads, PR |
| Manufacturing  | Ops Coordinator, Art Cartel | Shadow CFO, Tech Syndicate | RFQs, PO, proofs, QC, shipments |
| Strategy Board | Strategy Board, Shadow CFO | Black Desk, Ethics Council, Ops Coordinator | Plan, resourcing, go/no‑go |
| Ideas Lab      | Ideas Lab, Creative Director | Art Cartel, Prompt Forge, Reality Division | Concept packs, briefs |

> **Edit here:** Add your CRM/3PL tables, KPI SQL, and exact vendor names under each department when they’re live.
