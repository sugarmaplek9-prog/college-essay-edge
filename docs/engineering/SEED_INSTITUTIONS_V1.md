# Seed Institutions v1

```sql
-- The College Admissions Edge
-- SEED_INSTITUTIONS_V1.sql
-- v1 institution seed/import script for Supabase Postgres
--
-- Purpose:
-- 1. Provide a staging/import path for U.S. college and university records.
-- 2. Normalize imported records into public.institutions.
-- 3. Generate search terms for typeahead and alias matching.
-- 4. Support repeatable upsert-based refreshes.
--
-- Assumptions:
-- - DATABASE_SCHEMA_V1.sql has already been applied.
-- - public.institutions exists.
-- - Import source data will be loaded into public.institutions_staging.
-- - RLS is bypassed by service role/admin migration execution.
--
-- Recommended workflow:
-- 1. Run this file once to create staging + helper functions.
-- 2. Load raw source CSV into public.institutions_staging.
-- 3. Run the normalization/upsert section.
-- 4. Re-run upsert section for future refreshes.

begin;

create extension if not exists pgcrypto;
create extension if not exists unaccent;

-- =========================================================
-- STAGING TABLE
-- =========================================================

create table if not exists public.institutions_staging (
  id bigserial primary key,
  source_name text not null default 'unknown',
  source_record_id text,
  official_name text,
  common_name text,
  aliases text,
  state text,
  city text,
  sector text,
  website_url text,
  common_app_member boolean,
  import_batch text,
  raw_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_institutions_staging_source_name
  on public.institutions_staging(source_name);

create index if not exists idx_institutions_staging_import_batch
  on public.institutions_staging(import_batch);

-- =========================================================
-- HELPER FUNCTIONS
-- =========================================================

create or replace function public.normalize_text(input text)
returns text
language sql
immutable
as $$
  select nullif(trim(regexp_replace(lower(unaccent(coalesce(input, ''))), '\s+', ' ', 'g')), '')
$$;

create or replace function public.build_search_terms(
  p_official_name text,
  p_common_name text,
  p_aliases text,
  p_city text,
  p_state text
)
returns jsonb
language plpgsql
immutable
as $$
declare
  raw_terms text[];
  cleaned_terms text[];
begin
  raw_terms := array_remove(array[
    p_official_name,
    p_common_name,
    p_city,
    p_state
  ], null);

  if p_aliases is not null and char_length(trim(p_aliases)) > 0 then
    raw_terms := raw_terms || regexp_split_to_array(p_aliases, '\s*\|\s*|\s*,\s*|\s*;\s*');
  end if;

  select array_agg(distinct t)
  into cleaned_terms
  from (
    select public.normalize_text(term) as t
    from unnest(raw_terms) term
  ) x
  where t is not null and char_length(t) > 0;

  return coalesce(to_jsonb(cleaned_terms), '[]'::jsonb);
end;
$$;

create or replace function public.institution_display_name(
  p_official_name text,
  p_common_name text
)
returns text
language sql
immutable
as $$
  select coalesce(nullif(trim(p_common_name), ''), nullif(trim(p_official_name), ''))
$$;

-- =========================================================
-- OPTIONAL CLEANUP HELPERS
-- =========================================================

create or replace function public.clean_state_code(input text)
returns text
language sql
immutable
as $$
  select case
    when input is null then null
    else upper(trim(input))
  end
$$;

create or replace function public.clean_url(input text)
returns text
language sql
immutable
as $$
  select case
    when input is null or char_length(trim(input)) = 0 then null
    when input ~* '^https?://' then trim(input)
    else 'https://' || trim(input)
  end
$$;

-- =========================================================
-- NORMALIZATION / UPSERT
-- =========================================================
--
-- Matching strategy for v1:
-- 1. Prefer external_source_id when available.
-- 2. Fallback uniqueness uses (official_name, state) from schema.
-- 3. Preserve existing rows and refresh mutable attributes.
--
-- Recommended import source fields:
-- - source_record_id : stable external dataset id (NCES/IPEDS/etc.)
-- - official_name    : full institution name
-- - common_name      : consumer-friendly shorter name if available
-- - aliases          : pipe/comma/semicolon separated aliases
-- - state            : state code or state name
-- - city             : city
-- - sector           : public/private/2-year/4-year/etc.
-- - website_url      : canonical website
-- - common_app_member: boolean if known

insert into public.institutions (
  external_source_id,
  official_name,
  common_name,
  state,
  city,
  sector,
  website_url,
  common_app_member,
  search_terms_json,
  created_at,
  updated_at
)
select
  nullif(trim(s.source_record_id), '') as external_source_id,
  trim(s.official_name) as official_name,
  nullif(trim(s.common_name), '') as common_name,
  public.clean_state_code(s.state) as state,
  nullif(trim(s.city), '') as city,
  nullif(trim(s.sector), '') as sector,
  public.clean_url(s.website_url) as website_url,
  coalesce(s.common_app_member, false) as common_app_member,
  public.build_search_terms(
    s.official_name,
    s.common_name,
    s.aliases,
    s.city,
    public.clean_state_code(s.state)
  ) as search_terms_json,
  now(),
  now()
from public.institutions_staging s
where s.official_name is not null
  and char_length(trim(s.official_name)) > 0
on conflict (official_name, state)
do update set
  external_source_id = coalesce(excluded.external_source_id, public.institutions.external_source_id),
  common_name = coalesce(excluded.common_name, public.institutions.common_name),
  city = coalesce(excluded.city, public.institutions.city),
  sector = coalesce(excluded.sector, public.institutions.sector),
  website_url = coalesce(excluded.website_url, public.institutions.website_url),
  common_app_member = coalesce(excluded.common_app_member, public.institutions.common_app_member),
  search_terms_json = case
    when public.institutions.search_terms_json is null or public.institutions.search_terms_json = '[]'::jsonb
      then excluded.search_terms_json
    else (
      select to_jsonb(array_agg(distinct term order by term))
      from (
        select jsonb_array_elements_text(public.institutions.search_terms_json) as term
        union
        select jsonb_array_elements_text(excluded.search_terms_json) as term
      ) merged
    )
  end,
  updated_at = now();

-- =========================================================
-- SEARCH MAINTENANCE HELPERS
-- =========================================================

create or replace function public.refresh_institution_search_terms()
returns void
language plpgsql
as $$
begin
  update public.institutions i
  set search_terms_json = public.build_search_terms(
        i.official_name,
        i.common_name,
        array_to_string(
          coalesce(
            array(
              select jsonb_array_elements_text(i.search_terms_json)
            ),
            array[]::text[]
          ),
          '|'
        ),
        i.city,
        i.state
      ),
      updated_at = now();
end;
$$;

create or replace function public.search_institutions_v1(
  p_query text,
  p_limit integer default 20
)
returns table (
  institution_id uuid,
  official_name text,
  common_name text,
  state text,
  city text,
  sector text,
  website_url text,
  common_app_member boolean
)
language sql
stable
as $$
  with normalized as (
    select public.normalize_text(p_query) as q
  )
  select
    i.id,
    i.official_name,
    i.common_name,
    i.state,
    i.city,
    i.sector,
    i.website_url,
    i.common_app_member
  from public.institutions i, normalized n
  where n.q is not null
    and (
      public.normalize_text(i.official_name) like n.q || '%'
      or public.normalize_text(coalesce(i.common_name, '')) like n.q || '%'
      or exists (
        select 1
        from jsonb_array_elements_text(i.search_terms_json) term
        where term like n.q || '%'
           or term like '%' || n.q || '%'
      )
    )
  order by
    case
      when public.normalize_text(i.official_name) = n.q then 0
      when public.normalize_text(coalesce(i.common_name, '')) = n.q then 1
      when public.normalize_text(i.official_name) like n.q || '%' then 2
      when public.normalize_text(coalesce(i.common_name, '')) like n.q || '%' then 3
      else 4
    end,
    i.official_name asc
  limit greatest(coalesce(p_limit, 20), 1);
$$;

-- =========================================================
-- OPTIONAL DEDUPE REVIEW VIEW
-- =========================================================

create or replace view public.institution_potential_duplicates_v1 as
select
  a.id as institution_id_a,
  b.id as institution_id_b,
  a.official_name as official_name_a,
  b.official_name as official_name_b,
  a.state,
  a.city as city_a,
  b.city as city_b,
  a.common_name as common_name_a,
  b.common_name as common_name_b
from public.institutions a
join public.institutions b
  on a.id < b.id
 and a.state = b.state
 and (
      public.normalize_text(a.official_name) = public.normalize_text(b.official_name)
      or (
        a.common_name is not null and b.common_name is not null
        and public.normalize_text(a.common_name) = public.normalize_text(b.common_name)
      )
     );

commit;

-- =========================================================
-- POST-SETUP OPERATIONAL NOTES
-- =========================================================
-- 1. Load raw source data into public.institutions_staging.
-- 2. Re-run only the UPSERT block for future refreshes.
-- 3. If aliases improve over time, rerun public.refresh_institution_search_terms().
-- 4. Build API search against public.search_institutions_v1(query, limit).
-- 5. Review public.institution_potential_duplicates_v1 before large production imports.
--
-- Recommended next artifact:
-- SEED_DEADLINES_V1.sql
```