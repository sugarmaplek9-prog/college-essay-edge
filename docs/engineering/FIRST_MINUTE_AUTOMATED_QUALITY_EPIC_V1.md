# FIRST_MINUTE_AUTOMATED_QUALITY_EPIC_V1

**Title:** First-Minute Automated Quality System V1
**Type:** Epic
**Priority:** P0
**Owner:** Engineering Manager / QA Lead
**Status:** Ready for implementation

---

## Epic Description

Implement the automated quality system for the College Essay Edge first-minute product experience so the team can reliably catch pathway breaks, contract regressions, missing UI sections, prohibited copy/UI drift, analytics failures, resilience failures, and latency regressions before manual product review.

### Success Condition

All core first-minute routes and orchestrator outcomes are covered by automated tests in CI and staging, with release blocking on P0 failures.

---

## TRACK 1 — CONTRACT + ROUTING FOUNDATION

### FM-AT-01
**Title:** Define first-minute automated test architecture and ownership map
**Type:** Engineering / QA
**Priority:** P0
**Estimate:** 3 points
**Owner:** QA Lead + Eng Lead
**Dependencies:** None
**Status:** Not started

**Description:**
Create the canonical implementation plan for automated test layers, environments, owners, execution rules, and severity policy.

**Implementation Scope:**
- Define test layers: unit, contract, component, E2E, visual regression, analytics/performance
- Define required environments: local, PR CI, staging, nightly
- Define pass/fail and severity policy
- Define ownership by team

**Acceptance Criteria:**
- [ ] Test architecture document is finalized
- [ ] Owners assigned by layer
- [ ] CI/staging/nightly execution policy defined
- [ ] P0/P1/P2/P3 severity model approved

---

### FM-AT-02
**Title:** Create orchestrator fixture pack for first-minute automated testing
**Type:** Backend / QA
**Priority:** P0
**Estimate:** 5 points
**Owner:** Backend
**Dependencies:** FM-AT-01
**Status:** Not started

**Description:**
Create reusable deterministic fixtures representing all required orchestrator outcomes.

**Fixture Pack Includes:**
- F1: strong success case
- F2: reduced-scope case
- F3: thin recoverable case
- F4: blocked case
- F5: partial payload case
- F6: malformed payload case
- F7: timeout case
- F8: compare unavailable case
- F9: recovery question unavailable case

**Acceptance Criteria:**
- [ ] All fixture responses exist and are documented
- [ ] Fixtures are usable by FE, QA, and contract tests
- [ ] Each fixture maps cleanly to expected product behavior
- [ ] Fixtures are stable in CI and staging test runs

---

### FM-AT-03
**Title:** Implement contract tests for POST /api/intake/session request schema
**Type:** Backend
**Priority:** P0
**Estimate:** 5 points
**Owner:** Backend
**Dependencies:** FM-AT-02
**Status:** Not started

**Description:**
Validate that all guided-start tabs map to correct request payload fields.

**Must Test:**
- Rough notes tab → correct input field
- Partial draft tab → correct input field
- A few experiences tab → correct input field

**Acceptance Criteria:**
- [ ] Request schema tests pass for all three tab types
- [ ] Incorrect mappings fail test suite
- [ ] Request shape is locked against regression

---

### FM-AT-04
**Title:** Implement contract tests for POST /api/intake/session response schema
**Type:** Backend
**Priority:** P0
**Estimate:** 5 points
**Owner:** Backend
**Dependencies:** FM-AT-02
**Status:** Not started

**Description:**
Validate response schema for all valid outcome types.

**Must Cover:**
- `success`
- `reduced_scope`
- `needs_more_input`
- `blocked`

**Acceptance Criteria:**
- [ ] Required fields are validated for each outcome
- [ ] Wrong types or missing required fields fail tests
- [ ] Optional-field behavior is explicitly covered

---

### FM-AT-05
**Title:** Implement frontend route-decision mapping tests for intake outcomes
**Type:** Frontend
**Priority:** P0
**Estimate:** 5 points
**Owner:** Frontend
**Dependencies:** FM-AT-03, FM-AT-04
**Status:** Not started

