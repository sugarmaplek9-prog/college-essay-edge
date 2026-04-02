# SPRINT_06_TICKETS

## The College Admissions Edge

## Sprint 06 — Supporting-Adult Dashboard, Linked Student Progress Summaries, Deadline Summaries, Billing Visibility, Invite/Link Hardening

## 1. Sprint objective

Sprint 06 delivers the supporting-adult experience for v1.

At the end of this sprint, the application must support:

* supporting-adult dashboard access for linked, entitled users
* linked student progress summaries
* linked student deadline summaries
* billing visibility refinement for billing owners
* invite and link acceptance flow hardening
* supporting-adult settings and notification preferences
* parent/supporting-adult UX polish consistent with the rest of the product

This sprint creates the first complete buyer-side visibility loop:
**student uses product 1 supporting adult links successfully 1 supporting adult sees progress, deadlines, and status without editing the student's writing**

This sprint does **not** attempt to complete:

* advanced reminder cron systems
* counselor collaboration tools
* admin support tooling expansion
* scholarship, transfer, or graduate workflows
* human review or commenting systems

The output of Sprint 06 is a credible, polished supporting-adult experience aligned with the product's student-first model.

---

## 2. Sprint success criteria

Sprint 06 is successful only if all of the following are true:

* linked, entitled supporting adults can enter `/parent`
* supporting adults can see student progress summaries without seeing raw writing content
* supporting adults can see linked deadline summaries
* invite and link acceptance flows work cleanly and securely
* billing visibility is correct for owners and restricted for non-owners
* unlinked supporting adults see safe empty/linking states
* supporting-adult route protection works correctly
* supporting-adult workflow is test-covered end to end

---

## 3. Sprint scope

### Included

* supporting-adult dashboard route implementation
* supporting-adult progress page implementation
* supporting-adult deadlines page implementation
* linked student summary aggregation services
* deadline summary aggregation services
* invite/link acceptance flow hardening
* billing visibility refinement for supporting-adult surface
* supporting-adult settings improvements
* analytics for supporting-adult usage and linking funnel

### Excluded

* raw student writing visibility
* editing student writing
* editing student school list
* advanced reminder jobs
* counselor-specific permissions beyond existing supporting-adult role
* admin case management expansion

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

# 5. Sprint 06 tickets

## T6-001 — Implement supporting-adult dashboard route shell and entitlement gating

### Purpose

Establish the route entry point and shell for the supporting-adult surface.

### Implementation notes

* implement `/parent`
* use `ParentAppLayout`
* apply `RouteGuardShell`
* enforce supporting-adult role
* enforce paid and linked access requirements for full dashboard use
* support unlinked and/or non-entitled states with appropriate fallback UI

### Dependencies

Sprint 03 entitlement system, Sprint 01 route protection foundation

### Acceptance criteria

* supporting adult can reach `/parent`
* unlinked supporting adult sees safe linking/empty state
* non-entitled supporting adult sees clean upgrade/billing state where applicable
* student user cannot access parent route

---

## T6-002 — Implement supporting-adult access resolver service

### Purpose

Centralize logic for linked-student visibility and supporting-adult eligibility.

### Implementation notes

Build service methods for:

* get linked student ids for supporting adult
* validate supporting adult linkage state
* validate whether supporting adult may access summary surfaces
* resolve billing owner relationship
* resolve parent dashboard eligibility

### Dependencies

Sprint 01 profile/link schema, Sprint 03 entitlement system

### Acceptance criteria

* supporting-adult visibility logic is centralized
* page and API handlers do not duplicate linking/eligibility logic

---

## T6-003 — Harden invite and link acceptance service flow

### Purpose

Make parent/supporting-adult linking deterministic and secure.

### Implementation notes

Build or refine service behavior for:

* invite creation
* invite acceptance
* student/supporting-adult link creation
* duplicate link prevention
* invalid invite handling
* relink/retry safe behavior

### Dependencies

existing invite intent persistence from Sprint 02, link schema from Sprint 01

### Acceptance criteria

* valid invite acceptance creates correct link
* duplicate links are prevented
* invalid or expired invite states are handled safely

---

## T6-004 — Implement supporting-adult invite/link endpoints hardening

### Purpose

Expose stable invite and linking behavior through protected APIs.

