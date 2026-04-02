# V1_ML_SCORING_LAYER_SPEC
College Essay Edge  
Narrative Direction Selection  
Build-facing scoring layer spec

## Status

Add after current Page 3 implementation is stable

## Purpose

This spec defines the scoring layer for Narrative Direction Selection.

Its job is to improve choice quality, not just wording.

The scoring layer decides:

- which candidate direction is strongest
- which candidates should be rejected
- when the system is confident enough to show a strongest direction
- when the system should ask one clarifying question instead

This layer sits on top of the current controlled generation architecture. It does not replace it.

## 1. PRODUCT GOAL

The scoring layer must make the product feel:

- more selective
- more grounded
- less generic
- less “AI-written”
- more consistent across real student inputs

It should turn the system from:  
“Here is a plausible direction.”

into:  
“Here is the strongest direction after comparing multiple candidates and rejecting weaker ones.”

## 2. NON-NEGOTIABLE RULE

Do not replace the current generation system.  
The scoring layer is a candidate evaluation and selection layer.

It must:

- score generated candidates
- rank candidates
- reject weak candidates
- trigger clarifying-question routing when confidence is low

It must not:

- flatten the module into one generic answer
- bypass evidence grounding
- replace the current architecture with an opaque black box

## 3. PLACEMENT IN PIPELINE

### Current desired pipeline

- user submits rough notes
- generation layer produces candidate directions
- validation layer removes clearly bad candidates
- scoring layer scores surviving candidates
- reranker selects top candidate
- confidence gate decides:
  - show strongest direction
  - or ask one clarifying question first
- explanation/evidence phrasing is rendered from selected candidate
- run is logged for future evaluation/training

## 4. INPUTS TO SCORING LAYER

The scoring layer receives:

### Required inputs

- original student submission
- 2–4 generated candidate directions
- candidate evidence spans / excerpts
- candidate explanation summaries
- candidate clarifying question proposals
- validator outputs
- banned-phrase flags
- optional generation confidence estimates

### Candidate object minimum schema

Each candidate must include:

- candidate_id
- direction_line
- direction_summary
- core_tension
- before_state
- after_state
- evidence_spans
- why_strong
- risk_if_chosen
- clarifying_question_if_uncertain

If these fields are missing, score as invalid and reject candidate.

## 5. OUTPUTS FROM SCORING LAYER

The scoring layer must return:

- selected_candidate_id
- candidate_rankings
- candidate_scores_by_dimension
- top_score
- runner_up_score
- score_margin
- confidence_band
- route_decision
- rejected_candidate_ids
- rejection_reasons
- ask_clarifying_question boolean
- chosen_clarifying_question if applicable

### Allowed route decisions

- show_strongest_direction
- ask_question_before_showing
- regen_candidates
- fail_closed

## 6. CANDIDATE GENERATION REQUIREMENT

### Candidate count

- minimum: 2
- target: 3
- maximum: 4

### Candidate distinctness rule

Candidates must not be simple paraphrases.

Reject or regenerate if:

- all candidates express the same angle with superficial wording changes
- all candidates collapse into generic “growth” narratives
- candidate labels differ, but evidence and interpretation are functionally the same

## 7. SCORING DIMENSIONS

Score each candidate from 0.0 to 1.0 on the following dimensions.

### 7.1 Student specificity

Does this direction clearly emerge from this student’s actual material?

High score if:

- the direction feels unique to the submission
- it identifies a specific human situation, tension, or choice

Low score if:

- it could apply to many students
- it sounds reusable with minor noun swapping

### 7.2 Evidence grounding

Is the direction strongly supported by the student’s notes?

High score if:

- evidence spans clearly support the angle
- explanation stays close to the source material

Low score if:

- evidence is weak or generic
- interpretation outruns the input
- evidence feels decorative instead of essential

### 7.3 Non-genericity

Does the candidate avoid generic essay-language and AI filler?

High score if:

- angle is concrete and differentiated
- explanation avoids vague abstractions

Low score if:

- uses broad growth language
- uses AI-ish abstractions
- sounds like canned counseling

### 7.4 Buildability

Can this direction plausibly become a strong admissions essay?

High score if:

