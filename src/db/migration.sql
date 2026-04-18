-- NWPI Project Manager — Full Database Migration
-- Supabase project: pzzdsphxwpywnqkuxutl
-- Run this in Supabase SQL Editor

-- ============================================================
-- 1. CONTACTS (must be created before tasks for FK)
-- ============================================================
create table if not exists pm_contacts (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  company text,
  role text not null default 'subcontractor' check (role in ('client', 'subcontractor', 'supplier', 'staff', 'consultant')),
  trade text,
  email text,
  phone text,
  abn text,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_pm_contacts_role on pm_contacts(role);
create index if not exists idx_pm_contacts_name on pm_contacts(name);

-- ============================================================
-- 2. PROJECTS
-- ============================================================
create table if not exists pm_projects (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  address text,
  suburb text,
  state text default 'NSW',
  postcode text,
  client_name text,
  client_email text,
  client_phone text,
  project_type text default 'residential' check (project_type in ('residential', 'commercial', 'renovation', 'extension', 'fitout', 'other')),
  status text not null default 'planning' check (status in ('planning', 'active', 'on_hold', 'completed', 'cancelled')),
  contract_value numeric(12,2) default 0,
  start_date date,
  target_end_date date,
  actual_end_date date,
  description text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_pm_projects_status on pm_projects(status);
create index if not exists idx_pm_projects_created on pm_projects(created_at desc);

-- ============================================================
-- 3. PROJECT-CONTACTS JUNCTION
-- ============================================================
create table if not exists pm_project_contacts (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references pm_projects(id) on delete cascade,
  contact_id uuid not null references pm_contacts(id) on delete cascade,
  role text,
  created_at timestamptz default now(),
  unique(project_id, contact_id)
);

create index if not exists idx_pm_project_contacts_project on pm_project_contacts(project_id);
create index if not exists idx_pm_project_contacts_contact on pm_project_contacts(contact_id);

-- ============================================================
-- 4. PHASES
-- ============================================================
create table if not exists pm_phases (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references pm_projects(id) on delete cascade,
  name text not null,
  sort_order int default 0,
  status text default 'pending' check (status in ('pending', 'in_progress', 'completed')),
  start_date date,
  end_date date,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_pm_phases_project on pm_phases(project_id);

-- ============================================================
-- 5. TASKS
-- ============================================================
create table if not exists pm_tasks (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references pm_projects(id) on delete cascade,
  phase_id uuid references pm_phases(id) on delete set null,
  assigned_to uuid references pm_contacts(id) on delete set null,
  title text not null,
  description text,
  status text not null default 'pending' check (status in ('pending', 'in_progress', 'completed', 'blocked', 'skipped')),
  priority text default 'normal' check (priority in ('low', 'normal', 'high', 'urgent')),
  sort_order int default 0,
  start_date date,
  due_date date,
  completed_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_pm_tasks_project on pm_tasks(project_id);
create index if not exists idx_pm_tasks_phase on pm_tasks(phase_id);
create index if not exists idx_pm_tasks_status on pm_tasks(status);
create index if not exists idx_pm_tasks_assigned on pm_tasks(assigned_to);

-- ============================================================
-- 6. BUDGET CATEGORIES
-- ============================================================
create table if not exists pm_budget_categories (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references pm_projects(id) on delete cascade,
  name text not null,
  budgeted_amount numeric(12,2) default 0,
  sort_order int default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_pm_budget_categories_project on pm_budget_categories(project_id);

-- ============================================================
-- 7. BUDGET ITEMS
-- ============================================================
create table if not exists pm_budget_items (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references pm_budget_categories(id) on delete cascade,
  project_id uuid not null references pm_projects(id) on delete cascade,
  description text not null,
  supplier text,
  amount numeric(12,2) default 0,
  status text default 'pending' check (status in ('pending', 'approved', 'invoiced', 'paid')),
  invoice_number text,
  invoice_date date,
  paid_date date,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_pm_budget_items_category on pm_budget_items(category_id);
create index if not exists idx_pm_budget_items_project on pm_budget_items(project_id);

-- ============================================================
-- 8. DOCUMENTS
-- ============================================================
create table if not exists pm_documents (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references pm_projects(id) on delete cascade,
  name text not null,
  category text default 'other' check (category in ('plans', 'permits', 'contracts', 'reports', 'other')),
  file_url text,
  file_size bigint,
  file_type text,
  uploaded_by uuid,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_pm_documents_project on pm_documents(project_id);
create index if not exists idx_pm_documents_category on pm_documents(category);

-- ============================================================
-- 9. PHOTOS
-- ============================================================
create table if not exists pm_photos (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references pm_projects(id) on delete cascade,
  phase_id uuid references pm_phases(id) on delete set null,
  url text not null,
  thumbnail_url text,
  caption text,
  taken_at timestamptz default now(),
  uploaded_by uuid,
  created_at timestamptz default now()
);

create index if not exists idx_pm_photos_project on pm_photos(project_id);
create index if not exists idx_pm_photos_phase on pm_photos(phase_id);

-- ============================================================
-- 10. DAILY LOGS
-- ============================================================
create table if not exists pm_daily_logs (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references pm_projects(id) on delete cascade,
  log_date date not null,
  weather text check (weather in ('sunny', 'cloudy', 'rain', 'storm', 'hot', 'cold')),
  temperature numeric(4,1),
  workers_on_site int default 0,
  hours_worked numeric(4,1) default 0,
  work_completed text,
  issues text,
  notes text,
  created_by uuid,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(project_id, log_date)
);

create index if not exists idx_pm_daily_logs_project on pm_daily_logs(project_id);
create index if not exists idx_pm_daily_logs_date on pm_daily_logs(log_date desc);

-- ============================================================
-- 11. SELECTIONS (client selections / choices)
-- ============================================================
create table if not exists pm_selections (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references pm_projects(id) on delete cascade,
  category text not null,
  item_name text not null,
  description text,
  supplier text,
  cost numeric(12,2) default 0,
  status text default 'pending' check (status in ('pending', 'selected', 'ordered', 'installed')),
  selected_option text,
  notes text,
  due_date date,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_pm_selections_project on pm_selections(project_id);

-- ============================================================
-- UPDATED_AT TRIGGER FUNCTION
-- ============================================================
create or replace function pm_set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Apply trigger to all tables with updated_at
do $$
declare
  tbl text;
begin
  foreach tbl in array array[
    'pm_contacts', 'pm_projects', 'pm_phases', 'pm_tasks',
    'pm_budget_categories', 'pm_budget_items', 'pm_documents',
    'pm_daily_logs', 'pm_selections'
  ]
  loop
    execute format(
      'drop trigger if exists trg_%s_updated_at on %s; create trigger trg_%s_updated_at before update on %s for each row execute function pm_set_updated_at();',
      tbl, tbl, tbl, tbl
    );
  end loop;
end;
$$;

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

-- Enable RLS on all tables
alter table pm_contacts enable row level security;
alter table pm_projects enable row level security;
alter table pm_project_contacts enable row level security;
alter table pm_phases enable row level security;
alter table pm_tasks enable row level security;
alter table pm_budget_categories enable row level security;
alter table pm_budget_items enable row level security;
alter table pm_documents enable row level security;
alter table pm_photos enable row level security;
alter table pm_daily_logs enable row level security;
alter table pm_selections enable row level security;

-- Policies: authenticated users can do everything (team app, no per-user isolation)
-- Each table gets uniquely named policies

-- pm_contacts
create policy pm_contacts_select on pm_contacts for select to authenticated using (true);
create policy pm_contacts_insert on pm_contacts for insert to authenticated with check (true);
create policy pm_contacts_update on pm_contacts for update to authenticated using (true) with check (true);
create policy pm_contacts_delete on pm_contacts for delete to authenticated using (true);

-- pm_projects
create policy pm_projects_select on pm_projects for select to authenticated using (true);
create policy pm_projects_insert on pm_projects for insert to authenticated with check (true);
create policy pm_projects_update on pm_projects for update to authenticated using (true) with check (true);
create policy pm_projects_delete on pm_projects for delete to authenticated using (true);

-- pm_project_contacts
create policy pm_project_contacts_select on pm_project_contacts for select to authenticated using (true);
create policy pm_project_contacts_insert on pm_project_contacts for insert to authenticated with check (true);
create policy pm_project_contacts_update on pm_project_contacts for update to authenticated using (true) with check (true);
create policy pm_project_contacts_delete on pm_project_contacts for delete to authenticated using (true);

-- pm_phases
create policy pm_phases_select on pm_phases for select to authenticated using (true);
create policy pm_phases_insert on pm_phases for insert to authenticated with check (true);
create policy pm_phases_update on pm_phases for update to authenticated using (true) with check (true);
create policy pm_phases_delete on pm_phases for delete to authenticated using (true);

-- pm_tasks
create policy pm_tasks_select on pm_tasks for select to authenticated using (true);
create policy pm_tasks_insert on pm_tasks for insert to authenticated with check (true);
create policy pm_tasks_update on pm_tasks for update to authenticated using (true) with check (true);
create policy pm_tasks_delete on pm_tasks for delete to authenticated using (true);

-- pm_budget_categories
create policy pm_budget_categories_select on pm_budget_categories for select to authenticated using (true);
create policy pm_budget_categories_insert on pm_budget_categories for insert to authenticated with check (true);
create policy pm_budget_categories_update on pm_budget_categories for update to authenticated using (true) with check (true);
create policy pm_budget_categories_delete on pm_budget_categories for delete to authenticated using (true);

-- pm_budget_items
create policy pm_budget_items_select on pm_budget_items for select to authenticated using (true);
create policy pm_budget_items_insert on pm_budget_items for insert to authenticated with check (true);
create policy pm_budget_items_update on pm_budget_items for update to authenticated using (true) with check (true);
create policy pm_budget_items_delete on pm_budget_items for delete to authenticated using (true);

-- pm_documents
create policy pm_documents_select on pm_documents for select to authenticated using (true);
create policy pm_documents_insert on pm_documents for insert to authenticated with check (true);
create policy pm_documents_update on pm_documents for update to authenticated using (true) with check (true);
create policy pm_documents_delete on pm_documents for delete to authenticated using (true);

-- pm_photos
create policy pm_photos_select on pm_photos for select to authenticated using (true);
create policy pm_photos_insert on pm_photos for insert to authenticated with check (true);
create policy pm_photos_update on pm_photos for update to authenticated using (true) with check (true);
create policy pm_photos_delete on pm_photos for delete to authenticated using (true);

-- pm_daily_logs
create policy pm_daily_logs_select on pm_daily_logs for select to authenticated using (true);
create policy pm_daily_logs_insert on pm_daily_logs for insert to authenticated with check (true);
create policy pm_daily_logs_update on pm_daily_logs for update to authenticated using (true) with check (true);
create policy pm_daily_logs_delete on pm_daily_logs for delete to authenticated using (true);

-- pm_selections
create policy pm_selections_select on pm_selections for select to authenticated using (true);
create policy pm_selections_insert on pm_selections for insert to authenticated with check (true);
create policy pm_selections_update on pm_selections for update to authenticated using (true) with check (true);
create policy pm_selections_delete on pm_selections for delete to authenticated using (true);
