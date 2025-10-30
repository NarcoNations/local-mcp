# 20 — One‑Shot MVP Generator

**TL;DR**  \
Natural language → build spec: ARCHITECTURE.md, ROUTES.md, DATA_MODEL.md, APIs + tests, component scaffolds, PR stub.

## Inputs
- Brief text, optional Whiteboard export JSON, target stack (Next 14/TS/TW).

## Outputs
- `/docs` pack; `/app` route stubs; `/lib` utils; `/api` handlers; basic tests.
- Git branch & PR template prefilled.

## API
- `POST /api/mvp/generate` → returns artifact ZIP + branch name.

## Acceptance
- Builds on Vercel; passes lint + a11y smokes; uses tokens (no hardcoded hex).
