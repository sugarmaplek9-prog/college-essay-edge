# SPRINT_05_TICKETS

## The College Admissions Edge

## Sprint 05 — Supplements Workflow, School-Specific Prompt Grouping, Angle Suggestions, Overlap Warnings, School Planner Integration

## 1. Sprint objective

Sprint 05 extends the product from personal statement support into multi-school application execution.

At the end of this sprint, the application must support:

* supplement workspace access for paid students
* school-specific supplement grouping
* supplement creation and editing
* prompt category handling
* angle suggestion generation from student context and Story Vault
* overlap warning generation across supplements and personal statement content
* school planner integration with supplement workflows
* dashboard and progress updates reflecting supplement completion state

This sprint creates the second major high-value paid workflow:
**select schools 1 create school-specific supplements 1 get angle suggestions 1 avoid repetition 1 complete a coherent multi-school application package**

This sprint does **not** attempt to complete:

* parent dashboard expansion
* advanced deadline reminder jobs
* admin content management beyond existing routes
* human review or collaboration workflows
* scholarship workflows
* transfer or graduate school workflows

The output of Sprint 05 is a working supplements product loop integrated with the school planner.

---

## 2. Sprint success criteria

Sprint 05 is successful only if all of the following are true:

* paid student can enter supplements workspace
* supplements can be grouped by selected school
* student can create and edit supplement projects
* prompt categories are stored and surfaced correctly
* angle suggestion generation returns structured, usable output
* overlap warnings identify likely repetition across essays/supplements
* supplements route integrates with school planner state
* free students remain gated from supplements workflow
* supplements workflow is test-covered end to end

---

## 3. Sprint scope

### Included

* supplements route implementation
* supplement project service layer
* supplement CRUD APIs
* school-specific supplement grouping
* prompt category handling
* angle suggestion generation service and endpoint
* overlap detection service and endpoint
* supplements UI route and editor
* integration with school list / institution data
* dashboard and progress updates for supplement state
* analytics for supplements workflow

### Excluded

* parent supplement visibility
* reminder cron jobs
* counselor collaboration
* admin prompt library tooling
* advanced institution/deadline admin UX
* application submission tracking automation beyond existing status model

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

# 5. Sprint 05 tickets

## T5-001 — Implement supplements route shell and premium gating

### Purpose

Establish the route entry point and page shell for the supplements module.

### Implementation notes

* implement `/app/supplements`
* use `StudentAppLayout`
* apply `RouteGuardShell`
* enforce student role + paid entitlement
* display upgrade state for free users
* show empty state when no schools are selected or no supplements exist yet

### Dependencies

Sprint 03 entitlement system complete

### Acceptance criteria

* free student sees clean upgrade gate
* paid student can enter supplements route
* route protection is consistent across page, API, and data layers

---

## T5-002 — Implement supplement project service layer

### Purpose

Centralize business logic for supplements workflow.

### Implementation notes

Build service methods for:

* list supplement projects for student
* create supplement project
* update supplement project
* soft-delete supplement project if supported later
* group supplements by institution
* fetch supplement project by id
* compute supplement progress state

### Dependencies

Sprint 01 schema foundation

### Acceptance criteria

* supplement business logic is centralized
* route handlers do not duplicate core supplement lifecycle logic

---

## T5-003 — Implement supplements API endpoints

### Purpose

Expose supplement CRUD through protected APIs.

### Implementation notes

Implement:

* `GET /api/supplements`
* `POST /api/supplements`
* `PATCH /api/supplements/:id`

Requirements:

* authenticated only
* student owner or admin only
* paid entitlement required
* institution association required
* validation for prompt text, category, and draft fields

### Dependencies

T5-002, Sprint 03 entitlement system

### Acceptance criteria

* paid student can create and update own supplements
* free student cannot use supplement APIs successfully
* student cannot access another student’s supplements

---

## T5-004 — Build school-to-supplement grouping service

### Purpose

Provide the supplements route with school-centric organization.

### Implementation notes

Build service that:

* reads student school list
* joins supplement projects to institutions
* groups supplements by school
* exposes schools with zero supplements as available targets

