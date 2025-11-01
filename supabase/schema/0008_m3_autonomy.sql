-- 0008_m3_autonomy.sql — Production & Autonomy foundations
create table if not exists jobs (
  id uuid primary key default gen_random_uuid(),
  kind text not null,
  payload jsonb default '{}'::jsonb,
  status text not null default 'queued',
  priority int default 5,
  attempts int default 0,
  max_attempts int default 3,
  scheduled_at timestamptz default now(),
  started_at timestamptz,
  finished_at timestamptz,
  duration_ms int,
  error text,
  meta jsonb default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists jobs_status_idx on jobs(status, scheduled_at asc);
create index if not exists jobs_kind_idx on jobs(kind);

create table if not exists provider_usage (
  id uuid primary key default gen_random_uuid(),
  provider text not null,
  model text not null,
  operation text not null,
  tokens_in int default 0,
  tokens_out int default 0,
  cost_est numeric(12,4) default 0,
  latency_ms int,
  recorded_at timestamptz not null default now(),
  meta jsonb default '{}'::jsonb
);
create index if not exists provider_usage_recorded_idx on provider_usage(recorded_at desc);

create table if not exists service_health (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  status text not null,
  latency_p95 int,
  error_rate numeric(5,2),
  checked_at timestamptz not null default now(),
  meta jsonb default '{}'::jsonb
);
create index if not exists service_health_checked_idx on service_health(checked_at desc);

create table if not exists evals (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  type text not null,
  dataset_ref text,
  created_at timestamptz not null default now(),
  meta jsonb default '{}'::jsonb
);

create table if not exists eval_runs (
  id uuid primary key default gen_random_uuid(),
  eval_id uuid references evals(id) on delete cascade,
  model text not null,
  prompt_id text,
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  metrics jsonb default '{}'::jsonb
);
create index if not exists eval_runs_eval_idx on eval_runs(eval_id, started_at desc);

create table if not exists policy_gate_logs (
  id uuid primary key default gen_random_uuid(),
  scope text not null,
  action text not null,
  status text not null,
  reasons text[],
  payload jsonb default '{}'::jsonb,
  created_at timestamptz not null default now(),
  actor text
);
create index if not exists policy_gate_logs_scope_idx on policy_gate_logs(scope, created_at desc);

create table if not exists map_layers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  type text not null,
  source_url text,
  updated_at timestamptz,
  status text default 'idle',
  meta jsonb default '{}'::jsonb
);

create table if not exists map_tiles (
  id uuid primary key default gen_random_uuid(),
  layer_id uuid references map_layers(id) on delete cascade,
  pmtiles_url text,
  built_at timestamptz,
  meta jsonb default '{}'::jsonb
);
create index if not exists map_tiles_layer_idx on map_tiles(layer_id);

create table if not exists map_features (
  id uuid primary key default gen_random_uuid(),
  layer_id uuid references map_layers(id) on delete cascade,
  feature jsonb,
  bbox numeric[] default '{}',
  updated_at timestamptz default now()
);
create index if not exists map_features_layer_idx on map_features(layer_id);

create table if not exists social_queue (
  id uuid primary key default gen_random_uuid(),
  template text not null,
  payload jsonb default '{}'::jsonb,
  status text not null default 'draft',
  scheduled_at timestamptz,
  posted_at timestamptz,
  error text,
  created_at timestamptz not null default now()
);
create index if not exists social_queue_status_idx on social_queue(status, scheduled_at);

create table if not exists social_assets (
  id uuid primary key default gen_random_uuid(),
  queue_id uuid references social_queue(id) on delete cascade,
  url text,
  kind text,
  meta jsonb default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists social_assets_queue_idx on social_assets(queue_id);

create table if not exists publish_packages (
  id uuid primary key default gen_random_uuid(),
  slug text not null,
  content_md text,
  assets jsonb default '[]'::jsonb,
  meta jsonb default '{}'::jsonb,
  status text not null default 'pending',
  created_at timestamptz not null default now(),
  approved_at timestamptz,
  approved_by text
);
create unique index if not exists publish_packages_slug_idx on publish_packages(slug);

create table if not exists build_briefs (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  lanes jsonb default '[]'::jsonb,
  acceptance_criteria text,
  owner text,
  status text not null default 'draft',
  meta jsonb default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  attachment_url text
);

create table if not exists api_keys (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  hashed_key text not null,
  scopes text[] not null,
  created_at timestamptz not null default now(),
  last_used_at timestamptz,
  meta jsonb default '{}'::jsonb
);
create index if not exists api_keys_name_idx on api_keys(name);

create table if not exists audit (
  id uuid primary key default gen_random_uuid(),
  occurred_at timestamptz not null default now(),
  actor text not null,
  action text not null,
  resource text,
  meta jsonb default '{}'::jsonb
);
create index if not exists audit_actor_idx on audit(actor, occurred_at desc);

