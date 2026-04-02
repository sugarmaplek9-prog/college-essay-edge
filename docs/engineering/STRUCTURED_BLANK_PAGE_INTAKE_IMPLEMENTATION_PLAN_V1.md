# STRUCTURED_BLANK_PAGE_INTAKE_IMPLEMENTATION_PLAN_V1

**Product:** College Essay Edge  
**Status:** Build plan for first production blank-page intake lane  
**Date:** 2026-03-17

## 0. Document role

This document is the build plan for `STRUCTURED_BLANK_PAGE_INTAKE_V1`.

It is **not** the product concept spec.  
It is the engineering execution contract for shipping the first production version of blank-page intake safely.

This document defines:

- system boundary
- implementation units
- file-level change areas
- payload contracts
- telemetry
- review gates
- test plan
- rollout sequence
- exit criteria

---

## 1. Objective

Implement a dedicated first-minute intake lane for users who are not ready for standard NDS because they currently have:

- only a topic
- only a theme
- only an activity
- only uncertainty about whether something “says enough”
- no story yet

The system must:

- detect this state
- avoid fake direction generation
- ask structured, typed recovery questions
- preserve dignity and forward motion
- convert recoverable users into stronger downstream NDS readiness

---

## 2. Success definition

Version 1 is successful only if all of the following are true.

### Product behavior

- blank-page and topic-only users are routed into `blank_page_intake` instead of generic block
- recovery questions are typed and specific, not generic filler
- users can move from blank-page intake into a stronger follow-up path
- hard block is reserved for truly unrecoverable cases

### Quality

- no fake-premium direction inflation appears
- no broad show-behavior inflation appears
- trust language remains strong
- clarification usefulness improves on blank-page-like inputs

### Verification

- blank-page evaluation set passes its thresholds
- real-user-sim remains PASS
- existing live route gains do not regress
- standard hardened tests remain green

---

## 3. System boundary

### Included in this implementation

- blank-page detection
- blank-page mode assignment
- structured recovery question generation
- typed payload response
- UI rendering for blank-page intake
- follow-up routing after answer
- telemetry and debug signals
- dedicated evaluation pack and release gate

### Explicitly excluded from this implementation

- broad NDS reranking changes
- broad candidate-generation rewrites outside the blank-page lane
- new learned models
- major UI redesign outside affected first-minute screens
- broad intake gate recalibration unrelated to blank-page flows

---

## 4. Input classes covered in V1

V1 must explicitly support these classes:

- `topic_only`
- `theme_only`
- `activity_only`
- `scope_uncertain`
- `blank_page`
- `too_thin_to_recover`

The classifier may use internal signal features, but externally the response must resolve to one of the product modes:

- `topic_probe`
- `theme_probe`
- `activity_probe`
- `scope_reframe`
- `blank_page_discovery`
- `too_thin_to_recover`

---

## 5. Review gates

MIT-style system work uses explicit review gates instead of “ship when it feels done.” This implementation will use the following gates: requirement freeze and behavior contract review before coding, definition review after payload/UI/telemetry flow-down is complete, preliminary design review before prod flagging, and release readiness review after evaluation and regressions are green.

### Gate 1 — Requirements freeze review

**Entry:**
- `STRUCTURED_BLANK_PAGE_INTAKE_V1` approved
- this implementation plan approved

**Exit:**
- mode taxonomy frozen
- payload contract frozen
- telemetry event names frozen
- evaluation metrics frozen

### Gate 2 — Definition review

**Entry:**
- file-level design complete
- state transitions mapped
- API fields defined
- UI states defined

**Exit:**
- implementation authorized

### Gate 3 — Preliminary design review

**Entry:**
- code complete behind flag
- unit/integration tests passing
- local evaluation pack run complete

**Exit:**
- prod shadow/limited rollout authorized

### Gate 4 — Release readiness review

**Entry:**
- blank-page evaluation pass
- live-path non-regression pass
- real-user-sim pass
- product trust checks pass

**Exit:**
- production enablement authorized

---

## 6. Implementation work packages

### WP-A — Detection and mode assignment

Implement a blank-page detector that runs before normal direction generation and assigns:

- `ready_for_nds`
- `needs_structured_blank_page_intake`
- `true_block`

If `needs_structured_blank_page_intake`, assign one of the blank-page modes.

