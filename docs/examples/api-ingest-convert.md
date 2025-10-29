# Example — Next.js adapter (docs)

Route: /app/api/ingest/convert/route.ts (Node runtime)

Pseudo-code (TypeScript):

- Read multipart form-data from request (file, tags, origin).
- Forward to MD_CONVERT_URL/convert (stream).
- Unzip buffer in-memory or temp dir.
- For each file: upload to Supabase Storage.
- Parse manifest.json → build frontmatter → merge into Markdown.
- Upsert DB rows (knowledge, files, assets).
- Enqueue embeddings job.
- Return 200 with { slug, paths, counts }.

Notes:
- Use streaming uploads for large PDFs.
- Add idempotency by hashing source bytes (sha256).
- Capture telemetry (convert_ms, embed_ms).
