# ROUTE_INVENTORY_V1

## The College Admissions Edge

## 1. Purpose

This document defines the authoritative route inventory for v1.

It exists to ensure that:

* the application surface is fully enumerated
* page ownership is clear
* route protection is clear
* redirect behavior is clear
* feature gating is clear
* engineering and QA work from the same application map

This document covers:

* public web routes
* authenticated student routes
* authenticated supporting-adult routes
* admin routes
* API route groups
* route guard rules
* redirect rules
* fallback/error behaviors

If any implemented route behavior conflicts with this document, this document wins.

---

## 2. Route protection model

### 2.1 Route classes

All routes fall into one of five classes:

* public
* authenticated
* role-protected
* entitlement-protected
* admin-only

### 2.2 Protection layers

Each protected route must enforce access at:

1. middleware or server entry layer
2. page/server data layer
3. API/data-action layer

UI-only route gating is not sufficient.

### 2.3 Entitlement model

Routes may be accessible but partially blocked by plan.

Example:

* a free student may reach `/app` but not use full premium modules
* a free student may reach `/app/schools` in limited form
* a free student may not use `/app/story-vault` meaningfully

---

## 3. Route resolution rules

### 3.1 Unauthenticated user behavior

If unauthenticated user attempts to access a protected route:

* redirect to `/login`
* preserve intended destination if safe

### 3.2 Authenticated user without role

If authenticated user has not completed role selection:

* redirect to `/role-select`

### 3.3 Student role hitting parent routes

If student attempts to access `/parent/*`:

* redirect to `/app`

### 3.4 Supporting-adult role hitting student routes

If supporting adult attempts to access `/app/*`:

* allow only where explicitly shared via product flow, otherwise redirect to `/parent`

### 3.5 Non-admin hitting admin routes

If non-admin attempts to access `/admin/*`:

* return unauthorized state or redirect to safe dashboard
* do not reveal admin page structure or metadata

### 3.6 Authenticated user with missing entitlement

If user reaches a premium route without paid entitlement:

* show upgrade gate if product allows route entry
* or redirect to upgrade path if hard-gated

---

## 4. Public route inventory

## 4.1 `/`

### Route type

Public

### Purpose

Primary marketing homepage.

### Primary audience

Families, students, supporting adults.

### Required content

* hero
* product promise
* how it works summary
* differentiation
* founder story
* pricing teaser
* CTA to free snapshot

### Auth requirement

None

### Role requirement

None

### Entitlement requirement

None

### Primary actions

* `Get Your Free Edge Snapshot`
* `See How It Works`
* `View Pricing`

### Redirect behavior

None

### Error/fallback behavior

Standard 500/maintenance handling only.

---

## 4.2 `/how-it-works`

### Route type

Public

### Purpose

Explain the product workflow and AI posture.

### Auth requirement

None

### Role requirement

None

### Entitlement requirement

None

### Primary actions

* `Start Free`
* `View Pricing`

### Redirect behavior

None

---

## 4.3 `/pricing`

### Route type

Public

### Purpose

Explain free vs paid plans.

### Auth requirement

None

### Role requirement

None

### Entitlement requirement

None

### Primary actions

* `Start Free`
* `Upgrade / Subscribe`

### Redirect behavior

If authenticated and already paid, CTA may route to dashboard instead of checkout.

---

## 4.4 `/faq`

### Route type

Public

### Purpose

Answer common objections and trust questions.

### Auth requirement

None

### Role requirement

None

### Entitlement requirement

None

---

## 4.5 `/about`

### Route type

Public

### Purpose

Founder story, mission, trust.

### Auth requirement

None

### Role requirement

None

### Entitlement requirement

None

---

## 4.6 `/signup`

### Route type

Public

### Purpose

Create account.

### Auth requirement

None

### Role requirement

None

### Entitlement requirement

None

### Primary actions

* create account

### Redirect behavior

On success:

* if email verification required first, route to `/verify-email`
* otherwise route to `/role-select`

### Error behavior

* validation errors inline
* duplicate email handled explicitly

---

## 4.7 `/login`

### Route type

Public

### Purpose

Authenticate existing user.

### Auth requirement

None

