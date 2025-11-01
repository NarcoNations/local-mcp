# Supabase Schema Stubs

This folder contains **starter SQL** for CRM, Marketing Analytics, Manufacturing RFQ, knowledge sync, and API manager flows.

> All files are **safe to run** in a new Supabase project. Review and adapt before applying to production.

## Apply migrations in order

```bash
# in the Supabase SQL editor (or psql)
-- 0001_crm.sql          Accounts, contacts, leads, opportunities
-- 0002_marketing_analytics.sql
-- 0003_manufacturing_rfq.sql
-- 0004_rls_policies.sql (enable once tables exist)
-- 0005_matviews.sql     optional reporting views + cron
-- 0006_knowledge_embeddings.sql  knowledge sources + pgvector chunks
-- 0007_chat_corpus.sql
-- 0008_api_manager.sql  API cache + prompt runs
```

## Highlights

- `knowledge_sources` → `knowledge_documents` → `knowledge_chunks` mirror the local MCP manifest. Enable `SUPABASE_SYNC=true` (see root README) to stream reindex results into Supabase automatically.
- `knowledge_manifests` snapshots file/chunk counts on every sync, handy for dashboards.
- `api_cache`, `api_providers`, `prompt_templates`, `prompt_runs` back the API manager + LLM telemetry flows.
- Legacy `knowledge` tables remain for manual exports; migrate at your pace.

## Notes

- Uses `gen_random_uuid()` (enable `pgcrypto`) and `vector` (pgvector).
- RLS defaults in `0004` allow **read for authenticated/service role** and **write for service role**. Tighten once you add org ownership.
- Add `ivfflat` indexes when your embeddings table grows.

— VibeLabz · Clean Intent: avoid storing sensitive PII beyond what you need.
