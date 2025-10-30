# 19 — Research Engine

**TL;DR**  \
Turn a topic into a battle‑ready brief: plan → notes → facts/insights/sources → exports (Obsidian, DOCS, Supabase).

## Flow
1) Input query + objectives + constraints.
2) Generate plan (questions, sources, evaluation).
3) Collect notes with **clear source URLs**.
4) Separate **Facts / Insights / Sources**.
5) Export → Dossier MD, Supabase `knowledge`, Obsidian.

## API
- `POST /api/research/plan` → outline
- `POST /api/research/run` → BRIEF.md with sections
- `POST /api/research/export` → destinations

## Acceptance
- All claims cite; academic vs narrative modes toggle; Clean Intent enforced.
