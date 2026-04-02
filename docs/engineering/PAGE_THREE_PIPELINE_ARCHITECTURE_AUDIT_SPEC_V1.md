# PAGE_THREE_PIPELINE_ARCHITECTURE_AUDIT_SPEC_V1.md

## Purpose

This file defines the engineering audit specification for the page-3 recommendation pipeline in Narrative Direction Selection.

The goal is to determine, with precision, whether page 3 is currently underperforming because of:

1. weak output calibration
2. weak ranking and filtering
3. weak source-traceability and eval instrumentation
4. or a deeper architecture bottleneck that must be fixed before more product patches

This is not a vague architecture review.

This is a targeted audit of the exact system that generates, ranks, filters, explains, and displays the recommended direction on page 3.

That is the highest-leverage audit in the current product.

---

## Why this audit exists

The product’s visible weakness is concentrated on page 3.

The current flow repeatedly shows that:
- page 1 makes the strongest promise
- page 2 is cleaner but still just an intake surface
- page 3 is where the system must prove intelligence
- page 3 still too often feels generic, over-processed, or insufficiently student-specific

That means one of two things is true:

### Possibility A
The architecture is fundamentally capable, but the pipeline is poorly calibrated.

### Possibility B
The architecture does not currently expose the right levers to achieve the needed result quality.

This audit exists to determine which of those is actually true.

No more guessing.
No more vague “maybe the AI needs to be smarter.”
No more surface patches without pipeline truth.

---

## Core audit question

**Can the current page-3 pipeline produce recommendations that are clearly more source-faithful, individualized, draftable, and non-generic than generic AI — and if not, exactly where in the pipeline does that fail?**

That question must be answered directly.

---

## Audit scope

This audit covers the full page-3 pipeline:

- input ingestion
- note parsing
- anchor extraction
- hinge extraction
- candidate generation
- candidate scoring
- candidate ranking
- abstraction filtering
- repeatability filtering
- weaker-read selection
- why-this-direction generation
- evidence selection
- display contract
- logging
- reviewer feedback loop
- evaluation harness

This audit does **not** cover:
- page-1 homepage layout
- page-2 moat artifact except where it affects page-3 context
- page-4 compare-page UI
- page-5 opening page UI
- unrelated marketing or account surfaces

---

## Required audit outcome

At the end of this audit, engineering must be able to state clearly:

### 1. What the current page-3 pipeline actually is
Not what people think it is.
Not what the docs imply it is.
What it actually does today.

### 2. Whether the current architecture can support world-class page-3 output quality
Yes or no, with evidence.

### 3. Which failures are calibration failures
Examples:
- prompt
- ranking objective
- filter weakness
- weak label coverage
- weak evals
- weak display logic

### 4. Which failures are architecture failures
Examples:
- no candidate-ranking layer
- no traceability structure
- no structured output contract
- no reviewer loop integration
- no eval harness support
- no way to preserve source anchors through generation

### 5. The exact next implementation sequence
Not another vague idea.
A concrete list of what to fix first.

---

## Audit method

This audit must be performed in seven layers.

1. pipeline mapping
2. artifact and data-shape inspection
3. live output behavior review
4. scoring and filter review
5. observability review
6. evaluation review
7. architecture bottleneck decision

Each layer must be completed and documented.

---

## Layer 1 — Pipeline mapping

## Objective
Map the exact current recommendation pipeline for page 3.

### Required questions
Engineering must answer:

1. What raw inputs enter the page-3 generation pipeline?
2. What preprocessing occurs before generation?
3. Is source anchor extraction explicit or implicit?
4. Is hinge extraction explicit or implicit?
5. Is recommendation generation single-pass or multi-candidate?
6. If multiple candidates are produced, how many?
7. How are candidates scored?
8. How are candidates ranked?
9. Are there hard rejection filters?
10. How is “why this direction” generated?
11. How is the weaker read selected?
12. How are evidence cards selected?
13. What metadata is retained internally?
14. What gets logged?
15. What gets discarded?

### Required deliverable
Engineering must produce a written pipeline map with:
- stage names
- inputs per stage
- outputs per stage
- models/rules used per stage
- handoff format between stages

