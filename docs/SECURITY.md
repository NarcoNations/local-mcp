# Security & Access Controls

## API Key Scopes
- Keys stored in Supabase `api_keys` table with `scopes` array.
- Supported scopes: `feeds:*`, `llm:*`, `ingest:*`, `publish:*`, `social:*`, `map:*`, `admin:*`.
- `/api/*` routes call `requireScope` — requests without valid keys fail with `401/403`.
- Provide client-side demos via `NEXT_PUBLIC_DEMO_API_KEY` only in non-production environments.

## HMAC Signatures
- Optional `API_HMAC_SECRET` enforces `x-signature` (hex SHA256) on request bodies.
- Signature compared after hashing to mitigate timing side-channels.

## Audit Logging
- Critical API actions insert into Supabase `audit` table via `writeAuditEvent`.
- Historian mirrors events for long-term provenance (`events` table).

## Row-Level Security
- Enable RLS on all Supabase tables; service key is only used in serverless contexts.
- For client usage, expose read-only policies scoped to authenticated users.

## Secrets & Flags
- Keep feature flags (`FF_*`) false by default in production; enable selectively per environment.
- Never commit real API keys; rely on environment variables managed via Vercel/Supabase.
