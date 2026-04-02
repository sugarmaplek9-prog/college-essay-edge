# SPRINT_08_TICKETS

## The College Admissions Edge

## Sprint 08 — Admin Operations Refinement, Institution/Deadline Tooling, Analytics Dashboards, Audit Visibility, Support Diagnostics, Launch Hardening

## 1. Sprint objective

Sprint 08 delivers the operational and launch-readiness layer for v1.

At the end of this sprint, the application must support:

* refined admin operations surfaces
* institution and deadline admin tooling improvements
* analytics dashboard refinement
* audit event visibility for support and review
* support diagnostics for common production issues
* launch hardening and production release preparation
* final QA, defect triage, and release checklist execution

This sprint creates the first credible operator-side loop:
**data issue appears → admin/support can inspect it → diagnose it → correct it safely → verify product health before and after launch**

This sprint does **not** attempt to complete:

* new end-user product modules
* major redesigns of already-built workflows
* advanced CRM/campaign tooling
* additional vertical expansions beyond core college admissions v1

The output of Sprint 08 is a supportable, operable, launch-ready v1 product.

---

## 2. Sprint success criteria

Sprint 08 is successful only if all of the following are true:

* admin routes expose actionable operational information
* institution and deadline admin workflows are usable and safe
* analytics dashboards surface core funnel and usage metrics clearly
* audit events are visible for key product and billing actions
* support diagnostics exist for common user/account issues
* launch checklist is complete
* critical defects are triaged and closed or explicitly deferred
* release readiness is documented

---

## 3. Sprint scope

### Included

* admin UI refinement
* institution admin improvements
* deadline admin improvements
* analytics dashboard refinement
* audit event visibility
* support diagnostics views
* launch checklist creation and execution
* production hardening
* final QA / defect management process

### Excluded

* new major product modules
* mobile apps
* multi-tenant school/counselor product expansion
* non-v1 commercialization experiments

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

# 5. Sprint 08 tickets

## T8-001 — Refine admin overview dashboard

### Purpose

Turn `/admin` into a meaningful operational home rather than a placeholder.

### Implementation notes

Add summary surfaces for:

* total users
* active paid users
* onboarding funnel summary
* snapshot generation health
* Story Vault/personal statement/supplement usage summaries
* reminder/job health summary
* recent failures or alerts

### Dependencies

Prior analytics and admin route foundations

### Acceptance criteria

* admin overview shows useful system-health information
* admin can understand current product state within one page

---

## T8-002 — Refine admin users view

### Purpose

Give operations a usable user/account inspection surface.

### Implementation notes

Enhance `/admin/users` to include:

* user identity summary
* role
* subscription state
* onboarding status
* linked-account status
* recent activity summary where appropriate
* safe filtering/search

### Dependencies

user/profile/subscription foundations, admin route foundation

### Acceptance criteria

* admin can find and inspect users efficiently
* user/account summary is sufficient for basic support triage

---

## T8-003 — Refine institution admin tooling

### Purpose

Make institution data management supportable.

### Implementation notes

Enhance `/admin/schools` to support:

* institution search/filter
* visibility into imported records
* duplicate review workflow or flags
* common App member flag visibility
* source metadata visibility
* safe update path for institution record corrections

### Dependencies

institution seed/import foundation, admin route foundation

### Acceptance criteria

* admin can review and correct institution metadata safely
* duplicate or bad records are easier to identify

---

## T8-004 — Refine deadline admin tooling

### Purpose

Make deadline data management operationally usable.

### Implementation notes

Enhance `/admin/deadlines` to support:

* deadline search/filter by school/cycle/confidence state
* visibility into source metadata
* visibility into verified/stale/source_partial states
* safe correction/update flow
* unmatched staging or parse review visibility if useful in admin UX

### Dependencies

deadline seed/import foundation, admin route foundation

### Acceptance criteria

* admin can inspect and update deadline data safely
* stale/partial data is clearly visible

---

## T8-005 — Implement analytics dashboard refinement

### Purpose