### Role requirement

None

### Entitlement requirement

None

### Redirect behavior

On success:

* if role missing → `/role-select`
* if student → `/app` or saved destination
* if supporting adult → `/parent` or saved destination
* if admin → `/admin`

---

## 4.8 `/verify-email`

### Route type

Partially protected / transitional

### Purpose

Complete email verification flow.

### Auth requirement

Context-dependent

### Role requirement

None

### Entitlement requirement

None

### Redirect behavior

After verification:

* no role → `/role-select`
* role present → destination dashboard

---

## 4.9 `/reset-password`

### Route type

Public / transitional

### Purpose

Password reset completion flow.

### Auth requirement

Token-based

### Redirect behavior

On success → `/login`

---

## 4.10 `/role-select`

### Route type

Authenticated

### Purpose

Assign high-level role.

### Auth requirement

Required

### Role requirement

User exists but role may be unset

### Entitlement requirement

None

### Primary actions

* choose `student`
* choose `supporting_adult`

### Redirect behavior

On completion:

* student → `/app/onboarding`
* supporting adult → `/parent/onboarding` if separate route used, otherwise `/parent`

### Block rule

If role already assigned, optionally redirect to correct dashboard unless explicit role-recovery/admin flow is intended.

---

## 5. Student route inventory

## 5.1 `/app`

### Route type

Authenticated + role-protected

### Purpose

Student dashboard.

### Auth requirement

Required

### Role requirement

`student`

### Entitlement requirement

Free or paid

### Data dependencies

* user profile
* onboarding status
* snapshot state
* subscription state
* progress summary
* school summary

### Primary actions

* continue onboarding
* view snapshot
* upgrade
* enter premium modules if paid

### Redirect behavior

* if onboarding incomplete → `/app/onboarding`
* if onboarding complete and snapshot not ready → `/app/snapshot`

### Free behavior

Dashboard is visible but premium modules gated.

### Error behavior

If required profile missing, route to onboarding recovery.

---

## 5.2 `/app/onboarding`

### Route type

Authenticated + role-protected

### Purpose

Student onboarding flow.

### Auth requirement

Required

### Role requirement

`student`

### Entitlement requirement

Free or paid

### Data dependencies

* onboarding session
* onboarding responses
* student profile

### Primary actions

* save step
* continue
* go back
* complete onboarding

### Redirect behavior

* if onboarding complete and snapshot exists → `/app/snapshot`
* if onboarding complete and snapshot pending → snapshot loading state

### Error behavior

* autosave failure state
* resume state on reload

---

## 5.3 `/app/snapshot`

### Route type

Authenticated + role-protected

### Purpose

Free Edge Snapshot result page.

### Auth requirement

Required

### Role requirement

`student`

### Entitlement requirement

Free or paid

### Data dependencies

* latest snapshot result
* onboarding completion state
* subscription status

### Primary actions

* view snapshot
* upgrade
* return later

### Redirect behavior

* if onboarding incomplete → `/app/onboarding`
* if snapshot not generated yet → loading state
* if paid user and product decides to route to dashboard after first view, allow CTA not forced redirect

### Error behavior

* snapshot generation failed → retry or support state

---

## 5.4 `/app/story-vault`

### Route type

Authenticated + role-protected + entitlement-protected

### Purpose

Premium Story Vault workspace.

### Auth requirement

Required

### Role requirement

`student`

### Entitlement requirement

Paid

### Data dependencies

* entitlement state
* story entries
* story analysis output

### Primary actions

* add story
* edit story
* delete story
* analyze story set

### Redirect/gating behavior

* if free → show upgrade gate or redirect to `/pricing` / upgrade modal flow

### Error behavior

* no entries → empty state
* analysis failure → retry state

---

## 5.5 `/app/personal-statement`

### Route type

Authenticated + role-protected + entitlement-protected

### Purpose

Premium personal statement workspace.

### Auth requirement

Required

### Role requirement

`student`

### Entitlement requirement

Paid

### Data dependencies

* entitlement state
* essay project
* essay versions
* essay feedback
* story references

### Primary actions

* select direction
* generate outline
* edit draft
* request feedback
* review revisions

### Redirect/gating behavior

