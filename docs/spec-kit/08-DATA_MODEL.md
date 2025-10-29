# 08 — Data Model

- **documents**: { id, source, uri, mime, text, tokens, meta }
- **chunks**: { id, doc_id, chunk_index, text, embedding? }
- **index**: BM25 store (e.g., elasticlunr) + vector store (e.g., local FAISS/hnswlib/xvia Xenova).
- **jobs**: ingestion + reindex tasks with status for SSE.

**Notes**
- Keep embeddings optional; allow keyword‑only mode.
- Store small metadata map for provenance.
