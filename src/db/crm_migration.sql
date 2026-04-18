-- CRM / Lead Management migration for NWPI Project Manager
-- Run this migration in Supabase SQL Editor

create table if not exists pm_leads (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text,
  phone text,
  source text default 'website' check (source in ('website', 'referral', 'social', 'advertising', 'walk_in', 'other')),
  status text default 'new' check (status in ('new', 'contacted', 'qualified', 'proposal', 'negotiation', 'won', 'lost')),
  project_type text,
  estimated_value numeric(12,2),
  address text,
  suburb text,
  notes text,
  next_follow_up date,
  assigned_to text,
  converted_project_id uuid references pm_projects(id) on delete set null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_pm_leads_status on pm_leads(status);

-- Updated_at trigger
drop trigger if exists trg_pm_leads_updated_at on pm_leads;
create trigger trg_pm_leads_updated_at
  before update on pm_leads
  for each row
  execute function pm_set_updated_at();

-- RLS
alter table pm_leads enable row level security;
create policy pm_leads_s on pm_leads for select to authenticated using (true);
create policy pm_leads_i on pm_leads for insert to authenticated with check (true);
create policy pm_leads_u on pm_leads for update to authenticated using (true) with check (true);
create policy pm_leads_d on pm_leads for delete to authenticated using (true);
