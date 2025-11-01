-- 0008_api_manager.sql — API cache, providers, and prompt runs

create extension if not exists pgcrypto;

create table if not exists api_providers (
  id uuid primary key default gen_random_uuid(),
  key text unique not null,
  label text not null,
  meta jsonb default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists api_cache (
  id uuid primary key default gen_random_uuid(),
  provider text not null,
  cache_key text not null,
  status int,
  payload jsonb,
  ttl_seconds int default 60,
  cached_at timestamptz not null default now(),
  expires_at timestamptz,
  meta jsonb default '{}'::jsonb,
  unique (provider, cache_key)
);
create index if not exists api_cache_provider_idx on api_cache(provider);
create index if not exists api_cache_expires_idx on api_cache(expires_at);

create table if not exists prompt_templates (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  version int not null default 1,
  title text not null,
  body text not null,
  tags text[],
  meta jsonb default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists prompt_templates_slug_idx on prompt_templates(slug);
create trigger if not exists trg_prompt_templates_updated_at
  before update on prompt_templates
  for each row execute function touch_updated_at();

create table if not exists prompt_runs (
  id uuid primary key default gen_random_uuid(),
  task text not null,
  prompt_hash text not null,
  prompt text not null,
  model text,
  model_hint text,
  latency_ms int,
  cost_est numeric(12,4),
  ok boolean default true,
  output_preview text,
  meta jsonb default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists prompt_runs_task_idx on prompt_runs(task);
create index if not exists prompt_runs_created_idx on prompt_runs(created_at desc);
