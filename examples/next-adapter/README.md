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
- Feature flags:
  - `FF_JOBS_WORKER`, `FF_COST_TELEMETRY`, `FF_EVALS`, `FF_MAP_PIPELINE`, `FF_SOCIAL_PIPELINE`
- Optional demo headers: `NEXT_PUBLIC_DEMO_API_KEY` for client fetches to `/api/*`.

## Notes
- Uses `unzipit` to unpack the worker ZIP in-memory.
- If Supabase is **disabled**, the route returns a JSON summary (filenames, bytes).
- Front‑matter insertion/merge is left as a TODO (depends on your markdown policy).
- Production dashboards: `/metrics`, `/evals`, `/policy`, `/publish`, `/play/*`.

## Clean Intent
Log provenance (`manifest.json`) with extractor list and converted_at; keep auditability.
