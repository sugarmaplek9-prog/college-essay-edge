# FIRST_MINUTE_AUTOMATED_TEST_PLAN_V1

**College Essay Edge**
**Version:** V1
**Status:** Build-facing
**Owner:** Engineering / QA / Product
**Priority:** P0

---

## 1. Purpose

This document defines the automated testing plan for the First-Minute Product Experience.

Its purpose is to ensure the first-minute experience remains:

- structurally correct
- path-safe
- contract-safe
- regression-resistant
- instrumentation-complete
- presentation-rule compliant

This plan is not intended to replace manual product judgment.

**Automation should catch:**

- broken flows
- routing mistakes
- contract regressions
- rendering failures
- missing sections
- invalid states
- analytics failures
- latency regressions
- prohibited UI/copy drift

**Manual review still owns:**

- calm
- premium feel
- trustworthiness
- strategic sharpness
- parent confidence
- differentiation from generic AI

---

## 2. Scope

This test plan applies to the first-minute trust-anchor flow:

- homepage hero
- guided start
- intake submission
- fast reflection
- strongest direction
- one-question recovery
- compare alternatives
- parent reassurance layer
- transitions/loading
- analytics instrumentation

---

## 3. Core Principle

Automated testing must enforce the product contract, not just technical correctness.

A build is not protected if tests only verify "page loads" or "button exists."

**Tests must verify:**

- the correct route happens for each orchestrator outcome
- the required sections appear on each screen
- prohibited patterns do not appear
- analytics fire correctly
- degraded/error states remain usable
- UI hierarchy does not silently drift

---

## 4. Test Architecture

The automated test system should be split into six layers:

**Layer A — Unit tests**

For:
- state mapping
- routing logic
- presentation helpers
- copy guard utilities
- analytics payload builders

**Layer B — Contract tests**

For:
- POST /api/intake/session
- response schema validation
- route decision mapping
- fallback handling for partial or malformed responses

**Layer C — Component/UI tests**

For:
- required section rendering
- CTA presence
- screen-state conditions
- prohibited component usage

**Layer D — End-to-end browser tests**

For:
- real first-minute flow behavior
- multi-screen navigation
- submission → response → route transitions
- recovery paths
- graceful error handling

**Layer E — Visual regression tests**

For:
- hierarchy stability
- CTA stability
- compare weighting
- mobile layout integrity

**Layer F — Analytics and performance tests**

For:
- event firing
- event schema correctness
- latency thresholds
- regression monitoring

---

## 5. Recommended Tool Stack

Recommended default stack:

| Layer | Tool |
|---|---|
| Unit / component / contract | Jest or Vitest |
| Schema validation | Zod, TypeBox, or equivalent contract validator |
| E2E | Playwright |
| Visual regression | Playwright snapshots or Percy / Chromatic equivalent |
| Performance / timing checks | Playwright + app telemetry + CI threshold checks |
| Analytics validation | Mocked analytics sink in test + staging telemetry validation |

If the current frontend stack already has strong Cypress adoption, Cypress is acceptable, but Playwright is preferred for this plan.

---

## 6. Environments

Tests should run across these environments:

| Environment | Purpose |
|---|---|
| Local developer | Fast iteration; pre-commit confidence |
| CI pull request | Block regressions before merge |
| Staging | Validate integrated behavior against realistic backend; verify analytics; verify production-like routing and loading states |
| Nightly regression | Run the full first-minute suite; catch slow drift and dependency issues |

---

## 7. Ownership Model

**Frontend engineering owns:**
- component tests
- E2E screen behavior
- visual regression
- banned UI/component checks

**Backend/platform engineering owns:**
- API contract tests
- schema validation
- timeout/fallback behavior
- payload integrity

**Product analytics / platform owns:**
- analytics event tests
- payload schema
- event stability

**QA / product owns:**
- test case pack maintenance
- staging review coordination
- defect severity classification

**Product/design owns:**
- prohibited phrase list
- required section rules
- UI guardrail definitions

---

## 8. Critical Pass/Fail Doctrine

A build fails automated review if any of the following occur:

- first-minute route breaks
- orchestrator response maps to the wrong screen
- required section is missing on reflection, direction, compare, or recovery
- prohibited first-minute UI pattern appears
- banned phrases appear on protected screens
- analytics events fail to fire for critical actions
- user hits a dead-end error state
- latency exceeds defined thresholds without graceful fallback
- console/runtime errors occur in core first-minute flow

---

## 9. Test Data and Fixtures

Create a reusable test fixture pack for the orchestrator seam.

**Minimum fixtures required:**

### Fixture F1 — Strong success case

**Input:** Clear rough notes with enough signal

**Expected:**
- route to reflection
- route to strongest direction
- compare available
- no recovery required

---

### Fixture F2 — Reduced-scope case

