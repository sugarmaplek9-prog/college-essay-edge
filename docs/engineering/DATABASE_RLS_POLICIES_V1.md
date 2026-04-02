# Database RLS Policies v1

```sql
-- The College Admissions Edge
-- DATABASE_RLS_POLICIES_V1.sql
-- v1 Row Level Security policies for Supabase Postgres
--
-- Purpose:
-- 1. Enforce student ownership of student-authored content.
-- 2. Enforce supporting-adult visibility only through explicit student_support_links.
-- 3. Enforce admin override where required.
-- 4. Keep public institution and deadline data readable to authenticated users.
--
-- Assumptions:
-- - DATABASE_SCHEMA_V1.sql has already been applied.
-- - auth.uid() is available through Supabase Auth.
-- - public.user_profiles is the canonical role table.
--
-- Important:
-- - Policies are intentionally explicit and repetitive for clarity.
-- - Service role bypasses RLS automatically in Supabase.
-- - Anonymous/public access is not granted here.

begin;

-- =========================================================
-- HELPER FUNCTIONS
-- =========================================================

create or replace function public.current_user_role()
returns public.user_role
language sql
stable
as $$
  select up.role
  from public.user_profiles up
  where up.id = auth.uid()
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from public.user_profiles up
    where up.id = auth.uid()
      and up.role = 'admin'
  )
$$;

create or replace function public.is_student()
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from public.user_profiles up
    where up.id = auth.uid()
      and up.role = 'student'
  )
$$;

create or replace function public.is_supporting_adult()
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from public.user_profiles up
    where up.id = auth.uid()
      and up.role = 'supporting_adult'
  )
$$;

create or replace function public.can_view_student(student_id uuid)
returns boolean
language sql
stable
as $$
  select (
    student_id = auth.uid()
    or public.is_admin()
    or exists (
      select 1
      from public.student_support_links ssl
      where ssl.student_user_id = student_id
        and ssl.supporting_adult_user_id = auth.uid()
    )
  )
$$;

create or replace function public.can_edit_student(student_id uuid)
returns boolean
language sql
stable
as $$
  select (
    student_id = auth.uid()
    or public.is_admin()
  )
$$;

create or replace function public.can_view_supporting_adult(adult_id uuid)
returns boolean
language sql
stable
as $$
  select (
    adult_id = auth.uid()
    or public.is_admin()
    or exists (
      select 1
      from public.student_support_links ssl
      where ssl.supporting_adult_user_id = adult_id
        and ssl.student_user_id = auth.uid()
    )
  )
$$;

create or replace function public.can_manage_support_link(student_id uuid, adult_id uuid)
returns boolean
language sql
stable
as $$
  select (
    public.is_admin()
    or student_id = auth.uid()
    or adult_id = auth.uid()
  )
$$;

-- =========================================================
-- ENABLE RLS ON ALL APP TABLES
-- =========================================================

alter table public.user_profiles enable row level security;
alter table public.student_profiles enable row level security;
alter table public.supporting_adult_profiles enable row level security;
alter table public.student_support_links enable row level security;
alter table public.onboarding_sessions enable row level security;
alter table public.onboarding_responses enable row level security;
alter table public.snapshot_results enable row level security;
alter table public.story_entries enable row level security;
alter table public.essay_projects enable row level security;
alter table public.essay_versions enable row level security;
alter table public.essay_feedback enable row level security;
alter table public.institutions enable row level security;
alter table public.institution_deadlines enable row level security;
alter table public.student_school_lists enable row level security;
alter table public.supplement_projects enable row level security;
alter table public.subscriptions enable row level security;
alter table public.notification_events enable row level security;
alter table public.audit_events enable row level security;

-- =========================================================
-- USER PROFILES
-- =========================================================

create policy user_profiles_select_own_or_admin
on public.user_profiles
for select
using (
  id = auth.uid()
  or public.is_admin()
);

create policy user_profiles_insert_self_or_admin
on public.user_profiles
for insert
with check (
  id = auth.uid()
  or public.is_admin()
);

create policy user_profiles_update_own_or_admin
on public.user_profiles
for update
using (
  id = auth.uid()
  or public.is_admin()
)
with check (
  id = auth.uid()
  or public.is_admin()
);

-- No delete policy for normal users.

-- =========================================================
-- STUDENT PROFILES
-- =========================================================

create policy student_profiles_select_linked_or_admin
on public.student_profiles
for select
using (
  public.can_view_student(user_id)
);

create policy student_profiles_insert_self_or_admin
on public.student_profiles
for insert
with check (
  public.can_edit_student(user_id)
);

create policy student_profiles_update_self_or_admin
on public.student_profiles
for update
using (
  public.can_edit_student(user_id)
)
with check (
  public.can_edit_student(user_id)
);

-- =========================================================
-- SUPPORTING ADULT PROFILES
-- =========================================================

create policy supporting_adult_profiles_select_linked_or_admin
on public.supporting_adult_profiles
for select
using (
  public.can_view_supporting_adult(user_id)
);

create policy supporting_adult_profiles_insert_self_or_admin
on public.supporting_adult_profiles
for insert
with check (
  user_id = auth.uid()
  or public.is_admin()
);

create policy supporting_adult_profiles_update_self_or_admin
on public.supporting_adult_profiles
for update
using (
  user_id = auth.uid()
  or public.is_admin()
)
with check (
  user_id = auth.uid()
  or public.is_admin()
);

-- =========================================================
-- STUDENT SUPPORT LINKS
-- =========================================================

create policy student_support_links_select_linked_or_admin
on public.student_support_links
for select
using (
  student_user_id = auth.uid()
  or supporting_adult_user_id = auth.uid()
  or public.is_admin()
);

create policy student_support_links_insert_participant_or_admin
on public.student_support_links
for insert
with check (
  public.can_manage_support_link(student_user_id, supporting_adult_user_id)
);

create policy student_support_links_delete_participant_or_admin
on public.student_support_links
for delete
using (
  public.can_manage_support_link(student_user_id, supporting_adult_user_id)
);

-- No generic update policy; links should generally be immutable and recreated if changed.

-- =========================================================
-- ONBOARDING SESSIONS
-- =========================================================

create policy onboarding_sessions_select_own_or_admin
on public.onboarding_sessions
for select
using (
  user_id = auth.uid()
  or public.is_admin()
);

create policy onboarding_sessions_insert_own_or_admin
on public.onboarding_sessions
for insert
with check (
  user_id = auth.uid()
  or public.is_admin()
);

create policy onboarding_sessions_update_own_or_admin
on public.onboarding_sessions
for update
using (
  user_id = auth.uid()
  or public.is_admin()
)
with check (
  user_id = auth.uid()
  or public.is_admin()
);

-- =========================================================
-- ONBOARDING RESPONSES
-- =========================================================

create policy onboarding_responses_select_own_or_admin
on public.onboarding_responses
for select
using (
  user_id = auth.uid()
  or public.is_admin()
);

create policy onboarding_responses_insert_own_or_admin
on public.onboarding_responses
for insert
with check (
  user_id = auth.uid()
  or public.is_admin()
);

create policy onboarding_responses_update_own_or_admin
on public.onboarding_responses
for update
using (
  user_id = auth.uid()
  or public.is_admin()
)
with check (
  user_id = auth.uid()
  or public.is_admin()
);

create policy onboarding_responses_delete_own_or_admin
on public.onboarding_responses
for delete
using (
  user_id = auth.uid()
  or public.is_admin()
);

-- =========================================================
-- SNAPSHOT RESULTS
-- =========================================================

create policy snapshot_results_select_linked_or_admin
on public.snapshot_results
for select
using (
  public.can_view_student(student_user_id)
);

create policy snapshot_results_insert_student_or_admin
on public.snapshot_results
for insert
with check (
  public.can_edit_student(student_user_id)
);

create policy snapshot_results_update_student_or_admin
on public.snapshot_results
for update
using (
  public.can_edit_student(student_user_id)
)
with check (
  public.can_edit_student(student_user_id)
);

-- =========================================================
-- STORY ENTRIES
-- =========================================================

create policy story_entries_select_linked_or_admin
on public.story_entries
for select
using (
  public.can_view_student(student_user_id)
    and deleted_at is null
);

create policy story_entries_insert_student_or_admin
on public.story_entries
for insert
with check (
  public.can_edit_student(student_user_id)
);

create policy story_entries_update_student_or_admin
on public.story_entries
for update
using (
  public.can_edit_student(student_user_id)
)
with check (
  public.can_edit_student(student_user_id)
);

create policy story_entries_delete_student_or_admin
on public.story_entries
for delete
using (
  public.can_edit_student(student_user_id)
);

-- =========================================================
-- ESSAY PROJECTS
-- =========================================================

create policy essay_projects_select_linked_or_admin
on public.essay_projects
for select
using (
  public.can_view_student(student_user_id)
    and deleted_at is null
);

create policy essay_projects_insert_student_or_admin
on public.essay_projects
for insert
with check (
  public.can_edit_student(student_user_id)
);

create policy essay_projects_update_student_or_admin
on public.essay_projects
for update
using (
  public.can_edit_student(student_user_id)
)
with check (
  public.can_edit_student(student_user_id)
);

create policy essay_projects_delete_student_or_admin
on public.essay_projects
for delete
using (
  public.can_edit_student(student_user_id)
);

-- =========================================================
-- ESSAY VERSIONS
-- =========================================================

create policy essay_versions_select_linked_or_admin
on public.essay_versions
for select
using (
  exists (
    select 1
    from public.essay_projects ep
    where ep.id = essay_versions.essay_project_id
      and ep.deleted_at is null
      and public.can_view_student(ep.student_user_id)
  )
);

create policy essay_versions_insert_student_or_admin
on public.essay_versions
for insert
with check (
  exists (
    select 1
    from public.essay_projects ep
    where ep.id = essay_versions.essay_project_id
      and ep.deleted_at is null
      and public.can_edit_student(ep.student_user_id)
  )
);

-- No update/delete policy; essay versions are append-only records.

-- =========================================================
-- ESSAY FEEDBACK
-- =========================================================

create policy essay_feedback_select_linked_or_admin
on public.essay_feedback
for select
using (
  exists (
    select 1
    from public.essay_projects ep
    where ep.id = essay_feedback.essay_project_id
      and ep.deleted_at is null
      and public.can_view_student(ep.student_user_id)
  )
);

create policy essay_feedback_insert_student_or_admin
on public.essay_feedback
for insert
with check (
  exists (
    select 1
    from public.essay_projects ep
    where ep.id = essay_feedback.essay_project_id
      and ep.deleted_at is null
      and public.can_edit_student(ep.student_user_id)
  )
);

-- No update/delete policy; feedback should be immutable historical output.

-- =========================================================
-- INSTITUTIONS
-- =========================================================

create policy institutions_select_authenticated
on public.institutions
for select
using (
  auth.uid() is not null
);

create policy institutions_insert_admin_only
on public.institutions
for insert
with check (
  public.is_admin()
);

create policy institutions_update_admin_only
on public.institutions
for update
using (
  public.is_admin()
)
with check (
  public.is_admin()
);

create policy institutions_delete_admin_only
on public.institutions
for delete
using (
  public.is_admin()
);

-- =========================================================
-- INSTITUTION DEADLINES
-- =========================================================

create policy institution_deadlines_select_authenticated
on public.institution_deadlines
for select
using (
  auth.uid() is not null
);

create policy institution_deadlines_insert_admin_only
on public.institution_deadlines
for insert
with check (
  public.is_admin()
);

create policy institution_deadlines_update_admin_only
on public.institution_deadlines
for update
using (
  public.is_admin()
)
with check (
  public.is_admin()
);

create policy institution_deadlines_delete_admin_only
on public.institution_deadlines
for delete
using (
  public.is_admin()
);

-- =========================================================
-- STUDENT SCHOOL LISTS
-- =========================================================

create policy student_school_lists_select_linked_or_admin
on public.student_school_lists
for select
using (
  public.can_view_student(student_user_id)
);

create policy student_school_lists_insert_student_or_admin
on public.student_school_lists
for insert
with check (
  public.can_edit_student(student_user_id)
);

create policy student_school_lists_update_student_or_admin
on public.student_school_lists
for update
using (
  public.can_edit_student(student_user_id)
)
with check (
  public.can_edit_student(student_user_id)
);

create policy student_school_lists_delete_student_or_admin
on public.student_school_lists
for delete
using (
  public.can_edit_student(student_user_id)
);

-- =========================================================
-- SUPPLEMENT PROJECTS
-- =========================================================

create policy supplement_projects_select_linked_or_admin
on public.supplement_projects
for select
using (
  public.can_view_student(student_user_id)
    and deleted_at is null
);

create policy supplement_projects_insert_student_or_admin
on public.supplement_projects
for insert
with check (
  public.can_edit_student(student_user_id)
);

create policy supplement_projects_update_student_or_admin
on public.supplement_projects
for update
using (
  public.can_edit_student(student_user_id)
)
with check (
  public.can_edit_student(student_user_id)
);

create policy supplement_projects_delete_student_or_admin
on public.supplement_projects
for delete
using (
  public.can_edit_student(student_user_id)
);

-- =========================================================
-- SUBSCRIPTIONS
-- =========================================================

create policy subscriptions_select_owner_or_admin
on public.subscriptions
for select
using (
  account_owner_user_id = auth.uid()
  or public.is_admin()
  or exists (
    select 1
    from public.student_support_links ssl
    where (
      ssl.student_user_id = account_owner_user_id
      and ssl.supporting_adult_user_id = auth.uid()
    )
    or (
      ssl.supporting_adult_user_id = account_owner_user_id
      and ssl.student_user_id = auth.uid()
    )
  )
);

create policy subscriptions_insert_owner_or_admin
on public.subscriptions
for insert
with check (
  account_owner_user_id = auth.uid()
  or public.is_admin()
);

create policy subscriptions_update_owner_or_admin
on public.subscriptions
for update
using (
  account_owner_user_id = auth.uid()
  or public.is_admin()
)
with check (
  account_owner_user_id = auth.uid()
  or public.is_admin()
);

-- No delete policy for end users.

-- =========================================================
-- NOTIFICATION EVENTS
-- =========================================================

create policy notification_events_select_own_or_admin
on public.notification_events
for select
using (
  user_id = auth.uid()
  or public.is_admin()
);

create policy notification_events_insert_own_or_admin
on public.notification_events
for insert
with check (
  user_id = auth.uid()
  or public.is_admin()
);

create policy notification_events_update_own_or_admin
on public.notification_events
for update
using (
  user_id = auth.uid()
  or public.is_admin()
)
with check (
  user_id = auth.uid()
  or public.is_admin()
);

-- =========================================================
-- AUDIT EVENTS
-- =========================================================

create policy audit_events_select_admin_only
on public.audit_events
for select
using (
  public.is_admin()
);

create policy audit_events_insert_admin_only
on public.audit_events
for insert
with check (
  public.is_admin()
);

-- =========================================================
-- OPTIONAL: FORCE RLS
-- =========================================================
-- Uncomment if you want to enforce RLS even for table owners in environments
-- where that is appropriate. In Supabase, service role still bypasses RLS.
--
-- alter table public.user_profiles force row level security;
-- alter table public.student_profiles force row level security;
-- alter table public.supporting_adult_profiles force row level security;
-- alter table public.student_support_links force row level security;
-- alter table public.onboarding_sessions force row level security;
-- alter table public.onboarding_responses force row level security;
-- alter table public.snapshot_results force row level security;
-- alter table public.story_entries force row level security;
-- alter table public.essay_projects force row level security;
-- alter table public.essay_versions force row level security;
-- alter table public.essay_feedback force row level security;
-- alter table public.institutions force row level security;
-- alter table public.institution_deadlines force row level security;
-- alter table public.student_school_lists force row level security;
-- alter table public.supplement_projects force row level security;
-- alter table public.subscriptions force row level security;
-- alter table public.notification_events force row level security;
-- alter table public.audit_events force row level security;

commit;

-- End of RLS policy file.
-- Next recommended artifacts:
-- 1. SEED_INSTITUTIONS_V1.sql
-- 2. SEED_DEADLINES_V1.sql
-- 3. APP_PERMISSIONS_MATRIX_V1.md.
```