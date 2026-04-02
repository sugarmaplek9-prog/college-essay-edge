# STRUCTURED_BLANK_PAGE_INTAKE_PHASE_2_IMPLEMENTATION_SPEC_V1

**College Essay Edge**  
**Phase 2 engineering spec**  
**Structured recovery question engine**

## Status

Build-ready implementation spec

## Derived from

- `STRUCTURED_BLANK_PAGE_INTAKE_V1`
- `STRUCTURED_BLANK_PAGE_INTAKE_IMPLEMENTATION_PLAN_V1`
- `STRUCTURED_BLANK_PAGE_INTAKE_BUILD_BACKLOG_V1`
- `STRUCTURED_BLANK_PAGE_INTAKE_PHASE_1_IMPLEMENTATION_SPEC_V1`
- Completed Backlog Phase 1 implementation results

---

## Purpose

Phase 2 implements the second production-critical layer of Structured Blank-Page Intake:

Once a case has been classified into a blank-page mode, emit the correct typed recovery question and missing-signal contract instead of generic clarification or blunt block behavior.

Phase 1 decided what kind of weak-start case this is.  
Phase 2 must decide what the system should ask next.

This phase is where the product either becomes:

- precise
- dignified
- strategically helpful

or collapses back into:

- generic AI probing
- “tell me more” sludge
- weak, trust-eroding coaching language

Phase 2 must therefore be:

- typed
- bounded
- mode-specific
- deterministic
- inspectable
- testable

It is not a copywriting exercise.  
It is a product-behavior contract.

---

## 1. PHASE 2 OBJECTIVE

Implement a deterministic question-selection layer that, for every case with:

`top_level_blank_page_route = needs_structured_blank_page_intake`

and exactly one assigned `blank_page_mode`, emits:

- a primary recovery question
- an optional secondary recovery question
- a missing-signal type
- a reason the case is not yet ready for direction
- optional scaffolding fields to help the user answer well
- a bounded fallback path for `too_thin_to_recover`

The system must produce recovery questions that are:

- mode-specific
- strategically purposeful
- non-generic
- non-repetitive
- non-fake
- appropriate to the user’s current state

This phase must ensure that users who arrive with only:

- a topic
- a theme
- an activity
- scope uncertainty
- no topic at all

are met with the right next question, not generic clarification.

---

## 2. OUT OF SCOPE FOR PHASE 2

Phase 2 does not include:

- final major UI redesign
- full screen rendering implementation
- post-answer routing logic after submission
- telemetry suite completion
- broad reranker changes
- learned-judgment model work
- generalized essay coaching
- multi-turn loop orchestration beyond selecting the current recovery prompt

Phase 2 covers only:

- question-family selection
- mode-specific question composition
- missing-signal typing
- response payload fields needed for downstream rendering
- fallback behavior for unrecoverable thin cases within the blank-page lane

---

## 3. REQUIRED FUNCTIONAL OUTCOME

At the end of Phase 2, the system must be able to say:

- this user is in `topic_probe`, so ask a moment-finding question
- this user is in `theme_probe`, so ask for lived evidence, not abstract intention
- this user is in `activity_probe`, so ask for the center inside the activity, not whether the activity is allowed
- this user is in `scope_reframe`, so reframe from worthiness anxiety to specific signal search
- this user is in `blank_page_discovery`, so open a bounded discovery question that can uncover a usable story-zone
- this user is in `too_thin_to_recover`, so return a graceful, explicit recovery-stop behavior

That is the mission of Phase 2.

---

## 4. SYSTEM BEHAVIOR CONTRACT

### 4.1 Entry condition

Phase 2 logic runs only when:

`top_level_blank_page_route = needs_structured_blank_page_intake`

and

`blank_page_mode` is one of:

- `topic_probe`
- `theme_probe`
- `activity_probe`
- `scope_reframe`
- `blank_page_discovery`
- `too_thin_to_recover`

Phase 2 must not run on:

- normal `ready_for_nds` cases
- top-level `true_block` cases outside the blank-page lane

### 4.2 Output contract

For eligible cases, Phase 2 must emit:

- `recovery_question_primary: string`
- `recovery_question_secondary: string | null`
- `missing_signal_type: string`
- `why_not_ready_for_direction: string`
- `next_step_type: string`
- `reassurance_copy: string | null`
- `example_answer_shape: string | null`
- `what_good_signal_would_look_like: string | null`

Optional if useful:

- `topic_candidate: string | null`
- `question_family_primary: string`
- `question_family_secondary: string | null`

These outputs must be deterministic given:

- input text
- Phase 1 mode assignment
- current code version
- current template set

No stochastic generation is allowed in Phase 2 question selection.

---

## 5. REQUIRED QUESTION-FAMILY MODEL

Phase 2 must use a typed question-family system, not freeform prompting.

### 5.1 Required question families

The following family types must exist:

- `moment_question`
- `hinge_question`
- `responsibility_question`
- `person_over_task_question`
- `conflict_question`
- `change_question`
- `scope_reframe_question`
- `blank_page_discovery_question`