### Dependencies

T5-002, existing school list schema

### Acceptance criteria

* route can render supplements grouped by school
* empty-school and existing-supplement states are both supported

---

## T5-005 — Implement prompt category mapping and validation

### Purpose

Normalize supplement prompt types for better guidance and UI consistency.

### Implementation notes

Use the existing prompt category model, supporting:

* why_us
* why_major
* extracurricular_community
* identity_background
* challenge_growth
* short_answer
* diversity_community_contribution
* other

Add validation and UI labeling.

### Dependencies

T5-003

### Acceptance criteria

* prompt categories can be stored, updated, and displayed consistently
* invalid prompt categories are rejected safely

---

## T5-006 — Build supplements route UI structure

### Purpose

Create the main route composition for supplements.

### Implementation notes

Build and integrate:

* `SupplementsHeader`
* `SchoolPromptGroup`
* `SupplementCard`
* `SupplementsEmptyState`
* route-level `UpgradeGate` for free users

The page should feel school-organized, not like a flat list of prompts.

### Dependencies

T5-004, component inventory foundation

### Acceptance criteria

* paid student sees school-grouped supplement structure
* free student sees upgrade gate
* no-school-selected state is clear and actionable

---

## T5-007 — Build supplement editor pane

### Purpose

Create the writing surface for supplement responses.

### Implementation notes

Build `SupplementEditorPane` with:

* prompt display
* prompt category badge
* draft text area
* save state indicator
* institution context
* no overly complex formatting tools in v1

### Dependencies

T5-003, T5-006

### Acceptance criteria

* student can create and edit supplement draft text
* editor surface is stable and coherent
* save state is visible and trustworthy

---

## T5-008 — Implement supplement autosave and persistence

### Purpose

Prevent data loss in supplement workflow.

### Implementation notes

* autosave draft text using reasonable debounce
* persist through supplement update endpoint
* surface success/failure via save state indicator
* restore saved drafts on reload

### Dependencies

T5-003, T5-007

### Acceptance criteria

* supplement drafts persist reliably
* reload restores latest saved state
* failure states are visible and recoverable

---

## T5-009 — Implement angle suggestion generation service

### Purpose

Generate school/prompt-specific writing directions from existing student context.

### Implementation notes

Build service that reads:

* supplement prompt text
* prompt category
* institution context
* Story Vault entries
* snapshot themes
* personal statement direction if available

Return structured output such as:

* recommended angles
* likely relevant story assets
* caution notes
* best-fit rationale

### Dependencies

Sprint 02 snapshot, Sprint 03 Story Vault, T5-005

### Acceptance criteria

* angle suggestion service returns structured output
* output is typed and validated
* missing context is handled safely

---

## T5-010 — Implement angle suggestion endpoint

### Purpose

Expose angle generation to supplements workflow.

### Implementation notes

Implement:

* `POST /api/supplements/:id/suggest-angles`

Requirements:

* authenticated
* student owner or admin only
* paid entitlement required
* supplement record must exist

### Dependencies

T5-009

### Acceptance criteria

* paid student can request angle suggestions
* response is structured and safe
* unauthorized access is denied

---

## T5-011 — Build angle suggestion UI panel

### Purpose

Display actionable supplement idea guidance.

### Implementation notes

Build and integrate:

* `SuggestedAnglesPanel`
* loading state
* error state
* structured list of angle options

### Dependencies

T5-010

### Acceptance criteria

* student can view angle suggestions within supplement workflow
* panel is readable and not bot-like
* loading and failure states are explicit

---

## T5-012 — Implement overlap detection service

### Purpose

Warn student when they are repeating the same ideas too heavily across applications.

### Implementation notes

Build service that compares supplement content against:

* personal statement draft
* other supplement drafts
* selected narrative direction / major themes if relevant

Return structured overlap output such as:

* overlap detected? yes/no
* likely repeated themes
* repeated story or angle risk
* recommendation to differentiate

### Dependencies

Sprint 04 personal statement workflow, T5-002

### Acceptance criteria

