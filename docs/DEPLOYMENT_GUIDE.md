# Deployment, API Manager, and Testing Guide

## Overview

This guide complements the root `README.md` with deeper operational details for deploys, the API manager feature set, and the
test suite that guards the Narco Nations Local MCP stack.

## Deployment playbooks

### Local development

1. Install dependencies: `npm install` (Node.js 20+).
2. Start both transports with hot reload: `npm run dev` (stdio MCP + HTTP/SSE bridge + responsive control room UI).
3. Watch reindex activity in the terminal or the UI's live event stream.
4. Optionally run `npm run watch -- ./docs` to trigger incremental indexing on file changes.

### Secure tunnels for MCP clients

- Use `cloudflared tunnel --url http://localhost:3030` or `ngrok http 3030` to expose the SSE bridge.
- Update `mcp.json` → `transport.url` with the HTTPS tunnel endpoint (for example `https://yourname.trycloudflare.com/mcp/sse`).
- Share the hosted manifest with ChatGPT, Claude Desktop, or any SSE-aware MCP client.

### Vercel deployment

| Step | Action |
| ---- | ------ |
| Project | `vercel link` or connect the GitHub repository so preview deployments run automatically. |
| Build | `vercel.json` already pins `npm install` and `npm run build`. No framework autodetect is required. |
| Output | The build publishes `dist/` which bundles the HTTP bridge (`dist/http.js`), the stdio server (`dist/server.js`), and static assets. |
| Runtime | Set `NODE_OPTIONS=--enable-source-maps` (already defined in `vercel.json`) so stack traces map cleanly. |
| Environment | Add provider keys (`TRADEOPS_API_KEY`, `TIINGO_API_KEY`, `FINNHUB_API_KEY`, etc.), Supabase credentials, and feature flags via Vercel's Environment Variables UI. |
| Secrets | For HMAC signing set `API_SIGNING_SECRET`; never commit it. |
| Cron | Configure Vercel Cron to hit `/api/jobs/dispatch` for scheduled reindexing, or your own automation endpoints. |
| Observability | Enable Vercel Logs and Analytics to monitor API manager latencies across previews and production. |

### Self-hosted / bare metal

1. `npm install --omit=dev`
2. `npm run build`
3. Run `node --enable-source-maps dist/http.js` (optionally under `pm2`, `systemd`, or Docker).
4. Terminate TLS with nginx/Caddy and reverse proxy `/mcp/sse` and `/api/*` to the bridge.
5. Mirror the same environment variables you maintain in Vercel. Keep secrets in your host's secret manager.

## API manager feature map

| Capability | Details |
| ---------- | ------- |
| Provider adapters | Normalise TradeOps, Finnhub, Tiingo, and internal Narco Nations feeds using shared DTOs. |
| Multi-channel caching | 60 second TTL caches per provider with stale-if-error fallbacks for resilience. |
| Rate limiting & retries | Automatic exponential backoff on 429/5xx responses plus circuit-breaker metrics emitted to the Historian. |
| Secure access | API keys scoped by intent (`feeds:*`, `llm:*`, `ingest:*`, `social:*`, `map:*`, `admin:*`). Requests require an `X-API-Key` header, optional HMAC signatures, and can be IP allowlisted via middleware. |
| LLM orchestration | Routes inference workloads through configured providers with temperature caps, token budgeting, and provider failover. |
| Historian integration | Every request and response summary is logged for auditability and surfaced in the UI timeline widgets. |
| MCP tooling | API manager DTOs are reused across MCP tools so automations, CLI scripts, and UI panels share a single contract. |

### Responsiveness for API manager surfaces

- **Mobile:** dashboards collapse into stacked cards; API key management uses modal sheets with large tap targets; charts provide sparkline previews.
- **Desktop:** data tables unlock progressive disclosure (column pinning, hover micro-interactions) while staying within the 16 px baseline grid.
- **Wide displays:** cinematic layouts introduce side-by-side provider comparisons and streaming logs with soft gradients matching Narco Nations' brand kit.

## Testing & validation

| Command | Purpose |
| ------- | ------- |
| `npm test` | Executes the Vitest suite in CI mode (chunking, hybrid retrieval, OCR fallback, ChatGPT export ingest). |
| `npm test -- --watch` | Runs Vitest in watch mode for rapid feedback. |
| `npm run typecheck` | Enforces strict TypeScript types across the MCP server, API manager, and UI DTOs. |
| `npm run build` | Compiles TypeScript to `dist/` exactly as Vercel will. |
| `npm run lint` | *(Reserved for future ESLint integration — run once available.)* |

### Additional checks

- Validate API credentials locally with `curl` hitting `/api/feeds/{provider}` before pushing to Vercel.
- Ensure responsive layouts using Chrome DevTools device toolbar; focus rings and keyboard navigation must remain intact.
- Confirm SSE clients reconnect cleanly by toggling network throttling — Historian events should resume without manual refresh.

## Contributor tips

- Keep `vercel.json` in sync with any new build steps; contributors rely on it for local `vercel dev` runs.
- Document new environment variables in this guide and the README whenever provider integrations expand.
- When adding API manager endpoints, extend the DTO schema tests and update the responsive UX checklist above.

