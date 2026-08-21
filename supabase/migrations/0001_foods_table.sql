-- Public read-only food database. Rows are copied from the CREA (Consiglio
-- per la Ricerca in Agricoltura, IT) reference tables via the CSV seed;
-- the schema mirrors the source columns so nothing is lost in transit.
create table public.foods (
  id text primary key,
  barcode text unique,
  name text not null,
  brand text,
  generic_name text,
  quantity text,
  category text not null default 'altro',
  macro_category text not null default 'unknown',
  food_type text not null default 'branded_product',
  kcal numeric,
  protein numeric,
  carbs numeric,
  fat numeric,
  fiber_100g numeric,
  sugars_100g numeric,
  saturated_fat_100g numeric,
  salt_100g numeric,
  sodium_100g numeric,
  cholesterol_mg_100g numeric,
  serving_size text,
  serving_quantity numeric,
  ingredients text,
  allergens text,
  labels text,
  source text not null default 'open_food_facts',
  source_url text,
  countries_tags text,
  image_url text,
  verified boolean not null default false,
  usable_for_meal_generator boolean not null default false,
  data_quality_score numeric not null default 0,
  nutrients jsonb not null default '{}'::jsonb,
  search tsvector,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index foods_category_idx on public.foods (category);
create index foods_macro_category_idx on public.foods (macro_category);
create index foods_usable_idx on public.foods (usable_for_meal_generator) where usable_for_meal_generator = true;
create index foods_search_idx on public.foods using gin (search);

alter table public.foods enable row level security;

create policy foods_public_read on public.foods
  for select to anon, authenticated
  using (true);
-- No insert/update/delete policies: writes are blocked for anon and
-- authenticated. Only service_role (bypasses RLS) may modify.
