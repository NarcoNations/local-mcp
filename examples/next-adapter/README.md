# Next.js Adapter (Example) — `/app/api/ingest/convert`

This example shows a minimal **Next.js 14** API route that proxies an upload to the **md-convert** worker, unzips the result, and (optionally) writes files to **Supabase Storage**.

> It lives in `examples/next-adapter/` so it **won’t affect your main build**. Run it standalone if you want to test end-to-end.

## Quick start

```bash
cd examples/next-adapter
pm i
cp .env.example .env.local  # set MD_CONVERT_URL and Supabase vars if using storage
npm run dev
# POST a file to http://localhost:3000/api/ingest/convert
```

## Env
- `MD_CONVERT_URL` (e.g. `http://localhost:8000`)
- `INGEST_SUPABASE` = `true` to enable Supabase writes (optional)
- `SUPABASE_URL` / `SUPABASE_ANON_KEY`
- `SUPABASE_BUCKET_FILES` (default: `files`)
- `NEXT_PUBLIC_MCP_HTTP_URL` base for the MCP HTTP bridge (default: same origin)

## MCP API manager demo

- Visit [`/api-manager`](http://localhost:3000/api-manager) to explore the **LLM router dashboard**.
- The page calls the MCP HTTP bridge endpoints:
  - `GET /api/llm/providers` — inventory of providers (local + hosted) with availability and models.
  - `POST /api/llm/run` — run a task through the routing policy + cache.
- Use metadata hints in the form (task, provider, model hint) to watch policy decisions update live.
- On Vercel, point `NEXT_PUBLIC_MCP_HTTP_URL` to your deployed MCP bridge (e.g. `https://mcp.your-domain.com`).

## Notes
- Uses `unzipit` to unpack the worker ZIP in-memory.
- If Supabase is **disabled**, the route returns a JSON summary (filenames, bytes).
- Front‑matter insertion/merge is left as a TODO (depends on your markdown policy).

## Clean Intent
Log provenance (`manifest.json`) with extractor list and converted_at; keep auditability.
