# 07 — API (HTTP + MCP)

## HTTP
- `GET /health` → `{ ok: true }`
- `GET /stats` → index counts
- `POST /import/chatgpt` → multipart zip → job id
- `POST /reindex` → `{ ok: true }`
- `GET /search?q=term&k=20` → results
- `GET /.well-known/mcp.json` → manifest
- `GET /events` → SSE: `{ type, payload }`

## MCP Tools (stdio)
- `search_local(q, topK?)`
- `reindex(full?)`
- `watch(path?)`

**Error model**
- JSON problem details; HTTP 4xx/5xx; SSE `type=error`.
