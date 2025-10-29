# 20 — MVP_GENERATOR

Input: natural language → build spec + scaffold.

Outputs
- ARCHITECTURE.md, ROUTES.md, DATA_MODEL.md
- API endpoints + tests
- Component scaffold + PR stub

Command
- vibe mvp "AI crime map with smuggling nodes and filters"
- Option: Codex hand-off mode

Acceptance Criteria
- Generates branch, commit, and PR with summary
- Respects theme tokens, Next.js 14, TS, Tailwind
- Includes minimal Playwright sanity tests

Edit here: define allowed templates in /templates/mvp/*.json
