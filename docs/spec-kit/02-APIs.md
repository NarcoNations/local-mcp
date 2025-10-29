# 02 — API Surface (MVP sketch)

## HTTP (optional)
- `GET /healthz` → 200 `{ ok: true, version }`
- `POST /ingest` → accepts file list, returns job id
- `GET /search?q=` → returns `{ items: [{ text, source, score }] }`

## CLI
- `mcp start` — start local server
- `mcp ingest <paths...>` — run ingesters
- `mcp search "query"` — local retrieval

## MCP tools
- `ping()`
- `search(query)`
- `ingest(paths[])`

_Contracts will be tightened as code stabilises._