* if free → upgrade gate

### Error behavior

* no essay project → create-start state
* feedback generation failure → retry state

---

## 5.6 `/app/supplements`

### Route type

Authenticated + role-protected + entitlement-protected

### Purpose

Premium supplement workspace.

### Auth requirement

Required

### Role requirement

`student`

### Entitlement requirement

Paid

### Data dependencies

* entitlement state
* student school list
* supplement projects
* institution data
* overlap warnings

### Primary actions

* create supplement
* edit supplement
* request angle suggestions
* review overlap warnings

### Redirect/gating behavior

* if free → upgrade gate

### Error behavior

* no schools selected → route user to school planner or show empty state

---

## 5.7 `/app/schools`

### Route type

Authenticated + role-protected

### Purpose

School planner.

### Auth requirement

Required

### Role requirement

`student`

### Entitlement requirement

Free limited / paid full

### Data dependencies

* institution search
* deadline records
* student school list
* subscription state

### Primary actions

* search schools
* add school
* edit application type
* view deadlines
* edit notes/status

### Free behavior

* limited number of school adds
* premium planner features gated if required

### Redirect/gating behavior

* if free and limit exceeded → upgrade gate

### Error behavior

* no deadlines available → structured fallback state, not broken view

---

## 5.8 `/app/progress`

### Route type

Authenticated + role-protected

### Purpose

Student progress overview.

### Auth requirement

Required

### Role requirement

`student`

### Entitlement requirement

Free limited / paid fuller detail

### Data dependencies

* onboarding status
* snapshot status
* Story Vault completion summary
* essay status
* supplement status
* school planner summary

### Primary actions

* continue next recommended step

### Redirect behavior

None beyond role/auth checks.

---

## 5.9 `/app/settings`

### Route type

Authenticated + role-protected

### Purpose

Student account settings.

### Auth requirement

Required

### Role requirement

`student`

### Entitlement requirement

Free or paid

### Data dependencies

* user profile
* linked supporting adult info
* notification preferences
* billing visibility if owner

### Primary actions

* update profile
* manage notifications
* view billing portal if owner

---

## 6. Supporting-adult route inventory

## 6.1 `/parent`

### Route type

Authenticated + role-protected + entitlement-protected

### Purpose

Supporting-adult dashboard.

### Auth requirement

Required

### Role requirement

`supporting_adult`

### Entitlement requirement

Paid and linked

### Data dependencies

* support link state
* linked student progress summary
* deadlines summary
* subscription state

### Primary actions

* review progress
* review deadlines
* manage billing if owner

### Redirect behavior

* if not linked → onboarding or invite acceptance flow
* if linked but unpaid → upgrade gate or billing prompt depending on ownership model

### Error behavior

* linked student missing → safe empty state with relink guidance

---

## 6.2 `/parent/progress`

### Route type

Authenticated + role-protected + entitlement-protected

### Purpose

Detailed supporting-adult progress summary.

### Auth requirement

Required

### Role requirement

`supporting_adult`

### Entitlement requirement

Paid and linked

### Data dependencies

* linked student progress aggregates
* milestone status
* current focus area

### Primary actions

* review current phase
* review milestone completion

### Restriction

No raw writing content displayed.

---

## 6.3 `/parent/deadlines`

### Route type

Authenticated + role-protected + entitlement-protected

### Purpose

Supporting-adult deadline view.

### Auth requirement

Required

### Role requirement

`supporting_adult`

### Entitlement requirement

Paid and linked

### Data dependencies

* linked student school list summary
* institution deadlines

### Primary actions

* view upcoming deadlines
* review application statuses

### Restriction

No editing of student school list in v1.

---

## 6.4 `/parent/settings`

### Route type

Authenticated + role-protected

### Purpose

Supporting-adult settings.

### Auth requirement

Required

### Role requirement

`supporting_adult`

### Entitlement requirement

Free or paid

### Data dependencies

* profile
* link status
* billing if owner
* notification preferences

### Primary actions

* update settings
* manage notifications
* billing portal if owner

---

## 6.5 `/parent/onboarding`

### Route type

Authenticated + role-protected

### Purpose

Optional dedicated parent/supporting-adult onboarding route.

