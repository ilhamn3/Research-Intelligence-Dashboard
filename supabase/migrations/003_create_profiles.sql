-- Create user profiles table linked to Supabase Auth
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  role text not null default 'user' check (role in ('user', 'admin')),
  department text default 'Quantitative Research Desk',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Enable Row Level Security (RLS)
alter table public.profiles enable row level security;

-- Allow authenticated users to read their own profile
create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

-- Allow authenticated users to update their own profile
create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Allow insert during signup or for self
create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

-- Automatically create a profile when a new user signs up via auth
-- Enforces: Only the designated single Admin ID receives admin clearance; all public signups are regular users
create or replace function public.handle_new_user()
returns trigger as $$
declare
  assigned_role text := 'user';
  assigned_dept text := 'Quantitative Research Desk';
begin
  -- Enforce single predefined Admin ID
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

-- Trigger to execute on signup
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
