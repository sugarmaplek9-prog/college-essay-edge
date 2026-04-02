# STRUCTURED_BLANK_PAGE_INTAKE_PHASE_3_REPO_EXECUTION_CHECKLIST_V1

**College Essay Edge**  
**Phase 3 repo execution checklist**  
**Payload + UI integration**

**Status**  
Engineer-facing execution checklist

**Derived from**  
`STRUCTURED_BLANK_PAGE_INTAKE_PHASE_3_IMPLEMENTATION_SPEC_V1.md`  
`STRUCTURED_BLANK_PAGE_INTAKE_BUILD_BACKLOG_V1`  
Completed Backlog Phase 1 implementation and planned Phase 2 behavior

---

## Objective

Implement **Backlog Phase 3: Payload + UI integration** for Structured Blank-Page Intake.

At the end of this phase, the repo must render a first-class blank-page recovery lane for any case where:

- `top_level_blank_page_route = needs_structured_blank_page_intake`
- `product_mode = blank_page_intake`

The UI must safely display:

- `recovery_question_primary`
- `recovery_question_secondary` when present
- bounded support fields
- answer-entry state
- submit/loading/error states
- distinct fallback behavior for `too_thin_to_recover`

The user must **not** experience blank-page cases as:
- generic clarification
- hard block
- fake direction
- payload/UI contradiction

---

## Build order in VS Code

### Step 1 — Review current first-minute render path before changing code
Open and inspect:

- `src/app/start/page.tsx`
- any first-minute container/view components
- any product-mode render mapper used by the start flow
- current answer-entry component(s)
- current clarification/block/direction render paths
- `src/types/intake.ts`
- any client-side response model or mapper used to normalize payloads

Confirm:

- where product mode is currently selected for rendering
- whether `blank_page_intake` already exists in the view layer
- where the response payload is mapped into screen props/state
- where answer text state currently lives
- where loading/error/submission states are currently handled
- which component boundary is best for a dedicated blank-page view

Do not code until this render path is mapped.

---

### Step 2 — Confirm and extend the Phase 3 UI type contract
Target:

- `src/types/intake.ts`
- any client-side view-model types if they exist

Confirm the UI can safely consume:

- `product_mode`
- `blank_page_mode`
- `recovery_question_primary`
- `recovery_question_secondary`
- `missing_signal_type`
- `why_not_ready_for_direction`
- `next_step_type`
- `reassurance_copy`
- `example_answer_shape`
- `what_good_signal_would_look_like`
- `recovery_confidence`

If needed, add client-safe view types such as:

- `BlankPageRenderState`
- `BlankPageViewModel`
- `BlankPageSubmissionState`

Done when:
- frontend typecheck passes
- no render path needs to guess at missing fields
- UI contract is explicit and safe

---

### Step 3 — Add a dedicated blank-page view component
Recommended new file:

- `src/components/firstMinute/BlankPageIntakeView.tsx`

Purpose:
- isolate blank-page lane rendering from generic clarification UI
- keep this lane testable and visibly distinct in code

This component should own:

- title/heading region if needed
- primary question render
- secondary question render when allowed
- support field render
- answer-entry area
- CTA region
- local loading/error view behavior if not owned higher up

Done when:
- blank-page rendering is no longer hidden inside a generic clarification branch
- the component can be tested independently

---

### Step 4 — Add support-fields subcomponent
Recommended new file:

- `src/components/firstMinute/BlankPageSupportFields.tsx`

Purpose:
- render bounded support content only when present

This component should safely render:

- `reassurance_copy`
- `example_answer_shape`
- `what_good_signal_would_look_like`

Requirements:
- omit empty/null fields cleanly
- avoid clutter if only one field is present
- maintain calm, readable presentation

Done when:
- support fields are visually bounded
- rendering logic is isolated from the main view
- absence/presence logic is easy to test

---

### Step 5 — Add dedicated answer-box component or extend existing one safely
Recommended new file:

- `src/components/firstMinute/BlankPageAnswerBox.tsx`

If an existing shared answer component is reused, keep the blank-page mode branch explicit.

This component should own:

- local draft text state
- submit action binding
- disabled/loading state
- retry/error display
- placeholder/help text appropriate to blank-page mode

Requirements:
- do not present as full essay drafting box
- preserve text through trivial rerenders
- support bounded recovery input, not long-form essay generation

Done when:
- answer-entry state is stable
- user input is not lost on normal rerender
- blank-page lane has a distinct answer-entry surface

---