**Description:**
Test mapping between orchestrator response types and frontend route/state transitions.

**Must Verify:**
- `success` → reflection
- `reduced_scope` → reflection
- `needs_more_input` → one-question recovery
- `blocked` → graceful blocked state

**Acceptance Criteria:**
- [ ] Route mapping is deterministic
- [ ] Wrong routing fails tests
- [ ] Blocked path never routes to reflection/direction
- [ ] Needs-more-input never skips recovery path

---

### FM-AT-06
**Title:** Implement optional-field degradation and malformed-payload safety tests
**Type:** Frontend / Backend
**Priority:** P0
**Estimate:** 5 points
**Owner:** Frontend
**Dependencies:** FM-AT-04, FM-AT-05
**Status:** Not started

**Description:**
Ensure UI degrades safely when optional fields are missing and fails safely when payloads are malformed.

**Must Cover:**
- partial payload
- missing compare data
- missing optional explanation fields
- malformed schema
- wrong data types

**Acceptance Criteria:**
- [ ] App does not crash on partial payloads
- [ ] Safe error state appears for malformed payloads
- [ ] Failures are logged/observable
- [ ] No nonsense output renders silently

---

## TRACK 2 — CORE E2E PATHWAY COVERAGE

### FM-AT-07
**Title:** Implement Playwright smoke test for homepage to guided-start path
**Type:** Frontend / QA
**Priority:** P0
**Estimate:** 3 points
**Owner:** QA
**Dependencies:** FM-AT-01
**Status:** Not started

**Description:**
Create a browser smoke test for homepage load and primary CTA routing.

**Must Verify:**
- homepage loads
- primary CTA exists
- primary CTA click routes to `/start`
- no console/runtime crash

**Acceptance Criteria:**
- [ ] Test runs in PR CI
- [ ] Failures block merge
- [ ] Screenshot/video available on failure

---

### FM-AT-08
**Title:** Implement E2E success-path test for guided start → reflection → direction
**Type:** Frontend / QA
**Priority:** P0
**Estimate:** 5 points
**Owner:** QA
**Dependencies:** FM-AT-02, FM-AT-05, FM-AT-07
**Status:** Not started

**Description:**
Create the primary happy-path first-minute browser test using strong success fixture.

**Must Verify:**
- user enters rough notes
- submit succeeds
- reflection renders
- primary CTA routes to direction
- strongest direction renders required sections

**Acceptance Criteria:**
- [ ] End-to-end route order is correct
- [ ] No dead-end or crash
- [ ] Required direction sections are present

---

### FM-AT-09
**Title:** Implement E2E reduced-scope path test
**Type:** Frontend / QA
**Priority:** P0
**Estimate:** 4 points
**Owner:** QA
**Dependencies:** FM-AT-02, FM-AT-05
**Status:** Not started

**Description:**
Test that reduced-scope cases still move through reflection and direction without breaking.

**Acceptance Criteria:**
- [ ] reduced_scope routes to reflection
- [ ] strongest direction still renders
- [ ] no hard-stop or invalid-state bug occurs

---

### FM-AT-10
**Title:** Implement E2E recovery-path test for thin-input cases
**Type:** Frontend / QA
**Priority:** P0
**Estimate:** 5 points
**Owner:** QA
**Dependencies:** FM-AT-02, FM-AT-05
**Status:** Not started

**Description:**
Test one-question recovery loop from thin-input case through updated direction result.

**Must Verify:**
- thin input routes to `/start/one-question`
- exactly one question shown
- answer submission works
- user reaches direction screen

**Acceptance Criteria:**
- [ ] No extra questions appear
- [ ] Recovery path preserves forward motion
- [ ] Updated direction loads successfully

---

### FM-AT-11
**Title:** Implement E2E blocked-path graceful-exit test
**Type:** Frontend / QA
**Priority:** P0
**Estimate:** 4 points
**Owner:** QA
**Dependencies:** FM-AT-02, FM-AT-05
**Status:** Not started

