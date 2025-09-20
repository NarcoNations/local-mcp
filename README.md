# Local Research MCP (mcp-nn)

Offline-first Model Context Protocol (MCP) server for NarcoNations.org research. Index and search PDFs, Markdown, text, Word, Pages, and ChatGPT exports locally with hybrid retrieval (MiniLM embeddings + BM25 keywords) and precise citations.

## Quickstart

### Requirements

- Node.js 20+
- npm

```bash
npm install
# Optional: prefetch embedding weights for offline use
npm run models:download
```

### Index your corpus

```bash
# Index default roots (./docs, ./public/dossiers, ./docs/chatgpt-export-md)
npm run index

# Index specific folders
npm run index -- ./docs ./fixtures
```

### Run the MCP stdio server

```bash
npm run dev
```

In an MCP-enabled client, call tools such as:

```json
{
  "tool": "search_local",
  "input": { "query": "Antwerp cocaine port", "k": 8, "alpha": 0.65 }
}
```

```json
{
  "tool": "get_doc",
  "input": { "path": "docs/dossiers/ports.md" }
}
```

## ChatGPT → Markdown → Index

1. Export chats from ChatGPT and unzip locally.
2. Convert to Markdown:

   ```bash
   npm run chatgpt:to-md -- ~/Downloads/chatgpt-export
   ```

   Writes `.md` files to `./docs/chatgpt-export-md`.

3. Index the converted transcripts:

   ```bash
   npm run index -- ./docs/chatgpt-export-md
   ```

4. (Optional) Single-call MCP tool:

   ```json
   {
     "tool": "import_chatgpt_export",
     "input": {
       "exportPath": "~/Downloads/chatgpt-export",
       "outDir": "./docs/chatgpt-export-md"
     }
   }
   ```

## Tooling Overview

| Tool | Purpose |
| --- | --- |
| `search_local` | Hybrid dense + keyword search with citations |
| `get_doc` | Retrieve full document text or PDF/page content |
| `reindex` | Rebuild index for paths or default roots |
| `watch` | Live file watching with automatic reindexing |
| `stats` | Corpus statistics (files, chunk counts, averages) |
| `import_chatgpt_export` | Convert ChatGPT exports to Markdown and index |

All tool inputs are validated with Zod and return both human-readable text and structured JSON.

## Configuration

On first run a config is written to `.mcp-nn/config.json`:

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
  "out": {
    "dataDir": ".mcp-nn"
  }
}
```

Environment overrides:

- `MCP_NN_DATA_DIR` – change storage directory
- `TRANSFORMERS_CACHE` – custom cache for embeddings
- `TRANSFORMERS_OFFLINE=1` – enforce offline model loads
- `MCP_NN_EMBED_STUB=1` – test-mode deterministic embeddings

## Implementation Notes

- **Indexing:** Type-specific loaders (`pdf`, `markdown`, `text`, `word`, `pages`) normalize text, enforce chunk boundaries, and generate stable UUIDv5 chunk IDs.
- **Hybrid retrieval:** Dense vectors stored via a flat cosine index with JSON persistence; keyword matches use FlexSearch.
- **Citations:** Every search hit includes file path, page (when applicable), offsets, and a trimmed snippet.
- **Watch mode:** Uses `chokidar` to reindex changed files and prune deleted entries, emitting JSON watch events.
- **Embedding cache:** Local JSON-backed cache keyed by chunk ID to avoid recomputation.
- **Security:** Paths are normalized against configured roots and archive traversal is prevented.

## Vercel Deployment

The project builds on Vercel using the provided `vercel.json`:

- `installCommand`: `npm install`
- `buildCommand`: `npm run build`
- `outputDirectory`: `dist`

The build script compiles TypeScript (`npm run build:ts`) and copies the static landing page from `public/` to `dist/`. The generated `dist/index.html` provides a responsive cinematic overview suitable for desktop and mobile.

## Static Landing Page

The `public/index.html` hero page is responsive across breakpoints, presenting the NarcoNations MCP mission with cinematic styling and actionable links. It is included in the deployment output so Vercel serves a branded landing experience instead of a 404.

## Testing

Vitest covers chunking behavior and end-to-end indexing using fixtures:

```bash
npm test
```

To force deterministic embeddings during tests (avoiding model downloads), the suite sets `MCP_NN_EMBED_STUB=1`.

## Build Artifacts

```bash
npm run build    # runs tsc and copies static assets
npm run clean    # removes .mcp-nn data and dist output
```

## Code Style & Logging

- Strict TypeScript (NodeNext modules)
- Single-line JSON logs (`logger.info|warn|error`)
- Functions named `verbNoun`, types in PascalCase
- No silent failures; warnings include file context

## License

MIT (add your preferred license file as needed).
