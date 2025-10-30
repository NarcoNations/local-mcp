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
