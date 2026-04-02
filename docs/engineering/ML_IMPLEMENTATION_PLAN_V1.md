# ML_IMPLEMENTATION_PLAN_V1
College Essay Edge  
Narrative Direction Selection  
MIT-level ML augmentation plan for current architecture

## 1. Purpose

This document defines how to add an ML-shaped scoring and ranking layer to College Essay Edge without damaging the current product architecture.

The goal is not to replace the current controlled LLM system.

The goal is to make the product feel:

- less AI-generic
- more selective
- more student-specific
- more evidence-grounded
- more consistent across real cases

This plan assumes the current architecture already includes:

- structured output generation
- ranked narrative direction logic
- validator layers
- evidence grounding expectations
- module-specific output standards
- UI surfaces for strongest-direction selection and refinement

This implementation must preserve those strengths.

## 2. Strategic decision

### Do not do this now

Do not build an end-to-end ML generator that replaces the current LLM-driven Narrative Direction Selection flow.

That would:

- reduce controllability
- make debugging harder
- require more labeled data than V1 should assume
- risk generic or opaque failure modes
- weaken product iteration speed

### Do this now

Add an ML-assisted candidate scoring and reranking layer around the existing direction-generation system.

This means:

- generate multiple candidate directions from the current LLM stack
- score those candidates using structured features and learned heuristics
- pick the strongest candidate
- reject weak/generic candidates
- route to a clarifying-question step when confidence is low

This is the highest-leverage ML move available now.

## 3. Product objective

The product objective of the ML layer is:

Make the system better at choosing the right direction, not merely better at sounding polished.

The ML layer must improve:

- direction specificity
- direction distinctness
- evidence grounding
- non-genericity
- buildability into a strong essay
- confidence-aware routing

The ML layer is a selection system, not a prose generator.

## 4. Scope

### In scope

- candidate direction generation schema
- candidate scoring pipeline
- genericity detection
- strongest-direction reranking
- uncertainty detection
- clarifying-question routing
- logging for future supervised learning
- offline evaluation loop
- human review labeling loop

### Out of scope for V1

- fully learned end-to-end generation
- automatic essay drafting from ML
- personalization based on long-term student memory
- global student-style embedding systems
- multi-module learned orchestration across entire app
- full online learning in production

## 5. Product architecture principle

### Core rule

Simplify the presentation, not the intelligence contract.

The frontend may show one strongest direction first.

The backend must still preserve the richer internal object:

- multiple candidate directions
- ranked recommendation
- rationale
- evidence grounding
- fallback question path
- candidate risks / weaknesses

The ML layer must sit inside that system, not collapse it.

## 6. System design overview

### Current base system

Likely current shape:

- user submits rough notes
- LLM interprets notes
- LLM generates strongest-direction output
- validator/UI renders result

### Proposed ML-augmented system

- user submits rough notes
- LLM generates 2–4 candidate directions
- deterministic validators reject obviously weak candidates
- feature extraction runs on surviving candidates
- ML/heuristic scorer assigns candidate scores
- reranker selects best candidate
- confidence gate decides:
  - show strongest direction
  - or ask one clarifying question first
- explanation/evidence phrasing is generated from the selected candidate
- result is logged for evaluation and future learning

## 7. Candidate direction object

Every generated candidate must be structured.

### Required schema

Each candidate direction must include:

- candidate_id
- direction_label
- direction_line
- direction_summary
- core_tension
- before_state
- after_state
- evidence_spans
- why_strong
- why_not_stronger_than_top (optional for non-top candidates)
- risk_if_chosen
- buildability_estimate
- genericity_risk_estimate
- clarifying_question_if_uncertain
- model_confidence_estimate

### Notes

The LLM may generate these fields initially.  
The ML layer will score and rerank them.  
Do not let the UI depend on freeform prose blobs only.

## 8. Candidate generation requirements

The current generation layer must produce multiple plausible angles, not one surface answer.

### Candidate count

Generate:

- minimum: 2
- target: 3
- max: 4

### Candidate distinctness requirement

Candidates must not be paraphrases of the same growth story.

Reject or regenerate if:

- direction labels are semantically overlapping
- all candidates collapse into generic “growth through challenge”
- differences are stylistic only, not interpretive

### Candidate quality requirement

Each candidate must identify at least one of:

- tension
- contradiction
- shift in stance
- emotionally loaded scene
- relational moment
- value conflict
- uncomfortable realization
- action under pressure

## 9. Scoring dimensions

The ML layer should score each candidate on the following dimensions.

### 1. Student specificity

Does the direction clearly emerge from this student’s actual notes?

Low score if:

- could fit many students
- sounds reusable
- relies on generic growth framing

### 2. Evidence grounding

Is the direction well-supported by actual lines, moments, or tensions in the notes?

Low score if:

- evidence is weak
- evidence is generic setup only
- explanation outruns the source material

### 3. Distinctness

Is this candidate meaningfully different from the other candidates?

Low score if:

- all candidates are variants of the same angle
- distinction is only phrasing

### 4. Buildability

Could this direction plausibly sustain a strong admissions essay?

High score if:

- has a scene
- has movement
- has insight potential
- has emotional or intellectual center

### 5. Non-genericity

Does this avoid AI-style reusable phrasing?

Low score if:

- contains vague abstractions
- uses “authenticity,” “growth,” “resilience,” “meaningful experience” without specificity
- reads like a generic counselor summary

### 6. Scene strength

Is there a usable concrete moment that can anchor the essay?

### 7. Reflective potential

Does the candidate point toward a real insight, not just an activity description?

### 8. Explanation coherence

Can the system explain why this candidate is strongest in plain English without resorting to mush?

### 9. Clarification need

Does this candidate seem promising but under-specified enough that a clarifying question may improve it?

## 10. Initial scoring model

### V1 recommendation

Start with a hybrid scorer:

- rule-based gates
- weighted scoring
- light learned reranker later

Why

You need:

- control
- debuggability
- fast iteration
- easier error attribution

### V1 score formula

Use a weighted score such as:

total_score = 0.24*specificity + 0.20*evidence_grounding + 0.14*buildability + 0.12*non_genericity + 0.10*scene_strength + 0.08*reflective_potential + 0.07*distinctness + 0.05*explanation_coherence

Weights can be tuned later by evaluation results.

## 11. Hard rejection filters

Before scoring, reject candidates that fail core product doctrine.

Reject if candidate:

- is obviously generic
- lacks identifiable evidence
- uses prohibited abstraction-heavy phrasing as the actual angle
- does not name a real tension, scene, shift, or realization
- could fit many students with only noun swapping
- relies only on “concrete moment” advice without actual interpretation
- sounds like internal model reasoning rather than a student-facing direction

### Reject examples

- “the clearest direction”
- “the strongest version”
- “the shift in your role”
- “the standard you now apply”
- “what changed in that setting”
- “a visible shift and concrete after-effect”

## 12. Confidence routing

The product should not always pretend certainty.

### High-confidence case

If one candidate clearly wins:

- show strongest direction screen
- allow “Build from this direction”

### Medium-confidence case

If top candidate wins narrowly:

- show strongest direction
- prominently offer clarifying-question path

### Low-confidence case

If all candidates are weak or too close:

- do not render weak strongest-direction output
- ask one clarifying question first

### Confidence triggers

Examples:

- top score margin over second candidate
- evidence coverage strength
- genericity risk
- explanation quality estimate
- candidate distinctness health

## 13. Clarifying question layer

The clarifying question must be tied to the selected or near-selected top candidate.

### Purpose

The clarifying question is not generic intake.  
It is a surgical disambiguation tool.

### Good clarifying question behavior

Ask about:

- the tension the system thinks is central
- the scene the system thinks matters most
- the exact emotional or practical shift that appears strongest

### Bad clarifying question behavior

Do not ask:

- “What did you learn?”
- “Why was this important?”
- “What matters most to you?”
- “Can you tell me more?”

## 14. Output contract

### Fixed UI labels can remain static

- Your strongest direction is likely:
- Why this stands out
- What in your notes points there
- Build from this direction
- Ask me one question to sharpen it first

### Substantive language must remain generated

The ML layer must not replace:

- direction phrasing generation
- explanation generation
- evidence note generation

But it should improve them indirectly by selecting a better candidate.

## 15. Data logging plan

Every direction-selection run should log:

- submission_id
- anonymized student input
- generated candidates
- candidate scores by dimension
- rejected candidates + reason
- selected candidate
- confidence score
- whether clarifying question route was taken
- rendered output
- user action:
  - build
  - ask question
  - back
  - abandon
