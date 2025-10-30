# Security & Access Control

## API Keys

- Table: `api_keys` (id UUID/string, name, scopes[], created_at, last_used_at).
- Scopes follow `domain:*` syntax: `feeds:*`, `llm:*`, `ingest:*`, `publish:*`, `social:*`, `map:*`, `admin:*`.
- Requests include `x-api-key` (or `Authorization: Bearer`); middleware validates scope + updates `last_used_at`.
- Demo mode: set `USE_MOCKS=true` and `NEXT_PUBLIC_DEMO_KEY=demo-key` to exercise UI without Supabase.

## Scope Enforcement

`validateApiKey` requires a scope + emits audit events via `recordAudit`. All `/api/*` routes call it with an explicit action/resource so audit trails stay consistent.

## HMAC Signatures (Optional)

For server-to-server integrations (n8n, Vercel Cron) attach a secondary header:

```
X-Signature: sha256=<hex>
```

Calculate using a shared secret + raw body. The helper is stubbed; extend `lib/security` to verify signature before processing payloads.

## Audit Trail

- Table: `audit` (`ts`, `actor`, `action`, `resource`, `meta`).
- Historian mirrors critical events (jobs transitions, policy gates, publish approvals).
- View mocks via `mockAuditLog`; wire dashboards to Supabase to inspect production logs.

## Row-Level Security

Reminder: enable RLS on all Supabase tables. Provide policies for studio roles (producer, analyst, automation). Existing migrations include examples; replicate patterns for new tables (`provider_usage`, `service_health`, etc.).

## Storage & Secrets

- Store publish packages in Supabase Storage or S3 with signed URLs.
- Keep `SUPABASE_SERVICE_KEY` and API secrets in Vercel project environment variables.
- Avoid embedding secrets client-side; only `NEXT_PUBLIC_*` values are exposed.
