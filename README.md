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

# 2) (Optional) Prefetch the embedding model for fully offline use
npm run models:download

# 3) Index your folders
npm run index -- ./docs ./public/dossiers ./pdfs

# 4) Run the MCP server (stdio)
npm run dev
```

### Example MCP tool calls

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

---

## ChatGPT → ZIP → Markdown → Index

1. Export chats from ChatGPT (Settings → Data Controls → Export) and unzip locally.
2. Convert the export to Markdown:
   ```bash
   npm run chatgpt:to-md -- ~/Downloads/chatgpt-export
   ```
   Files are written to `./docs/chatgpt-export-md` by default.
3. Index the converted chats:
   ```bash
   npm run index -- ./docs/chatgpt-export-md
   ```
4. Search from your MCP client:
   ```json
   { "tool": "search_local", "input": { "query": "Antwerp cocaine port", "k": 8 } }
   ```

**One-shot MCP tool**

```
import_chatgpt_export {
  "exportPath": "~/Downloads/chatgpt-export",
  "outDir": "./docs/chatgpt-export-md"
}
```

> Privacy: Chat exports may contain sensitive information. Keep them local.

---

## Configuration

After first run, inspect `.mcp-nn/config.json`. Defaults:

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
- `MCP_NN_DATA_DIR` – change index storage directory.
- `TRANSFORMERS_CACHE` – control model cache location.
- `TRANSFORMERS_OFFLINE=1` – force fully offline model loads.

---

## File Types & Caveats

- **PDF**: Uses `pdf-parse`. Pages with scarce text are flagged and logged; files continue indexing.
- **Markdown**: `gray-matter` preserves front-matter metadata.
- **Word (.docx)**: `mammoth` extracts clean text.
- **Pages (.pages)**: Parsed with `adm-zip` + `fast-xml-parser`. Modern `.iwa` bundles set `partial: true` and log a warning.

---

## Performance Tips

- First embedding model load on CPU: ~10–30s, then cached.
- Enable OCR only when handling scanned PDFs; otherwise increase `ocrTriggerMinChars` or disable OCR.
- For large corpora (> ~50k chunks), consider enabling SQLite VSS once the extension is available.

---

## Security & Privacy

- Strict roots whitelist with realpath checks; paths outside the configured roots are rejected.
- Zip handling guards against ZipSlip.
- Default offline; no outbound calls unless you add them.
- Treat ChatGPT exports as sensitive data and keep them within local roots.

---

## Troubleshooting

- **Slow OCR**: Increase `ocrTriggerMinChars` or disable OCR for digital PDFs.
- **Model will not load offline**: Run `npm run models:download` and set `TRANSFORMERS_OFFLINE=1`.
- **sqlite-vss unavailable**: The server falls back to the flat vector index automatically.
- **Pages marked partial**: Export the `.pages` document to `.docx` or `.pdf` for full fidelity.
- **Chat export errors**: Ensure `conversations.json` exists in the provided folder.

---

## Tests

```bash
npm test
```

Runs Vitest offline (embeddings are mocked). Real-model tests require `npm run models:download` beforehand.

---

## Styling & Conventions

- TypeScript strict mode; prefer small, pure functions with early returns.
- VerbNoun function names, PascalCase types, camelCase variables.
- Modules ~200 lines max; split by concern (`indexers/`, `pipeline/`, `store/`, `tools/`).
- Comments explain “why”, not “what”.
- Errors include concise messages and affected paths.
- Logging emits single-line JSON: `{ level, msg, time, ... }`; DEBUG controlled via env.
- Tool I/O validated with Zod; outputs stay JSON-serializable with explicit fields.
- Docs written in imperative mood (“Run…”, “Use…”).
- Offline-first: no network calls after model download.

---

## License

MIT
