# STRUCTURED_BLANK_PAGE_INTAKE_PHASE_3_IMPLEMENTATION_SPEC_V1

**College Essay Edge**  
**Phase 3 engineering spec**  
**Payload + UI integration**

**Status**  
Build-ready implementation spec

**Derived from**  
`STRUCTURED_BLANK_PAGE_INTAKE_V1`  
`STRUCTURED_BLANK_PAGE_INTAKE_IMPLEMENTATION_PLAN_V1`  
`STRUCTURED_BLANK_PAGE_INTAKE_BUILD_BACKLOG_V1`  
`STRUCTURED_BLANK_PAGE_INTAKE_PHASE_1_IMPLEMENTATION_SPEC_V1`  
`STRUCTURED_BLANK_PAGE_INTAKE_PHASE_2_IMPLEMENTATION_SPEC_V1`  
Completed Backlog Phase 1 and planned Phase 2 behavior

---

## Purpose

Phase 3 implements the third production-critical layer of Structured Blank-Page Intake:

**take the typed blank-page payload from Phases 1–2 and render it as a first-class user-facing product mode, with clear state behavior, dignified recovery UI, and safe integration into the first-minute experience.**

Phase 1 determines:
- whether the case belongs in the blank-page lane
- which blank-page mode applies

Phase 2 determines:
- what typed question to ask
- what missing signal is being recovered
- what scaffolding fields the user should see

Phase 3 must determine:
- how that payload appears in the actual product
- how the user experiences the recovery lane
- how the interface distinguishes blank-page recovery from normal clarification or block behavior

This phase is where the system either becomes:
- coherent
- trustworthy
- intelligible
- productized

or degrades into:
- backend-only logic with weak UX
- mismatched payload/render behavior
- generic clarification screens wearing a new label
- confusing state transitions that erode trust

Phase 3 must therefore be:
- explicit
- state-safe
- mode-aware
- render-consistent
- bounded
- testable

It is not visual polish work.  
It is the product-surface contract for the blank-page recovery lane.

---

# 1. PHASE 3 OBJECTIVE

Implement a first-class blank-page intake UI mode and payload-to-screen contract such that any case with:

- `top_level_blank_page_route = needs_structured_blank_page_intake`
- `product_mode = blank_page_intake`

renders as a distinct recovery experience with:

- mode-appropriate copy
- primary recovery question
- optional secondary recovery question
- visible answer-entry state
- bounded supporting scaffolding
- safe fallback behavior for `too_thin_to_recover`

The system must ensure that blank-page users do **not** see:
- generic clarification UI
- generic block UI
- fake direction UI
- payload fields that contradict the rendered state

At the end of Phase 3, the blank-page lane must be visibly real in the app.

---

# 2. OUT OF SCOPE FOR PHASE 3

Phase 3 does **not** include:

- post-answer routing logic after submission
- second-turn loop orchestration
- telemetry event suite completion
- large-scale visual redesign outside the blank-page lane
- learned-judgment model work
- eval harness expansion
- launch-control docs or rollout policy changes
- broader NDS screen refactors unrelated to blank-page handling

Phase 3 covers only:

- payload contract integration into the UI
- route-to-render mapping
- screen state definitions
- answer input behavior for blank-page mode
- safe display of scaffolding fields
- fallback rendering for too-thin cases inside the lane
- state persistence and product-surface correctness

---

# 3. REQUIRED FUNCTIONAL OUTCOME

At the end of Phase 3, the system must be able to do all of the following:

- recognize that a response payload is a blank-page intake payload
- render a distinct blank-page recovery screen state
- display the primary question clearly and safely
- display a secondary question only when appropriate
- present answer-entry UI that matches the recovery task
- show bounded support fields that help the user answer
- preserve user trust by avoiding fake confidence or genericity
- render `too_thin_to_recover` as a graceful fallback, not as ordinary clarification
- maintain stable session and screen-state behavior

That is the mission of Phase 3.

---

# 4. SYSTEM BEHAVIOR CONTRACT

## 4.1 Entry condition

Phase 3 rendering logic runs only when:

- `top_level_blank_page_route = needs_structured_blank_page_intake`
- `product_mode = blank_page_intake`

and Phase 2 has produced the required payload fields.

Blank-page UI rendering must not activate on:
- `ready_for_nds` cases
- standard clarification cases
- top-level true-block cases outside the blank-page lane

---

## 4.2 Required render states

Phase 3 must support at least these render states:

1. `blank_page_question_ready`
2. `blank_page_question_with_secondary`
3. `blank_page_answer_drafting`
4. `blank_page_answer_submitting`
5. `blank_page_answer_submit_error`
6. `blank_page_too_thin_fallback`

Optional internal state names may vary, but these user-facing behaviors must exist.

---

## 4.3 Render contract

For eligible cases, the UI must render:

- `product_mode = blank_page_intake`
- visible mode-appropriate recovery container
- `recovery_question_primary`
- `recovery_question_secondary` only if non-null and intentionally allowed
- answer input field
- submit CTA with typed intent
- bounded support copy derived from:
  - `reassurance_copy`
  - `example_answer_shape`
  - `what_good_signal_would_look_like`

The render layer must not expose raw internal fields directly unless intentionally mapped.

---

# 5. PAYLOAD-TO-UI CONTRACT

## 5.1 Required payload fields consumed by UI

Phase 3 UI must safely consume:

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

Optional if present:
- `topic_candidate`
- `question_family_primary`
- `question_family_secondary`

The UI may use some of these only for display mapping and some only for internal state/analytics/debug scaffolding.

---

## 5.2 UI must not contradict payload

If payload says:
- `product_mode = blank_page_intake`

the UI must not render:
- generic clarification heading
- normal NDS direction heading
- block-state language unless the mode is the bounded fallback

If payload says:
- `blank_page_mode = too_thin_to_recover`

the UI must not render:
- a normal recovery question as if the user is already in a healthy recovery lane

---

## 5.3 Missing payload behavior

If required blank-page fields are missing or malformed, UI must fail closed into a safe recoverable state, not hallucinate a screen.

Allowed behavior:
- internal safe fallback
- recoverable generic system-error state
- route-safe degraded message asking for a concrete starting point

Not allowed:
- inventing questions
- rendering empty shells as if data were valid
- silently falling through to a contradictory product mode

---

# 6. MODE-SPECIFIC UI CONTRACT

## 6.1 `topic_probe`

### Render goal
Help the user move from a topic noun to a lived center.

### UI expectation
The screen should feel like:
- the system sees the topic
- the system is asking for the moment inside it
- the user is not being judged for not having the story yet

### Screen behavior requirements
- primary question rendered prominently
- support copy nudges toward one moment/shift, not broad explanation
- answer box should imply bounded specificity, not full essay writing

### Must not do
- frame the topic as already validated
- ask for a full essay draft
- render like generic clarification

---

## 6.2 `theme_probe`

### Render goal
Help the user convert abstract trait language into lived evidence.

### UI expectation
The screen should feel like:
- abstraction is not enough yet
- the user is being helped toward a real situation
- the product understands the gap

### Screen behavior requirements
- primary question emphasizes concrete situation
- support copy should discourage abstraction politely
- answer field should encourage event grounding

### Must not do
- praise the trait as sufficient
- reward generic self-description
- drift into “what do you want colleges to know?” language

---

## 6.3 `activity_probe`

### Render goal
Help the user find the personal center inside the activity.

### UI expectation
The screen should feel like:
- the activity itself is not the answer
- something meaningful inside it probably is
- the user is being asked for the part that mattered

### Screen behavior requirements
- primary question should be framed around what mattered inside the activity
- support copy should avoid résumé-summary framing
- answer field should stay bounded to one center or moment

### Must not do
- encourage listing achievements
- encourage broad activity summary
- sound like extracurricular brainstorming

---

## 6.4 `scope_reframe`

### Render goal
Move the user from “is this enough?” to “what signal is here?”

### UI expectation
The screen should feel like:
- calm reframing
- reduced anxiety
- increased precision

### Screen behavior requirements
- primary question must be obviously different from generic reassurance
- support copy should redirect toward what changed, mattered, or reveals self
- screen must not answer the worthiness question directly

### Must not do
- say “yes, this is a great topic”
- intensify uncertainty
- render as a validation screen

---

## 6.5 `blank_page_discovery`

### Render goal
Open bounded discovery without turning into brainstorm sludge.

### UI expectation
The screen should feel like:
- the user is not behind
- the system has a real discovery move
- the ask is focused enough to answer

### Screen behavior requirements
- primary question should stand alone clearly
- support copy should remain bounded and specific
- answer input should encourage one zone, not many ideas

### Must not do
- ask for passions/interests generically
- ask for multiple topic candidates
- imply that the user must already know the essay answer

---

## 6.6 `too_thin_to_recover`

### Render goal
Provide a dignified bounded fallback.

### UI expectation
The screen should feel like:
- the system genuinely needs one concrete starting point
- the user is not being punished
- this is not fake recovery

