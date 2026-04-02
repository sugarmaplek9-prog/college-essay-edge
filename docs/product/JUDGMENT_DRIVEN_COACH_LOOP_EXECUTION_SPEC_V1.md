# JUDGMENT_DRIVEN_COACH_LOOP_EXECUTION_SPEC_V1.md

## Document control

- **Document name:** JUDGMENT_DRIVEN_COACH_LOOP_EXECUTION_SPEC_V1.md
- **Project:** College Essay Edge
- **Scope:** Product execution spec for judgment-driven coach loop after NDS
- **Audience:** engineering, product, UX, ML/reviewer ops, QA
- **Status:** Active build spec
- **Standard:** exact, build-facing, fail-closed, no-assumptions, implementation-ready

---

## 1. Purpose

This document translates the market wedge and ML truth into an executable product system.

The core truth is:

**Our system learns from real reviewed cases to pick stronger directions and prevent generic essay mistakes.**

This spec turns that truth into the next product layer:
**a judgment-driven coach loop that begins immediately after Narrative Direction Selection (NDS).**

This is not a strategy memo.
This is the build document for how the app should work.

---

## 2. Problem being solved

Current product weakness:
- NDS can often identify a reasonably strong direction
- but the student still may not know exactly what to do next
- the product can still feel like a polished explanation screen instead of a real coach

That means the system is still weak at:
- converting direction into writing momentum
- preventing generic drift in the first draft move
- giving the student a concrete, coached next step

This spec fixes that.

---

## 3. Product objective

After NDS chooses a direction, the app should behave like a strong essay coach:

1. identify the strongest direction,
2. explain it plainly,
3. ask one sharp follow-up question when needed,
4. turn the student’s answer into a concrete opening scaffold,
5. coach the next paragraph move,
6. actively prevent generic drift,
7. use ML/judgment signals to select the next best coaching move.

The student should feel:
- “I know what this essay is about.”
- “I know what to write first.”
- “I know what not to do.”
- “I know what to write next.”
- “This is helping me more than generic chat.”

---

## 4. Non-goals

This spec does not build:
- a full essay writer
- a broad admissions chatbot
- a generic brainstorming surface
- a freeform chat replacement
- a fully autonomous draft generator with no judgment constraints

This system must remain:
- selective
- corrective
- structured
- grounded in narrative judgment

---

## 5. Product model

The coach loop begins **after** NDS selects a direction.

### Current product model
- direction chosen
- explanation shown
- some next-step guidance shown

### New product model
- direction chosen
- plain-language essay center
- coach question if needed
- student response
- opening scaffold
- genericness guardrails
- next paragraph guidance
- refinement actions
- ML/judgment-informed next move

This changes the surface from:
**result page**
to
**guided coaching loop**

---

## 6. Core user promise

The user-facing promise of this flow is:

**We help you choose the right story and start writing it without sounding generic.**

The flow should make this true, not merely say it.

---

## 7. Entry condition

The coach loop starts only after:
- NDS selected a strongest direction
- the product has enough context to state what the essay is really about
- the system can either:
  - move directly into drafting, or
  - ask one targeted clarifying question first

If the system cannot do that, it should not enter the coach loop blindly.

---

## 8. High-level loop

The loop is:

### Step 1
Choose strongest direction

### Step 2
Translate direction into plain-language essay center

### Step 3
Decide whether a coach question is needed

### Step 4
If needed, ask one sharp follow-up question

### Step 5
Turn existing context + student response into an opening scaffold

### Step 6
Tell the student what not to do

### Step 7
Tell the student what to write right after the opening

### Step 8
Offer refinement actions

### Step 9
Use ML/judgment signals to decide the next coaching move

This loop may repeat in a constrained way, but it should never become vague free chat.

---

## 9. Screen-by-screen flow

## Screen 1 — strongest direction

### Goal
State the chosen direction clearly and simply.

### Required content
- one-line label: strongest direction
- one headline naming the direction
- one short plain-language subhead stating what the essay is really about

### Example output shape
- “Write the moment you chose presence over control.”
- “This essay is not mainly about classroom organization. It is about the moment your attention shifted and what that reveals about you.”

### Required quality rules
- plain English
- no abstract jargon without translation
- no multi-paragraph explanation
- must clearly identify the essay center

### Primary action
- continue into coaching

---

## Screen 2 — why this direction works

### Goal
Build trust without over-explaining.

### Required content
- 1–2 short paragraphs max
- explain why this direction is stronger than the more generic version

### Required quality rules
- no consultant tone
- no dense “analysis dump”
- no more than 2 short paragraphs
- must stay tied to the student’s real notes