### Step 6 — Add explicit product-mode render branch
Targets:

- `src/app/start/page.tsx`
- first-minute container or product-mode mapper

Add explicit handling for:

- `product_mode = blank_page_intake`

Required behavior:
- render `BlankPageIntakeView`
- preserve existing render paths for:
  - normal NDS
  - clarification
  - block
  - other existing product modes

Important:
- do not piggyback this on generic clarification rendering
- do not silently fall through if payload is malformed

Done when:
- blank-page payload always routes to blank-page UI branch
- non-blank-page modes remain stable

---

### Step 7 — Map payload fields into a clean blank-page view model
Targets:

- client-side response mapper
- render container
- `BlankPageIntakeView.tsx`

Build a clean mapping layer from raw payload to view props/state.

Recommended mapped props:

- `blankPageMode`
- `primaryQuestion`
- `secondaryQuestion`
- `supportFields`
- `nextStepType`
- `isTooThinFallback`
- `recoveryConfidence`
- `answerBoxMode`
- `ctaLabel`

Requirements:
- no raw payload leakage all over JSX
- no conditional spaghetti in page-level components
- no render-time guessing

Done when:
- blank-page screen behavior is driven by a clean mapped view object
- UI behavior is inspectable and diffable

---

### Step 8 — Implement render states explicitly
Targets:

- `BlankPageIntakeView.tsx`
- container/state owner
- answer-box component

Required render states:

1. `blank_page_question_ready`
2. `blank_page_question_with_secondary`
3. `blank_page_answer_drafting`
4. `blank_page_answer_submitting`
5. `blank_page_answer_submit_error`
6. `blank_page_too_thin_fallback`

Requirements:
- these states must be inferable in code and testable
- no invisible implicit state transitions
- error state must be recoverable

Done when:
- each major state has explicit render behavior
- the user can understand the current screen state

---

### Step 9 — Implement `too_thin_to_recover` fallback rendering distinctly
Targets:

- `BlankPageIntakeView.tsx`
- product-mode mapper
- support field render logic

Required behavior:
- render a bounded fallback state
- ask for one concrete starting point if appropriate
- avoid showing a rich recovery question as if the system already has enough signal

Must not do:
- reuse standard blank-page question screen unchanged
- look like a harsh block wall
- pretend recoverability where no signal exists

Done when:
- `too_thin_to_recover` is visually and behaviorally distinct
- fallback feels dignified and bounded

---

### Step 10 — Add CTA logic that matches the lane
Targets:

- `BlankPageIntakeView.tsx`
- answer-box or action bar component

CTA requirements:
- match the user action actually being taken
- stay consistent with `next_step_type`

Acceptable examples:
- `Continue with this answer`
- `Submit response`
- `Use this to move forward`

Not acceptable:
- vague `Next`
- direction-heavy labels implying the system already has a narrative output
- contradictory CTA text in fallback mode

Done when:
- CTA text is mode-safe and state-safe
- loading/disabled states are wired correctly

---

### Step 11 — Add safe fallback behavior for malformed or incomplete payloads
Targets:

- product-mode mapper
- render container
- blank-page view

If payload says `blank_page_intake` but required fields are malformed or missing:

Allowed behavior:
- safe internal error state
- bounded degraded prompt asking for one concrete starting point
- recoverable fallback that preserves trust

Not allowed:
- inventing missing questions
- rendering contradictory clarification/direction UI
- crashing the start flow

Done when:
- payload malformation cannot create contradictory product behavior
- the lane fails closed

---

### Step 12 — Extend debug/test selectors and inspection visibility
Targets:

- render container
- debug surface if any
- component test helpers

Expose enough to inspect:

- `product_mode`
- `blank_page_mode`
- current blank-page render state
- support field presence map
- whether secondary question rendered
- submission state
- fallback state for `too_thin_to_recover`

This can be achieved via:
- debug render props
- test ids/selectors
- internal debug panel/hooks if already present

Done when:
- engineering can explain why a given payload rendered what it rendered
- UI branch selection is testable

---

### Step 13 — Add rendering tests
Create or update tests near:

- start-page rendering tests
- first-minute mode rendering tests
- component tests for blank-page view

Minimum required rendering tests:

#### Branch selection
Verify:
- blank-page payload renders blank-page view
- blank-page payload does not render generic clarification UI
- non-blank-page modes still render correctly

#### Primary question
Verify:
- primary question always renders when required

#### Secondary question
Verify:
- only renders when payload provides it
- does not render empty shell when absent