### Implementation notes

Refine or complete:

* `POST /api/parent/invite`
* `POST /api/parent/link`

Requirements:

* authenticated only
* participant must be part of relationship
* no arbitrary linking between unrelated users
* create audit event on successful link creation

### Dependencies

T6-003

### Acceptance criteria

* invite/link endpoints behave deterministically
* unauthorized link attempts are denied
* successful links create correct DB records and audit events

---

## T6-005 — Implement linked student progress aggregation service

### Purpose

Provide supporting-adult dashboard with summary-only student progress data.

### Implementation notes

Build service that aggregates:

* onboarding completion state
* snapshot completion state
* Story Vault completion count/summary
* personal statement status
* supplements status
* school planning summary
* current recommended next step

Important:

* do not expose raw story bodies
* do not expose raw essay/supplement draft content

### Dependencies

Sprint 02 onboarding/snapshot, Sprint 03 Story Vault, Sprint 04 personal statement, Sprint 05 supplements

### Acceptance criteria

* service returns summary-only progress data
* no raw writing content is exposed through this aggregation

---

## T6-006 — Implement supporting-adult progress endpoint

### Purpose

Expose linked student progress summary through API.

### Implementation notes

Implement/refine:

* `GET /api/parent/progress`

Requirements:

* authenticated supporting adult or admin only
* explicit link required unless admin
* paid entitlement required per product rules
* return summary-only payload

### Dependencies

T6-002, T6-005

### Acceptance criteria

* linked, entitled supporting adult can fetch progress summary
* unlinked or unauthorized users cannot fetch another student's progress
* raw writing content is not included in response

---

## T6-007 — Build supporting-adult dashboard UI

### Purpose

Deliver the main supporting-adult summary experience.

### Implementation notes

Build and integrate:

* `ParentDashboardHeader`
* `ParentProgressSummaryCard`
* `ParentDeadlinesCard`
* `ParentCurrentFocusCard`
* `ParentMilestonesCard`
* `ParentBillingSummaryCard`
* `ParentLinkedStudentEmptyState`

### Dependencies

T6-006, component inventory foundation

### Acceptance criteria

* linked, entitled supporting adult sees useful summary dashboard
* unlinked state is clear and non-broken
* dashboard does not expose raw writing content

---

## T6-008 — Implement linked deadline summary aggregation service

### Purpose

Provide deadline visibility to supporting-adult users.

### Implementation notes

Build service that aggregates:

* selected schools for linked student
* upcoming deadlines by date
* application type
* current school status
* structured deadline categories where available

### Dependencies

school list and deadlines foundation from earlier sprints

### Acceptance criteria

* service returns linked student deadline summary in consistent structure
* missing deadlines are handled gracefully

---

## T6-009 — Implement supporting-adult deadlines endpoint

### Purpose

Expose linked student deadlines through API.

### Implementation notes

Implement/refine:

* `GET /api/parent/deadlines`

Requirements:

* authenticated supporting adult or admin only
* explicit link required unless admin
* paid entitlement required per product rules

### Dependencies

T6-002, T6-008

### Acceptance criteria

* linked, entitled supporting adult can fetch deadline summary
* unlinked or unauthorized users cannot fetch another student's deadlines

---

## T6-010 — Build supporting-adult deadlines page UI

### Purpose

Deliver a dedicated deadline view for supporting adults.

### Implementation notes

Implement `/parent/deadlines` with:

* `ParentAppLayout`
* supporting-adult-adapted deadline list or grouped cards
* upcoming deadline emphasis
* school/application type/status visibility

### Dependencies

T6-009

### Acceptance criteria

* supporting adult can review linked student deadlines clearly
* page is summary-focused and not cluttered

---

## T6-011 — Build supporting-adult progress page UI

### Purpose

Deliver more detailed progress visibility beyond the dashboard home.

### Implementation notes

Implement `/parent/progress` with:

* module completion summary
* milestone breakdown
* current focus area
* next recommended student step

### Dependencies

T6-006

### Acceptance criteria

* supporting adult can review progress in more detail than dashboard summary
* page remains summary-based and non-invasive

---

## T6-012 — Refine supporting-adult billing visibility rules in UI

### Purpose

Ensure billing access is correct and not overexposed.

### Implementation notes

