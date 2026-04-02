# V1_USER_FLOW_AND_STATE_MAP

## 1. Purpose

This document defines the authoritative v1 user flow and product state map for College Essay Edge.

It is the product/frontend truth for:

* who enters where
* what each core workflow does
* what state the user can be in at each step
* what changes when AI runs, succeeds, partially succeeds, asks for more input, or is blocked
* what becomes saved, selected, current, stale, historical, or review-affected
* what supporting adults can view
* what admins can inspect

This is not a wireframe document.
This is not copywriting.
This is not generic UX theory.

This is the state contract between product, frontend, backend, and AI execution.

If UI behavior conflicts with this document, this document wins unless formally revised.

---

## 2. Product UX doctrine

### 2.1 v1 is a workflow product, not a chatbot shell

The user should move through bounded work surfaces tied to real admissions tasks.

The system should not center an open-ended “ask anything” box.

That is consistent with the scope lock, which explicitly rejects a chatbot-first product and limits launch to a small set of bounded modules.

### 2.2 The product should create decision progress, not content sprawl

Every major user flow should move the student toward one of these outcomes:

* clearer discovery
* better story inventory
* stronger narrative selection
* better draft revision priorities
* sharper supplement positioning

If a flow produces more text but not better decisions, it is wrong for v1.

### 2.3 The UI must reflect real backend state, not implied state

The data model explicitly separates:

* workflow state
* artifact state
* selected state
* historical state
* validator state
* review state
* provenance state

The UI must not collapse those into one simplistic “done/not done” flag.

### 2.4 Honest friction is better than fake helpfulness

When evidence is weak, the UI should visibly stop, narrow, or ask for more input.
It should not present flattering but generic AI filler. The orchestration and API contracts both require needs-more-input to be a first-class product state rather than a disguised failure.

### 2.5 Canonical and historical states must both exist

The product needs a clear “current working state” while preserving prior artifacts and choices. The data model already locks this separation.

---

## 3. The v1 experience model

The v1 product is best understood as five connected workspaces, not five isolated tools.

### 3.1 Workspace sequence

The intended user journey is:

1. **Onboarding / profile setup**
2. **Edge Snapshot**
3. **Story Vault**
4. **Narrative Direction Selection**
5. **Essay Feedback**
6. **Supplement Angle Suggestion**

This does **not** mean every student must complete every step before touching the next one.
But it does mean the experience should be organized around a clear progression from discovery → choice → revision → package support.

### 3.2 The real product center

The center of gravity is not Edge Snapshot.
The center of gravity is the combined system of:

* Story Vault
* Direction Selection
* Essay Feedback

That is where the product either feels clearly better than free AI or fails.

### 3.3 Primary work surfaces

The student-facing v1 should have these main surfaces:

* **Home / Progress Dashboard**
* **Profile & Onboarding**
* **Edge Snapshot**
* **Story Vault**
* **Personal Statement Workspace**
* **Supplements Workspace**
* **Settings / Linked Access**

The admin-facing v1 should have:

* **Review Queue**
* **Artifact Detail View**
* **Label / Review Action Surface**
* **Benchmark Candidate Capture Surface**

---

## 4. Core state vocabulary

The frontend and backend must use a common state language.

### 4.1 Entity lifecycle states

These apply to work objects like Story Vault entries, essay projects, supplement projects, and draft versions.

* `not_started`
* `in_progress`
* `ready_for_module`
* `awaiting_user_choice`
* `selected`
* `stale`
* `archived`

### 4.2 AI run states

These come from the AI service contract and must be exposed consistently in product behavior:

* `queued`
* `running`
* `completed`
* `partial`
* `needs_more_input`
* `failed_validation`
* `blocked`
* `system_error`

### 4.3 Artifact states

Artifacts themselves can be:

* `success`
* `partial`
* `needs_more_input`
* `failed_validation`

### 4.4 UI presentation states

Every major screen must be able to express:

* `empty`
* `drafting`
* `loading`
* `ready`
* `result_available`
* `selection_required`
* `saved`
* `stale`
* `needs_more_input`
* `review_affected`
* `error`

### 4.5 Review-aware states

Review does not always mean “hidden from student.”

Use:

* `review_not_required`
* `review_queued_nonblocking`
* `review_queued_blocking`
* `review_resolved`

Blocking review should be rare in student UX and mostly reserved for authenticity or severe validator issues.

