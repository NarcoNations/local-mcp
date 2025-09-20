# mcp-nn

Local MCP server utilities for NarcoNations.org research workflows.

## Development

```bash
npm install
npm run dev
```

## Tests

```bash
npm test
```

## Building on Vercel

This project builds cleanly on Vercel without requiring any native binaries. The optional `sqlite3` dependency was removed to prevent native compilation during pull requests. Vercel installs dependencies with `npm install` and runs `npm run build`, producing artifacts in `dist/`.

If you need SQLite vector support locally, install `sqlite3` manually:

```bash
npm install sqlite3 --save-optional
```

The Vercel configuration is tracked in `vercel.json` to guarantee reproducible builds.
