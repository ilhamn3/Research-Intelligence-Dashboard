-- ==============================================================================
-- WTFXAI Fix Migration: 005_fix_profiles_rls.sql
-- Description: Fix infinite recursion in profiles table RLS policies.
--
-- Root Cause: Conflicting or duplicate RLS policies on the profiles table,
-- likely from partially-applied migration 004 overlapping with migration 003.
--
-- This migration:
--   1. Drops ALL known policy names on profiles (from migrations 003 AND 004)
--   2. Drops any other policies that might exist (catch-all)
--   3. Recreates is_admin() to be purely JWT-based (no table queries)
--   4. Creates clean, non-recursive policies
-- ==============================================================================

-- Step 1: Drop ALL known policies from migrations 003 and 004
-- (safe to call even if they don't exist)
drop policy if exists "Users can view own profile" on public.profiles;
drop policy if exists "Admin can view all profiles" on public.profiles;
drop policy if exists "Users can update own profile" on public.profiles;
drop policy if exists "Users can insert own profile" on public.profiles;
drop policy if exists "profiles_select_policy" on public.profiles;
drop policy if exists "profiles_update_policy" on public.profiles;
drop policy if exists "profiles_insert_policy" on public.profiles;
drop policy if exists "profiles_delete_policy" on public.profiles;

-- Step 2: Drop ANY remaining policies dynamically (catch-all cleanup)
do $$
declare
  pol_name text;
begin
  for pol_name in
    select policyname from pg_policies where tablename = 'profiles' and schemaname = 'public'
  loop
    execute format('drop policy if exists %I on public.profiles', pol_name);
  end loop;
end;
$$;

-- Step 3: Ensure RLS is enabled
alter table public.profiles enable row level security;

-- Step 4: Recreate is_admin() function - purely JWT-based, NO table queries
-- This is critical: it must NOT reference the profiles table in any way
create or replace function public.is_admin()
returns boolean as $$
begin
  -- Uses only the JWT email claim from Supabase Auth - never queries any table
  return lower(coalesce(auth.jwt() ->> 'email', '')) = 'admin@wtfxai.internal';
end;
$$ language plpgsql security definer stable set search_path = public;

-- Step 5: Create clean, non-recursive policies
-- SELECT: Users see own profile. Admin sees all.
create policy "profiles_select_policy"
  on public.profiles for select
  using (
    auth.uid() = id
    or public.is_admin()
  );

-- UPDATE: Users update own profile. Admin can update any.
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

-- INSERT: Users can only insert their own profile row.
create policy "profiles_insert_policy"
  on public.profiles for insert
  with check (
    auth.uid() = id
    or public.is_admin()
  );

-- DELETE: Only admin can delete profiles.
create policy "profiles_delete_policy"
  on public.profiles for delete
  using (
    public.is_admin()
  );

-- Step 6: Ensure handle_new_user() trigger function is SECURITY DEFINER
-- (bypasses RLS entirely, so it can insert profiles during signup)
create or replace function public.handle_new_user()
returns trigger as $$
declare
  assigned_role text := 'user';
  assigned_dept text := 'Quantitative Research Desk';
begin
  if lower(new.email) = 'admin@wtfxai.internal' then
    assigned_role := 'admin';
    assigned_dept := 'Operations & System Control';
  else
    assigned_role := 'user';
  end if;

  insert into public.profiles (id, email, full_name, role, department)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    assigned_role,
    assigned_dept
  )
  on conflict (id) do update
  set email = excluded.email,
      full_name = coalesce(excluded.full_name, public.profiles.full_name);
  return new;
end;
$$ language plpgsql security definer;

-- Step 7: Verify fix by querying profiles (should not error)
-- Run this after the migration to confirm:
-- SELECT id, email, role FROM public.profiles LIMIT 5;
