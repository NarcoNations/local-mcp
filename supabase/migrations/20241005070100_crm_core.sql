-- Supabase migration: CRM core schema
set check_function_bodies = off;

create extension if not exists pgcrypto;

create table if not exists public.accounts (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  website text,
  industry text,
  notes text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.contacts (
  id uuid primary key default gen_random_uuid(),
  account_id uuid references public.accounts(id) on delete set null,
  full_name text not null,
  email text,
  phone text,
  role text,
  notes text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);
create index if not exists contacts_account_id_idx on public.contacts(account_id);

create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  account_id uuid references public.accounts(id) on delete set null,
  contact_id uuid references public.contacts(id) on delete set null,
  source text,
  status text not null default 'new',
  owner text,
  notes text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);
create index if not exists leads_account_id_idx on public.leads(account_id);
create index if not exists leads_contact_id_idx on public.leads(contact_id);
create index if not exists leads_status_idx on public.leads(status);

create table if not exists public.opportunities (
  id uuid primary key default gen_random_uuid(),
  account_id uuid references public.accounts(id) on delete cascade,
  lead_id uuid references public.leads(id) on delete set null,
  name text not null,
  stage text not null default 'qualification',
  currency text not null default 'GBP',
  amount numeric(14,2) not null default 0,
  close_date date,
  probability int check (probability between 0 and 100) default 10,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);
create index if not exists opportunities_account_id_idx on public.opportunities(account_id);
create index if not exists opportunities_stage_idx on public.opportunities(stage);

create or replace view public.v_pipeline_summary as
select
  stage,
  count(*) as opp_count,
  sum(amount) as total_amount,
  avg(probability) as avg_probability
from public.opportunities
group by stage
order by stage;
