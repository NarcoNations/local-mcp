CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "vector";

CREATE TYPE source_kind AS ENUM ('chat_export', 'file', 'url');
CREATE TYPE source_grade AS ENUM ('A', 'B', 'C');
CREATE TYPE link_relation AS ENUM ('supports', 'contradicts', 'related');

CREATE TABLE sources (
  id SERIAL PRIMARY KEY,
  kind source_kind NOT NULL,
  origin TEXT NOT NULL,
  collected_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  grade source_grade,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id INTEGER NOT NULL REFERENCES sources(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  path_or_uri TEXT NOT NULL,
  author TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ,
  content_hash TEXT NOT NULL,
  content_type TEXT NOT NULL,
  slug TEXT,
  route_hint TEXT,
  hero_image TEXT,
  meta_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  confidence REAL
);

CREATE TABLE chunks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  ordinal INTEGER NOT NULL,
  heading TEXT,
  text TEXT NOT NULL,
  token_count INTEGER NOT NULL,
  embedding VECTOR(1536) NOT NULL,
  tsv TSVECTOR NOT NULL,
  page INTEGER,
  offset_start INTEGER,
  offset_end INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_chunk_id UUID NOT NULL REFERENCES chunks(id) ON DELETE CASCADE,
  to_chunk_id UUID NOT NULL REFERENCES chunks(id) ON DELETE CASCADE,
  relation link_relation NOT NULL,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE queries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  text TEXT NOT NULL,
  filters_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  results_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  latency_ms INTEGER NOT NULL,
  topk INTEGER NOT NULL
);

CREATE UNIQUE INDEX documents_content_hash_key ON documents(content_hash);
CREATE INDEX documents_slug_idx ON documents(slug);
CREATE INDEX documents_content_type_idx ON documents(content_type);
CREATE INDEX chunks_document_idx ON chunks(document_id);
CREATE INDEX chunks_tsv_idx ON chunks USING GIN (tsv);
CREATE INDEX chunks_embedding_idx ON chunks USING ivfflat (embedding vector_cosine_ops);