---

## 5. Entry points and navigation rules

### 5.1 First-time student entry

A first-time student lands in **Onboarding / Profile Setup**.

The product should not drop them directly into Story Vault or essay feedback before there is enough basic context to make the system useful.

### 5.2 Returning student entry

A returning student lands in **Home / Progress Dashboard**.

The dashboard should answer four questions immediately:

* what has been completed
* what the strongest next move is
* what is waiting for user choice
* where additional input is needed

### 5.3 Primary navigation

Recommended top-level nav:

* Home
* Story Vault
* Personal Statement
* Supplements
* Profile

Edge Snapshot does not need to be a permanent top-level nav item if it is naturally surfaced inside Home and Profile.

### 5.4 Supporting adult entry

Supporting adults should land in a linked-student overview with read-oriented visibility, not a student-authoring workspace. Permissions already distinguish supporting-adult access from student control.

### 5.5 Admin entry

Admins land in Review Queue, not in student workspaces.

---

## 6. Global screen-state rules

These rules apply across all student-facing workspaces.

### 6.1 Empty state rule

Empty states must do two things:

* explain what this workspace is for
* ask for the minimum next action that unlocks a meaningful result

They must not dump long marketing copy.

### 6.2 Loading state rule

Loading must be tied to a real run state.

Do not show vague “thinking…” language.
Show progress as:

* preparing context
* generating
* validating
* finalizing result

This reflects the actual orchestration path and helps avoid fake magic.

### 6.3 Partial result rule

If the result is partial, the UI must make that visible.
Do not render partial artifacts as if they are complete.

### 6.4 Needs-more-input rule

Needs-more-input is a productive state.
It should clearly tell the user:

* why the system stopped
* what is missing
* what to do next

### 6.5 Error rule

Distinguish between:

* user-fixable input issues
* eligibility/workflow issues
* system/service issues

Do not collapse all of those into “Something went wrong.”

### 6.6 Stale state rule

If upstream evidence changes materially, dependent artifacts should show as stale, not silently remain “current.”

---

## 7. Home / Progress Dashboard flow

## 7.1 Purpose

Home is not a generic dashboard.
Its job is to orient the student toward the highest-value next action.

## 7.2 Dashboard sections

Recommended sections:

* **Progress Snapshot**
* **Current Best Next Step**
* **Awaiting Your Choice**
* **Needs More Input**
* **Recent Results**
* **Supplements in Progress**

## 7.3 Home states

### `empty`

User has not completed onboarding.

Show:

* onboarding CTA
* short explanation of what the product helps with

### `ready_for_snapshot`

Onboarding complete, no Edge Snapshot artifact yet.

Show:

* run Edge Snapshot CTA
* explanation of why it matters

### `active_progress`

At least one workspace has meaningful saved state.

Show:

* current selected direction if any
* current draft status
* story inventory count
* supplement project count
* strongest next step

### `awaiting_choice`

At least one artifact requires a user decision.

Examples:

* direction options available, none selected
* supplement angle options available, none selected

### `needs_input`

One or more workspaces are blocked on user input.

Examples:

* story depth insufficient
* no draft uploaded
* supplement prompt missing

## 7.4 Home should never do

* show long-form AI output inline as the main experience
* present five equal CTAs with no prioritization
* pretend the system knows the next move if it does not

---

## 8. Onboarding / Profile flow

## 8.1 Purpose

Collect the minimum student context needed to make downstream modules materially better.

## 8.2 Key outputs

* `student_profile`
* `onboarding_session`
* optional initial story seeds
* eligibility to generate Edge Snapshot

## 8.3 Flow steps

1. create account / authenticate
2. choose role
3. complete student profile basics
4. answer discovery questions
5. finish onboarding
6. route to Edge Snapshot entry point

## 8.4 Onboarding states

### `not_started`

No onboarding session or profile completeness is too low.

### `in_progress`

Onboarding session exists, incomplete.

### `completed_unprocessed`

Onboarding is complete, but Edge Snapshot has not been run.

### `completed_with_snapshot`

Onboarding complete and Edge Snapshot artifact exists.

## 8.5 Edge conditions

If onboarding is technically complete but context is still weak, the system may still allow Edge Snapshot and return a reduced or needs-more-input result. Weak evidence must be surfaced honestly, not padded.

---

## 9. Edge Snapshot flow

