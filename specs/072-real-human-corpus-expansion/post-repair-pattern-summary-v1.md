# 072 Post-Repair Pattern Summary — V1

## What generalized cleanly

The five targeted failure classes stayed eliminated outside the frozen 072 set.

- Frozen sentinel rerun: all four measured phrasing / leakage counters dropped to zero and specificity improved.
- Unseen holdout (`9` cases):
  - correction-template leakage: `0`
  - meta-instructional leakage: `0`
  - generic next-move suffix: `0`
  - dangling fragments: `0`
  - low-specificity cases: `0`
  - average source overlap: `8.00`
- Future-split (`15` cases):
  - correction-template leakage: `0`
  - meta-instructional leakage: `0`
  - generic next-move suffix: `0`
  - dangling fragments: `0`
  - low-specificity cases: `0`
  - average source overlap: `7.47`

## Where the repaired system is genuinely better

Across the unseen slices, the repaired system consistently beats the baseline on machine scoring because it:

- anchors to student-specific material instead of generic personal-statement filler,
- offers a usable direction or essay engine instead of placeholder advice,
- keeps evidence-grounding and next-step usefulness materially higher than baseline, and
- preserves decisiveness without reintroducing the exact frozen-set leak patterns that motivated the repair.

## Residual weakness that still matters

The repair removed the targeted failure classes, but blind review surfaced a remaining quality risk that is not captured by those counters.

### Residual risk: motif drift under confidence

Several unseen wins still reuse abstract repair motifs that do not fully match the prompt.

Representative borderline cases:

- `RHC-026`: direction output is more grounded than baseline, but it still overcommits on a clarification-expected case.
- `RHC-028`: output beats baseline by engaging the actual music-topic logic, yet it still carries a generic correction-frame template.
- `RHC-030`: output is better than baseline, but it remains pattern-heavy around grief / medicine material.
- `RHC-004`: output is more draftable than baseline, but the scene logic drifts toward a conflict / feedback template instead of fully honoring the identity-and-place structure.
- `RHC-005`: output captures the audience-need correction, yet some language drifts into an unrelated service / clinic frame.

## Anti-overfit readout

This run does not look like frozen-case memorization.

- The frozen sentinel was used only as a read-only sentinel layer.
- Two unseen slices (`9` + `15` cases) carried the primary machine evidence.
- The blind packet mixed both unseen slices before decode.
- Improvement did not depend on one lexical cluster; both weaker fragment cases and stronger official-essay cases favored NDS.
- The remaining weakness is not a return of the original frozen failure classes; it is a broader scenario-alignment issue that now becomes the main next repair target.

## Bottom line

The post-repair movement is real and generalized. The repaired system is no longer just winning on the frozen sentinel because the same failure-class reductions hold on unseen data. The main caution is that some unseen wins are still only modest because they remain template-shaped even while outperforming baseline.
