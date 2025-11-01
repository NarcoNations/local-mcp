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
npm run dev               # start stdio MCP + HTTP/SSE bridge + control room UI
```

### Runtime options

- `npm run dev` – launches both transports: the stdio MCP server and the HTTP bridge/UI on <http://localhost:3030>.
- `npm run dev:mcp` – run just the stdio transport (handy for CLI clients).
- `npm run dev:http` – run only the HTTPS/SSE bridge and web UI during development.
- `npm start` – serve the compiled HTTP bridge + UI (after `npm run build`).
- `npm run start:mcp` – serve the compiled stdio-only server.

In an MCP-enabled client (Custom GPT, Claude Desktop, etc.) point at the SSE manifest (see below) or fall back to the stdio command in `metadata.stdio`.

### Web control room UI

The UI (served from <http://localhost:3030>) is fully responsive, mobile-first, and cinematic on wide screens. It provides:

- Search with hybrid dense/keyword retrieval, result filtering, expandable source previews, and clipboard-ready citations.
- Real-time index stats (files, chunks by type, embedding cache size, last indexed timestamp).
- Maintenance actions: manual reindex, watcher activation, ChatGPT export import.
- Live activity log streamed via SSE for visibility into reindexing, watch events, and bridge status.

The UI is bundled into the Vercel-friendly build output (`npm run build`) and served by the HTTP bridge.

### Expose the bridge to ChatGPT (HTTPS + SSE)

1. Start the bridge: `npm run dev:http` (or `npm start` after `npm run build`).
2. Publish the service behind HTTPS using a tunnel such as
   - `cloudflared tunnel --url http://localhost:3030`
   - `ngrok http 3030`
3. Update `mcp.json`'s `transport.url` with the HTTPS URL from your tunnel (for example `https://your-subdomain.trycloudflare.com/mcp/sse`).
4. Ensure the manifest itself is reachable at `https://your-domain/mcp.json` – the bridge serves the file automatically.
5. In ChatGPT (or any SSE-aware MCP client) add the manifest URL. The client will connect via SSE, and log messages/watch notifications propagate automatically.

`metadata.stdio` retains the stdio command for clients that prefer local execution.

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

### Build & output configuration

- `vercel.json` pins the build command to `npm run vercel-build`, sets the output directory to `dist/`, and forwards `NODE_OPTIONS=--enable-source-maps` so stack traces stay readable in serverless logs.
- `npm run vercel-build` performs a clean build (`rimraf dist`) before compiling TypeScript with `tsconfig.build.json`. The config emits flat entry points (`dist/http.js`, `dist/server.js`, `dist/cli-*.js`) that align with the production `npm start` scripts Vercel invokes during runtime checks.
- Static assets from `public/` are copied into `dist/` by `scripts/copy-static.mjs`, so the responsive control room UI ships alongside the compiled server files without any extra routing rules.
- Ensure the Vercel project targets **Node.js 20** and uses the "Other" framework preset so the settings from `vercel.json` take effect unchanged.

### Runtime environment variables

Configure these in the Vercel project ("Settings → Environment Variables" or `vercel env add`). Defaults are shown for context; omit optional keys unless you need to override the behaviour.

| Variable | Required | Default | Purpose |
| --- | --- | --- | --- |
| `MCP_NN_DATA_DIR` | No | `.mcp-nn` | Persisted index + cache directory. Override when using an attached volume. |
| `TRANSFORMERS_CACHE` | No | derived from `MCP_NN_DATA_DIR` | Controls where `@xenova/transformers` stores model weights. |
| `MCP_ALLOW_ORIGINS` | No | `*` (Express `cors` default) | Restrict UI/API origins during SSR/preview mode. Comma-separated list. |
| `MCP_ALLOWED_ORIGINS` | No | unset | Extra allow-list for SSE sessions (in addition to `MCP_ALLOW_ORIGINS`). |
| `MCP_ALLOWED_HOSTS` | No | unset | Optional host allow-list for SSE DNS-rebinding protection. |
| `MCP_ENABLE_DNS_REBINDING` | No | `0` | Set to `1` to enable the SDK's DNS rebinding guard on the SSE transport. |
| `HTTP_PORT` / `PORT` | No | `3030` | Override the HTTP listener port. Vercel supplies `PORT` automatically in production. |
| `HOST` | No | `0.0.0.0` | Bind address for the HTTP server. Vercel ignores this and injects its own. |
| `SAMPLE_PDF` | No | `./test/data/05-versions-space.pdf` | Change the demo document parsed at startup. |
| `DISABLE_SAMPLE_PDF` | No | `0` | Set to `1` to skip demo parsing entirely. |
| `DEBUG` | No | `0` unless `NODE_ENV=development` | Enables verbose JSON logging. |

### Optional provider secrets

Only add these when enabling the optional adapters:

- `OPENAI_API_KEY` – required by the LLM probe in `packages/api-manager`.
- `ALPHA_VANTAGE_KEY` – enables the AlphaVantage feed probe in `packages/api-manager`.
- `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_KEY`, `SUPABASE_BUCKET_FILES` – power the Supabase ingestion paths in `examples/next-adapter`.
- `MD_CONVERT_URL` – remote Markdown conversion endpoint consumed by the Next.js ingest routes.
- `TELEMETRY_BEARER_TOKEN` – secures the optional telemetry API route in the adapter.
- `INGEST_SUPABASE` – toggle (set to `true`) to enable Supabase ingestion inside the example adapter.

### Local verification

Before pushing a change, run the same steps Vercel will execute:

```bash
npm run vercel-build
npx vercel build --yes
```

The second command requires a Vercel login/token and outbound network access; skip or mock it in CI environments without internet connectivity.

## Styling & conventions

- TypeScript (strict) + ESM (`NodeNext`).
- Small, pure functions with early returns.
- Deterministic logging: single-line JSON (`{ level, msg, ... }`).
- Tool I/O validated with Zod.
- Comments explain intent, not implementation.

## License

MIT (add your license of choice).
