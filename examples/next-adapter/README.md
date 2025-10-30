# VibeOS Adapter — Next.js 14 Sandbox

This example app wires the core VibeOS flow — ingest → knowledge → embeddings → search — into a standalone Next.js 14 project.
It is safe to run locally without touching the main repo.

## Adapter Quickstart

```bash
cd examples/next-adapter
npm install
cp .env.example .env.local
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) for the UI surfaces.

## Environment

| Variable | Description |
| --- | --- |
| `MD_CONVERT_URL` | md-convert worker base URL (default `http://localhost:8000`). |
| `INGEST_SUPABASE` | Set to `true` to enable Supabase storage + table writes. |
| `SUPABASE_URL` / `SUPABASE_ANON_KEY` / `SUPABASE_SERVICE_KEY` | Required when Supabase features are enabled. |
| `SUPABASE_BUCKET_FILES` | Bucket for archives/manifests (default `files`). |
| `ALPHA_VANTAGE_KEY` | Optional — enables live Alpha Vantage feed queries. |
| `OPENAI_API_KEY` | Optional — LLM router falls back to mock output when unset. |

## Database setup

Apply Supabase migrations (0001 → 0007) before running the adapter against a fresh database:

```bash
supabase db reset --local # or apply sequentially: 0001_*.sql ... 0007_chat_corpus.sql
```

The knowledge, embeddings, corpus, and historian tables are defined under `supabase/schema/` in the root repo.

## Smoke APIs

```
# Upload a document (requires md-convert worker)
curl -F "file=@fixtures/sample.pdf" http://localhost:3000/api/ingest/convert

# Stream a ChatGPT conversations export
curl -X POST http://localhost:3000/api/ingest/chatgpt \
     -H 'Content-Type: application/json' \
     -d '{"fileUrl":"https://example.com/conversations.json"}'

# Trigger embeddings for a knowledge slug
curl -X POST http://localhost:3000/api/knowledge/index \
     -H 'Content-Type: application/json' \
     -d '{"slug":"demo"}'

# Run semantic search
curl -X POST http://localhost:3000/api/search \
     -H 'Content-Type: application/json' \
     -d '{"q":"vibe"}'
```

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the adapter locally. |
| `npm run test` | Run Vitest API smoke tests (routes mocked for offline mode). |
| `npm run typecheck` | Type-check the project. |
| `npm run lint` | Next.js lint (optional if you have ESLint configured). |

## UI Surfaces

The App Router exposes:

- `/ingest` — upload docs → md-convert manifest.
- `/corpus` — ChatGPT export ingestion.
- `/knowledge` — archive list + “Index” button.
- `/search` — cosine similarity search results.
- `/timeline` — historian filters + pagination.
- `/api-manager` — Alpha Vantage + LLM router probes.
- `/workroom` — lane-based sticky board with JSON export.
- `/mvp` — One-Shot MVP ZIP generator stub.
- `/library/prompts` — prompt catalog with “Test” hook.
- `/research` — structured research stub (Facts/Insights/Sources).
- `/play/map` & `/play/social` — playground placeholders for upcoming canvases.

Use this adapter as the integration sandbox before promoting features to the primary VibeOS deployment.