Expose the core business and product funnel clearly.

### Implementation notes

Enhance `/admin/analytics` to show at minimum:

* landing → signup funnel
* signup → onboarding completion funnel
* onboarding → snapshot view funnel
* snapshot → upgrade funnel
* checkout → paid activation funnel
* usage for Story Vault, personal statement, supplements
* supporting-adult link funnel
* reminder/re-engagement funnel

### Dependencies

analytics events from prior sprints

### Acceptance criteria

* analytics dashboard shows core funnel metrics clearly
* operator can identify obvious drop-off points

---

## T8-006 — Implement audit event visibility surface

### Purpose

Allow operators to inspect sensitive account and system changes.

### Implementation notes

Build or refine audit visibility under `/admin/support` and/or dedicated audit view for:

* role assignment/change
* support link creation/removal
* subscription updates/cancellations
* institution/deadline admin changes
* major admin actions

### Dependencies

audit events foundation from schema and prior system usage

### Acceptance criteria

* admin can inspect audit trail for key actions
* audit surface is readable and filterable enough for support use

---

## T8-007 — Implement support diagnostics panel

### Purpose

Give operations a direct way to diagnose common account issues.

### Implementation notes

Build support diagnostics that can surface at minimum:

* auth/role state issues
* onboarding state mismatches
* missing snapshot state
* subscription/entitlement mismatch
* missing support link
* notification failures for user

### Dependencies

admin users view, audit events, notification events, billing state

### Acceptance criteria

* admin/support can diagnose common issues without direct database inspection
* panel improves support triage speed materially

---

## T8-008 — Implement institution/deadline correction safeguards

### Purpose

Prevent admin tooling from creating silent data corruption.

### Implementation notes

Add guardrails for admin edits:

* field validation
* confirmation flows for destructive or high-impact edits
* audit event creation on admin changes
* updated verification/confidence handling after manual change

### Dependencies

T8-003, T8-004, T8-006

### Acceptance criteria

* admin edits to institution/deadline data are validated and auditable
* risky changes require explicit confirmation where appropriate

---

## T8-009 — Implement admin import status visibility

### Purpose

Make seed/import pipelines operationally observable.

### Implementation notes

Add admin visibility for:

* latest institution import batch
* latest deadline import batch
* unmatched deadline staging counts
* duplicate review counts if available
* stale deadline counts

### Dependencies

seed/import artifacts and admin routes

### Acceptance criteria

* admin can assess import health and freshness at a glance

---

## T8-010 — Refine operational error surfaces in admin/support routes

### Purpose

Make failures actionable rather than hidden in logs.

### Implementation notes

Ensure admin surfaces clearly display:

* failed notification events
* failed snapshot generations if tracked
* failed billing sync events if surfaced
* failed or incomplete import states where relevant

### Dependencies

prior observability and admin work

### Acceptance criteria

* operational failures are visible in UI
* admin can identify top categories of failure without reading raw logs

---

## T8-011 — Implement release configuration review and environment audit

### Purpose

Ensure production environments are correctly configured before launch.

### Implementation notes

Review and verify:

* all required env vars present in production
* no placeholder keys remain
* webhook URLs configured correctly
* auth callback URLs correct
* app URL values correct
* cron/scheduled job config correct
* preview/production separation intact

### Dependencies

all prior deployment/provider setup

### Acceptance criteria

* environment audit checklist is completed
* production configuration issues are resolved or documented

---

## T8-012 — Create launch checklist document and release procedure

### Purpose

Standardize launch execution.

### Implementation notes

Create a formal launch checklist covering:

* environment review
* database migration review
* billing/provider verification
* notification verification
* route smoke testing
* analytics verification
* support/admin verification
* rollback considerations

### Dependencies

T8-011 and broad product readiness

### Acceptance criteria

* launch checklist exists and is actionable
* release procedure is documented clearly enough for team use

---

## T8-013 — Conduct route and permissions final review pass

### Purpose

Verify that route protection and authorization remain consistent after all modules are added.

