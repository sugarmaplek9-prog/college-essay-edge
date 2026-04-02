# SPRINT_02_TICKETS

## The College Admissions Edge

## Sprint 02 — Student Onboarding, Supporting-Adult Onboarding, Edge Snapshot, Free-to-Paid Conversion Hooks

## 1. Sprint objective

Sprint 02 delivers the first real end-user product loop.

At the end of this sprint, the application must support:

* student onboarding end to end
* supporting-adult onboarding end to end
* resumable multi-step onboarding
* onboarding autosave and persistence
* free Edge Snapshot generation
* snapshot results page
* snapshot loading/failure states
* first upgrade triggers from free to paid
* basic free-vs-paid route behavior tied to real onboarding/snapshot state

This sprint creates the first credible product experience:
**sign up → choose role → complete onboarding → receive personalized Edge Snapshot → encounter premium upgrade path**

This sprint does **not** attempt to complete:

* billing integration
* Story Vault full feature set
* essay workspace
* supplements workflow
* school planner full implementation
* parent dashboard full implementation

The output of Sprint 02 is a usable free product entry point and a working conversion funnel.

---

## 2. Sprint success criteria

Sprint 02 is successful only if all of the following are true:

* student can complete onboarding without data loss
* supporting adult can complete onboarding without data loss
* onboarding progress is saved step-by-step
* onboarding can be resumed after refresh/logout/login
* student onboarding completion triggers snapshot generation flow
* snapshot loading state is clear and stable
* snapshot result page displays structured personalized output
* snapshot result page does not feel like a generic chatbot output
* free users encounter upgrade hooks at defined moments
* premium routes are still gated appropriately
* basic analytics exist for onboarding and snapshot funnel

---

## 3. Sprint scope

### Included

* student onboarding UI and logic
* supporting-adult onboarding UI and logic
* onboarding step configuration
* autosave/resume behavior
* onboarding persistence API handlers
* snapshot generation orchestration
* snapshot loading page/state
* snapshot result page
* free-to-paid upgrade triggers from snapshot and premium route entry
* analytics events for onboarding and snapshot funnel

### Excluded

* Stripe checkout
* paid entitlement unlock from billing
* Story Vault functional CRUD
* essay drafting tools
* supplement creation tools
* school planner full institution search
* reminder jobs
* admin data management tools

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

# 5. Sprint 02 tickets

## T2-001 — Define onboarding step configuration model

### Purpose

Create a centralized configuration model for onboarding so engineering does not hardcode step behavior route-by-route.

### Implementation notes

* create typed onboarding step configuration objects for:

  * student onboarding
  * supporting-adult onboarding
* each step config should define:

  * `step_key`
  * `role`
  * `question_type`
  * `label`
  * `helper_text` optional
  * `field_name`
  * `validation_rules`
  * `options` where applicable
  * `is_required`
* align questions exactly with PRD
* place config in shared typed location

### Dependencies

Sprint 01 foundation complete

### Acceptance criteria

* onboarding steps are defined in one canonical config layer
* student and supporting-adult steps are fully enumerated
* question text matches PRD

---

## T2-002 — Implement student onboarding question set

### Purpose

Build the student onboarding content layer exactly as specified.

### Implementation notes

Implement these sections and questions:

#### Section A: Academic basics

* grade
* graduation year
* academic profile
* target school type
* do you already have schools in mind?
* if yes, allow up to 5 school inputs in free flow

#### Section B: Interests and direction

* interests/fields
* activities/responsibilities
* proudest high school accomplishment
* biggest challenge

#### Section C: Story discovery

* growth moment
* what they care deeply about
* responsibility/challenge/commitment
* what others rely on them for
* what wouldn’t be obvious from grades/resume
* when they feel most like themselves

#### Section D: Writing and confidence

* essay confidence
* hardest writing challenge
* what would help most right now

#### Section E: Parent connection

* invite parent or guardian
* parent first name / email when selected

### Dependencies

T2-001

### Acceptance criteria

* all student onboarding questions are implemented
* question text aligns with PRD
* required and optional behavior matches spec

---

## T2-003 — Implement supporting-adult onboarding question set

### Purpose

Build the supporting-adult onboarding content layer exactly as specified.

### Implementation notes

Implement these questions:

* first name
* last name
* relationship to student
* if other, specify
* student grade
* biggest concern right now
* invite student now or later
* student first name/email if inviting

### Dependencies

T2-001

### Acceptance criteria

* supporting-adult onboarding questions are implemented
* relationship logic supports `other` + specify field
* concern categories align with PRD

---

## T2-004 — Build reusable onboarding shell and step renderer

### Purpose

