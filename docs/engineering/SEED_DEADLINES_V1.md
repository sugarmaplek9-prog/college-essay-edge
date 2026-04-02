# Seed Deadlines v1

```sql
-- The College Admissions Edge
-- SEED_DEADLINES_V1.sql
-- v1 deadline seed/import script for Supabase Postgres
--
-- Purpose:
-- 1. Provide a staging/import path for structured admissions deadlines.
-- 2. Normalize imported deadline records into public.institution_deadlines.
-- 3. Preserve source metadata and verification state.
-- 4. Support repeatable upsert-based refreshes by admissions cycle.
--
-- Assumptions:
-- - DATABASE_SCHEMA_V1.sql has already been applied.
-- - SEED_INSTITUTIONS_V1.sql has already been applied.
-- - public.institutions and public.institution_deadlines exist.
-- - Institution matching will use external_source_id first, then (official_name, state).
-- - Import source data will be loaded into public.deadlines_staging.
--
-- Recommended workflow:
-- 1. Run this file once to create staging + helper functions/views.
-- 2. Load raw deadline source CSV into public.deadlines_staging.
-- 3. Run the normalization/upsert section.
-- 4. Re-run the upsert section for future admissions-cycle refreshes.

begin;

create extension if not exists pgcrypto;

-- =========================================================
-- STAGING TABLE
-- =========================================================

create table if not exists public.deadlines_staging (
  id bigserial primary key,
  source_name text not null default 'unknown',
  import_batch text,
  admissions_cycle text not null,

  source_institution_id text,
  institution_official_name text,
  institution_common_name text,
  state text,

  ed_raw text,
  ed2_raw text,
  ea_raw text,
  ea2_raw text,
  rea_raw text,
  rd_raw text,
  rolling_raw text,

  source_url text,
  source_last_verified_at timestamptz,
  notes text,
  raw_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_deadlines_staging_cycle
  on public.deadlines_staging(admissions_cycle);

create index if not exists idx_deadlines_staging_source_name
  on public.deadlines_staging(source_name);

create index if not exists idx_deadlines_staging_import_batch
  on public.deadlines_staging(import_batch);

create index if not exists idx_deadlines_staging_source_institution_id
  on public.deadlines_staging(source_institution_id);

-- =========================================================
-- HELPER FUNCTIONS
-- =========================================================

create or replace function public.normalize_deadline_text(input text)
returns text
language sql
immutable
as $$
  select nullif(trim(regexp_replace(lower(coalesce(input, '')), '\s+', ' ', 'g')), '')
$$;

create or replace function public.clean_deadline_url(input text)
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

create or replace function public.is_truthy_deadline_flag(input text)
returns boolean
language sql
immutable
as $$
  select case
    when public.normalize_deadline_text(input) in (
      'yes', 'y', 'true', '1', 'rolling', 'open', 'available'
    ) then true
    else false
  end
$$;

create or replace function public.deadline_text_is_partial(input text)
returns boolean
language sql
immutable
as $$
  select case
    when public.normalize_deadline_text(input) is null then false
    when public.normalize_deadline_text(input) in (
      'see website', 'website', 'tbd', 'varies', 'not available', 'n/a'
    ) then true
    else false
  end
$$;

create or replace function public.try_parse_deadline_date(input text, admissions_cycle text)
returns date
language plpgsql
immutable
as $$
declare
  normalized text;
  parsed_date date;
  fallback_year int;
begin
  normalized := public.normalize_deadline_text(input);

  if normalized is null then
    return null;
  end if;

  if public.deadline_text_is_partial(normalized) then
    return null;
  end if;

  -- Admissions cycle expected format examples:
  -- '2025-2026' or '2026'
  fallback_year := null;

  if admissions_cycle ~ '^\d{4}-\d{4}$' then
    fallback_year := split_part(admissions_cycle, '-', 1)::int;
  elsif admissions_cycle ~ '^\d{4}$' then
    fallback_year := admissions_cycle::int;
  end if;

  -- Already ISO-like date
  begin
    parsed_date := normalized::date;
    return parsed_date;
  exception when others then
    null;
  end;

  -- Month day, year
  begin
    parsed_date := to_date(normalized, 'month dd, yyyy');
    if parsed_date is not null then
      return parsed_date;
    end if;
  exception when others then
    null;
  end;

  begin
    parsed_date := to_date(normalized, 'mon dd, yyyy');
    if parsed_date is not null then
      return parsed_date;
    end if;
  exception when others then
    null;
  end;

  -- Month day without year; use first year in cycle as fallback
  if fallback_year is not null then
    begin
      parsed_date := to_date(normalized || ' ' || fallback_year::text, 'month dd yyyy');
      if parsed_date is not null then
        return parsed_date;
      end if;
    exception when others then
      null;
    end;

    begin
      parsed_date := to_date(normalized || ' ' || fallback_year::text, 'mon dd yyyy');
      if parsed_date is not null then
        return parsed_date;
      end if;
    exception when others then
      null;
    end;
  end if;

  return null;
end;
$$;

create or replace function public.resolve_deadline_confidence(
  ed_raw text,
  ed2_raw text,
  ea_raw text,
  ea2_raw text,
  rea_raw text,
  rd_raw text,
  rolling_raw text,
  verified_at timestamptz
)
returns public.deadline_confidence_status
language plpgsql
immutable
as $$
declare
  has_partial boolean;
  has_any_signal boolean;
begin
  has_partial :=
    public.deadline_text_is_partial(ed_raw)
    or public.deadline_text_is_partial(ed2_raw)
    or public.deadline_text_is_partial(ea_raw)
    or public.deadline_text_is_partial(ea2_raw)
    or public.deadline_text_is_partial(rea_raw)
    or public.deadline_text_is_partial(rd_raw)
    or public.deadline_text_is_partial(rolling_raw);

  has_any_signal :=
    public.normalize_deadline_text(ed_raw) is not null
    or public.normalize_deadline_text(ed2_raw) is not null
    or public.normalize_deadline_text(ea_raw) is not null
    or public.normalize_deadline_text(ea2_raw) is not null
    or public.normalize_deadline_text(rea_raw) is not null
    or public.normalize_deadline_text(rd_raw) is not null
    or public.normalize_deadline_text(rolling_raw) is not null;

  if verified_at is not null and not has_partial then
    return 'verified';
  elsif has_any_signal then
    return 'source_partial';
  else
    return 'stale';
  end if;
end;
$$;

-- =========================================================
-- MATCHING VIEW
-- =========================================================
-- This view resolves each staged record to an institution if possible.

create or replace view public.deadline_staging_matches_v1 as
with candidate_matches as (
  select
    ds.id as staging_id,
    ds.source_name,
    ds.import_batch,
    ds.admissions_cycle,
    ds.source_institution_id,
    ds.institution_official_name,
    ds.institution_common_name,
    upper(trim(ds.state)) as state,
    ds.ed_raw,
    ds.ed2_raw,
    ds.ea_raw,
    ds.ea2_raw,
    ds.rea_raw,
    ds.rd_raw,
    ds.rolling_raw,
    ds.source_url,
    ds.source_last_verified_at,
    ds.notes,
    ds.raw_payload,
    i.id as institution_id,
    i.official_name,
    i.common_name,
    case
      when ds.source_institution_id is not null
       and ds.source_institution_id = i.external_source_id then 1
      when public.normalize_text(ds.institution_official_name) = public.normalize_text(i.official_name)
       and upper(trim(coalesce(ds.state, ''))) = coalesce(i.state, upper(trim(coalesce(ds.state, '')))) then 2
      when ds.institution_common_name is not null
       and public.normalize_text(ds.institution_common_name) = public.normalize_text(coalesce(i.common_name, ''))
       and upper(trim(coalesce(ds.state, ''))) = coalesce(i.state, upper(trim(coalesce(ds.state, '')))) then 3
      else 999
    end as match_rank
  from public.deadlines_staging ds
  left join public.institutions i
    on (
      (ds.source_institution_id is not null and ds.source_institution_id = i.external_source_id)
      or (
        public.normalize_text(ds.institution_official_name) = public.normalize_text(i.official_name)
        and upper(trim(coalesce(ds.state, ''))) = coalesce(i.state, upper(trim(coalesce(ds.state, ''))))
      )
      or (
        ds.institution_common_name is not null
        and public.normalize_text(ds.institution_common_name) = public.normalize_text(coalesce(i.common_name, ''))
        and upper(trim(coalesce(ds.state, ''))) = coalesce(i.state, upper(trim(coalesce(ds.state, ''))))
      )
    )
), ranked as (
  select *, row_number() over (partition by staging_id order by match_rank asc, official_name asc nulls last) as rn
  from candidate_matches
)
select *
from ranked
where rn = 1;

-- =========================================================
-- UPSERT INTO STRUCTURED DEADLINES
-- =========================================================

insert into public.institution_deadlines (
  institution_id,
  admissions_cycle,
  ed_date,
  ed2_date,
  ea_date,
  ea2_date,
  rea_date,
  rd_date,
  rolling_flag,
  source_name,
  source_url,
  verified_at,
  confidence_status,
  notes,
  created_at,
  updated_at
)
select
  m.institution_id,
  m.admissions_cycle,
  public.try_parse_deadline_date(m.ed_raw,  m.admissions_cycle)  as ed_date,
  public.try_parse_deadline_date(m.ed2_raw, m.admissions_cycle)  as ed2_date,
  public.try_parse_deadline_date(m.ea_raw,  m.admissions_cycle)  as ea_date,
  public.try_parse_deadline_date(m.ea2_raw, m.admissions_cycle)  as ea2_date,
  public.try_parse_deadline_date(m.rea_raw, m.admissions_cycle)  as rea_date,
  public.try_parse_deadline_date(m.rd_raw,  m.admissions_cycle)  as rd_date,
  public.is_truthy_deadline_flag(m.rolling_raw)                  as rolling_flag,
  m.source_name,
  public.clean_deadline_url(m.source_url)                        as source_url,
  m.source_last_verified_at                                      as verified_at,
  public.resolve_deadline_confidence(
    m.ed_raw,
    m.ed2_raw,
    m.ea_raw,
    m.ea2_raw,
    m.rea_raw,
    m.rd_raw,
    m.rolling_raw,
    m.source_last_verified_at
  ) as confidence_status,
  m.notes,
  now(),
  now()
from public.deadline_staging_matches_v1 m
where m.institution_id is not null
  and m.admissions_cycle is not null
  and char_length(trim(m.admissions_cycle)) > 0
on conflict (institution_id, admissions_cycle)
do update set
  ed_date = coalesce(excluded.ed_date, public.institution_deadlines.ed_date),
  ed2_date = coalesce(excluded.ed2_date, public.institution_deadlines.ed2_date),
  ea_date = coalesce(excluded.ea_date, public.institution_deadlines.ea_date),
  ea2_date = coalesce(excluded.ea2_date, public.institution_deadlines.ea2_date),
  rea_date = coalesce(excluded.rea_date, public.institution_deadlines.rea_date),
  rd_date = coalesce(excluded.rd_date, public.institution_deadlines.rd_date),
  rolling_flag = coalesce(excluded.rolling_flag, public.institution_deadlines.rolling_flag),
  source_name = coalesce(excluded.source_name, public.institution_deadlines.source_name),
  source_url = coalesce(excluded.source_url, public.institution_deadlines.source_url),
  verified_at = coalesce(excluded.verified_at, public.institution_deadlines.verified_at),
  confidence_status = case
    when excluded.confidence_status = 'verified' then 'verified'::public.deadline_confidence_status
    when public.institution_deadlines.confidence_status = 'verified' then public.institution_deadlines.confidence_status
    else excluded.confidence_status
  end,
  notes = coalesce(excluded.notes, public.institution_deadlines.notes),
  updated_at = now();

-- =========================================================
-- UNMATCHED RECORD REVIEW VIEW
-- =========================================================

create or replace view public.deadline_unmatched_staging_v1 as
select
  m.staging_id,
  m.source_name,
  m.import_batch,
  m.admissions_cycle,
  m.source_institution_id,
  m.institution_official_name,
  m.institution_common_name,
  m.state,
  m.source_url,
  m.notes,
  m.ed_raw,
  m.ed2_raw,
  m.ea_raw,
  m.ea2_raw,
  m.rea_raw,
  m.rd_raw,
  m.rolling_raw
from public.deadline_staging_matches_v1 m
where m.institution_id is null;

-- =========================================================
-- PARSE QUALITY REVIEW VIEW
-- =========================================================

create or replace view public.deadline_parse_review_v1 as
select
  m.staging_id,
  m.institution_id,
  m.official_name,
  m.admissions_cycle,
  m.ed_raw,
  public.try_parse_deadline_date(m.ed_raw, m.admissions_cycle) as ed_date,
  m.ed2_raw,
  public.try_parse_deadline_date(m.ed2_raw, m.admissions_cycle) as ed2_date,
  m.ea_raw,
  public.try_parse_deadline_date(m.ea_raw, m.admissions_cycle) as ea_date,
  m.ea2_raw,
  public.try_parse_deadline_date(m.ea2_raw, m.admissions_cycle) as ea2_date,
  m.rea_raw,
  public.try_parse_deadline_date(m.rea_raw, m.admissions_cycle) as rea_date,
  m.rd_raw,
  public.try_parse_deadline_date(m.rd_raw, m.admissions_cycle) as rd_date,
  m.rolling_raw,
  public.is_truthy_deadline_flag(m.rolling_raw) as rolling_flag,
  public.resolve_deadline_confidence(
    m.ed_raw,
    m.ed2_raw,
    m.ea_raw,
    m.ea2_raw,
    m.rea_raw,
    m.rd_raw,
    m.rolling_raw,
    m.source_last_verified_at
  ) as resolved_confidence_status
from public.deadline_staging_matches_v1 m
where m.institution_id is not null;

-- =========================================================
-- MAINTENANCE HELPERS
-- =========================================================

create or replace function public.mark_stale_deadlines_v1(p_cutoff timestamptz)
returns integer
language plpgsql
as $$
declare
  updated_count integer;
begin
  update public.institution_deadlines
  set confidence_status = 'stale',
      updated_at = now()
  where verified_at is not null
    and verified_at < p_cutoff
    and confidence_status <> 'stale';

  get diagnostics updated_count = row_count;
  return updated_count;
end;
$$;

create or replace function public.current_cycle_deadlines_v1(p_cycle text)
returns table (
  institution_id uuid,
  official_name text,
  common_name text,
  state text,
  ed_date date,
  ed2_date date,
  ea_date date,
  ea2_date date,
  rea_date date,
  rd_date date,
  rolling_flag boolean,
  confidence_status public.deadline_confidence_status,
  source_name text,
  source_url text,
  verified_at timestamptz
)
language sql
stable
as $$
  select
    i.id,
    i.official_name,
    i.common_name,
    i.state,
    d.ed_date,
    d.ed2_date,
    d.ea_date,
    d.ea2_date,
    d.rea_date,
    d.rd_date,
    d.rolling_flag,
    d.confidence_status,
    d.source_name,
    d.source_url,
    d.verified_at
  from public.institution_deadlines d
  join public.institutions i on i.id = d.institution_id
  where d.admissions_cycle = p_cycle
  order by i.official_name asc;
$$;

commit;

-- =========================================================
-- POST-SETUP OPERATIONAL NOTES
-- =========================================================
-- 1. Load raw source deadline data into public.deadlines_staging.
-- 2. Review public.deadline_unmatched_staging_v1 after each import.
-- 3. Review public.deadline_parse_review_v1 to validate parser quality.
-- 4. Re-run only the UPSERT block for future admissions-cycle refreshes.
-- 5. Use public.current_cycle_deadlines_v1('2025-2026') for admin review or API support.
-- 6. Consider marking deadlines stale annually with public.mark_stale_deadlines_v1(...).
--
-- Recommended next artifacts:
-- 1. APP_PERMISSIONS_MATRIX_V1.md
-- 2. ROUTE_INVENTORY_V1.md
-- 3. SPRINT_01_TICKETS.md
```