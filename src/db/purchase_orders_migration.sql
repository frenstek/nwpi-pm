-- Purchase Orders tables for NWPI Project Manager
-- Run this migration in Supabase SQL Editor

-- Purchase Orders
create table if not exists pm_purchase_orders (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references pm_projects(id) on delete cascade,
  po_number text not null,
  vendor_name text not null,
  vendor_contact text,
  vendor_email text,
  description text,
  status text default 'draft' check (status in ('draft', 'sent', 'acknowledged', 'completed', 'cancelled')),
  subtotal numeric(12,2) default 0,
  tax numeric(12,2) default 0,
  total numeric(12,2) default 0,
  issue_date date,
  due_date date,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Purchase Order Line Items
create table if not exists pm_po_items (
  id uuid primary key default gen_random_uuid(),
  po_id uuid not null references pm_purchase_orders(id) on delete cascade,
  description text not null,
  quantity numeric(10,2) default 1,
  unit_price numeric(12,2) default 0,
  total numeric(12,2) default 0,
  sort_order int default 0,
  created_at timestamptz default now()
);

-- Indexes
create index if not exists idx_pm_purchase_orders_project_id on pm_purchase_orders(project_id);
create index if not exists idx_pm_purchase_orders_status on pm_purchase_orders(status);
create index if not exists idx_pm_po_items_po_id on pm_po_items(po_id);

-- Updated_at trigger
create or replace function update_pm_purchase_orders_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_pm_purchase_orders_updated_at on pm_purchase_orders;
create trigger trg_pm_purchase_orders_updated_at
  before update on pm_purchase_orders
  for each row
  execute function update_pm_purchase_orders_updated_at();

-- RLS Policies
alter table pm_purchase_orders enable row level security;
alter table pm_po_items enable row level security;

-- Purchase Orders policies
create policy "Allow all access to pm_purchase_orders"
  on pm_purchase_orders for all
  using (true)
  with check (true);

-- PO Items policies
create policy "Allow all access to pm_po_items"
  on pm_po_items for all
  using (true)
  with check (true);