Create the reusable UI container for all onboarding flows.

### Implementation notes

Build:

* `OnboardingShell`
* `OnboardingProgressHeader`
* `OnboardingStepRenderer`
* `OnboardingStepFooter`
* `OnboardingQuestionBlock`
* specialized step variants:

  * radio step
  * multi-select step
  * textarea step
  * invite step
* integrate `SaveStateIndicator`
* support back/continue navigation

### Dependencies

T2-001, T2-002, T2-003

### Acceptance criteria

* onboarding flow renders from config
* visual layout is consistent across step types
* save-state indicator is visible
* users can move backward and forward safely

---

## T2-005 — Build student onboarding route end to end

### Purpose

Wire student onboarding flow into `/app/onboarding`.

### Implementation notes

* connect route to student onboarding config
* load or create onboarding session for student
* restore current step on revisit
* handle completion event
* route to snapshot flow after completion

### Dependencies

T2-004

### Acceptance criteria

* student can start onboarding
* student can resume onboarding
* completed onboarding exits to snapshot flow

---

## T2-006 — Build supporting-adult onboarding route end to end

### Purpose

Wire supporting-adult onboarding flow into parent onboarding surface.

### Implementation notes

* connect route to supporting-adult onboarding config
* load or create onboarding session
* restore current step on revisit
* handle completion event
* route to parent post-onboarding state

### Dependencies

T2-004

### Acceptance criteria

* supporting adult can start onboarding
* supporting adult can resume onboarding
* completed onboarding exits to correct next state

---

## T2-007 — Implement onboarding session state service

### Purpose

Create the server-side orchestration layer for onboarding state.

### Implementation notes

Build service methods for:

* start onboarding session
* load current session
* save step response
* update current step
* compute completion percent
* complete onboarding session
* hydrate profile data from onboarding answers

### Dependencies

Sprint 01 DB + auth foundation

### Acceptance criteria

* onboarding state logic is centralized in server/service layer
* route and API handlers do not duplicate completion logic

---

## T2-008 — Implement onboarding API handlers

### Purpose

Expose onboarding save/resume/completion endpoints.

### Implementation notes

Implement and wire:

* `POST /api/onboarding/start`
* `POST /api/onboarding/save-step`
* `GET /api/onboarding/status`
* `POST /api/onboarding/complete`

Requirements:

* authenticated only
* role-aware
* session ownership enforced
* responses typed
* validation errors explicit

### Dependencies

T2-007

### Acceptance criteria

* onboarding APIs work end to end
* unauthorized access is denied
* malformed payloads return validation errors

---

## T2-009 — Implement autosave behavior for onboarding

### Purpose

Prevent data loss and improve UX.

### Implementation notes

* autosave on continue
* optional debounce save for text-heavy steps
* update `SaveStateIndicator`
* prevent duplicate saves where reasonable
* do not allow silent failure

### Dependencies

T2-004, T2-008

### Acceptance criteria

* step answers persist without manual save button requirement
* save success/failure states are visible
* reload returns user to current saved step

---

## T2-010 — Map onboarding outputs into profile tables

### Purpose

Ensure onboarding creates durable structured product data.

### Implementation notes

On completion, write relevant fields into:

* `student_profiles`
* `supporting_adult_profiles`
* `onboarding_sessions`
* `onboarding_responses`

For student flow also persist:

* high-level school preferences
* parent invite request if provided

### Dependencies

T2-007, T2-008

### Acceptance criteria

* profile tables are updated on onboarding completion
* onboarding data persists independently of UI session state

---

## T2-011 — Implement snapshot generation service contract

### Purpose

Create the server-side structure for Edge Snapshot generation.

### Implementation notes

Build a snapshot generation service that:

* reads completed student onboarding data
* transforms onboarding responses into AI input payload
* requests structured AI output
* validates output shape
* stores snapshot result in `snapshot_results`

Required output shape:

* strongest themes
* story directions
* missing elements
* summary

### Dependencies

T2-010

### Acceptance criteria

* snapshot generation service exists and is isolated from route layer
* output is typed and validated before persistence

---

## T2-012 — Implement snapshot API handlers

### Purpose

Expose snapshot generation and retrieval behavior.

### Implementation notes

Implement:

* `POST /api/snapshot/generate`
* `GET /api/snapshot/current`
* `POST /api/snapshot/mark-viewed`

Requirements:

* student owner or admin only
* cannot generate snapshot before onboarding completion
* snapshot fetch returns latest relevant record

### Dependencies

T2-011

### Acceptance criteria

* snapshot APIs work end to end
* non-student users cannot fetch raw student snapshot directly
* snapshot viewed state can be recorded