**Input:** Usable but somewhat constrained notes

**Expected:**
- route to reflection
- direction available
- reduced-scope still functional
- no hard failure

---

### Fixture F3 — Thin recoverable case

**Input:** Minimal but real notes

**Expected:**
- route to one-question recovery
- exactly one question rendered
- answer submission returns to direction path

---

### Fixture F4 — Blocked case

**Input:** Insufficient or unreliable case

**Expected:**
- graceful blocked state
- no crash
- no fake certainty
- usable next-step guidance

---

### Fixture F5 — Partial payload case

**Backend returns:** Valid but missing optional fields

**Expected:**
- UI degrades gracefully
- no crash
- required surface still renders where possible

---

### Fixture F6 — Malformed payload case

**Backend returns:** Invalid schema / wrong types

**Expected:**
- contract test fails
- app falls into safe recoverable error state in staging if encountered

---

### Fixture F7 — Timeout case

**Backend delays past threshold**

**Expected:**
- calm loading state appears
- fallback message appears if needed
- no spinner-only dead state

---

### Fixture F8 — Compare unavailable case

**Backend returns:** Strongest direction only, no compare alternative

**Expected:**
- compare CTA hidden or disabled appropriately
- no broken route

---

### Fixture F9 — Recovery question unavailable case

**Backend returns:** needs_more_input but no valid question

**Expected:**
- safe fallback
- no blank recovery screen
- error is recoverable and logged

---

## 10. Test Suite Definitions

---

### SUITE A — Routing and Pathway Tests

**Objective:** Ensure all first-minute flows route correctly for every orchestrator outcome.

#### A1. Homepage to guided start

Verify:
- homepage loads
- primary CTA exists
- primary CTA click routes to `/start`

Pass: route correct, no console errors

#### A2. Guided start success path

Using F1:
- enter rough notes
- submit
- route to reflection
- primary CTA routes to direction

Pass: correct route order, no dead states

#### A3. Guided start reduced-scope path

Using F2:
- submit
- route to reflection
- direction still renders

Pass: reduced-scope does not block flow

#### A4. Guided start recovery path

Using F3:
- submit
- route to `/start/one-question`
- answer
- continue to direction

Pass: exactly one question displayed; route continues successfully

#### A5. Guided start blocked path

Using F4:
- submit
- blocked state renders gracefully

Pass: no crash, no blank state, user sees safe next step

#### A6. Compare route

Using F1:
- from direction click compare
- route to compare screen

Pass: compare screen renders strongest and weaker angle

#### A7. Recovery loop return path

Using F3:
- answer recovery question
- route to updated direction

Pass: updated direction loads, no repeated empty recovery loop

---

### SUITE B — API Contract Tests

**Objective:** Ensure the frontend/backend seam remains stable and unambiguous.

#### B1. Request schema validation

Verify guided-start tabs map correctly to API payload fields.

Check:
- Rough notes tab maps to correct field
- Partial draft tab maps to correct field
- A few experiences tab maps to correct field

Pass: request payload matches contract exactly

#### B2. Response schema validation

Validate POST `/api/intake/session` responses.

Pass only if required fields are correctly typed for:
- `success`
- `reduced_scope`
- `needs_more_input`
- `blocked`

#### B3. Route decision mapping

Given each valid response type, verify the frontend routes correctly.

Pass:
- `success` / `reduced_scope` → reflection
- `needs_more_input` → recovery
- `blocked` → graceful exit

#### B4. Optional field degradation

If optional response fields are absent, verify UI still behaves safely.

Pass: no crash, no null render failure, safe fallback logic used

#### B5. Malformed response safety

If response shape is invalid:
- frontend should not silently render nonsense

Pass: error surfaced to safe state; telemetry/log recorded

---

### SUITE C — Guided Start Screen Tests

**Objective:** Protect the messy-first entry experience from drift.

#### C1. Default tab correctness

Verify:
- default visible tab = Rough notes

Pass: correct default tab on load

#### C2. Required copy and CTA

Verify presence of:
- headline
- supportive copy
- input box
- See what's here CTA

Pass: all required elements present

#### C3. Empty-state messaging

Submit empty or near-empty input.

Pass: user sees reassuring empty-state language; no harsh validation language; no minimum-character error copy

#### C4. No form-survey drift

Verify screen does not render:
- multi-step progress form
- giant questionnaire
- checklist wall

Pass: prohibited elements absent

#### C5. No chat-composer drift

Verify input area is not styled/rendered as:
- message composer
- chat bubble input
- assistant conversation shell

Pass: prohibited chat UI elements absent

---

### SUITE D — Reflection Screen Tests

**Objective:** Ensure reflection remains structurally correct and non-generic.

#### D1. Required header

Verify: `What I'm seeing so far` exists

#### D2. Observation count

Verify: exactly 2–3 observations rendered

