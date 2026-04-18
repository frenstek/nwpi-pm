-- Warranties migration for NWPI Project Manager
-- Run this migration in Supabase SQL Editor

create table if not exists pm_warranties (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references pm_projects(id) on delete cascade,
  title text not null,
  description text,
  category text default 'general',
  status text default 'submitted' check (status in ('submitted', 'in_progress', 'resolved', 'rejected')),
  priority text default 'normal' check (priority in ('low', 'normal', 'high', 'urgent')),
  submitted_by text,
  submitted_date date default current_date,
  resolved_date date,
  resolution_notes text,
  assigned_to text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_pm_warranties_project on pm_warranties(project_id);

-- Updated_at trigger
drop trigger if exists trg_pm_warranties_updated_at on pm_warranties;
create trigger trg_pm_warranties_updated_at
  before update on pm_warranties
  for each row
  execute function pm_set_updated_at();

-- RLS
alter table pm_warranties enable row level security;
create policy pm_war_s on pm_warranties for select to authenticated using (true);
create policy pm_war_i on pm_warranties for insert to authenticated with check (true);
create policy pm_war_u on pm_warranties for update to authenticated using (true) with check (true);
create policy pm_war_d on pm_warranties for delete to authenticated using (true);