### Screen behavior requirements
- graceful explanatory copy
- optional narrow restart prompt
- clear next step asking for one concrete starting point

### Must not do
- render a fake rich question
- pretend the system has enough signal
- shame the user or use harsh block language

---

# 7. UI COPY AND TONE REQUIREMENTS

## 7.1 Tone requirements

Rendered copy must sound:
- calm
- precise
- credible
- non-performative
- non-syrupy
- strategically helpful

Rendered copy must not sound:
- like school worksheet language
- like therapy/coaching filler
- like admissions consultant performance warmth
- like commodity AI clarification

---

## 7.2 Copy boundary

The screen may provide:
- brief reassurance
- bounded answer guidance
- one clear prompt
- one optional secondary prompt

The screen must not provide:
- full essay coaching
- life-story brainstorming
- over-instruction
- verbose explanation of system logic

---

## 7.3 CTA requirements

The call to action must match the lane.

Acceptable patterns:
- continue with answer
- submit response
- use this answer to move forward

Not acceptable:
- generic “next”
- direction-heavy labels that imply the system is already generating narrative output
- vague CTA text that obscures what happens next

---

# 8. ANSWER INPUT CONTRACT

## 8.1 Required answer-entry behavior

The blank-page lane must render a dedicated answer-entry area for:
- `topic_probe`
- `theme_probe`
- `activity_probe`
- `scope_reframe`
- `blank_page_discovery`

This answer-entry area must:
- preserve typed text during screen state transitions where appropriate
- visually belong to the blank-page lane
- not be confused with a full essay draft field

---

## 8.2 Input guidance boundary

Input guidance may:
- suggest answering with one moment, example, or concrete situation
- use `example_answer_shape` to make the task legible

Input guidance must not:
- over-template the answer
- make the user feel forced into a canned structure
- produce fake specificity

---

## 8.3 Submission states

The UI must support:

- drafting
- submitting
- submission failure with recoverable retry behavior

It must not:
- drop user input unexpectedly
- silently fail
- jump to a contradictory mode without response confirmation

---

# 9. IMPLEMENTATION REQUIREMENTS

## 9.1 Files in scope

Required likely files:

- `src/app/start/page.tsx`
- supporting UI state/render helpers if needed
- first-minute response mapper / product-mode mapper
- any blank-page view component introduced

Possible recommended new files:
- `src/components/firstMinute/BlankPageIntakeView.tsx`
- `src/components/firstMinute/BlankPageSupportFields.tsx`
- `src/components/firstMinute/BlankPageAnswerBox.tsx`

Type files:
- `src/types/intake.ts`
- any client-side view model types if introduced

---

## 9.2 Architecture requirement

Phase 3 should be implemented as a distinct product mode render path, not as a small conditional inside generic clarification UI.

Recommended separation:
- route/payload says `product_mode = blank_page_intake`
- UI maps that to a dedicated render branch
- dedicated components render the blank-page lane

This separation must remain explicit so product tests and future changes can target it cleanly.

---

## 9.3 Safe component responsibilities

Recommended responsibility boundaries:

### Product-mode mapper
Determines which major first-minute surface to render.

### Blank-page view
Owns:
- heading
- primary question
- secondary question
- support fields
- answer box
- CTA

### Support-fields component
Owns bounded rendering for:
- reassurance copy
- example answer shape
- what good signal looks like

### Answer-box component
Owns:
- local text state
- submission state
- retry/error display
- persistence behavior if applicable

---

# 10. STATE MODEL REQUIREMENTS

## 10.1 Canonical UI state transitions

At minimum:

1. payload received for blank-page lane
2. `blank_page_question_ready`
3. user types → `blank_page_answer_drafting`
4. user submits → `blank_page_answer_submitting`
5. if request fails → `blank_page_answer_submit_error`
6. if mode is `too_thin_to_recover` → `blank_page_too_thin_fallback`

State transitions must be explicit enough for testing.

---

## 10.2 Persistence requirement

During normal local interaction:
- typed answer should not disappear due to trivial rerender
- state should remain coherent during submission
- retry should preserve recoverable text where possible

---

## 10.3 Fail-closed requirement

If payload/render mismatch occurs:
- screen should move to a safe internal fallback
- must not present contradictory product mode
- must not present stale direction content inside blank-page mode

---

# 11. DEBUG AND OBSERVABILITY REQUIREMENTS

Phase 3 must make it possible for engineering to answer:

