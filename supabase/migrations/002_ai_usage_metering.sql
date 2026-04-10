-- ============================================================
-- RodStack V2 — AI Usage Metering & Subscription Tiers
-- Migration 002: Run after 001_initial_schema.sql
-- ============================================================

-- ---- Add plan tier to profiles ----
alter table public.profiles
  add column if not exists plan_tier text not null default 'free'
    check (plan_tier in ('free', 'pro', 'builder', 'enterprise')),
  add column if not exists stripe_customer_id text unique,
  add column if not exists stripe_subscription_id text unique,
  add column if not exists subscription_status text default 'inactive'
    check (subscription_status in ('active', 'inactive', 'past_due', 'canceled', 'trialing'));

-- ---- AI Usage Table ----
-- One row per user per billing period (YYYY-MM).
-- Atomic increment via Postgres advisory lock prevents double-counting
-- on concurrent requests from the same user.
create table if not exists public.ai_usage (
  id            uuid default gen_random_uuid() primary key,
  user_id       uuid references auth.users on delete cascade not null,
  period        text not null,             -- e.g. '2026-04'
  query_count   integer default 0 not null,
  token_count   integer default 0 not null,
  last_query_at timestamptz,
  created_at    timestamptz default now() not null,
  updated_at    timestamptz default now() not null,
  -- One row per user per month
  unique (user_id, period)
);

create index if not exists ai_usage_user_period_idx
  on public.ai_usage (user_id, period);

create trigger ai_usage_set_updated_at
  before update on public.ai_usage
  for each row execute procedure public.set_updated_at();

alter table public.ai_usage enable row level security;

create policy "Users can read their own usage"
  on public.ai_usage for select
  using (auth.uid() = user_id);

-- Service role only for writes (used by server actions, not client)
create policy "Service role can manage usage"
  on public.ai_usage for all
  using (auth.role() = 'service_role');

-- ---- Atomic Usage Increment Function ----
-- Called from server — increments query+token count atomically.
-- Returns the new query_count so the caller can check limits.
create or replace function public.increment_ai_usage(
  p_user_id uuid,
  p_period  text,
  p_tokens  integer default 0
)
returns table (query_count integer, token_count integer)
language plpgsql security definer
as $$
begin
  insert into public.ai_usage (user_id, period, query_count, token_count, last_query_at)
  values (p_user_id, p_period, 1, p_tokens, now())
  on conflict (user_id, period) do update
    set query_count   = public.ai_usage.query_count + 1,
        token_count   = public.ai_usage.token_count + p_tokens,
        last_query_at = now(),
        updated_at    = now();

  return query
    select u.query_count, u.token_count
    from public.ai_usage u
    where u.user_id = p_user_id and u.period = p_period;
end;
$$;

-- ---- Get Current Usage (for quota display) ----
create or replace function public.get_ai_usage(
  p_user_id uuid,
  p_period  text
)
returns table (query_count integer, token_count integer)
language sql security definer stable
as $$
  select coalesce(query_count, 0), coalesce(token_count, 0)
  from public.ai_usage
  where user_id = p_user_id and period = p_period
  union all
  select 0, 0
  limit 1;
$$;