### Implementation notes

Review against:

* permissions matrix
* route inventory
* RLS rules
* billing/entitlement behavior
* supporting-adult visibility boundaries
* admin route restrictions

### Dependencies

all prior product routes and permissions work

### Acceptance criteria

* no route/permission drift remains unresolved
* findings are documented and fixed or explicitly deferred

---

## T8-014 — Conduct analytics and event taxonomy cleanup pass

### Purpose

Eliminate naming drift and instrumentation inconsistency before launch.

### Implementation notes

Review all emitted events and standardize:

* naming
* payload structure
* timing
* duplicate events
* missing key funnel steps

### Dependencies

analytics work from prior sprints

### Acceptance criteria

* analytics event taxonomy is internally consistent
* key funnels are fully covered

---

## T8-015 — Conduct notification and email final QA pass

### Purpose

Ensure production messaging quality before launch.

### Implementation notes

Review:

* subject lines
* links/CTAs
* template rendering
* mobile readability
* supporting-adult boundaries
* no raw writing leakage
* no accidental duplicate reminder behavior

### Dependencies

Sprint 07 notification infrastructure

### Acceptance criteria

* notification/email surfaces are launch-ready
* major messaging defects are resolved

---

## T8-016 — Conduct billing and entitlement final QA pass

### Purpose

Ensure revenue and access controls are stable before launch.

### Implementation notes

Review:

* checkout flows
* cancel flows
* post-payment unlocks
* billing portal access
* owner vs non-owner behavior
* canceled/past_due states
* free/premium gating consistency

### Dependencies

Sprint 03 billing system and later integrations

### Acceptance criteria

* billing and entitlements are stable enough for launch
* access leakage or lockout defects are resolved

---

## T8-017 — Conduct data quality review for institution/deadline baseline

### Purpose

Ensure the school/deadline foundation is good enough for launch trust.

### Implementation notes

Review:

* institution count and coverage
* obvious duplicate schools
* stale deadlines count
* verified vs partial breakdown
* high-priority school data accuracy spot checks

### Dependencies

institution and deadline seed/import foundation

### Acceptance criteria

* launch data quality review completed
* key data issues are corrected or clearly documented

---

## T8-018 — Implement support runbook for common incidents

### Purpose

Make post-launch support faster and less ad hoc.

### Implementation notes

Create support runbook entries for common issues such as:

* cannot log in
* role mismatch
* onboarding stuck
* snapshot missing
* payment completed but premium still locked
* parent cannot link
* deadlines missing
* reminders not received

### Dependencies

support diagnostics and admin visibility work

### Acceptance criteria

* support runbook exists for key incident types
* support steps align with available admin tooling

---

## T8-019 — Add integration tests for admin institution/deadline update safeguards

### Purpose

Protect high-risk operator-side data updates.

### Implementation notes

Add tests for:

* admin-only update access
* invalid field rejection
* audit event creation on edit
* confidence/verification handling after update

### Dependencies

T8-003, T8-004, T8-008

### Acceptance criteria

* institution/deadline admin edit protections are integration-tested

---

## T8-020 — Add integration tests for support diagnostics visibility

### Purpose

Protect support tooling assumptions.

### Implementation notes

Add tests for:

* support diagnostics can surface account issues correctly
* admin can view diagnostic information
* non-admin cannot access diagnostics data

### Dependencies

T8-007

### Acceptance criteria

* support diagnostics are integration-tested
* authorization boundaries are covered

---

## T8-021 — Add end-to-end test for core launch smoke flow

### Purpose

Create a release-blocking smoke test for the core user journey.

### Implementation notes

Build E2E path for:

* signup/login
* onboarding
* snapshot
* upgrade
* Story Vault or essay entry path
* supporting-adult link/dashboard view if feasible in one scenario

### Dependencies

core user product flows complete

### Acceptance criteria

* core launch smoke path passes in automated environment
* release team has a high-confidence smoke test

---

## T8-022 — Add end-to-end test for admin operational flow

### Purpose