- did the screen render blank-page mode correctly?
- which blank-page mode was displayed?
- were support fields present or absent as expected?
- did the UI accidentally fall through to clarification or block UI?
- did answer-entry state behave correctly?

Required visible inspection/debug fields or hooks:

- `product_mode`
- `blank_page_mode`
- `next_step_type`
- presence/absence of primary and secondary questions
- support-field presence map
- current local UI state
- submission state/error state

These may appear in debug views, logs, test selectors, or internal inspection tooling.

---

# 12. TEST PLAN

## 12.1 Rendering tests

Must verify:

- blank-page payload renders blank-page UI branch
- generic clarification UI does not render for blank-page payload
- primary question renders when required
- secondary question renders only when non-null and allowed
- support fields render only when payload provides them
- `too_thin_to_recover` renders fallback state distinctly

---

## 12.2 User-flow tests

Must verify:

- user can type into blank-page answer field
- user can submit from blank-page mode
- submission loading state appears
- submission error state is recoverable
- input text is not lost unexpectedly

---

## 12.3 Session/state tests

Must verify:

- state persists correctly through normal rerenders
- screen does not jump to contradictory mode
- payload updates map cleanly to view state
- retry behavior is stable

---

## 12.4 Product tests

Must rerun:

- `npm run test:product:screen-trust`
- `npm run test:product:flow-break`
- `npm run test:product:session-state`
- `npm run test:product:real-user-sim`

---

## 12.5 NDS regressions

Must rerun:

- `npm run test:nds:evidence-grounding`
- `npm run test:nds:direction-line-fit`
- `npm run test:nds:direction-stability`

---

## 12.6 Full regression

- `npm test`

---

## 12.7 Build verification

- `npm run build`

---

# 13. ACCEPTANCE CRITERIA

Phase 3 is complete only if all of the following are true.

## Functional
- blank-page payload renders as a distinct product mode
- all supported modes can be displayed safely
- primary and secondary question handling is correct
- answer input is present where required
- `too_thin_to_recover` has distinct fallback rendering

## Product integrity
- no UI/backend contradiction
- no silent fallthrough to clarification or block state
- support fields display safely and coherently
- user can understand what is being asked

## Trust
- screen remains dignified and non-generic
- blank-page lane is visibly different from commodity AI clarification
- no fake direction behavior appears in the UI

## Stability
- session/state behavior remains coherent
- submit/retry behavior is stable
- full required test suite remains green

## Product tests
- `screen-trust` PASS
- `flow-break` PASS
- `session-state` PASS
- `real-user-sim` PASS

---

# 14. FAILURE CONDITIONS

Phase 3 fails if:

- blank-page payload renders through generic clarification UI
- UI state contradicts backend product mode
- support fields overwhelm or confuse the user
- answer field behaves like a full essay drafting surface
- `too_thin_to_recover` appears as if it were a normal recovery state
- user input disappears unexpectedly
- submission state is unstable
- product tests regress
- real-user-sim regresses
- engineering cannot explain why a given payload rendered the screen it did

---

# 15. REVIEW GATE FOR PHASE 3

Before proceeding to Phase 4, engineering must present:

- screen captures or inspected render states for each blank-page mode
- one reviewed sample payload per mode
- user-flow walkthrough for draft → submit → retry/error behavior
- evidence that blank-page UI is distinct from clarification UI
- product and regression test results
- evidence that `too_thin_to_recover` fallback is bounded and dignified
- evidence that support fields do not create screen clutter or ambiguity

Phase 4 may begin only after this review passes.

---

# 16. REQUIRED ARTIFACTS

Produce:

## Markdown
- `STRUCTURED_BLANK_PAGE_INTAKE_PHASE_3_IMPLEMENTATION_SPEC_V1.md`

## JSON
- `structured_blank_page_intake_phase_3_implementation_spec_v1.json`

## Optional supporting artifact
A Phase 3 render review packet with:
- sample payload
- rendered screen description or capture
- expected visible fields
- mode label
- state label
- reviewer note
- pass/fail on trust and clarity

---

# 17. BUILD SUMMARY

Phase 3 is where Structured Blank-Page Intake becomes visible to the user.

If this phase is weak, the system will have:
- correct backend classification
- correct question selection
- but weak or contradictory product behavior

If this phase is strong, later phases can safely build:
- post-answer conversion logic
- telemetry and evaluation
- rollout validation
- measurable product performance on real users

So the standard for Phase 3 is simple:

**render the blank-page recovery lane as a distinct, trustworthy product mode, and do it in a way engineering can test, inspect, and trust.**