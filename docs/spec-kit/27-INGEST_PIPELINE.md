# 27 — INGEST_PIPELINE

Path: Upload → Convert → Store → Persist → Embed → Publish

## Sequence
1) Receive upload (UI, API, email drop, watched folder).
2) Convert via MD_CONVERT_URL/convert.
3) Unpack zip → <slug>.md + assets/.
4) Store to Supabase Storage (files/ + assets/).
5) Persist knowledge row { slug, title, paths, meta, sha256, tags }.
6) Embed md body → embeddings (pgvector).
7) Publish to indexes and search.

## Storage layout
- files/<slug>/<slug>.md
- files/<slug>/assets/*
- knowledge.manifest_path → files/<slug>/manifest.json

## Dedupe + retries
- SHA256 of source bytes → idempotency key.
- If exists: update tags/links; skip re-embed unless content changed.
- Retries: exponential backoff; dead-letter queue.

## Errors
- 400: unsupported type → mark as failed with reason.
- 5xx worker: enqueue retry; alert Ops if rate high.
- Index mismatch: re-run embed; log seed+model.

## Telemetry
- Log size, pages, extractors, convert time, embed time, tokens.
- Attach provenance to knowledge.meta.

## Ownership
- Tech Syndicate: adapter route + storage writers.
- Ops Coordinator: n8n workflow + alerts.
- Strategy Board: taxonomy and tagging policy.
