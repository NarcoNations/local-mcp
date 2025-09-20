# Local Research MCP (mcp-nn)

Offline Model Context Protocol (MCP) server for NarcoNations.org research. Index and search PDF, Markdown, TXT, Word (.docx), and Apple Pages (.pages) with hybrid retrieval (local embeddings + BM25). Returns precise citations (file, page, char ranges, snippet). 100% local. No cloud.

## Quickstart

### Requirements

- Node.js 20+
- macOS, Windows, or Linux

```bash
npm install
npm run models:download   # optional: prefetch MiniLM weights for offline mode
npm run index -- ./docs ./public/dossiers
npm run dev               # start stdio server + web console/SSE bridge on http://localhost:3000
```

Open `http://localhost:3000` for the responsive control panel. `npm run dev` launches both the classic stdio transport and the
new HTTP server that exposes the GUI, JSON APIs, and the SSE bridge required for ChatGPT connectors. To run only the stdio serve
r, use `npm run dev:mcp` and the manifest in `mcp-stdio.json`.

### Example tool calls

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

## Web console & JSON APIs

The HTTP server served from `src/http.ts` powers a responsive control panel at `http://localhost:3000` and exposes REST endpoints
that mirror the MCP tools. The UI is fully responsive (mobile through ultra-wide) and includes:

- **Hybrid search:** run `search_local`, adjust `k`, `alpha`, and apply document-type filters.
- **Document viewer:** preview snippets returned by `get_doc` with highlighted spans.
- **Indexer controls:** trigger `reindex`, start `watch`, and invoke `import_chatgpt_export` without leaving the browser.
- **Stats dashboard:** live counts from `stats`, including per-type chunk totals and timestamp metadata.
- **Event stream:** the UI subscribes to `/api/events` (Server-Sent Events) for watch notifications, reindex runs, and import logs.

JSON endpoints are available if you prefer scripting against the bridge directly:

| Method | Path | Description |
| ------ | ---- | ----------- |
| `POST` | `/api/search` | Call `search_local` with the standard payload. |
| `POST` | `/api/get-doc` | Fetch raw text for a file or page via `get_doc`. |
| `POST` | `/api/reindex` | Trigger `reindex` for the configured roots or custom paths. |
| `POST` | `/api/watch` | Enable the chokidar watcher (`watch` tool) for roots or user-provided directories. |
| `GET`  | `/api/stats` | Return the manifest summary from `stats`. |
| `POST` | `/api/import-chatgpt` | Execute `import_chatgpt_export`. |
| `GET`  | `/api/events` | SSE feed with runtime activity, watch events, and logs. |

All endpoints respond with JSON (error objects include an `error` message) and support CORS for HTTPS deployments.

## ChatGPT & SSE transport

`mcp.json` now advertises the SSE endpoint (`https://localhost:3000/mcp` by default). Replace the hostname with your public
reverse-tunnel domain when exposing the bridge to ChatGPT. A typical flow:

1. Start the bridge: `npm run dev` (or `npm run dev:http` for the HTTP server only).
2. Publish the HTTP/SSE server via TLS (e.g. `cloudflared tunnel --url http://localhost:3000` or `ngrok http 3000`).
3. Update `mcp.json`'s `transport.url` with the HTTPS URL returned by your tunnel.
4. Host the manifest somewhere reachable by ChatGPT (GitHub Pages, Vercel, etc.) and register it with a Custom GPT.

The legacy stdio manifest is preserved as `mcp-stdio.json` for clients that still consume the process transport directly.

## ChatGPT → ZIP → Markdown → Index

1. Export chats from ChatGPT (`Settings → Data Controls → Export data`) and unzip locally.
2. Convert to Markdown: `npm run chatgpt:to-md -- ~/Downloads/chatgpt-export`
   - Files land in `./docs/chatgpt-export-md`
3. Index the converted chats: `npm run index -- ./docs/chatgpt-export-md`
4. Search in your MCP client: `search_local { "query": "Antwerp cocaine port" }`

One-shot tool call:

```json
{
  "tool": "import_chatgpt_export",
  "input": {
    "exportPath": "~/Downloads/chatgpt-export",
    "outDir": "./docs/chatgpt-export-md"
  }
}
```

## Available Tools

| Tool | Description |
| ---- | ----------- |
| `search_local` | Hybrid dense + keyword search with deterministic citations. |
| `get_doc` | Return full text for a file or specific PDF/Pages page. |
| `reindex` | Rebuild indexes for configured roots or provided paths. |
| `watch` | Watch directories via chokidar and trigger incremental reindexing. |
| `stats` | Manifest summary (files, chunks, counts by type, embedding cache size). |
| `import_chatgpt_export` | Convert ChatGPT exports to Markdown and reindex the output. |

## Configuration

After the first run a resolved config is written to `.mcp-nn/config.json`.

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
- `TRANSFORMERS_CACHE` – override Xenova model cache directory.
- `TRANSFORMERS_OFFLINE=1` – enforce offline model loads.

## Data flow & storage

- Manifest: `.mcp-nn/manifest.json`
- Chunk metadata: `.mcp-nn/chunks.json`
- Vector store: `.mcp-nn/vectors.bin` + manifest
- Embeddings cache: `.mcp-nn/embeddings/*.bin`

`npm run clean` removes `.mcp-nn` and `dist`.

## File type coverage

- **PDF** via `pdf-parse`. Low-density pages automatically render the sheet to an in-memory canvas and run offline `tesseract.js` OCR (requires the optional `canvas` native dependency). If OCR cannot run, the file is still indexed with `partial:true` so you can address it later.
- **Markdown** via `gray-matter`, preserving front-matter tags.
- **TXT** raw UTF-8.
- **Word (.docx)** via `mammoth`.
- **Pages (.pages)** via `adm-zip` + `fast-xml-parser`; modern `.iwa` bundles marked `partial:true` if text extraction fails.

Chunks use deterministic UUIDv5 IDs (path, page, offset) for stable reindexing.

## Embeddings & retrieval

- Embeddings via `@xenova/transformers` MiniLM (`pipeline('feature-extraction')`).
- Cache per chunk hash on disk and in memory.
- Dense vectors stored in a flat cosine index (`.mcp-nn/vectors.bin`).
- Keyword search with FlexSearch (document mode).
- Hybrid scoring: dense + keyword scores normalized and blended by `alpha` (default 0.65).

## Watch mode

`npm run watch -- ./docs`

- Uses chokidar with write-finish debounce (200 ms).
- On file add/change: reindex file.
- On unlink: reindex containing directory to purge stale chunks.
- Emits MCP logging notifications with `{ event: "watch", path, action }` payloads.

## Security & privacy

- Roots whitelist enforced by realpath checks.
- Symlinks outside roots rejected.
- ZipSlip guard for `.pages` archives.
- No outbound network calls.
- Configurable max file size (default 200 MB) and OCR character threshold.

## Tests

```bash
npm test
```

Vitest covers chunking, hybrid storage, PDF OCR fallback (mocked), and ChatGPT conversion smoke tests.

## Vercel deployment

`vercel.json` is configured to run `npm run build` and publish `dist/` (which now contains static docs alongside compiled JS). The build avoids native dependencies, making the project safe for Vercel preview builds.

## Styling & conventions

- TypeScript (strict) + ESM (`NodeNext`).
- Small, pure functions with early returns.
- Deterministic logging: single-line JSON (`{ level, msg, ... }`).
- Tool I/O validated with Zod.
- Comments explain intent, not implementation.

## License

MIT (add your license of choice).