**Description:**
Test blocked cases so product exits safely and does not hallucinate confidence.

**Acceptance Criteria:**
- [ ] blocked state renders
- [ ] no blank screen
- [ ] no reflection/direction misroute
- [ ] user sees safe next-step guidance
- [ ] no crash or console error

---

### FM-AT-12
**Title:** Implement E2E compare-screen route and render test
**Type:** Frontend / QA
**Priority:** P0
**Estimate:** 4 points
**Owner:** QA
**Dependencies:** FM-AT-08
**Status:** Not started

**Description:**
Test compare-screen access from strongest-direction result.

**Acceptance Criteria:**
- [ ] compare CTA routes correctly
- [ ] strongest and weaker angle render
- [ ] compare page has no dead state
- [ ] hierarchy is structurally valid

---

### FM-AT-13
**Title:** Implement runtime and console-error checks across first-minute E2E suite
**Type:** Frontend / QA
**Priority:** P0
**Estimate:** 3 points
**Owner:** Frontend
**Dependencies:** FM-AT-07 through FM-AT-12
**Status:** Not started

**Description:**
Add browser-level assertions for uncaught exceptions, fatal render errors, and console failures.

**Acceptance Criteria:**
- [ ] Core first-minute suite fails on uncaught exception
- [ ] Fatal console/render errors fail tests
- [ ] Error logs are attached to test outputs

---

## TRACK 3 — UI STRUCTURE + PRESENTATION GUARDRAILS

### FM-AT-14
**Title:** Implement guided-start component tests for required structure and copy
**Type:** Frontend
**Priority:** P0
**Estimate:** 4 points
**Owner:** Frontend
**Dependencies:** None
**Status:** Not started

**Description:**
Protect the guided-start screen from drift.

**Must Verify:**
- default tab is Rough notes
- headline exists
- supportive copy exists
- input box exists
- CTA text is "See what's here"

**Acceptance Criteria:**
- [ ] Required structure is enforced in tests
- [ ] Wrong default tab fails
- [ ] Missing CTA/headline fails

---

### FM-AT-15
**Title:** Implement guided-start anti-drift tests for form/survey/chat UI violations
**Type:** Frontend
**Priority:** P0
**Estimate:** 5 points
**Owner:** Frontend
**Dependencies:** FM-AT-14
**Status:** Not started

**Description:**
Ensure guided-start does not degrade into survey or chatbot UI.

**Must Fail If:**
- multi-step progress questionnaire appears
- checklist wall appears
- chat composer shell appears
- assistant-thread UI appears

**Acceptance Criteria:**
- [ ] Prohibited UI patterns are explicitly checked
- [ ] Screen remains messy-first, not chat-first
- [ ] Violations fail CI

---

### FM-AT-16
**Title:** Implement reflection-screen structural tests
**Type:** Frontend
**Priority:** P0
**Estimate:** 5 points
**Owner:** Frontend
**Dependencies:** FM-AT-08
**Status:** Not started

**Description:**
Protect reflection-screen structure and output count.

**Must Verify:**
- header is "What I'm seeing so far"
- exactly 2–3 observations render
- primary CTA exists
- optional clarifying CTA behaves correctly

**Acceptance Criteria:**
- [ ] Observation count outside allowed range fails
- [ ] Required header/CTA missing fails
- [ ] Reflection remains one-screen readable

---

### FM-AT-17
**Title:** Implement reflection-screen banned-phrase and verbosity guard tests
**Type:** Frontend / Product
**Priority:** P0
**Estimate:** 5 points
**Owner:** Frontend
**Dependencies:** FM-AT-16
**Status:** Not started

**Description:**
Add copy guardrail automation for reflection output.

**Banned Examples:**
- `we detected`
- `the model`
- `confidence score`
- `narrative pattern identified`
- `AI analysis`
- `based on model confidence`

**Also Enforce:**
- max observation length threshold

