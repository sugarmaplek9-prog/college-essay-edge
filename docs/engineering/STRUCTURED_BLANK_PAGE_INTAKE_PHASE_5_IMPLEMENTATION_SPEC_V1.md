# STRUCTURED_BLANK_PAGE_INTAKE_PHASE_5_IMPLEMENTATION_SPEC_V1

**College Essay Edge**  
**Phase 5 engineering spec**  
**Telemetry + evaluation harness**

**Status**  
Build-ready implementation spec

**Derived from**  
`STRUCTURED_BLANK_PAGE_INTAKE_V1`  
`STRUCTURED_BLANK_PAGE_INTAKE_IMPLEMENTATION_PLAN_V1`  
`STRUCTURED_BLANK_PAGE_INTAKE_BUILD_BACKLOG_V1`  
`STRUCTURED_BLANK_PAGE_INTAKE_PHASE_1_IMPLEMENTATION_SPEC_V1`  
`STRUCTURED_BLANK_PAGE_INTAKE_PHASE_2_IMPLEMENTATION_SPEC_V1`  
`STRUCTURED_BLANK_PAGE_INTAKE_PHASE_3_IMPLEMENTATION_SPEC_V1`  
`STRUCTURED_BLANK_PAGE_INTAKE_PHASE_4_IMPLEMENTATION_SPEC_V1`  
Completed or planned Backlog Phases 1–4 behavior

---

## Purpose

Phase 5 implements the fifth production-critical layer of Structured Blank-Page Intake:

**make the blank-page lane measurable, auditable, and real-input-validated so engineering can determine whether the lane actually improves user outcomes without introducing hidden trust regressions, synthetic-eval distortion, or uninspectable route behavior.**

Phases 1–4 determine:
- who enters the blank-page lane
- what question gets asked
- how the lane renders
- how post-answer conversion behaves

Phase 5 must determine:
- whether the lane is measurable in production-like use
- whether route behavior is auditable
- whether evaluation is grounded in real public or anonymized product inputs
- whether conversion, abandonment, and fallback rates can be inspected by mode
- whether future testing remains governed by source provenance instead of synthetic drift

This phase is where the system either becomes:
- observable
- diagnosable
- empirically governable
- safe to scale

or remains:
- black-boxy
- benchmark-fragile
- easy to fool with synthetic progress
- impossible to debug when trust erodes

Phase 5 must therefore be:
- explicit
- source-governed
- mode-aware
- metrics-clean
- evaluation-first
- testable

It is not launch policy.  
It is the instrumentation and validation contract for the blank-page lane.

---

# 1. PHASE 5 OBJECTIVE

Implement telemetry, debug observability, and a real-input evaluation harness for Structured Blank-Page Intake such that engineering can:

- measure how often the lane is assigned
- measure what happens after assignment
- inspect route transitions and fallback rates by mode
- audit why the lane behaved as it did for any reviewed case
- validate the lane using a real-input-dominant evaluation pack
- enforce source provenance so future progress cannot be faked by synthetic benchmark drift

At the end of Phase 5, the blank-page lane must be:
- measurable
- inspectable
- source-governed
- evaluation-backed

---

# 2. OUT OF SCOPE FOR PHASE 5

Phase 5 does **not** include:

- final production rollout policy
- feature-flag release governance
- launch communication or premium UX packaging
- broad learned-judgment modeling beyond instrumentation needed for future datasets
- reranker implementation
- unrelated telemetry expansion outside the blank-page lane
- visual redesign work outside what is needed for observability correctness

Phase 5 covers only:

- blank-page telemetry events
- blank-page debug observability completion
- evaluation harness and report generation for the blank-page lane
- real-input source provenance fields
- source composition enforcement and reporting
- blank-page evaluation outputs required for Phase 6 review

---

# 3. REQUIRED FUNCTIONAL OUTCOME

At the end of Phase 5, the system must be able to answer:

- how often did each blank-page mode occur?
- what percentage of blank-page cases converted to `direction_light`?
- how often did they require `second_recovery_question`?
- how often did they fall to `clarification` or `too_thin_to_recover`?
- where do users abandon the lane?
- what source mix was used in evaluation?
- is the evaluation pack majority real-input sourced?
- why did any reviewed case get the route it got?
- are route and conversion patterns acceptable by mode?

That is the mission of Phase 5.

---