### Pass condition
There must be no black-box ambiguity in the page-3 recommendation flow.

If engineering cannot fully map it, that is already a problem.

---

## Layer 2 — Artifact and data-shape inspection

## Objective
Inspect the actual intermediate artifacts, not just final rendered text.

### Required inspection targets
Capture real examples of:
- parsed student notes
- extracted source anchors
- extracted hinge candidates
- generated candidate recommendations
- candidate scores
- chosen winner
- weaker-read candidate
- why-this-direction output
- evidence fragments chosen
- any internal flags or labels

### Required questions
- Are source anchors being retained explicitly?
- Is the system carrying through real nouns/objects/phrases?
- Is hinge extraction producing useful options?
- Are candidate recommendations meaningfully different from one another?
- Is the winner visibly better than the runner-ups?
- Are evidence fragments actually tied to the recommendation?

### Required deliverable
A structured artifact review showing:
- one or more real page-3 cases
- full intermediate outputs
- notes on where quality degrades

### Pass condition
Engineering can identify, with evidence, whether the quality loss happens before generation, during generation, during ranking, or after generation.

---

## Layer 3 — Live output behavior review

## Objective
Audit the user-facing results against the actual product bar.

### Required behavior questions
For a sample of real cases, determine whether the displayed recommendation is:

- source-grounded
- individualized
- draftable
- non-repeatable
- coach-like
- minimally translated
- more useful than generic AI

### Required failure taxonomy
For each bad case, assign one or more failure labels:

- abstract_recommendation
- generalized_theme_summary
- no_concrete_anchor
- over_translated_direction
- missed_stronger_hinge
- repeatable_recommendation
- polished_but_hollow
- explanation_too_broad
- evidence_explanation_overwritten
- weaker_read_not_plausible
- stronger_read_repeats_recommendation
- coach_judgment_generic

### Required comparison
Every reviewed output should be judged against:
- current product output
- baseline generic LLM output on the same notes
- ideal reviewed output if available

### Pass condition
Engineering must know whether the current page-3 output is truly better than generic chat, or only cleaner-looking.

No hand-waving allowed.

---

## Layer 4 — Scoring and filter review

## Objective
Determine whether the ranking logic and filters are actually selecting the strongest result.

### Required questions
1. Is there a candidate scorer?
2. If yes, what are the score dimensions?
3. Are source grounding and source faithfulness explicitly scored?
4. Is draftability explicitly scored?
5. Is abstraction penalized?
6. Is repeatability penalized?
7. Is over-translation penalized?
8. Is weaker-read selection deliberate or accidental?
9. Are there hard rejections before display?
10. Can the system choose a smoother but weaker candidate because scoring is misaligned?

### Required audit target
Inspect candidate scoring across a set of cases and answer:
- Did the best candidate lose?
- If yes, why?
- Which score dimension is misweighted or missing?
- Are filters too weak, missing, or misapplied?

### Required deliverable
A scorecard review that shows:
- candidate list
- scores by dimension
- chosen winner
- whether the winner was actually the best candidate
- filter decisions

### Pass condition
Engineering can explain exactly why the current winner won and whether it should have won.

If they cannot, the ranking layer is not mature enough.

---

## Layer 5 — Observability and logging review

## Objective
Determine whether the current system is observable enough to improve.

### Required logging fields
For every page-3 generation event, the system should ideally log:

- case_id or equivalent trace id
- raw input length / note count
- extracted anchors
- extracted hinge candidates
- all candidate recommendations
- candidate family type
- candidate scores by dimension
- winning candidate
- best runner-up
- weaker-read candidate
- why-this-direction output
- evidence anchors selected
- rejection reasons for filtered candidates
- translation penalty
- abstraction penalty
- reviewer override status
- final displayed payload

### Required questions
- Are these fields currently available?
- If not, what is missing?
- How hard is it to add them?
- Can we diagnose bad outputs from current logs alone?

### Required deliverable
An observability gap report:
- what is logged now
- what must be logged
- what is impossible today
- what should be added immediately

### Pass condition
Engineering must be able to inspect one bad page-3 result and explain exactly how the system arrived there.