### Example output shape
- “This works because it gives your essay a clear turning point. It shows something true about you in action instead of summarizing a trait.”

### Transition
From here, the system must choose one of two paths:
- direct drafting path
- question-first path

---

## Screen 3A — direct drafting path

Use when:
- direction is strong
- opening material is already concrete enough
- ambiguity is low enough that more questioning is not necessary

### Goal
Move the student into drafting immediately.

### Required sections
1. what to write first
2. what not to do
3. what to write right after the opening
4. primary CTA to start drafting

### Primary CTA
- Draft my opening now

### Secondary CTA
- Help me sharpen the moment first

### Optional tertiary CTA
- Show me what the weaker version would do

---

## Screen 3B — question-first path

Use when:
- direction is plausible but opening material is too abstract
- turning point is missing or weak
- student signal is too broad
- the system needs one missing concrete detail to unlock the draft

### Goal
Ask exactly one high-value question.

### Requirements
- ask one question only
- question must be specific enough to unlock a scene or choice
- question must not reopen the whole direction decision unless absolutely necessary

### Example question types
- “What exactly changed in that moment?”
- “What did you notice that made you stop?”
- “What was the choice you made right after that?”
- “What makes this memory more real than the other options?”

### CTA
- Save my answer
- Use this to draft my opening

---

## Screen 4 — opening scaffold

### Goal
Convert the chosen direction plus any follow-up answer into a usable opening start.

### Required content
- short helper line:
  - “You do not need the whole essay yet. Just start the opening.”
- scaffold prompt with 3–4 clear sequence steps
- editable draft box
- one starter line if appropriate

### Required sequence shape
1. what were you doing just before the shift?
2. what interrupted that routine?
3. what choice did you make?
4. what detail makes the moment real?

### Example starter line
- “I was lining up crayons next to a coloring book when I noticed…”

### Required guardrail
- do not explain the meaning too early
- stay in the scene first

### Primary CTA
- Save this opening

### Secondary CTA
- Make this less vague

---

## Screen 5 — next paragraph coaching

### Goal
Prevent the student from stopping after the opening.

### Required content
- explicit instruction for what comes next
- 2–4 sentence expectation
- anti-generic warning if needed

### Example shape
- “After the opening, write 2–3 sentences about why you stayed and what that choice revealed.”
- “Do not jump to the life lesson yet.”

### CTAs
- Help me write the next paragraph
- Make this more specific
- Make this sound more like me

---

## Screen 6 — refinement loop

### Goal
Allow narrow, high-value revisions without collapsing into broad chat.

### Allowed refinement actions
- Make this more specific
- Make this sound more like me
- Show me what feels generic
- Help me write the next paragraph
- Show me the weaker version

### Not allowed as primary flow
- open-ended unlimited chat with no structure
- large draft generation with no judgment constraints
- broad brainstorming reset by default

### System behavior
Each refinement action should:
- produce one constrained improvement
- explain why the change helps
- preserve the narrative center
- reduce genericness if applicable

---

## 10. ML / judgment decision points

ML must influence the flow in specific places.

## 10.1 Direction ranking
Input:
- reviewed case patterns
- gold cases
- failure-mode history
- product surface pattern classification

Output:
- strongest direction selection
- alternative weaker direction for contrast if useful

## 10.2 Need-for-question decision
Input:
- ambiguity level
- missing turning point signal
- thin-signal blank-page pattern
- confidence score
- prior failure likelihood

Output:
- direct drafting path
- question-first path

## 10.3 Follow-up question selection
Input:
- case family
- missing content type
- prior reviewed success on similar cases

Output:
- one best question to unlock the draft

## 10.4 Opening scaffold style selection
Input:
- case family
- student fit signal
- reviewed successful scaffolds
- genericness risk profile

Output:
- scene-first scaffold
- choice-first scaffold
- conflict-first scaffold
- reflection-delayed scaffold

## 10.5 Genericness correction
Input:
- weak-pattern detector
- reviewed failure modes
- over-polished / résumé-summary / cliché signals

Output:
- specific “do not” warnings
- weaker-version comparison if useful
- corrective refinement suggestions

## 10.6 Next coaching move
Input:
- student interaction path
- previous refinement choices
- lingering ambiguity
- known failure risk

Output:
- more specific
- more like me
- next paragraph
- weaker version
- one more question only if essential

---

## 11. Required data/state model additions

The app must retain enough state to drive the coach loop.

## Required state
- chosen strongest direction
- essay-about plain-language summary
- coach path selected:
  - direct drafting
  - question-first
- selected follow-up question if any
- student answer to follow-up
- opening scaffold version
- selected refinement action
- genericness risk flags
- current coaching stage
- product surface version
- ML/judgment influence metadata

