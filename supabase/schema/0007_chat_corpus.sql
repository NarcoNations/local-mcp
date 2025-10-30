-- Chat corpus + Historian baseline
create table if not exists conversations (
  id text primary key,
  title text,
  created_at timestamptz,
  updated_at timestamptz,
  source text,
  meta jsonb default '{}'::jsonb
);

create table if not exists messages (
  id text primary key,
  conversation_id text references conversations(id) on delete cascade,
  author text,
  role text,
  model text,
  created_at timestamptz,
  text text,
  meta jsonb default '{}'::jsonb
);
create index if not exists messages_conv_idx on messages(conversation_id);

create table if not exists tags (
  id uuid primary key default gen_random_uuid(),
  label text unique not null
);

create table if not exists message_tags (
  message_id text references messages(id) on delete cascade,
  tag_id uuid references tags(id) on delete cascade,
  primary key (message_id, tag_id)
);

create table if not exists events (
  id uuid primary key default gen_random_uuid(),
  ts timestamptz not null default now(),
  source text not null,
  kind text not null,
  title text not null,
  body text,
  link text,
  meta jsonb default '{}'::jsonb
);
create index if not exists events_ts_idx on events(ts desc);
