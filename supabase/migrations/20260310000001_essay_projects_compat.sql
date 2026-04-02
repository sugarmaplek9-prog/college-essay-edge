-- Compatibility migration for local Supabase stack.
-- Ensures AI spine migration can alter essay_projects in clean local setups.

create table if not exists public.essay_projects (
  id uuid primary key
);