Pass: count in allowed range only

#### D3. Observation length

Define max character threshold per observation.

Recommended initial threshold: **220 characters max per observation**

Pass: no observation exceeds threshold

#### D4. Prohibited phrasing

Assert protected phrases do not appear:
- `we detected`
- `the model`
- `confidence score`
- `narrative pattern identified`
- `AI analysis`
- `based on model confidence`

Pass: no banned phrase present

#### D5. CTA presence

Verify:
- primary CTA exists
- optional clarifying-question CTA behaves correctly if present

#### D6. No report drift

Verify reflection screen does not render:
- long report body
- score table
- taxonomy dump
- technical metadata

Pass: protected structure maintained

---

### SUITE E — Strongest Direction Screen Tests

**Objective:** Ensure the product's main value moment is always present and correctly structured.

#### E1. Required sections

Verify all sections exist:
- Strongest direction
- Why this beats the obvious version
- What could make this fall flat
- Best next move

Pass: all required sections present

#### E2. Watch-out count

Verify: exactly one watch-out item

#### E3. Next-move count

Verify: exactly one next move

#### E4. CTA cluster

Verify:
- `Use this direction`
- `Compare it to another option`
- `Answer one question to sharpen it`

…appear when valid.

Pass: correct CTA availability by state

#### E5. Above-the-fold integrity

In standard desktop viewport, verify strongest-direction section header and core explanation appear without requiring scroll.

Pass: strongest direction visible immediately

#### E6. No report / score drift

Verify absence of:
- confidence badges
- scoring matrix
- large multi-option list
- exposed system taxonomy

---

### SUITE F — Compare Screen Tests

**Objective:** Protect the compare screen from degrading into an options menu.

#### F1. Strongest vs weaker angle presence

Verify:
- strongest angle present
- weaker angle present

#### F2. Unequal hierarchy

Automate checks for:
- primary card style differs from weaker card
- strongest card placed first
- strongest card CTA emphasis is higher

Pass: hierarchy visibly unequal

#### F3. Option count limit

Verify: no more than allowed alternatives render

Recommended initial rule: strongest + one weaker; optional third only if explicitly supported

#### F4. No menu interaction pattern

Verify absence of:
- checkboxes
- multi-select
- equal action buttons for all options
- "pick your favorite" framing

Pass: compare stays judgmental, not exploratory

---

### SUITE G — One-Question Recovery Tests

**Objective:** Ensure recovery remains helpful, minimal, and controlled.

#### G1. Exactly one question

Verify: exactly one question text block

#### G2. Exactly one input field

Verify: one answer field only

#### G3. Exactly one primary CTA

Verify: one primary submit CTA only

#### G4. No survey drift

Verify absence of:
- second visible question
- multi-step form
- questionnaire container

#### G5. Submission continuation

After answer: route continues successfully

Pass: user moves forward, not sideways

---

### SUITE H — Error and Resilience Tests

**Objective:** Prevent trust-killing failures.

#### H1. Timeout behavior

Using F7:
- calm loading state appears
- fallback appears after threshold

Pass: no spinner-only dead state

#### H2. Recoverable backend failure

Simulate transient 500/network failure.

Pass: input preserved where possible; recoverable message displayed; retry possible

#### H3. Partial data rendering

Using F5:
- no crash
- safe fallback sections used

#### H4. Missing compare availability

Using F8:
- compare route/button behaves safely

#### H5. Missing recovery question

Using F9:
- no blank recovery screen
- safe error state triggered

#### H6. No runtime/console errors

Core first-minute flow should produce:
- zero uncaught exceptions
- zero React fatal errors
- zero failed critical resource loads

---

### SUITE I — Analytics Instrumentation Tests

**Objective:** Ensure first-minute behavioral measurement is trustworthy.

**Required events:**

Verify event fire and payload shape for:

| Event |
|---|
| `homepage_view` |
| `homepage_primary_cta_click` |
| `guided_start_view` |
| `input_started` |
| `input_submitted` |
| `reflection_view` |
| `reflection_primary_cta_click` |
| `reflection_secondary_cta_click` |
| `direction_view` |
| `direction_use_click` |
| `direction_compare_click` |
| `direction_sharpen_click` |
| `compare_view` |
| `one_question_view` |
| `one_question_submit` |
| `recoverable_error_view` |

#### I1. Event fire test

Pass: event emitted when expected

#### I2. Payload validation

Pass: required fields present; session/build metadata included; route/screen context included

#### I3. Duplicate-fire protection

Pass: events do not double-fire unintentionally

#### I4. Drop-off instrumentation

Where applicable, validate abandonment markers or session exit logic.

---

### SUITE J — Visual Regression Tests

**Objective:** Catch hierarchy and layout drift.

