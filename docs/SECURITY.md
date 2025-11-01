# Security — API Keys, HMAC, Audit, RLS

## API Keys & Scopes

- Keys live in the `api_keys` table with `hashed_key` (SHA-256) and `scopes` array.
- Supported scopes: `feeds:*`, `llm:*`, `ingest:*`, `publish:*`, `social:*`, `map:*`, `admin:*`.
- Requests to `/api/*` must include `X-API-Key`; middleware validates scope + updates `last_used_at`.
- Set `API_HMAC_SECRET` and send `X-API-HMAC` + `X-API-Timestamp` headers to enable optional HMAC verification.

## Row-Level Security

- Supabase RLS is enabled via prior migrations; use service role keys for server-side automation.
- New tables (jobs, policy, social, map, etc.) inherit default service-role only writes. Add org-specific policies before launch.

## Audit Trail

- `lib/audit.ts` writes to the `audit` table and mirrors critical actions into Historian.
- Key operations audited: job dispatch, policy reruns, eval runs, map/social builds, MCP publish approvals, MVP brief workflow.

## Policy Gates

- `lib/policy.ts` encapsulates the Ethics Council rules with keyword filters and crisis flags.
- Results stored in `policy_gate_logs`; `/policy` UI surfaces pass/fail decisions and shadow-self guidance.

## Secrets Management

- Never commit plaintext keys. Use Vercel envs or Supabase secrets.
- Feature flags (`FF_*`) stay false by default to avoid accidental paid-provider usage.
