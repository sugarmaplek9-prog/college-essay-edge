# STRUCTURED_BLANK_PAGE_INTAKE_PHASE_2_REPO_EXECUTION_CHECKLIST_V1

**College Essay Edge**  
**Phase 2 repo execution checklist**  
**Structured recovery question engine**

**Status**  
Engineer-facing execution checklist

**Derived from**  
`STRUCTURED_BLANK_PAGE_INTAKE_PHASE_2_IMPLEMENTATION_SPEC_V1.md`  
`STRUCTURED_BLANK_PAGE_INTAKE_BUILD_BACKLOG_V1`  
Completed Backlog Phase 1 implementation

---

## Objective

Implement **Backlog Phase 2: Structured recovery question engine** for Structured Blank-Page Intake.

At the end of this phase, the repo must emit typed, mode-specific recovery questions instead of generic clarification or block behavior.

For any case where:

- `top_level_blank_page_route = needs_structured_blank_page_intake`
- exactly one `blank_page_mode` is assigned

The system must emit:

- `recovery_question_primary`
- `recovery_question_secondary` (optional)
- `missing_signal_type`
- `why_not_ready_for_direction`
- optional scaffolding fields
- bounded fallback path for `too_thin_to_recover`

The questions must be:
- mode-specific
- strategically purposeful
- non-generic
- non-repetitive
- state-appropriate

---

## Build order in VS Code

### Step 1 — Review Phase 2 question contract before coding
Open and inspect:

- `src/lib/blank-page/types.ts` or equivalent type definitions
- Phase 2 implementation spec (STRUCTURED_BLANK_PAGE_INTAKE_PHASE_2_IMPLEMENTATION_SPEC_V1.md)
- any existing question family or template registry
- Phase 1 mode assignment logic to understand which modes need questions
- server-side intake response builder

Confirm:

- where the blank-page route currently ends (before Phase 2)
- what type should hold `recovery_question_primary` and `recovery_question_secondary`
- what `missing_signal_type` values are valid
- which blank-page modes exist and how many question families each needs
- where the response payload is assembled for the first-minute intake endpoint

Do not code until this contract is mapped.

---

### Step 2 — Extend types to include Phase 2 question contract
Target:

- `src/lib/blank-page/types.ts` or `src/types/intake.ts`

Add types:

- `RecoveryQuestionFamily` enum or type (e.g., `TOPIC_DISCOVERY`, `THEME_EXPLORATION`, etc.)
- `MissingSignalType` enum (e.g., `TOPIC`, `THEME`, `ACTIVITY`, `SCOPE`, `NONE`)
- `BlankPageRecoveryResponse` interface with required fields:
  - `recovery_question_primary: string`
  - `recovery_question_secondary?: string`
  - `missing_signal_type: MissingSignalType`
  - `why_not_ready_for_direction: string`
  - `reassurance_copy?: string`
  - `example_answer_shape?: string`
  - `what_good_signal_would_look_like?: string`
  - `recovery_confidence: number` (0–1 scale)

Done when:

- TypeScript compiles without errors
- all required fields are non-optional
- optional fields are clearly marked
- enums are exhaustive for each mode

---

### Step 3 — Build question selection engine
Recommended structure:

- `src/lib/blank-page/selectRecoveryQuestion.ts`

Purpose:
- map each blank-page mode to its question family
- select deterministic questions based on mode
- compute `missing_signal_type` correctly
- ensure non-repetition across attempts if second recovery is attempted

The function signature should resemble:

```typescript
function selectRecoveryQuestion(
  blankPageMode: BlankPageMode,
  attemptCount: number, // 1 for initial, 2 for second recovery
  context: BlankPageContext // user state, session history if available
): BlankPageRecoveryResponse
```

Requirements:

- **Determinism**: same mode + attempt should produce consistent results
- **Mode specificity**: each blank-page mode has distinct question families
- **Banned patterns**: no generic "tell me more" or "be more specific" questions
- **Scaffolding**: provide example shapes and signal guidance where helpful
- **Confidence floor**: recovery_confidence reflects mode and attempt count

Done when:

- every blank-page mode has a primary question
- secondary questions exist and are bounded (only for first recovery)
- `missing_signal_type` is always correctly assigned
- no banned generic patterns appear in the code
- test data shows 3–5 distinct questions per major mode

---

### Step 4 — Build question composition for each blank-page mode
Create mode-specific question templates or selection logic:

Organize by `blank_page_mode`:

- **scope_anxiety**: Questions that reframe scope expectations
  - e.g., "What's the broadest category of your life this could fit into—school, work, personal growth?"
  - `missing_signal_type`: SCOPE
  - `recovery_confidence`: 0.7 (scope questions are recoverable but not strongly)

- **activity_only**: Questions that discover theme or topic given an activity
  - e.g., "That activity sounds interesting. What makes it meaningful to you?"
  - `missing_signal_type`: THEME
  - `recovery_confidence`: 0.75