- contains a usable center
- has scene potential
- supports reflection and movement
- can be drafted into an essay with shape

Low score if:

- too thin
- too broad
- no clear scene or tension
- collapses into activity summary

### 7.5 Distinctness

How meaningfully different is this candidate from other candidates?

High score if:

- candidate presents a genuinely different angle

Low score if:

- candidate is a paraphrase of another option

### 7.6 Scene strength

Is there a concrete moment or usable center of gravity?

High score if:

- direction is anchored in a specific moment, interaction, or action

Low score if:

- direction is abstract trait language
- no scene or lived moment is visible

### 7.7 Reflective potential

Does the direction point toward insight, not just description?

High score if:

- angle implies a real realization, tension, or reframing

Low score if:

- angle is only descriptive
- angle sounds like a résumé expansion

### 7.8 Explanation coherence

Can the candidate be explained clearly in plain English?

High score if:

- why-it-works explanation is understandable and grounded

Low score if:

- explanation becomes generic
- explanation requires analysis jargon

### 7.9 Clarification need

Does the candidate seem promising but under-specified?

High score means:

- candidate may improve a lot with one question

Low score means:

- candidate is already clear enough to show

Note: this score is not “good” or “bad.” It is used for routing.

## 8. INITIAL WEIGHTING

Use weighted scoring for V1.

### Suggested weights

- student_specificity: 0.24
- evidence_grounding: 0.20
- non_genericity: 0.16
- buildability: 0.14
- scene_strength: 0.10
- reflective_potential: 0.08
- distinctness: 0.05
- explanation_coherence: 0.03

### Total score

total_score = Σ(weight * dimension_score)

Clarification need should not be included directly in total score. It should be used separately for routing logic.

## 9. HARD REJECTION FILTERS

Before ranking, reject candidates that fail any of the following.

Reject if candidate:

- lacks identifiable evidence support
- has no clear tension, shift, scene, or realization
- is mostly generic writing advice
- sounds like internal reasoning rather than a student-facing direction
- contains banned abstraction-heavy phrasing as the actual angle
- could plausibly fit many unrelated students
- is materially redundant with another stronger candidate

### Auto-reject phrases in direction line unless concretely grounded

- clearest direction
- strongest version
- shift in your role
- first instinct
- standard you now apply
- visible shift
- concrete after-effect
- what changed in that setting
- stronger center
- real turn

If these appear as the core angle language, reject candidate.

## 10. RANKING RULES

### Basic ranking

Rank remaining candidates by total_score.

### Tie handling

If top two candidates are within a small margin, do not force certainty blindly.

### Suggested tie threshold

If score_margin < 0.06, treat as narrow win.

Then inspect:

- evidence grounding difference
- non-genericity difference
- clarification need

This can trigger question-first routing.

## 11. CONFIDENCE BANDS

Assign a confidence band after ranking.

### High confidence

Conditions:

- top score strong
- score margin healthy
- evidence grounding high
- genericity risk low

Action

- show_strongest_direction

### Medium confidence

Conditions:

- top candidate acceptable
- score margin modest
- one clarifying question may materially improve result

Action

Usually show_strongest_direction with strong secondary clarification option  
or ask_question_before_showing depending on thresholds

### Low confidence

Conditions:

- all candidates weak
- top two too close
- evidence support poor
- genericity risk high

Action

- ask_question_before_showing
- or regen_candidates

### Fail-closed

Conditions:

- all candidates rejected
- scoring impossible due to schema failure
- no evidence-grounded candidate survives

Action

- fail_closed

## 12. ROUTING LOGIC

### Show strongest direction

Use when:

- top candidate clears quality thresholds
- confidence is high enough
- evidence and specificity are solid

### Ask question before showing

Use when:

- candidate is promising but under-specified
- top two are too close
- ambiguity is resolvable with one targeted question

### Regenerate candidates

Use when:

- candidate set is weak
- all candidates too generic
- candidates lack distinctness
- banned phrasing dominates

### Fail closed

Use only when:

- no valid route remains
- system cannot provide safe, quality output

## 13. CLARIFYING QUESTION SELECTION

If the routing decision is ask_question_before_showing, choose the question linked to the highest-potential candidate.

### Requirements

The clarifying question must:

- target the actual ambiguity
- sharpen the likely best direction
- be specific to the submission

### Bad questions

- What did you learn?
- Why does this matter?
- Can you say more?
- What was important about this?

### Good question behavior

Ask about:

- the tension the system sees
- the meaning of the strongest moment
- what changed between two states
- why a specific choice mattered

## 14. EXPLANATION / EVIDENCE GENERATION RULE

The scoring layer does not directly write final prose.

But it does decide which candidate gets rendered.

That means explanation quality depends on selecting the right candidate object.

### Rule

Final student-facing explanation/evidence phrasing must be generated from the selected candidate, not regenerated from scratch without reference.

This keeps:

- evidence alignment
- angle consistency
- architecture integrity

## 15. LOGGING REQUIREMENTS

Every run must log the following.

### Run-level fields

- submission_id
- timestamp
- module_name
- route_decision
- confidence_band

### Candidate-level fields

- full candidate objects
- dimension scores
- total score
- rejection flags
- rejection reasons

### Outcome fields

- selected candidate
- displayed strongest direction
- displayed explanation
- displayed evidence notes
- clarifying question shown or not
- user action after display

### Downstream outcome fields if available

- built from selected direction
- asked question instead
- abandoned
- later reviewer score
- later draft usefulness signal

## 16. REVIEW LABELING PLAN

To improve this layer later, add reviewer labels.

### Reviewer questions

For sampled runs:

- Was the top-ranked candidate actually strongest?
- Was a rejected candidate better?
- Was the chosen angle student-specific?
- Was it sufficiently evidence-grounded?
- Was it generic?
- Would a clarifying question have been better?
- Was the final output buildable into a strong essay?

### Label scales

Use 1–5 or 0–1 scales for:

- specificity
- evidence grounding
- genericity
- buildability
- explanation believability

## 17. EVALUATION METRICS

### Offline

- top-1 agreement with reviewer-selected best candidate
- genericity rejection precision
- evidence-grounding pass rate
- candidate distinctness health
- question-first routing accuracy

### Online

- percent choosing “Build from this direction”
- percent choosing “Ask me one question”
- abandon rate after Page 3
- later reviewer override rate
- downstream draft progress rate

## 18. IMPLEMENTATION PHASES

### Phase 1 — heuristic scorer

Build first:

- structured candidate generation
- hard rejection filters
- weighted scoring
- confidence routing
- logging

### Phase 2 — review tooling

Build next:

- reviewer interface
- labels on scored candidate sets
- exportable evaluation records

### Phase 3 — learned reranker

Only after enough labeled runs:

- train supervised candidate-ranker
- calibrate confidence thresholds
- improve question-first routing

## 19. ENGINEERING ACCEPTANCE CRITERIA

The scoring layer is not complete unless all of the following are true.

- system generates multiple candidate directions
- candidates are structured, not prose blobs only
- hard rejection filters are active
- each candidate gets dimension scores
- candidate ranking is explicit and inspectable
- route decision is explicit
- question-first routing exists for low-confidence cases
- logging captures candidate-level data
- current architecture remains intact
- frontend can still show strongest direction first without flattening backend logic

## 20. FAILURE CONDITIONS

Reject implementation if:

- system still effectively chooses first-pass prose without scoring
- only one candidate is generated
- candidates are not inspectable
- generic outputs pass without penalty
- question-first routing is missing
- backend is flattened into single-output logic
- scoring is opaque and cannot be debugged

## 21. BUILD SUMMARY

This scoring layer exists to answer one question:

Of the possible directions the system generated, which one is strongest, most specific, most grounded, and most worth showing the student right now?

For the API contract that carries candidate generation, scoring, routing, and frontend artifact payloads, see [V1_AI_SERVICE_API_SPEC_ADDENDUM.md](V1_AI_SERVICE_API_SPEC_ADDENDUM.md).

It should improve:

- selection
- confidence
- consistency
- trust

It should not replace:

- current generation
- current architecture
- evidence-grounded product logic

### Implementation order

- finish current Page 3 quality refinements
- add structured candidate generation
- add hard rejection filters
- add weighted scorer
- add confidence routing
- add logging
- add human review labels
- later train learned reranker
