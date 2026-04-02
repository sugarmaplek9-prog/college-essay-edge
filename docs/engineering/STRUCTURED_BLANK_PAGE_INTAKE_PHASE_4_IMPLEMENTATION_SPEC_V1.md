# STRUCTURED_BLANK_PAGE_INTAKE_PHASE_4_IMPLEMENTATION_SPEC_V1

**College Essay Edge**  
**Phase 4 engineering spec**  
**Post-answer conversion path**

**Status**  
Build-ready implementation spec

**Derived from**  
`STRUCTURED_BLANK_PAGE_INTAKE_V1`  
`STRUCTURED_BLANK_PAGE_INTAKE_IMPLEMENTATION_PLAN_V1`  
`STRUCTURED_BLANK_PAGE_INTAKE_BUILD_BACKLOG_V1`  
`STRUCTURED_BLANK_PAGE_INTAKE_PHASE_1_IMPLEMENTATION_SPEC_V1`  
`STRUCTURED_BLANK_PAGE_INTAKE_PHASE_2_IMPLEMENTATION_SPEC_V1`  
`STRUCTURED_BLANK_PAGE_INTAKE_PHASE_3_IMPLEMENTATION_SPEC_V1`  
Completed Backlog Phase 1 implementation and planned Phase 2–3 behavior

---

## Purpose

Phase 4 implements the fourth production-critical layer of Structured Blank-Page Intake:

**once a user answers the blank-page recovery question, deterministically decide what happens next and convert recoverable cases into stronger downstream routes without fake progress, uncontrolled looping, or brittle escalation behavior.**

Phase 1 determines:
- whether the case belongs in the blank-page lane
- which blank-page mode applies

Phase 2 determines:
- what typed recovery question to ask
- what missing signal is being recovered

Phase 3 determines:
- how the lane appears in the product
- how the user answers inside a safe UI

Phase 4 must determine:
- whether the user’s answer created enough signal to move forward
- whether a second recovery question is justified
- whether the case should return to clarification
- whether the case remains too thin to recover
- how to bound recovery depth so the user never gets stuck in an endless loop

This phase is where the system either becomes:
- truly useful
- strategically progressive
- disciplined about evidence
- safe under real messy user behavior

or becomes:
- fake-forward
- stuck in repeated questioning
- unstable in route transitions
- untrustworthy in weak-signal cases

Phase 4 must therefore be:
- deterministic
- bounded
- stateful
- explainable
- testable

It is not broad narrative generation.  
It is the conversion contract after blank-page answer submission.

---

# 1. PHASE 4 OBJECTIVE

Implement deterministic post-answer routing for blank-page intake such that, after a user submits a recovery answer, the system assigns exactly one next-step route from the allowed set:

- `direction_light`
- `second_recovery_question`
- `clarification`
- `too_thin_to_recover`

The system must:
- promote genuinely improved cases forward
- request a second recovery question only when it is justified and bounded
- avoid inflating weak answers into fake direction
- avoid trapping users in repeated blank-page loops
- maintain clear case state and explainable route reasoning

At the end of Phase 4, the blank-page lane must no longer be a dead end.
It must be a controlled bridge into stronger downstream states.

---

# 2. OUT OF SCOPE FOR PHASE 4

Phase 4 does **not** include:

- full telemetry/event suite completion
- evaluation harness expansion
- rollout policy
- broad learned-judgment model work
- multi-step long-loop conversational design beyond the bounded second recovery path
- broader NDS reranking changes outside this lane
- screen redesign outside what is needed for route transitions
- premium launch hardening beyond this route logic

Phase 4 covers only:

- answer ingestion from blank-page mode
- post-answer route determination
- second-recovery eligibility
- bounded recovery depth
- escalation/fallback behavior
- case/session state updates required for safe progression
- route explainability fields required for debugging and review

---

# 3. REQUIRED FUNCTIONAL OUTCOME

At the end of Phase 4, the system must be able to say:

