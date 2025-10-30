# Supabase Schema Stubs

This folder contains **starter SQL** for CRM, Marketing Analytics, and Manufacturing RFQ flows.

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

— VibeLabz · Clean Intent: avoid storing sensitive PII beyond what you need.