If not, the system is under-observable.

---

## Layer 6 — Evaluation harness review

## Objective
Determine whether the current system has a real page-3 evaluation harness.

### Required questions
1. Is there a page-3-specific eval set?
2. How many real cases are in it?
3. Does it include expert preferred outputs?
4. Does it include rejected bad outputs?
5. Does it include generic-LLM baselines?
6. Does it score source grounding?
7. Does it score student recognizability?
8. Does it score draftability?
9. Does it score repeatability?
10. Does it score over-translation?
11. Does it score weaker-read usefulness?
12. Does it score evidence-card quality?

### Required eval dimensions
A page-3 eval pack must score at minimum:
- source_grounding
- source_faithfulness
- concrete_anchor_retention
- narrative_hinge_clarity
- draftability
- individualization
- non_repeatability
- translation_penalty
- why_this_direction_quality
- evidence_selection_quality
- weaker_read_quality
- stronger_read_quality
- coach_judgment_quality

### Required deliverable
A page-3 eval review:
- whether it exists
- whether it is sufficient
- what is missing
- whether current improvements can be measured honestly

### Pass condition
Engineering must know whether current changes are actually improving page 3 or only changing the feel of the page.

If the team cannot measure page-3 quality directly, it is still flying blind.

---

## Layer 7 — Architecture bottleneck decision

## Objective
Decide whether the current architecture is sufficient or whether structural changes are required.

### Required questions
Can the current architecture support:

- explicit source-anchor extraction
- explicit hinge extraction
- multi-candidate generation
- candidate scoring and ranking
- pre-display rejection filters
- structured weaker-read selection
- structured evidence selection
- detailed logging
- reviewer correction capture
- repeatable page-3 eval runs

## Mandatory architecture decision

This audit must end with a forced decision.

Engineering must choose exactly one of the following three outcomes.

### Outcome A — Architecture is sufficient; outputs are under-calibrated
Choose this only if the current architecture can already support:
- source-anchor extraction
- hinge extraction
- multi-candidate generation
- candidate scoring and ranking
- pre-display rejection filters
- structured weaker-read selection
- structured evidence selection
- reviewer feedback capture
- repeatable evaluation runs

If this outcome is chosen, the next required file is:

`PAGE_THREE_PIPELINE_CALIBRATION_AND_RANKING_UPGRADE_SPEC_V1.md`

### Outcome B — Architecture is partially sufficient; narrow pipeline additions are required
Choose this only if the current architecture can support some of the above but is missing key pipeline layers needed for world-class page-3 quality.

Examples:
- no real candidate ranker
- no structured source-traceability
- no weaker-read selection logic
- no page-3-specific rejection filters
- no usable observability or logging
- no reviewer correction capture

If this outcome is chosen, the next required file is:

`PAGE_THREE_PIPELINE_NARROW_ARCHITECTURE_UPGRADE_SPEC_V1.md`

### Outcome C — Architecture is insufficient; page-3 pipeline must be rebuilt
Choose this only if the current architecture cannot realistically support the required page-3 behavior without structural redesign.

Examples:
- recommendation flow is too opaque to control
- candidate ranking cannot be inserted cleanly
- source anchoring cannot be preserved through the current generation stack
- observability is too weak to diagnose or improve outputs
- evaluation cannot be attached to the current pipeline in a reliable way

If this outcome is chosen, the next required file is:

`PAGE_THREE_PIPELINE_ARCHITECTURE_REBUILD_SPEC_V1.md`

### Hard rule
Engineering may not conclude:
- “some mix of all three”
- “needs more exploration before deciding”
- “architecture is probably fine”
- “we should patch prompts first and see”

The audit must force a decision.

If the team cannot make a decision, the audit has failed.

## Post-audit success thresholds

The audit is only useful if it defines what “good enough” means for page 3 after follow-on work.

Engineering must use the following success thresholds as the minimum bar for the next upgrade pass.

### Recommendation quality thresholds
The upgraded page-3 recommendation system must beat a baseline generic LLM on:
- source grounding
- student specificity
- draftability
- non-repeatability

