# 18 — Prompt Library & Optimiser

**TL;DR**  \
Single source for prompts: versioned, scored, tagged, persona‑aware. Multi‑model runs + A/B, with lint/optimizer.

## Schema (Supabase)
```sql
create table if not exists prompts (
  id uuid primary key default gen_random_uuid(),
  name text unique not null,
  version int not null default 1,
  tags text[],
  body_md text not null,
  vars_json jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);
create table if not exists prompt_runs (
  id uuid primary key default gen_random_uuid(),
  prompt_id uuid references prompts(id) on delete cascade,
  model text not null,
  inputs_json jsonb,
  outputs_json jsonb,
  cost_est float8,
  tokens int,
  created_at timestamptz default now()
);
create table if not exists mashups (
  id uuid primary key default gen_random_uuid(),
  title text,
  graph_json jsonb not null,
  outputs_uri text,
  created_at timestamptz default now()
);
```

## Linter/Optimizer
- Variable presence, max length, tone/style hints, persona adapters.
- Bench runner: local GGUF vs OpenAI; rubric score.

## CLI
```bash
vibe prompt save "Narco tone"
vibe prompt optimize ./prompt.md
vibe prompt test --local gguf --openai gpt-5
```

## Acceptance
- All prompts callable by name; runs logged; A/B diffs viewable; no secrets in prompt bodies.
