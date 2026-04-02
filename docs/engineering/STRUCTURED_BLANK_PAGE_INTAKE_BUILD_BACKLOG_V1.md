# STRUCTURED_BLANK_PAGE_INTAKE_BUILD_BACKLOG_V1

**College Essay Edge**  
**Engineering execution backlog**  
**Requirements-first build plan**  
**Status: Execution backlog**  
**Derived from:** `STRUCTURED_BLANK_PAGE_INTAKE_V1` and `STRUCTURED_BLANK_PAGE_INTAKE_IMPLEMENTATION_PLAN_V1`

---

## Purpose

This document converts the approved blank-page intake system spec and implementation plan into a build-ready engineering backlog.

It is intended to answer:

- what gets built first
- what files are touched
- what tests are required
- what review gates must be passed
- what counts as done

This is the execution document.  
It is **not** a concept memo.

---

## 1. Mission

Ship a dedicated first-minute recovery lane for users who arrive with:

- a topic but no story
- a theme but no moment
- an activity but no center
- uncertainty about whether something “says enough”
- no idea what to write about

The system must:

- detect blank-page-like states
- route into structured recovery instead of fake direction or blunt block
- ask typed, non-generic questions
- convert recoverable cases into stronger downstream readiness
- preserve trust and avoid fake specificity

---

## 2. Exit condition

The backlog is complete only if:

- blank-page intake is implemented behind a controlled route
- all required payload fields exist
- UI renders the mode-specific state correctly
- telemetry is live
- blank-page eval pack passes
- real-user-sim remains PASS
- no core NDS regressions appear

---

## 3. Build phases

### Phase 0
Contract freeze

### Phase 1
Detection and mode assignment

### Phase 2
Structured recovery question engine

### Phase 3
Payload + UI integration

### Phase 4
Post-answer conversion path

### Phase 5
Telemetry + evaluation harness

### Phase 6
Prod rollout + validation

---

## 4. Review gates

### Gate 1 — Contract freeze

Must approve:

- mode taxonomy
- payload contract
- telemetry names
- test plan
- real-input evaluation rules

### Gate 2 — Implementation review

Must approve:

- file-level change set
- route boundaries
- UI state handling
- conversion logic

### Gate 3 — Pre-prod review

Must approve:

- test results
- eval results
- telemetry visibility
- no-regression status

### Gate 4 — Release review

Must approve:

- prod validation
- trust behavior
- real-user-sim
- source composition of evaluation pack

---

## 5. Backlog items

## EPIC A — Detection and routing foundation

### A1. Add blank-page detection signals

**Goal:** detect when a user is not ready for normal NDS.

**Files**
- `src/lib/ml/evidenceStrength/features.ts`
- `src/lib/ml/evidenceStrength/model.ts`

**Deliverables**
- detection logic for:
  - `topic_only`
  - `theme_only`
  - `activity_only`
  - `scope_uncertain`
  - `blank_page`
  - `too_thin_to_recover`
- output fields:
  - `blank_page_intake_detected`
  - `blank_page_mode`
  - `blank_page_trigger_signals`
  - `blank_page_recovery_reason`
  - `blank_page_confidence`

**Tests**
- unit tests for each input class
- regression tests on existing clarify / block / direction routes

**Done when**
- all supported blank-page types classify correctly
- no broad route regressions appear

### A2. Add pre-NDS blank-page route branch

**Goal:** route eligible inputs into `blank_page_intake`.

**Files**
- intake routing orchestration layer
- any first-minute session builder touched by route decisions

**Deliverables**
- route decision:
  - `ready_for_nds`
  - `needs_structured_blank_page_intake`
  - `true_block`

**Tests**
- blank-page inputs route correctly
- non-blank-page directional inputs still reach normal path

**Done when**
- branch is deterministic
- block inflation does not appear

---

## EPIC B — Structured recovery question engine

### B1. Build mode-specific question selector

**Goal:** no generic clarification for blank-page users.

**Files**
- `src/lib/fm/buildClarificationPayload.ts`
- recommended new helper:
  - `src/lib/fm/buildBlankPagePayload.ts`