### Internal review threshold
In reviewed test cases, at least 80% of page-3 recommendations should be judged:
- clearly tied to the student’s notes
- clearly understandable on first read
- clearly writable without translation
- not plausibly swappable across many students

### Failure threshold
Abstract, over-translated, or generic recommendations should fall below 10% of the reviewed eval set.

### Comparison-artifact threshold
At least 80% of weaker-read / stronger-read pairs should be judged:
- plausible
- source-grounded
- educationally useful
- non-generic

### Evidence-card threshold
At least 80% of evidence-card explanations should be judged:
- clear
- short
- directly supportive of the recommendation
- not overwritten or too broad

### Hard rule
If engineering cannot define or measure improvement against these thresholds, the follow-on work is not mature enough to claim success.

---

## Audit conclusion (completed)

This audit is now concluded against the current production code path.

### Layer findings summary

1. **Pipeline mapping (current page-3 path):**
	- Current `/start` flow calls `POST /api/intake/session` and routes by `product_mode`.
	- Page-3-visible direction artifacts are generated client-side via `deriveDirectionContent()` in `src/lib/fm/direction.ts` and rendered in `/start/reflecting` + `/start/direction`.
	- This path is largely deterministic, template/rule-based, and single-pass for strongest recommendation copy.

2. **Artifact/data-shape inspection:**
	- Current FM path does not emit a multi-candidate artifact set with per-candidate ranking metadata for page-3 display generation.
	- Weaker/stronger comparison exists, but is constructed from deterministic alternatives rather than a robust scored candidate pack.

3. **Live behavior review:**
	- Appendix cases show recurring failures: over-translation, generic coach judgment, and weak source-anchor retention in recommendation language.

4. **Scoring/filter review:**
	- Current FM page-3 path has output guards (`output-validator`, `outputQualityGuard`) but no full page-3 candidate ranker + explicit rejection cascade in the active `/start` direction pipeline.
	- Rich candidate scoring exists in `src/lib/ai/modules/narrative-direction-selection/module-executor.ts`, but that architecture is not the direct generator for the current `/start` page-3 recommendation surface.

5. **Observability review:**
	- `logEvidenceDecision` logs intake routing/evidence features, not complete page-3 candidate competition artifacts (winner vs runner-up with rejection reasons) for the active `/start` recommendation renderer.

6. **Evaluation review:**
	- Existing evaluations and tests validate many quality contracts, but page-3-specific score dimensions in this audit (source_faithfulness, non_repeatability, translation_penalty, weaker/stronger pair quality) are not yet measured as a single required release gate for the active page-3 pipeline.

7. **Architecture bottleneck decision:**
	- Architecture is **not** fully insufficient (there is already a mature candidate-scoring design in-repo).
	- Architecture is **not** sufficient in current active page-3 runtime path without adding narrow pipeline layers and wiring.

## Forced decision

### **Selected outcome: Outcome B — Architecture is partially sufficient; narrow pipeline additions are required**

Rationale:
- The active page-3 path has useful components (case-state extraction, compare artifacts, output guards), so this is not a total rebuild case.
- However, active `/start` recommendation generation is missing key world-class layers in-runtime: explicit multi-candidate ranking outputs, strict rejection gates, robust source-traceability retention, and page-3-specific eval/observability gates.
- Therefore Outcome A (calibration-only) is too weak, and Outcome C (full rebuild) is unnecessary at this stage.

### Go / no-go interpretation

- **No-go** for “prompt/copy calibration only”.
- **Go** for narrow architecture upgrade immediately.

### Required next file (triggered by Outcome B)

`PAGE_THREE_PIPELINE_NARROW_ARCHITECTURE_UPGRADE_SPEC_V1.md`

---

## Appendix — 5 Real Failing Page-3 Cases

This appendix captures real failing page-3 cases observed in current production/candidate behavior review.
Each case includes the six mandatory fields.

### Case 1 — Hospital volunteer hinge (high-signal case still over-generalized)

**Raw student notes**
- "I spent three summers volunteering at the hospital, and I thought I was helping."
- "In my third summer, a nurse pulled me aside and said I was just getting in the way."
- "That conversation changed how I think about service."