These are the canonical families for Phase 2.

### 5.2 Family purposes

#### `moment_question`
Use to locate a specific lived moment inside a broad topic or activity.

#### `hinge_question`
Use to identify a turn, shift, realization, or before/after transition.

#### `responsibility_question`
Use to surface responsibility, pressure, care, obligation, or burden.

#### `person_over_task_question`
Use to pull the user away from generic activity description and toward identity, tension, or relationship.

#### `conflict_question`
Use to uncover tension, friction, mismatch, uncertainty, difficulty, or resistance.

#### `change_question`
Use to surface internal movement, changed perception, changed priorities, or changed self-understanding.

#### `scope_reframe_question`
Use when the user is fixated on “is this enough?” rather than on extracting signal.

#### `blank_page_discovery_question`
Use when the user has no usable topic and needs bounded discovery rather than random brainstorming.

---

## 6. MODE-TO-QUESTION CONTRACT

### 6.1 `topic_probe`

- **Missing signal:** moment, hinge, human stake, lived evidence
- **Primary family:** `moment_question` or `hinge_question`
- **Secondary family:** `change_question` or `conflict_question`
- **Must do:** move from topic noun to lived center
- **Must not do:** generic “tell me more”, topic-worthiness validation, premature direction

### 6.2 `theme_probe`

- **Missing signal:** event anchor, concrete evidence
- **Primary family:** `change_question` or `hinge_question`
- **Secondary family:** `conflict_question` or `moment_question`
- **Must do:** convert trait language into lived evidence
- **Must not do:** reward abstraction

### 6.3 `activity_probe`

- **Missing signal:** central moment, tension, identity signal beyond activity label
- **Primary family:** `person_over_task_question` or `moment_question`
- **Secondary family:** `responsibility_question`, `conflict_question`, or `change_question`
- **Must do:** move from activity description to personal center
- **Must not do:** résumé-level summary prompts

### 6.4 `scope_reframe`

- **Missing signal:** signal extraction and framed center
- **Primary family:** `scope_reframe_question`
- **Secondary family:** `change_question` or `moment_question`
- **Must do:** reframe from worthiness anxiety to signal search
- **Must not do:** answer worthiness directly

### 6.5 `blank_page_discovery`

- **Missing signal:** topic candidate / narrative zone
- **Primary family:** `blank_page_discovery_question`
- **Secondary family:** `responsibility_question`, `conflict_question`, or `change_question`
- **Must do:** bounded discovery
- **Must not do:** broad brainstorming sludge

### 6.6 `too_thin_to_recover`

- **Missing signal:** recoverable signal overall
- **Primary family:** none (graceful fallback state)
- **Must do:** explicit recovery-stop behavior with narrow restart ask
- **Must not do:** hallucinated specificity

---

## 7. BANNED PROMPT PATTERNS

Banned unless explicitly approved by reviewed exception:

- “Tell me more.”
- “Can you elaborate?”
- “What do you mean?”
- “Why is this important to you?” as generic fallback
- “What are you passionate about?”
- “What do you want colleges to know about you?”
- “What makes you unique?”
- “Can you say more about that topic?”
- “What did you learn?” as generic primary
- “What are some moments in your life?”
- “What are 3–5 topics you could write about?”
- “That sounds like a great topic” without evidence basis

---

## 8. MISSING-SIGNAL TYPING CONTRACT

Allowed values:

- `missing_moment`
- `missing_hinge`
- `missing_lived_evidence`
- `missing_personal_center`
- `missing_scope_frame`
- `missing_topic_candidate`
- `missing_recoverable_signal`

Default mapping:

- `topic_probe` → `missing_moment` or `missing_hinge`
- `theme_probe` → `missing_lived_evidence`
- `activity_probe` → `missing_personal_center`
- `scope_reframe` → `missing_scope_frame`
- `blank_page_discovery` → `missing_topic_candidate`
- `too_thin_to_recover` → `missing_recoverable_signal`

---

## 9. WHY-NOT-READY CONTRACT

Phase 2 must emit `why_not_ready_for_direction`.

This field is for:

- system interpretability
- engineering debugging
- admin/review surfaces
- later error analysis

It is not primarily user-facing copy.

---

## 10. QUESTION COMPOSITION REQUIREMENTS

### 10.1 Determinism

Given same input + same mode + same trigger set + same template set version, selection output must match exactly.

### 10.2 Template inventory

Recommended minimum:

- 3–5 reviewed templates per primary family slot
- 2–3 reviewed templates per optional secondary slot

Templates must be named, reviewed, and versioned.

### 10.3 Personalization boundary

Allowed: light reflection of user-supplied term (for example “Inside robotics…”).  
Not allowed: invented details or fake assumptions.

### 10.4 Tone

Must be calm, precise, strategically helpful; not vague, syrupy, or commodity-coaching style.

---

## 11. PAYLOAD CONTRACT REQUIREMENTS

