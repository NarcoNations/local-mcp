-- 0001_crm.sql — CRM Core (Accounts, Contacts, Leads, Opportunities)

-- enable required extension for UUIDs (usually enabled on Supabase projects)
create extension if not exists pgcrypto;

-- ACCOUNTS
create table if not exists accounts (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  website text,
  industry text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- CONTACTS
create table if not exists contacts (
  id uuid primary key default gen_random_uuid(),
  account_id uuid references accounts(id) on delete set null,
  full_name text not null,
  email text,
  phone text,
  role text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists contacts_account_id_idx on contacts(account_id);

-- LEADS
create table if not exists leads (
  id uuid primary key default gen_random_uuid(),
  account_id uuid references accounts(id) on delete set null,
  contact_id uuid references contacts(id) on delete set null,
  source text, -- e.g. Campaign, Referral, Inbound
  status text not null default 'new', -- new, qualified, disqualified
  owner text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists leads_account_id_idx on leads(account_id);
create index if not exists leads_contact_id_idx on leads(contact_id);
create index if not exists leads_status_idx on leads(status);

-- OPPORTUNITIES
create table if not exists opportunities (
  id uuid primary key default gen_random_uuid(),
  account_id uuid references accounts(id) on delete cascade,
  lead_id uuid references leads(id) on delete set null,
  name text not null,
  stage text not null default 'qualification', -- qualification, proposal, negotiation, closed_won, closed_lost
  currency text not null default 'GBP',
  amount numeric(14,2) not null default 0,
  close_date date,
  probability int check (probability between 0 and 100) default 10,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists opportunities_account_id_idx on opportunities(account_id);
create index if not exists opportunities_stage_idx on opportunities(stage);

-- VIEW: simple pipeline summary
create or replace view v_pipeline_summary as
select 
  stage,
  count(*) as opp_count,
  sum(amount) as total_amount,
  avg(probability) as avg_prob
from opportunities
group by stage
order by stage;

-- RLS (example)
-- alter table accounts enable row level security;
-- create policy "org_read" on accounts for select using (true);
-- create policy "org_write" on accounts for insert with check (true);

