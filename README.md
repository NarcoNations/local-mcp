# mcp-nn

Offline MCP server for NarcoNations.org research. Index and search local PDFs, Markdown, TXT, Word (`.docx`), and Apple Pages (`.pages`) files with hybrid retrieval (dense embeddings + BM25) and precise citations. Everything runs locally—no network calls after the initial model download.

---

## Quickstart

### Requirements
- Node.js 20+
- macOS, Linux, or Windows

```bash
# 1) Install dependencies
npm install

# 2) (Optional) Prefetch the local embedding model for offline use
npm run models:download

# 3) Index your research folders
npm run index -- ./docs ./public/dossiers ./pdfs

# 4) Start the MCP server (stdio transport)
npm run dev
```

### Example MCP tool calls

`search_local`
```json
{
  "tool": "search_local",
  "input": { "query": "Antwerp cocaine port", "k": 8, "alpha": 0.65 }
}
```

`get_doc`
```json
{
  "tool": "get_doc",
  "input": { "path": "./docs/ports/antwerp.pdf", "page": 12 }
}
```

---

## ChatGPT → ZIP → Markdown → Index

1. **Export chats from ChatGPT** (Profile → Settings → Data Controls → Export) and unzip locally.
2. **Convert to Markdown**
   ```bash
   npm run chatgpt:to-md -- ~/Downloads/chatgpt-export
   # → writes Markdown into ./docs/chatgpt-export-md
   ```
3. **Index the converted chats**
   ```bash
   npm run index -- ./docs/chatgpt-export-md
   ```
4. **Search from an MCP client**
   ```json
   { "tool": "search_local", "input": { "query": "Antwerp port", "k": 6 } }
   ```

Optional one-shot tool:
```json
{
  "tool": "import_chatgpt_export",
  "input": { "exportPath": "~/Downloads/chatgpt-export", "outDir": "./docs/chatgpt-export-md" }
}
```

> ⚠️ Chat exports may contain sensitive data. Keep them local and within approved roots.

---

## Configuration

Run the server once to materialize `.mcp-nn/config.json`, then tailor the defaults. Base values:

```json
{
  "roots": {
    "roots": ["./docs", "./public/dossiers", "./docs/chatgpt-export-md"],
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
- `MCP_NN_DATA_DIR` – relocate index storage.
- `TRANSFORMERS_CACHE` – control embedding model cache directory.
- `TRANSFORMERS_OFFLINE=1` – enforce offline model loads.

---

## File Types & Notes

- **PDF** – Uses `pdf-parse`. Pages with scarce text trigger an OCR warning (Tesseract recommended); encrypted PDFs are skipped.
- **Markdown** – `gray-matter` preserves front-matter (e.g., `tags`).
- **TXT** – UTF‑8 normalized to NFKC with paragraph boundaries preserved.
- **Word (`.docx`)** – Extracted via `mammoth` (clean text only).
- **Pages (`.pages`)** – `adm-zip` + `fast-xml-parser`. Modern `.iwa` archives may yield partial results; warnings are emitted without aborting.

---

## Hybrid Retrieval

1. **Dense vectors** from `@xenova/transformers` (`all-MiniLM-L6-v2`). Stored in a flat cosine index (`.mcp-nn/vectors.bin`).
2. **Keyword BM25** via FlexSearch Document index.
3. `search_local` mixes dense and keyword hits using `alpha` (default 0.65). Results include citations with file paths, page numbers, and character offsets.

Embeddings are cached locally (`.mcp-nn/embeddings-cache.json`). You can force a lightweight deterministic fallback by setting `MCP_NN_EMBED_FAKE=1` (useful for tests).

---

## Tools Overview

| Tool | Purpose |
| --- | --- |
| `search_local` | Hybrid dense + BM25 retrieval with citations |
| `get_doc` | Fetch full document text or a single PDF/Pages page |
| `reindex` | Index or refresh specific paths (defaults to configured roots) |
| `watch` | Watch filesystem paths; debounce reindexing on change |
| `stats` | Summaries: file count, chunk totals, vector cache size |
| `import_chatgpt_export` | Convert a ChatGPT export and reindex the output |

All tool inputs are validated with Zod and return JSON payloads.

---

## Operations & Deployment

- Logs are single-line JSON (`{ level, msg, ... }`). Enable debug logs with `DEBUG=1`.
- `npm run build` compiles TypeScript to `dist/` (NodeNext ESM).
- Vercel builds run `npm install` → `npm run build`; no native binaries are required.
- Clean artifacts with `npm run clean`.

### Offline Model Prep
```bash
npm run models:download
export TRANSFORMERS_OFFLINE=1
```

### CLI Helpers
- `npm run index -- <paths...>` – batch reindex.
- `npm run watch -- <paths...>` – stream JSON events while auto-indexing.
- `npm run typecheck` – strict TS compile without emit.
- `npm test` – Vitest suite (uses fake embeddings for speed).

---

## Tests

```bash
npm test
```

Includes:
- Chunk boundary validation (`tests/chunk.test.ts`).
- End-to-end reindex + search over fixtures (`tests/index-search.test.ts`).

---

## Styling & Conventions

- TypeScript, `moduleResolution: NodeNext`, strict mode.
- Functions use verbNoun names; modules stay under ~200 LOC where practical.
- Comments explain *why*, not *what*.
- Errors bubble with concise messages; logs remain structured.
- MCP outputs are deterministic and JSON-serializable.

---

## Security & Privacy

- Roots are whitelisted; realpaths prevent traversal or symlink escape.
- ZipSlip guarded for `.pages` archives.
- No outbound requests unless explicitly configured.
- Treat ChatGPT exports and indexed documents as sensitive local data.

---

## License

MIT (add your preferred license file).
