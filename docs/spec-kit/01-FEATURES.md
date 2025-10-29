# 01 — Features & Acceptance Criteria (MVP)

## F1: Run local MCP server
**Goal:** Start server, expose basic `ping` tool.
**Done when:** `npm run dev` boots, `/healthz` returns 200, `ping` returns `pong` in MCP client.

## F2: File ingest (Markdown + PDF)
**Goal:** Add loader that parses `.md` and `.pdf` to chunks.
**Done when:** CLI `ingest <path>` indexes files and writes manifest.

## F3: Vector index (local)
**Goal:** Simple retrieval over in-memory or SQLite.
**Done when:** `search "query"` returns ranked chunks with source.

## F4: Supabase option (stretch)
**Goal:** Swap local store for Supabase Pg + Storage.
**Done when:** Env toggle persists & queries via Supabase.

## F5: Logging & metrics
**Goal:** Basic http logs + ingest counts.
**Done when:** Logs in `logs/`, counter metrics exposed.
