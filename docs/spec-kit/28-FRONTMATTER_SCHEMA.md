# 28 — FRONTMATTER_SCHEMA

Target frontmatter to embed at the top of each converted Markdown file.

Example (YAML):
---
id: 2025-10-29T21-44-00Z-7f3c
title: Example Document
slug: example
source:
  filename: Example.pdf
  ext: pdf
  sha256: 0123abcd...
  origin: upload
content_type: text/markdown
tags: [research, source:pdf]
provenance:
  extractors: [pymupdf]
  converted_at: 2025-10-29T21:44:00Z
---

Fields:
- id (string, stable)
- title (string)
- slug (string)
- source.filename (string)
- source.ext (string)
- source.sha256 (string)
- source.origin (enum: upload, email, url, drop)
- content_type (string)
- tags (array of string)
- provenance.extractors (array of string)
- provenance.converted_at (ISO string)

Notes:
- SHA256 used for dedupe and provenance.
- Keep `wrap=none` in Markdown body to avoid noisy diffs.
