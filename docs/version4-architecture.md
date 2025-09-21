# MCP Memory Server v0.2a — Architecture Blueprint

## Goals
- Replace filesystem-backed store (`.mcp-nn`) with Postgres 15 + pgvector, managed via Drizzle ORM.
- Provide native-first service exposing CLI, Fastify HTTP API (`/ingest`, `/search`, `/health`), and MCP tools aligning with spec.
- Implement hybrid retrieval (pgvector cosine + Postgres BM25) with UI-ready citations and deep-link metadata.
- Support import pipeline for docx, pdf, pages, md, txt, json/jsonl, csv nodes (preserving original JSON and route hints).
- Deliver operational extras: n8n workflows, PM2 + systemd configs, optional Docker, observability, privacy guardrails.

## High-Level Components

```
apps/
  cli/  (mcp CLI entrypoints)
  http/ (Fastify server)
  mcp/  (MCP stdio transport)
core/
  db/        (Drizzle schema, migrations, repositories)
  ingest/    (sources/documents import pipeline)
  index/     (chunking, embeddings, hybrid search)
  search/    (search service + filters)
  tools/     (MCP tool implementations)
  workflows/ (n8n integration helpers)
configs/
  env.ts, logging.ts
scripts/
  install-native.sh
  backup.sh
  restore.sh
  perf-smoke.ts
n8n/
  watch-folder.json
  daily-index.json
  weekly-summary.json
```

## Data Model
- `sources` — provenance metadata (`kind`, `origin`, `grade`, timestamps).
- `documents` — per spec, with `content_hash`, `slug`, `route_hint`, `hero_image`, `meta_json`, `confidence`.
- `chunks` — chunk text, ordinal, heading, embeddings (`vector(1536)`), `tsvector` for BM25.
- `links` — cross-document relationships.
- `queries` — observability (latency, filters, results snapshot).

Indices:
- `chunks_embedding_idx` (ivfflat or hnsw) on `chunks.embedding`.
- `chunks_tsv_idx` (GIN) on `chunks.tsv`.
- `documents_slug_idx`, `documents_content_type_idx` (BTREE).
- `documents_content_hash_key` unique.

## Pipelines
1. **Import**
   - Accept paths/URLs/zip.
   - Detect type → parser.
   - Normalize to UTF-8, compute SHA-256, derive metadata (front matter, JSON mapping, slug/route).
   - Upsert `sources` + `documents`; stash original JSON in `meta_json` (for nodes/infographics).
   - Write file payload to staging dir (optional) for chunker.

2. **Index**
   - Select documents needing indexing (`content_hash` changed or missing chunks).
   - Chunk ~900 tokens (tokenizer via `@huggingface/tokenizers` or fallback) with shortcode stripping for snippets only.
   - Embed text via provider adapter (OpenAI default, local fallback), store vector + `tsvector` in `chunks`.

3. **Search**
   - Compose vector search (pgvector cosine) + BM25 from Postgres query.
   - Combine scores (`alpha=0.6` default) and format payload with citations/route hints.

## Services
- **CLI (`mcp`)**
  - `import <path|zip|url>` → triggers import pipeline.
  - `index` → runs indexer over pending docs.
  - `search "query" [filters]` → prints JSON results.
- **Fastify HTTP**
  - Bearer auth middleware, rate limiting.
  - `POST /ingest` to wrap import CLI.
  - `POST /search` returning UI payload.
  - `GET /health` reporting DB + embedder status.
- **MCP Tools**
  - `search_corpus`, `add_documents`, `link_items`, `get_document`, `list_sources` mapped to DB services.

## Observability & Privacy
- Logging via Pino with redaction of text fields.
- Measuring latency/hits in `queries` table and exporting metrics (e.g., simple counter gauge endpoint future).
- Avoid logging raw document text (only IDs, hashes).

## Deployment
- Native-first: instructions for Postgres/pgvector setup, Node app, PM2 ecosystem config, systemd unit.
- Optional Dockerfile + docker-compose bundling app + Postgres + n8n.

## Testing Strategy
- Unit tests for parsers, chunker, embeddings adapter stub, filter logic.
- Integration tests covering import → index → search using fixture corpus.
- E2E test verifying route_hint mapping for nodes/dossiers/infographics.
- Perf smoke with autocannon verifying `/search` p95 target.

## Open Questions / TODOs
- Choose tokenization strategy for consistent ~900-token chunks (likely `@huggingface/tokenizers` BPE; confirm license compatibility).
- Embedding provider fallback: implement interface supporting OpenAI + local (Xenova) to keep spec flexible.
- Determine minimal structured warning format for skipped `.pages`/`.doc` conversions.

