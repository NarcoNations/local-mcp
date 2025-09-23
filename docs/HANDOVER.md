# MCP Memory Server – Session Handover

> **Please update this handover at the end of every working session.** Add what changed, what is still open, and any context that will help pick up the next day.

## Project Snapshot
- **Repository:** `~/Documents/Dev-server/mcp-nn`
- **Branch:** `version4-prepivot`
- **Node:** 22.x (using `npm run dev` with `tsx`)
- **Database:** PostgreSQL 15 with `pgvector` compiled manually (`CREATE EXTENSION vector;`).
- **Entry points:**
  - CLI: `npm run mcp -- <command>` (`import`, `index`, `search`, `sources`, `doc`).
  - HTTP API: Fastify on `http://localhost:8080` providing `/ingest`, `/search`, `/health`.
  - SSE Bridge: `/sse` and `/messages` (legacy `/mcp/sse`, `/mcp/messages` also available).

## Work Completed to Date
- **Database layer:** Drizzle ORM schema + migrations for sources/documents/chunks/links/queries. `npx drizzle-kit push` (with latest drizzle packages) applies migrations.
- **Import & index pipeline:** Parsers for md/txt/docx/pdf/pages/json/jsonl/csv; token chunker (~900 tokens via `@dqbd/tiktoken`); embeddings provider abstraction (local @xenova or OpenAI); hybrid search returning route hints & snippets.
- **HTTP/SSE server:** Fastify wrapper with bearer auth (skips manifest/health/SSE routes), rate limiting, Pino logging. SSE sessions instantiate MCP server, register new tool set (`search_corpus`, `add_documents`, `link_items`, `get_document`, `list_sources`).
- **CLI & fixtures:** Unified `mcp` CLI; fixture corpus under `fixtures/memory`; gold-question stub; summary/perf scripts; n8n workflows; PM2/systemd/Docker deployment assets.
- **Observability:** Pino logger with redaction; query latency stored in `queries` table; `npm run summary:daily` creates markdown report.
- **CORS/auth:** SSE routes (`/sse`, `/messages`, `/mcp/...`) bypass auth to satisfy ChatGPT connector.

## Current State / Issues
- **Connector URL:** `https://honey-creating-apartment-hint.trycloudflare.com/sse` (update `mcp.json` whenever tunnel changes).
- **ChatGPT integration:** Root SSE routes added, but connector still needs confirmation after restarting `npm run dev` and the Cloudflare tunnel. Watch for `sse-session-started` / `sse-connection-failed` in logs.
- **Git Status:** `src/http.ts` and `mcp.json` modified locally (not yet committed).

## Next Actions
1. Start services (`npm run dev`) and re-open Cloudflare tunnel (`cloudflared tunnel --url http://localhost:8080`).
2. Verify endpoints through the tunnel:
   ```bash
   curl -I https://<tunnel>/mcp.json
   curl -H "Authorization: Bearer <API_KEY>" -H "Content-Type: application/json" \
        -d '{ "query": "cocaine port" }' https://<tunnel>/search
   ```
3. Re-add ChatGPT connector using `https://<tunnel>/sse` (Auth: None, trust). Confirm `sse-session-started` in logs.
4. Once stable, commit & push (`src/http.ts`, `mcp.json`, this handover) and consider finalising deployment assets / E2E tests.

## Pending / Wishlist
- Flesh out E2E test (`tests/e2e.gold.test.ts`) against a test DB.
- Hook n8n workflows into a live instance.
- Decide on production deployment path (PM2/systemd vs Docker) once SSE connector confirmed.

*Last updated: $(date +'%Y-%m-%d %H:%M:%S')*