---

## T2-013 — Build snapshot loading state and route behavior

### Purpose

Create the transition from onboarding completion to snapshot display.

### Implementation notes

* implement `SnapshotLoadingPanel`
* handle route state where snapshot is:

  * queued
  * generating
  * failed
  * ready
* show premium-feeling loading state
* avoid gimmicky “AI thinking” copy

### Dependencies

T2-011, T2-012

### Acceptance criteria

* onboarding completion leads to stable snapshot loading experience
* loading state does not look broken or generic
* failed generation has explicit retry/recovery path

---

## T2-014 — Build snapshot result page UI

### Purpose

Deliver the first meaningful user-facing insight page.

### Implementation notes

Build and compose:

* `SnapshotThemeCard`
* `SnapshotDirectionCard`
* `SnapshotGapList`
* `SnapshotSummaryPanel`
* `SnapshotCTASection`

Must support:

* at least 3 theme outputs
* at least 3 story direction outputs
* gap summary
* admissions edge summary
* CTA for upgrade

### Dependencies

T2-013

### Acceptance criteria

* snapshot page renders structured output
* page feels personalized and professional
* page supports `Save My Snapshot / Finish Later`
* upgrade CTA is visible before end of page

---

## T2-015 — Implement snapshot generation trigger on onboarding completion

### Purpose

Automate the transition from onboarding to free value.

### Implementation notes

* after successful student onboarding completion:

  * create snapshot generation record
  * trigger generation process
  * route user to `/app/snapshot`
* ensure repeated completion events do not create duplicate chaos
* idempotent behavior required

### Dependencies

T2-008, T2-011, T2-013

### Acceptance criteria

* onboarding completion automatically starts snapshot flow
* user lands on snapshot route without manual intervention
* duplicate snapshot creation is controlled

---

## T2-016 — Implement first free-to-paid upgrade hooks

### Purpose

Create product-led conversion moments inside free experience.

### Implementation notes

Implement upgrade prompts at these points:

1. after snapshot view
2. when attempting to access `/app/story-vault`
3. when attempting to access `/app/personal-statement`
4. when attempting to access `/app/supplements`
5. when student exceeds free school limit placeholder logic if route exists

Use reusable `UpgradeGate` and/or upgrade CTA section.

### Dependencies

T2-014

### Acceptance criteria

* free user sees consistent upgrade prompts at defined moments
* upgrade language is product-focused, not “AI bot” focused
* gated routes do not expose premium data before prompt

---

## T2-017 — Implement temporary free/paid entitlement resolver for Sprint 02

### Purpose

Support realistic gating behavior before Stripe integration.

### Implementation notes

* replace placeholder gating stub from Sprint 01 with cleaner entitlement resolver
* source entitlement from `subscriptions` table if present
* default free when absent
* expose helper methods usable by routes and APIs

### Dependencies

Sprint 01 billing placeholder work, T2-016

### Acceptance criteria

* entitlement state resolves consistently in server layer
* premium route checks can use shared helper
* free users remain gated correctly

---

## T2-018 — Implement parent/supporting-adult invite initiation from onboarding

### Purpose

Preserve the relationship-building flow early.

### Implementation notes

* when student enters parent invite info in onboarding:

  * persist invite intent
  * optionally create notification event placeholder
* when supporting adult enters student info:

  * persist invite/link intent
* do not fully implement link resolution logic beyond minimal flow if deferred, but persist all required state

### Dependencies

T2-010

### Acceptance criteria

* invite intent data is not lost
* parent/supporting-adult invite fields persist correctly
* later linking can build on stored data

---

## T2-019 — Implement onboarding and snapshot analytics events

### Purpose

Track the first real funnel.

### Implementation notes

Add events for:

* onboarding_started
* onboarding_step_saved
* onboarding_completed
* snapshot_generation_started
* snapshot_generation_failed
* snapshot_viewed
* upgrade_prompt_viewed
* upgrade_cta_clicked

### Dependencies

Sprint 01 analytics scaffold, T2-015, T2-016

### Acceptance criteria

* events are emitted through central analytics interface
* onboarding drop-off points can be measured
* snapshot conversion points can be measured

---

## T2-020 — Build onboarding and snapshot error states

### Purpose

Ensure failure handling feels intentional and premium.

### Implementation notes

Create explicit states for:

* failed onboarding save
* network interruption during onboarding
* snapshot generation failure
* malformed snapshot response rejection

Use reusable `ErrorStatePanel` patterns.

### Dependencies

T2-009, T2-013, T2-014

### Acceptance criteria

* failure states are visible and actionable
* users are not left in silent broken states
* retry paths exist where appropriate

