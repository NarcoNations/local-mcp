# 03 — Components (Modules)

- **createMcpServer.ts** — wires tools, transports, health.
- **tools/**
  - `searchLocal.ts` — hybrid BM25 + vector top‑K.
  - `reindex.ts` — full/partial rebuilds.
  - `ingest.ts` — ChatGPT export → JSONL → index.
  - `watch.ts` — fs events → SSE events.
- **http.ts** — REST, SSE, static GUI, well‑known.
- **store/** — abstraction over embeddings + keyword index.
- **utils/logger.ts** — structured logs; levels.
- **config.ts** — env, defaults, guards.

> **Edit here:** confirm exact filenames after syncing with repo tree.
