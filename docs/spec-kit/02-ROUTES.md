# 02 — Routes

## REST & Well‑Known
- `GET /.well-known/mcp.json` → MCP manifest
- `GET /health` → liveness
- `GET /stats` → index/status
- `POST /import/chatgpt` → upload/ingest chat exports
- `POST /reindex` → rebuild index
- `GET /search?q=...` → local search proxy (optional)

## SSE
- `GET /events` → server‑sent events (progress, watch, logs)

## CORS/Preflight
- Reflect requested headers; allow credentials; explicit `OPTIONS` for MCP endpoints; allow `GET,POST,DELETE,OPTIONS`.

> **Edit here:** fill exact header allowlist and origin rules after PR #13 merges.
