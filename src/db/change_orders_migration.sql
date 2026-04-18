-- NWPI Project Manager — Change Orders Migration
-- Supabase project: pzzdsphxwpywnqkuxutl
-- Run this in Supabase SQL Editor

-- ============================================================
-- CHANGE ORDERS
-- ============================================================
create table if not exists pm_change_orders (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references pm_projects(id) on delete cascade,
  title text not null,
  description text,
  reason text,
  status text default 'draft' check (status in ('draft', 'pending', 'approved', 'rejected', 'completed')),
  amount numeric(12,2) default 0,
  submitted_at timestamptz,
  approved_at timestamptz,
  approved_by text,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_pm_change_orders_project on pm_change_orders(project_id);
create index if not exists idx_pm_change_orders_status on pm_change_orders(status);

-- Updated_at trigger
drop trigger if exists trg_pm_change_orders_updated_at on pm_change_orders;
create trigger trg_pm_change_orders_updated_at
  before update on pm_change_orders
  for each row execute function pm_set_updated_at();

-- Row Level Security
alter table pm_change_orders enable row level security;

create policy pm_change_orders_select on pm_change_orders for select to authenticated using (true);
create policy pm_change_orders_insert on pm_change_orders for insert to authenticated with check (true);
create policy pm_change_orders_update on pm_change_orders for update to authenticated using (true) with check (true);
create policy pm_change_orders_delete on pm_change_orders for delete to authenticated using (true);
