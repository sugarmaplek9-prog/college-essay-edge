-- =============================================================
-- MIGRATION: AI Spine Schema — Narrative Direction Selection
-- File:      20260311000001_ai_spine_schema.sql
-- Purpose:   Creates all tables, enums, indexes, and seed data
--            required for the Narrative Direction Selection
--            vertical slice and the broader AI module spine.
--
-- Execution order:
--   1. Enums
--   2. module_registry  (+ seed row)
--   3. ai_runs
--   4. ai_artifacts
--   5. artifact_subject_links
--   6. artifact_selection_events
--   7. validator_results
--   8. essay_projects alteration (add selected_direction_artifact_id)
--
-- Idempotency notes:
--   - All CREATE TYPE statements are guarded with DO $$ blocks
--   - Tables use IF NOT EXISTS
--   - Module seed uses ON CONFLICT DO UPDATE
--   - essay_projects column uses ADD COLUMN IF NOT EXISTS
-- =============================================================

begin;

-- =============================================================
-- SECTION 1 — ENUMS
-- Each enum is created inside a DO block so this migration is
-- safe to re-run in CI without failing on "already exists".
-- =============================================================

do $$ begin
  create type public.run_trigger_type_enum as enum (
    'user_action',
    'artifact_created',
    'artifact_updated',
    'refresh',
    'admin_replay',
    'benchmark_run'
  );
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.subject_entity_type_enum as enum (
    'student_profile',
    'story_entry',
    'essay_project',
    'essay_draft_version',
    'supplement_project',
    'supplement_draft_version'
  );
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.execution_mode_enum as enum (
    'standard',
    'reduced_scope',
    'diagnostic_only',
    'needs_more_input',
    'refresh'
  );
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.run_readiness_state_enum as enum (
    'ready',
    'reduced',
    'insufficient_input',
    'stale_context',
    'blocked'
  );
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.run_status_enum as enum (
    'queued',
    'running',
    'completed',
    'partial',
    'needs_more_input',
    'failed_validation',
    'blocked',
    'system_error'
  );
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.artifact_status_enum as enum (
    'success',
    'partial',
    'needs_more_input',
    'failed_validation',
    'blocked'
  );
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.artifact_link_role_enum as enum (
    'primary_subject',
    'evidence_source',
    'selected_dependency',
    'overlap_context',
    'school_context'
  );
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.selection_context_enum as enum (
    'direction_choice',
    'supplement_angle_choice',
    'story_candidate_choice',
    'revision_priority_ack'
  );
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.validator_decision_enum as enum (
    'accept',
    'accept_partial',
    'retry_tightened',
    'retry_reduced_scope',
    'convert_to_needs_more_input',
    'block'
  );
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.validator_severity_enum as enum (
    'low',
    'medium',
    'high',
    'critical'
  );
exception when duplicate_object then null;
end $$;

-- =============================================================
-- SECTION 2 — MODULE REGISTRY
-- Identity table for all AI modules. Every execution path must
-- resolve module identity through this table, not hard-coded
-- string literals in application code.
-- =============================================================

create table if not exists public.module_registry (
  id          uuid        not null default gen_random_uuid() primary key,
  module_key  text        not null,
  display_name text       not null,
  is_enabled  boolean     not null default true,
  created_at  timestamptz not null default now(),

  constraint uq_module_registry_module_key unique (module_key)
);

-- Seed: narrative_direction_selection
-- ON CONFLICT ensures re-runnable migrations stay idempotent
-- while still updating display_name and is_enabled if the row
-- already exists (handles schema drift during development).
insert into public.module_registry (module_key, display_name, is_enabled)
values ('narrative_direction_selection', 'Narrative Direction Selection', true)
on conflict (module_key) do update
  set display_name = excluded.display_name,
      is_enabled   = excluded.is_enabled;

-- =============================================================
-- SECTION 3 — AI RUNS
-- One row per execution invocation attempt. Never overwritten.
-- status = service execution state.
-- =============================================================

