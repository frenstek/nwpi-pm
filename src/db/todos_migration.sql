-- To-Dos / Checklist migration for NWPI Project Manager
-- Run this migration in Supabase SQL Editor

create table if not exists pm_todos (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references pm_projects(id) on delete cascade,
  title text not null,
  description text,
  is_completed boolean default false,
  assigned_to text,
  due_date date,
  priority text default 'normal',
  category text default 'general',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_pm_todos_project on pm_todos(project_id);

-- Updated_at trigger
drop trigger if exists trg_pm_todos_updated_at on pm_todos;
create trigger trg_pm_todos_updated_at
  before update on pm_todos
  for each row
  execute function pm_set_updated_at();

-- RLS
alter table pm_todos enable row level security;
create policy pm_todos_s on pm_todos for select to authenticated using (true);
create policy pm_todos_i on pm_todos for insert to authenticated with check (true);
create policy pm_todos_u on pm_todos for update to authenticated using (true) with check (true);
create policy pm_todos_d on pm_todos for delete to authenticated using (true);
