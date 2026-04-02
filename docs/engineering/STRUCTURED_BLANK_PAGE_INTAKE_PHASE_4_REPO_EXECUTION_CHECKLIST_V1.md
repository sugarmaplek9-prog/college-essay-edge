# STRUCTURED_BLANK_PAGE_INTAKE_PHASE_4_REPO_EXECUTION_CHECKLIST_V1

**College Essay Edge**  
**Phase 4 repo execution checklist**  
**Post-answer conversion path**

**Status**  
Engineer-facing execution checklist

**Derived from**  
`STRUCTURED_BLANK_PAGE_INTAKE_PHASE_4_IMPLEMENTATION_SPEC_V1.md`  
`STRUCTURED_BLANK_PAGE_INTAKE_BUILD_BACKLOG_V1`  
Completed Backlog Phases 1–3 implementation

---

## Objective

Implement **Backlog Phase 4: Post-answer conversion path** for Structured Blank-Page Intake.

At the end of this phase, the repo must deterministically route blank-page answers to the correct next state without fake progress, uncontrolled looping, or brittle escalation.

After a user submits a recovery answer, the system must assign exactly one next-step route from:

- `direction_light`
- `second_recovery_question`
- `clarification`
- `too_thin_to_recover`

The system must:

- promote genuinely improved cases forward
- bound second recovery to only when justified
- avoid fake-forward inflation
- avoid repeated blank-page loops
- maintain explainable state and route reasoning

---

## Build order in VS Code

### Step 1 — Review Phase 4 post-answer contract before coding
Open and inspect:

- `src/lib/blank-page/types.ts` and Phase 3 response payload structure
- Phase 4 implementation spec (STRUCTURED_BLANK_PAGE_INTAKE_PHASE_4_IMPLEMENTATION_SPEC_V1.md)
- Phase 1 route decision types and downstream route enumeration
- any existing answer submission endpoint
- case state and session storage mechanism if one exists
- direction classification logic to understand direction confidence thresholds

Confirm:

- what fields describe answer quality (e.g., answer_length, signal_recovery_score)
- how the system currently decides between direction/clarification/too_thin routes
- where post-answer routing decision should live
- how case state is persisted across requests (session? database?)
- what confidence thresholds distinguish real progress from fake progress

Do not code until this contract is mapped.

---

### Step 2 — Extend types for post-answer state and routing decision
Target:

- `src/lib/blank-page/types.ts`

Add types:

- `PostAnswerRouteType` enum: `DIRECTION_LIGHT | SECOND_RECOVERY | CLARIFICATION | TOO_THIN_TO_RECOVER`
- `AnswerQualitySignals` interface:
  - `answer_length: number`
  - `recovery_score: number` (0–1, computed from answer semantics)
  - `signal_type: SignalType` (what did the answer recover?)
  - `confidence: number` (0–1)
- `PostAnswerRoutingDecision` interface:
  - `route_type: PostAnswerRouteType`
  - `reasoning: string` (why this route was chosen)
  - `depth_exhausted: boolean` (second recovery already attempted?)
  - `fallback_signal_threshold_met: boolean`
- `BlankPageCaseState` interface (for tracking recovery attempts):
  - `initial_blank_page_mode: BlankPageMode`
  - `first_recovery_attempt_count: number` (0 or 1)
  - `first_recovery_answer?: string`
  - `second_recovery_question_offered: boolean`
  - `second_recovery_attempt_count: number` (0 or 1)
  - `second_recovery_answer?: string`
  - `current_phase: 'initial_question' | 'post_first_recovery' | 'post_second_recovery'`

Done when:

- TypeScript compiles without errors
- all fields are appropriately required vs optional
- enums are exhaustive

---

### Step 3 — Build answer quality evaluation
Recommended file:

- `src/lib/blank-page/evaluateAnswerQuality.ts`

Purpose:

- measure answer quality from text + context
- produce `AnswerQualitySignals` for routing decision

The function should:

```typescript
function evaluateAnswerQuality(
  answer: string,
  recoveryQuestionFamily: RecoveryQuestionFamily,
  blankPageMode: BlankPageMode,
  attemptCount: number
): AnswerQualitySignals
```

