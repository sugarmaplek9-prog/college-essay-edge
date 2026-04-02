# SPRINT_01_TICKETS

## The College Admissions Edge

## Sprint 01 — Foundation, Auth, Roles, Core App Shell

## 1. Sprint objective

Sprint 01 establishes the production foundation for v1.

At the end of this sprint, the application must have:

* a working repository and deployment pipeline
* environment setup across local, preview, and production
* Supabase connected
* authentication working
* role selection working
* initial schema applied
* RLS applied
* protected route handling working
* core layouts and navigation scaffolding working
* reusable design-system primitives ready for product modules

This sprint does **not** attempt to complete onboarding, snapshot generation, or premium writing workflows.

The output of Sprint 01 is a secure, deployable, role-aware application shell.

---

## 2. Sprint success criteria

Sprint 01 is successful only if all of the following are true:

* GitHub repo is initialized and protected
* Vercel project is connected to repo
* preview deploys work from pull requests
* Supabase project is connected
* local development environment is documented and working
* signup/login/logout/password reset flow works
* role selection flow works
* `user_profiles` and related base tables exist in database
* RLS policies are applied without blocking valid self-access
* non-authenticated users cannot access protected routes
* student/supporting-adult/admin route separation works
* app renders consistent public/authenticated layouts
* design-system primitives exist and are usable
* CI/lint/format pipeline passes

---

## 3. Sprint scope

### Included

* repo and environment setup
* deployment configuration
* Supabase integration
* base database migrations
* RLS migration application
* auth implementation
* role model implementation
* route guards and redirect rules
* public site shell
* auth shell
* authenticated shell
* base UI component primitives

### Excluded

* onboarding step implementation
* snapshot generation
* billing and Stripe flows
* Story Vault
* essay workspace
* supplements
* school planner UI
* reminder jobs
* admin operational tooling beyond route stub

---

## 4. Ticket format

Each ticket below includes:

* ID
* title
* purpose
* implementation notes
* dependencies
* acceptance criteria

---

# 5. Sprint 01 tickets

## T1-001 — Initialize repository and project scaffold

### Purpose

Create the base Next.js application and repository structure.

### Implementation notes

* initialize GitHub repository
* scaffold Next.js app with TypeScript and App Router
* create top-level folders aligned with implementation plan:

  * `app/`
  * `components/`
  * `lib/`
  * `server/`
  * `types/`
  * `emails/`
  * `supabase/`
  * `tests/`
  * `docs/`
* add README with local setup instructions placeholder
* add `.env.example`

### Dependencies

None

### Acceptance criteria

* repo exists
* project runs locally
* folder structure matches implementation plan
* initial commit created

---

## T1-002 — Configure code quality and repository protections

### Purpose

Establish baseline engineering discipline.

### Implementation notes

* configure ESLint
* configure Prettier or equivalent formatting standard
* configure TypeScript strict mode
* add scripts for:

  * `lint`
  * `typecheck`
  * `test`
  * `dev`
  * `build`
* configure branch protection rules on main
* require PR for merge

### Dependencies

T1-001

### Acceptance criteria

* lint passes on clean branch
* typecheck passes on clean branch
* formatting rules enforced
* main branch protection is active

---

## T1-003 — Configure Vercel project and environments

### Purpose

Set up deployment pipeline.

### Implementation notes

* connect GitHub repo to Vercel
* create environments:

  * development
  * preview
  * production
* configure environment variables in Vercel
* ensure preview deployments trigger on PRs
* add `vercel.json` if needed for route or cron configuration baseline

### Dependencies

T1-001

### Acceptance criteria

* production deployment exists
* preview deployments work from PRs
* app loads successfully from Vercel

---

## T1-004 — Create Supabase project and configure local integration

### Purpose

Set up backend foundation.

### Implementation notes

* create Supabase project
* connect app via env vars
* configure Supabase client libraries
* add helper modules for:

  * browser client
  * server client
  * auth/session helpers
* confirm local app can connect to Supabase

### Dependencies

T1-001

### Acceptance criteria

* app connects to Supabase locally
* app connects to Supabase in preview environment
* helper clients are created and typed

---

## T1-005 — Add base environment variable management

### Purpose

Standardize secret and environment handling.

### Implementation notes

