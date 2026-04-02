# STRUCTURED_BLANK_PAGE_INTAKE_PHASE_1_IMPLEMENTATION_SPEC_V1

**College Essay Edge**  
**Phase 1 engineering spec**  
**Detection and mode assignment**  
**Status:** Build-ready implementation spec  
**Derived from:** `STRUCTURED_BLANK_PAGE_INTAKE_V1`, `STRUCTURED_BLANK_PAGE_INTAKE_IMPLEMENTATION_PLAN_V1`, and `STRUCTURED_BLANK_PAGE_INTAKE_BUILD_BACKLOG_V1`

---

## Purpose

Phase 1 implements the first production-critical layer of structured blank-page intake:

Detect when a user is not ready for normal NDS and assign the correct blank-page intake mode before downstream direction logic runs.

This phase does not build the full question engine or final UI lane.  
It creates the classification substrate that later phases depend on.

If Phase 1 is wrong, every downstream recovery behavior will be wrong.  
So this phase must be narrow, typed, testable, and reviewable.

---

## 1. Phase 1 objective

Implement a deterministic pre-NDS classifier that assigns each first-minute input to one of three top-level route states:

- `ready_for_nds`
- `needs_structured_blank_page_intake`
- `true_block`

If `needs_structured_blank_page_intake`, assign exactly one blank-page mode:

- `topic_probe`
- `theme_probe`
- `activity_probe`
- `scope_reframe`
- `blank_page_discovery`
- `too_thin_to_recover`

This phase must ensure that blank-page-like users are recognized correctly, without:

- broad over-classification
- broad route regressions
- fake direction inflation
- reintroducing blunt hard-blocking

---

## 2. Out of scope for Phase 1

Phase 1 does not include:

- full blank-page response copy
- final primary/secondary recovery questions
- UI redesign
- post-answer conversion logic
- broad reranking changes
- broad candidate-generation changes
- learned-judgment model work

This phase only covers:

- signal detection
- mode assignment
- route eligibility
- payload/debug contract for downstream phases

---

## 3. Required functional outcome

At the end of Phase 1, the system must be able to say, for any first-minute input:

- Is this input ready for standard NDS?
- Is this a recoverable blank-page/topic-only/theme-only/activity-only input?
- Is this truly too thin or malformed to recover?
- If recoverable, which blank-page mode best matches it?

That is the full mission of this phase.

---

## 4. System behavior contract

### 4.1 Top-level route contract

Every evaluated input must resolve to one of:

#### A. `ready_for_nds`

Use when:

- enough scene or directional signal exists
- the user is beyond blank-page discovery
- normal direction logic should run

#### B. `needs_structured_blank_page_intake`

Use when:

- the user has real topic intent
- but not enough story-center signal for normal NDS
- and a typed recovery question is likely to help

#### C. `true_block`

Use only when:

- input is too thin, empty, malformed, or irrelevant
- no meaningful structured recovery question is justified

This top-level contract must be explicit and auditable.

### 4.2 Blank-page mode contract

If top-level route is `needs_structured_blank_page_intake`, exactly one mode must be assigned:

#### `topic_probe`

User has a topic, but not a story.

#### `theme_probe`

User has a trait/theme, but not lived evidence.

#### `activity_probe`

User has an activity/domain, but not the real center.

#### `scope_reframe`

User is explicitly unsure whether the topic “says enough” or is essay-worthy.

#### `blank_page_discovery`

User has no topic and needs story-zone discovery.

#### `too_thin_to_recover`

Use only if the input is still best handled as a graceful recovery-stop inside the blank-page framework.

No multi-mode output in Phase 1.  
One mode only.

---

## 5. Required detection signals

Phase 1 must identify the following signal families.

### 5.1 Topic-only signals

**Examples:**

- “Can I write about gardening?”
- “I want to write about coding.”
- “Would volunteering work?”

**Indicators:**

- topic noun present
- no scene signal
- no hinge signal
- no meaningful event detail
- often phrased as topic eligibility question

**Expected mode:**

- `topic_probe`

### 5.2 Theme-only signals

**Examples:**

- “I want to show resilience.”
- “I want to write about leadership.”
- “I want the essay to show growth.”

