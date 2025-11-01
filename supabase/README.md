# Supabase Schema Stubs

This folder contains **starter SQL** for CRM, Marketing Analytics, Manufacturing RFQ flows, and the Historian timeline.

> All files are **safe to run** in a new Supabase project. Review and adapt before applying to production.

**How to apply**

```bash
# in Supabase SQL editor (or psql)
-- run in order

-- 1) CRM core

-- 2) Marketing analytics

-- 3) Manufacturing RFQ
```

**Notes**
- Uses `gen_random_uuid()` (enable `pgcrypto` extension if not already)
- RLS examples are **commented**; enable per your needs
- Add pgvector indices later if you embed narratives/notes
- `0008_historian_events.sql` enriches the Historian `events` table with severity + session metadata for MCP traces.

## Placeholder Inventory

| Area | File | What remains manual |
| --- | --- | --- |
| RLS | `schema/0004_rls_policies.sql` | Policies are scaffolds; uncomment + tailor to your auth strategy. |
| Vector search | `schema/0006_knowledge_embeddings.sql` | Replace sample `vector` column sizes + indexes with your embedding dimensions. |
| Materialized views | `schema/0005_matviews.sql` | Cron schedule + metrics columns should mirror your analytics cadence. |

Document each override in infra repos so production + local envs stay aligned.

— VibeLabz · Clean Intent: avoid storing sensitive PII beyond what you need.