- **theme_only**: Questions that discover topic or activity given a theme
  - e.g., "You mentioned [theme]. What experience or activity best shows that?"
  - `missing_signal_type`: ACTIVITY or TOPIC
  - `recovery_confidence`: 0.75

- **topic_only**: Questions that recover theme or activity given a topic
  - e.g., "Tell me about a moment when [topic] mattered to you personally."
  - `missing_signal_type`: THEME
  - `recovery_confidence`: 0.8

- **no_signal**: Broadest recovery attempt
  - e.g., "What's something you've been thinking about or working on that shaped who you are?"
  - `missing_signal_type`: NONE (any signal would help)
  - `recovery_confidence`: 0.6

Done when:

- all modes have primary questions
- no question is generic or repeated across modes
- each question includes clear scaffolding (e.g., example_answer_shape)
- `missing_signal_type` is correct for each

---

### Step 5 — Integrate question selection into the Phase 1 response path
Target:

- `src/app/api/intake/session/route.ts` or equivalent first-minute session endpoint
- `src/lib/intake/buildBlankPageResponse.ts` or equivalent response builder

Required logic:

- after Phase 1 classifies into a blank-page mode, call `selectRecoveryQuestion()`
- assemble `BlankPageRecoveryResponse` into the session response payload
- ensure the response structure includes all required Phase 2 fields
- do not return a blank-page route without a recovery question

Done when:

- real-world test cases flow through Phase 1 → Phase 2 successfully
- session endpoint returns typed recovery questions
- payload schema matches `BlankPageRecoveryResponse`

---

### Step 6 — Add unit tests for question selection
Recommended file:

- `src/__tests__/unit/blank-page-question-selection.spec.ts`

Test coverage:

- **mode specificity**: each blank-page mode produces its own questions (not cross-contaminated)
- **non-repetition**: subsequent attempts produce different secondary questions
- **missing signal typing**: each question's `missing_signal_type` matches what it recovers
- **banned patterns**: regex checks confirm no generic "tell me more" patterns
- **scaffold fields**: at least one of `example_answer_shape` or `what_good_signal_would_look_like` is present
- **confidence bounds**: `recovery_confidence` is between 0 and 1 for all modes

Acceptance criteria:

- 100% of mode families covered
- all tests passing
- no console warnings about missing fields

Done when:

- test file runs and passes
- coverage report shows all branches of `selectRecoveryQuestion` tested

---

### Step 7 — Regression testing
Run:

```bash
npm test
npm run test:product:screen-trust
npm run test:product:real-user-sim
npm run test:nds:evidence-grounding
npm run test:nds:direction-line-fit
npm run test:nds:direction-stability
npm run build
```

Acceptance criteria:

- all product regression tests pass
- all NDS regression tests pass
- build completes without errors or warnings
- no regressions in Phase 1 detection or mode assignment

Done when:

- `npm test` shows ≥ 294 passing tests
- no test categories show new failures

---

### Step 8 — Document recovered state and prepare for Phase 3
Create a summary note in the Phase 2 delivery:

Include:

- question families implemented
- blank-page modes covered
- sample question outputs per mode
- ban pattern audit results
- test results summary
- `npm build` status

This prepares the handoff for Phase 3 (UI rendering).

Done when:

- Phase 2 checklist is complete
- Phase 3 can reference specific question contracts
- code review can confirm all requirements met

---

## Summary

Phase 2 is complete when:

- ✅ types extended with `BlankPageRecoveryResponse` and related enums
- ✅ `selectRecoveryQuestion()` is implemented and deterministic
- ✅ question selection is mode-specific (no generic fallback)
- ✅ all blank-page modes have primary + optional secondary questions
- ✅ `missing_signal_type` is correct and exposed in response
- ✅ banned generic patterns are absent (audited in code review)
- ✅ phase 2 question selection tests pass (100% coverage of mode branches)
- ✅ regression suite remains green (`npm test` and product/NDS tests pass)
- ✅ `npm run build` completes without errors

Phase 2 fails if:

- questions are generic across modes
- `missing_signal_type` does not match the question's intent
- secondary questions are unbounded or repeated
- banned patterns appear ("tell me more", "be more specific", etc.)
- tests fail or cover fewer than 100% of mode selection branches
- product or NDS regressions emerge

---

## Artifacts required for Phase 3 handoff

- `STRUCTURED_BLANK_PAGE_INTAKE_PHASE_2_IMPLEMENTATION_SPEC_V1.md` (reference for contract)
- `STRUCTURED_BLANK_PAGE_INTAKE_PHASE_2_REPO_EXECUTION_CHECKLIST_V1.md` (this file)
- Unit test file: `src/__tests__/unit/blank-page-question-selection.spec.ts`
- Phase 2 delivery summary documenting questions per mode, coverage, and test results