# 4. SYSTEM BEHAVIOR CONTRACT

## 4.1 Telemetry contract

Phase 5 must emit telemetry events for the major blank-page lifecycle transitions.

Required events:

- `blank_page_mode_assigned`
- `blank_page_question_rendered`
- `blank_page_answer_submitted`
- `blank_page_to_direction_conversion`
- `blank_page_to_second_question`
- `blank_page_to_clarification`
- `blank_page_to_block`
- `blank_page_abandon`
- `blank_page_continue`

Exact event names may vary if naming conventions require it, but event semantics must remain equivalent.

---

## 4.2 Required telemetry properties

Each event must attach the relevant properties needed for analysis.

Required properties where applicable:

- `blank_page_mode`
- `missing_signal_type`
- `next_step_type`
- `post_answer_route`
- `blank_page_recovery_depth`
- `blank_page_recovery_exhausted`
- `source_type` where evaluation or sampled source context applies
- `question_family_primary`
- `question_family_secondary`
- `selected_template_id`
- `product_mode`

Exact per-event property sets may vary, but these concepts must be available in the measurable system.

---

## 4.3 Debug observability contract

The lane must expose enough debug information so engineering can inspect:

- why a case entered the blank-page lane
- which question family was chosen
- which template was used
- how the user answered
- what post-answer route was chosen
- what recovery depth was active
- why the case did or did not convert forward

This must be possible in local inspection and in the evaluation harness outputs.

---

## 4.4 Evaluation contract

The blank-page lane must have a dedicated evaluation harness that runs on a source-governed case pack and produces, at minimum:

- score report
- source composition report
- route distribution report
- trust/usefulness review summary

This harness must support the required blank-page groups and must report source provenance on every run.

---

# 5. TELEMETRY EVENT REQUIREMENTS

## 5.1 `blank_page_mode_assigned`

Fire when a case is routed into blank-page intake.

Must capture:
- assigned mode
- trigger signals if available
- top-level route
- confidence if available

Purpose:
- quantify lane entry by mode
- monitor assignment drift over time

---

## 5.2 `blank_page_question_rendered`

Fire when the blank-page recovery prompt is shown.

Must capture:
- mode
- question family
- template id
- support field presence map if helpful

Purpose:
- confirm actual render exposure
- connect prompt design to downstream performance

---

## 5.3 `blank_page_answer_submitted`

Fire when the user submits an answer inside the blank-page lane.

Must capture:
- mode
- question family
- recovery depth
- answer length bucket or equivalent bounded non-sensitive metric if policy allows
- next evaluation state if available

Purpose:
- measure engagement and progression

---

## 5.4 `blank_page_to_direction_conversion`

Fire when a blank-page answer converts to `direction_light`.

Must capture:
- mode
- recovery depth
- recovered signal summary or normalized category
- route reason category

Purpose:
- measure successful forward recovery

---

## 5.5 `blank_page_to_second_question`

Fire when a submitted answer leads to a second recovery question.

Must capture:
- prior mode
- prior question family
- new question family if selected
- recovery depth
- route reason category

Purpose:
- monitor bounded repeat questioning and detect overuse

---

## 5.6 `blank_page_to_clarification`

Fire when a blank-page case exits into clarification after answer review.

Must capture:
- mode
- recovery depth
- route reason category

Purpose:
- measure when recovery meaningfully helps but does not justify direct narrative movement

---

## 5.7 `blank_page_to_block`

Fire when a blank-page case ends in bounded fallback / unrecoverable stop.

Must capture:
- mode
- recovery depth
- exhaustion flag
- route reason category

Purpose:
- monitor failure modes and prevent hidden lane collapse

---

## 5.8 `blank_page_abandon`

Fire when a user enters the lane but exits or times out without continuing where measurement policy allows.

Must capture:
- mode
- last visible state
- whether a question was rendered
- whether any draft input existed if policy allows non-sensitive bounded capture

Purpose:
- measure abandonment by mode and surface friction points

---

## 5.9 `blank_page_continue`

Fire when the user continues product interaction after a successful or bounded recovery step.

Purpose:
- measure whether the lane supports forward movement rather than stagnation

---

# 6. DEBUG OBSERVABILITY REQUIREMENTS

## 6.1 Required debug surface

Engineering must be able to inspect, for any reviewed case:

- `blank_page_mode`
- `blank_page_trigger_signals`
- `question_family_primary`
- `question_family_secondary`
- `selected_template_id`
- `missing_signal_type`
- `why_not_ready_for_direction`
- `blank_page_recovery_depth`
- `blank_page_recovery_exhausted`
- `post_answer_route`
- `post_answer_route_reason`
- `recovered_signal_summary`

These may appear in:
- route debug payloads
- structured logs
- evaluation reports
- local inspection tools

---

## 6.2 Auditability requirement

Engineering must be able to reconstruct the blank-page path for a reviewed case from:
- assignment
- render
- answer submission
- route resolution

This reconstruction must not require guesswork.

---

# 7. EVALUATION HARNESS REQUIREMENTS

## 7.1 Required evaluation groups

The blank-page evaluation pack must include at least these groups:

- `topic_only`
- `theme_only`
- `activity_only`
- `scope_uncertain`
- `blank_page`
- `weak_topic_but_recoverable`
- `truly_insufficient`

Additional groups may be added later, but these are the required baseline.

---

## 7.2 Required evaluation outputs

Every run must produce:

- score report
- source composition report
- route distribution report
- trust/usefulness review summary

Optional but recommended:
- failure bucket summary
- mode confusion summary
- second-question overuse summary

---

## 7.3 Evaluation dimensions

At minimum, the harness must assess:

- correct lane assignment
- correct mode assignment
- question appropriateness
- route-after-answer appropriateness
- forward recovery usefulness
- overblocking / too-thin inflation
- fake-forward inflation
- user-trust quality of the lane

Exact scoring schema may be implemented in a separate evaluation artifact, but these dimensions must be represented.

---

# 8. SOURCE GOVERNANCE REQUIREMENTS

## 8.1 Real-input dominance policy

The blank-page evaluation pack must be primarily grounded in real inputs.

Required baseline:
- at least **70%** of major evaluation cases must be `public_internet` or `anonymized_product_input`

Synthetic cases may still exist for edge coverage, but must not dominate the pack.

---

## 8.2 Required provenance fields

Every evaluation case must carry:

- `source_type`
- `source_origin`
- `source_reference`
- `capture_date`
- `transformation_level`
- `adjudication_status`

These fields must be present in the case schema or evaluation artifact builder.

---

## 8.3 Legacy synthetic case handling

Legacy synthetic packs must be:
- tagged explicitly
- excluded from claims of real-world readiness
- separable in reports

Synthetic cases may be useful for regression coverage, but they must not silently function as primary evidence.

---

## 8.4 Source composition reporting

Every major evaluation run must report:
- total case count
- case count by source type
- percent of real-input sourced cases
- percent of synthetic cases
- whether real-input threshold passed

This report is mandatory.

---

# 9. IMPLEMENTATION REQUIREMENTS

## 9.1 Files in scope

Likely required files:

- telemetry event layer
- analytics binding layer
- debug payload builders
- intake response debug fields
- evaluation harness directory
- blank-page runner/report generator
- case schema
- evaluation artifact builder
- source composition reporter

Possible recommended new files:
- `src/lib/telemetry/blankPageEvents.ts`
- `src/lib/evals/blankPage/runBlankPageEval.ts`
- `src/lib/evals/blankPage/buildBlankPageReport.ts`
- `src/lib/evals/blankPage/sourceCompositionReport.ts`
- `src/lib/evals/schema/blankPageCaseSchema.ts`

Exact file placement may vary by repo structure, but the responsibilities must exist.

---

## 9.2 Architecture requirement

Phase 5 must keep the following concerns separated:

- telemetry event emission
- debug payload generation
- evaluation case schema
- evaluation runner
- report generation
- source composition enforcement

Do not bury evaluation logic inside UI code or route handlers.

---

## 9.3 Data minimization and bounded capture

Telemetry and debug fields must remain disciplined.

Allowed:
- route/mode/state metadata
- bounded answer metrics if policy allows
- normalized summaries used for engineering review

Not allowed:
- uncontrolled raw sensitive capture in analytics without policy approval
- bloated event payloads that are not reviewable
- provenance fields omitted because they are inconvenient

---

# 10. REPORTING REQUIREMENTS

## 10.1 Score report

Must summarize:
- major scoring dimensions
- pass/fail thresholds if defined
- case-level or bucket-level outcomes

---

## 10.2 Route distribution report

