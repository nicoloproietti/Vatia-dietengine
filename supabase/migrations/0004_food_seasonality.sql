-- Returns seasonality/km0 badges for a single food, resolved at query time
-- by fuzzy-matching the food name against `seasonal_families.family_name`
-- (ILIKE contained, then trigram similarity as tiebreak), and additionally
-- scanning for known Italian toponyms in the name — products with a
-- place-of-origin qualifier count as local even when the family match
-- returns nothing.
--
-- The trigram threshold (0.35) is intentionally loose so "pomodori
-- ciliegini" still matches the "pomodoro" family.
create or replace function public.food_seasonality(
  p_food_id text,
  p_month int default extract(month from current_date)::int
)
returns table(
  food_id text,
  food_name text,
  matched_family text,
  is_in_season boolean,
  is_local boolean,
  matched_toponym text
)
language plpgsql
stable
security invoker
set search_path = public
as $$
declare
  v_food public.foods%rowtype;
  v_family public.seasonal_families%rowtype;
  v_toponyms text[] := array[
    'di sulmona','piacentino','di parma','di norcia','di modena',
    'di calabria','di sicilia','di sardegna','di puglia','di lazio',
    'di toscana','di tropea','di pachino','di cetara','di amalfi',
    'di bronte','di ragusa','di stigliano','di castelfranco',
    'di conegliano','di alba','di asti','di langa','di romagna',
    'siciliano','calabrese','pugliese','sardo','toscano','romano',
    'veneto','ligure','trentino','altoatesino','emiliano','marchigiano',
    'umbro','abruzzese','molisano','campano','lucano','friulano',
    'igp','dop','stg','italiano','italiana'
  ];
  v_matched_toponym text;
  v_family_in_season boolean := false;
  v_family_is_local boolean := false;
begin
  select * into v_food from public.foods where id = p_food_id;
  if not found then
    return;
  end if;

  select f.* into v_family
  from public.seasonal_families f
  where v_food.name ilike '%' || f.family_name || '%'
     or similarity(lower(v_food.name), lower(f.family_name)) > 0.35
  order by
    case when v_food.name ilike '%' || f.family_name || '%' then 0 else 1 end,
    similarity(lower(v_food.name), lower(f.family_name)) desc
  limit 1;

  if found then
    v_family_in_season := p_month = any(v_family.seasonal_months);
    v_family_is_local := v_family.is_local;
  end if;

  select t into v_matched_toponym
  from unnest(v_toponyms) as t
  where v_food.name ilike '%' || t || '%'
  limit 1;

  return query select
    v_food.id,
    v_food.name,
    v_family.family_name,
    v_family_in_season,
    (v_family_is_local or v_matched_toponym is not null),
    v_matched_toponym;
end;
$$;

grant execute on function public.food_seasonality(text, int) to anon, authenticated;
