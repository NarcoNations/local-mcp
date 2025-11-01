create extension if not exists vector; -- pgvector

create table if not exists knowledge (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title text,
  manifest_path text,
  sha256 text,
  tags text[],
  meta jsonb default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists knowledge_files (
  id uuid primary key default gen_random_uuid(),
  knowledge_id uuid references knowledge(id) on delete cascade,
  path text not null,
  content_type text,
  bytes int,
  created_at timestamptz not null default now()
);
create index if not exists kf_kid_idx on knowledge_files(knowledge_id);

create table if not exists embeddings (
  id uuid primary key default gen_random_uuid(),
  knowledge_id uuid references knowledge(id) on delete cascade,
  chunk_ix int,
  content text not null,
  embedding vector(384),
  created_at timestamptz not null default now()
);
create index if not exists emb_kid_idx on embeddings(knowledge_id);
create index if not exists emb_chunk_ix_idx on embeddings(chunk_ix);

-- Optional: cosine index (requires large tables)
-- create index if not exists emb_vec_idx on embeddings using ivfflat (embedding vector_cosine_ops) with (lists = 100);

-- Normalised knowledge sync tables (sources → documents → chunks)
create or replace function touch_updated_at() returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create table if not exists knowledge_sources (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title text not null,
  description text,
  meta jsonb default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists ks_slug_idx on knowledge_sources(slug);
create trigger trg_knowledge_sources_updated_at
  before update on knowledge_sources
  for each row execute function touch_updated_at();

create table if not exists knowledge_documents (
  id uuid primary key default gen_random_uuid(),
  source_id uuid references knowledge_sources(id) on delete cascade,
  path text not null,
  checksum text,
  kind text,
  size bigint,
  mtime timestamptz,
  chunk_count int default 0,
  partial boolean default false,
  meta jsonb default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (source_id, path)
);
create index if not exists kd_source_idx on knowledge_documents(source_id);
create index if not exists kd_checksum_idx on knowledge_documents(checksum);
create trigger trg_knowledge_documents_updated_at
  before update on knowledge_documents
  for each row execute function touch_updated_at();

create table if not exists knowledge_chunks (
  id uuid primary key default gen_random_uuid(),
  document_id uuid references knowledge_documents(id) on delete cascade,
  chunk_id text unique not null,
  chunk_index int not null,
  content text not null,
  token_count int,
  offset_start int,
  offset_end int,
  partial boolean default false,
  embedding vector(384),
  meta jsonb default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists kc_document_idx on knowledge_chunks(document_id);
create index if not exists kc_chunk_index_idx on knowledge_chunks(chunk_index);
create trigger trg_knowledge_chunks_updated_at
  before update on knowledge_chunks
  for each row execute function touch_updated_at();

create table if not exists knowledge_manifests (
  id uuid primary key default gen_random_uuid(),
  source_id uuid references knowledge_sources(id) on delete cascade,
  manifest jsonb not null,
  file_count int default 0,
  chunk_count int default 0,
  embedding_count int default 0,
  indexed_at timestamptz not null default now()
);
create index if not exists km_source_idx on knowledge_manifests(source_id);
create index if not exists km_indexed_at_idx on knowledge_manifests(indexed_at desc);
