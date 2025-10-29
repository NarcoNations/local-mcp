# 19 — RESEARCH_ENGINE

Goal: Query → Plan → Structured notes with facts/insights/sources separation.

Pipeline
1) Intent parsing → research plan
2) Crawl/fetch (respect robots)
3) Chunk + embed (Xenova)
4) Synthesis: Facts vs Insights vs Open Questions
5) Export: Obsidian, DOCS/, Supabase knowledge, Markdown dossier

API
- POST /api/research/plan
- POST /api/research/run
- POST /api/research/export

Acceptance Criteria
- Each claim carries source + date
- Toggle: Academic vs Narrative mode
- Outputs deterministic with seeded LLM calls

Edit here: add topic-specific templates in /prompts/research/*.md
