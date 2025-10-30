# 21 — Archivist & File Manager

**TL;DR**  \
Normalize, tag, embed, and back up assets from Obsidian, Supabase, repos, uploads, whiteboard snaps, and Showroom outputs.

## Functions
- Tagging, chunking, embedding, backup, rename/normalize, smart linking (wiki refs).

## Sources
- Obsidian vault, Supabase Storage, Git repos, local uploads, Whiteboard exports.

## APIs
- `POST /api/archive/ingest` (file or URL)
- `POST /api/archive/tag`
- `POST /api/archive/embed`

## Acceptance
- Provenance retained; idempotent re‑runs; Historian logs every action.