### 11.1 Files in scope

Required:

- `src/lib/fm/buildClarificationPayload.ts`

Recommended new helper:

- `src/lib/fm/buildBlankPagePayload.ts`

Likely supporting:

- first-minute response assembly layer
- route response builder
- prompt/template registry
- state contract files carrying payload fields
- `src/types/intake.ts`

### 11.2 Required payload outputs

- `product_mode = 'blank_page_intake'`
- `blank_page_mode`
- `recovery_question_primary`
- `recovery_question_secondary`
- `recovery_confidence`
- `missing_signal_type`
- `why_not_ready_for_direction`
- `next_step_type`
- `reassurance_copy`
- `example_answer_shape`
- `what_good_signal_would_look_like`

Optional:

- `topic_candidate`
- `question_family_primary`
- `question_family_secondary`

### 11.3 `next_step_type` allowed values

- `answer_primary_question`
- `answer_primary_or_secondary_question`
- `provide_more_concrete_starting_point`
- `recovery_stop`

---

## 12. IMPLEMENTATION REQUIREMENTS

- Keep Phase 2 as a distinct layer from Phase 1 classifier logic.
- Recommended helper responsibilities:
  - `buildBlankPagePayload()`
  - `selectPrimaryQuestionFamily()`
  - `selectSecondaryQuestionFamily()`
  - `resolveMissingSignalType()`
  - `buildWhyNotReadyForDirection()`
  - `selectRecoveryQuestionTemplate()`
- Keep template inventory diffable and versionable.

---

## 13. DEBUG AND OBSERVABILITY REQUIREMENTS

Required debug fields:

- `blank_page_mode`
- `question_family_primary`
- `question_family_secondary`
- `missing_signal_type`
- `why_not_ready_for_direction`
- `selected_template_id` (or equivalent)
- `recovery_confidence`

Must be visible in local inspection and route-audit debug/log paths.

---

## 14. TEST PLAN

### 14.1 Unit tests

Cover mode-specific behavior for:

- `topic_probe`
- `theme_probe`
- `activity_probe`
- `scope_reframe`
- `blank_page_discovery`
- `too_thin_to_recover`

### 14.2 Template quality tests

Verify:

- banned phrase list absent
- no generic “tell me more”
- no mode-collapse near-duplicates (unless approved)
- bounded readable length
- tone stability

### 14.3 Integration tests

Verify:

- Phase 1 mode feeds Phase 2 selection correctly
- payload fields propagate
- `product_mode = blank_page_intake` where required
- too-thin path is distinct

### 14.4 Product tests

- `npm run test:product:screen-trust`
- `npm run test:product:flow-break`
- `npm run test:product:session-state`
- `npm run test:product:real-user-sim`

### 14.5 NDS regressions

- `npm run test:nds:evidence-grounding`
- `npm run test:nds:direction-line-fit`
- `npm run test:nds:direction-stability`

### 14.6 Full regression

- `npm test`

---

## 15. ACCEPTANCE CRITERIA

Phase 2 is complete only if all are true:

- every blank-page mode emits specific primary question
- mode-question fit is correct and visibly typed
- missing-signal typing is correct and exposed
- `too_thin_to_recover` path is distinct and safe
- banned generic prompts are absent
- payload contract compiles and downstream consumers remain stable
- no premature direction inflation or fake specificity
- required regression suite remains green
- real-user-sim remains PASS

---

## 16. FAILURE CONDITIONS

Phase 2 fails if:

- outputs collapse into generic clarification language
- modes emit effectively same question patterns
- missing-signal typing is wrong/invisible
- scope anxiety is answered directly instead of reframed
- discovery prompts degrade into broad brainstorming
- too-thin path pretends recoverability
- regressions fail
- engineering cannot explain why a question was chosen

---

## 17. REVIEW GATE FOR PHASE 2

Before Phase 3:

- 3–5 reviewed samples per blank-page mode
- selected question family per sample
- missing-signal type per sample
- why-not-ready reason per sample
- template identifier evidence
- banned-pattern absence evidence
- unit + regression results
- demonstrated mode distinction

Phase 3 begins only after this gate passes.

---

## 18. REQUIRED ARTIFACTS

Produce:

- `STRUCTURED_BLANK_PAGE_INTAKE_PHASE_2_IMPLEMENTATION_SPEC_V1.md`
- `structured_blank_page_intake_phase_2_implementation_spec_v1.json`

Optional supporting artifact:

Phase 2 question review packet including:

- 3–5 sample inputs per mode
- assigned mode
- selected question families
- primary/secondary question
- missing-signal type
- reviewer note
- banned-pattern check result

---

## 19. BUILD SUMMARY

Phase 2 converts the blank-page lane from classifier-only behavior into real recovery behavior.

If weak: generic, repetitive, trust-eroding.  
If strong: safe foundation for UI rendering, answer flow, post-answer conversion, and measurable recovery performance.

Standard:

Ask the right next question for the right weak-start case, in a way engineering can inspect, test, and trust.
