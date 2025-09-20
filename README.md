# Local Research MCP (mcp-nn)

Offline Model Context Protocol (MCP) server for NarcoNations.org research. Index and search PDF, Markdown, TXT, Word (.docx), and Apple Pages (.pages) with hybrid retrieval (local embeddings + BM25). Returns precise citations (file, page, char ranges, snippet). 100% local. No cloud.

---

## Quickstart

### Requirements
- Node.js 20+
- macOS, Linux, or Windows

```bash
# 1) Install dependencies
npm install

# 2) (Optional) Prefetch the local embedding model for fully offline use
npm run models:download

# 3) Index your folders
npm run index -- ./docs ./public/dossiers ./pdfs

# 4) Run the MCP server (stdio)
npm run dev
```

### Example MCP tool calls

In an MCP-enabled client (e.g., ChatGPT Custom GPT):

**search_local**

```json
{
  "tool": "search_local",
  "input": { "query": "Antwerp cocaine port", "k": 8, "alpha": 0.65 }
}
```

**get_doc**

```json
{
  "tool": "get_doc",
  "input": { "path": "./docs/ports/antwerp.pdf", "page": 12 }
}
```

### ChatGPT → ZIP → Markdown → Index

```bash
# Export chats from ChatGPT (web → Settings → Data Controls → Export) and unzip.

# Convert to Markdown
npm run chatgpt:to-md -- ~/Downloads/chatgpt-export
# → writes .md into ./docs/chatgpt-export-md

# Index the converted chats
npm run index -- ./docs/chatgpt-export-md
```

Optional one-shot via MCP:

```
import_chatgpt_export { "exportPath": "~/Downloads/chatgpt-export", "outDir": "./docs/chatgpt-export-md" }
```

---

## Configuration

On first run the server writes the effective configuration to `.mcp-nn/config.json`. Defaults:

```json
{
  "roots": {
    "roots": ["./docs", "./public/dossiers", "./docs/chatggtp-export-md", "./docs/chatgpt-export-md"],
    "include": [".pdf", ".md", ".txt", ".docx", ".pages"],
    "exclude": ["**/node_modules/**", ".git/**"]
  },
  "index": {
    "chunkSize": 3500,
    "chunkOverlap": 120,
    "ocrEnabled": true,
    "ocrTriggerMinChars": 100,
    "useSQLiteVSS": false,
    "model": "Xenova/all-MiniLM-L6-v2",
    "maxFileSizeMB": 200,
    "concurrency": 2,
    "languages": ["eng"]
  },
  "out": { "dataDir": ".mcp-nn" }
}
```

Environment overrides:
- `MCP_NN_DATA_DIR` – change index storage directory.
- `TRANSFORMERS_CACHE` – override Xenova model cache directory.
- `TRANSFORMERS_OFFLINE=1` – enforce fully offline model loads.

---

## File Types & Caveats
- **PDF:** Uses `pdf-parse`. When a page contains too little text and OCR is enabled, the file is marked `partial: true` so you can reprocess it later.
- **Markdown:** `gray-matter` preserves front matter metadata (tags, title).
- **Word (.docx):** `mammoth` extracts clean text; styles are ignored.
- **Pages (.pages):** Best-effort XML extraction. Modern `.pages` bundles without XML are marked `partial: true` but will not crash indexing.

---

## Performance Tips
- First embedding model load on CPU takes ~10–30s, then it is cached locally.
- Raise `ocrTriggerMinChars` or disable OCR entirely if all PDFs already contain text.
- For corpora above ~50k chunks, enable `useSQLiteVSS` after installing `sqlite-vss` (flat vectors remain the default).

---

## Security & Privacy
- Strict roots whitelist with realpath checks; traversal and symlink escapes are rejected.
- Zip handling uses in-memory extraction with a ZipSlip guard.
- No outbound network calls are made unless you explicitly add them later.
- ChatGPT exports may contain sensitive data—keep them inside your trusted roots.

---

## Troubleshooting
- **Slow OCR:** Increase `ocrTriggerMinChars` or set `ocrEnabled=false` for digital PDFs.
- **Model won’t load offline:** Run `npm run models:download` and set `TRANSFORMERS_OFFLINE=1`.
- **sqlite-vss missing:** The server automatically falls back to the flat cosine index.
- **Pages file marked partial:** Export that `.pages` document to `.docx` or `.pdf` and reindex.
- **Chat export conversion fails:** Ensure `conversations.json` exists in the provided folder root.

---

## Tests

```bash
npm test
```

Runs Vitest offline with embedding pipelines mocked for speed.

---

## Code Style
- TypeScript strict mode; prefer small, pure functions and early returns.
- Naming: `verbNoun` for functions, PascalCase for types, camelCase for variables.
- Keep modules ~200 lines where possible and split by concern (indexers/pipeline/store/tools).
- Comments: brief JSDoc above non-trivial functions focusing on the “why”.
- Errors: throw typed errors with concise messages; catch at boundaries and include the path in metadata.

### Logging
- Single-line JSON per event `{ level, msg, meta }`. Debug logs gated behind `DEBUG=1` or `NODE_ENV=development`.

### Tool I/O
- Validate inputs with Zod and return clear error messages.
- Always emit citations with file path, page, and character offsets.
- Outputs remain JSON-serializable, stable, and explicit.

### Docs & README
- Imperative mood (“Run…”, “Use…”). Quickstart first, then details, then troubleshooting.
- Always highlight offline operation and Pages caveat.

---

## License

MIT
