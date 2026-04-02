-- Compatibility migration for local Supabase stack.
-- Ensures legacy migrations that reference public.users can run in a clean local environment.

create table if not exists public.users (
  id uuid primary key
);