**Screens to snapshot:**
- homepage hero
- guided start
- reflection
- strongest direction
- compare
- one-question recovery
- blocked state
- timeout/loading state
- mobile versions of all key screens

#### J1. Desktop snapshots

Pass: no unreviewed visual drift

#### J2. Mobile snapshots

Pass: no hierarchy collapse; no CTA disappearance; no density explosion

#### J3. Compare hierarchy snapshot

Pass: strongest card still visually dominant

---

### SUITE K — Performance and Latency Tests

**Objective:** Protect first-minute speed and calm.

#### K1. Time to guided start interactive

Measure from CTA click to start screen interactive.

Recommended initial threshold: **p95 ≤ 2.0s** on staging-like conditions

#### K2. Time to reflection visible

Measure from submit click to reflection render for standard case.

Recommended initial threshold: **p95 ≤ 4.0s**

#### K3. Time to strongest direction

Measure reflection CTA click to direction visible.

Recommended initial threshold: **p95 ≤ 3.0s**

#### K4. Graceful degradation threshold

If threshold exceeded:
- calm loading copy must appear
- no technical jargon

Pass: slow path still usable and non-broken

---

## 11. Prohibited Pattern Checks

Automate checks for banned first-minute patterns.

**Protected routes:**
- `/`
- `/start`
- `/start/reflection`
- `/start/direction`
- `/start/compare`
- `/start/one-question`

**Prohibited patterns**

Fail if any protected route renders:

- chat message thread container
- assistant avatar/orb component
- confidence score badge
- visible model/taxonomy metadata
- multiple equal-priority primary CTAs on first screen
- giant dashboard shell before first value
- typewriter-style AI response animation

---

## 12. CI Execution Rules

### On every pull request

Run:
- unit tests
- contract tests
- critical component tests
- smoke E2E
- banned phrase checks
- analytics event smoke tests

### On merge to main / staging deploy

Run:
- full E2E first-minute suite
- visual regression
- full analytics validation
- latency checks
- resilience/error suite

### Nightly

Run:
- full regression pack
- mobile visual suite
- fixture sweep across all orchestrator outcomes
- performance trend logging

---

## 13. Severity Model

### P0 — Release blocker

Examples:
- broken first-minute route
- wrong screen for orchestrator response
- missing strongest-direction section
- crash on submit
- analytics missing for critical events
- chatbot shell appears on protected route

### P1 — High severity

Examples:
- compare hierarchy broken
- one-question recovery shows multiple questions
- banned phrases appear
- latency threshold badly exceeded
- mobile CTA missing

### P2 — Medium severity

Examples:
- layout drift not breaking function
- optional copy block missing
- non-critical analytics metadata missing

### P3 — Low severity

Examples:
- minor spacing change
- low-risk styling drift
- cosmetic mismatch

---

## 14. Release Gate Rules

A build cannot pass first-minute automated acceptance if any of these are true:

- any P0 defect open
- more than 2 unresolved P1 defects open
- critical analytics events missing
- banned protected phrases present
- wrong route for any orchestrator outcome
- visual hierarchy regression on compare or direction
- graceful error handling fails
- performance thresholds repeatedly fail without approved exception

---

## 15. Reporting Format

Each automated run should produce:

**Summary**
- total tests run
- pass count
- fail count
- skipped count
- duration

**Critical outcome section**
- routing status
- contract status
- UI section status
- analytics status
- performance status
- visual regression status

**Defect output** — for each failure:
- suite name
- test ID
- severity
- environment
- screenshot/video if applicable
- payload/response log if applicable
- owner

---

## 16. Initial Implementation Order

Engineering should implement the automated suite in this order:

### Phase 1 — Must-have regression core

- contract tests for POST `/api/intake/session`
- pathway E2E for success / recovery / blocked
- required-section tests for reflection / direction / recovery
- analytics smoke tests
- runtime/console error checks

### Phase 2 — Guardrail protection

- banned phrase checks
- compare hierarchy tests
- prohibited component/pattern checks
- visual regression snapshots

### Phase 3 — Operational hardening

- resilience/error-state tests
- latency threshold tests
- mobile regression suite
- nightly full-case fixture sweep

---

## 17. Definition of Done

The first-minute automated test plan is considered implemented when:

- all critical first-minute routes are covered
- all orchestrator outcomes are tested
- schema/contract regressions are caught automatically
- required sections are enforced on core screens
- protected banned phrases/patterns are enforced
- analytics events are verified
- resilience paths are covered
- visual regression exists for core screens
- CI blocks merges on P0 failures

---

## 18. Final Doctrine

Automation exists to ensure humans are not wasting review time discovering broken pathways, missing sections, routing bugs, or silent regressions.

The purpose of this plan is simple:

**Protect the first-minute product contract so manual review can focus on the harder question — whether the experience actually feels calm, sharp, trustworthy, and unlike generic AI.**
