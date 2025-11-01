-- 0008_historian_events.sql — Historian event enrichments

-- Additional metadata for Historian timeline entries
alter table if exists events
  add column if not exists session_id text;

alter table if exists events
  add column if not exists severity text default 'info';

-- Helpful secondary indexes for timeline queries
create index if not exists events_kind_idx on events(kind);
create index if not exists events_source_idx on events(source);
create index if not exists events_session_idx on events(session_id);