**Acceptance Criteria:**
- [ ] Banned phrases fail tests
- [ ] Overlong observations fail tests
- [ ] Reflection cannot degrade into technical or AI-ish language

---

### FM-AT-18
**Title:** Implement strongest-direction screen structural tests
**Type:** Frontend
**Priority:** P0
**Estimate:** 5 points
**Owner:** Frontend
**Dependencies:** FM-AT-08
**Status:** Not started

**Description:**
Protect required section structure on the main value screen.

**Must Verify Presence Of:**
- Strongest direction
- Why this beats the obvious version
- What could make this fall flat
- Best next move

**Must Also Verify:**
- exactly one watch-out
- exactly one next move

**Acceptance Criteria:**
- [ ] Missing required section fails
- [ ] Multiple watch-outs fail
- [ ] Multiple next moves fail

---

### FM-AT-19
**Title:** Implement strongest-direction anti-drift tests for score/report/taxonomy exposure
**Type:** Frontend
**Priority:** P0
**Estimate:** 4 points
**Owner:** Frontend
**Dependencies:** FM-AT-18
**Status:** Not started

**Description:**
Prevent strongest-direction screen from devolving into report UI.

**Must Fail If Any Of These Appear:**
- confidence badges
- scoring matrix
- exposed taxonomy labels
- large multi-option list
- model metadata

**Acceptance Criteria:**
- [ ] Protected route remains premium guidance, not report output
- [ ] Violations fail CI

---

### FM-AT-20
**Title:** Implement compare-screen structure and unequal-hierarchy tests
**Type:** Frontend
**Priority:** P0
**Estimate:** 5 points
**Owner:** Frontend
**Dependencies:** FM-AT-12
**Status:** Not started

**Description:**
Protect compare-screen from becoming an equal-options menu.

**Must Verify:**
- strongest angle present
- weaker angle present
- strongest card placed first
- strongest card visually distinct/primary
- option count within limit

**Acceptance Criteria:**
- [ ] Equal hierarchy fails test
- [ ] Too many alternatives fail test
- [ ] Missing strongest/weaker pair fails test

---

### FM-AT-21
**Title:** Implement compare-screen anti-menu interaction tests
**Type:** Frontend
**Priority:** P0
**Estimate:** 4 points
**Owner:** Frontend
**Dependencies:** FM-AT-20
**Status:** Not started

**Description:**
Ensure compare-screen does not behave like a brainstorm selector.

**Must Fail If:**
- checkboxes appear
- multi-select appears
- equal action buttons appear for all options
- "pick your favorite" framing appears

**Acceptance Criteria:**
- [ ] Compare remains judgment-forward
- [ ] Menu-like interaction patterns are blocked in CI

---

### FM-AT-22
**Title:** Implement one-question recovery structural tests
**Type:** Frontend
**Priority:** P0
**Estimate:** 4 points
**Owner:** Frontend
**Dependencies:** FM-AT-10
**Status:** Not started

**Description:**
Protect one-question recovery from survey drift.

**Must Verify:**
- exactly one question text block
- exactly one input field
- exactly one primary CTA

**Acceptance Criteria:**
- [ ] Multiple-question recovery fails
- [ ] Missing CTA/input fails
- [ ] Survey-like structure does not ship

---

## TRACK 4 — ERROR HANDLING + RESILIENCE

### FM-AT-23
**Title:** Implement timeout-path loading and fallback tests
**Type:** Frontend / QA
**Priority:** P0
**Estimate:** 5 points
**Owner:** QA
**Dependencies:** FM-AT-02, FM-AT-08
**Status:** Not started

**Description:**
Test timeout behavior for the intake submit path.

**Must Verify:**
- calm loading state appears
- fallback message appears after threshold
- no spinner-only dead state

**Acceptance Criteria:**
- [ ] Timeout path remains usable
- [ ] Technical/jargony failure state does not appear
- [ ] User is not trapped

---

