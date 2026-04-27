# Post-Repair Evaluation Plan v1 — 072 Real Human Corpus Expansion

Date: 2026-04-27
Branch: `072-post-repair-evaluation-plan`
Merged repair baseline: PR #9 / merge commit `ee2ff2a4990b8117d8c80991edf9cd230ed0516a`

## Purpose

Define the first controlled evaluation pass after the targeted 072 output repair.

This plan exists to answer one narrow question:

> Did the de-hardcoded class-level repair move the system meaningfully from `NDS_MODEST_ADVANTAGE` toward `NDS_STRONG_ADVANTAGE` without overfitting the frozen 072 set?

This document is planning-only. It does not authorize a frozen-set rewrite, a public proof claim, an automatic blind human-review rerun, or broader model changes.

## Issue linkage

Repository policy expects GitHub issue linkage for meaningful work. I cannot create or link the issue from this environment, so this branch and artifact should be attached to the next repository issue/PR opened for post-repair evaluation work.

## Named evaluation standard

`072_POST_REPAIR_GENERALIZATION_STANDARD_V1`

## Locked objective

Measure whether the merged 072 targeted repair improved real downstream decision quality and output usefulness enough to justify a later claim that the system is approaching `NDS_STRONG_ADVANTAGE`, while proving that the movement is not merely frozen-set adaptation.

## Locked scope

Evaluate only the already-merged targeted repair behavior.

In scope:
- post-repair measurement design
- frozen-set sentinel checks
- unseen-set / future-split evaluation design
- blind-scored packet design for later execution
- comparison criteria for `MODEST_ADVANTAGE` vs `STRONG_ADVANTAGE`
- anti-overfit rules

Out of scope:
- changing frozen 072 artifacts
- expanding the repair beyond the five approved failure classes
- public marketing claims
- automatic blind human review reruns
- new runtime heuristics or additional model tuning inside this plan

## Operating constraints

1. `072` frozen artifacts remain read-only.
2. The repaired branch result is the measurement baseline, not a license for more tuning.
3. The frozen 072 set may be used as a sentinel, but not as the decisive proof source.
4. Any later claim of `NDS_STRONG_ADVANTAGE` must depend primarily on unseen or future-split evidence.
5. Human review packets must be blinded to pre/post condition whenever feasible.
6. If unseen-set movement is weak or unstable, the correct outcome is "not yet strong advantage," not further silent patching.

## Evaluation design

### 1. Three-layer evidence model

Use three distinct evidence layers.

#### Layer A — Frozen 072 sentinel

Purpose:
- confirm the merged repair did not regress the approved five failure classes
- verify de-hardcoded behavior still preserves the repaired improvements

Allowed uses:
- regression detection
- pattern-count comparison
- stability confirmation

Not allowed as primary proof for strong-advantage movement.

Primary checks:
- correction-template count remains at `0`
- meta-instructional leak count remains at `0`
- generic next-move suffix count remains at `0`
- dangling fragment count remains at `0`
- source-overlap floor does not collapse below the repaired range by a material margin

#### Layer B — Unseen held-out evaluation set

Purpose:
- determine whether the repair generalizes beyond the frozen sentinel set

Requirements:
- must not be selected by looking for cases that flatter the repair
- must be assembled before scoring criteria are changed
- should include the same broad decision difficulty range as 072, but with different literal student material

Recommended composition:
- one fixed post-072 holdout set with medium / weak / ambiguous cases
- one future-split set drawn from later real-human additions or equivalent blind-safe reviewed cases
- enough cases to expose whether the repair only improved obvious easy wins versus real discrimination

Primary checks:
- reduction of the five approved failure classes on unseen inputs
- preservation or improvement of direction specificity
- preserved decisiveness without increased hallucinated certainty
- stronger visible grounding in student material
- stable or improved comparative preference rate versus prior baseline

#### Layer C — Blind human judgment packet

Purpose:
- measure whether the repaired outputs actually feel closer to `STRONG_ADVANTAGE` under blinded review

Packet requirements:
- pre-repair and post-repair outputs rendered in randomized order
- no provenance labels
- consistent rubric
- reviewer forced to choose among: `baseline better`, `repaired better`, `tie / indistinguishable`
- reviewers must also rate degree of advantage, not only winner

Core rubric dimensions:
- decisiveness of the judgment
- specificity to student material
- obviousness of why the selected direction wins
- fluency / lack of awkward phrasing
- usefulness of next move
- trustworthiness / absence of templated or meta leakage

