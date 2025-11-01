# API Manager & Routing Guide

This document captures the integration points for the policy-driven API manager that powers market data feeds and large language model routing in the Local MCP stack.

## Provider credentials

| Provider | Purpose | Configuration | Notes |
| --- | --- | --- | --- |
| Alpha Vantage | Historical/daily market data feeds | `config.providers.credentials.alphaVantage.apiKey` or `ALPHA_VANTAGE_KEY` | The UI exposes a field for entering the key. Requests fail fast if the key is missing. |
| OpenAI | Primary hosted LLM provider | `config.providers.credentials.openai.apiKey` and optional `openai.baseUrl` or env vars `OPENAI_API_KEY`, `OPENAI_BASE_URL` | Base URL enables Azure/OpenAI-compatible deployments. |
| Local mock | Deterministic offline LLM path | No credentials required | Provides a low-latency fallback and a safe default for tests. |

Credentials stored through the control room UI are written to `.mcp-nn/config.json`. Environment variables always win on startup, so keep secrets in the environment when deploying to Vercel.

## Feed caching

Feeds use an in-memory TTL cache implemented in `packages/api-manager/src/cache.ts`. The cache can be toggled and tuned via:

- UI toggle in the “API routing & providers” panel.
- `config.providers.feedCaching.enabled`
- `config.providers.feedCaching.ttlSeconds`
- Environment variables `FEED_CACHE_ENABLED` (`0`/`1`) and `FEED_CACHE_TTL_SECONDS`

Caching is applied after provider normalization so downstream consumers always receive the normalized DTO shape (`NormalizedFeedResponse`).

## LLM routing policies

Policies live under `config.providers.llmRouting`. Each rule contains `match` conditions (task, model hints, prompt fragments, provider overrides) and a `target` describing the provider/model/temperature. The default configuration ships with two OpenAI-forwarding rules, and a fallback to the local mock provider.

Policies can be edited via the HTTP API:

```
POST /api/providers/config
{
  "llmRouting": {
    "defaultProviderId": "openai",
    "fallbackProviderId": "local",
    "policies": [
      {
        "id": "summaries-low-temp",
        "match": { "tasks": ["summarize"] },
        "target": { "providerId": "openai", "model": "gpt-4o-mini", "temperature": 0.2 }
      }
    ]
  }
}
```

The control room UI mirrors these values and displays the policy count, default provider, and fallback provider. Policies are persisted to disk; you can also inject a full JSON array via the `LLM_ROUTING_POLICIES` environment variable during boot.

## Toolkit & API surface

The MCP toolkit (`src/mcp/toolkit.ts`) exposes two new tools:

- `fetch_feed` — Normalised feed fetcher with caching and provider routing.
- `route_llm` — Policy-aware LLM execution with usage reporting.

The HTTP server mirrors those capabilities:

- `POST /api/feeds` accepts `symbol`, `dataset`, optional `providerId`, and `forceRefresh`.
- `POST /api/llm/run` accepts the same payload as the MCP tool.
- `GET /api/providers` returns the manifest of feeds, LLM providers, cache status, and policy summary.
- `POST /api/providers/config` persists credential, caching, and routing updates.

Every update runs through the toolkit’s `applyConfig` hook, so the running process immediately uses the new credentials and policies.

## Operational considerations

- **Rate limits:** Alpha Vantage’s free tier is strict. When the provider returns a `Note` (rate limit warning), the API manager surfaces an error and the UI log records the failure.
- **Secrets:** Keys submitted in the UI are not echoed back; the provider cards only show “Key configured” or “Key missing”. For production, configure secrets via Vercel project settings and leave the UI fields blank.
- **Deployment:** `npm run build` now compiles the `@vibelabz/api-manager` package before bundling the HTTP/MCP servers, making the app Vercel-ready.
- **Resilience:** Local mock providers ensure the system still operates (with clear annotations) when external APIs are unreachable.

## Testing the pipeline

1. Open the control room and load the provider panel to confirm status.
2. Enter credentials or adjust routing policies, then save — the provider status grid updates instantly.
3. Use the LLM policy probe and feed probe to verify runtime routing without dropping to the terminal.
4. Monitor `/api/logs/stream` (or the on-page log) for cache hits, policy matches, and errors.
