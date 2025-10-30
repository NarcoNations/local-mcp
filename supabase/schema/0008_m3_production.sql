-- M3 Production + Autonomy schema additions

create table if not exists jobs (
  id uuid primary key default gen_random_uuid(),
  kind text not null,
  payload jsonb default '{}'::jsonb,
  status text not null default 'queued',
  attempts integer not null default 0,
  queued_at timestamptz default now(),
  started_at timestamptz,
  finished_at timestamptz,
  error text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists provider_usage (
  id uuid primary key default gen_random_uuid(),
  provider text not null,
  model text not null,
  op text not null,
  tokens_in integer default 0,
  tokens_out integer default 0,
  cost_est numeric default 0,
  latency_ms integer default 0,
  ts timestamptz default now(),
  meta jsonb default '{}'::jsonb
);

create table if not exists service_health (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  status text not null,
  latency_p95 integer default 0,
  error_rate numeric default 0,
  ts timestamptz default now()
);

create table if not exists evals (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  type text not null,
  dataset_ref text,
  created_at timestamptz default now()
);

create table if not exists eval_runs (
  id uuid primary key default gen_random_uuid(),
  eval_id uuid references evals(id) on delete cascade,
  model text not null,
  prompt_id text,
  started_at timestamptz default now(),
  finished_at timestamptz,
  metrics jsonb default '{}'::jsonb
);

create table if not exists map_layers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  type text,
  source_url text,
  status text default 'queued',
  updated_at timestamptz default now()
);

create table if not exists map_tiles (
  id uuid primary key default gen_random_uuid(),
  layer_id uuid references map_layers(id) on delete cascade,
  pmtiles_url text,
  built_at timestamptz default now(),
  meta jsonb default '{}'::jsonb
);

create table if not exists map_features (
  id uuid primary key default gen_random_uuid(),
  layer_id uuid references map_layers(id) on delete cascade,
  feature jsonb,
  bbox jsonb,
  updated_at timestamptz default now()
);

create table if not exists social_queue (
  id uuid primary key default gen_random_uuid(),
  template text not null,
  payload jsonb default '{}'::jsonb,
  status text default 'queued',
  scheduled_at timestamptz,
  posted_at timestamptz,
  error text
);

create table if not exists social_assets (
  id uuid primary key default gen_random_uuid(),
  queue_id uuid references social_queue(id) on delete cascade,
  url text,
  kind text,
  created_at timestamptz default now()
);

create table if not exists publish_packages (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  status text default 'pending',
  content_md text,
  assets jsonb default '[]'::jsonb,
  meta jsonb default '{}'::jsonb,
  link text,
  created_at timestamptz default now(),
  approved_at timestamptz
);

create table if not exists build_briefs (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  lanes jsonb default '[]'::jsonb,
  acceptance_criteria text[] default '{}',
  owner text,
  status text default 'draft',
  created_at timestamptz default now(),
  zip_url text
);

create table if not exists api_keys (
  id text primary key,
  name text,
  scopes text[] default '{}',
  created_at timestamptz default now(),
  last_used_at timestamptz
);

create table if not exists audit (
  id bigserial primary key,
  ts timestamptz default now(),
  actor text,
  action text,
  resource text,
  meta jsonb default '{}'::jsonb
);

create table if not exists policy_checks (
  id uuid primary key default gen_random_uuid(),
  content text,
  scope text,
  status text,
  reasons text[],
  shadow_self text,
  actor text,
  created_at timestamptz default now()
);