**Deliverables**
- typed question templates for:
  - `topic_probe`
  - `theme_probe`
  - `activity_probe`
  - `scope_reframe`
  - `blank_page_discovery`
  - `too_thin_to_recover`

**Required question families**
- `moment_question`
- `hinge_question`
- `responsibility_question`
- `person_over_task_question`
- `conflict_question`
- `change_question`
- `scope_reframe_question`
- `blank_page_discovery_question`

**Tests**
- question matches mode
- banned generic prompts absent
- question length and tone checks

**Done when**
- every blank-page mode emits a specific primary question
- generic “tell me more” style prompts are absent

### B2. Add missing-signal typing

**Goal:** every blank-page question should target a specific missing signal.

**Files**
- `buildBlankPagePayload.ts`
- any route debug packet builders

**Deliverables**
- `missing_signal_type`
- optional `topic_candidate`
- `why_not_ready_for_direction`

**Tests**
- topic-only maps to moment/hinge search
- theme-only maps to lived-event conversion
- scope-uncertain maps to scope-reframe
- blank-page maps to discovery

**Done when**
- missing-signal typing is visible in payload/debug

---

## EPIC C — Payload contract and UI integration

### C1. Extend intake payload types

**Goal:** blank-page intake becomes a first-class API mode.

**Files**
- `src/types/intake.ts`

**Deliverables**
- `product_mode = blank_page_intake`
- `blank_page_mode`
- `recovery_question_primary`
- `recovery_question_secondary`
- `recovery_confidence`
- `next_step_type`
- `reassurance_copy`
- `example_answer_shape`
- `what_good_signal_would_look_like`

**Tests**
- type-check and build
- runtime contract validation

**Done when**
- payload compiles cleanly
- all consumers handle optional fields safely

### C2. Render blank-page intake state in UI

**Goal:** user sees a distinct recovery lane, not generic clarification or block.

**Files**
- `src/app/start/page.tsx`
- supporting state/render helpers if needed

**Deliverables**
- blank-page mode UI state
- mode-specific copy
- typed CTA
- answer input state
- too-thin fallback state

**Tests**
- rendering tests
- user-flow tests
- state persistence tests

**Done when**
- UI differentiates blank-page intake from standard clarification
- screen trust remains PASS

---

## EPIC D — Post-answer conversion logic

### D1. Ingest blank-page answers into downstream routing

**Goal:** once the user answers, system can progress intelligently.

**Files**
- first-minute answer handling path
- case state handling
- downstream route decision layer

**Deliverables**
- allowed post-answer routes:
  - `direction_light`
  - second recovery question
  - `clarification`
  - `too_thin_to_recover`

**Tests**
- answer transitions
- no infinite loop
- no premature fake show

**Done when**
- post-answer routing is deterministic
- at least some recoverable cases convert forward correctly

### D2. Add bounded recovery depth

**Goal:** prevent endless blank-page looping.

**Files**
- first-minute session/case state
- answer history logic

**Deliverables**
- max blank-page recovery depth
- escalation rule after second failed recovery attempt

**Tests**
- repeat-answer flow
- escalation behavior
- session/state integrity

**Done when**
- no unbounded loop exists

---

## EPIC E — Telemetry and debug

### E1. Add blank-page telemetry events

**Goal:** make the lane measurable.

**Files**
- telemetry event layer
- analytics binding layer

**Required events**
- `blank_page_mode_assigned`
- `blank_page_question_rendered`
- `blank_page_answer_submitted`
- `blank_page_to_direction_conversion`
- `blank_page_to_second_question`
- `blank_page_to_block`
- `blank_page_abandon`
- `blank_page_continue`

**Required properties**
- `blank_page_mode`
- `missing_signal_type`
- `next_step_type`
- `post_answer_route`
- `source_type` where applicable

**Tests**
- event fires on expected transitions
- event schema validation

**Done when**
- analytics can compute conversion/abandonment by mode

### E2. Add debug observability

**Goal:** make blank-page routing auditable.

**Files**
- debug payload builders
- intake response debug fields

**Deliverables**
- mode detection trace
- trigger signals
- missing-signal type
- route-after-answer