- this answer created enough real signal to permit a light direction route
- this answer improved the case, but one more targeted recovery question is justified
- this answer did not recover enough signal and should go to clarification
- this answer remains too thin to recover safely
- this case has already used its allowed recovery depth and must not loop further

That is the mission of Phase 4.

---

# 4. SYSTEM BEHAVIOR CONTRACT

## 4.1 Entry condition

Phase 4 logic runs only when:

- the active product mode is `blank_page_intake`
- a user has submitted an answer to the active recovery prompt
- the case has an existing blank-page state/history

Phase 4 must not run on:
- untouched blank-page screens before answer submission
- normal `ready_for_nds` cases
- unrelated clarification flows
- top-level true-block cases outside the blank-page lane

---

## 4.2 Allowed post-answer routes

Every submitted blank-page answer must resolve to exactly one of:

- `direction_light`
- `second_recovery_question`
- `clarification`
- `too_thin_to_recover`

No multi-route output is allowed.

### `direction_light`
Use when the answer now contains enough signal to justify light downstream narrative direction work without pretending the case is fully mature.

### `second_recovery_question`
Use when the answer meaningfully improved the case, but one additional targeted recovery question is likely to unlock a usable center.

### `clarification`
Use when the answer added some content, but the best next step is a non-blank-page clarification route rather than continued recovery inside this lane.

### `too_thin_to_recover`
Use when the answer remains too weak, incoherent, or non-recoverable for safe progression.

---

## 4.3 No-loop contract

A blank-page case must not remain in repeated recovery indefinitely.

Phase 4 must enforce:
- a maximum blank-page recovery depth
- a clear rule for when second recovery is allowed
- a clear escalation rule after second recovery fails

At minimum:
- one initial recovery question is allowed
- one second recovery question may be allowed if justified
- after the second failed recovery attempt, no further blank-page question loop is permitted in the same case state

---

# 5. POST-ANSWER ROUTE DECISION REQUIREMENTS

## 5.1 `direction_light`

### Use when
The user answer now contains:
- a concrete moment, hinge, or lived event
- a meaningful personal center
- enough evidence to support a cautious downstream direction step

### Required behavior
- move the case forward
- preserve that this came from recovery
- do not overstate confidence
- do not pretend the case is fully solved

### Must not do
- promote shallow summary into fake direction
- reward generic abstraction
- skip route traceability

---

## 5.2 `second_recovery_question`

### Use when
The user answer:
- improved the case materially
- narrowed the topic or signal
- suggests one more specific question could unlock the needed center

### Required behavior
- second recovery must be targeted, not generic
- second recovery must only occur if depth budget allows
- second recovery must be visibly distinct from aimless repetition

### Must not do
- use as a default fallback
- repeat the same question family without justification
- continue after depth budget is exhausted

---

## 5.3 `clarification`

### Use when
The answer:
- provides some usable material
- does not justify direct narrative movement
- is better handled through standard clarification than continued blank-page recovery

### Required behavior
- exit the blank-page lane cleanly
- preserve recovered material in case state
- avoid discarding the user’s progress

### Must not do
- bounce the user back to a contradictory blank-page state without explanation
- treat clarification as punishment

---

## 5.4 `too_thin_to_recover`

### Use when
The answer remains:
- empty or nearly empty
- off-domain
- incoherent
- too weak for either direction or meaningful clarification
- beyond allowed recovery depth without sufficient improvement

### Required behavior
- end the blank-page lane in a bounded way
- preserve trust
- avoid fake optimism

### Must not do
- ask a third recovery question
- invent progress
- degrade into harsh block language

---

# 6. ANSWER QUALITY AND RECOVERY SIGNAL REQUIREMENTS

Phase 4 must inspect answer content for recovery signal.
At minimum, it must evaluate whether the answer now contains:

- concrete moment evidence
- hinge/shift evidence
- lived event anchoring
- personal center beyond topic/activity label
- tension, responsibility, conflict, or change where relevant
- enough coherence to support a next route