---

## T2-021 — Implement route-level state handling for onboarding and snapshot

### Purpose

Ensure route behavior reflects real product state cleanly.

### Implementation notes

Implement route logic such that:

* student hitting `/app` with incomplete onboarding → `/app/onboarding`
* student with completed onboarding and pending snapshot → `/app/snapshot`
* student with completed onboarding and ready snapshot may land on `/app` or `/app/snapshot` based on UX decision, but logic must be deterministic
* supporting adult with incomplete onboarding → supporting-adult onboarding

### Dependencies

T2-005, T2-006, T2-015

### Acceptance criteria

* route behavior is deterministic and state-aware
* users do not bounce between routes incorrectly
* no redirect loops exist

---

## T2-022 — Add integration tests for onboarding persistence

### Purpose

Protect the most important stateful workflow in Sprint 02.

### Implementation notes

Add integration coverage for:

* onboarding session creation
* step save
* step overwrite/update
* resume after reload
* onboarding completion state
* profile persistence mapping

### Dependencies

T2-008, T2-010

### acceptance criteria

* onboarding persistence is covered by automated tests
* regressions in save/resume logic are catchable

---

## T2-023 — Add integration tests for snapshot generation contract

### Purpose

Protect the structured output contract for free value delivery.

### Implementation notes

Add tests for:

* snapshot cannot generate before onboarding completion
* snapshot output validates required sections
* failed AI payload is rejected safely
* snapshot result persists correctly

### Dependencies

T2-011, T2-012

### acceptance criteria

* snapshot generation contract is test-covered
* invalid output cannot silently corrupt UI expectations

---

## T2-024 — Add end-to-end test for free user funnel

### Purpose

Validate first real product flow from signup to snapshot.

### Implementation notes

Create E2E test for:

* sign up
* select student role
* complete onboarding
* reach snapshot page
* see upgrade CTA

If auth complexity makes full signup costly in test environment, use seeded test user flow plus role assignment setup.

### Dependencies

T2-005, T2-014, T2-016

### acceptance criteria

* free user funnel passes in automated test environment
* critical regressions are detectable before deploy

---

## T2-025 — Sprint 02 QA and hardening pass

### Purpose

Stabilize the first real product loop before moving to paid workflow modules.

### Implementation notes

Validate:

* text areas perform reasonably on long answers
* autosave is not jittery or confusing
* snapshot page is readable on mobile and desktop
* upgrade prompts are not duplicated or sloppy
* route transitions feel coherent
* no console/runtime errors across onboarding/snapshot flow

### Dependencies

All prior Sprint 02 tickets

### acceptance criteria

* no critical onboarding defects remain
* no critical snapshot defects remain
* no critical conversion-flow defects remain

---

# 6. Recommended implementation order inside sprint

## Wave 1

* T2-001
* T2-002
* T2-003
* T2-004

## Wave 2

* T2-007
* T2-008
* T2-009
* T2-010
* T2-005
* T2-006

## Wave 3

* T2-011
* T2-012
* T2-013
* T2-014
* T2-015

## Wave 4

* T2-016
* T2-017
* T2-018
* T2-019
* T2-020
* T2-021
* T2-022
* T2-023
* T2-024
* T2-025

---

# 7. Sprint 02 deliverable checklist

At sprint close, confirm all of the following:

* [ ] student onboarding questions implemented
* [ ] supporting-adult onboarding questions implemented
* [ ] onboarding step config exists
* [ ] onboarding autosave works
* [ ] onboarding resume works
* [ ] onboarding completion writes profile data
* [ ] snapshot service exists
* [ ] snapshot generation works end to end
* [ ] snapshot loading state exists
* [ ] snapshot result page exists
* [ ] snapshot output is structured and personalized
* [ ] upgrade prompts exist at required moments
* [ ] analytics events exist for onboarding and snapshot funnel
* [ ] integration tests cover onboarding persistence
* [ ] integration tests cover snapshot contract
* [ ] E2E covers free user funnel

---

# 8. Non-negotiables for Sprint 02

1. Do not ship onboarding without reliable autosave/resume.
2. Do not expose raw unvalidated AI output directly to the UI.
3. Do not let snapshot generation run before onboarding completion.
4. Do not create premium route entry without clean upgrade-gate behavior.
5. Do not move to Sprint 03 if the free funnel is unstable.

---

# 9. Recommended next artifact

Create next:
**SPRINT_03_TICKETS.md**

Sprint 03 should cover:

* billing integration with Stripe
* entitlement synchronization
* paid unlock behavior
* Story Vault CRUD
* Story Vault analysis
* student dashboard refinement around paid state

