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
npm run dev               # start stdio MCP + HTTPS/SSE bridge + web control center
```

Open <https://localhost:3040> for the responsive control center, or run `npm run dev:mcp` if you only need the stdio server.
For SSE clients (ChatGPT MCP beta, Claude Desktop, etc.) point the manifest at `https://localhost:3040/mcp/stream`.

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

## Web control center

- `npm run dev` serves the dashboard at <https://localhost:3040> with a development TLS certificate (`dev-key.pem`/`dev-cert.pem`).
- Fully responsive layout: mobile-first controls collapse into a single column, while large displays gain a cinematic split view with live logs.
- Features
  - Hybrid search runner with filter chips and modal document viewer (`get_doc` under the hood).
  - Reindex trigger (`reindex`) and chokidar-based watch starter (`watch`).
  - Corpus stats (`stats`) rendered as live counts and per-type breakdown.
  - Live JSON log feed streamed over Server-Sent Events.
- All UI actions call the same tool implementations exposed to MCP clients, so behaviour matches scripted usage.

REST endpoints (consumed by the UI) live under `/api/*`:

| Endpoint | Method | Description |
| -------- | ------ | ----------- |
| `/api/search` | POST | Proxy to `search_local` |
| `/api/get-doc` | POST | Proxy to `get_doc` |
| `/api/reindex` | POST | Proxy to `reindex` |
| `/api/watch` | POST | Proxy to `watch` |
| `/api/stats` | GET | Returns manifest snapshot |
| `/api/logs` | GET | Returns recent log buffer |

## HTTPS + SSE bridge for ChatGPT / Custom GPTs

The new bridge exposes an MCP-compliant SSE transport and static manifest suitable for ChatGPT's MCP beta:

1. Launch the bridge with TLS (self-signed dev certs are bundled). Override with `TLS_CERT_PATH`/`TLS_KEY_PATH` if you have trusted certificates.
2. If you prefer to terminate TLS elsewhere, set `HTTP_ONLY=1` and place the service behind an HTTPS tunnel (e.g. `cloudflared`, `ngrok`).
3. Ensure the manifest is reachable: `https://<your-host>/mcp.json` (served automatically by the bridge).
4. Update `mcp.json`'s `transport.url` to the public HTTPS origin (defaults to `https://localhost:3040/mcp/stream`). Remove the placeholder `x-mcp-token` header or replace it with your own secret.
5. For ChatGPT, host the manifest somewhere permanent (GitHub Pages, S3) or use the tunnel URL directly, then add the tool via the MCP beta UI.

Tunnelling example with Cloudflare (serves HTTPS for free):

```bash
cloudflared tunnel --url https://localhost:3040
```

### Bridge environment variables

- `PORT` / `HOST` – bind address for the HTTPS bridge (default `3040` / `0.0.0.0`).
- `TLS_CERT_PATH` / `TLS_KEY_PATH` – PEM paths for HTTPS. Defaults to `dev-cert.pem` and `dev-key.pem` if present.
- `HTTP_ONLY=1` – disable TLS and serve plain HTTP (use with an external reverse proxy).
- `CORS_ORIGIN` – override CORS headers (defaults to `*`).
- `API_PREFIX` – customise REST prefix (defaults to `/api`).
- `MCP_STREAM_PATH` / `MCP_MESSAGE_PATH` – adjust SSE endpoints (`/mcp/stream` + `/mcp/messages`).
- `LOG_STREAM_PATH` – customise the live log SSE endpoint (`/logs/stream`).

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
