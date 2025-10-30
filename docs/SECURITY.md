# Security & Access Controls

## API Keys & Scopes

API keys live in the `api_keys` table with the following columns:

- `id` (uuid)
- `name`
- `secret`
- `scopes` (text[])
- `created_at`
- `last_used_at`

Scopes supported by the adapter:

- `feeds:*`
- `llm:*`
- `ingest:*`
- `publish:*`
- `social:*`
- `map:*`
- `admin:*`

Requests must include an `x-api-key` header (or `Authorization: Bearer`) matching a stored secret.
The `lib/security/apiKeys.ts` helper enforces scope checks and records audit entries.

## HMAC Signatures

For server-to-server calls, add `x-signature` and `x-timestamp` headers.
We compute `sha256(timestamp:url)` using the API key secret and verify it with a constant-time comparison.
Missing signatures default to allow-list behaviour for internal dashboards.

## Audit Log

Critical calls insert into the `audit` table and mirror to Historian events.
The schema: `{ ts timestamptz, actor text, action text, resource text, meta jsonb }`.

## Row-Level Security (RLS)

Supabase projects should enable RLS on all tables. The adapter assumes service key access when writing records.
Grant read-only access to anonymous clients only for published/approved tables (`knowledge`, `events`, `map_layers`, etc.).

## Storage Bundles

The MCP publish endpoint writes packages to Supabase Storage (bucket `files` by default). Enable signed URLs and
short TTLs for downstream CMS fetches.

## USE_MOCKS

With `USE_MOCKS=true` the adapter avoids remote writes, returning synthetic responses so that developers can
exercise the UI and flows without leaking secrets.