## Suggested state keys
- `coach_loop_stage`
- `coach_loop_mode`
- `coach_question_key`
- `coach_question_response`
- `opening_scaffold_version`
- `genericness_guardrails`
- `next_move_type`
- `ml_influence_reason_codes`

These names can be adapted, but the concept must exist.

---

## 12. Backend/service responsibilities

## NDS service
Must output:
- strongest direction
- essay-about summary
- genericness warnings
- initial next-step structure

## Coach loop service
Must:
- choose question-first vs direct path
- generate follow-up question
- generate opening scaffold
- generate next paragraph instruction
- apply refinement actions

## Judgment service / ML layer
Must:
- influence ranking
- influence question selection
- influence warning selection
- influence next coaching move
- record which judgment signals affected the flow

## Audit / evaluation layer
Must:
- record path decisions
- link decisions to reviewed-case evidence where possible
- allow before/after evaluation

---

## 13. UI/UX rules

## 13.1 The student must always know the next action
Every screen must end with a concrete next move.

## 13.2 One question at a time
Do not ask multiple open-ended questions in the coach loop.

## 13.3 Limit abstraction
No section should sound like an internal evaluation memo.

## 13.4 Progress must feel real
The student should feel:
- closer to a draft after each step
- not just better informed

## 13.5 Primary CTA must move the student forward
Default CTA should favor writing momentum, not analysis.

---

## 14. Prompt/content rules

## Required content traits
- plain language
- concrete verbs
- imperative phrasing when giving next steps
- anti-generic correction in simple terms
- student-readable tone
- no fake-flattering language

## Forbidden traits
- “angle,” “frame,” “anchor,” or similar abstraction without explanation
- overlong explanation sections
- essay-coach theater with no real next move
- broad generic encouragement
- autopilot full-draft generation as the default

---

## 15. Acceptance criteria

This build is complete only if:

### 15.1 Student action clarity
A student can answer:
- what is my essay about?
- what do I write first?
- what do I avoid?
- what do I write next?

### 15.2 Coach-loop momentum
The product moves the student into a first real draft move, not just a better understanding.

### 15.3 Genericness prevention
The system clearly prevents the most common weak essay behaviors.

### 15.4 ML influence is real
At least one meaningful flow decision is visibly driven by reviewed-case learning, not just static copy.

### 15.5 Surface improvement is measurable
Old vs new vs baseline comparison shows:
- stronger actionability
- stronger student clarity
- stronger reviewer preference
- less genericness

---

## 16. Validation plan

This flow must be validated at three levels.

## 16.1 Internal product validation
- 60-second draftability check
- side-by-side screen comparison
- blocked-flow case tracking

## 16.2 Human clarity validation
- 3–5 students or proxies
- answer the five required clarity questions
- review CTA comprehension
- record hesitation points

## 16.3 ML product impact validation
Compare:
- old result flow
- new coach loop
- generic/baseline version

Measure:
- student clarity
- reviewer preference
- actionability
- genericness reduction
- next-step confidence

---

## 17. Rollout order

Use this rollout order:

### Phase 1
Implement direct drafting path on top of current improved post-NDS result screen

### Phase 2
Implement question-first path for high-ambiguity cases

### Phase 3
Implement opening scaffold refinement actions

### Phase 4
Implement next paragraph guidance

### Phase 5
Attach ML/judgment decisioning to:
- question selection
- warning selection
- next move selection

Do not attempt the full loop in one unvalidated jump.

---

## 18. Anti-patterns to avoid

- turning this into broad chat
- adding more explanation instead of stronger next steps
- shipping without old vs new vs baseline comparison
- hiding ML behind claims without visible product effect
- letting the coach loop generate generic scaffolds
- allowing static result screens to remain the final experience

---

## 19. Required artifacts to create next

After this spec, the next justified artifacts are:

### 19.1
`JUDGMENT_DRIVEN_COACH_LOOP_UI_COPY_V1.md`

### 19.2
`JUDGMENT_DRIVEN_COACH_LOOP_STATE_AND_ROUTE_SPEC_V1.md`

### 19.3
`JUDGMENT_DRIVEN_COACH_LOOP_PROMPT_AND_DECISION_SPEC_V1.md`

### 19.4
`ML_PRODUCT_IMPACT_VALIDATION_POST_NDS_COACH_LOOP_V1.md`

Do not create all at once unless engineering requests them.
Use them only if they directly unblock build.

---

## 20. Final standard

This product separates itself only if it does something generic essay AI usually does not:

**it learns from real reviewed cases to pick stronger directions, stop generic mistakes, and coach the student forward into a real draft.**

This spec is the execution bridge that makes that statement buildable.
