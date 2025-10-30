-- 0002_marketing_analytics.sql — Campaigns, Events, Channel Metrics

create extension if not exists pgcrypto;

-- CAMPAIGNS
create table if not exists campaigns (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  objective text, -- awareness, lead_gen, conversion
  start_date date,
  end_date date,
  budget numeric(14,2) default 0,
  currency text default 'GBP',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- CHANNELS (lookup)
create table if not exists channels (
  id uuid primary key default gen_random_uuid(),
  key text unique not null, -- e.g. x, instagram, tiktok, email, seo, youtube
  label text not null
);

-- CAMPAIGN_CHANNELS (many-to-many)
create table if not exists campaign_channels (
  campaign_id uuid references campaigns(id) on delete cascade,
  channel_id uuid references channels(id) on delete cascade,
  primary key (campaign_id, channel_id)
);

-- CAMPAIGN_EVENTS (atomic events: impression, click, signup, purchase, etc.)
create table if not exists campaign_events (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid references campaigns(id) on delete cascade,
  channel_id uuid references channels(id) on delete set null,
  occurred_at timestamptz not null default now(),
  event_type text not null, -- impression, click, view, like, share, comment, signup, purchase
  value numeric(14,2), -- optional revenue value
  meta jsonb default '{}'::jsonb
);
create index if not exists campaign_events_campaign_idx on campaign_events(campaign_id);
create index if not exists campaign_events_channel_idx on campaign_events(channel_id);
create index if not exists campaign_events_type_idx on campaign_events(event_type);
create index if not exists campaign_events_time_idx on campaign_events(occurred_at);

-- CHANNEL_METRICS (daily aggregates per channel)
create table if not exists channel_metrics (
  id uuid primary key default gen_random_uuid(),
  day date not null,
  channel_id uuid references channels(id) on delete cascade,
  impressions bigint default 0,
  clicks bigint default 0,
  spend numeric(14,2) default 0,
  conversions bigint default 0,
  revenue numeric(14,2) default 0,
  created_at timestamptz not null default now(),
  unique (day, channel_id)
);
create index if not exists channel_metrics_day_idx on channel_metrics(day);

-- UTM_SESSIONS (optional web session table for attribution)
create table if not exists utm_sessions (
  id uuid primary key default gen_random_uuid(),
  occurred_at timestamptz not null default now(),
  utm_source text, utm_medium text, utm_campaign text, utm_term text, utm_content text,
  referrer text,
  session_id text,
  meta jsonb default '{}'::jsonb
);
create index if not exists utm_sessions_time_idx on utm_sessions(occurred_at);

-- VIEW: basic campaign summary
create or replace view v_campaign_summary as
select c.id as campaign_id, c.name,
  min(e.occurred_at) as first_event, max(e.occurred_at) as last_event,
  count(*) filter (where e.event_type = 'impression') as impressions,
  count(*) filter (where e.event_type = 'click') as clicks,
  count(*) filter (where e.event_type in ('signup','purchase')) as conversions,
  sum(e.value) as revenue
from campaigns c
left join campaign_events e on e.campaign_id = c.id
group by c.id, c.name
order by last_event desc nulls last;

-- RLS (example stubs)
-- alter table campaigns enable row level security;
-- create policy "org_read" on campaigns for select using (true);