**Done when**
- engineers can inspect why a case hit blank-page mode

---

## EPIC F — Real-input evaluation pack

### F1. Build blank-page evaluation pack

**Goal:** validate primarily on real inputs, not synthetic cases.

**Inputs must be**
- >= 70% `public_internet` or `anonymized_product_input`

**Files**
- evaluation harness directory
- new blank-page runner/report generator

**Required groups**
- topic-only
- theme-only
- activity-only
- scope-uncertain
- blank-page
- weak-topic but recoverable
- truly insufficient

**Deliverables**
- score report
- source composition report
- trust/usefulness review
- route distribution report

**Done when**
- evaluation pack runs end-to-end
- realism threshold is reported and passes

### F2. Add source-governance enforcement

**Goal:** all future testing here uses real-world inputs as primary source.

**Files**
- case schema
- evaluation artifact builder
- source composition reporter

**Deliverables**
- `source_type`
- `source_origin`
- `source_reference`
- `capture_date`
- `transformation_level`
- `adjudication_status`

**Done when**
- no blank-page major test pack is source-blind
- report includes source composition every run

---

## EPIC G — Non-regression and rollout

### G1. Run required tests

**Required**
- `npm run test:nds:evidence-grounding`
- `npm run test:nds:direction-line-fit`
- `npm run test:nds:direction-stability`
- `npm run test:product:screen-trust`
- `npm run test:product:flow-break`
- `npm run test:product:session-state`
- `npm run test:product:real-user-sim`
- `npm test`

**Done when**
- all green

### G2. Controlled rollout

**Goal:** deploy behind narrow route conditions first.

**Deliverables**
- version tag
- rollout note
- prod validation run
- rollback condition

**Done when**
- prod behaves as expected
- no trust regressions observed

---

## 6. Test matrix

### Unit
- mode detection
- question template selection
- missing-signal mapping
- payload typing
- bounded recovery logic

### Integration
- start page renders blank-page state
- answer submission works
- route after answer works

### Product
- screen trust
- flow break
- session/state
- real-user-sim

### Evaluation
- blank-page evaluation pack
- source realism report

---

## 7. Acceptance thresholds

### Functional
- blank-page users no longer get generic block by default
- questions are typed and specific
- some recoverable cases progress to stronger routes

### Trust
- no fake direction inflation
- tone remains dignified
- no rise in brittle over-show

### Product
- real-user-sim PASS
- screen trust PASS
- flow-break PASS
- session/state PASS

### Data
- >= 70% real-input sourced evaluation pack
- source composition reported

---

## 8. Risks

### R1. Generic coaching language
**Mitigation:** banned prompt patterns + review packet

### R2. Fake specificity
**Mitigation:** no direction without sufficient signal + confidence cap

### R3. User loops
**Mitigation:** bounded recovery depth + escalation path

### R4. Synthetic eval distortion
**Mitigation:** real-input corpus policy enforcement

### R5. Live flow regression
**Mitigation:** mandatory real-user-sim and product test reruns

---

## 9. Rollout order

### Step 1
Freeze contract and review gates

### Step 2
Implement detection + mode assignment

### Step 3
Implement question engine

### Step 4
Implement payload + UI

### Step 5
Implement post-answer transitions

### Step 6
Add telemetry/debug

### Step 7
Run real-input eval pack

### Step 8
Run full non-regression suite

### Step 9
Deploy behind narrow conditions

### Step 10
Run prod validation and release review

---

## 10. Required artifacts

Produce:

### Markdown
- `STRUCTURED_BLANK_PAGE_INTAKE_BUILD_BACKLOG_V1.md`

### JSON
- `structured_blank_page_intake_build_backlog_v1.json`

### Supporting
- blank-page evaluation report
- source composition report
- rollout verification report

---

## 11. Final engineering instruction

This backlog must be executed as a typed, bounded, real-input-validated recovery system.

**Not:**
- generic prompting
- vague UX polish
- synthetic benchmark tuning

The standard is:

- explicit modes
- explicit contracts
- explicit gates
- explicit tests
- real-input-first validation