Verify the admin/operator surface is usable in practice.

### Implementation notes

Create E2E test for:

* admin login
* view admin overview
* inspect user
* inspect deadlines/institution admin surface
* inspect analytics/support view

### Dependencies

admin refinement work complete

### Acceptance criteria

* admin operational flow is test-covered end to end

---

## T8-023 — Create production release candidate checklist and signoff matrix

### Purpose

Make final release decision explicit and accountable.

### Implementation notes

Create signoff matrix for:

* product
* engineering
* QA
* ops/support

Include:

* must-pass criteria
* deferred issue log
* owner for each signoff area

### Dependencies

T8-012 and final QA passes

### Acceptance criteria

* release candidate checklist and signoff matrix exist
* launch readiness can be evaluated formally

---

## T8-024 — Triage and resolve launch-blocking defects

### Purpose

Use final sprint bandwidth to close the issues that matter most.

### Implementation notes

* maintain launch-blocker list
* prioritize auth, billing, permissions, data quality, reminder, and core workflow issues
* explicitly defer non-blockers with documentation where needed

### Dependencies

all prior QA and observability work

### Acceptance criteria

* launch blockers are resolved or explicitly accepted with owner signoff
* defect status is visible and current

---

## T8-025 — Sprint 08 QA and release hardening pass

### Purpose

Finalize the product for release.

### Implementation notes

Validate:

* admin views are usable
* support diagnostics are useful
* analytics dashboards are coherent
* audit visibility is sufficient
* institution/deadline data quality is acceptable
* launch checklist is complete
* smoke tests pass
* no unresolved critical defects remain

### Dependencies

All prior Sprint 08 tickets

### Acceptance criteria

* no critical launch-readiness defects remain
* release readiness is documented and supportable
* team can make a go/no-go decision with confidence

---

# 6. Recommended implementation order inside sprint

## Wave 1

* T8-001
* T8-002
* T8-003
* T8-004
* T8-005
* T8-006
* T8-007

## Wave 2

* T8-008
* T8-009
* T8-010
* T8-011
* T8-012
* T8-018

## Wave 3

* T8-013
* T8-014
* T8-015
* T8-016
* T8-017

## Wave 4

* T8-019
* T8-020
* T8-021
* T8-022
* T8-023
* T8-024
* T8-025

---

# 7. Sprint 08 deliverable checklist

At sprint close, confirm all of the following:

* [ ] admin overview refined
* [ ] admin users view refined
* [ ] institution admin tooling refined
* [ ] deadline admin tooling refined
* [ ] analytics dashboard refined
* [ ] audit event visibility implemented
* [ ] support diagnostics implemented
* [ ] admin edit safeguards implemented
* [ ] import status visibility implemented
* [ ] operational error surfaces visible
* [ ] production environment audit completed
* [ ] launch checklist created
* [ ] route/permission final review completed
* [ ] analytics taxonomy cleanup completed
* [ ] notification/email final QA completed
* [ ] billing/entitlement final QA completed
* [ ] institution/deadline data quality review completed
* [ ] support runbook created
* [ ] integration tests cover admin data safeguards
* [ ] integration tests cover support diagnostics
* [ ] E2E covers core launch smoke flow
* [ ] E2E covers admin operational flow
* [ ] release candidate checklist/signoff matrix created
* [ ] launch blockers triaged/resolved

---

# 8. Non-negotiables for Sprint 08

1. Do not launch without admin/support visibility into critical failures.
2. Do not launch if permissions, billing, or reminder flows still have unresolved critical defects.
3. Do not allow institution/deadline admin edits without auditability.
4. Do not rely on memory or ad hoc process for release execution; use a formal checklist.
5. Do not ship without a go/no-go decision backed by explicit signoff.

---

# 9. Recommended next artifact

Create next:
**RELEASE_CHECKLIST_V1.md**

That should include:

* pre-release checks
* migration checks
* provider checks
* smoke tests
* rollback considerations
* launch-day monitoring plan
* go/no-go signoff table