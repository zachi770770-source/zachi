-- =====================================================================
-- מדייטים לאהבה — Supabase schema, RLS policies and triggers
-- Run this in the Supabase SQL Editor (or via the Supabase CLI).
-- =====================================================================

-- ---------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------
create table if not exists public.profiles (
  id                 uuid primary key references auth.users (id) on delete cascade,
  full_name          text,
  relationship_stage text,
  created_at         timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- situations
-- ---------------------------------------------------------------------
create table if not exists public.situations (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid not null references auth.users (id) on delete cascade,
  title               text not null,
  content             text not null,
  relationship_stage  text,
  emotional_intensity int check (emotional_intensity between 1 and 10),
  suggested_tool      text,
  created_at          timestamptz not null default now()
);

create index if not exists situations_user_id_created_at_idx
  on public.situations (user_id, created_at desc);

-- ---------------------------------------------------------------------
-- tool_entries
-- ---------------------------------------------------------------------
create table if not exists public.tool_entries (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users (id) on delete cascade,
  tool_name  text not null,
  data       jsonb not null default '{}'::jsonb,
  summary    text,
  created_at timestamptz not null default now()
);

create index if not exists tool_entries_user_id_created_at_idx
  on public.tool_entries (user_id, created_at desc);

-- ---------------------------------------------------------------------
-- weekly_maintenance
-- ---------------------------------------------------------------------
create table if not exists public.weekly_maintenance (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users (id) on delete cascade,
  week_start date not null,
  checklist  jsonb not null default '{}'::jsonb,
  reflection text,
  created_at timestamptz not null default now(),
  unique (user_id, week_start)
);

create index if not exists weekly_maintenance_user_id_week_idx
  on public.weekly_maintenance (user_id, week_start desc);

-- =====================================================================
-- Row Level Security
-- =====================================================================
alter table public.profiles           enable row level security;
alter table public.situations         enable row level security;
alter table public.tool_entries       enable row level security;
alter table public.weekly_maintenance enable row level security;

-- profiles: a user may only touch their own profile row (id = auth.uid())
drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id);

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own" on public.profiles
  for insert with check (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

drop policy if exists "profiles_delete_own" on public.profiles;
create policy "profiles_delete_own" on public.profiles
  for delete using (auth.uid() = id);

-- situations: scoped by user_id
drop policy if exists "situations_select_own" on public.situations;
create policy "situations_select_own" on public.situations
  for select using (auth.uid() = user_id);

drop policy if exists "situations_insert_own" on public.situations;
create policy "situations_insert_own" on public.situations
  for insert with check (auth.uid() = user_id);

drop policy if exists "situations_update_own" on public.situations;
create policy "situations_update_own" on public.situations
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "situations_delete_own" on public.situations;
create policy "situations_delete_own" on public.situations
  for delete using (auth.uid() = user_id);

-- tool_entries: scoped by user_id
drop policy if exists "tool_entries_select_own" on public.tool_entries;
create policy "tool_entries_select_own" on public.tool_entries
  for select using (auth.uid() = user_id);

drop policy if exists "tool_entries_insert_own" on public.tool_entries;
create policy "tool_entries_insert_own" on public.tool_entries
  for insert with check (auth.uid() = user_id);

drop policy if exists "tool_entries_update_own" on public.tool_entries;
create policy "tool_entries_update_own" on public.tool_entries
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "tool_entries_delete_own" on public.tool_entries;
create policy "tool_entries_delete_own" on public.tool_entries
  for delete using (auth.uid() = user_id);

-- weekly_maintenance: scoped by user_id
drop policy if exists "weekly_maintenance_select_own" on public.weekly_maintenance;
create policy "weekly_maintenance_select_own" on public.weekly_maintenance
  for select using (auth.uid() = user_id);

drop policy if exists "weekly_maintenance_insert_own" on public.weekly_maintenance;
create policy "weekly_maintenance_insert_own" on public.weekly_maintenance
  for insert with check (auth.uid() = user_id);

drop policy if exists "weekly_maintenance_update_own" on public.weekly_maintenance;
create policy "weekly_maintenance_update_own" on public.weekly_maintenance
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "weekly_maintenance_delete_own" on public.weekly_maintenance;
create policy "weekly_maintenance_delete_own" on public.weekly_maintenance
  for delete using (auth.uid() = user_id);

-- =====================================================================
-- Auto-create a profile row when a new auth user signs up.
-- full_name is taken from the signup metadata when provided.
-- =====================================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, new.raw_user_meta_data ->> 'full_name')
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