- downstream review outcome if available
- later draft quality / reviewer score if available

This is required for future ML training and system audits.

## 16. Labeling plan

To become truly ML-powered, you need labeled supervision.

### Human label set

For sampled runs, reviewers should label:

- strongest candidate actually strongest? yes/no
- better candidate existed? yes/no
- specificity score
- evidence grounding score
- genericity score
- buildability score
- explanation believability score
- clarifying question would have been better? yes/no

### Gold-label batches

Create a gold evaluation set of real student note inputs with:

- candidate directions
- best direction chosen by expert reviewers
- rationale
- why weaker candidates lost

This becomes the foundation for a future learned reranker.

## 17. Evaluation framework

### Offline evaluation metrics

Track:

- top-1 candidate agreement with expert reviewer
- genericity rejection precision
- evidence-grounding pass rate
- strongest-direction acceptability rate
- clarifying-question routing accuracy
- downstream draft usefulness score

### Online proxy metrics

Track:

- percent choosing “Build from this direction”
- percent choosing “Ask me one question”
- abandon rate after strongest-direction screen
- revision satisfaction if collected
- reviewer override rate

## 18. Model evolution path

### Phase 1

Rules + weighted heuristics

- no true ML yet
- fast implementation
- high interpretability

### Phase 2

Light supervised reranker  
Train a model on reviewer-labeled candidate sets to predict:

- candidate strength
- genericity risk
- likely winner

### Phase 3

Learned uncertainty routing  
Predict when:

- strongest direction is strong enough to show
- clarifying question is better first step

### Phase 4

Learned module-level optimization  
Use downstream results to improve:

- candidate generation prompts
- score weights
- reranker calibration

## 19. Engineering implementation phases

### Phase A — schema and logging

Build now:

- candidate schema
- multi-candidate generation
- logging layer
- hard rejection filters

### Phase B — heuristic scorer

Build next:

- dimension scorers
- weighted candidate selection
- confidence thresholds
- uncertainty routing

### Phase C — review tooling

Build:

- internal reviewer interface for sampled outputs
- scoring and override tools
- label export pipeline

### Phase D — supervised reranker

After enough labeled data:

- candidate-level reranker
- calibrated top-choice prediction
- genericity detection model

## 20. Risks

### Risk 1

Scoring generic candidates more confidently  
Mitigation:

- hard rejection filters before reranking

### Risk 2

Collapsing candidate diversity  
Mitigation:

- enforce distinctness check before scoring

### Risk 3

Overfitting to polished language instead of strong direction quality  
Mitigation:

- keep prose quality separate from direction strength scoring

### Risk 4

Destroying architecture clarity with too much ML too early  
Mitigation:

- ML only reranks/selects first
- LLM stays controlled generation layer

### Risk 5

Confusing UI simplification with backend simplification  
Mitigation:

- preserve ranked candidate object even if UI shows one top choice first

## 21. Product rules to lock

### Rule 1

The system must generate multiple candidate directions before selection.

### Rule 2

The strongest direction shown to the student must be the result of explicit scoring, not just first-pass prose generation.

### Rule 3

The student-facing strongest direction must remain grounded in evidence from the student’s notes.

### Rule 4

If the system is not confident, it must ask a clarifying question instead of pretending certainty.

### Rule 5

The ML layer must improve choice quality, not merely language polish.

## 22. What success looks like

You will know this layer is working when:


## 23. Immediate recommendation


For the request/response contract that operationalizes candidate generation, scoring, routing, and frontend artifact return shape, see [V1_AI_SERVICE_API_SPEC_ADDENDUM.md](V1_AI_SERVICE_API_SPEC_ADDENDUM.md).
Build this in order:

- multi-candidate direction generation
- hard rejection filters
- weighted scorer
- confidence routing
- structured logging
- reviewer labeling pipeline
- later learned reranker

That is the right V1-to-V2 evolution path.

## 24. Final judgment

You do not need more reference material to start this.

You need discipline in implementation.

The correct move is:

Add an ML-shaped reranking and confidence layer around the current Narrative Direction Selection module now, without replacing the current controlled generation system.

That is the highest-leverage, lowest-regret ML move available for College Essay Edge.

## Related spec

For the build-facing scoring layer details that operationalize this plan, see [V1_ML_SCORING_LAYER_SPEC.md](V1_ML_SCORING_LAYER_SPEC.md).