## 9.1 Purpose

Turn early onboarding material into a sharper discovery synthesis.

## 9.2 User promise

“Show me the most promising themes and what I still need to figure out.”

## 9.3 Entry points

* automatic CTA after onboarding completion
* Home dashboard prompt
* Profile workspace refresh action

## 9.4 Flow

1. student enters from onboarding or Home
2. student sees current readiness summary
3. student runs Edge Snapshot
4. run enters `queued` / `running`
5. artifact resolves to one of:

   * success
   * partial
   * needs-more-input
   * blocked
6. result is saved and surfaced on Home

## 9.5 Result states

### `success`

Show:

* top themes
* strongest early narrative possibilities
* missing discovery areas
* CTA to Story Vault or Direction Selection

### `partial`

Show:

* strongest usable signals
* explicit warning that coverage is incomplete
* recommended next input action

### `needs_more_input`

Show:

* what kinds of missing input are preventing a sharper result
* CTA to add stories or deepen profile responses

### `blocked`

Student-facing block should be rare here.
If it happens, show a safe summary and route the user back to profile improvement.

## 9.6 Saved vs current behavior

Newest admissible snapshot becomes the current snapshot unless intentionally superseded rules say otherwise.
Prior snapshots remain historical.

---

## 10. Story Vault flow

## 10.1 Purpose

Help the student build, inspect, and improve the raw material the rest of the system depends on.

## 10.2 User promise

“Collect your best stories, see which ones are actually strong, and notice what’s missing.”

## 10.3 Story Vault structure

Recommended sections:

* Story list
* Story entry detail
* Add/edit story
* Story Vault Analysis summary panel
* Underused material / gaps panel

## 10.4 Primary actions

* add story
* edit story
* archive story
* run / refresh Story Vault Analysis
* link story to active project later

## 10.5 Story Vault states

### `empty`

No stories exist.

Show:

* explanation of why Story Vault matters
* CTA to add first story

### `drafting_inventory`

1–2 stories exist but not enough depth for strong downstream use.

### `analysis_ready`

Enough material exists to run Story Vault Analysis.

### `analysis_available`

At least one admissible Story Vault Analysis artifact exists.

### `analysis_stale`

Story inventory changed materially after the latest analysis artifact.

## 10.6 Story entry states

Each story entry can be:

* `draft`
* `saved`
* `archived`
* `linked_to_project`
* `used_as_evidence`

## 10.7 Story Vault Analysis result states

### `success`

Show:

* strongest story candidates
* underused assets
* weak/repetitive areas
* CTA to use candidates in Direction Selection

### `partial`

Show:

* strongest usable candidates
* visible note that analysis confidence is limited

### `needs_more_input`

Show:

* specific missing dimensions, such as scene specificity or evidence of change
* CTA to deepen 1–2 selected stories

## 10.8 Critical UX rule

Story Vault is not just storage.
It is the evidence layer for the product.
The UI should make that feel concrete.

---

## 11. Personal Statement workspace structure

The Personal Statement workspace should have three distinct subareas:

1. **Direction**
2. **Drafts**
3. **Feedback**

Do not blend all three into one undifferentiated page.

---

## 12. Narrative Direction Selection flow

## 12.1 Purpose

Help the student choose among plausible personal statement directions.

## 12.2 User promise

“Don’t give me ten ideas. Tell me which direction is strongest and why.”

That matches the scope lock requirement that this module take a stance instead of returning undifferentiated brainstorming.

## 12.3 Entry points

* Story Vault Analysis CTA
* Personal Statement workspace
* Home “awaiting your choice” card

## 12.4 Preconditions

Direction Selection should require:

* an essay project exists
* minimum usable student context exists
* enough evidence exists from profile/story materials

If not, route to needs-more-input rather than forcing thin directions.

## 12.5 Flow

1. student opens Direction tab
2. if no project exists, create or initialize essay project
3. show readiness panel
4. student runs Direction Selection
5. run progresses through loading states
6. student receives ranked direction artifact
7. student reviews ranked options
8. student selects one option or requests refresh/retry if allowed
9. selection updates essay project canonical state

## 12.6 Direction tab states

### `empty`

No essay project yet.

### `project_created_no_artifact`

Project exists, no direction artifact yet.

### `loading`

Direction run in progress.

### `result_available_selection_required`

Artifact exists, no selected direction yet.

### `selected`