#### Support fields
Verify:
- render only when present
- do not create clutter when partially present

#### Too-thin fallback
Verify:
- fallback renders distinctly
- does not reuse normal question layout unchanged

Done when:
- each major render branch is asserted directly
- contradictory branch rendering is covered by tests

---

### Step 14 — Add user-flow tests for answer entry and submission state
Verify:

- user can type in blank-page answer field
- text remains during normal rerender
- submit action triggers loading state
- loading state disables duplicate submission appropriately
- failure state is visible and recoverable
- retry does not wipe text unnecessarily

Done when:
- answer-entry flow is stable
- blank-page lane behaves like a real product surface, not a brittle mock

---

### Step 15 — Add session/state tests
Verify:

- payload updates map cleanly to view state
- screen does not jump from blank-page into contradictory mode
- local answer state behaves predictably across rerenders
- fallback state remains bounded
- support-field presence does not break state transitions

Done when:
- session/state integrity remains PASS-worthy
- state model is resilient under test

---

### Step 16 — Run required regression suite
Run:

```bash
npm run test:product:screen-trust
npm run test:product:flow-break
npm run test:product:session-state
npm run test:product:real-user-sim
npm run test:nds:evidence-grounding
npm run test:nds:direction-line-fit
npm run test:nds:direction-stability
npm test
npm run build
```

Capture:
- pass/fail
- any render contradictions
- any state regressions
- any screen clutter/trust concerns from visual review

Done when:
- all required checks are green
- build passes
- real-user-sim remains PASS

---

### Step 17 — Run manual reviewed render packet
Before calling Phase 3 done, manually inspect at least:

- 3 `topic_probe` payloads
- 3 `theme_probe` payloads
- 3 `activity_probe` payloads
- 3 `scope_reframe` payloads
- 3 `blank_page_discovery` payloads
- 3 `too_thin_to_recover` payloads

For each, record:
- payload summary
- expected mode
- actual rendered state
- visible primary question
- whether secondary question rendered
- support fields shown
- CTA text
- answer-box behavior note
- reviewer note on clarity/trust
- pass/fail

Recommended supporting artifact outputs:
- `STRUCTURED_BLANK_PAGE_INTAKE_PHASE_3_RENDER_REVIEW_PACKET_V1.md`
- `structured_blank_page_intake_phase_3_render_review_packet_v1.json`

Done when:
- reviewed payloads show clear, trustworthy blank-page rendering
- no screen behaves like generic clarification in disguise

---

## File-by-file expected change set

### Must touch
- `src/app/start/page.tsx`
- `src/types/intake.ts`

### Strongly recommended new files
- `src/components/firstMinute/BlankPageIntakeView.tsx`
- `src/components/firstMinute/BlankPageSupportFields.tsx`
- `src/components/firstMinute/BlankPageAnswerBox.tsx`

### Likely touch
- first-minute container/view mapper
- response normalization mapper
- existing clarification/direction mode switcher
- component test files
- user-flow and session-state test files

### Must not expand yet
Do not implement in this phase:
- post-answer routing logic
- second recovery question loop logic beyond display
- telemetry suite completion
- evaluation harness expansion
- learned reranking
- broader launch hardening beyond what this UI lane needs

Those belong to later backlog phases.

---

## Commit structure
Use small commits.

Suggested sequence:
1. `types: confirm blank-page ui payload contract`
2. `ui: add blank-page intake view component`
3. `ui: add blank-page support fields and answer box`
4. `ui: wire blank-page product mode into start flow`
5. `ui: add too-thin fallback and mode-safe cta logic`
6. `debug: expose blank-page render-state inspection hooks`
7. `tests: add blank-page render, flow, and state coverage`

---

## Definition of done
Phase 3 is done only if:

- blank-page payload renders through a dedicated product-mode branch
- each supported blank-page mode displays safely
- primary/secondary question behavior is correct
- answer entry is stable
- `too_thin_to_recover` fallback is distinct and dignified
- no UI/backend contradiction appears
- screen-trust, flow-break, session-state, and real-user-sim all pass
- full required regression suite passes
- manual render review packet shows no generic clarification collapse

---

## Immediate next step after Phase 3
Once Phase 3 is green, move directly to:

- **Backlog Phase 4 — Post-answer conversion path**

That means:
- ingesting blank-page answers
- deciding forward route transitions
- preventing loops
- defining bounded recovery depth

Do not jump ahead to rollout or telemetry completion before Phase 4 lands.
