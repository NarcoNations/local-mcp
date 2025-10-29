# 17 — AGENT_TEAM (VibeOps Persona Deck)

**Purpose**: Containerised multi-persona engine for autonomous studio ops.

## Teams
- **PM / System Architect / FE / BE / DevOps / Data+AI / Research / Copy+Brand / Marketing Ops / Ethics Council / Archivist / Librarian / File Manager**

## Modes
- **Solo** (one role) · **Panel** (consensus) · **Offensive** (ship) · **Defensive** (audit)

## Interfaces
- `POST /api/agents/run` → `{ team, mode, input, constraints }`
- `POST /api/agents/panel` → `{ roster:[...], prompt, scoring }`

## Storage
- Supabase: `agents_roster`, `runs`, `artifacts`

## Acceptance Criteria
- Reproducible runs with persona + prompt version pinned
- Panel mode returns ranked consensus + dissent notes
- Exports artifacts to `/docs/` and Supabase Storage

> **Edit here**: add your current persona JSON to `AGENT_TEAM.md` to bind names→roles.
