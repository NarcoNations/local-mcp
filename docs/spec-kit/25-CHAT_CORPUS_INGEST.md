# 25 — Chat Corpus Ingest (ChatGPT Export)

**Purpose**
Ingest large ChatGPT export(s) (~500 MB JSON) into a structured, searchable, taggable knowledge base with optional embeddings, Historian logging, and app APIs. The corpus becomes a backbone for files, database, and narrative context across VibeOS.

---

## Scope
- Parse the official ChatGPT export JSON (array of conversations with `mapping`).
- Normalize to conversations and messages tables; attach tags and historian events.
- Provide APIs for ingest, search, tagging, stats.
- Support free-tier and local-first operation; background-friendly processing.

## Data Model (Supabase / Postgres)
```sql
create table if not exists conversations (
  id text primary key,
  title text,
  created_at timestamptz,
  updated_at timestamptz,
  source text default 'chatgpt_export',
  meta jsonb
);

create table if not exists messages (
  id text primary key,
  conversation_id text references conversations(id) on delete cascade,
  author text,
  role text,
  model text,
  created_at timestamptz,
  text text,
  meta jsonb
);

create table if not exists tags (
  id bigserial primary key,
  label text unique
);

create table if not exists message_tags (
  message_id text references messages(id) on delete cascade,
  tag_id bigint references tags(id) on delete cascade,
  primary key (message_id, tag_id)
);

create table if not exists events (
  id bigserial primary key,
  ts timestamptz not null default now(),
  source text,
  kind text,
  title text,
  body text,
  link text,
  meta jsonb
);

-- Optional semantic search (later)
-- create extension if not exists vector;
-- alter table messages add column embedding vector(384);
```

Indexes: create FTS on messages.text (Postgres GIN on to_tsvector('english', text)), or start with SQLite FTS locally for quick exploration.

---

## Ingest Pipeline (large-file safe)
1) Upload the export file to Storage (or provide a URL).
2) Background job downloads/streams the file and parses incrementally (no full in-memory load):
   - Node: stream-json + StreamArray, or Python: ijson.
3) Normalize per conversation → write one conversations row; flatten mapping to messages rows.
4) Batch upsert (e.g., 500 rows/batch) to reduce round-trips.
5) Historian event: record import summary (file origin, counts, duration).

Notes
- Handle missing titles/timestamps; default to null.
- Flatten message content.parts → text (join with double newline).
- Ignore empty/attachment-only nodes; retain references in meta if needed.

---

## Tagging & Taxonomy
Auto-tags (heuristics):
- Persona: persona:strategy-board, persona:ideas-lab, persona:tech-syndicate, ...
- Topic/Feature: feature:crime-map, app:tradeops, stack:supabase, stack:nextjs, ...
- Action: action:decision, action:spec, action:design, action:code, action:schema, action:task

Manual tags: via UI or API for curated labeling.

Taggers should be idempotent and append-only; never drop user tags.

---

## APIs (App layer)
- POST /api/ingest/chatgpt → { fileUrl, isLocalPath? } — streams, normalizes, upserts, logs historian.
- GET  /api/corpus/search → q, tag, persona, repo, date range, limit, offset
- POST /api/corpus/tag → { message_id, labels[] } (creates missing labels, links)
- GET  /api/corpus/stats → totals, top tags/personas/models, recent activity

Security
- Ingest: service/bearer token.
- Search: authenticated; tag write: role-gated.

---

## CLI (free, streaming)
Python (ijson) → NDJSON → SQLite/PG
```bash
pip install ijson sqlite-utils
python parse_chatgpt_export.py export.json
sqlite-utils insert chats.db conversations conversations.ndjson --nl --pk id
sqlite-utils insert chats.db messages messages.ndjson --nl --pk id
sqlite-utils create-fts chats.db messages text
```

DuckDB (ad-hoc)
```sql
install json; load json;
select * from read_json_auto('export.json', maximum_object_size=1000000000);
```

---

## Search & Indexing
- v1: Postgres FTS (GIN on to_tsvector).
- v2: Semantic search with pgvector (local embeddings via Xenova/Nomic).
- Analytics: DuckDB/Materialized views for usage summaries.

---

## Automations (n8n)
- Trigger: file added → ingest job → historian log.
- Optional: nightly tagger pass; weekly Chronicle export (PDF/MD).

---

## Privacy, Ethics, Clean Intent
- PII minimization; redact secrets; opt-out list.
- Retention policy (configurable); export/delete endpoints.
- Historian transparency: what/when/why logged.

---

## Acceptance Criteria
- Ingest ≥ 500 MB JSON without OOM (streaming).
- ≥ 99% conversations/messages parsed (non-empty where text exists).
- FTS search returns results in ≤ 300ms p95 (cached).
- Tagger applies persona/topic/action tags with ≥ 90% precision on sampled set.
- Historian event emitted with counts, duration, checksum.

---

## Risks & Mitigations
- Schema drift: map robustly; unknown fields → meta.
- Huge files: stream + batch; background only.
- Sensitive content: redaction filters; role-based search.
- Performance: indexing jobs off main thread; matviews for stats.

---

## References
- Node: stream-json · Python: ijson, sqlite-utils, datasette · DB: Postgres FTS, pgvector
