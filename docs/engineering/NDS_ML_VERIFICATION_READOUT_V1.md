# NDS_ML_VERIFICATION_READOUT_V1
College Essay Edge  
Narrative Direction Selection  
Implementation-status verification readout

## Status

Verification executed against current codebase on March 16, 2026.

## Executive result

The planned ML-shaped scoring layer is **not yet implemented in the live Narrative Direction Selection execution path**.

What exists today is:

- structured NDS output generation
- a deterministic stub executor
- one selected `best_direction`
- prose-style `alternatives`
- Page 3 rendering logic derived from the selected direction object
- offline evaluation utilities that compare NDS outputs against a baseline system

What does **not** exist in the live execution path today is:

- 2–4 structured candidate directions returned per run
- per-candidate dimension scores
- explicit candidate rejection flags/reasons in runtime output
- explicit scoring-based winner selection
- runtime `confidence_band`
- runtime `route_decision` values such as `show_strongest_direction` vs `ask_question_before_showing`
- a module API endpoint like `POST /ai/narrative-direction-selection/analyze`
- a run-level debug packet proving scoring is decision-driving

## Specific verification findings

### 1. Pipeline verification result

**Result: failed for scoring-layer proof.**

The current NDS executor does not produce a scoring-layer debug object or candidate-scoring payload.

Evidence:

- [src/lib/ai/modules/narrative-direction-selection/module-executor.ts](src/lib/ai/modules/narrative-direction-selection/module-executor.ts) builds a single deterministic payload via `buildDeterministicCandidate()`.
- That payload returns:
  - `status`
  - `best_direction`
  - `alternatives`
  - `evidence_anchors`
  - `depth_signals`
  - `recovery_question`
- It does **not** return:
  - candidate IDs for a full scored set
  - candidate-level dimension scores
  - rejected candidates
  - selected candidate ID vs runner-up
  - score margin
  - confidence band
  - route decision

### 2. Live execution-path result

**Result: current runtime path is pass-through generation, not scored reranking.**

Evidence:

- [src/lib/ai/worker/execute-run.ts](src/lib/ai/worker/execute-run.ts) calls `executeNdsModule()` and persists `moduleOutput.candidate_payload` as the parsed payload.
- There is no intermediate scorer or reranker visible between execution and persistence.
- The executor file explicitly identifies the provider path as `deterministic_stub`, which confirms this is still an internal-verification stub path rather than a production scoring pipeline.

### 3. Frontend/Page 3 result

**Result: Page 3 is using improved direction presentation, not candidate scoring proof.**

Evidence:

- [src/lib/fm/direction.ts](src/lib/fm/direction.ts) exposes `deriveDirectionContent()`.
- That function produces:
  - one `strongest` direction object
  - `compare_alternatives`
- This is useful product structure, but it is not the ML/scoring layer described in the later specs.
- There are no candidate scores, rejection reasons, confidence bands, or routing decisions emitted here.

### 4. API verification result

**Result: planned scoring-layer API surface is not yet implemented.**

Evidence:

- No route matching `POST /ai/narrative-direction-selection/analyze` was found under the current API route tree.

### 5. Selection-quality verification result

**Result: only partial support exists today.**

What exists:

- [src/lib/ai/evaluation/pack.ts](src/lib/ai/evaluation/pack.ts) contains offline head-to-head scoring utilities such as `autoScoreHeadToHead()` and summary generation.
- These compare NDS outputs against a baseline and produce aggregate evaluation summaries.

What does not exist:

- A runtime candidate-scoring packet proving that the scoring layer selected candidate A over candidate B.
- Reviewer-facing evidence that the winner changed because of candidate-level scoring.

Interpretation:

- This supports product-evaluation and benchmark comparison.
- It does **not** prove that a scoring layer is applied in the production NDS runtime path.

### 6. Routing-quality verification result

**Result: no scoring-driven confidence routing found in NDS runtime.**

What exists elsewhere in the product:

- Intake and first-minute routing logic can send users to blocked / clarification / direction flows.

What was not found in NDS scoring-layer form:

- `confidence_band` assigned from candidate comparison
- `ask_question_before_showing` chosen because top candidates were too close
- explicit narrow-margin routing logic

## Concrete answer to the question “Is ML being applied correctly?”

### Precise answer

Not yet, if by “ML being applied correctly” you mean:

- multiple candidates generated
- candidates scored explicitly
- weaker candidates rejected
- winner chosen by scoring
- confidence/routing decided from score structure
- debug packet available for every run

### More precise operational answer

What is currently implemented is closer to:

- structured generation
- deterministic or heuristic direction construction
- improved frontend rendering
- offline evaluation utilities

That is valuable, but it is **not yet proof of an active scoring layer / reranker**.

## What would count as real proof

For each real run, engineering needs to expose an internal debug packet containing:

- original student input
- 2–4 generated candidates
- candidate evidence
- per-candidate scores:
  - specificity
  - evidence grounding
  - non-genericity
  - buildability
  - scene strength
  - reflective potential
  - distinctness
  - explanation coherence
  - clarification need
  - total score
- rejected candidates and reasons
- selected candidate
- runner-up score
- score margin
- confidence band
- route decision
- rendered frontend artifact

Without that packet, the system can only claim product improvement — not verified scoring-layer correctness.

## Immediate engineering recommendation

### Work item 1

Implement hidden/internal run debug output for NDS scoring-layer verification.

### Work item 2

Implement true multi-candidate runtime objects instead of one `best_direction` plus prose alternatives.

### Work item 3

Add explicit candidate scoring + rejection + route-decision fields to the runtime payload.

### Work item 4

Run a 20–30 case comparison set:

- baseline without scoring layer
- new scoring-layer version
- reviewer preference and rubric scores

### Work item 5

Report these metrics:

- percent of runs with rejected generic candidates
- percent routed to question-first
- average top-vs-runner-up score margin
- examples where scoring changed the winner

## Final judgment

The current screenshot/output quality improvements are real.

But based on current code inspection, they are evidence of **better prompting/heuristics/presentation**, not evidence that the planned ML-shaped scoring layer is already operating correctly in production.
