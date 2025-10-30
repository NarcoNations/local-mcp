-- 0003_manufacturing_rfq.sql — Vendors, RFQs, Quotes

create extension if not exists pgcrypto;

-- VENDORS
create table if not exists vendors (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  contact_name text,
  email text,
  phone text,
  website text,
  country text,
  rating int check (rating between 1 and 5),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- RFQs
create table if not exists rfqs (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  status text not null default 'draft', -- draft, sent, quoting, comparing, awarded, closed
  requested_at timestamptz not null default now(),
  due_date date,
  currency text default 'GBP',
  inco_terms text,
  shipping_terms text,
  notes text
);

-- RFQ_ITEMS
create table if not exists rfq_items (
  id uuid primary key default gen_random_uuid(),
  rfq_id uuid references rfqs(id) on delete cascade,
  sku text,
  description text,
  quantity int not null check (quantity > 0),
  target_unit_cost numeric(14,2),
  meta jsonb default '{}'::jsonb
);
create index if not exists rfq_items_rfq_idx on rfq_items(rfq_id);

-- RFQ_QUOTES (one vendor can quote across items)
create table if not exists rfq_quotes (
  id uuid primary key default gen_random_uuid(),
  rfq_id uuid references rfqs(id) on delete cascade,
  vendor_id uuid references vendors(id) on delete cascade,
  unit_cost numeric(14,2),
  tooling_cost numeric(14,2),
  moq int,
  lead_time_days int,
  freight_cost numeric(14,2),
  valid_until date,
  currency text default 'GBP',
  notes text,
  created_at timestamptz not null default now()
);
create index if not exists rfq_quotes_rfq_idx on rfq_quotes(rfq_id);
create index if not exists rfq_quotes_vendor_idx on rfq_quotes(vendor_id);

-- PURCHASE_ORDERS (optional, light stub)
create table if not exists purchase_orders (
  id uuid primary key default gen_random_uuid(),
  rfq_id uuid references rfqs(id) on delete set null,
  vendor_id uuid references vendors(id) on delete set null,
  po_number text unique,
  subtotal numeric(14,2) default 0,
  freight numeric(14,2) default 0,
  tax numeric(14,2) default 0,
  total numeric(14,2) generated always as (coalesce(subtotal,0)+coalesce(freight,0)+coalesce(tax,0)) stored,
  expected_ship date,
  status text default 'draft', -- draft, sent, confirmed, in_production, shipped, received, closed
  created_at timestamptz not null default now()
);

-- VIEW: RFQ comparison (lowest unit cost per vendor)
create or replace view v_rfq_comparison as
select 
  q.rfq_id, q.vendor_id, v.name as vendor_name,
  avg(q.unit_cost) as avg_unit_cost,
  min(q.lead_time_days) as best_lead_time,
  min(q.moq) as min_moq
from rfq_quotes q
left join vendors v on v.id = q.vendor_id
group by q.rfq_id, q.vendor_id, v.name;

-- RLS (example stubs)
-- alter table vendors enable row level security;
-- create policy "org_read" on vendors for select using (true);