### Auth requirement

Required

### Role requirement

`supporting_adult`

### Entitlement requirement

Free or paid

### Data dependencies

* supporting-adult profile
* onboarding session

### Primary actions

* complete supporting-adult onboarding
* invite/link student

### Redirect behavior

* once complete and linked → `/parent`
* once complete but unlinked → linked-empty state or invite flow

---

## 7. Admin route inventory

## 7.1 `/admin`

### Route type

Admin-only

### Purpose

Admin home.

### Auth requirement

Required

### Role requirement

`admin`

### Entitlement requirement

None

### Data dependencies

* system summaries
* key metrics
* admin navigation

---

## 7.2 `/admin/users`

### Route type

Admin-only

### Purpose

View/manage user records.

### Data dependencies

* user profiles
* role state
* subscription state
* link state

---

## 7.3 `/admin/schools`

### Route type

Admin-only

### Purpose

Institution import/review/admin.

### Data dependencies

* institutions
* staging/import metadata if surfaced
* duplicate review views

---

## 7.4 `/admin/deadlines`

### Route type

Admin-only

### Purpose

Deadline import/review/admin.

### Data dependencies

* institution_deadlines
* unmatched staging view
* parse review view

---

## 7.5 `/admin/analytics`

### Route type

Admin-only

### Purpose

Funnel and usage visibility.

### Data dependencies

* analytics events
* subscriptions
* onboarding metrics

---

## 7.6 `/admin/support`

### Route type

Admin-only

### Purpose

Operational support visibility.

### Data dependencies

* audit events
* user/account states
* notification failures

---

## 8. API route inventory

## 8.1 `/api/onboarding/start`

### Method

POST

### Purpose

Start onboarding session.

### Auth requirement

Required

### Allowed roles

* student
* supporting_adult
* admin

### Notes

Creates or resumes session.

---

## 8.2 `/api/onboarding/save-step`

### Method

POST

### Purpose

Persist onboarding step state.

### Auth requirement

Required

### Allowed roles

* student
* supporting_adult
* admin

### Validation

Must verify user owns onboarding session.

---

## 8.3 `/api/onboarding/status`

### Method

GET

### Purpose

Return onboarding status.

### Auth requirement

Required

### Allowed roles

* student
* supporting_adult
* admin

---

## 8.4 `/api/onboarding/complete`

### Method

POST

### Purpose

Mark onboarding complete and trigger next-state behavior.

### Auth requirement

Required

### Allowed roles

* student
* supporting_adult
* admin

---

## 8.5 `/api/snapshot/generate`

### Method

POST

### Purpose

Generate Edge Snapshot.

### Auth requirement

Required

### Allowed roles

* student
* admin

### Entitlement

Free or paid

### Validation

Student owner only unless admin.

---

## 8.6 `/api/snapshot/current`

### Method

GET

### Purpose

Fetch latest snapshot.

### Auth requirement

Required

### Allowed roles

* student
* admin

---

## 8.7 `/api/snapshot/mark-viewed`

### Method

POST

### Purpose

Record snapshot viewed state.

### Auth requirement

Required

### Allowed roles

* student
* admin

---

## 8.8 `/api/story-vault`

### Methods

GET, POST

### Purpose

List/create story entries.

### Auth requirement

Required

### Allowed roles

* student
* admin

### Entitlement

Paid

---

## 8.9 `/api/story-vault/:id`

### Methods

PATCH, DELETE

### Purpose

Update/delete story entry.

### Auth requirement

Required

### Allowed roles

* student owner
* admin

### Entitlement

Paid

---

## 8.10 `/api/story-vault/analyze`

### Method

POST

### Purpose

Analyze story set.

### Auth requirement

Required

### Allowed roles

* student owner
* admin

### Entitlement

Paid

---

## 8.11 `/api/essays/current`

### Method

GET

### Purpose

Fetch current essay project.

### Auth requirement

Required

### Allowed roles

* student owner
* admin

### Entitlement

Paid

---

## 8.12 `/api/essays/create`

### Method

POST

### Purpose

Create essay project.

### Auth requirement

Required

### Allowed roles

* student owner
* admin

