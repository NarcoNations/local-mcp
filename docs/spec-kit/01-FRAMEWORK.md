# 01 — Framework & Conventions

**Runtime:** Node 18+ (ESM), TypeScript.
**Style:** Prettier + ESLint.
**Build:** tsup (or tsc) to `dist/`.
**Scripts:**
- `dev`: ts-node/tsx watch server
- `build`: typecheck + bundle
- `start`: `node dist/server.js`

**Module boundaries**
- `src/server`: process bootstrap + MCP stdio
- `src/http`: express/fastify-like HTTP + SSE
- `src/tools`: MCP tool implementations
- `src/indexers`: file → text → chunks → vectors
- `src/store`: vector + keyword index wrappers
- `src/utils`: logger, config, errors

**Commit hygiene**
- Conventional commits (feat, fix, docs, chore).
- Small PRs; include `/docs/specs/*.yml` when behaviour changes.
