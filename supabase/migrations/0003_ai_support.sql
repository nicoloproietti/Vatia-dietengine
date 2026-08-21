-- Deduplication cache: same (food_id, meal_context) hits Groq/Gemini once.
create table public.ai_substitution_cache (
  cache_key text primary key,
  result jsonb not null,
  created_at timestamptz not null default now()
);

alter table public.ai_substitution_cache enable row level security;
-- No policies: only service_role (used by Edge Functions) may read/write.

-- Global daily counter. The Edge Function refuses new LLM calls once
-- request_count > limit and serves a SQL-similarity fallback instead.
create table public.ai_rate_limit (
  day date primary key,
  request_count integer not null default 0,
  updated_at timestamptz not null default now(),
  constraint request_count_nonneg check (request_count >= 0)
);

alter table public.ai_rate_limit enable row level security;
-- No policies: same rationale — service_role only.

-- Atomic bump + read. Returns the count after incrementing today's row
-- (upserted) and whether the request is still allowed under p_limit.
-- SECURITY DEFINER so Edge Functions don't need direct table grants.
create or replace function public.ai_rate_limit_bump(p_day date, p_limit integer)
returns table(new_count integer, allowed boolean)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count integer;
begin
  insert into public.ai_rate_limit as r (day, request_count, updated_at)
  values (p_day, 1, now())
  on conflict (day) do update
    set request_count = r.request_count + 1,
        updated_at = now()
  returning r.request_count into v_count;

  return query select v_count, v_count <= p_limit;
end;
$$;

revoke all on function public.ai_rate_limit_bump(date, integer) from public;
grant execute on function public.ai_rate_limit_bump(date, integer) to service_role;
