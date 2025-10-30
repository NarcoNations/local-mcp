# 25 — MD_CONVERT_INTEGRATION

**Goal:** Use the `md-convert` worker as the standard pre-processor for incoming docs (DOCX, PDF, HTML, RTF, EPUB → Obsidian-ready Markdown + assets).

## Integration modes
1) **Worker API (recommended):** call `POST /convert` with a file; receive a ZIP containing:
   - `<slug>/<slug>.md` (GFM, wrap=none)
   - `assets/` (images/ocr)
   - `manifest.json` (+ provenance)
2) **CLI/manual:** batch convert locally and drop into `obsidian/` or Supabase buckets.

## Direct wiring (Archivist)
- **Adapter route:** `/api/ingest/convert` (proxy to worker).
- **Unpack:** unzip and write `files`+`assets` to Supabase Storage.
- **Persist:** create `knowledge` row with slug, manifest path, meta.
- **Index:** enqueue embeddings for `<slug>.md`.
- **Link:** create backlinks to related artifacts.

## Endpoint contract (worker)
`POST /convert` (multipart/form-data)
- `file`: binary
- optional: `tags` (comma), `origin` (upload|email|url|drop), `language`, `ocr` (bool)

**200 application/zip**
- `manifest.json` example:
```json
{
  "id": "2025-10-29T21-44-00Z-7f3c",
  "title": "Example",
  "source": { "filename": "Example.pdf", "ext": "pdf", "sha256": "..." },
  "provenance": { "extractors": ["pymupdf"], "converted_at": "2025-10-29T21:44:00Z" },
  "tags": ["research"],
  "slug": "example"
}
```

## Frontmatter (target)
Add/merge into the Markdown:
```yaml
---
id: manifest.id
title: manifest.title
slug: manifest.slug
source:
  filename: manifest.source.filename
  ext: manifest.source.ext
  sha256: manifest.source.sha256
  origin: <upload|email|url|drop>
content_type: text/markdown
tags: [research]
provenance:
  extractors: [pymupdf, pandoc, ocr?]
  converted_at: manifest.provenance.converted_at
---
```

## n8n flow (outline)
1. **Trigger:** HTTP/Webhook or Storage watcher
2. **HTTP Request:** to `MD_CONVERT_URL/convert`
3. **Function:** unzip → split files
4. **Supabase:** upload md + assets
5. **DB:** upsert `knowledge` row (slug, meta, paths)
6. **Queue:** embeddings job
7. **Notify:** Ops channel with summary + links

## MCP tool (concept)
```json
{
  "name": "doc_to_md.convert",
  "description": "Convert a document to Markdown+assets via md-convert worker",
  "input_schema": {
    "type": "object",
    "properties": {
      "file_path": {"type": "string"},
      "tags": {"type": "array", "items": {"type": "string"}},
      "origin": {"type": "string", "enum": ["upload","email","url","drop"]}
    },
    "required": ["file_path"]
  }
}
```

**Acceptance Criteria**
- Upload → ZIP → storage → DB → embeddings → audit trail in ≤ one job.
- SHA256-based dedupe; idempotent re-runs.
- Provenance persisted (extractors + converted_at).