Evaluation criteria:

- **length heuristic**: very short answers (<10 tokens) rarely contain signal
- **semantic recovery**: does the answer address the signal the question was designed to recover?
- **repetition penalty**: if this is attempt 2, penalize answers too similar to attempt 1
- **depth adjustment**: if depth is exhausted, lower confidence to trigger fallback
- **false specificity check**: penalize answers that sound specific but are vague filler

Requirements:

- deterministic (same input → same output)
- bounded (0–1 scale)
- explainable (reasoning traceable from inputs)

Done when:

- test cases show proper differentiation (strong vs weak answers)
- confidence scores adjust for attempt count
- no artificial inflation of weak signals

---

### Step 4 — Build post-answer routing decision engine
Recommended file:

- `src/lib/blank-page/makePostAnswerRoutingDecision.ts`

Purpose:

- map answer quality signals to the next route
- enforce recovery depth bounds
- prevent loops and fake progress

The function signature:

```typescript
function makePostAnswerRoutingDecision(
  answerQuality: AnswerQualitySignals,
  caseState: BlankPageCaseState,
  blankPageMode: BlankPageMode
): PostAnswerRoutingDecision
```

Decision logic (pseudocode):

```
if answer_recovery_score > DIRECTION_THRESHOLD:
  if direction_confidence_overall > CONFIDENCE_FLOOR:
    route = DIRECTION_LIGHT
  else:
    route = CLARIFICATION
elif answer_recovery_score > SECOND_RECOVERY_THRESHOLD and attemptCount == 0:
  if depth_not_exhausted:
    route = SECOND_RECOVERY_QUESTION
  else:
    route = TOO_THIN_TO_RECOVER
else:
  if attempts_remaining > 0:
    route = SECOND_RECOVERY_QUESTION
  else:
    route = TOO_THIN_TO_RECOVER
```

Constants to define and defend in code:

- `DIRECTION_THRESHOLD`: 0.70 (answer must show strong signal to promote)
- `SECOND_RECOVERY_THRESHOLD`: 0.45 (answer shows some signal, worth another ask)
- `CONFIDENCE_FLOOR`: 0.65 (overall confidence must be solid for direction)
- `MAX_RECOVERY_ATTEMPTS`: 2 (block more than one recovery attempt)

Requirements:

- **no loops**: never suggest blank-page recovery more than twice
- **no fake progress**: never promote weak signals into direction
- **bounded escalation**: fallback only to clarification or too_thin, never to block
- **determinism**: same inputs always produce same route

Done when:

- test data shows proper routing (strong answers → direction, weak → second recovery or too_thin)
- loop prevention is enforced (can't exceed 2 attempts)
- decision reasoning is always populated

---

### Step 5 — Build case state management
Recommended file:

- `src/lib/blank-page/caseStateManager.ts`

Purpose:

- track recovery attempt history
- persist state across submission lifecycle
- enable audit of why route was chosen

Functions:

```typescript
function initializeCaseState(blankPageMode: BlankPageMode): BlankPageCaseState
function recordFirstRecoveryAnswer(state: BlankPageCaseState, answer: string): BlankPageCaseState
function recordSecondRecoveryAnswer(state: BlankPageCaseState, answer: string): BlankPageCaseState
function getDepthExhausted(state: BlankPageCaseState): boolean
```

Requirements:

- state includes full history of question + answer pairs
- immutable updates (no mutation of input state)
- safe serialization for session storage
- audit trail for explaining any route decision

Done when:

- state correctly tracks all recovery attempts
- depth exhaustion is deterministically computed
- all transitions are tested

---

### Step 6 — Integrate post-answer routing into the submission endpoint
Target:

- `src/app/api/intake/submit-recovery-answer/route.ts` (new or updated endpoint)

Required flow:

1. receive POST with `{ answer: string, session_id: string }`
2. load case state from session
3. evaluate answer quality via `evaluateAnswerQuality()`
4. make routing decision via `makePostAnswerRoutingDecision()`
5. update case state via `caseStateManager`
6. build response with next route + recovery question (if applicable)
7. save updated state to session
8. return response

Response payload should include:

- `next_route_type: PostAnswerRouteType`
- `recovery_question_secondary?: string` (if route is SECOND_RECOVERY_QUESTION)
- `direction_candidate?: DirectionPayload` (if route is DIRECTION_LIGHT)
- `clarification_question?: string` (if route is CLARIFICATION)
- `reasoning: string` (for audit/debug)

Done when:

- endpoint exists and is callable
- responses correctly reflect routing decisions
- state is persisted across calls

---

### Step 7 — Add bounded recovery depth enforcement
Recommended implementation:

- add check in submission endpoint: if `attemptCount >= 2`, never offer another recovery question
- add UI-side guard: second recovery button should be unavailable after first attempt is submitted
- add database/session check: validate depth has not been exceeded before returning second question

Done when:

- users cannot exceed 2 recovery question attempts
- system enforces depth both server-side and UI-side

---

### Step 8 — Add unit tests for post-answer routing
Recommended file:

- `src/__tests__/unit/blank-page-post-answer-routing.spec.ts`

Test coverage:

- **answer quality evaluation**: strong vs weak answers produce different confidence scores
- **routing decisions**: each answer quality level routes to correct next state
- **loop prevention**: second attempt never produces a third recovery question
- **fake progress check**: weak answers never promote to direction
- **fallback behavior**: when depth exhausted, routes go to clarification or too_thin
- **state transitions**: case state correctly tracks all submissions
- **reasoning strings**: routing decision includes explainable reasoning

Acceptance criteria:

- 100% branch coverage of `makePostAnswerRoutingDecision`
- all route types (`DIRECTION_LIGHT`, `SECOND_RECOVERY_QUESTION`, `CLARIFICATION`, `TOO_THIN_TO_RECOVER`) tested
- depth exhaustion behavior verified

Done when:

- test file runs and passes
- all edge cases covered (empty answer, too-short answer, fake specificity, etc.)

---

### Step 9 — Regression testing
Run:

```bash
npm test
npm run test:product:screen-trust
npm run test:product:flow-break
npm run test:product:real-user-sim
npm run test:nds:evidence-grounding
npm run test:nds:direction-line-fit
npm run test:nds:direction-stability
npm run build
```

Acceptance criteria:

- all product tests pass
- all NDS tests pass
- build completes without errors or warnings
- no regressions in prior phases

Done when:

- `npm test` shows ≥ 294 passing tests
- no new test failures

---

### Step 10 — Document Phase 4 delivery
Create summary including:

- routing thresholds and reasoning
- answer quality evaluation methodology
- loop prevention mechanism
- case state schema
- example post-answer transitions
- test results and coverage

This prepares the handoff for Phase 5 (telemetry/observability).

Done when:

- Phase 4 checklist is complete
- Phase 5 can reference specific routing contracts

---

## Summary

Phase 4 is complete when:

- ✅ types extended with `PostAnswerRouteType`, `AnswerQualitySignals`, `PostAnswerRoutingDecision`, `BlankPageCaseState`
- ✅ answer quality evaluation is deterministic and bounded (0–1)
- ✅ routing decision engine maps quality to next route (no loops, no fake progress)
- ✅ depth is enforced (max 2 recovery attempts)
- ✅ case state is tracked and persisted across submissions
- ✅ post-answer submission endpoint exists and integrates routing
- ✅ unit tests pass (100% branch coverage of routing decision)
- ✅ regression suite remains green (product + NDS tests pass)
- ✅ `npm run build` completes without errors

Phase 4 fails if:

- routing allows more than 2 recovery attempts
- weak answers are promoted to direction
- case state is lost between attempts
- loop prevention is missing
- answer quality scores are not bounded
- product or NDS regressions emerge

---

## Artifacts required for Phase 5 handoff

- `STRUCTURED_BLANK_PAGE_INTAKE_PHASE_4_IMPLEMENTATION_SPEC_V1.md` (reference for contract)
- `STRUCTURED_BLANK_PAGE_INTAKE_PHASE_4_REPO_EXECUTION_CHECKLIST_V1.md` (this file)
- Unit test file: `src/__tests__/unit/blank-page-post-answer-routing.spec.ts`
- Phase 4 delivery summary documenting routing thresholds, depth enforcement, and test results