* overlap service returns structured output
* service can compare against existing draft corpus
* no raw similarity score dump without explanation

---

## T5-013 — Implement overlap detection endpoint

### Purpose

Expose overlap checking to supplements workflow.

### Implementation notes

Implement:

* `POST /api/supplements/:id/check-overlap`

Requirements:

* authenticated
* student owner or admin only
* paid entitlement required
* supplement must exist

### Dependencies

T5-012

### Acceptance criteria

* paid student can request overlap check
* structured overlap output is returned safely

---

## T5-014 — Build overlap warning UI panel

### Purpose

Display overlap guidance clearly and without alarmist language.

### Implementation notes

Build and integrate:

* `OverlapWarningPanel`
* summary of risk
* repeated-theme list
* recommendations for differentiation

### Dependencies

T5-013

### Acceptance criteria

* overlap warnings are understandable and actionable
* panel supports no-warning, moderate-warning, and high-warning states

---

## T5-015 — Integrate school planner data into supplements route

### Purpose

Ensure supplements module reflects the actual selected school list.

### Implementation notes

* supplements route should pull selected institutions from `student_school_lists`
* selecting a school should create supplement context for that institution
* route should not require manual school-name re-entry
* if no schools are selected, route should direct user toward school planner

### Dependencies

existing school list schema, T5-004

### Acceptance criteria

* supplements module is driven by selected schools
* no manual school text entry is required for standard flow
* no-school-selected state routes user appropriately

---

## T5-016 — Implement supplement status and progress logic

### Purpose

Track meaningful completion state across supplement workflow.

### Implementation notes

Support supplement statuses:

* not_started
* in_progress
* revised
* complete

Build/update logic for status transitions based on:

* draft creation
* draft revision
* explicit completion action if used

### Dependencies

T5-002, T5-007, T5-008

### Acceptance criteria

* supplement status persists correctly
* status updates in deterministic way
* status is available to dashboard/progress views

---

## T5-017 — Integrate supplement state into dashboard and progress views

### Purpose

Reflect supplement workflow across the broader student experience.

### Implementation notes

Update student dashboard/progress components to show:

* supplements not started
* schools with supplements started
* supplements in progress
* supplements revised/complete
* next recommended step related to supplements

### Dependencies

T5-016

### Acceptance criteria

* dashboard and progress views reflect actual supplement state
* supplements contribute to overall application progress meaningfully

---

## T5-018 — Implement empty, loading, and failure states for supplements workflow

### Purpose

Ensure the supplements module feels complete and resilient.

### Implementation notes

Create explicit states for:

* no schools selected
* no supplements yet
* angle generation loading/failure
* overlap check loading/failure
* save failure

### Dependencies

T5-006 through T5-014

### Acceptance criteria

* all major supplement route states are explicit
* student is never left in an ambiguous or broken state

---

## T5-019 — Implement analytics events for supplements workflow

### Purpose

Measure usage and drop-off inside supplements workflow.

### Implementation notes

Add events for:

* supplements_viewed
* supplement_created
* supplement_updated
* supplement_group_opened
* angle_suggestions_requested
* angle_suggestions_completed
* overlap_check_requested
* overlap_check_completed
* supplement_status_changed

### Dependencies

T5-006 through T5-017

### Acceptance criteria

* supplement workflow is measurable through central analytics interface
* key adoption and usage events exist

---

## T5-020 — Add integration tests for supplement CRUD lifecycle

### Purpose

Protect the supplement project model and ownership behavior.

### Implementation notes

Add tests for:

* create supplement
* update supplement
* list supplements by student
* prompt category validation
* unauthorized access denial
* free-user gating denial

### Dependencies

T5-003, T5-005

### Acceptance criteria

* supplement CRUD lifecycle is integration-tested
* ownership and entitlement enforcement are covered

---

## T5-021 — Add integration tests for angle suggestion contract

### Purpose

Protect structured suggestion output for supplement guidance.

### Implementation notes

Add tests for:

* valid supplement context 1 valid suggestions
* missing context 1 safe degraded output or rejection
* malformed AI output 1 rejection
* response schema validation

