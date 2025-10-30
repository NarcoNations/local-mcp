# CORPUS_INGEST — How-To

Quick start for importing ChatGPT exports (~500 MB) into conversations/messages with tags, FTS, and Historian.

## CLI (local, free)
```bash
pip install ijson sqlite-utils
python parse_chatgpt_export.py export.json
sqlite-utils insert chats.db conversations conversations.ndjson --nl --pk id
sqlite-utils insert chats.db messages messages.ndjson --nl --pk id
sqlite-utils create-fts chats.db messages text
```

## App API
- `POST /api/ingest/chatgpt` → `{ fileUrl, isLocalPath? }`
- `GET /api/corpus/search` → `q, tag, persona, date, limit, offset`
- `POST /api/corpus/tag` → `{ message_id, labels[] }`
- `GET /api/corpus/stats`

## Schema
See `docs/spec-kit/25-CHAT_CORPUS_INGEST.md`.

## Notes
- Always stream; never load full file.
- Batch upserts (≥500 rows).
- Log Historian event with counts + durations.
