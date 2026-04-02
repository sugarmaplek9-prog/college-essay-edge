# Engineering Build Spec v1

# The College Admissions Edge

## 1. Objective

Build a production-grade, AI-native web application for students and families navigating college admissions. The system must feel premium, fast, intuitive, and trustworthy from first load. It must support a free conversion layer, a paid core product, a school-planning system, and structured AI-assisted writing workflows.

This build is for a small educational business, but the standard is enterprise discipline: clear boundaries, secure data handling, minimal operational complexity, and a product experience that feels current.

## 2. Locked technical decisions
### 2.1 Core stack

Use:

- Next.js App Router
- Vercel
- Supabase
- Resend
- Stripe

Next.js App Router is the current framework model for layouts, navigation, and Server/Client Components, and Route Handlers are the preferred way to implement request handlers inside the app directory.

Vercel is the deployment platform and supports server-side code through Vercel Functions, which are positioned for AI and other I/O-heavy workloads. Project configuration and scheduled tasks are managed through project settings and vercel.json / vercel.ts, including cron support.

Supabase is the backend platform. It provides Postgres, Auth, Storage, Edge Functions, Realtime, and vector support. Supabase also emphasizes Row Level Security for protecting user-specific data.

Resend is the transactional email provider and supports code-based email sending with SDKs and React email workflows.

### 2.2 Architecture rule

Use a single web application with:

- public marketing routes
- authenticated student routes
- authenticated parent routes
- internal admin routes hidden behind role access

Do not split into multiple repos for v1.

### 2.3 Hosting rule

Use Vercel-managed deployment from GitHub with preview environments for pull requests and a single production environment. Vercel automatically configures supported frameworks and supports environment-based configuration and scheduled jobs.

## 3. System architecture
### 3.1 High-level model

The application consists of six bounded domains:

- Identity and account domain
- Admissions profile and onboarding domain
- Story and essay development domain
- School planning and deadlines domain
- Billing and subscription domain
- Notifications and analytics domain

### 3.2 Rendering model

Use Server Components by default.
Use Client Components only where interactivity requires it:

- multi-step onboarding
- editors
- cards with inline state
- modals
- checkout triggers
- parent/student dashboards with client-side interactions

Next.js App Router explicitly separates Server and Client Components and supports composing them together.

### 3.3 Request model

Use Next.js Route Handlers for internal application endpoints:

- authenticated CRUD operations
- AI workflow execution
- school lookup endpoints
- upgrade and billing hooks
- reminder job handlers

Route Handlers in App Router support standard HTTP methods and are the modern equivalent of API routes in this architecture.

## 4. Product surfaces
### 4.1 Public surface

Routes:

- /
- /how-it-works
- /pricing
- /faq
- /about
- /login
- /signup

### 4.2 Student surface

Routes:

- /app
- /app/onboarding
- /app/snapshot
- /app/story-vault
- /app/personal-statement
- /app/supplements
- /app/schools
- /app/progress
- /app/settings

### 4.3 Parent surface

Routes:

- /parent
- /parent/progress
- /parent/deadlines
- /parent/settings

### 4.4 Admin surface

Routes:

- /admin
- /admin/users
- /admin/schools
- /admin/deadlines
- /admin/analytics
- /admin/support

Admin is internal only. No public navigation to admin routes.

## 5. Identity and access control
### 5.1 Auth system

Use Supabase Auth for:

- signup
- login
- password reset
- email verification
- session management

Supabase documents Auth as a core built-in platform capability.

### 5.2 Roles

The system has these top-level roles:

- student
- supporting_adult
- admin

Supporting adult includes:

- parent
- guardian
- counselor
- family member
- other

### 5.3 Access control model

Use database-level Row Level Security plus application-level route guards.

RLS is mandatory for:

- profiles
- stories
- essays
- supplements
- school selections
- billing state
- notifications

Supabase explicitly supports Row Level Security for protecting user data.

### 5.4 Parent/student relationship model

A supporting adult must be linked to a student through an explicit relationship record.
Parent views are read-only for student writing content in v1.

## 6. Core domains
### 6.1 Onboarding domain
**Purpose**

Collect structured information and generate the free Edge Snapshot.

**Functional requirements**

The onboarding engine must:

- support resumable multi-step flow
- autosave each step
- allow backward navigation without data loss
- persist partial completion state
- support student and supporting-adult variants
- generate completion percentage
- create normalized profile records on completion

**State model**

not_started -> in_progress -> completed

**Output**

