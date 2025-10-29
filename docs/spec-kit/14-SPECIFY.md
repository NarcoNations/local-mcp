# 14 — Specify Methodology

Use this lightweight **Specify** sheet per change. Save as `/docs/specs/{id}-{slug}.yml`.

```yaml
spec:
  id: "{YYYYMMDD}-{slug}"
  title: "{Change title}"
  owner: "Tech Syndicate"
  date: "2025-10-29"
  status: draft|approved|shipped
context:
  problem: |
    Why this change matters.
  goals:
    - "..."
  non_goals:
    - "..."
requirements:
  functional:
    - "..."
  non_functional:
    - performance: "P50 SSE latency < 100ms local"
    - security: "CORS locked to trusted"
interfaces:
  http:
    - path: "/.well-known/mcp.json" method: GET
    - path: "/events" method: GET (SSE)
  mcp_tools:
    - name: search_local params: { q: string, topK?: number }
    - name: reindex params: { full?: boolean }
  cli:
    - cmd: "npm run build"
    - cmd: "node dist/server.js"
data:
  schema_refs:
    - "docs/08-DATA_MODEL.md"
risks:
  - "CORS misconfig blocks ChatGPT"
  - "Index rebuild latency"
tests:
  - "curl OPTIONS preflight returns allowed headers"
  - "manifest resolves under /.well-known"
rollout:
  plan:
    - "PR → main (or rollup branch)"
    - "Smoke → promote"
  fallback:
    - "Revert commit on branch"
```