### FM-AT-24
**Title:** Implement recoverable backend/network failure tests
**Type:** Frontend / QA
**Priority:** P0
**Estimate:** 5 points
**Owner:** QA
**Dependencies:** FM-AT-08
**Status:** Not started

**Description:**
Test transient backend failures, network issues, and retries.

**Must Verify:**
- recoverable message appears
- input is preserved where possible
- retry path is available
- no trust-killing blank failure state

**Acceptance Criteria:**
- [ ] User can retry without losing context
- [ ] No crash or dead-end
- [ ] `recoverable_error_view` event fires where applicable

---

### FM-AT-25
**Title:** Implement safe handling tests for compare-unavailable and recovery-question-unavailable states
**Type:** Frontend / QA
**Priority:** P0
**Estimate:** 4 points
**Owner:** QA
**Dependencies:** FM-AT-06
**Status:** Not started

**Description:**
Test missing compare and missing recovery-question scenarios.

**Acceptance Criteria:**
- [ ] compare CTA hidden/disabled safely when unavailable
- [ ] no broken compare route
- [ ] no blank recovery page if question missing
- [ ] safe fallback and logging occur

---

## TRACK 5 — ANALYTICS + PERFORMANCE

### FM-AT-26
**Title:** Define first-minute analytics event schema and validation contract
**Type:** Analytics / Platform
**Priority:** P0
**Estimate:** 4 points
**Owner:** Analytics
**Dependencies:** FM-AT-01
**Status:** Not started

**Description:**
Lock the canonical event names and required payload fields for the first-minute funnel.

**Must Include:**
- `homepage_view`
- `homepage_primary_cta_click`
- `guided_start_view`
- `input_started`
- `input_submitted`
- `reflection_view`
- `reflection_primary_cta_click`
- `reflection_secondary_cta_click`
- `direction_view`
- `direction_use_click`
- `direction_compare_click`
- `direction_sharpen_click`
- `compare_view`
- `one_question_view`
- `one_question_submit`
- `recoverable_error_view`

**Acceptance Criteria:**
- [ ] Event schema is finalized
- [ ] Required metadata fields are defined
- [ ] Teams use one canonical source of truth

---

### FM-AT-27
**Title:** Implement analytics smoke tests for first-minute event firing
**Type:** Analytics / QA
**Priority:** P0
**Estimate:** 5 points
**Owner:** Analytics
**Dependencies:** FM-AT-26, FM-AT-07 through FM-AT-12
**Status:** Not started

**Description:**
Validate that key first-minute events fire on the correct user actions.

**Acceptance Criteria:**
- [ ] All critical events fire when expected
- [ ] Failures surface in CI/staging
- [ ] Missing critical event blocks release

---

### FM-AT-28
**Title:** Implement analytics payload validation and duplicate-fire protection tests
**Type:** Analytics
**Priority:** P0
**Estimate:** 4 points
**Owner:** Analytics
**Dependencies:** FM-AT-26, FM-AT-27
**Status:** Not started

**Description:**
Ensure fired events include required payload fields and do not unintentionally double-fire.

**Acceptance Criteria:**
- [ ] Required payload schema passes validation
- [ ] Session/build context present
- [ ] Duplicate-fire errors fail test suite

---

### FM-AT-29
**Title:** Implement first-minute latency measurement tests and CI thresholds
**Type:** Frontend / Platform
**Priority:** P0
**Estimate:** 5 points
**Owner:** Frontend
**Dependencies:** FM-AT-08, FM-AT-10, FM-AT-23
**Status:** Not started

**Description:**
Measure and enforce performance thresholds across the first-minute flow.

**Must Measure:**
- CTA click → guided-start interactive
- submit → reflection visible
- reflection CTA → direction visible

**Initial Thresholds:**
- guided start interactive p95 ≤ 2.0s
- reflection visible p95 ≤ 4.0s
- direction visible p95 ≤ 3.0s

**Acceptance Criteria:**
- [ ] Measurements captured in CI/staging
- [ ] Threshold failures are reported
- [ ] Slow path still requires graceful loading/fallback behavior

---