It must not over-index on:
- polish
- length alone
- rhetorical style
- admissions sophistication

A short but real answer may be more recoverable than a long vague one.

---

# 7. BOUNDED RECOVERY DEPTH CONTRACT

## 7.1 Required state fields

The system must track, at minimum:

- `blank_page_recovery_depth`
- `blank_page_previous_mode`
- `blank_page_previous_question_family`
- `blank_page_previous_route_after_answer`
- `blank_page_answer_history` or equivalent summarized history
- `blank_page_recovery_exhausted: boolean`

Exact names may vary, but these concepts must exist.

---

## 7.2 Initial depth rules

Recommended baseline:
- initial blank-page question = depth 1
- second recovery question = depth 2 maximum
- no depth 3 in the same case progression

This baseline may be revised later only by explicit reviewed policy change.

---

## 7.3 Exhaustion rule

If:
- depth is already 2
- and the second recovery attempt does not produce enough signal for forward movement

then:
- `second_recovery_question` is no longer allowed
- route must resolve to either `clarification` or `too_thin_to_recover`

This rule must be deterministic.

---

# 8. IMPLEMENTATION REQUIREMENTS

## 8.1 Files in scope

Likely required files:

- first-minute answer handling path
- case state handling layer
- downstream route decision layer
- any blank-page answer ingestion helper
- any state/history persistence helper used by first-minute flow

Likely touched types:
- `src/types/intake.ts`
- case/session state types
- response/action result types
- debug/log types

Recommended new helper files if needed:
- `src/lib/fm/handleBlankPageAnswer.ts`
- `src/lib/fm/resolveBlankPagePostAnswerRoute.ts`
- `src/lib/fm/blankPageRecoveryState.ts`

---

## 8.2 Architecture requirement

Phase 4 must be implemented as a distinct post-answer routing layer, not as scattered conditional logic across UI handlers and downstream generators.

Recommended separation:
- Phase 3 handles answer capture/submission
- Phase 4 ingests answer and evaluates recovery signal
- Phase 4 outputs exactly one next-step route
- downstream route handlers consume that result

This separation must remain explicit in code.

---

## 8.3 Required outputs

For every submitted blank-page answer, the system must expose:

- `post_answer_route`
- `post_answer_route_reason`
- `blank_page_recovery_depth`
- `blank_page_recovery_exhausted`
- `recovered_signal_summary` or equivalent normalized explanation
- `route_after_answer_debug` or equivalent inspection surface

Optional if useful:
- `forwardable_topic_candidate`
- `forwardable_event_candidate`
- `requires_second_recovery_focus`

These outputs must be visible to downstream code and debug inspection.

---

# 9. SECOND RECOVERY QUESTION REQUIREMENTS

If `second_recovery_question` is selected:

- the new question must be targeted based on what is still missing
- it must not duplicate the first question lazily
- it must respect the updated recovery depth
- it must preserve the case history so the system knows this is the second attempt

The second recovery question may use:
- a new family
- a refined version of the prior family
- a narrower prompt based on the first answer

But it must be explainable.

---

# 10. CASE STATE AND SESSION REQUIREMENTS

## 10.1 State persistence

The system must preserve:
- original blank-page mode
- answer history
- depth count
- route transitions after each answer

This persistence must survive the normal session flow used in the product.

---

## 10.2 Non-destructive progression

When a user answer improves the case:
- recovered information must not be discarded
- forward routes must receive the improved material
- clarification routes must inherit useful recovered context where appropriate

---

## 10.3 Fail-closed rule

If state is missing, malformed, or contradictory:
- Phase 4 must fail closed to a safe bounded result
- it must not hallucinate route confidence
- it must not create a phantom second recovery loop

---

# 11. DEBUG AND OBSERVABILITY REQUIREMENTS

Phase 4 must make it possible for engineering to answer:

- why did this answer go to this route?
- why was a second recovery question allowed or denied?
- what recovery depth was active?
- what signal was considered recovered?
- why did the system choose clarification vs too-thin fallback?
- was a fake-forward promotion avoided?

Required debug fields:

- `blank_page_mode`
- `blank_page_recovery_depth`
- `post_answer_route`
- `post_answer_route_reason`
- `blank_page_recovery_exhausted`
- `recovered_signal_summary`
- prior question family / current unresolved missing signal where applicable

These must appear in local inspection and any route-audit path.

---

# 12. TEST PLAN

## 12.1 Answer transition tests

Must verify:

- blank-page answer can route to `direction_light`
- blank-page answer can route to `second_recovery_question`
- blank-page answer can route to `clarification`
- blank-page answer can route to `too_thin_to_recover`

Each allowed route must have explicit coverage.

---

## 12.2 No-loop tests

Must verify:

- initial recovery can allow second recovery when justified
- second recovery cannot repeat indefinitely
- depth 3 is blocked
- exhausted recovery state routes deterministically away from further blank-page questioning

---

## 12.3 State integrity tests

Must verify:

- depth increments correctly
- answer history persists
- route transitions preserve case state
- recovered context is not dropped on forward route
- malformed state fails closed

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

Phase 4 is complete only if all of the following are true.

## Functional
- every submitted blank-page answer resolves to exactly one allowed route
- some recoverable cases move forward correctly
- second recovery is available only when justified
- unrecoverable cases stop safely

## Stability
- no infinite blank-page loop exists
- depth budget is enforced
- case state remains coherent
- recovered material persists correctly

## Trust
- no fake-forward inflation appears
- clarification is used intelligently rather than as drift
- too-thin fallback remains bounded and dignified

## Debuggability
- route-after-answer is visible and explainable
- recovery depth is visible
- route reasons are inspectable

## Product tests
- `screen-trust` PASS
- `flow-break` PASS
- `session-state` PASS
- `real-user-sim` PASS

## Regression
- full required test suite remains green

---

# 14. FAILURE CONDITIONS

Phase 4 fails if:

- recoverable answers are promoted too aggressively into fake direction
- weak answers get stuck in repeated recovery loops
- second recovery is used as a lazy fallback
- depth exhaustion is not enforced
- recovered context is lost during transition
- clarification and too-thin routes are indistinguishable
- case state becomes incoherent
- product tests regress
- real-user-sim regresses
- engineering cannot explain why a post-answer route was chosen

---

# 15. REVIEW GATE FOR PHASE 4

Before proceeding to Phase 5, engineering must present:

- reviewed examples of each allowed post-answer route
- at least 3–5 sample answer transitions per major mode family
- evidence that second recovery is targeted and bounded
- no-loop test results
- state persistence examples
- product and regression test results
- evidence that fake-forward cases were correctly held back

Phase 5 may begin only after this review passes.

---

# 16. REQUIRED ARTIFACTS

Produce:

## Markdown
- `STRUCTURED_BLANK_PAGE_INTAKE_PHASE_4_IMPLEMENTATION_SPEC_V1.md`

## JSON
- `structured_blank_page_intake_phase_4_implementation_spec_v1.json`

## Optional supporting artifact
A Phase 4 transition review packet with:
- original blank-page mode
- initial question
- user answer
- post-answer route
- route reason
- recovery depth
- reviewer note
- pass/fail on bounded progression

---

# 17. BUILD SUMMARY

Phase 4 is where Structured Blank-Page Intake becomes a true bridge instead of a front-end question wrapper.

If this phase is weak, the system will:
- ask good questions
- render them well
- but fail to move cases forward safely

If this phase is strong, later phases can safely build:
- telemetry and evaluation
- rollout validation
- real product measurement on messy inputs

So the standard for Phase 4 is simple:

**convert recovery answers into the right next route, preserve trust, and never let the lane loop or fake progress.**