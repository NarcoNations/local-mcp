# Next.js Adapter (Example) — `/app/api/ingest/convert`

This example ships a minimal **Next.js 14** playground that:

- Proxies uploads to the **md-convert** worker (`/api/ingest/convert`).
- Streams Alpha Vantage + LLM probes through the **local MCP HTTP bridge** (`MCP_HTTP_URL`).
- Optionally mirrors converted ZIPs into **Supabase Storage**.

> It lives in `examples/next-adapter/` so it **won’t affect your main build**. Run it standalone if you want to test end-to-end.

## Quick start

```bash
cd examples/next-adapter
npm i
cp .env.example .env.local
# update MD_CONVERT_URL, MCP_HTTP_URL, and any Supabase/API keys
npm run dev
```

The adapter expects the MCP HTTP bridge to be running locally (default `http://localhost:3030`). See the root README for bridge commands.

## Env
- `MD_CONVERT_URL` (e.g. `http://localhost:8000`)
- `INGEST_SUPABASE` = `true` to enable Supabase writes (optional)
- `SUPABASE_URL` / `SUPABASE_ANON_KEY`
- `SUPABASE_BUCKET_FILES` (default: `files`)
- `MCP_HTTP_URL` – Base URL for the local MCP HTTP bridge (`http://localhost:3030` in dev)
- `ALPHA_VANTAGE_KEY` / `OPENAI_API_KEY` – forwarded to the bridge for feed + LLM probes

## Notes
- Uses `unzipit` to unpack the worker ZIP in-memory.
- If Supabase is **disabled**, the convert route returns a JSON summary (filenames, bytes).
- `/api/feeds/alpha` and `/api/llm` simply proxy to the MCP HTTP bridge, so you get unified caching, telemetry, and Supabase logging from the core server.
- Front‑matter insertion/merge is left as a TODO (depends on your markdown policy).

## Clean Intent
Log provenance (`manifest.json`) with extractor list and converted_at; keep auditability.
