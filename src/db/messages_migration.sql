create table if not exists pm_messages (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references pm_projects(id) on delete cascade,
  sender_name text not null default 'Admin',
  sender_email text,
  content text not null,
  is_internal boolean default true,
  parent_id uuid references pm_messages(id) on delete cascade,
  created_at timestamptz default now()
);

create index if not exists idx_pm_messages_project on pm_messages(project_id);
create index if not exists idx_pm_messages_parent on pm_messages(parent_id);

alter table pm_messages enable row level security;
create policy pm_messages_s on pm_messages for select to authenticated using (true);
create policy pm_messages_i on pm_messages for insert to authenticated with check (true);
create policy pm_messages_u on pm_messages for update to authenticated using (true) with check (true);
create policy pm_messages_d on pm_messages for delete to authenticated using (true);

create table if not exists pm_activity_log (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references pm_projects(id) on delete cascade,
  action text not null,
  entity_type text,
  entity_id uuid,
  details text,
  performed_by text default 'Admin',
  created_at timestamptz default now()
);

create index if not exists idx_pm_activity_project on pm_activity_log(project_id);
create index if not exists idx_pm_activity_date on pm_activity_log(created_at desc);

alter table pm_activity_log enable row level security;
create policy pm_activity_s on pm_activity_log for select to authenticated using (true);
create policy pm_activity_i on pm_activity_log for insert to authenticated with check (true);
create policy pm_activity_d on pm_activity_log for delete to authenticated using (true);
