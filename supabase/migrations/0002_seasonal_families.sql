create extension if not exists pg_trgm;

create table public.seasonal_families (
  id uuid primary key default gen_random_uuid(),
  family_name text not null unique,
  seasonal_months int[] not null,
  is_local boolean not null default true,
  created_at timestamptz not null default now(),
  constraint seasonal_months_valid check (
    array_length(seasonal_months, 1) between 1 and 12
    and seasonal_months <@ array[1,2,3,4,5,6,7,8,9,10,11,12]
  )
);

create index seasonal_families_name_trgm_idx
  on public.seasonal_families using gin (family_name gin_trgm_ops);

alter table public.seasonal_families enable row level security;

create policy seasonal_families_public_read on public.seasonal_families
  for select to anon, authenticated
  using (true);
