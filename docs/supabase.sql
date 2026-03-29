-- Timetrack schema (public)
-- Run this in Supabase SQL editor before starting the app.

-- ============================================================
-- Profiles table: extends auth.users with app-specific data
-- ============================================================
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default '',
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

drop policy if exists "Users can view own profile" on public.profiles;
create policy "Users can view own profile"
on public.profiles
for select
to authenticated
using (id = auth.uid());

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile"
on public.profiles
for update
to authenticated
using (id = auth.uid())
with check (id = auth.uid());

drop policy if exists "Users can insert own profile" on public.profiles;
create policy "Users can insert own profile"
on public.profiles
for insert
to authenticated
with check (id = auth.uid());

-- Auto-create a profile row when a new user signs up
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'display_name', ''));
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- Keep updated_at current on profile updates
create or replace function public.profiles_touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_profiles_updated_at on public.profiles;
create trigger trg_profiles_updated_at
before update on public.profiles
for each row execute function public.profiles_touch_updated_at();

-- ============================================================
-- Habits table
-- ============================================================
create table if not exists public.timetrack_habits (
  id text primary key,
  user_id uuid not null references public.profiles(id) on delete cascade default auth.uid(),
  name text not null,
  emoji text not null,
  color text not null,
  start_time text not null,
  end_time text not null,
  created_at date not null,
  updated_at timestamptz not null default now()
);

-- ============================================================
-- Entries table
-- ============================================================
create table if not exists public.timetrack_entries (
  day date not null,
  habit_id text not null,
  user_id uuid not null references public.profiles(id) on delete cascade default auth.uid(),
  start_time text not null,
  end_time text not null,
  updated_at timestamptz not null default now(),
  primary key (day, habit_id)
);

-- Ensure entries always reference a valid habit and are removed
-- automatically when the parent habit is deleted.
delete from public.timetrack_entries e
where not exists (
  select 1
  from public.timetrack_habits h
  where h.id = e.habit_id
);

do $$
declare
  current_fk_name text;
  current_fk_deltype "char";
begin
  select c.conname, c.confdeltype
    into current_fk_name, current_fk_deltype
  from pg_constraint c
  join pg_class t on t.oid = c.conrelid
  join pg_namespace n on n.oid = t.relnamespace
  where c.contype = 'f'
    and n.nspname = 'public'
    and t.relname = 'timetrack_entries'
    and c.conkey = array[
      (
        select a.attnum
        from pg_attribute a
        where a.attrelid = 'public.timetrack_entries'::regclass
          and a.attname = 'habit_id'
      )
    ]
  limit 1;

  if current_fk_name is not null and current_fk_deltype <> 'c' then
    execute format(
      'alter table public.timetrack_entries drop constraint %I',
      current_fk_name
    );
    current_fk_name := null;
  end if;

  if current_fk_name is null then
    alter table public.timetrack_entries
      add constraint timetrack_entries_habit_id_fkey
      foreign key (habit_id)
      references public.timetrack_habits (id)
      on delete cascade;
  end if;
end;
$$;

-- Row level security: each user only sees their own data.
alter table public.timetrack_habits enable row level security;
alter table public.timetrack_entries enable row level security;

-- Drop old permissive policies that allowed all access
drop policy if exists "timetrack_habits_anon_all" on public.timetrack_habits;
drop policy if exists "timetrack_entries_anon_all" on public.timetrack_entries;

-- User-scoped policies (authenticated only)
drop policy if exists "Users see own habits" on public.timetrack_habits;
drop policy if exists "Usuarios ven sus propios hábitos" on public.timetrack_habits;
create policy "Users see own habits"
on public.timetrack_habits
for all
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists "Users see own entries" on public.timetrack_entries;
drop policy if exists "Usuarios ven sus propios registros" on public.timetrack_entries;
create policy "Users see own entries"
on public.timetrack_entries
for all
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

-- Optional: keep updated_at current on updates.
create or replace function public.timetrack_touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_timetrack_habits_updated_at on public.timetrack_habits;
create trigger trg_timetrack_habits_updated_at
before update on public.timetrack_habits
for each row execute function public.timetrack_touch_updated_at();

drop trigger if exists trg_timetrack_entries_updated_at on public.timetrack_entries;
create trigger trg_timetrack_entries_updated_at
before update on public.timetrack_entries
for each row execute function public.timetrack_touch_updated_at();

-- ============================================================
-- Migration: add duration column to entries (integer, minutes)
-- ============================================================
ALTER TABLE public.timetrack_entries
  ADD COLUMN IF NOT EXISTS duration integer;

-- Backfill duration for existing entries
UPDATE public.timetrack_entries
SET duration = CASE
  WHEN (SPLIT_PART(end_time, ':', 1)::int * 60 + SPLIT_PART(end_time, ':', 2)::int)
     > (SPLIT_PART(start_time, ':', 1)::int * 60 + SPLIT_PART(start_time, ':', 2)::int)
  THEN (SPLIT_PART(end_time, ':', 1)::int * 60 + SPLIT_PART(end_time, ':', 2)::int)
     - (SPLIT_PART(start_time, ':', 1)::int * 60 + SPLIT_PART(start_time, ':', 2)::int)
  ELSE (SPLIT_PART(end_time, ':', 1)::int * 60 + SPLIT_PART(end_time, ':', 2)::int)
     - (SPLIT_PART(start_time, ':', 1)::int * 60 + SPLIT_PART(start_time, ':', 2)::int)
     + 1440
END
WHERE duration IS NULL;

-- ============================================================
-- Profile Deletion RPC
-- ============================================================
-- Allows authenticated users to permanently delete their account.
-- NOTE: Due to ON DELETE CASCADE on profiles, this will also
-- clear out their habits and entries automatically.
CREATE OR REPLACE FUNCTION delete_user()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM auth.users WHERE id = auth.uid();
END;
$$;