Onboarding writes to:

- user account
- student profile
- supporting adult profile
- initial school interests
- initial prompt responses
- snapshot generation job request

### 6.2 Snapshot domain
**Purpose**

Deliver the free personalized value layer.

**Functional requirements**

The snapshot system must:

- read onboarding data
- generate theme clusters
- produce top story directions
- identify narrative gaps
- return structured next steps
- persist result for later retrieval

**State model**

queued -> generating -> ready -> viewed

**Output format**

Must always return:

- strongest themes
- strongest story directions
- what is missing
- summary
- upgrade CTA payload

No raw AI dump. No unstructured essay-like response.

### 6.3 Story Vault domain
**Purpose**

Create reusable story assets.

**Functional requirements**

Users must be able to:

- create story entry
- edit story entry
- categorize story
- tag themes
- mark strength level
- mark whether story has been used
- map story to essay or supplement

**State model**

Per story:

draft -> refined -> used

**Rule**

Story Vault is a system of reusable narrative assets, not just saved text blobs.

### 6.4 Essay domain
**Purpose**

Guide authentic personal statement development.

**Functional requirements**

The essay module must support:

- narrative direction selection
- outline recommendation
- draft creation
- structured feedback generation
- revision checklist
- version history
- essay status tracking

**State model**

not_started -> direction_selected -> outlining -> drafting -> revising -> complete

**AI rule**

The system may:

- recommend directions
- recommend structure
- critique clarity
- flag cliché and vagueness
- highlight missing reflection

The system may not:

- produce final “submit this” ghostwritten output
- fabricate student facts
- imply guaranteed admissions advantage

### 6.5 Supplements domain
**Purpose**

Support school-specific short responses.

**Functional requirements**

The supplements module must:

- group prompts by school
- classify prompt type
- suggest angles from Story Vault
- flag redundancy with other essays
- store status
- provide structured feedback

**State model**

Per supplement:

not_started -> in_progress -> revised -> complete

### 6.6 School planning domain
**Purpose**

Provide a credible, professional school list and deadline experience.

**Functional requirements**

The school planner must:

- expose searchable U.S. institution directory
- support typeahead and exact selection
- allow user to add school to list
- store application type
- display structured deadline categories where available
- support notes and status
- show source/verification metadata when useful

**Deadline categories**

Support:

- ED
- EDII
- EA
- EAII
- REA
- RD
- Rolling

**Rule**

School name entry must be dropdown-first.
Manual free text is fallback only.

### 6.7 Parent dashboard domain
**Purpose**

Provide visibility without editing authority.

**Functional requirements**

Supporting adult view must show:

- progress status
- milestone completion
- upcoming deadlines
- current student focus
- billing state if applicable

It must not:

- enable direct writing edits
- allow overwrite of student content

### 6.8 Billing domain
**Purpose**

Manage subscription access.

**Functional requirements**

Billing must support:

- free plan
- paid plan
- upgrade
- downgrade/cancel
- webhook-based payment state sync
- account entitlements

**Rule**

Entitlements are determined server-side, not client-side.

### 6.9 Notification domain
**Purpose**

Send transactional communication and reminders.

**Functional requirements**

The system must send:

- verification email
- welcome email
- parent invite email
- onboarding reminder
- milestone email
- deadline reminder
- billing confirmation

Resend supports code-driven email delivery and integrates with modern app stacks.

## 7. Data architecture
### 7.1 Database standard

Use Supabase Postgres as the system of record. Supabase positions Postgres as the primary database foundation for each project.

### 7.2 Core tables

Minimum tables:

- users
- student_profiles
- supporting_adult_profiles
- student_support_links
- onboarding_sessions
- snapshot_results
- story_entries
- essay_projects
- essay_versions
- essay_feedback
- supplement_projects
- institutions
- institution_deadlines
- student_school_lists
- subscriptions
- notification_events
- audit_events

### 7.3 Required data rules

- no business-critical logic hidden only in client state
- no denormalized duplicate identity state across tables without purpose
- timestamps on all mutable entities
- soft delete for user-generated content where recovery matters
- audit records for role changes, billing changes, and relationship linking

## 8. API and server contract
### 8.1 Endpoint style

Use authenticated Route Handlers under /app/api/... for internal application APIs.

### 8.2 API principles

All endpoints must:

- validate auth
- validate role
- validate ownership
- return typed responses
- return machine-usable error codes
- never trust client-submitted entitlements

### 8.3 Major endpoint groups

Required groups:

