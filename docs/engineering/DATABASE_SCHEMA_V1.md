# Database Schema v1

```sql
-- The College Admissions Edge
-- DATABASE_SCHEMA_V1.sql
-- v1 production schema for Supabase Postgres
-- Purpose: core identity, onboarding, snapshot, story, essay, school planning,
-- supplements, billing, notifications, and audit domains.
--
-- Notes:
-- 1. This schema assumes Supabase Auth is enabled and auth.users is the source of identity.
-- 2. Application-owned tables reference auth.users(id) where appropriate.
-- 3. RLS policies are intentionally not included in this file; they should live in a separate
--    migration so schema creation and security policy review remain isolated.
-- 4. All timestamps use timestamptz.

begin;

create extension if not exists pgcrypto;
create extension if not exists citext;

-- =========================================================
-- ENUMS
-- =========================================================

create type public.user_role as enum (
  'student',
  'supporting_adult',
  'admin'
);

create type public.support_relationship_type as enum (
  'parent',
  'guardian',
  'counselor',
  'family_member',
  'other'
);

create type public.academic_profile_band as enum (
  'mostly_as',
  'as_and_bs',
  'bs_and_cs',
  'cs_and_ds',
  'mixed',
  'prefer_not_to_say'
);

create type public.target_school_band as enum (
  'reach',
  'target',
  'likely',
  'still_figuring_it_out'
);

create type public.onboarding_status as enum (
  'not_started',
  'in_progress',
  'completed'
);

create type public.snapshot_status as enum (
  'queued',
  'generating',
  'ready',
  'viewed',
  'failed'
);

create type public.story_status as enum (
  'draft',
  'refined',
  'used'
);

create type public.story_strength_level as enum (
  'low',
  'medium',
  'high',
  'strong_candidate'
);

create type public.essay_status as enum (
  'not_started',
  'direction_selected',
  'outlining',
  'drafting',
  'revising',
  'complete'
);

create type public.supplement_status as enum (
  'not_started',
  'in_progress',
  'revised',
  'complete'
);

create type public.application_type as enum (
  'ed',
  'ed2',
  'ea',
  'ea2',
  'rea',
  'rd',
  'rolling'
);

create type public.school_list_status as enum (
  'interested',
  'applied',
  'accepted',
  'rejected',
  'waitlisted'
);

create type public.confidence_status as enum (
  'verified',
  'source_partial',
  'user_added_note',
  'stale'
);

create type public.subscription_status as enum (
  'active',
  'canceled',
  'past_due',
  'unpaid'
);

create type public.notification_type as enum (
  'verification',
  'welcome',
  'invite_accepted',
  'onboarding_reminder',
  'milestone',
  'deadline_reminder',
  'billing_confirmation'
);

create type public.audit_event_type as enum (
  'role_assignment',
  'student_adult_link',
  'subscription_change',
  'deadline_edit',
  'school_data_override'
);

-- =========================================================
-- TABLES
-- =========================================================

-- Users table (extends auth.users with app-specific fields)
create table public.users (
  id uuid references auth.users(id) on delete cascade primary key,
  email citext unique not null,
  role user_role not null,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- Student profiles
create table public.student_profiles (
  user_id uuid references public.users(id) on delete cascade primary key,
  first_name text not null,
  last_name text not null,
  grade integer check (grade >= 9 and grade <= 12),
  graduation_year integer check (graduation_year >= 2024 and graduation_year <= 2030),
  academic_profile academic_profile_band,
  target_school_type target_school_band,
  interests jsonb,
  strengths_summary text,
  writing_confidence integer check (writing_confidence >= 1 and writing_confidence <= 5),
  onboarding_complete boolean default false not null,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- Supporting adult profiles
create table public.supporting_adult_profiles (
  user_id uuid references public.users(id) on delete cascade primary key,
  first_name text not null,
  last_name text not null,
  relationship_type support_relationship_type not null,
  relationship_other_text text,
  concern_category text,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- Student-supporting adult links
create table public.student_support_links (
  id uuid default gen_random_uuid() primary key,
  student_user_id uuid references public.users(id) on delete cascade not null,
  adult_user_id uuid references public.users(id) on delete cascade not null,
  relationship_type support_relationship_type not null,
  relationship_other_text text,
  invited_at timestamptz default now() not null,
  accepted_at timestamptz,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null,
  unique(student_user_id, adult_user_id)
);

-- Onboarding sessions
create table public.onboarding_sessions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  role user_role not null,
  current_step integer default 1 not null,
  completion_percent integer default 0 not null check (completion_percent >= 0 and completion_percent <= 100),
  payload_json jsonb default '{}' not null,
  status onboarding_status default 'not_started' not null,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- Snapshot results
create table public.snapshot_results (
  id uuid default gen_random_uuid() primary key,
  student_user_id uuid references public.users(id) on delete cascade not null,
  strongest_themes_json jsonb,
  story_directions_json jsonb,
  missing_elements_json jsonb,
  summary_text text,
  status snapshot_status default 'queued' not null,
  viewed_at timestamptz,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- Story entries
create table public.story_entries (
  id uuid default gen_random_uuid() primary key,
  student_user_id uuid references public.users(id) on delete cascade not null,
  title text not null,
  body text not null,
  category text,
  theme_tags_json jsonb default '[]' not null,
  strength_level story_strength_level default 'medium' not null,
  status story_status default 'draft' not null,
  used_in_personal_statement boolean default false not null,
  used_in_supplements boolean default false not null,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- Essay projects
create table public.essay_projects (
  id uuid default gen_random_uuid() primary key,
  student_user_id uuid references public.users(id) on delete cascade not null,
  title text not null,
  selected_direction text,
  outline_json jsonb,
  current_draft_text text,
  status essay_status default 'not_started' not null,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- Essay versions
create table public.essay_versions (
  id uuid default gen_random_uuid() primary key,
  essay_project_id uuid references public.essay_projects(id) on delete cascade not null,
  version_number integer not null,
  draft_text text not null,
  created_at timestamptz default now() not null,
  unique(essay_project_id, version_number)
);

-- Essay feedback
create table public.essay_feedback (
  id uuid default gen_random_uuid() primary key,
  essay_project_id uuid references public.essay_projects(id) on delete cascade not null,
  what_is_working_json jsonb,
  what_is_weak_json jsonb,
  what_is_missing_json jsonb,
  next_steps_json jsonb,
  created_at timestamptz default now() not null
);

-- Institutions
create table public.institutions (
  id uuid default gen_random_uuid() primary key,
  official_name text not null,
  common_name text,
  state text,
  city text,
  sector text,
  website_url text,
  common_app_member boolean default false not null,
  search_terms_json jsonb default '[]' not null,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- Institution deadlines
create table public.institution_deadlines (
  id uuid default gen_random_uuid() primary key,
  institution_id uuid references public.institutions(id) on delete cascade not null,
  admissions_cycle integer not null check (admissions_cycle >= 2024 and admissions_cycle <= 2030),
  ed_date date,
  ed2_date date,
  ea_date date,
  ea2_date date,
  rea_date date,
  rd_date date,
  rolling_flag boolean default false not null,
  source_name text,
  source_url text,
  verified_at timestamptz,
  confidence_status confidence_status default 'stale' not null,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null,
  unique(institution_id, admissions_cycle)
);

-- Student school lists
create table public.student_school_lists (
  id uuid default gen_random_uuid() primary key,
  student_user_id uuid references public.users(id) on delete cascade not null,
  institution_id uuid references public.institutions(id) on delete cascade not null,
  application_type application_type,
  status school_list_status default 'interested' not null,
  notes text,
  added_at timestamptz default now() not null,
  updated_at timestamptz default now() not null,
  unique(student_user_id, institution_id)
);

-- Supplement projects
create table public.supplement_projects (
  id uuid default gen_random_uuid() primary key,
  student_user_id uuid references public.users(id) on delete cascade not null,
  institution_id uuid references public.institutions(id) on delete cascade not null,
  prompt_text text not null,
  prompt_category text,
  draft_text text,
  status supplement_status default 'not_started' not null,
  overlap_warnings_json jsonb default '[]' not null,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- Subscriptions
create table public.subscriptions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  stripe_subscription_id text unique,
  status subscription_status default 'active' not null,
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancel_at_period_end boolean default false not null,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- Notification events
create table public.notification_events (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  type notification_type not null,
  sent_at timestamptz default now() not null,
  metadata jsonb default '{}' not null
);

-- Audit events
create table public.audit_events (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.users(id) on delete cascade,
  event_type audit_event_type not null,
  old_values jsonb,
  new_values jsonb,
  metadata jsonb default '{}' not null,
  created_at timestamptz default now() not null
);

-- =========================================================
-- INDEXES
-- =========================================================

-- Users
create index idx_users_email on public.users(email);
create index idx_users_role on public.users(role);

-- Student profiles
create index idx_student_profiles_graduation_year on public.student_profiles(graduation_year);

-- Supporting adult profiles
create index idx_supporting_adult_profiles_relationship_type on public.supporting_adult_profiles(relationship_type);

-- Student support links
create index idx_student_support_links_student_user_id on public.student_support_links(student_user_id);
create index idx_student_support_links_adult_user_id on public.student_support_links(adult_user_id);

-- Onboarding sessions
create index idx_onboarding_sessions_user_id on public.onboarding_sessions(user_id);
create index idx_onboarding_sessions_status on public.onboarding_sessions(status);

-- Snapshot results
create index idx_snapshot_results_student_user_id on public.snapshot_results(student_user_id);
create index idx_snapshot_results_status on public.snapshot_results(status);

-- Story entries
create index idx_story_entries_student_user_id on public.story_entries(student_user_id);
create index idx_story_entries_status on public.story_entries(status);
create index idx_story_entries_strength_level on public.story_entries(strength_level);

-- Essay projects
create index idx_essay_projects_student_user_id on public.essay_projects(student_user_id);
create index idx_essay_projects_status on public.essay_projects(status);

-- Essay versions
create index idx_essay_versions_essay_project_id on public.essay_versions(essay_project_id);

-- Essay feedback
create index idx_essay_feedback_essay_project_id on public.essay_feedback(essay_project_id);

-- Institutions
create index idx_institutions_official_name on public.institutions(official_name);
create index idx_institutions_common_name on public.institutions(common_name);
create index idx_institutions_state on public.institutions(state);
create index idx_institutions_search_terms on public.institutions using gin(search_terms_json);

-- Institution deadlines
create index idx_institution_deadlines_institution_id on public.institution_deadlines(institution_id);
create index idx_institution_deadlines_admissions_cycle on public.institution_deadlines(admissions_cycle);

-- Student school lists
create index idx_student_school_lists_student_user_id on public.student_school_lists(student_user_id);
create index idx_student_school_lists_institution_id on public.student_school_lists(institution_id);
create index idx_student_school_lists_status on public.student_school_lists(status);

-- Supplement projects
create index idx_supplement_projects_student_user_id on public.supplement_projects(student_user_id);
create index idx_supplement_projects_institution_id on public.supplement_projects(institution_id);
create index idx_supplement_projects_status on public.supplement_projects(status);

-- Subscriptions
create index idx_subscriptions_user_id on public.subscriptions(user_id);
create index idx_subscriptions_stripe_subscription_id on public.subscriptions(stripe_subscription_id);
create index idx_subscriptions_status on public.subscriptions(status);

-- Notification events
create index idx_notification_events_user_id on public.notification_events(user_id);
create index idx_notification_events_type on public.notification_events(type);
create index idx_notification_events_sent_at on public.notification_events(sent_at);

-- Audit events
create index idx_audit_events_user_id on public.audit_events(user_id);
create index idx_audit_events_event_type on public.audit_events(event_type);
create index idx_audit_events_created_at on public.audit_events(created_at);

-- =========================================================
-- TRIGGERS
-- =========================================================

-- Function to update updated_at
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Apply updated_at triggers to all tables with updated_at
create trigger handle_updated_at before update on public.users for each row execute procedure public.handle_updated_at();
create trigger handle_updated_at before update on public.student_profiles for each row execute procedure public.handle_updated_at();
create trigger handle_updated_at before update on public.supporting_adult_profiles for each row execute procedure public.handle_updated_at();
create trigger handle_updated_at before update on public.student_support_links for each row execute procedure public.handle_updated_at();
create trigger handle_updated_at before update on public.onboarding_sessions for each row execute procedure public.handle_updated_at();
create trigger handle_updated_at before update on public.snapshot_results for each row execute procedure public.handle_updated_at();
create trigger handle_updated_at before update on public.story_entries for each row execute procedure public.handle_updated_at();
create trigger handle_updated_at before update on public.essay_projects for each row execute procedure public.handle_updated_at();
create trigger handle_updated_at before update on public.institutions for each row execute procedure public.handle_updated_at();
create trigger handle_updated_at before update on public.institution_deadlines for each row execute procedure public.handle_updated_at();
create trigger handle_updated_at before update on public.student_school_lists for each row execute procedure public.handle_updated_at();
create trigger handle_updated_at before update on public.supplement_projects for each row execute procedure public.handle_updated_at();
create trigger handle_updated_at before update on public.subscriptions for each row execute procedure public.handle_updated_at();

commit;
```