## TRACK 6 — VISUAL REGRESSION + RESPONSIVENESS

### FM-AT-30
**Title:** Implement desktop visual regression snapshots for core first-minute screens
**Type:** Frontend / QA
**Priority:** P1
**Estimate:** 5 points
**Owner:** Frontend
**Dependencies:** FM-AT-14 through FM-AT-22
**Status:** Not started

**Description:**
Capture and validate desktop snapshots for:
- homepage hero
- guided start
- reflection
- strongest direction
- compare
- one-question recovery
- blocked state
- timeout/loading state

**Acceptance Criteria:**
- [ ] Snapshot baseline established
- [ ] Unreviewed visual drift fails test run
- [ ] Failure output includes screenshot diff

---

### FM-AT-31
**Title:** Implement mobile visual regression snapshots for core first-minute screens
**Type:** Frontend / QA
**Priority:** P1
**Estimate:** 5 points
**Owner:** Frontend
**Dependencies:** FM-AT-30
**Status:** Not started

**Description:**
Capture mobile-width snapshot coverage for all key first-minute screens.

**Acceptance Criteria:**
- [ ] Mobile hierarchy remains intact
- [ ] Core CTA remains visible
- [ ] Density explosion and spacing collapse are caught in regression tests

---

### FM-AT-32
**Title:** Implement compare-screen visual hierarchy regression checks
**Type:** Frontend
**Priority:** P1
**Estimate:** 4 points
**Owner:** Frontend
**Dependencies:** FM-AT-20, FM-AT-30
**Status:** Not started

**Description:**
Protect compare-screen visual dominance of strongest angle.

**Acceptance Criteria:**
- [ ] Strongest card remains visually dominant in snapshots
- [ ] Hierarchy flattening is caught automatically
- [ ] Unreviewed drift fails CI/staging run

---

## TRACK 7 — PROHIBITED PATTERN ENFORCEMENT

### FM-AT-33
**Title:** Implement prohibited component checks for protected first-minute routes
**Type:** Frontend
**Priority:** P0
**Estimate:** 5 points
**Owner:** Frontend
**Dependencies:** FM-AT-14 through FM-AT-22
**Status:** Not started

**Description:**
Add automated checks that protected routes do not render forbidden components.

**Protected Routes:**
- `/`
- `/start`
- `/start/reflection`
- `/start/direction`
- `/start/compare`
- `/start/one-question`

**Fail If Any Protected Route Renders:**
- chat message thread container
- assistant avatar/orb
- confidence score badge
- visible model/taxonomy metadata
- giant dashboard shell
- typewriter AI animation

**Acceptance Criteria:**
- [ ] Forbidden components are blocked in CI
- [ ] Violations are easy to diagnose
- [ ] Protected routes stay aligned with doctrine

---

### FM-AT-34
**Title:** Implement protected copy-lint checks for banned first-minute language
**Type:** Frontend / Product
**Priority:** P0
**Estimate:** 4 points
**Owner:** Frontend
**Dependencies:** FM-AT-17
**Status:** Not started

**Description:**
Create a protected list of banned phrases for first-minute routes and outputs.

**Acceptance Criteria:**
- [ ] Banned language set is centralized
- [ ] Tests fail if banned copy appears on protected surfaces
- [ ] Exceptions require explicit approval

---

## TRACK 8 — CI / STAGING / NIGHTLY EXECUTION

### FM-AT-35
**Title:** Configure PR CI pipeline for first-minute automated smoke suite
**Type:** Platform / QA
**Priority:** P0
**Estimate:** 4 points
**Owner:** QA
**Dependencies:** FM-AT-03 through FM-AT-08, FM-AT-14, FM-AT-16, FM-AT-18, FM-AT-26
**Status:** Not started

**Description:**
Wire critical automated tests into pull-request CI.

**Must Run On Every PR:**
- unit tests
- contract tests
- critical component tests
- smoke E2E
- banned phrase checks
- analytics smoke tests

