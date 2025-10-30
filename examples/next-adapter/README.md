# VibeOS Adapter (Next.js 14)

This example bundles the core ingest → embeddings → search stack inside a standalone Next.js 14 app. It mirrors the production
flow while staying self-contained so you can run smokes without touching the main build.

## Adapter quickstart

```bash
cd examples/next-adapter
npm install
cp .env.example .env.local  # fill Supabase + Alpha Vantage keys as needed
npm run dev
```

The app boots on <http://localhost:3000>. Uploads hit `/api/ingest/convert`, ChatGPT exports stream into `/api/ingest/chatgpt`,
and embedding/search endpoints are reachable from the UI or via `curl` (see below).

### Database migrations

Apply the Supabase SQL migrations in order if you want the full schema:

```
supabase db commit --file supabase/schema/0001_crm.sql
supabase db commit --file supabase/schema/0002_marketing_analytics.sql
supabase db commit --file supabase/schema/0003_manufacturing_rfq.sql
supabase db commit --file supabase/schema/0004_rls_policies.sql
supabase db commit --file supabase/schema/0005_matviews.sql
supabase db commit --file supabase/schema/0006_knowledge_embeddings.sql
supabase db commit --file supabase/schema/0007_chat_corpus.sql
```

Use the Supabase CLI or your preferred migration tooling; the order matters because later scripts depend on tables created in
the earlier steps.

### curl smokes

```bash
# 1. md-convert pipeline (multipart upload)
curl -F "file=@./fixtures/sample.pdf" http://localhost:3000/api/ingest/convert

# 2. ChatGPT corpus ingest (JSON export hosted locally)
curl -X POST http://localhost:3000/api/ingest/chatgpt \
  -H 'Content-Type: application/json' \
  -d '{"fileUrl":"http://localhost:3000/fixtures/chatgpt-export-sample/conversations.json"}'

# 3. Embedding index for a slug
test_slug="sample-doc"
curl -X POST http://localhost:3000/api/knowledge/index \
  -H 'Content-Type: application/json' \
  -d '{"slug":"'"$test_slug"'"}'

# 4. Semantic search
curl -X POST http://localhost:3000/api/search \
  -H 'Content-Type: application/json' \
  -d '{"q":"knowledge ingestion"}'
```

### Env vars

See `.env.example` for the full list. Required highlights:

- `MD_CONVERT_URL` (e.g. `http://localhost:8000`)
- `INGEST_SUPABASE` (`true` to persist artifacts to Supabase)
- `SUPABASE_URL` / `SUPABASE_ANON_KEY` / `SUPABASE_SERVICE_KEY`
- `SUPABASE_BUCKET_FILES` (default `files`)
- `ALPHA_VANTAGE_KEY` (enables feed API proxy)

## Notes

- The adapter uses [`unzipit`](https://github.com/giltayar/unzipit) to unpack md-convert archives in-memory.
- Embeddings run entirely on CPU via `@xenova/transformers` (MiniLM-L6-v2) to stay within free-tier constraints.
- Historian events are logged for every ingest, search, API manager, MVP, and research interaction so provenance stays auditable.