create table if not exists public.ai_runs (
  id                      uuid                         not null default gen_random_uuid() primary key,
  module_id               uuid                         not null references public.module_registry(id),
  student_user_id         uuid                         not null references public.users(id),
  trigger_type            public.run_trigger_type_enum not null,
  subject_entity_type     public.subject_entity_type_enum not null,
  subject_entity_id       uuid                         not null,
  execution_mode          public.execution_mode_enum   not null,
  readiness_state         public.run_readiness_state_enum not null,
  status                  public.run_status_enum       not null,
  retry_count             integer                      not null default 0,
  fallback_applied        boolean                      not null default false,
  fallback_reason_code    text                         null,
  provider_key            text                         null,
  model_key               text                         null,
  prompt_bundle_version_id uuid                        null,
  schema_version_id       uuid                         null,
  validator_version_id    uuid                         null,
  started_at              timestamptz                  null,
  completed_at            timestamptz                  null,
  created_at              timestamptz                  not null default now(),

  constraint chk_ai_runs_retry_count_non_negative check (retry_count >= 0)
);

-- Indexes on ai_runs
create index if not exists idx_ai_runs_student_user_id_created_at
  on public.ai_runs (student_user_id, created_at desc);

create index if not exists idx_ai_runs_subject_entity_created_at
  on public.ai_runs (subject_entity_type, subject_entity_id, created_at desc);

create index if not exists idx_ai_runs_module_id_created_at
  on public.ai_runs (module_id, created_at desc);

create index if not exists idx_ai_runs_status_created_at
  on public.ai_runs (status, created_at desc);

-- =============================================================
-- SECTION 4 — AI ARTIFACTS
-- Canonical persisted module output. One artifact per run.
-- Raw provider responses are never stored here.
-- New accepted artifacts may supersede prior canonical ones;
-- old artifacts remain queryable for history and audit.
-- =============================================================

create table if not exists public.ai_artifacts (
  id                      uuid                            not null default gen_random_uuid() primary key,
  run_id                  uuid                            not null unique references public.ai_runs(id),
  module_id               uuid                            not null references public.module_registry(id),
  student_user_id         uuid                            not null references public.users(id),
  subject_entity_type     public.subject_entity_type_enum not null,
  subject_entity_id       uuid                            not null,
  artifact_status         public.artifact_status_enum     not null,
  summary_text            text                            not null,
  payload_json            jsonb                           not null,
  warnings_json           jsonb                           not null default '[]'::jsonb,
  meta_json               jsonb                           not null default '{}'::jsonb,
  is_canonical_for_subject boolean                        not null default false,
  selected_by_user        boolean                         not null default false,
  selected_item_id        text                            null,
  render_version          text                            not null,
  created_at              timestamptz                     not null default now(),
  superseded_at           timestamptz                     null,

  -- payload_json must be a JSON object (not array or scalar)
  constraint chk_ai_artifacts_payload_is_object
    check (jsonb_typeof(payload_json) = 'object')
);

-- Indexes on ai_artifacts
create index if not exists idx_ai_artifacts_subject_entity_created_at
  on public.ai_artifacts (subject_entity_type, subject_entity_id, created_at desc);

-- Partial unique index: enforces at most one canonical artifact per subject.
-- Drop and recreate guard: this index cannot use IF NOT EXISTS with WHERE clause
-- in older Postgres; we use a DO block to handle the idempotency.
do $$ begin
  create unique index idx_ai_artifacts_canonical_subject
    on public.ai_artifacts (subject_entity_type, subject_entity_id)
    where is_canonical_for_subject = true;
exception when duplicate_table then null;
end $$;

create index if not exists idx_ai_artifacts_run_id
  on public.ai_artifacts (run_id);

create index if not exists idx_ai_artifacts_student_user_id_created_at
  on public.ai_artifacts (student_user_id, created_at desc);

