-- Supabase migration: knowledge base + embeddings
create extension if not exists pgcrypto;
create extension if not exists vector;

create table if not exists public.knowledge_sources (
  id uuid primary key default gen_random_uuid(),
  namespace text not null default 'default',
  path text not null,
  type text not null,
  size bigint not null default 0,
  mtime double precision not null,
  partial boolean not null default false,
  tags text[] default '{}',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint knowledge_sources_unique_path unique(namespace, path)
);

create table if not exists public.knowledge_chunks (
  id uuid primary key,
  namespace text not null default 'default',
  source_id uuid references public.knowledge_sources(id) on delete cascade,
  path text not null,
  type text not null,
  page int,
  offset_start int,
  offset_end int,
  text text not null,
  tokens int,
  tags text[] default '{}',
  partial boolean not null default false,
  mtime double precision not null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);
create index if not exists knowledge_chunks_namespace_idx on public.knowledge_chunks(namespace);
create index if not exists knowledge_chunks_path_idx on public.knowledge_chunks(path);

create table if not exists public.knowledge_embeddings (
  chunk_id uuid primary key references public.knowledge_chunks(id) on delete cascade,
  namespace text not null default 'default',
  embedding vector(384) not null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);
create index if not exists knowledge_embeddings_namespace_idx on public.knowledge_embeddings(namespace);
-- Optional vector index; adjust lists per data volume
-- create index if not exists knowledge_embeddings_vec_idx on public.knowledge_embeddings using ivfflat (embedding vector_cosine_ops) with (lists = 100);

create table if not exists public.knowledge_manifests (
  namespace text primary key,
  manifest jsonb not null,
  updated_at timestamptz not null default timezone('utc', now())
);

create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$ language plpgsql;

create trigger set_accounts_updated before update on public.accounts
  for each row execute procedure public.set_updated_at();
create trigger set_contacts_updated before update on public.contacts
  for each row execute procedure public.set_updated_at();
create trigger set_leads_updated before update on public.leads
  for each row execute procedure public.set_updated_at();
create trigger set_opportunities_updated before update on public.opportunities
  for each row execute procedure public.set_updated_at();
create trigger set_campaigns_updated before update on public.campaigns
  for each row execute procedure public.set_updated_at();
create trigger set_rfq_requests_updated before update on public.rfq_requests
  for each row execute procedure public.set_updated_at();
create trigger set_rfq_parts_updated before update on public.rfq_parts
  for each row execute procedure public.set_updated_at();
create trigger set_rfq_quotes_updated before update on public.rfq_quotes
  for each row execute procedure public.set_updated_at();
create trigger set_knowledge_sources_updated before update on public.knowledge_sources
  for each row execute procedure public.set_updated_at();
create trigger set_knowledge_chunks_updated before update on public.knowledge_chunks
  for each row execute procedure public.set_updated_at();
create trigger set_knowledge_embeddings_updated before update on public.knowledge_embeddings
  for each row execute procedure public.set_updated_at();
create trigger set_channel_snapshots_updated before update on public.channel_snapshots
  for each row execute procedure public.set_updated_at();