A direction has been explicitly selected.

### `stale`

Upstream context changed materially after selected direction.

### `needs_more_input`

System cannot recommend a strong direction yet.

## 12.7 Result presentation rules

Show:

* ranked options
* recommendation pressure
* why top option wins
* evidence sources
* risks/watchouts

Do not show:

* broad idea laundry list
* equal-weighted options with no stance
* inspirational filler

## 12.8 Selection behavior

When a student selects a direction:

* create `artifact_selection_event`
* set essay project selected direction pointers
* mark workspace state as `selected`
* preserve prior artifacts historically

## 12.9 Refresh behavior

If the student changes enough story/profile input, the selected direction can become `stale`, but it should remain visible as the current selected historical choice until replaced.

---

## 13. Essay Drafts flow

## 13.1 Purpose

Give the student a clear home for storing evolving personal statement drafts.

## 13.2 Primary actions

* create draft
* paste/update draft
* save new version
* mark current version
* request feedback on a chosen version

## 13.3 Draft states

### `no_draft`

No draft versions exist.

### `draft_saved`

At least one draft version exists.

### `current_version_set`

One version is marked current.

### `new_unsaved_changes`

Client-side editing state exists before save.

### `feedback_available`

At least one admissible feedback artifact exists for a draft version.

### `feedback_stale`

Current draft changed after last feedback artifact.

---

## 14. Essay Feedback flow

## 14.1 Purpose

Provide revision guidance without crossing into ghostwriting.

## 14.2 User promise

“Tell me what matters most to revise, not how to replace my voice.”

That directly reflects the scope lock boundary that essay feedback must prioritize and coach, not rewrite.

## 14.3 Entry points

* Personal Statement workspace → Feedback tab
* CTA after saving a draft version
* Home card if a current draft exists with no current feedback

## 14.4 Preconditions

* a current draft version exists
* current user is permitted to request feedback

## 14.5 Flow

1. student selects current draft version
2. student requests feedback
3. run created against `essay_draft_version`
4. loading states reflect real run progression
5. result resolves to success / partial / needs-more-input / blocked
6. artifact is shown and saved against the draft version
7. if student edits draft, feedback becomes stale

## 14.6 Feedback states

### `no_current_draft`

No current draft version selected.

### `ready_for_feedback`

Current draft exists, no in-flight run.

### `feedback_running`

Run in progress.

### `feedback_result_available`

Admissible feedback exists.

### `feedback_partial`

Partial feedback exists.

### `feedback_needs_more_input`

Input too thin or wrong for strong feedback.

### `feedback_blocked`

Output crossed a boundary or failed validation too severely.

### `feedback_stale`

Current draft changed since latest canonical feedback artifact.

## 14.7 Presentation rules

Show:

* ranked revision priorities
* what is working
* what is weak
* why each priority matters
* next actions

Do not show:

* submission-ready rewritten paragraphs
* “here’s your improved essay” behavior
* generic praise padding

## 14.8 Review-affected behavior

If feedback is nonblocking but flagged, it may still be shown with internal review queued.
If the result is blocked for authenticity or ghostwriting risk, it must not be shown as a success artifact. The API contract already defines blocked retrieval behavior and safe summaries.

---

## 15. Supplements workspace structure

The Supplements workspace should be organized per supplement project.

Each supplement project should have:

* school context
* prompt context
* angle suggestions
* draft versions

Do not make supplements feel like one giant unstructured list.

---

## 16. Supplement Angle Suggestion flow

## 16.1 Purpose

Help the student find stronger supplement angles for a specific school and prompt.

## 16.2 User promise

“Given this school and this prompt, tell me the strongest angle to pursue.”

## 16.3 Entry points

* create supplement project from Supplements workspace
* choose school
* add prompt text/category
* run Angle Suggestion

## 16.4 Preconditions

* institution selected
* prompt exists
* enough student context exists

## 16.5 Flow

1. student creates supplement project
2. enters school + prompt
3. system evaluates readiness
4. student requests angle suggestion
5. result returns ranked angles
6. student selects an angle
7. selected angle becomes canonical for that supplement project

## 16.6 Supplement project states

### `empty`

No supplement projects yet.

### `project_created_missing_prompt`

School chosen but prompt missing or incomplete.

### `ready_for_angles`

School + prompt + enough context exist.

### `angles_loading`

Run in progress.