**Required files**
- `src/lib/ml/evidenceStrength/features.ts`
- `src/lib/ml/evidenceStrength/model.ts`
- any route-decision or intake orchestration layer currently deciding blocked / clarification / direction_light

**Required outputs**
- `blank_page_intake_detected`
- `blank_page_mode`
- `blank_page_trigger_signals`
- `blank_page_recovery_reason`
- `blank_page_confidence`

**Acceptance**
- each supported input class maps correctly in unit tests
- existing non-blank-page routing does not regress materially

### WP-B — Structured recovery question engine

Implement typed recovery question generation by mode.

**Required question families**
- `moment_question`
- `hinge_question`
- `responsibility_question`
- `person_over_task_question`
- `conflict_question`
- `change_question`
- `scope_reframe_question`
- `blank_page_discovery_question`

**Required files**
- `src/lib/fm/buildClarificationPayload.ts`
- new helper file if needed for question template selection
- prompt/template constants layer if applicable

**Rules**
- no generic “tell me more”
- no abstract trait-only prompts
- no fake direction claims
- question must target the missing signal type

**Acceptance**
- every blank-page mode returns a mode-matched primary question
- banned generic prompts are absent in snapshot review
- question text remains concise and non-robotic

### WP-C — Payload contract and type system

Implement the blank-page response payload as a typed first-class contract.

**Required payload fields**
- `product_mode = blank_page_intake`
- `blank_page_mode`
- `why_not_ready_for_direction`
- `recovery_question_primary`
- `recovery_question_secondary` optional
- `missing_signal_type`
- `topic_candidate` optional
- `recovery_confidence`
- `next_step_type`
- `reassurance_copy` optional
- `example_answer_shape` optional
- `what_good_signal_would_look_like` optional

**Required files**
- `src/types/intake.ts`
- any API serializer or response builder touched by intake session output

**Acceptance**
- type definitions compile cleanly
- payload is present in local and prod API responses
- consumers do not break on missing optional fields

### WP-D — UI rendering and state handling

Render the blank-page intake state in the first-minute UI without collapsing into generic blocked or clarification visuals.

**Required UI behavior**
- user sees they are not blocked
- user is told the topic may still work
- user sees one primary recovery question
- optional secondary path only if intentionally designed
- CTA language must indicate progress toward finding the story center

**Required files**
- `src/app/start/page.tsx`
- related page/state components for first-minute flow
- any local state or reducer file for first-minute case state

**Required states**
- blank-page intake initial
- answer submitted
- follow-up conversion result
- too-thin-to-recover fallback

**Acceptance**
- no route confusion between normal clarification and blank-page intake
- UI copy reflects mode-specific state
- screen trust audit remains PASS

### WP-E — Post-answer conversion logic

After a user answers the blank-page recovery question, route them intelligently.

**Allowed outcomes**
- `direction_light`
- second structured recovery question
- `clarification`
- `too_thin_to_recover`

**Rules**
- do not loop indefinitely
- do not upgrade to direction without enough signal
- if signal resolves the missing center, candidate generation must receive the answer in a usable form

**Required files**
- first-minute state transition layer
- answer-ingestion path
- any NDS-prep normalization touched by follow-up input

**Acceptance**
- answer transitions are deterministic
- post-answer route is explainable in debug output
- blank-page to direction conversion can be measured

### WP-F — Telemetry and observability

Implement a dedicated telemetry layer for this product path.

**Required events / counters**
- `blank_page_mode_assigned`
- `blank_page_question_rendered`
- `blank_page_answer_submitted`
- `blank_page_to_direction_conversion`
- `blank_page_to_second_question`
- `blank_page_to_block`
- `blank_page_abandon`
- `blank_page_continue`

**Required properties**
- `source_type`
- `blank_page_mode`
- `missing_signal_type`
- `next_step_type`
- `post_answer_route`

**Acceptance**
- events visible in logs/analytics
- event schema versioned
- enough telemetry exists to compute conversion and abandonment by mode

### WP-G — Real-input evaluation pack

All future blank-page testing must use real-input-first corpora.

**Required corpus composition**
- at least 70% `public_internet` or `anonymized_product_input`
- no more than 30% `legacy_internal_synthetic`

**Required metadata per case**
- `source_type`
- `source_origin`
- `source_reference`
- `capture_date`
- `transformation_level`
- `adjudication_status`

**Required evaluation groups**
- topic-only
- theme-only
- activity-only
- scope-uncertain
- blank-page
- weak-topic but recoverable
- truly insufficient

