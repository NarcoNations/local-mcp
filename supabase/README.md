# Supabase migrations & data access

This directory now contains production-ready migrations plus TypeScript helpers for wiring the Local MCP knowledge store to Supabase.

## Structure

```
supabase/
├── migrations/              # SQL migrations compatible with the Supabase CLI
├── client.ts                # Reusable service-role client factory
├── env.ts                   # Environment discovery helpers
└── knowledge.ts             # Knowledge-store CRUD utilities used by src/store/store.ts
```

The migrations ship tables for:

- CRM core (accounts, contacts, leads, opportunities),
- marketing analytics (campaigns, metrics, channel snapshots),
- manufacturing RFQs (requests, parts, quotes), and
- the knowledge store (`knowledge_sources`, `knowledge_chunks`, `knowledge_embeddings`, `knowledge_manifests`).

Row-level security templates and `pgvector` support are included and can be customised per project.

## Applying migrations

1. Install the Supabase CLI and authenticate: `supabase login`.
2. Target your project: `supabase link --project-ref <ref>`.
3. Run migrations from this folder:
   ```bash
   supabase db push --env-file .env.supabase
   ```
   The migrations are idempotent and safe to apply to empty projects.
4. (Optional) Enable the commented IVFFlat index on `knowledge_embeddings` once you have enough rows.

## Runtime configuration

`src/store/store.ts` auto-detects Supabase when the following environment variables are present:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_KNOWLEDGE_NAMESPACE` (defaults to `default`)

When configured, chunk metadata, embeddings, and manifests are stored in Supabase and mirrored locally for offline caching.

Refer to [`../docs/supabase.md`](../docs/supabase.md) for end-to-end deployment and Vercel guidance.
