# Supabase schema for Vatia (portfolio)

All migrations are idempotent and run in order. The project id used during
development is `lwkkmgjaeidjzfnmkiib` (region `eu-west-3`, free tier).

## Migrations

| File | What it does |
| --- | --- |
| `0001_foods_table.sql` | `public.foods` (34 columns mirroring the CREA source), gin index on the `search` tsvector, RLS on with a public SELECT policy. |
| `0002_seasonal_families.sql` | `public.seasonal_families` with a `int[]` months constraint, `pg_trgm` extension + trigram GIN index on `family_name`, public SELECT. |
| `0003_ai_support.sql` | `ai_substitution_cache` + `ai_rate_limit` (RLS on, no policies — service_role only) and the `ai_rate_limit_bump(day, limit)` SECURITY DEFINER function. |
| `0004_food_seasonality.sql` | `food_seasonality(food_id, month)` — resolves seasonality and km0 badges at query time via ILIKE + trigram + toponym scan. Granted to `anon`/`authenticated`. |
| `0005_seed_seasonal_families.sql` | 52 Italian produce families (approximate peak months). |

## Seeding the `foods` table

`packages/diet-engine/data/foods_full.csv` holds all 900 rows exported from
the original CREA-backed table. Load it via the Supabase Dashboard once the
migrations are applied:

1. Open the project → **Table Editor** → `foods`.
2. Click **Insert** → **Import data from CSV**.
3. Upload `foods_full.csv`.
4. Leave *Match by column name*; confirm nothing overrides `id`.

Import runs as `service_role`, so the read-only RLS policy on `foods` does
not need to be relaxed for the seed.

## Design notes

- **RLS everywhere, even on public data.** `foods` is world-readable but
  the policy is explicit; writes stay blocked. `ai_substitution_cache`
  and `ai_rate_limit` have RLS enabled with *no* policies — service_role
  bypasses RLS, so the Edge Function still reaches them while `anon` and
  `authenticated` get nothing. This matches the "principle of least
  exposure" spelled out in the top-level `README.md`.
- **Seasonality is computed, not stored.** No column on `foods` marks
  "in season". `food_seasonality()` joins to `seasonal_families` on the
  fly via a fuzzy match, so the calendar can be updated by inserting into
  one table without a backfill.
- **AI rate-limiting is a SQL function, not app-side.** The
  `ai_rate_limit_bump` upsert-with-return runs inside a single statement,
  so two concurrent Edge Function invocations cannot both slip under the
  cap.
