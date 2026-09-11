-- ==============================================================================
-- WTFXAI Supabase Migration: 004_user_isolation_rls.sql
-- Description: Strict user-level data isolation using user_id (auth.users.id)
--              and Supabase Row Level Security (RLS) across all user-owned data.
-- ==============================================================================

-- 1. Helper function to check if the current requester is the System Administrator
-- Note: Evaluates directly against the verified Supabase JWT claim to prevent infinite recursion
create or replace function public.is_admin()
returns boolean as $$
begin
  return lower(coalesce(auth.jwt() ->> 'email', '')) = 'admin@wtfxai.internal';
end;
$$ language plpgsql security definer set search_path = public;

-- 2. Fix and secure public.profiles RLS policies
alter table if exists public.profiles enable row level security;

drop policy if exists "Users can view own profile" on public.profiles;
drop policy if exists "Admin can view all profiles" on public.profiles;
drop policy if exists "Users can update own profile" on public.profiles;
drop policy if exists "Users can insert own profile" on public.profiles;
drop policy if exists "profiles_select_policy" on public.profiles;
drop policy if exists "profiles_update_policy" on public.profiles;
drop policy if exists "profiles_insert_policy" on public.profiles;

create policy "profiles_select_policy"
  on public.profiles for select
  using (
    auth.uid() = id
    or public.is_admin()
  );

create policy "profiles_update_policy"
  on public.profiles for update
  using (
    auth.uid() = id
    or public.is_admin()
  )
  with check (
    auth.uid() = id
    or public.is_admin()
  );

create policy "profiles_insert_policy"
  on public.profiles for insert
  with check (
    auth.uid() = id
    or public.is_admin()
  );

-- 3. Reports Table: Add user_id and enable strict RLS
alter table public.reports add column if not exists user_id uuid references auth.users(id) on delete cascade;

-- Safe legacy data handling: assign legacy reports without user_id to admin if present
do $$
declare
  admin_uuid uuid;
begin
  select id into admin_uuid from auth.users where lower(email) = 'admin@wtfxai.internal' limit 1;
  if admin_uuid is not null then
    update public.reports set user_id = admin_uuid where user_id is null;
  end if;
end;
$$;

create index if not exists idx_reports_user_id on public.reports(user_id);
create index if not exists idx_reports_company_id on public.reports(company_id);
create index if not exists idx_reports_generated_at on public.reports(generated_at desc);

alter table public.reports enable row level security;

drop policy if exists "reports_select_policy" on public.reports;
drop policy if exists "reports_insert_policy" on public.reports;
drop policy if exists "reports_update_policy" on public.reports;
drop policy if exists "reports_delete_policy" on public.reports;

-- SELECT: Normal users retrieve ONLY their own reports. Admin can inspect all dossiers.
create policy "reports_select_policy"
  on public.reports for select
  using (
    auth.uid() = user_id
    or (user_id is null and public.is_admin())
    or public.is_admin()
  );

-- INSERT: User can ONLY insert rows where user_id matches their authenticated auth.uid()
create policy "reports_insert_policy"
  on public.reports for insert
  with check (
    auth.uid() = user_id
  );

-- UPDATE: User can ONLY update their own reports and cannot reassign user_id to another user
create policy "reports_update_policy"
  on public.reports for update
  using (
    auth.uid() = user_id
    or public.is_admin()
  )
  with check (
    auth.uid() = user_id
    or public.is_admin()
  );

-- DELETE: User can ONLY delete their own reports (admin can delete any)
create policy "reports_delete_policy"
  on public.reports for delete
  using (
    auth.uid() = user_id
    or public.is_admin()
  );

-- 4. User Watchlists Table: Strictly user-isolated pinned companies
create table if not exists public.watchlists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  company_id text not null references public.companies(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique(user_id, company_id)
);

create index if not exists idx_watchlists_user_id on public.watchlists(user_id);
create index if not exists idx_watchlists_company_id on public.watchlists(company_id);

alter table public.watchlists enable row level security;

drop policy if exists "watchlists_select_policy" on public.watchlists;
drop policy if exists "watchlists_insert_policy" on public.watchlists;
drop policy if exists "watchlists_delete_policy" on public.watchlists;

-- SELECT: Users see ONLY their own pinned watchlist
create policy "watchlists_select_policy"
  on public.watchlists for select
  using (
    auth.uid() = user_id
    or public.is_admin()
  );

-- INSERT: User can only pin companies under their own user_id
create policy "watchlists_insert_policy"
  on public.watchlists for insert
  with check (
    auth.uid() = user_id
  );