**Indicators:**

- abstract trait/theme language
- no event anchor
- no real narrative material
- often framed around what the essay should “show”

**Expected mode:**

- `theme_probe`

### 5.3 Activity-only signals

**Examples:**

- “I want to write about robotics.”
- “I’m between robotics and debate.”
- “Maybe soccer?”

**Indicators:**

- activity/domain names present
- no actual moment
- no shift or conflict yet
- user still evaluating the domain itself rather than the center inside it

**Expected mode:**

- `activity_probe`

### 5.4 Scope-uncertain signals

**Examples:**

- “I’m not sure this says enough about me.”
- “I like this topic, but I don’t know if it’s deep enough.”
- “I’m not sure this is really an essay.”

**Indicators:**

- explicit meta-uncertainty about adequacy
- self-aware but not yet centered
- may include a topic, but user is asking the wrong question

**Expected mode:**

- `scope_reframe`

### 5.5 Blank-page discovery signals

**Examples:**

- “I have no idea what to write about.”
- “Nothing feels special enough.”
- “I don’t know where to start.”

**Indicators:**

- no usable topic yet
- explicit blank-page language
- no center candidate
- discovery need is obvious

**Expected mode:**

- `blank_page_discovery`

### 5.6 Too-thin-to-recover signals

**Examples:**

- empty input
- near-empty input
- incoherent fragments with no recoverable topic intent
- off-domain request

**Indicators:**

- no usable topic intent
- no recoverable discovery path
- no structured question would plausibly help

**Expected mode:**

- `too_thin_to_recover` or top-level `true_block`, depending on final route design

---

## 6. Implementation requirements

### 6.1 Files in scope

**Required core files**

- `src/lib/ml/evidenceStrength/features.ts`
- `src/lib/ml/evidenceStrength/model.ts`

**Likely supporting files**

- first-minute routing/orchestration layer
- intake payload builder or response assembler
- any state contract file carrying route/mode metadata

**Type files**

- `src/types/intake.ts`
- any debug packet or first-minute state types touched by the new fields

### 6.2 Required outputs from Phase 1

The system must expose:

- `blank_page_intake_detected: boolean`
- `blank_page_mode: string | null`
- `blank_page_trigger_signals: string[]`
- `blank_page_recovery_reason: string | null`
- `blank_page_confidence: "low" | "medium" | "high" | null`
- `top_level_blank_page_route: "ready_for_nds" | "needs_structured_blank_page_intake" | "true_block"`

These fields must be available to downstream code and visible in debug output.

### 6.3 Determinism requirement

Phase 1 mode assignment must be deterministic for the same input under the same code/version state.

No stochastic behavior is allowed in Phase 1 classification.

---

## 7. Feature-level design requirements

### 7.1 Detection must be pattern-based and explainable

Engineering must implement this phase using:

- typed feature signals
- explicit route logic
- explainable thresholds
- debuggable trigger sets

Do not hide the classification inside opaque prompt text.

### 7.2 Signal weighting rules

The classifier must prioritize:

- explicit user intent
- absence or presence of scene evidence
- absence or presence of hinge/change language
- presence of topic/theme/activity language
- presence of uncertainty-about-worthiness language
- presence of blank-page language

It must not over-index on:

- polish
- verbosity
- rhetorical quality

Weak, awkward language must still classify correctly.

### 7.3 Priority conflict resolution

If multiple signal families are present, resolve in this order:

1. `blank_page_discovery`
2. `scope_reframe`
3. `theme_probe`
4. `activity_probe`
5. `topic_probe`

unless evidence shows a different order works better in tests.

This prevents a vague “I don’t know where to start, maybe robotics?” input from being reduced to pure activity classification when the real state is blank-page.

---

## 8. Route decision requirements

### 8.1 When to use `ready_for_nds`

Use only when:

- real story signal exists
- or existing intake logic already justifies direction work
- and blank-page detection should not override it

This phase must not pull already-good NDS cases into blank-page intake.

### 8.2 When to use `needs_structured_blank_page_intake`

Use when:

- topic intent exists or discovery need is real
- but story-center signal is not strong enough for normal direction generation
- and a structured question is likely helpful

This is the primary outcome of the phase.

### 8.3 When to use `true_block`

Use only when:

- there is no meaningful route to recovery
- or the request is outside supported use

This must remain a narrow lane.

---

## 9. Debug and observability requirements

Phase 1 must add enough observability so engineering can answer:

- why was this case classified as blank-page?
- which signals fired?
- why was this specific mode chosen?
- why was the case not allowed into normal NDS?

**Required debug fields**

- `blank_page_trigger_signals`
- `blank_page_mode`
- `blank_page_recovery_reason`
- `top_level_blank_page_route`
- `blank_page_confidence`
- `route_override_source` if blank-page handling overrides another route tendency

These must appear in local inspection and prod debugging paths.

---

## 10. Test plan

### 10.1 Unit tests

Must add tests for at least:

- **Topic-only:** input with topic and no scene → `needs_structured_blank_page_intake` + `topic_probe`
- **Theme-only:** trait language without event → `needs_structured_blank_page_intake` + `theme_probe`
- **Activity-only:** activity mention without center → `needs_structured_blank_page_intake` + `activity_probe`
- **Scope-uncertain:** topic plus “does this say enough about me?” → `needs_structured_blank_page_intake` + `scope_reframe`
- **Blank-page:** “No idea what to write about” → `needs_structured_blank_page_intake` + `blank_page_discovery`
- **Too-thin:** empty/off-domain/unrecoverable → `true_block` or `too_thin_to_recover` path
- **Non-regression:** clearly directional case still routes to `ready_for_nds`

### 10.2 Integration tests

Must verify:

- top-level route and mode propagate into response contract
- downstream payload builder receives the correct mode
- UI/state layer can consume mode fields without breaking

### 10.3 Product tests

Must rerun:

- `npm run test:product:screen-trust`
- `npm run test:product:flow-break`
- `npm run test:product:session-state`
- `npm run test:product:real-user-sim`

### 10.4 NDS regressions

Must rerun:

- `npm run test:nds:evidence-grounding`
- `npm run test:nds:direction-line-fit`
- `npm run test:nds:direction-stability`

### 10.5 Full regression

- `npm test`

---

## 11. Acceptance criteria

Phase 1 is complete only if all of the following are true:

### Functional

- supported blank-page classes classify correctly
- non-blank-page directional cases do not regress into blank-page mode
- true unrecoverable cases can still block

### Debuggability

- trigger signals are visible
- mode assignment is visible
- route choice is explainable

### Stability

- no material regressions in core routing behavior
- full regression suite remains green

### Product safety

- no broad expansion of fake direction behavior
- no broad overblocking regression

---

## 12. Failure conditions

Phase 1 fails if:

- blank-page detection overfires on strong directional inputs
- multiple input classes collapse into the wrong mode
- trigger reasons are not visible
- true-block expands too broadly
- product tests regress
- real-user-sim regresses
- engineering cannot explain why a case got a given mode

---

## 13. Review gate for Phase 1

Before proceeding to Phase 2, engineering must present:

- classification examples for each input class
- debug output showing trigger signals
- unit and regression test results
- at least one reviewed sample for each blank-page mode
- evidence that normal NDS cases still route correctly

Phase 2 may begin only after this review passes.

---

## 14. Required artifacts

Produce:

### Markdown

- `STRUCTURED_BLANK_PAGE_INTAKE_PHASE_1_IMPLEMENTATION_SPEC_V1.md`

### JSON

- `structured_blank_page_intake_phase_1_implementation_spec_v1.json`

### Optional supporting artifact

A small classification review packet with:

- 3–5 sample inputs per mode
- route result
- trigger signals
- reviewer comment

---

## 15. Build summary

Phase 1 is the foundation.

If this phase is weak, the blank-page lane becomes:

- generic
- misrouted
- hard to debug
- unsafe to scale

If this phase is strong, later phases can safely build:

- typed question generation
- UI rendering
- post-answer conversion
- blank-page recovery metrics

So the standard for Phase 1 is simple:

Detect the right users, assign the right mode, and do it in a way engineering can inspect and trust.