* create `.env.example` with required keys:

  * `NEXT_PUBLIC_SUPABASE_URL`
  * `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  * `SUPABASE_SERVICE_ROLE_KEY`
  * `NEXT_PUBLIC_APP_URL`
* reserve placeholders for later providers:

  * Stripe
  * Resend
  * AI provider
* add environment validation helper if used

### Dependencies

T1-001, T1-004

### Acceptance criteria

* required env vars documented
* missing critical env vars fail clearly in development

---

## T1-006 — Apply base database schema migration

### Purpose

Create initial database schema in Supabase.

### Implementation notes

* add `DATABASE_SCHEMA_V1.sql` into migration workflow
* apply migration to development database
* verify creation of:

  * enums
  * user profile tables
  * onboarding tables
  * snapshot tables
  * story tables
  * essay tables
  * institution/deadline tables
  * school list tables
  * supplement tables
  * subscriptions
  * notifications
  * audit events
* capture migration in versioned migration file under `supabase/migrations/`

### Dependencies

T1-004

### Acceptance criteria

* schema migration runs without error
* tables exist in Supabase
* constraints and indexes exist as expected

---

## T1-007 — Apply RLS policy migration

### Purpose

Secure the database with row-level access control.

### Implementation notes

* add `DATABASE_RLS_POLICIES_V1.sql` into migration workflow
* apply to development database
* verify helper functions are present
* confirm RLS is enabled for required tables

### Dependencies

T1-006

### Acceptance criteria

* RLS policies are applied successfully
* authenticated users can access only allowed self-owned records
* protected tables deny unauthorized direct access

---

## T1-008 — Implement Supabase auth flows

### Purpose

Deliver production-ready authentication baseline.

### Implementation notes

* implement signup flow
* implement login flow
* implement logout flow
* implement forgot-password flow
* implement reset-password completion flow
* implement email verification flow if enabled
* create auth helper methods for session retrieval in server components and route handlers

### Dependencies

T1-004, T1-005

### Acceptance criteria

* user can sign up
* user can log in
* user can log out
* user can request password reset
* user can complete password reset
* session is accessible in protected routes

---

## T1-009 — Implement user profile creation on signup

### Purpose

Ensure application role/profile system starts at first auth.

### Implementation notes

* on successful signup, create or initialize `user_profiles` record
* ensure email from auth aligns with `user_profiles.email`
* define behavior for partially completed profiles
* build idempotent creation logic

### Dependencies

T1-006, T1-008

### Acceptance criteria

* new auth user gets corresponding `user_profiles` record
* duplicate profile creation does not occur
* incomplete profile state is supported safely

---

## T1-010 — Implement role selection flow

### Purpose

Assign top-level role required for all downstream routing.

### Implementation notes

* create `/role-select` page
* user can choose:

  * student
  * supporting_adult
* persist role to `user_profiles`
* create role-specific base profile row:

  * `student_profiles` or `supporting_adult_profiles`
* prevent role from being reset casually in UI after assignment

### Dependencies

T1-009

### Acceptance criteria

* newly authenticated user without role is routed to `/role-select`
* selected role persists to database
* corresponding role-specific profile row is created
* role assignment redirects to correct next surface

---

## T1-011 — Implement route protection middleware

### Purpose

Protect authenticated and role-specific routes at entry layer.

### Implementation notes

* create middleware for route class handling
* protect:

  * `/app/*`
  * `/parent/*`
  * `/admin/*`
* redirect unauthenticated users to `/login`
* redirect authenticated users without role to `/role-select`
* redirect wrong-role users to safe destination
* block admin routes for non-admin users

### Dependencies

T1-008, T1-010

### Acceptance criteria

* unauthenticated access to protected routes redirects to `/login`
* missing-role access redirects to `/role-select`
* student cannot access parent routes
* supporting adult cannot access student routes by default
* non-admin cannot access admin routes

---

## T1-012 — Implement server-side route guard helpers

### Purpose

Ensure route and API protection does not rely solely on middleware.

### Implementation notes

* create server helper functions for:

  * requireAuth
  * requireRole
  * requireAdmin
  * resolveCurrentUserProfile
* use helpers in protected layouts and initial route handlers

### Dependencies

T1-008, T1-010

### Acceptance criteria

* server-side data access paths fail safely without valid session
* role checks are reusable and centralized

---

## T1-013 — Build MarketingLayout and public navigation shell

### Purpose

Establish consistent public application shell.

### Implementation notes

* build `MarketingLayout`
* build `MarketingTopNav`
* build basic footer
* create placeholder public pages:

  * `/`
  * `/how-it-works`
  * `/pricing`
  * `/faq`
  * `/about`
* content can be placeholder but route structure must exist

### Dependencies

T1-001

### Acceptance criteria

* all public pages render in shared layout
* nav links function correctly
* responsive header/footer baseline exists

---

## T1-014 — Build AuthLayout and auth page shell

### Purpose

Create consistent auth experience.

### Implementation notes

* build `AuthLayout`
* implement `/signup`, `/login`, `/verify-email`, `/reset-password`, `/role-select`
* use shared card/form shell

### Dependencies

T1-008, T1-010

### Acceptance criteria

* auth pages share consistent layout
* auth forms render correctly
* routes are connected to real auth logic

---

## T1-015 — Build StudentAppLayout shell

### Purpose

Create authenticated student layout for future modules.

### Implementation notes

* build `StudentAppLayout`
* build `AuthenticatedTopBar`
* build `StudentSideNav`
* create placeholder pages:

  * `/app`
  * `/app/onboarding`
  * `/app/snapshot`
  * `/app/story-vault`
  * `/app/personal-statement`
  * `/app/supplements`
  * `/app/schools`
  * `/app/progress`
  * `/app/settings`
* wire nav items to routes

### Dependencies

T1-011, T1-013

### Acceptance criteria

* authenticated student can enter `/app`
* layout renders consistently across student routes
* navigation is present and functioning

---

## T1-016 — Build ParentAppLayout shell

### Purpose

Create authenticated supporting-adult layout for future modules.

### Implementation notes

* build `ParentAppLayout`
* build `ParentSideNav`
* create placeholder pages:

  * `/parent`
  * `/parent/progress`
  * `/parent/deadlines`
  * `/parent/settings`
  * `/parent/onboarding` if route is used

### Dependencies

T1-011, T1-013

### Acceptance criteria

* supporting adult can enter `/parent`
* layout renders consistently across parent routes
* student user is redirected away from parent routes

---

## T1-017 — Build AdminLayout shell and protected admin stubs

### Purpose

Create internal-only admin surface.

### Implementation notes

* build `AdminLayout`
* build `AdminSideNav`
* create placeholder pages:

  * `/admin`
  * `/admin/users`
  * `/admin/schools`
  * `/admin/deadlines`
  * `/admin/analytics`
  * `/admin/support`
* no deep admin logic yet

### Dependencies

T1-011

### Acceptance criteria

* admin routes render for admin users only
* non-admins cannot reach admin pages

---

## T1-018 — Build base design-system primitives

### Purpose

Create reusable UI foundation for all future product work.

### Implementation notes

Build first-pass versions of:

* Button
* Input
* Textarea
* Label
* RadioGroup
* CheckboxGroup
* Select / basic combobox shell
* Card
* Badge
* ProgressBar
* Modal/Dialog shell
* Toast/Alert
* EmptyStatePanel
* ErrorStatePanel
* SkeletonLoader
* SectionHeader

### Dependencies

T1-001

### Acceptance criteria

* primitives exist in shared component library
* primitives are used by public/auth layouts where appropriate
* basic states render correctly

---

## T1-019 — Build shared workflow primitives

### Purpose

Establish stateful reusable wrappers for future modules.

### Implementation notes

Create first-pass versions of:

* RouteGuardShell
* UpgradeGate
* SaveStateIndicator
* LoadingStatePanel
* ProgressSummaryCard
* NextStepCard

### Dependencies

T1-018

### Acceptance criteria

* components exist and can be rendered in placeholder routes
* UpgradeGate can be displayed on premium placeholder routes
* RouteGuardShell supports loading/unauthorized/gated states

---

## T1-020 — Implement placeholder premium gating behavior

### Purpose

Prove entitlement boundary UX before billing integration.

### Implementation notes

* create temporary entitlement resolver stub
* assume all accounts are free unless flagged manually/dev override
* premium routes display `UpgradeGate`
* free student can still access dashboard and non-premium areas

### Dependencies

T1-015, T1-018, T1-019

### Acceptance criteria

* Story Vault route shows upgrade gate for free users
* personal statement route shows upgrade gate for free users
* supplements route shows upgrade gate for free users

---

## T1-021 — Implement analytics event scaffolding

### Purpose

Lay foundation for product analytics without full instrumentation yet.

### Implementation notes

* create analytics abstraction in `lib/analytics/`
* define initial event enum/constants
* add safe no-op/local logger fallback if provider not connected yet
* wire minimal events:

  * signup_completed
  * login_completed
  * role_selected

### Dependencies

T1-001

### Acceptance criteria

* analytics calls can be made through single interface
* minimal auth and role events are emitted or logged safely

---

## T1-022 — Document local development and migration workflow

### Purpose

Make the sprint usable by other engineers immediately.

### Implementation notes

Document:

* local startup steps
* env setup
* how to run migrations
* how to run lint/typecheck/tests
* how to connect Supabase
* how to deploy preview branch

### Dependencies

T1-001 through T1-007

### Acceptance criteria

* a new engineer can clone repo and run app using docs
* migration workflow is documented

---

## T1-023 — Add initial automated test scaffolding

### Purpose

Ensure the project is ready for real test coverage in Sprint 02.

### Implementation notes

* configure test runner(s)
* configure basic unit/integration/e2e folder structure
* add initial smoke tests for:

  * public homepage render
  * login page render
  * protected route redirect behavior

### Dependencies

T1-001, T1-011

### Acceptance criteria

* tests can run in CI/local
* at least one route-protection behavior is covered

---

## T1-024 — Validate auth + RLS alignment manually and with scripted checks

### Purpose

Catch foundational security defects before Sprint 02.

### Implementation notes

Perform validation for:

* user can read own profile
* user cannot read another user’s student profile directly
* supporting adult cannot access unrelated student routes
* non-admin cannot access admin routes
* protected tables are actually protected

### Dependencies

T1-007 through T1-012

### Acceptance criteria

* access control checks pass
* security findings documented if any fail

---

## T1-025 — Sprint 01 QA and hardening pass

### Purpose

Stabilize the foundation before feature development continues.

### Implementation notes

* fix auth edge cases
* fix redirect loops
* fix layout regressions
* fix mobile nav issues in shells
* confirm Vercel preview behavior
* confirm no obvious console/runtime errors on core routes

### Dependencies

All prior Sprint 01 tickets

### Acceptance criteria

* no critical auth defects remain
* no critical routing defects remain
* app shell is stable on desktop and mobile

---

# 6. Recommended implementation order inside sprint

## Wave 1

* T1-001
* T1-002
* T1-003
* T1-004
* T1-005

## Wave 2

* T1-006
* T1-007
* T1-008
* T1-009
* T1-010

## Wave 3

* T1-011
* T1-012
* T1-013
* T1-014
* T1-015
* T1-016
* T1-017

## Wave 4

* T1-018
* T1-019
* T1-020
* T1-021
* T1-022
* T1-023
* T1-024
* T1-025

---

# 7. Sprint 01 deliverable checklist

At sprint close, confirm all of the following:

* [ ] repo scaffold complete
* [ ] lint/typecheck/build scripts working
* [ ] Vercel connected
* [ ] preview deploys working
* [ ] Supabase connected
* [ ] schema migration applied
* [ ] RLS migration applied
* [ ] auth works end to end
* [ ] role selection works end to end
* [ ] student shell exists
* [ ] parent shell exists
* [ ] admin shell exists
* [ ] protected route behavior works
* [ ] design-system primitives exist
* [ ] premium placeholder routes show gate
* [ ] test scaffold exists
* [ ] setup docs exist

---

# 8. Non-negotiables for Sprint 01

1. Do not build onboarding questions yet if auth and route protection are not correct.
2. Do not build premium product flows before entitlement gates exist.
3. Do not trust middleware alone for authorization.
4. Do not leave schema and RLS unapplied while building pages.
5. Do not move to Sprint 02 with unresolved auth/role bugs.

---

# 9. Recommended next artifact

Create next:
**SPRINT_02_TICKETS.md**

Sprint 02 should cover:

* student onboarding flow
* supporting-adult onboarding flow
* autosave/resume
* onboarding persistence
* snapshot generation pipeline
* snapshot result page
* free-to-paid conversion hooks
