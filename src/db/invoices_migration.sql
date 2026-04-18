-- Invoices tables for NWPI Project Manager
-- Run this migration in Supabase SQL Editor

-- Invoices
create table if not exists pm_invoices (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references pm_projects(id) on delete cascade,
  invoice_number text not null,
  type text default 'progress' check (type in ('progress', 'final', 'variation', 'retention')),
  status text default 'draft' check (status in ('draft', 'sent', 'paid', 'overdue', 'cancelled')),
  client_name text,
  client_email text,
  description text,
  subtotal numeric(12,2) default 0,
  tax numeric(12,2) default 0,
  total numeric(12,2) default 0,
  amount_paid numeric(12,2) default 0,
  issue_date date,
  due_date date,
  paid_date date,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Invoice Line Items
create table if not exists pm_invoice_items (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references pm_invoices(id) on delete cascade,
  description text not null,
  quantity numeric(10,2) default 1,
  unit_price numeric(12,2) default 0,
  total numeric(12,2) default 0,
  sort_order int default 0,
  created_at timestamptz default now()
);

-- Indexes
create index if not exists idx_pm_invoices_project_id on pm_invoices(project_id);
create index if not exists idx_pm_invoices_status on pm_invoices(status);
create index if not exists idx_pm_invoices_type on pm_invoices(type);
create index if not exists idx_pm_invoice_items_invoice_id on pm_invoice_items(invoice_id);

-- Updated_at trigger
create or replace function update_pm_invoices_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_pm_invoices_updated_at on pm_invoices;
create trigger trg_pm_invoices_updated_at
  before update on pm_invoices
  for each row
  execute function update_pm_invoices_updated_at();

-- RLS Policies
alter table pm_invoices enable row level security;
alter table pm_invoice_items enable row level security;

-- Invoices policies
create policy "Allow all access to pm_invoices"
  on pm_invoices for all
  using (true)
  with check (true);

-- Invoice Items policies
create policy "Allow all access to pm_invoice_items"
  on pm_invoice_items for all
  using (true)
  with check (true);