### Entitlement

Paid

---

## 8.13 `/api/essays/:id`

### Method

PATCH

### Purpose

Update essay project.

### Auth requirement

Required

### Allowed roles

* student owner
* admin

### Entitlement

Paid

---

## 8.14 `/api/essays/:id/generate-outline`

### Method

POST

### Purpose

Generate or refresh outline.

### Auth requirement

Required

### Allowed roles

* student owner
* admin

### Entitlement

Paid

---

## 8.15 `/api/essays/:id/request-feedback`

### Method

POST

### Purpose

Generate structured essay feedback.

### Auth requirement

Required

### Allowed roles

* student owner
* admin

### Entitlement

Paid

---

## 8.16 `/api/essays/:id/versions`

### Method

GET

### Purpose

Fetch version history.

### Auth requirement

Required

### Allowed roles

* student owner
* admin

### Entitlement

Paid

---

## 8.17 `/api/supplements`

### Methods

GET, POST

### Purpose

List/create supplement projects.

### Auth requirement

Required

### Allowed roles

* student owner
* admin

### Entitlement

Paid

---

## 8.18 `/api/supplements/:id`

### Method

PATCH

### Purpose

Update supplement project.

### Auth requirement

Required

### Allowed roles

* student owner
* admin

### Entitlement

Paid

---

## 8.19 `/api/supplements/:id/suggest-angles`

### Method

POST

### Purpose

Generate supplement angle suggestions.

### Auth requirement

Required

### Allowed roles

* student owner
* admin

### Entitlement

Paid

---

## 8.20 `/api/supplements/:id/check-overlap`

### Method

POST

### Purpose

Check supplement overlap against other content.

### Auth requirement

Required

### Allowed roles

* student owner
* admin

### Entitlement

Paid

---

## 8.21 `/api/schools/search`

### Method

GET

### Purpose

Institution typeahead/search.

### Auth requirement

Required

### Allowed roles

* student
* supporting_adult
* admin

### Entitlement

Free or paid

---

## 8.22 `/api/schools/:id`

### Method

GET

### Purpose

Fetch institution detail and deadlines.

### Auth requirement

Required

### Allowed roles

* student
* supporting_adult
* admin

---

## 8.23 `/api/schools/student-list`

### Method

POST

### Purpose

Add school to student list.

### Auth requirement

Required

### Allowed roles

* student owner
* admin

### Entitlement

Free limited / paid full

---

## 8.24 `/api/schools/student-list/:id`

### Methods

PATCH, DELETE

### Purpose

Update/delete school selection.

### Auth requirement

Required

### Allowed roles

* student owner
* admin

### Entitlement

Free limited / paid full

---

## 8.25 `/api/parent/invite`

### Method

POST

### Purpose

Send supporting-adult invite.

### Auth requirement

Required

### Allowed roles

* student
* supporting_adult
* admin

### Notes

Caller must be part of resulting relationship.

---

## 8.26 `/api/parent/link`

### Method

POST

### Purpose

Create/confirm student-supporting-adult link.

### Auth requirement

Required

### Allowed roles

* student
* supporting_adult
* admin

---

## 8.27 `/api/parent/progress`

### Method

GET

### Purpose

Fetch linked student progress summary.

### Auth requirement

Required

### Allowed roles

* supporting_adult linked
* admin

### Entitlement

Paid

---

## 8.28 `/api/parent/deadlines`

### Method

GET

### Purpose

Fetch linked student deadline summary.

### Auth requirement

Required

### Allowed roles

* supporting_adult linked
* admin

### Entitlement

Paid

---

## 8.29 `/api/billing/create-checkout-session`

### Method

POST

### Purpose

Create checkout session.

### Auth requirement

Required

### Allowed roles

* student
* supporting_adult
* admin/test

---

## 8.30 `/api/billing/create-portal-session`

### Method

POST

### Purpose

Create billing portal session.

### Auth requirement

Required

### Allowed roles

* billing owner
* admin

---

## 8.31 `/api/billing/webhook`

### Method

POST

### Purpose

Receive provider events.

### Auth requirement

Provider-signed, not user session based

### Allowed caller

Billing provider only

---

## 8.32 `/api/billing/status`

