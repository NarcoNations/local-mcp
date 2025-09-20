# Local Research MCP (mcp-nn)

Offline Model Context Protocol (MCP) server for NarcoNations.org research. Index and search PDF, Markdown, TXT, Word (.docx), and Apple Pages (.pages) files with hybrid retrieval (local embeddings + BM25). Returns precise citations (file, page, char ranges, snippet). 100% local. No cloud.

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

## ChatGPT → ZIP → Markdown → Index

1. Export chats from ChatGPT (Profile → Settings → Data Controls → Export data) and unzip locally.
2. Convert to Markdown:
   ```bash
   npm run chatgpt:to-md -- ~/Downloads/chatgpt-export
   # → writes .md files into ./docs/chatgpt-export-md
   ```
3. Index the converted chats:
   ```bash
   npm run index -- ./docs/chatgpt-export-md
   ```
4. Search in your MCP client:
   ```json
   { "tool": "search_local", "input": { "query": "Antwerp cocaine port" } }
   ```

Optional one-shot tool call:

```json
{
  "tool": "import_chatgpt_export",
  "input": {
    "exportPath": "~/Downloads/chatgpt-export",
    "outDir": "./docs/chatgpt-export-md"
  }
}
```

## Configuration

`./.mcp-nn/config.json` is created on first run. Defaults:

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
- `TRANSFORMERS_CACHE` – set Xenova model cache directory.
- `TRANSFORMERS_OFFLINE=1` – enforce offline model loading.

## File Types & Caveats

- **PDF**: Uses `pdf-parse`. If a page has scarce text, it is marked `partial: true` and logged for manual OCR.
- **Markdown**: Front-matter parsed via `gray-matter`; tags preserved per chunk.
- **Text**: Plain UTF-8 with whitespace normalization.
- **Word (.docx)**: Extracted with `mammoth` (styles ignored).
- **Pages (.pages)**: Parsed via `adm-zip` + `fast-xml-parser`. Modern `.iwa` bundles fall back to partial mode (file is logged, indexing continues).

## Performance Tips

- First MiniLM model load on CPU takes ~10–30s, then uses the cached weights.
- Increase `index.chunkSize` for larger documents or decrease overlap for smaller corpora.
- Disable OCR (`index.ocrEnabled=false`) when all PDFs are digitally native.
- For corpora above ~50k chunks, consider enabling SQLite-VSS once available.

## Security & Privacy

- Strict root whitelist with realpath normalization; symlink escapes and ZipSlip paths are rejected.
- All processing stays local. No outbound network calls.
- ChatGPT exports may contain sensitive information—keep within trusted directories.

## Troubleshooting

- **Slow OCR**: Raise `ocrTriggerMinChars` or disable OCR for digital PDFs.
- **Model load errors offline**: Run `npm run models:download` and set `TRANSFORMERS_OFFLINE=1`.
- **sqlite-vss missing**: Ignored automatically; flat vector index remains active.
- **Pages file marked partial**: Export the Pages document to `.docx` or `.pdf` and reindex.
- **ChatGPT conversion fails**: Ensure `conversations.json` exists in the provided folder.

## Tests

```bash
npm test
```

Runs Vitest offline. Embedding operations are mocked by cached vectors; real-model tests require `npm run models:download` beforehand.

## Styling & Conventions

- TypeScript strict mode; prefer small, pure functions.
- Function names use `verbNoun`, types use `PascalCase`.
- Comments explain reasoning, not mechanics.
- Logging emits single-line JSON (`{ level, msg, meta }`); stacks appear only in debug/development modes.
- Validate MCP tool inputs with Zod and return deterministic JSON outputs.

## License

Released under the MIT License. See [LICENSE](./LICENSE).
