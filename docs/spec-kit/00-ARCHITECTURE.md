# 00 — Architecture (WIP)

Assumptions (labelled):
- (A1) Node/TypeScript MCP server (local-first) exposing tools over stdio/HTTP.
- (A2) Supabase Postgres (or SQLite for dev) as optional backing store for artifacts & index.
- (A3) Xenova/onnx local embedding models + pgvector (optional) for retrieval.

## System map
- `server/` — MCP server core (providers/tools, routes, auth, logging).
- `ingest/` — loaders for PDFs/MD/JSON → chunks → index.
- `index/` — vector index (pgvector/sqlite) + metadata store.
- `clients/` — CLI + IDE connectors.

## Data flows
1. Ingest → Chunk → Embed → Index.
2. Query → Retrieve → Tool call → Response.

## Environments
- Dev: local SQLite + files.
- Prod: Supabase Postgres + Storage (optional).

## Risks
- Model drift & versioning of embeds.
- Long‑running ingest jobs — queue needed if scaling.