- /api/auth/*
- /api/onboarding/*
- /api/snapshot/*
- /api/story-vault/*
- /api/essays/*
- /api/supplements/*
- /api/schools/*
- /api/parent/*
- /api/billing/*
- /api/notifications/*
- /api/admin/*

### 8.4 Job endpoints

Scheduled and background-style operations should use protected handlers for:

- deadline reminders
- stale onboarding reminders
- subscription sync recovery
- analytics rollups

Vercel Cron Jobs invoke Vercel Functions and are configured as scheduled tasks. Availability and scheduling behavior vary by plan.

## 9. AI orchestration spec
### 9.1 AI usage model

AI must be embedded into workflows, not presented as a blank general-purpose chatbot.

### 9.2 AI entry points

Allowed AI tasks:

- onboarding-to-snapshot synthesis
- story clustering and theme extraction
- essay direction recommendation
- outline generation
- draft critique
- supplement angle suggestions
- cross-essay redundancy detection

### 9.3 Output contract

Every AI response exposed to the user must resolve to a structured object with named sections. Required pattern:

- what_is_working
- what_is_weak
- what_is_missing
- next_steps

Optional:

- strongest_themes
- recommended_angles
- overlap_warnings

### 9.4 Guardrails

AI output must:

- preserve student ownership
- avoid fabricated facts
- avoid admissions guarantees
- avoid over-polished generic phrasing
- avoid full autonomous “done for you” tone

### 9.5 Persistence rule

Persist user-visible AI outputs so users can revisit previous guidance without regenerating every time.

## 10. UX system spec
### 10.1 Design goals

The product must feel:

- quiet
- premium
- modern
- warm
- credible
- academically serious
- easy to navigate

### 10.2 Interaction rules

- one dominant action per view
- no cluttered dashboards
- visible completion states
- clear empty states
- explicit loading states
- explicit success and error states
- all long flows resumable

### 10.3 Information architecture rule

Every authenticated page must answer:

- where am I
- what is my current status
- what should I do next

### 10.4 Accessibility rule

All flows must support:

- keyboard navigation
- clear focus states
- semantic headings
- readable contrast
- form validation messaging

## 11. Performance spec
### 11.1 Target behavior

The product must feel instant for navigation and fast for common CRUD actions.

### 11.2 Requirements

- server-render where possible
- minimize client bundle size
- avoid unnecessary client-side state libraries in v1
- paginate large school lists
- debounce school search
- cache safe read operations where appropriate
- avoid blocking page render on non-critical analytics calls

### 11.3 AI latency handling

AI generation must never freeze the UI.
Use explicit “generating” states and asynchronous polling or progressive refresh patterns.

Vercel Functions are positioned for AI and I/O-heavy workloads, which supports using server-side execution for these flows.

## 12. Security spec
### 12.1 Data protection

Mandatory controls:

- Row Level Security on all user-owned tables
- protected server endpoints
- server-side entitlement checks
- secure storage access policies
- email verification before full account access where appropriate

Supabase Storage is integrated with Row Level Security access policies.

### 12.2 Sensitive workflows

Apply extra validation to:

- parent/student linking
- role change attempts
- billing events
- admin access
- reminder jobs
- school/deadline admin edits

### 12.3 Secrets

All provider keys and secrets must be stored in environment configuration only.
No secrets in client bundles.
No secrets in repo.

## 13. School and deadline subsystem spec
### 13.1 Institution master data

The system must maintain a normalized institution directory table.

### 13.2 Search behavior

Institution search must support:

- exact name
- common name
- abbreviation where available
- typeahead
- state filter later if needed

### 13.3 Deadline record model

Each institution can have zero or one current-cycle deadline record per admissions cycle.

Fields must support:

- structured date fields
- source name
- source URL
- verification timestamp
- confidence status

### 13.4 Confidence states

Use:

- verified
- source_partial
- user_added_note
- stale

### 13.5 UX rule

If dates are unavailable, never show fake precision.
Show known structure and source state instead.

## 14. Billing and entitlement spec
### 14.1 Entitlement model

Feature access must be computed from:

- active subscription state
- account ownership
- linked relationship

### 14.2 Required entitlements

Free:

- onboarding
- snapshot
- limited school additions

Paid:

- Story Vault
- essay workspace
- supplements
- school planner
- reminders
- persistent premium progress state

### 14.3 Billing synchronization

Stripe events must update subscription state through verified server-side webhooks.

## 15. Email and reminder spec
### 15.1 Email templates

Required templates:

- account verification
- welcome
- invite accepted
- onboarding reminder
- upgrade confirmation
- milestone reminder
- deadline reminder
- billing receipt/confirmation

### 15.2 Reminder jobs

Schedule jobs for:

- incomplete onboarding
- unviewed snapshot follow-up
- deadline reminders
- inactive paid user re-engagement

Vercel Cron supports scheduled invocation of functions, with plan-based frequency limits.

## 16. Observability and analytics spec
### 16.1 Product analytics

Track:

- landing visit
- CTA click
- signup
- role selected
- onboarding step completion
- onboarding abandonment
- snapshot generated
- snapshot viewed
- upgrade prompt viewed
- checkout started
- checkout completed
- first story created
- first essay started
- first supplement created
- first school added
- parent invited

### 16.2 Error monitoring

Capture:

- failed auth events
- failed snapshot generation
- failed AI calls
- failed billing sync
- failed reminder jobs
- failed school search

### 16.3 Audit events

Persist audit events for:

- role assignment
- student/adult link creation
- subscription state changes
- admin edits to deadlines
- school data overrides

## 17. Repository and codebase standards
### 17.1 Repository structure

Single monorepo-style app structure inside one Next.js project.

Suggested top-level directories:

- app/
- components/
- lib/
- server/
- types/
- emails/
- styles/
- tests/

### 17.2 Code rules

- TypeScript required
- no untyped API responses
- shared schema validation on server boundaries
- domain logic isolated from UI components
- presentational components separated from server actions and data access
- no direct database access from client

### 17.3 Quality rules

- linting mandatory
- formatting mandatory
- branch protection on main
- preview deploy for PRs
- no direct production edits

## 18. Testing spec
### 18.1 Minimum test coverage areas

Must test:

- signup/login/reset
- role routing
- onboarding persistence
- snapshot generation contract
- upgrade gating
- billing webhook handling
- Story Vault CRUD
- school search and select
- parent/student access isolation
- key reminder jobs

### 18.2 Test layers

Use:

- unit tests for domain logic
- integration tests for server handlers and DB logic
- end-to-end tests for core user flows

### 18.3 Release gate

No release if:

- auth flow broken
- role isolation broken
- payment unlock broken
- parent can edit student content
- school selection broken
- snapshot generation broken

## 19. Delivery plan
**Phase 1: foundation**

Build:

- repo setup
- Vercel project
- Supabase project
- auth
- role model
- route guards
- app shell
- analytics foundation

**Phase 2: onboarding and snapshot**

Build:

- student onboarding
- supporting adult onboarding
- autosave
- resumable flows
- snapshot generation pipeline
- snapshot results page
- upgrade prompts

**Phase 3: paid core**

Build:

- billing
- entitlements
- student dashboard
- Story Vault
- personal statement workspace

**Phase 4: school planning and supplements**

Build:

- institution directory
- school list planner
- deadline model
- supplements module
- overlap detection

**Phase 5: parent visibility and operations**

Build:

- parent dashboard
- reminder jobs
- milestone emails
- admin tooling
- audit visibility
- polish and launch hardening

## 20. Launch gate

The system is launchable only when:

- auth is stable
- role access is correct
- onboarding is resumable
- snapshot is reliable
- upgrade gating is correct
- billing unlock is correct
- Story Vault is stable
- essay workspace is stable
- school search works
- deadline model is usable
- supplements work
- parent dashboard is correct
- reminder emails work
- core flows are responsive on mobile and desktop
- no critical privacy or entitlement defects remain

## 21. Non-negotiables

- Do not ship a chatbot disguised as a product.
- Do not let client-side logic determine access control.
- Do not ask users to build their own school spreadsheet.
- Do not let parents edit student writing in v1.
- Do not overbuild infrastructure before the core workflow is excellent.
- Do not compromise clarity for feature volume.

## 22. Final engineering directive

Build The College Admissions Edge as a tightly scoped, premium, AI-native web application with disciplined architecture, strict access control, structured AI workflows, and a school-planning system that feels professional from day one.

The architecture should stay lean, but the user experience must feel expensive.

The next layer after this is the implementation package:

- database schema
- route inventory
- state machines
- component inventory
- sprint tickets
- acceptance tests by module

The chosen stack and architectural assumptions above are aligned with current official platform documentation for Next.js App Router, Vercel Functions and cron configuration, Supabase platform capabilities including Auth, Storage, Postgres and RLS, and Resend’s transactional email tooling.