### Method

GET

### Purpose

Fetch current entitlement/billing state.

### Auth requirement

Required

### Allowed roles

* account owner
* admin

---

## 8.33 `/api/notifications/send-test`

### Method

POST

### Purpose

Internal or local testing helper.

### Auth requirement

Required

### Allowed roles

* admin

---

## 8.34 `/api/notifications/reminder-job`

### Method

POST

### Purpose

Scheduled onboarding/reminder job.

### Auth requirement

System/admin only

### Allowed caller

cron/system/admin

---

## 8.35 `/api/notifications/deadline-job`

### Method

POST

### Purpose

Scheduled deadline reminder job.

### Auth requirement

System/admin only

### Allowed caller

cron/system/admin

---

## 8.36 `/api/admin/users`

### Method

GET

### Purpose

Admin user list/inspection.

### Auth requirement

Required

### Allowed roles

* admin

---

## 8.37 `/api/admin/analytics`

### Method

GET

### Purpose

Admin analytics visibility.

### Auth requirement

Required

### Allowed roles

* admin

---

## 8.38 `/api/admin/institutions/import`

### Method

POST

### Purpose

Institution import/admin action.

### Auth requirement

Required

### Allowed roles

* admin

---

## 8.39 `/api/admin/deadlines/:id`

### Method

PATCH

### Purpose

Admin deadline override/update.

### Auth requirement

Required

### Allowed roles

* admin

---

## 9. Middleware routing rules

Middleware should handle at minimum:

* auth-required route detection
* redirect unauthenticated users away from protected routes
* role mismatch redirects
* admin-only route rejection

Middleware should **not** be the only enforcement layer for premium access or data ownership.

---

## 10. Error and fallback route behavior

### 10.1 401 / unauthenticated

Behavior:

* redirect to login for page routes
* return structured unauthorized response for APIs

### 10.2 403 / authenticated but forbidden

Behavior:

* show safe unauthorized state or redirect to correct dashboard
* do not leak hidden resource metadata

### 10.3 404 / missing page or resource

Behavior:

* standard 404 page for UI
* structured not-found response for APIs

### 10.4 premium gate state

Behavior:

* show upgrade modal/page or redirect to pricing/checkout path
* maintain intended destination when appropriate

### 10.5 loading and async generation states

Required for:

* snapshot generation
* essay feedback generation
* supplement angle generation
* school search if delayed

---

## 11. Redirect matrix summary

| User State                   | Requested Route | Result                                  |
| ---------------------------- | --------------- | --------------------------------------- |
| Unauthenticated              | Protected route | `/login`                                |
| Authenticated, no role       | Protected route | `/role-select`                          |
| Student                      | `/parent/*`     | `/app`                                  |
| Supporting adult             | `/app/*`        | `/parent` unless explicitly allowed     |
| Non-admin                    | `/admin/*`      | unauthorized or safe dashboard redirect |
| Free student                 | premium route   | upgrade gate or redirect                |
| Linked paid supporting adult | `/parent/*`     | allowed                                 |
| Unlinked supporting adult    | `/parent/*`     | onboarding/link state                   |

---

## 12. QA route test priorities

QA must verify:

* every public route renders correctly
* protected routes redirect correctly when unauthenticated
* role mismatch redirects work correctly
* admin routes are inaccessible to non-admin roles
* premium route gating works for free accounts
* intended destination preservation works correctly after login when safe
* student cannot navigate into supporting-adult surface
* supporting adult cannot navigate into student premium writing surface
* API routes mirror page protection rules

---

## 13. Non-negotiables

1. No protected route may rely only on frontend hiding.
2. No premium route may expose premium data before entitlement check.
3. No supporting-adult route may expose raw student writing content in v1.
4. No admin route may be partially accessible to non-admin users.
5. Route behavior, API behavior, and RLS must remain aligned.

---

## 14. Recommended next artifacts

Create next:

* `COMPONENT_INVENTORY_V1.md`
* `SPRINT_01_TICKETS.md`
* `SPRINT_02_TICKETS.md`
* `QA_ROUTE_TEST_MATRIX_V1.md`
* `API_CONTRACTS_V1.md`