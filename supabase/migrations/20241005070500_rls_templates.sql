-- Supabase migration: template row level security policies
-- Enable per-project once auth is configured. Policies are examples only.

alter table if exists public.accounts enable row level security;
alter table if exists public.contacts enable row level security;
alter table if exists public.leads enable row level security;
alter table if exists public.opportunities enable row level security;
alter table if exists public.campaigns enable row level security;
alter table if exists public.campaign_metrics enable row level security;
alter table if exists public.channel_snapshots enable row level security;
alter table if exists public.rfq_requests enable row level security;
alter table if exists public.rfq_parts enable row level security;
alter table if exists public.rfq_quotes enable row level security;
alter table if exists public.knowledge_sources enable row level security;
alter table if exists public.knowledge_chunks enable row level security;
alter table if exists public.knowledge_embeddings enable row level security;
alter table if exists public.knowledge_manifests enable row level security;

create or replace function public.is_service_role()
returns boolean language sql as $$
  select auth.role() = 'service_role';
$$;

-- Example policy allowing the service role full access
create policy if not exists service_role_full_access on public.knowledge_sources
  for all using (public.is_service_role()) with check (public.is_service_role());
create policy if not exists service_role_full_access_chunks on public.knowledge_chunks
  for all using (public.is_service_role()) with check (public.is_service_role());
create policy if not exists service_role_full_access_embeddings on public.knowledge_embeddings
  for all using (public.is_service_role()) with check (public.is_service_role());
create policy if not exists service_role_full_access_manifests on public.knowledge_manifests
  for all using (public.is_service_role()) with check (public.is_service_role());
