-- 0004_rls_policies.sql — Enable RLS + safe defaults

-- NOTE: This uses simple, org-agnostic policies:
--  - READ for authenticated + service role
--  - WRITE for service role only
-- Adjust once you add org_id/owner columns.

create extension if not exists pgcrypto;

-- Helper: nothing; we rely on Supabase auth.role()

-- CRM
alter table if exists accounts enable row level security;
alter table if exists contacts enable row level security;
alter table if exists leads enable row level security;
alter table if exists opportunities enable row level security;

create policy if not exists accounts_read on accounts for select using (auth.role() in ('authenticated','service_role'));
create policy if not exists accounts_service_write on accounts for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

create policy if not exists contacts_read on contacts for select using (auth.role() in ('authenticated','service_role'));
create policy if not exists contacts_service_write on contacts for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

create policy if not exists leads_read on leads for select using (auth.role() in ('authenticated','service_role'));
create policy if not exists leads_service_write on leads for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

create policy if not exists opportunities_read on opportunities for select using (auth.role() in ('authenticated','service_role'));
create policy if not exists opportunities_service_write on opportunities for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

-- Marketing
alter table if exists campaigns enable row level security;
alter table if exists channels enable row level security;
alter table if exists campaign_channels enable row level security;
alter table if exists campaign_events enable row level security;
alter table if exists channel_metrics enable row level security;
alter table if exists utm_sessions enable row level security;

create policy if not exists campaigns_read on campaigns for select using (auth.role() in ('authenticated','service_role'));
create policy if not exists campaigns_service_write on campaigns for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

create policy if not exists channels_read on channels for select using (auth.role() in ('authenticated','service_role'));
create policy if not exists channels_service_write on channels for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

create policy if not exists campaign_channels_read on campaign_channels for select using (auth.role() in ('authenticated','service_role'));
create policy if not exists campaign_channels_service_write on campaign_channels for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

create policy if not exists campaign_events_read on campaign_events for select using (auth.role() in ('authenticated','service_role'));
create policy if not exists campaign_events_service_write on campaign_events for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

create policy if not exists channel_metrics_read on channel_metrics for select using (auth.role() in ('authenticated','service_role'));
create policy if not exists channel_metrics_service_write on channel_metrics for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

create policy if not exists utm_sessions_read on utm_sessions for select using (auth.role() in ('authenticated','service_role'));
create policy if not exists utm_sessions_service_write on utm_sessions for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

-- Manufacturing
alter table if exists vendors enable row level security;
alter table if exists rfqs enable row level security;
alter table if exists rfq_items enable row level security;
alter table if exists rfq_quotes enable row level security;
alter table if exists purchase_orders enable row level security;

create policy if not exists vendors_read on vendors for select using (auth.role() in ('authenticated','service_role'));
create policy if not exists vendors_service_write on vendors for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

create policy if not exists rfqs_read on rfqs for select using (auth.role() in ('authenticated','service_role'));
create policy if not exists rfqs_service_write on rfqs for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

create policy if not exists rfq_items_read on rfq_items for select using (auth.role() in ('authenticated','service_role'));
create policy if not exists rfq_items_service_write on rfq_items for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

create policy if not exists rfq_quotes_read on rfq_quotes for select using (auth.role() in ('authenticated','service_role'));
create policy if not exists rfq_quotes_service_write on rfq_quotes for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

create policy if not exists purchase_orders_read on purchase_orders for select using (auth.role() in ('authenticated','service_role'));
create policy if not exists purchase_orders_service_write on purchase_orders for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

-- Knowledge (if present)
-- alter table if exists knowledge enable row level security;
-- create policy if not exists knowledge_read on knowledge for select using (auth.role() in ('authenticated','service_role'));
-- create policy if not exists knowledge_service_write on knowledge for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