### Dependencies

T5-010

### Acceptance criteria

* angle suggestion contract is test-covered
* invalid outputs cannot silently break UI assumptions

---

## T5-022 — Add integration tests for overlap detection contract

### Purpose

Protect the overlap-warning system.

### Implementation notes

Add tests for:

* supplement with no overlap 1 safe output
* supplement with likely overlap 1 structured warning output
* malformed AI or comparison output 1 safe rejection

### Dependencies

T5-013

### Acceptance criteria

* overlap contract is test-covered
* invalid or missing comparison data is handled safely

---

## T5-023 — Add end-to-end test for school-to-supplement flow

### Purpose

Verify supplements module is truly integrated with school selection.

### Implementation notes

Create E2E test for:

* paid student with selected school list
* enters supplements route
* selects school group
* creates supplement
* saves draft

### Dependencies

T5-015

### Acceptance criteria

* school-to-supplement flow passes in automated environment

---

## T5-024 — Add end-to-end test for supplement guidance flow

### Purpose

Verify premium supplement assistance works from the user perspective.

### Implementation notes

Create E2E test for:

* paid student opens supplement
* requests angle suggestions
* sees suggestions
* requests overlap warning
* sees overlap guidance

### Dependencies

T5-011, T5-014

### Acceptance criteria

* supplement guidance flow is test-covered end to end

---

## T5-025 — Sprint 05 QA and hardening pass

### Purpose

Stabilize the second major writing module before moving to parent/dashboard or operations expansion.

### Implementation notes

Validate:

* supplements route remains organized even with multiple schools
* suggestion language is useful and on-brand
* overlap warnings are helpful, not noisy
* no-school-selected empty state is clear
* save behavior is stable across multiple supplement cards
* mobile and desktop layouts remain coherent
* no runtime errors on supplements route

### Dependencies

All prior Sprint 05 tickets

### Acceptance criteria

* no critical supplement workflow defects remain
* no critical guidance/overlap defects remain
* supplements module is stable enough for next sprint

---

# 6. Recommended implementation order inside sprint

## Wave 1

* T5-001
* T5-002
* T5-003
* T5-004
* T5-005
* T5-006

## Wave 2

* T5-007
* T5-008
* T5-015
* T5-016
* T5-017

## Wave 3

* T5-009
* T5-010
* T5-011
* T5-012
* T5-013
* T5-014
* T5-018

## Wave 4

* T5-019
* T5-020
* T5-021
* T5-022
* T5-023
* T5-024
* T5-025

---

# 7. Sprint 05 deliverable checklist

At sprint close, confirm all of the following:

* [ ] supplements route implemented
* [ ] premium gating works correctly
* [ ] supplement service layer exists
* [ ] supplement APIs work
* [ ] school-grouped supplement view works
* [ ] supplement editor works
* [ ] autosave works
* [ ] prompt category handling works
* [ ] angle suggestion generation works
* [ ] angle suggestion UI works
* [ ] overlap detection works
* [ ] overlap warning UI works
* [ ] school planner integration works
* [ ] supplement status logic works
* [ ] dashboard/progress reflect supplement state
* [ ] analytics events exist for supplements workflow
* [ ] integration tests cover supplement CRUD
* [ ] integration tests cover angle suggestion contract
* [ ] integration tests cover overlap contract
* [ ] E2E covers school-to-supplement flow
* [ ] E2E covers supplement guidance flow

---

# 8. Non-negotiables for Sprint 05

1. Do not expose supplements workflow to free users.
2. Do not require manual school-name entry for the standard supplement flow.
3. Do not present angle suggestions or overlap warnings as unstructured AI prose.
4. Do not allow supplement workflow to drift away from school planner context.
5. Do not move to the next sprint if supplements are unstable or confusing.

---

# 9. Recommended next artifact

Create next:
**SPRINT_06_TICKETS.md**

Sprint 06 should cover:

* parent/supporting-adult dashboard implementation
* linked student progress summaries
* deadline summaries
* billing visibility refinement
* invite/link acceptance flow hardening
* parent-facing UX polish