**Acceptance Criteria:**
- [ ] PRs fail on P0 regression
- [ ] CI runtime is acceptable for developer workflow
- [ ] Failure outputs are actionable

---

### FM-AT-36
**Title:** Configure staging pipeline for full first-minute regression suite
**Type:** Platform / QA
**Priority:** P0
**Estimate:** 4 points
**Owner:** QA
**Dependencies:** FM-AT-07 through FM-AT-34
**Status:** Not started

**Description:**
Run full first-minute regression on staging deployments.

**Must Include:**
- full E2E suite
- resilience/error suite
- full analytics validation
- visual regression
- latency checks

**Acceptance Criteria:**
- [ ] Staging suite runs automatically
- [ ] Failures are visible to owners
- [ ] Release decision can rely on this suite

---

### FM-AT-37
**Title:** Configure nightly first-minute full-case sweep and trend reporting
**Type:** Platform / QA / Analytics
**Priority:** P1
**Estimate:** 5 points
**Owner:** QA
**Dependencies:** FM-AT-36
**Status:** Not started

**Description:**
Set up nightly regression across all fixture outcomes and performance trend capture.

**Acceptance Criteria:**
- [ ] Nightly run covers all fixture cases
- [ ] Visual/performance trend logs are saved
- [ ] Slow drift becomes visible before release impact

---

## TRACK 9 — RELEASE GATES + DEFECT OPERATIONS

### FM-AT-38
**Title:** Implement first-minute automated release gate rules in CI/staging
**Type:** Platform / QA
**Priority:** P0
**Estimate:** 4 points
**Owner:** QA
**Dependencies:** FM-AT-35, FM-AT-36
**Status:** Not started

**Description:**
Encode release block rules for first-minute automated quality.

**Must Block Release If:**
- any P0 defect open
- wrong route for any orchestrator outcome
- required screen section missing
- critical analytics events missing
- prohibited phrases/patterns present
- graceful error handling fails

**Acceptance Criteria:**
- [ ] Gate rules are enforced automatically
- [ ] Release blockers are explicit
- [ ] Exceptions require deliberate override

---

### FM-AT-39
**Title:** Create first-minute automated defect reporting template and ownership routing
**Type:** QA / Eng Ops
**Priority:** P1
**Estimate:** 3 points
**Owner:** QA
**Dependencies:** FM-AT-35, FM-AT-36
**Status:** Not started

**Description:**
Standardize automated failure output for triage.

**Each Failure Should Include:**
- suite name
- test ID
- severity
- environment
- screenshot/video if applicable
- payload/response log if applicable
- owner/team

**Acceptance Criteria:**
- [ ] Failure outputs are standardized
- [ ] Ownership routing is clear
- [ ] Triage is faster and less ambiguous

---

## RECOMMENDED EXECUTION ORDER

### Phase 1 — Must-have regression core
*Estimated: 12-14 weeks*

| Order | Ticket | Title | Estimate |
|-------|--------|-------|----------|
| 1 | FM-AT-01 | Define first-minute automated test architecture and ownership map | 3 |
| 2 | FM-AT-02 | Create orchestrator fixture pack for first-minute automated testing | 5 |
| 3 | FM-AT-03 | Implement contract tests for POST /api/intake/session request schema | 5 |
| 4 | FM-AT-04 | Implement contract tests for POST /api/intake/session response schema | 5 |
| 5 | FM-AT-05 | Implement frontend route-decision mapping tests for intake outcomes | 5 |
| 6 | FM-AT-07 | Implement Playwright smoke test for homepage to guided-start path | 3 |
| 7 | FM-AT-08 | Implement E2E success-path test for guided start → reflection → direction | 5 |
| 8 | FM-AT-10 | Implement E2E recovery-path test for thin-input cases | 5 |
| 9 | FM-AT-11 | Implement E2E blocked-path graceful-exit test | 4 |
| 10 | FM-AT-14 | Implement guided-start component tests for required structure and copy | 4 |
| 11 | FM-AT-16 | Implement reflection-screen structural tests | 5 |
| 12 | FM-AT-18 | Implement strongest-direction screen structural tests | 5 |
| 13 | FM-AT-26 | Define first-minute analytics event schema and validation contract | 4 |
| 14 | FM-AT-27 | Implement analytics smoke tests for first-minute event firing | 5 |
| 15 | FM-AT-35 | Configure PR CI pipeline for first-minute automated smoke suite | 4 |

