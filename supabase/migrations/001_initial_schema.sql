-- ============================================================
-- RodStack V2 — Initial Schema
-- Run this in the Supabase SQL editor or via supabase db push
-- ============================================================

-- Enable UUID extension (already enabled in most Supabase projects)
create extension if not exists "pgcrypto";

-- ============================================================
-- PROFILES
-- One row per authenticated user. Created automatically via trigger.
-- ============================================================
create table if not exists public.profiles (
  id            uuid references auth.users on delete cascade primary key,
  email         text,
  display_name  text,
  created_at    timestamptz default now() not null
);

-- Auto-create profile on user signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, display_name)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'display_name'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Row Level Security
alter table public.profiles enable row level security;

create policy "Users can view their own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id);

create policy "Users can insert their own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

-- ============================================================
-- ROD BUILDS
-- ============================================================
create table if not exists public.rod_builds (
  id                    uuid default gen_random_uuid() primary key,
  user_id               uuid references auth.users on delete cascade not null,
  name                  text not null,
  rod_length            numeric(5,2) not null,
  power                 text not null,
  action                text not null,
  line_rating           text,
  lure_rating           text,
  blank_material        text,
  guide_notes           text,
  build_notes           text,
  estimated_guide_count integer,
  created_at            timestamptz default now() not null,
  updated_at            timestamptz default now() not null
);

-- Index for common query pattern
create index if not exists rod_builds_user_id_idx
  on public.rod_builds (user_id, updated_at desc);

-- Updated_at trigger
create or replace function public.set_updated_at()
returns trigger language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger rod_builds_set_updated_at
  before update on public.rod_builds
  for each row execute procedure public.set_updated_at();

-- Row Level Security
alter table public.rod_builds enable row level security;

create policy "Users can manage their own rod builds"
  on public.rod_builds for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ============================================================
-- INVENTORY ITEMS
-- ============================================================
create table if not exists public.inventory_items (
  id          uuid default gen_random_uuid() primary key,
  user_id     uuid references auth.users on delete cascade not null,
  name        text not null,
  category    text not null,
  brand       text,
  quantity    integer default 0 not null,
  unit_cost   numeric(10,2) default 0 not null,
  notes       text,
  created_at  timestamptz default now() not null,
  updated_at  timestamptz default now() not null
);

create index if not exists inventory_items_user_id_idx
  on public.inventory_items (user_id, category, name);

create trigger inventory_items_set_updated_at
  before update on public.inventory_items
  for each row execute procedure public.set_updated_at();

alter table public.inventory_items enable row level security;

create policy "Users can manage their own inventory"
  on public.inventory_items for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ============================================================
-- BUILD COSTS
-- ============================================================
create table if not exists public.build_costs (
  id          uuid default gen_random_uuid() primary key,
  build_id    uuid references public.rod_builds on delete cascade not null,
  user_id     uuid references auth.users on delete cascade not null,
  labor_cost  numeric(10,2) default 0 not null,
  parts_cost  numeric(10,2) default 0 not null,
  notes       text,
  created_at  timestamptz default now() not null,
  updated_at  timestamptz default now() not null,
  -- One cost entry per build per user
  unique (build_id, user_id)
);

create index if not exists build_costs_user_id_idx
  on public.build_costs (user_id);

create trigger build_costs_set_updated_at
  before update on public.build_costs
  for each row execute procedure public.set_updated_at();

alter table public.build_costs enable row level security;

create policy "Users can manage their own build costs"
  on public.build_costs for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