## Measurement framework

### A. Failure-class movement

Track the five approved classes directly:
- repeated correction-arc templating
- awkward / truncated phrasing
- insufficient decisiveness
- wins not obvious enough
- weak use of student-specific material

For each dataset layer, record:
- count
- rate
- severity bucket
- representative examples

### B. Generalization movement

Measure whether the repair improves unseen cases, not just frozen ones.

Minimum reporting structure:
- frozen sentinel before vs after
- unseen holdout before vs after
- blinded human preference summary
- disagreement analysis on borderline cases

### C. Advantage-strength interpretation

Use the following qualitative interpretation bands.

#### Still `NDS_MODEST_ADVANTAGE`

If most of the following are true:
- unseen-set wins are present but narrow
- reviewers often prefer repaired outputs only slightly
- a meaningful fraction of cases remain ties
- failure classes are reduced but not decisively eliminated on unseen data
- improvements are obvious on frozen sentinel cases but inconsistent elsewhere

#### Approaching `NDS_STRONG_ADVANTAGE`

If most of the following are true:
- unseen-set preference rate clearly favors repaired outputs
- reviewer comments repeatedly describe the repaired outputs as more credible, more specific, and more obviously useful
- the five failure classes stay materially reduced on unseen data, not just frozen data
- decisiveness improves without raising obvious overclaim / hallucination concerns
- student-material grounding is consistently stronger across varied case types

#### Eligible for later `NDS_STRONG_ADVANTAGE` claim review

Only if all of the following are true:
- unseen-set advantage is clear and repeatable
- blind human review shows durable preference, not marginal preference
- gains hold across more than one unseen slice
- failure-class reductions remain intact without new compensating failures
- review notes do not suggest frozen-case memorization or pattern mimicry

## Anti-overfit safeguards

1. Freeze the rubric before packet review.
2. Do not alter the repaired runtime during the evaluation pass.
3. Keep the frozen 072 set strictly as a sentinel layer.
4. Require at least one unseen dataset and one blind human packet before interpreting strength movement.
5. Document any case family where improvement appears isolated to one lexical or thematic cluster.
6. Record false-confidence failures separately from helpful decisiveness gains.
7. If a metric improves only on the frozen set, classify that as non-generalized movement.

## Required review packet

The post-repair review packet should include:
- repair baseline summary from merged PR #9
- frozen sentinel summary
- unseen holdout comparison summary
- blinded human preference table
- representative wins, ties, and losses
- explicit `MODEST_ADVANTAGE` vs `APPROACHING_STRONG_ADVANTAGE` recommendation
- anti-overfit memo

## Required proof set

Before any later strength claim is considered, produce:
- one machine-readable summary JSON
- one human-readable pattern summary memo
- one blinded review packet
- one recommendation memo with explicit confidence level
- one appendix listing cases that did not improve or became less trustworthy

## Execution sequence

1. Freeze this plan and do not broaden scope.
2. Build the unseen evaluation set manifest.
3. Re-run the repaired system on the frozen sentinel and unseen holdout sets.
4. Assemble blinded pre/post packets for human review.
5. Score with the locked rubric.
6. Compare movement across frozen vs unseen layers.
7. Write a recommendation memo using the interpretation bands above.

## Decision rule

### Recommend "repair generalized, but still modest"

If:
- sentinel improvements hold
- unseen improvements exist but are mixed
- blind reviewers show only narrow preference

### Recommend "approaching strong advantage"

If:
- sentinel improvements hold
- unseen improvements are broad and repeatable
- blind reviewers show clear preference for repaired outputs
- no strong evidence of frozen-set overfitting appears

### Recommend "insufficient evidence"

If:
- unseen-set results are thin, unstable, or missing
- blind review is not yet run
- improvements are mainly frozen-set visible

## Deliverables for the next execution pass

The next evaluation execution lane should produce:
- unseen-set manifest
- blinded packet manifest
- post-repair comparison summary
- explicit strength recommendation
- anti-overfit findings section

## Final note

The right burden of proof here is not "did the repair help somewhere?"
The right burden is:

> did the merged repair create repeatable, blind-visible improvement outside the frozen 072 sentinel set, enough to justify saying the system is moving beyond modest advantage?

Until that burden is met, the safe conclusion remains disciplined progress without a strong-advantage claim.
