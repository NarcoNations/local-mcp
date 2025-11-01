# Supabase deployment guide

This document explains how to run the provided migrations, wire the knowledge store to Supabase, and deploy the Next.js dashboard on Vercel.

## 1. Prerequisites

- Supabase project with the vector extension enabled (run `create extension if not exists vector;`).
- Supabase CLI ≥ 1.184 (optional but recommended for migration automation).
- Node.js ≥ 20 for the Local MCP server and the Next.js example.

## 2. Apply migrations

1. Copy the SQL migrations into your Supabase workflow:
   ```bash
   cd supabase
   supabase login
   supabase link --project-ref <your-project-ref>
   supabase db push --env-file ../.env.supabase
   ```
2. The migrations create CRM/marketing/RFQ tables plus the knowledge-store stack (`knowledge_sources`, `knowledge_chunks`, `knowledge_embeddings`, `knowledge_manifests`).
3. Enable row-level security policies as needed (see `migrations/20241005070500_rls_templates.sql`). The default policy grants full access to the service role.
4. (Optional) After you accumulate thousands of embeddings, uncomment the IVFFlat index in `20241005070400_knowledge_base.sql` for faster vector search.

## 3. Configure the Local MCP server

Set the following environment variables before running `npm run dev` or building the server:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_KNOWLEDGE_NAMESPACE` (defaults to `default`)

When these are present the knowledge store transparently persists chunks, embeddings, and manifests to Supabase and mirrors them locally for offline use. Re-indexing keeps Supabase and the local cache in sync.

## 4. Validate with the Next.js dashboard

1. `cd examples/nextjs`
2. `cp .env.example .env.local`
3. Fill in the same Supabase variables and optionally `OPENAI_API_KEY` for the API manager smoke test.
4. `npm install && npm run dev`
5. Visit `http://localhost:3000` — every card should respond with JSON from your Supabase project.

The UI is fully responsive (mobile-first with cinematic scaling on large displays) and deploys cleanly on Vercel (`npm run build`).

## 5. Vercel deployment checklist

- Add the environment variables from section 3 to the Vercel project.
- If you rely on the API manager, add the relevant provider keys (OpenAI shown in the example).
- Use the default Next.js build and output settings. The example targets the Node.js runtime and works without extra configuration.
- For Supabase migrations in CI/CD, run `supabase db push` as part of your release pipeline.

## 6. Troubleshooting

| Symptom | Fix |
| --- | --- |
| `supabase-load-failed` warnings in server logs | Check service-role credentials and network access. |
| Manifest endpoint returns 500 | Ensure the migrations have been applied and RLS allows the service role. |
| API manager card shows missing key | Set `OPENAI_API_KEY` or update the dashboard to use a different provider supported by `@vibelabz/api-manager`. |

For deeper schema insight inspect the SQL migrations and the Supabase helper modules in `supabase/`.
