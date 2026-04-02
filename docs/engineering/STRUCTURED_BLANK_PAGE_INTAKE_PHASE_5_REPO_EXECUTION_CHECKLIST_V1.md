# STRUCTURED_BLANK_PAGE_INTAKE_PHASE_5_REPO_EXECUTION_CHECKLIST_V1

**College Essay Edge**  
**Phase 5 repo execution checklist**  
**Telemetry + evaluation harness**

**Status**  
Engineer-facing execution checklist

**Derived from**  
`STRUCTURED_BLANK_PAGE_INTAKE_PHASE_5_IMPLEMENTATION_SPEC_V1.md`  
`STRUCTURED_BLANK_PAGE_INTAKE_BUILD_BACKLOG_V1`  
Completed Backlog Phases 1–4 implementation

---

## Objective

Implement **Backlog Phase 5: Telemetry + evaluation harness** for Structured Blank-Page Intake.

At the end of this phase, the blank-page lane must be:

- **measurable**: telemetry events fire for all key transitions
- **inspectable**: debug traces reconstruct reviewed cases without guesswork
- **source-governed**: provenance fields prevent synthetic benchmark drift
- **evaluation-backed**: real-input-dominant pack validates the lane
- **auditable**: engineering can explain route behavior for any case

---

## Build order in VS Code

### Step 1 — Review Phase 5 telemetry contract before coding
Open and inspect:

- Phase 5 implementation spec (STRUCTURED_BLANK_PAGE_INTAKE_PHASE_5_IMPLEMENTATION_SPEC_V1.md)
- existing telemetry infrastructure (event naming, payload structure, sinks)
- any event schema or protobuf definitions
- debug trace or logging infrastructure
- evaluation harness locations and input format
- real-input source composition fields if they exist

Confirm:

- event naming convention (e.g., `blank_page_*`)
- required telemetry events and their payloads
- how events are routed to storage/analysis
- debug trace depth requirements
- evaluation pack input format
- what "real input" source composition means for this product

Do not code until this contract is mapped.

---

### Step 2 — Define telemetry event schema
Recommended file:

- `src/lib/blank-page/telemetry.ts` or extend existing telemetry module

Define event types:

**blank_page_lane_assigned**

- fired when: Phase 1 classifies into a blank-page mode
- fields:
  - `blank_page_mode`
  - `detection_confidence`
  - `trigger_signals` (which signals fired)
  - `user_id` (anonymized)
  - `session_id`
  - `timestamp`

**blank_page_recovery_question_shown**

- fired when: Phase 2 question is delivered to user
- fields:
  - `blank_page_mode`
  - `recovery_question_family`
  - `missing_signal_type`
  - `attempt_number` (1 or 2)
  - `recovery_confidence`
  - `session_id`
  - `timestamp`

**blank_page_answer_submitted**

- fired when: user submits a recovery answer
- fields:
  - `blank_page_mode`
  - `attempt_number`
  - `answer_length` (characters, not semantics to preserve privacy)
  - `answer_quality_score`
  - `time_to_answer` (seconds)
  - `session_id`
  - `timestamp`

**blank_page_route_decision_made**

- fired when: Phase 4 routing decision is made
- fields:
  - `blank_page_mode`
  - `post_answer_route` (`DIRECTION_LIGHT`, `SECOND_RECOVERY_QUESTION`, `CLARIFICATION`, `TOO_THIN_TO_RECOVER`)
  - `routing_confidence`
  - `depth_exhausted`
  - `session_id`
  - `timestamp`

**blank_page_lane_abandoned**

- fired when: user leaves blank-page lane mid-flow
- fields:
  - `blank_page_mode`
  - `stage` (`initial_question`, `post_first_recovery`, `post_second_recovery`)
  - `time_in_lane` (seconds)
  - `session_id`
  - `timestamp`

Requirements:

- all events include `session_id` for tracing
- all events include `timestamp` for temporal analysis
- all events avoid storing full text (privacy)
- all events are structured and parseable

Done when:

- event schema is defined in code
- all required events are listed
- type definitions exist for each event

---

### Step 3 — Add debug trace infrastructure
Recommended file:

- `src/lib/blank-page/debugTrace.ts`

Purpose:

- collect full trace of blank-page decisions for reviewed cases
- include all intermediate steps, inputs, and outputs
- enable audit trail reconstruction

Trace should capture:

For each case:
- initial detection signals and classification
- Phase 1 mode assignment (with confidence)
- Phase 2 question selection (question family, missing signal)
- Phase 3 rendering (if applicable)
- Phase 4 answer evaluation (quality score, signals recovered)
- Phase 4 routing decision (route type, confidence, depth)
- final outcome (direction/clarification/too_thin/abandoned)

Structure:

```typescript
interface BlankPageDebugTrace {
  session_id: string
  trace_id: string
  created_at: timestamp
  phase1: {
    mode_assigned: BlankPageMode
    confidence: number
    trigger_signals: string[]
  }
  phase2: {
    question_family: RecoveryQuestionFamily
    missing_signal_type: MissingSignalType
    primary_question: string
    secondary_question?: string
    confidence: number
  }
  phase4?: {
    attempt_number: number
    answer: string (redacted/hashed for privacy)
    quality_score: number
    route_type: PostAnswerRouteType
    routing_confidence: number
  }
  final_outcome: {
    route: PostAnswerRouteType | 'abandoned'
    timestamp: timestamp
  }
}
```

Requirements:

- traces are immutable (build, don't mutate)
- traces include all inputs and outputs
- traces respect privacy (no full text storage, hash/redact as needed)
- traces can be serialized to JSON for storage

Done when:

- trace structure is defined
- helper functions exist to append events to traces
- at least one test case produces a complete trace

---

### Step 4 — Emit telemetry events throughout the blank-page lifecycle
Modify:

- `src/lib/blank-page/classification.ts` → emit `blank_page_lane_assigned`
- `src/lib/blank-page/selectRecoveryQuestion.ts` → emit `blank_page_recovery_question_shown`
- `src/app/api/intake/submit-recovery-answer/route.ts` → emit `blank_page_answer_submitted`
- `src/lib/blank-page/makePostAnswerRoutingDecision.ts` → emit `blank_page_route_decision_made`
- Phase 3 / session handling → emit `blank_page_lane_abandoned` when applicable

Requirements:

- every event includes correct fields as per schema
- events fire synchronously (don't block user flow)
- event emission is testable (inject mock event sink)
- all events are non-breaking if telemetry backend is unreachable

Done when:

- telemetry events fire for all major transitions
- test mocks confirm expected events are emitted

---

### Step 5 — Add source composition tracking
Recommended location:

- extend `BlankPageDebugTrace` with `source_provenance` field
- add to evaluation input schema

Structure:

```typescript
interface SourceProvenance {
  case_type: 'real_user' | 'synthetic_benchmark' | 'manual_test'
  source_id: string (identifier for the source corpus/benchmark)
  created_date: date
}
```

Requirements:

- every evaluated case includes provenance
- synthetic cases are marked as such (never mixed with real-user eval)
- real-user source is documented (where did this input come from?)
- evaluation reports can break down by source type

Done when:

- provenance is tracked on all incoming cases
- evaluation harness enforces source classification

---

### Step 6 — Build evaluation harness
Recommended file:

- `scripts/run-blank-page-evaluation.ts`

Purpose:

- load evaluation input pack
- run cases through blank-page lane
- capture outputs and trace data
- generate reports

The script should:

1. load input cases (JSON or CSV)
2. for each case:
   - run through Phase 1 classification
   - if blank-page, run through Phase 2 question selection
   - simulate answer submission
   - run through Phase 4 routing
   - record trace and outcome
3. aggregate results by:
   - blank-page mode
   - post-answer route
   - source type (real vs synthetic)
4. generate reports (see Step 7)

Done when:

- script runs against evaluation input pack
- traces are captured for all cases
- output is structured for report generation

---

### Step 7 — Build evaluation reports
Recommended files:

- `scripts/generate-blank-page-reports.ts`

Generate three required reports:

**1. blank-page-score-report.json**

```json
{
  "report_id": "blank_page_eval_v1_20260318",
  "generated_at": "2026-03-18T...",
  "evaluation_pack": "blank_page_eval_pack_v1",
  "summary": {
    "total_cases": 150,
    "blank_page_assigned": 120,
    "assignment_rate": 0.80,
    "average_recovery_confidence": 0.72,
    "average_routing_confidence": 0.68
  },
  "by_mode": {
    "scope_anxiety": {
      "count": 40,
      "recovery_rate": 0.75,
      "avg_recovery_confidence": 0.70,
      "post_answer_routes": {
        "DIRECTION_LIGHT": 20,
        "SECOND_RECOVERY_QUESTION": 12,
        "CLARIFICATION": 6,
        "TOO_THIN_TO_RECOVER": 2
      }
    }
    // ... more modes
  },
  "by_source": {
    "real_user": { /* stats */ },
    "synthetic_benchmark": { /* stats */ }
  }
}
```

**2. blank-page-source-composition-report.json**

```json
{
  "report_id": "blank_page_source_v1_20260318",
  "evaluation_pack": "blank_page_eval_pack_v1",
  "source_breakdown": {
    "real_user": {
      "count": 100,
      "percentage": 67,
      "sources": ["essay_intake_2026q1", "user_study_batch_2"]
    },
    "synthetic_benchmark": {
      "count": 50,
      "percentage": 33,
      "sources": ["synthetic_blank_page_v1"]
    }
  },
  "concerns": [],
  "real_input_threshold_met": true
}
```

**3. blank-page-route-distribution-report.json**

```json
{
  "report_id": "blank_page_routes_v1_20260318",
  "evaluation_pack": "blank_page_eval_pack_v1",
  "route_distribution": {
    "DIRECTION_LIGHT": {
      "count": 68,
      "percentage": 45,
      "average_confidence": 0.75,
      "by_mode": { /* breakdown */ }
    },
    // ... other routes
  },
  "transition_safety": {
    "fake_forward_count": 0,
    "loop_count": 0,
    "loop_prevention_success_rate": 1.0
  }
}
```

Done when:

- all three reports generate without errors
- reports populate with real data from evaluation run
- reports can be consumed by Phase 6 review

---

### Step 8 — Add observability review packet (optional but recommended)
Recommended file:

- `docs/engineering/STRUCTURED_BLANK_PAGE_INTAKE_PHASE_5_OBSERVABILITY_REVIEW_PACKET_V1.md`

Include:

- sample telemetry events
- sample debug trace (one full case walkthrough)
- report excerpts
- signal quality observations
- measurement concerns (if any)
- reviewer notes

Done when:

- packet is readable by non-engineers
- all key observability points are illustrated
- concerns and limitations are noted

---

### Step 9 — Add unit tests for telemetry and tracing
Recommended file:

- `src/__tests__/unit/blank-page-telemetry.spec.ts`

Test coverage:

- all telemetry events emit correctly
- trace captures full case lifecycle
- source provenance is enforced
- reports generate with expected shape
- real-input threshold computation is correct

Done when:

- tests pass
- telemetry code is >80% covered

---

### Step 10 — Regression testing
Run:

```bash
npm test
npm run test:product:screen-trust
npm run test:product:flow-break
npm run test:product:session-state
npm run test:product:real-user-sim
npm run test:nds:evidence-grounding
npm run test:nds:direction-line-fit
npm run test:nds:direction-stability
npm run build
```

Acceptance criteria:

- all tests pass
- no regressions in prior phases
- instrumentation does not destabilize the live path

Done when:

- `npm test` shows ≥ 294 passing tests
- all test categories pass

---

### Step 11 — Run evaluation harness end-to-end
Commands:

```bash
npx tsx scripts/run-blank-page-evaluation.ts
npx tsx scripts/generate-blank-page-reports.ts
```

Acceptance criteria:

- evaluation completes without errors
- all three reports generate successfully
- reports show real input dominant (>50% real or preapproved synthetic)
- conversion rates are sensible
- no artificial inflation in route confidences

Done when:

- reports exist and are populated
- Phase 5 delivery is ready for Phase 6 review

---

## Summary

Phase 5 is complete when:

- ✅ telemetry event schema defined (6+ events)
- ✅ debug trace infrastructure implemented
- ✅ telemetry events emit throughout blank-page lifecycle
- ✅ source provenance is tracked and enforced
- ✅ evaluation harness runs end-to-end
- ✅ three required reports generate successfully
- ✅ telemetry and tracing tests pass
- ✅ regression suite remains green (all product/NDS tests pass)
- ✅ `npm run build` completes without errors
- ✅ real-input threshold is met (>50% real or preapproved synthetic)

Phase 5 fails if:

- telemetry events are missing or malformed
- debug traces cannot reconstruct case behavior
- source provenance is not enforced
- evaluation reports are incomplete or malformed
- real-input threshold is not met
- product or NDS regressions emerge
- instrumentation crashes or blocks user flow

---

## Artifacts required for Phase 6 handoff

- `STRUCTURED_BLANK_PAGE_INTAKE_PHASE_5_IMPLEMENTATION_SPEC_V1.md` (reference for contract)
- `STRUCTURED_BLANK_PAGE_INTAKE_PHASE_5_REPO_EXECUTION_CHECKLIST_V1.md` (this file)
- Unit test file: `src/__tests__/unit/blank-page-telemetry.spec.ts`
- `docs/engineering/STRUCTURED_BLANK_PAGE_INTAKE_PHASE_5_OBSERVABILITY_REVIEW_PACKET_V1.md` (optional)
- Evaluation reports:
  - `evaluation_outputs/blank_page_phase5_eval_v1/blank-page-score-report.json`
  - `evaluation_outputs/blank_page_phase5_eval_v1/blank-page-source-composition-report.json`
  - `evaluation_outputs/blank_page_phase5_eval_v1/blank-page-route-distribution-report.json`
- Phase 5 delivery summary documenting instrumentation, events, and evaluation results