**Phase 1 Total: 68 points**

---

### Phase 2 — Guardrail protection
*Estimated: 10-12 weeks*

| Order | Ticket | Title | Estimate |
|-------|--------|-------|----------|
| 1 | FM-AT-06 | Implement optional-field degradation and malformed-payload safety tests | 5 |
| 2 | FM-AT-09 | Implement E2E reduced-scope path test | 4 |
| 3 | FM-AT-12 | Implement E2E compare-screen route and render test | 4 |
| 4 | FM-AT-13 | Implement runtime and console-error checks across first-minute E2E suite | 3 |
| 5 | FM-AT-15 | Implement guided-start anti-drift tests for form/survey/chat UI violations | 5 |
| 6 | FM-AT-17 | Implement reflection-screen banned-phrase and verbosity guard tests | 5 |
| 7 | FM-AT-19 | Implement strongest-direction anti-drift tests for score/report/taxonomy exposure | 4 |
| 8 | FM-AT-20 | Implement compare-screen structure and unequal-hierarchy tests | 5 |
| 9 | FM-AT-21 | Implement compare-screen anti-menu interaction tests | 4 |
| 10 | FM-AT-22 | Implement one-question recovery structural tests | 4 |
| 11 | FM-AT-33 | Implement prohibited component checks for protected first-minute routes | 5 |
| 12 | FM-AT-34 | Implement protected copy-lint checks for banned first-minute language | 4 |
| 13 | FM-AT-38 | Implement first-minute automated release gate rules in CI/staging | 4 |

**Phase 2 Total: 56 points**

---

### Phase 3 — Operational hardening
*Estimated: 10-12 weeks*

| Order | Ticket | Title | Estimate |
|-------|--------|-------|----------|
| 1 | FM-AT-23 | Implement timeout-path loading and fallback tests | 5 |
| 2 | FM-AT-24 | Implement recoverable backend/network failure tests | 5 |
| 3 | FM-AT-25 | Implement safe handling tests for compare-unavailable and recovery-question-unavailable states | 4 |
| 4 | FM-AT-28 | Implement analytics payload validation and duplicate-fire protection tests | 4 |
| 5 | FM-AT-29 | Implement first-minute latency measurement tests and CI thresholds | 5 |
| 6 | FM-AT-30 | Implement desktop visual regression snapshots for core first-minute screens | 5 |
| 7 | FM-AT-31 | Implement mobile visual regression snapshots for core first-minute screens | 5 |
| 8 | FM-AT-32 | Implement compare-screen visual hierarchy regression checks | 4 |
| 9 | FM-AT-36 | Configure staging pipeline for full first-minute regression suite | 4 |
| 10 | FM-AT-37 | Configure nightly first-minute full-case sweep and trend reporting | 5 |
| 11 | FM-AT-39 | Create first-minute automated defect reporting template and ownership routing | 3 |

**Phase 3 Total: 49 points**

---

## SUMMARY

- **Total Tickets:** 39
- **Total Estimated Points:** 173
- **P0 Tickets:** 34
- **P1 Tickets:** 5
- **Estimated Timeline:** 32-38 weeks (8-10 months) for all three phases
- **Phase 1 (must-have core):** 12-14 weeks
- **Phase 2 (guardrail protection):** 10-12 weeks
- **Phase 3 (operational hardening):** 10-12 weeks

---

## ONE-LINE HANDOFF FOR ENGINEERING LEADERSHIP

Implement the First-Minute Automated Quality System as a release-blocking regression framework that protects routing, contracts, UI structure, anti-chatbot guardrails, analytics, resilience, and latency for the trust-anchor user experience.