### `angles_available_selection_required`

Artifact exists, no selected angle yet.

### `angle_selected`

Selected angle exists.

### `angles_stale`

Relevant upstream context changed materially.

### `angles_needs_more_input`

Not enough context to recommend strong angles.

## 16.7 Presentation rules

Show:

* ranked angle options
* school-aware reasoning
* overlap/watchout notes if available
* why top option is strongest

Do not show:

* generic why-school filler
* school-name token swaps presented as specificity
* final drafted answer text as the default product behavior

---

## 17. Saved, selected, canonical, and stale behavior

This is where most products get sloppy.
The UI must follow these exact distinctions.

## 17.1 Saved

Means the record exists and is persisted.

Examples:

* story entry saved
* draft version saved
* artifact persisted

## 17.2 Selected

Means the user explicitly chose one ranked item from an artifact.

Examples:

* selected direction
* selected supplement angle

## 17.3 Canonical

Means the system considers this the active record for the subject.

Examples:

* current draft version
* canonical direction artifact
* canonical feedback artifact for current draft version

## 17.4 Historical

Means older records remain accessible but are not current.

## 17.5 Stale

Means a canonical artifact still exists, but important upstream state changed after it was generated.

Examples:

* more stories were added after Story Vault Analysis
* selected direction exists, but core stories changed materially
* feedback exists, but current draft version changed

## 17.6 UX rule

Never silently replace history.
Never silently hide stale state.
Make “current but stale” visible.

---

## 18. Needs-more-input state map

Needs-more-input is one of the core product differentiators because it protects against genericity.

## 18.1 Student-facing structure

Every needs-more-input surface should answer:

* what the module was trying to do
* why it stopped
* what specific inputs are missing
* the smallest next action to unlock a better result

## 18.2 Module-specific examples

### Edge Snapshot

Missing discovery depth.

### Story Vault Analysis

Stories exist, but scenes are too vague or too repetitive.

### Direction Selection

Not enough evidence of change, stakes, or specificity to recommend a direction confidently.

### Essay Feedback

Draft may be too short, too incomplete, or structurally too early for meaningful coaching.

### Supplement Angle Suggestion

Prompt or school context missing, or student context too generic.

## 18.3 UX anti-pattern to reject

Do not convert needs-more-input into soft praise plus vague tips.
The API and orchestration contracts explicitly reject that behavior.

---

## 19. Error and blocked-state map

## 19.1 Error categories

### `input_error`

User can fix immediately.
Examples:

* no prompt entered
* no draft selected

### `eligibility_error`

Module cannot run for current subject state.
Examples:

* direction selection requested before enough evidence exists
* supplement angle requested without school/prompt

### `system_error`

Service or provider issue.
Examples:

* timeout
* temporary provider unavailable

### `blocked_output`

Run completed operationally, but output cannot be shown as success.
Examples:

* authenticity drift
* ghostwriting risk
* severe failed validation

## 19.2 Student-facing behavior

### For input/eligibility errors

Show precise next steps.

### For system errors

Show retry availability where safe.
Do not imply user fault.

### For blocked output

Show a safe product message and next step.
Do not leak blocked content.

---

## 20. Supporting adult flow and state map

## 20.1 Role model

Supporting adults are visibility participants, not substitute authors.

## 20.2 Allowed surfaces

Recommended supporting-adult surfaces:

* linked student overview
* read access to selected outputs where permitted
* progress awareness
* limited settings/access management

## 20.3 Disallowed behavior in spirit

Even if some actions are technically possible later, v1 should avoid any UX that suggests the supporting adult is the primary authoring agent inside student essay flows.

## 20.4 Supporting adult states

* `no_linked_student`
* `linked_no_student_progress`
* `linked_with_visible_progress`
* `view_only_result_available`

---

## 21. Admin / reviewer flow and state map

## 21.1 Core admin surfaces

* Review Queue list
* Review Queue item detail
* Artifact review form
* Label submission flow
* Benchmark candidate promotion action

The AI API already defines the needed admin detail surface shape: artifact, validator result, subject summary, provenance summary, existing labels, and benchmark link state.

## 21.2 Review queue states

* `open`
* `in_review`
* `resolved`
* `escalated`

## 21.3 Queue reason states

* `genericity_risk`
* `authenticity_risk`
* `validator_borderline`
* `benchmark_candidate`
* `manual_escalation`
* `false_pass_report`
* `false_block_report`

