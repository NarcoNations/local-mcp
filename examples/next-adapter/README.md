# Next.js Adapter — VibeOS Core Surfaces

This example app powers ingest → embeddings → search plus Historian, API Manager, Workroom, Prompt Library, and playgrounds. It lives in `examples/next-adapter/` so you can run it independently from the main monorepo.

## Adapter Quickstart

```bash
cd examples/next-adapter
npm install
cp .env.example .env.local  # set MD_CONVERT_URL / Supabase / AlphaVantage keys as needed
npm run dev
```

Visit http://localhost:3000 to explore the UI. API routes live under `/app/api/*`.

## Migrations

Apply Supabase migrations in order:

```
supabase db push --file supabase/schema/0001_init.sql
...
supabase db push --file supabase/schema/0007_chat_corpus.sql
```

## Smoke Checks

Run minimal tests before shipping:

```bash
# Type safety and lint
npm run typecheck
npm run lint

# API contract smokes (Vitest)
npm run test
```

Manual curls (replace tokens as required):

```bash
curl -F "file=@fixtures/demo.pdf" http://localhost:3000/api/ingest/convert
curl -X POST http://localhost:3000/api/ingest/chatgpt \
  -H "Content-Type: application/json" \
  -d '{"fileUrl":"http://localhost:3000/fixtures/chatgpt-sample.json"}'
```

## Environment

```
MD_CONVERT_URL=http://localhost:8000
INGEST_SUPABASE=false
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_KEY=
SUPABASE_BUCKET_FILES=files
ALPHA_VANTAGE_KEY=
```

Set `INGEST_SUPABASE=true` when you want archives/manifests pushed into Supabase storage and tables.

## Notes

- `/api/ingest/convert` streams uploads to `md-convert`, zips results, and (optionally) stores them in Supabase.
- `/api/ingest/chatgpt` streams ChatGPT exports into `conversations` + `messages`.
- `/api/knowledge/index` runs the Xenova embedding script inline for now.
- `/api/search` performs cosine ranking using the local MiniLM model.
- Historian receives events for ingest, embedding, API manager, MVP generator, and research runs.
