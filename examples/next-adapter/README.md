# Next.js Adapter (Example) — `/app/api/ingest/convert`

This example now ships a production-grade slice of **VibeOS**:

- Semi-autonomous job runner (`worker/jobs.ts`) with `/api/jobs/dispatch`
- Telemetry surface (`/metrics`, `/api/metrics`) with provider usage + health
- Eval Lab (`/evals`, `/api/evals/run`) for model/prompt benchmarking
- Ethics Council (`/policy`) with reusable policy checks + Shadow Self logging

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
- `SUPABASE_SERVICE_KEY` (for server-only writes)
- `SUPABASE_BUCKET_FILES` (default: `files`)
- `FF_JOBS_WORKER`, `FF_COST_TELEMETRY`, `FF_EVALS`, `FF_MAP_PIPELINE`, `FF_SOCIAL_PIPELINE`
- `USE_MOCKS` (optional) to rely on deterministic fixtures

## Notes
- Uses `unzipit` to unpack the worker ZIP in-memory.
- If Supabase is **disabled**, the route returns a JSON summary (filenames, bytes).
- Front‑matter insertion/merge is left as a TODO (depends on your markdown policy).

## Clean Intent
Log provenance (`manifest.json`) with extractor list and converted_at; keep auditability.

See `docs/OPERATIONS.md`, `docs/SECURITY.md`, and `docs/EVALS.md` for extended operations guidance.