## 21.4 Reviewer flow

1. reviewer opens queue
2. filters by module/reason/priority
3. opens queue item detail
4. inspects artifact + validator + provenance
5. submits review
6. applies labels
7. optionally promotes benchmark candidate
8. resolves or escalates item

## 21.5 Reviewer UX rule

The review surface should make evidence, failure signals, and provenance visible without forcing reviewers to hunt across systems.

---

## 22. Cross-workflow transition rules

These transitions are critical.

## 22.1 Onboarding → Edge Snapshot

When onboarding completes:

* Home should prompt Edge Snapshot
* Edge Snapshot may run automatically or be launched with a clear CTA

## 22.2 Edge Snapshot → Story Vault

If snapshot identifies missing discovery areas:

* route student to Story Vault prompts or profile refinement

## 22.3 Story Vault → Direction Selection

If Story Vault Analysis identifies strong candidates:

* route student toward creating/selecting an essay project and running Direction Selection

## 22.4 Direction Selection → Drafting

When a direction is selected:

* Personal Statement workspace should shift emphasis toward drafting
* selected direction remains visible as the current strategic anchor

## 22.5 Drafting → Essay Feedback

When a current draft version exists:

* Feedback tab becomes enabled
* Home should surface feedback as a likely next step if none exists

## 22.6 Profile / Story changes → stale downstream state

If profile or story evidence changes materially:

* Edge Snapshot may become stale
* Story Vault Analysis may become stale
* Direction artifact may become stale

## 22.7 Draft changes → feedback stale

If a new draft version becomes current:

* prior feedback remains historical
* current feedback state becomes stale until refreshed

## 22.8 Personal Statement progress → Supplements

When there is enough personal statement or profile clarity:

* Supplements workspace becomes more useful
* relevant personal statement context should inform angle suggestions

---

## 23. Recommended page-level information architecture

### 23.1 Home

* progress cards
* next step CTA
* awaiting choice panel
* needs input panel
* recent results

### 23.2 Story Vault

* left: story list
* center: story detail/editor
* right: analysis / strongest candidates / gaps

### 23.3 Personal Statement

* header: project status + selected direction state
* tabs: Direction / Drafts / Feedback

### 23.4 Supplements

* list of supplement projects
* selected project detail with school + prompt + angles + drafts

### 23.5 Admin Review

* queue list
* item detail split view
* label/review actions panel

This structure makes the product feel like a serious workflow tool rather than a loose collection of AI cards.

---

## 24. Frontend implementation guidance

## 24.1 Use state machines where it matters

Do not manage major workspace states with scattered booleans.

At minimum, use explicit state machines for:

* Edge Snapshot flow
* Direction Selection flow
* Essay Feedback flow
* Supplement Angle flow
* Review Queue item flow

## 24.2 Distinguish run status from artifact status

A run can be `completed` while an artifact is `partial`.
A run can be `blocked` with no admissible artifact.
Do not collapse those concepts.

## 24.3 Make stale state computable

Stale state should derive from canonical artifact timestamps vs meaningful upstream changes.
Do not fake stale state with manual UI toggles.

## 24.4 Preserve history views

Direction history, feedback history, and draft history should be available without polluting the main working surface.

---

## 25. Non-negotiable UX rules

1. No general “chat with the AI” primary surface in v1.
2. No module page should feel like a blank text box plus magic button.
3. No user-visible success without product-approved artifact state.
4. No stale artifact should masquerade as current and fresh.
5. No partial artifact should render like a complete one.
6. No needs-more-input state should feel like a generic apology.
7. No blocked artifact should leak ghostwriting-risk content.
8. No direction or supplement flow should present undifferentiated idea lists with no recommendation pressure.
9. No essay feedback flow should drift into rewrite UX.
10. No supporting-adult flow should imply substitute authorship.

---

## 26. Final directive

Design v1 as a sequence of serious workspaces that move the student from messy raw material toward clearer essay decisions.

The winning UX shape is:

* dashboard-oriented but action-driven
* evidence-centered
* state-explicit
* selection-aware
* stale-aware
* needs-more-input honest
* review-compatible
* artifact-first rather than chat-first

The product should feel disciplined, sharp, and trustworthy.
It should feel like a system that helps students make better decisions, not a system that generates more words.

That is the v1 user flow and state map standard.