-- =============================================================
-- SECTION 5 — ARTIFACT SUBJECT LINKS
-- Explicit provenance: records which entities contributed
-- context to an artifact. Do not bury provenance in payload_json.
-- =============================================================

create table if not exists public.artifact_subject_links (
  id                  uuid                            not null default gen_random_uuid() primary key,
  artifact_id         uuid                            not null references public.ai_artifacts(id) on delete cascade,
  linked_entity_type  public.subject_entity_type_enum not null,
  linked_entity_id    uuid                            not null,
  link_role           public.artifact_link_role_enum  not null,
  created_at          timestamptz                     not null default now()
);

create index if not exists idx_artifact_subject_links_artifact_id
  on public.artifact_subject_links (artifact_id);

create index if not exists idx_artifact_subject_links_linked_entity
  on public.artifact_subject_links (linked_entity_type, linked_entity_id);

-- =============================================================
-- SECTION 6 — ARTIFACT SELECTION EVENTS
-- Append-only log of explicit user direction choices.
-- Selection is never inferred from downstream project mutation.
-- =============================================================

create table if not exists public.artifact_selection_events (
  id                  uuid                           not null default gen_random_uuid() primary key,
  artifact_id         uuid                           not null references public.ai_artifacts(id) on delete cascade,
  student_user_id     uuid                           not null references public.users(id),
  selected_item_id    text                           not null,
  selected_rank       integer                        null,
  selection_context   public.selection_context_enum  not null,
  created_at          timestamptz                    not null default now()
);

create index if not exists idx_artifact_selection_events_artifact_id
  on public.artifact_selection_events (artifact_id, created_at desc);

create index if not exists idx_artifact_selection_events_student_user_id
  on public.artifact_selection_events (student_user_id, created_at desc);

-- =============================================================
-- SECTION 7 — VALIDATOR RESULTS
-- Structured validator truth. One row per generation attempt.
-- Written for every completed attempt, including blocked ones.
-- artifact_id is null if artifact was blocked before persistence.
-- =============================================================

create table if not exists public.validator_results (
  id                          uuid                              not null default gen_random_uuid() primary key,
  run_id                      uuid                              not null references public.ai_runs(id) on delete cascade,
  artifact_id                 uuid                              null references public.ai_artifacts(id) on delete set null,
  module_id                   uuid                              not null references public.module_registry(id),
  validator_version_id        uuid                              null,
  structural_pass             boolean                           not null,
  semantic_pass               boolean                           not null,
  brand_pass                  boolean                           not null,
  authenticity_pass           boolean                           not null,
  admissibility_decision      public.validator_decision_enum    not null,
  highest_severity            public.validator_severity_enum    not null,
  failure_codes_json          jsonb                             not null default '[]'::jsonb,
  warning_codes_json          jsonb                             not null default '[]'::jsonb,
  needs_more_input_reason_code text                             null,
  created_at                  timestamptz                       not null default now()
);

create index if not exists idx_validator_results_run_id
  on public.validator_results (run_id);

create index if not exists idx_validator_results_artifact_id
  on public.validator_results (artifact_id);

create index if not exists idx_validator_results_module_id_created_at
  on public.validator_results (module_id, created_at desc);

-- =============================================================
-- SECTION 8 — ESSAY PROJECTS: ADD DIRECTION ARTIFACT POINTER
-- When a student selects a direction, this column is updated
-- atomically alongside the artifact_selection_events insert.
-- Old artifact history remains intact.
-- =============================================================

alter table public.essay_projects
  add column if not exists selected_direction_artifact_id uuid null;

-- Add FK separately (IF NOT EXISTS guard via DO block)
do $$ begin
  alter table public.essay_projects
    add constraint fk_essay_projects_selected_direction_artifact
    foreign key (selected_direction_artifact_id)
    references public.ai_artifacts(id);
exception when duplicate_object then null;
end $$;

create index if not exists idx_essay_projects_selected_direction_artifact_id
  on public.essay_projects (selected_direction_artifact_id);

commit;