* show billing summary only when appropriate
* show billing portal access only for billing owner
* linked non-owner supporting adult should not receive billing portal controls
* support admin visibility separately

### Dependencies

Sprint 03 billing system, T6-002

### Acceptance criteria

* billing owner can access billing controls
* non-owner supporting adult cannot access billing controls incorrectly
* UI state matches permissions matrix

---

## T6-013 — Implement supporting-adult settings improvements

### Purpose

Make supporting-adult account management production-ready.

### Implementation notes

Refine `/parent/settings` with:

* profile settings
* notification preferences
* linked student summary
* billing panel if owner
* security panel

### Dependencies

settings foundation from earlier sprints

### Acceptance criteria

* supporting-adult settings route is usable and coherent
* linked-account information is visible where appropriate

---

## T6-014 — Implement supporting-adult notification preference handling

### Purpose

Allow buyer-side communication preferences to be user-controlled.

### Implementation notes

Support preference fields for:

* progress updates
* milestone notifications
* deadline-related notifications when system supports them
* general product emails if applicable

### Dependencies

existing notification settings foundation

### Acceptance criteria

* supporting adult can view/update notification preferences
* preference changes persist correctly

---

## T6-015 — Implement linked-student empty and multi-state UX

### Purpose

Handle real-world supporting-adult states cleanly.

### Implementation notes

Support at minimum these parent states:

* linked + entitled
* linked + not entitled
* onboarding complete but not linked
* invite sent / awaiting acceptance
* invalid invite / failed link

### Dependencies

T6-003, T6-007, T6-010, T6-011

### Acceptance criteria

* each major supporting-adult state has explicit UI
* user is never left in ambiguous or broken state

---

## T6-016 — Integrate supporting-adult summary state into shared analytics

### Purpose

Track whether buyer-side product usage is actually happening.

### Implementation notes

Add events for:

* parent_dashboard_viewed
* parent_progress_viewed
* parent_deadlines_viewed
* parent_link_started
* parent_link_completed
* parent_billing_portal_opened
* parent_settings_updated

### Dependencies

T6-007 through T6-014

### Acceptance criteria

* supporting-adult usage funnel is measurable
* link-conversion funnel is measurable

---

## T6-017 — Implement supporting-adult empty/loading/error states

### Purpose

Ensure the buyer-side surface feels complete and resilient.

### Implementation notes

Create explicit states for:

* no linked student
* invite pending
* progress loading/failure
* deadlines loading/failure
* billing visibility unavailable

### Dependencies

T6-007 through T6-013

### Acceptance criteria

* all major parent route states are explicit
* supporting adult is never left in a broken or silent-failure state

---

## T6-018 — Add integration tests for invite/link lifecycle

### Purpose

Protect the relationship foundation of the supporting-adult experience.

### Implementation notes

Add tests for:

* invite creation
* valid invite acceptance
* duplicate link prevention
* unauthorized link attempt denial
* invalid invite handling

### Dependencies

T6-003, T6-004

### Acceptance criteria

* link lifecycle is integration-tested
* security boundaries around link creation are covered

---

## T6-019 — Add integration tests for supporting-adult progress visibility

### Purpose

Protect summary-only access behavior.

### Implementation notes

Add tests for:

* linked entitled adult can fetch progress summary
* unlinked adult cannot fetch progress summary
* summary excludes raw writing content
* admin can fetch for support use

### Dependencies

T6-006

### Acceptance criteria

* progress visibility rules are integration-tested
* raw content leakage is explicitly prevented in tests

---

## T6-020 — Add integration tests for supporting-adult deadlines visibility

### Purpose

Protect linked deadline summary behavior.

### Implementation notes

Add tests for:

* linked entitled adult can fetch deadlines
* unlinked adult cannot fetch deadlines
* missing deadline data is handled safely

### Dependencies

T6-009

### Acceptance criteria

* deadline visibility rules are integration-tested
* edge cases for partial/missing deadline data are covered

---

## T6-021 — Add end-to-end test for supporting-adult link flow

### Purpose

Verify the relationship creation experience from the user perspective.

### Implementation notes

Create E2E test for:

* student initiates invite or supporting adult initiates link path
* supporting adult completes onboarding/link acceptance
* supporting adult reaches dashboard

