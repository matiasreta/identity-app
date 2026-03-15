-- Migration: Add profiles table to an existing database
-- Run this in Supabase SQL editor if you already have the old schema.

-- 1. Create profiles table
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default '',
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 2. Backfill profiles for existing auth users
insert into public.profiles (id, display_name)
select id, coalesce(raw_user_meta_data ->> 'display_name', '')
from auth.users
on conflict (id) do nothing;

-- 3. Auto-create profile on new user signup
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

-- 4. Update FKs on habits and entries to reference profiles instead of auth.users
-- (Only needed if the old FK pointed to auth.users)
do $$
declare
  fk_name text;
begin
  -- habits user_id FK
  select c.conname into fk_name
  from pg_constraint c
  join pg_class t on t.oid = c.conrelid
  where c.contype = 'f' and t.relname = 'timetrack_habits'
    and c.conkey = array[(select attnum from pg_attribute where attrelid = 'public.timetrack_habits'::regclass and attname = 'user_id')]
    and c.confrelid = 'auth.users'::regclass
  limit 1;

  if fk_name is not null then
    execute format('alter table public.timetrack_habits drop constraint %I', fk_name);
    alter table public.timetrack_habits
      add constraint timetrack_habits_user_id_fkey
      foreign key (user_id) references public.profiles(id) on delete cascade;
  end if;

  -- entries user_id FK
  select c.conname into fk_name
  from pg_constraint c
  join pg_class t on t.oid = c.conrelid
  where c.contype = 'f' and t.relname = 'timetrack_entries'
    and c.conkey = array[(select attnum from pg_attribute where attrelid = 'public.timetrack_entries'::regclass and attname = 'user_id')]
    and c.confrelid = 'auth.users'::regclass
  limit 1;

  if fk_name is not null then
    execute format('alter table public.timetrack_entries drop constraint %I', fk_name);
    alter table public.timetrack_entries
      add constraint timetrack_entries_user_id_fkey
      foreign key (user_id) references public.profiles(id) on delete cascade;
  end if;
end;
$$;

-- 5. RLS for profiles
alter table public.profiles enable row level security;

drop policy if exists "Users can view own profile" on public.profiles;
create policy "Users can view own profile"
on public.profiles for select to authenticated
using (id = auth.uid());

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile"
on public.profiles for update to authenticated
using (id = auth.uid()) with check (id = auth.uid());

drop policy if exists "Users can insert own profile" on public.profiles;
create policy "Users can insert own profile"
on public.profiles for insert to authenticated
with check (id = auth.uid());

-- 6. Keep updated_at current
create or replace function public.profiles_touch_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end; $$;

drop trigger if exists trg_profiles_updated_at on public.profiles;
create trigger trg_profiles_updated_at
before update on public.profiles
for each row execute function public.profiles_touch_updated_at();
