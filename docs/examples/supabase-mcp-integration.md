# MCP ↔ Supabase ↔ Next.js Adapter

This guide documents the production-ready wiring between the MCP server, Supabase Postgres/Storage, and the example Next.js adapter.

## Components & Bindings

| Component | Responsibility | Required Env |
| --- | --- | --- |
| MCP server (`src/server.ts`) | Emits file-watch activity + ingest stats to Historian | `HISTORIAN_EVENT_URL`, `HISTORIAN_EVENT_TOKEN` (optional), `HISTORIAN_DEFAULT_SOURCE` |
| Next.js adapter (`examples/next-adapter`) | Receives Historian events + ingest uploads | `MD_CONVERT_URL`, Supabase keys, `HISTORIAN_EVENT_TOKEN` |
| Supabase project | Stores tables (`events`, `knowledge`, CRM/marketing) + storage buckets | SQL migrations in `supabase/schema/*.sql` |

The Historian flow posts JSON to `POST /api/historian/event`, which writes to the `events` table (see `0007_chat_corpus.sql` + `0008_historian_events.sql`). Timeline UI reads directly from Supabase using the service role key.

## Setup Steps

1. **Provision Supabase**
   - Create a project and enable the `pgcrypto` + `pg_cron` extensions.
   - Apply SQL migrations in numeric order: `0001` → `0008`.
   - Create a Storage bucket named `files` (or override via `SUPABASE_BUCKET_FILES`).

2. **Configure Next.js adapter**
   - `cd examples/next-adapter && npm install`.
   - Copy `.env.example` to `.env.local` and populate:
     ```env
     MD_CONVERT_URL=https://your-md-convert
     SUPABASE_URL=...
     SUPABASE_SERVICE_KEY=...
     SUPABASE_ANON_KEY=...
     HISTORIAN_EVENT_TOKEN=choose-a-shared-secret
     INGEST_SUPABASE=true
     ```
   - Run `npm run dev` (Vercel-ready build uses the same env keys).

3. **Wire the MCP server**
   - Export the Historian endpoint URL, pointing at the deployed Next.js adapter:
     ```bash
     export HISTORIAN_EVENT_URL="https://adapter.yourdomain.com/api/historian/event"
     export HISTORIAN_EVENT_TOKEN="choose-a-shared-secret"
     export HISTORIAN_DEFAULT_SOURCE="mcp.local"
     ```
   - Start the MCP server (`npm run dev:mcp`) and trigger `watch` or `reindex` tools to generate events.

4. **Validate timeline**
   - Visit `/timeline` in the adapter to see cards rendered for recent events.
   - Expand Metadata to confirm file paths + session IDs are captured.

## Smoke Tests

Run these after wiring env variables:

1. **Historian endpoint** — from the MCP host or CI:
   ```bash
   curl -X POST "$HISTORIAN_EVENT_URL" \
     -H "Authorization: Bearer $HISTORIAN_EVENT_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"source":"smoke","kind":"smoke.test","title":"Historian handshake","meta":{"ok":true}}'
   ```
   Expected: `{ "ok": true }` and a new row in `events`.

2. **MCP watch pipeline** — with the MCP server running, touch a tracked file:
   ```bash
   npm run watch -- --once && touch docs/README.md
   ```
   Then reload `/timeline` and confirm a `watch.change` card with your file path.

3. **Ingest convert** — upload a document via the `/ingest` UI; verify the resulting Historian entry (`ingest.convert`) and Supabase Storage objects (`archives/`, `manifests/`).

Document outcomes in runbooks to keep the integration reproducible across environments.