-- DELETE: User can only remove pins from their own watchlist
create policy "watchlists_delete_policy"
  on public.watchlists for delete
  using (
    auth.uid() = user_id
    or public.is_admin()
  );

-- 5. Research Briefs: Isolate briefs per user per company
alter table public.research_briefs add column if not exists user_id uuid references auth.users(id) on delete cascade;

-- Safe legacy data handling: assign legacy briefs to admin if present
do $$
declare
  admin_uuid uuid;
begin
  select id into admin_uuid from auth.users where lower(email) = 'admin@wtfxai.internal' limit 1;
  if admin_uuid is not null then
    update public.research_briefs set user_id = admin_uuid where user_id is null;
  end if;
end;
$$;

create index if not exists idx_briefs_user_id on public.research_briefs(user_id);

alter table public.research_briefs enable row level security;

drop policy if exists "briefs_select_policy" on public.research_briefs;
drop policy if exists "briefs_insert_policy" on public.research_briefs;
drop policy if exists "briefs_update_policy" on public.research_briefs;
drop policy if exists "briefs_delete_policy" on public.research_briefs;

create policy "briefs_select_policy"
  on public.research_briefs for select
  using (
    auth.uid() = user_id
    or (user_id is null and auth.role() = 'authenticated')
    or public.is_admin()
  );

create policy "briefs_insert_policy"
  on public.research_briefs for insert
  with check (
    auth.uid() = user_id
  );

create policy "briefs_update_policy"
  on public.research_briefs for update
  using (
    auth.uid() = user_id
    or public.is_admin()
  )
  with check (
    auth.uid() = user_id
    or public.is_admin()
  );

create policy "briefs_delete_policy"
  on public.research_briefs for delete
  using (
    auth.uid() = user_id
    or public.is_admin()
  );

-- 6. Skore Jobs Table: User-scoped jobs and executions
alter table public.skore_jobs add column if not exists user_id uuid references auth.users(id) on delete set null;

create index if not exists idx_jobs_user_id on public.skore_jobs(user_id);

alter table public.skore_jobs enable row level security;

drop policy if exists "jobs_select_policy" on public.skore_jobs;
drop policy if exists "jobs_insert_policy" on public.skore_jobs;
drop policy if exists "jobs_update_policy" on public.skore_jobs;
drop policy if exists "jobs_delete_policy" on public.skore_jobs;

create policy "jobs_select_policy"
  on public.skore_jobs for select
  using (
    auth.uid() = user_id
    or user_id is null
    or public.is_admin()
  );

create policy "jobs_insert_policy"
  on public.skore_jobs for insert
  with check (
    auth.uid() = user_id
    or user_id is null
    or public.is_admin()
  );

create policy "jobs_update_policy"
  on public.skore_jobs for update
  using (
    auth.uid() = user_id
    or user_id is null
    or public.is_admin()
  )
  with check (
    auth.uid() = user_id
    or user_id is null
    or public.is_admin()
  );

-- 7. User Activity Logs Table: User-scoped audit events
create table if not exists public.activity_logs (
  id text primary key,
  user_id uuid references auth.users(id) on delete cascade,
  type text not null check (type in ('trigger', 'decision', 'execution', 'error', 'report', 'watchlist')),
  title text not null,
  detail text not null,
  timestamp timestamptz not null default now(),
  company_id text references public.companies(id) on delete set null
);

create index if not exists idx_activity_logs_user_id on public.activity_logs(user_id);
create index if not exists idx_activity_logs_timestamp on public.activity_logs(timestamp desc);

alter table public.activity_logs enable row level security;

drop policy if exists "activity_select_policy" on public.activity_logs;
drop policy if exists "activity_insert_policy" on public.activity_logs;

create policy "activity_select_policy"
  on public.activity_logs for select
  using (
    auth.uid() = user_id
    or user_id is null
    or public.is_admin()
  );

create policy "activity_insert_policy"
  on public.activity_logs for insert
  with check (
    auth.uid() = user_id
  );

-- 8. Shared Universe Tables: Public read for authenticated users, admin write
alter table public.companies enable row level security;
drop policy if exists "companies_select_policy" on public.companies;
drop policy if exists "companies_write_policy" on public.companies;

create policy "companies_select_policy"
  on public.companies for select
  using (true);

create policy "companies_write_policy"
  on public.companies for all
  using (public.is_admin())
  with check (public.is_admin());

alter table public.triggers enable row level security;
drop policy if exists "triggers_select_policy" on public.triggers;
create policy "triggers_select_policy"
  on public.triggers for select
  using (true);

alter table public.agent_decisions enable row level security;
drop policy if exists "decisions_select_policy" on public.agent_decisions;
create policy "decisions_select_policy"
  on public.agent_decisions for select
  using (true);
