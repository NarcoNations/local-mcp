-- Supabase migration: marketing analytics schema
create table if not exists public.campaigns (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  channel text,
  status text not null default 'draft',
  budget numeric(14,2) default 0,
  start_date date,
  end_date date,
  target_audience text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.campaign_metrics (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid references public.campaigns(id) on delete cascade,
  metric_date date not null,
  impressions bigint default 0,
  clicks bigint default 0,
  conversions bigint default 0,
  spend numeric(14,2) default 0,
  created_at timestamptz not null default timezone('utc', now())
);
create index if not exists campaign_metrics_campaign_idx on public.campaign_metrics(campaign_id);
create index if not exists campaign_metrics_date_idx on public.campaign_metrics(metric_date);

create table if not exists public.channel_snapshots (
  id uuid primary key default gen_random_uuid(),
  channel text not null,
  snapshot_date date not null,
  metric jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);
create unique index if not exists channel_snapshots_unique on public.channel_snapshots(channel, snapshot_date);
