-- 0005_matviews.sql — Materialized views + refresh job

create extension if not exists pg_cron;

-- MV: Campaign daily summary from campaign_events
create materialized view if not exists mv_campaign_daily_summary as
select
  c.id as campaign_id,
  c.name as campaign_name,
  date_trunc('day', e.occurred_at)::date as day,
  count(*) filter (where e.event_type = 'impression') as impressions,
  count(*) filter (where e.event_type = 'click') as clicks,
  count(*) filter (where e.event_type in ('signup','purchase')) as conversions,
  sum(e.value) as revenue
from campaigns c
left join campaign_events e on e.campaign_id = c.id
group by c.id, c.name, day
with no data;

create index if not exists mv_campaign_daily_summary_day_idx on mv_campaign_daily_summary(day);

-- MV: Channel daily metrics (from channel_metrics)
create materialized view if not exists mv_channel_daily as
select
  cm.day,
  ch.id as channel_id,
  ch.key as channel_key,
  ch.label as channel_label,
  cm.impressions, cm.clicks, cm.spend, cm.conversions, cm.revenue
from channel_metrics cm
left join channels ch on ch.id = cm.channel_id
with no data;

create index if not exists mv_channel_daily_day_idx on mv_channel_daily(day);

-- Refresh function
create or replace function refresh_dash_matviews() returns void language plpgsql as $$
begin
  refresh materialized view concurrently mv_campaign_daily_summary;
  refresh materialized view concurrently mv_channel_daily;
end;
$$;

-- Schedule refresh every 10 minutes (UTC)
select cron.schedule(
  'refresh_dash_matviews',
  '*/10 * * * *',
  $$select refresh_dash_matviews();$$
)
where not exists (select 1 from cron.job where jobname = 'refresh_dash_matviews');