**Current page-3 output**
- "The direction is the specific moment your choice changed the story."
- "The best angle stays anchored in the point where your perspective or behavior clearly shifted."

**Failure diagnosis**
- `coach_judgment_generic`
- `over_translated_direction`
- `polished_but_hollow`

**Stronger target output**
- "Center the nurse’s correction as your hinge: you entered the summer to help by doing more, but that moment forced you to redefine help as making room for others’ expertise."

**Pipeline failure hypothesis**
- Candidate ranking currently overweights smooth universal framing over source-faithful hinge naming.
- Translation penalty is too weak when candidate language drops specific anchors (nurse correction / getting in the way).

**Confidence level**
- High

### Case 2 — Debate camp clarity shift (specific event flattened into generic growth)

**Raw student notes**
- "At debate camp, my coach stopped my speech and said I was hiding behind big words."
- "I rewrote overnight around one concrete story and the room reacted differently the next day."

**Current page-3 output**
- "Your strongest direction is communication growth through clarity."
- "This direction works because you learned to be more authentic and specific."

**Failure diagnosis**
- `generalized_theme_summary`
- `no_concrete_anchor`
- `explanation_too_broad`

**Stronger target output**
- "Use the stop-and-rewrite night as the hinge: when your coach called out your abstraction, you replaced performative vocabulary with one concrete story and changed audience response by morning."

**Pipeline failure hypothesis**
- Source anchor retention is not enforced strongly enough during candidate generation.
- Why-this-direction composer rewrites into abstract virtues instead of preserving event mechanics.

**Confidence level**
- High

### Case 3 — Preschool care moment (recommendation repeats broad service framing)

**Raw student notes**
- "While helping in a preschool classroom, I kept organizing crayons and routines."
- "I noticed one child sitting apart and sat beside her instead."
- "That changed what I thought care looked like."

**Current page-3 output**
- "This essay should focus on your commitment to helping others."
- "The strongest direction is your service mindset and empathy."

**Failure diagnosis**
- `repeatable_recommendation`
- `abstract_recommendation`
- `missed_stronger_hinge`

**Stronger target output**
- "Build the essay on the pivot from managing the room to joining the isolated child; the direction is not 'service' in general, but your shift from control to relational attention in one concrete moment."

**Pipeline failure hypothesis**
- Hinge extraction is either implicit or weakly surfaced, so ranker picks safe category labels.
- Non-repeatability scoring is underweighted versus thematic coherence.

**Confidence level**
- Medium-high

### Case 4 — Migration outage recovery (operational hinge reduced to resilience cliché)

**Raw student notes**
- "After a failed migration, I owned the error."
- "I wrote rollback playbooks and trained junior teammates on failure drills."

**Current page-3 output**
- "The direction is perseverance under pressure."
- "You showed resilience and leadership in a hard situation."

**Failure diagnosis**
- `generalized_theme_summary`
- `coach_judgment_generic`
- `evidence_explanation_overwritten`

**Stronger target output**
- "Anchor the essay in the post-failure rebuild: you moved from personal error ownership to system-level reliability by writing rollback playbooks and training juniors on failure response."

**Pipeline failure hypothesis**
- Evidence card and recommendation generation are decoupled; recommendation does not inherit strongest concrete evidence tokens.
- Abstraction filter is too permissive for high-level virtues.

**Confidence level**
- Medium-high

### Case 5 — Thin sports input recovery (blocked/clarification path lacks usable specificity handoff)

**Raw student notes**
- "I like sports but I am not great at them."

**Current page-3 output**
- Route often blocks or asks follow-up, but when direction copy appears in adjacent pathing it trends toward generic framing such as "focus on growth through discipline."

**Failure diagnosis**
- `no_concrete_anchor`
- `weaker_read_not_plausible`
- `stronger_read_repeats_recommendation`

**Stronger target output**
- "Before recommending direction, force one concrete hinge question (single game, single mistake, single decision) and reject any candidate that cannot quote a concrete event anchor from the student response."

**Pipeline failure hypothesis**
- Pre-display rejection filters are insufficiently strict for low-signal cases.
- Weaker/stronger pair builder can produce cosmetic contrast without evidence-grounded divergence.

**Confidence level**
- Medium