Must summarize at least:
- lane assignment counts by mode
- post-answer route counts
- conversion to `direction_light`
- use of `second_recovery_question`
- clarification rate
- too-thin fallback rate
- abandonment rate where measurable

---

## 10.3 Source composition report

Must summarize:
- case count by source type
- percentage real-input sourced
- threshold pass/fail
- synthetic tag visibility

---

## 10.4 Trust/usefulness review summary

Must summarize:
- whether the lane feels helpful rather than generic
- whether route behavior feels disciplined
- whether any mode is collapsing into poor or repetitive behavior

This may combine structured reviewer judgment with evaluation outputs.

---

# 11. TEST PLAN

## 11.1 Telemetry tests

Must verify:
- required events fire on expected transitions
- event schema is valid
- required properties are present
- event misfires do not occur on unrelated paths

---

## 11.2 Debug observability tests

Must verify:
- required debug fields are present
- route traces can be inspected end-to-end
- missing fields fail visibly rather than silently disappearing

---

## 11.3 Evaluation harness tests

Must verify:
- evaluation runner executes end-to-end
- required groups are represented
- reports generate successfully
- source composition output is produced every run

---

## 11.4 Source-governance tests

Must verify:
- provenance fields are required in case schema
- source composition thresholds are computed correctly
- synthetic-only or source-blind packs are flagged

---

## 11.5 Product tests

Must rerun:

- `npm run test:product:screen-trust`
- `npm run test:product:flow-break`
- `npm run test:product:session-state`
- `npm run test:product:real-user-sim`

---

## 11.6 NDS regressions

Must rerun:

- `npm run test:nds:evidence-grounding`
- `npm run test:nds:direction-line-fit`
- `npm run test:nds:direction-stability`

---

## 11.7 Full regression

- `npm test`

---

## 11.8 Build verification

- `npm run build`

---

# 12. ACCEPTANCE CRITERIA

Phase 5 is complete only if all of the following are true.

## Telemetry
- required blank-page events fire correctly
- event payloads are useful and bounded
- conversion/fallback/abandonment can be computed by mode

## Debuggability
- route traces are inspectable end-to-end
- engineering can reconstruct reviewed cases without guesswork

## Evaluation
- blank-page eval pack runs end-to-end
- required groups are represented
- reports generate cleanly

## Source governance
- provenance fields are enforced
- source composition is reported every major run
- real-input threshold passes for the major pack

## Product safety
- required product and NDS regression suites remain green
- instrumentation does not destabilize the live path

---

# 13. FAILURE CONDITIONS

Phase 5 fails if:

- required telemetry events do not fire or are not analyzable
- debug observability is incomplete
- evaluation runs without source composition reporting
- source provenance fields are missing
- synthetic packs can masquerade as primary real-world evidence
- route distribution cannot be computed by mode
- instrumentation causes product regressions
- engineering cannot explain observed blank-page behavior using the instrumentation

---

# 14. REVIEW GATE FOR PHASE 5

Before proceeding to Phase 6, engineering must present:

- telemetry schema and example events
- debug trace example for at least one reviewed case per major mode
- blank-page evaluation report
- source composition report
- route distribution report
- trust/usefulness review summary
- product and regression test results
- evidence that the major evaluation pack passes real-input threshold

Phase 6 may begin only after this review passes.

---

# 15. REQUIRED ARTIFACTS

Produce:

## Markdown
- `STRUCTURED_BLANK_PAGE_INTAKE_PHASE_5_IMPLEMENTATION_SPEC_V1.md`

## JSON
- `structured_blank_page_intake_phase_5_implementation_spec_v1.json`

## Required supporting artifacts
- blank-page evaluation report
- source composition report
- route distribution report

## Optional supporting artifact
A Phase 5 observability review packet with:
- event examples
- debug trace examples
- report excerpts
- reviewer notes on measurement quality

---

# 16. BUILD SUMMARY

Phase 5 is where Structured Blank-Page Intake stops being merely implemented and becomes governable.

If this phase is weak, the system may:
- seem to work
- pass a few tests
- but remain impossible to measure or trust at scale

If this phase is strong, Phase 6 can safely focus on:
- controlled rollout
- production validation
- release review

So the standard for Phase 5 is simple:

**make the blank-page lane measurable, auditable, and real-input-validated so progress is real and failures are visible.**