### Dependencies

T6-003, T6-007

### Acceptance criteria

* supporting-adult link funnel is test-covered end to end

---

## T6-022 — Add end-to-end test for supporting-adult summary flow

### Purpose

Verify the buyer-side dashboard is usable in practice.

### Implementation notes

Create E2E test for:

* linked entitled supporting adult views dashboard
* reviews progress page
* reviews deadlines page
* does not see raw writing content

### Dependencies

T6-007, T6-010, T6-011

### Acceptance criteria

* supporting-adult summary flow is test-covered end to end

---

## T6-023 — Add end-to-end test for billing owner vs non-owner UI behavior

### Purpose

Verify billing visibility rules are enforced in the buyer-side UX.

### Implementation notes

Create E2E test for:

* billing owner sees billing controls
* linked non-owner supporting adult does not see restricted billing controls

### Dependencies

T6-012

### Acceptance criteria

* billing owner/non-owner behavior is test-covered end to end

---

## T6-024 — Refine parent/supporting-adult copy and tone across all routes

### Purpose

Ensure the buyer-side experience feels premium, supportive, and non-intrusive.

### Implementation notes

Review and refine:

* dashboard headings
* empty-state copy
* linking-state copy
* deadline-state copy
* billing-state copy

Tone should be:

* calm
* clear
* supportive
* never micromanaging

### Dependencies

T6-007 through T6-017

### Acceptance criteria

* supporting-adult UX language is on-brand and consistent
* no copy implies the adult should rewrite the student's work

---

## T6-025 — Sprint 06 QA and hardening pass

### Purpose

Stabilize the supporting-adult experience before moving to operational refinement or reminder systems.

### Implementation notes

Validate:

* linked/unlinked state transitions
* invite acceptance edge cases
* dashboard clarity
* deadline page usefulness
* billing owner visibility
* no raw writing leakage through parent surfaces
* mobile and desktop consistency
* no runtime errors across parent routes

### Dependencies

All prior Sprint 06 tickets

### Acceptance criteria

* no critical supporting-adult workflow defects remain
* no critical linking defects remain
* no critical data-visibility defects remain
* supporting-adult surface is stable enough for next sprint

---

# 6. Recommended implementation order inside sprint

## Wave 1

* T6-001
* T6-002
* T6-003
* T6-004
* T6-015

## Wave 2

* T6-005
* T6-006
* T6-007
* T6-008
* T6-009
* T6-010
* T6-011

## Wave 3

* T6-012
* T6-013
* T6-014
* T6-017
* T6-024

## Wave 4

* T6-016
* T6-018
* T6-019
* T6-020
* T6-021
* T6-022
* T6-023
* T6-025

---

# 7. Sprint 06 deliverable checklist

At sprint close, confirm all of the following:

* [ ] supporting-adult dashboard route implemented
* [ ] supporting-adult access resolver exists
* [ ] invite/link lifecycle hardened
* [ ] progress summary endpoint works
* [ ] deadlines summary endpoint works
* [ ] supporting-adult dashboard UI works
* [ ] supporting-adult progress page works
* [ ] supporting-adult deadlines page works
* [ ] billing visibility refinement works
* [ ] supporting-adult settings refined
* [ ] notification preferences work
* [ ] linked/unlinked/pending states are explicit
* [ ] analytics events exist for supporting-adult funnel
* [ ] integration tests cover invite/link lifecycle
* [ ] integration tests cover progress visibility
* [ ] integration tests cover deadline visibility
* [ ] E2E covers supporting-adult link flow
* [ ] E2E covers supporting-adult summary flow
* [ ] E2E covers billing owner vs non-owner UI behavior

---

# 8. Non-negotiables for Sprint 06

1. Do not expose raw student writing content through supporting-adult routes.
2. Do not allow unlinked supporting adults to view student summaries.
3. Do not expose billing controls to non-owners.
4. Do not make the supporting-adult UX feel like a micromanagement console.
5. Do not move to the next sprint if visibility boundaries are unstable.

---

# 9. Recommended next artifact

Create next:
**SPRINT_07_TICKETS.md**

Sprint 07 should cover:

* reminder job infrastructure
* onboarding reminder emails
* deadline reminder emails
* milestone emails
* notification event hardening
* analytics/admin observability refinement