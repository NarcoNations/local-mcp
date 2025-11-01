-- Supabase migration: manufacturing RFQ schema
create table if not exists public.rfq_requests (
  id uuid primary key default gen_random_uuid(),
  customer_name text not null,
  contact_email text,
  project_name text,
  status text not null default 'draft',
  due_date date,
  notes text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.rfq_parts (
  id uuid primary key default gen_random_uuid(),
  rfq_id uuid not null references public.rfq_requests(id) on delete cascade,
  part_number text not null,
  material text,
  finish text,
  quantity int not null default 1,
  unit text,
  notes text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);
create index if not exists rfq_parts_rfq_idx on public.rfq_parts(rfq_id);

create table if not exists public.rfq_quotes (
  id uuid primary key default gen_random_uuid(),
  rfq_id uuid not null references public.rfq_requests(id) on delete cascade,
  supplier_name text not null,
  status text not null default 'pending',
  amount numeric(14,2) not null default 0,
  currency text not null default 'GBP',
  lead_time_days int,
  notes text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);
create index if not exists rfq_quotes_rfq_idx on public.rfq_quotes(rfq_id);