**Required outputs**
- blank-page score report
- source composition section
- trust/usefulness review section
- route distribution section

**Acceptance**
- evaluation pack exists
- source composition reported
- realism threshold met

---

## 7. File-level change map

### Core logic
- `src/lib/ml/evidenceStrength/features.ts`
- `src/lib/ml/evidenceStrength/model.ts`

### First-minute payload builders
- `src/lib/fm/buildClarificationPayload.ts`
- new `src/lib/fm/buildBlankPagePayload.ts` recommended
- `src/lib/fm/buildLightDirectionPayload.ts` only if downstream conversion needs explicit support

### Types / contracts
- `src/types/intake.ts`
- any first-minute case-state types

### UI
- `src/app/start/page.tsx`
- any supporting components for intake state rendering

### Tests
- `src/__tests__/unit/evidence-routing.spec.ts`
- new blank-page unit tests
- product-flow and real-user-sim fixtures updated with blank-page cases

### Evaluation / scripts
- add blank-page evaluation runner under the existing evaluation harness structure
- add source-composition reporting to the artifact

---

## 8. Required tests

### Unit tests
Must verify:
- mode assignment by input type
- banned generic prompts do not appear
- payload contract completeness
- post-answer route transitions
- too-thin fallback behavior

### Integration tests
Must verify:
- first-minute page renders blank-page intake correctly
- answer submission updates state correctly
- downstream route receives clarified signal

### Product tests
Must rerun:
- `npm run test:product:screen-trust`
- `npm run test:product:flow-break`
- `npm run test:product:session-state`
- `npm run test:product:real-user-sim`

### NDS regressions
Must rerun:
- `npm run test:nds:evidence-grounding`
- `npm run test:nds:direction-line-fit`
- `npm run test:nds:direction-stability`

### Full regression
- `npm test`

---

## 9. Acceptance thresholds

The implementation is not complete unless:

### Blank-page specific
- unnecessary hard-blocking on blank-page-like inputs decreases materially
- blank-page questions are mode-specific
- at least some topic-only / scope-uncertain inputs convert to stronger downstream readiness
- no fake direction inflation appears

### Product quality
- real-user-sim remains PASS
- screen trust remains PASS
- flow-break remains PASS
- session/state remains PASS

### Data quality
- evaluation artifact reports source composition
- real-input share is at least 70%

---

## 10. Risks and mitigations

### Risk 1 — generic self-help UX
**Mitigation:**
- typed modes
- banned generic prompts
- review packet for question quality

### Risk 2 — false direction inflation
**Mitigation:**
- keep direction generation separate from blank-page intake
- explicit confidence cap
- no upgrade to show without sufficient signal

### Risk 3 — endless question loop
**Mitigation:**
- maximum structured recovery depth
- explicit escalation path after second attempt

### Risk 4 — synthetic benchmark distortion
**Mitigation:**
- enforce real-input corpus policy
- report source composition in every artifact

### Risk 5 — product flow regression
**Mitigation:**
- mandatory rerun of real-user-sim, flow-break, screen-trust, session/state tests

---

## 11. Rollout sequence

### Phase 1
Local implementation behind flag

### Phase 2
Local evaluation pack + unit/integration tests

### Phase 3
Prod deploy behind narrow route condition

### Phase 4
Prod ladder / blank-page evaluation rerun

### Phase 5
Release readiness review

---

## 12. Required artifacts

### Markdown
- `STRUCTURED_BLANK_PAGE_INTAKE_IMPLEMENTATION_PLAN_V1.md`

### JSON
- `structured_blank_page_intake_implementation_plan_v1.json`

### Supporting outputs
- blank-page evaluation artifact
- source realism report
- rollout verification report

---

## 13. Exit decision

### PASS
- blank-page path works as designed
- real-input evaluation passes thresholds
- trust and non-regression tests remain green

### PARTIAL
- path works technically but conversion/helpfulness not yet strong enough
- may continue only with narrowly scoped follow-on sprint

### FAIL
- generic questions dominate
- trust regresses
- product loops users without progress
- real-user-sim or trust stack regresses
- evaluation still relies too heavily on synthetic cases

---

## 14. Final engineering instruction

Build this as a narrow, typed, auditable first-minute system, not as a vague “better prompting” effort.

The standard is:

- clear mode detection
- typed recovery questions
- explicit payload contract
- real-input-first evaluation
- review gates
- non-regression discipline
