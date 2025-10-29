# 03 — Dev Workflow

## Branching
- `main` — stable.
- `mvp/*` — active work.
- `docs/*` — documentation-only changes.

## Commits
- Conventional commits (`feat:`, `fix:`, `docs:`).
- Reference issues/PRs where helpful.

## PRs
- Keep small. Link to updated docs.
- Checklist: build passes, docs updated, no secrets.

## Local setup (assumed)
```bash
nvm use
npm ci
npm run dev
```
