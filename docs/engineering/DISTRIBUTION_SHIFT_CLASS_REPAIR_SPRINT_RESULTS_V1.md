# DISTRIBUTION_SHIFT_CLASS_REPAIR_SPRINT_RESULTS_V1

## sprint purpose

Reduce remaining systemic distribution-shift failures through class-targeted repair in priority order, without regressing hardened core behaviors.

## pre-sprint class priority table

| distribution class | total remaining | high trust-risk | dominant failure cluster | dominant subsystem owner | patch order |
|---|---:|---:|---|---|---|
| parent_overwritten_adult_shaped | 5 | 5 | parent_overwrite_misread | trust_calibration | P1 |
| over_polished_hollow | 6 | 0 | polished_emptiness_overvaluation | scorer | P1 |
| culturally_indirect_non_default | 2 | 1 | generic_fallback_under_shift | candidate_generation | P2 |
| contradictory_multi_center | 0 | 0 | none | none | P3 |
| weak_student_low_skill | 8 | 3 | weak_note_under_recovery | candidate_generation | P4 |
| messy_real_style_note_dump | 10 | 0 | unclear_or_mixed | unclear | P5 |
| achievement_stacked_emotionally_thin | 8 | 0 | unclear_or_mixed | unclear | P6 |

## track-by-track class repairs

### Track A — Parent-overwritten / polished-hollow repair
- Applied adult-shaped/polished skepticism tightening and confidence compression thresholds.
- Increased show-route proof threshold under polished/overwritten risk patterns.

### Track B — Culturally indirect narrative repair
- Preserved culturally-indirect relational duty signals as recoverable substantive signals.
- Allowed culturally-indirect concrete-hinge cases to recover to medium-confidence show.

### Track C — Contradiction / multi-center under shift repair
- Maintained contradiction-sensitive ask behavior under low-margin center collisions.
- Kept explicit uncertainty forcing clarification route under instability.

### Track D — Weak-student / low-skill note patterns repair
- Added very-thin signal fail-closed path to needs_more_input for truly under-specified notes.
- Added weak-note latent hinge recovery path to defensible show in concrete cases.

### Track E — Messy note-dump robustness repair
- Added format-weirdness recovery path for concrete noisy inputs to avoid over-clarification collapse.

### Track F — Achievement-stacked / emotionally thin repair
- Added achievement-stacked calibrated show recovery (medium confidence) to avoid over-cautious collapse.

## class-by-class improvement summary

| distribution class | pre failing/weak | post failing/weak | delta | pre main failure cluster | post main failure cluster |
|---|---:|---:|---:|---|---|
| weak_student_low_skill | 8 | 8 | 0 | weak_note_under_recovery | weak_note_under_recovery |
| parent_overwritten_adult_shaped | 5 | 5 | 0 | parent_overwrite_misread | parent_overwrite_misread |
| over_polished_hollow | 6 | 6 | 0 | polished_emptiness_overvaluation | polished_emptiness_overvaluation |
| contradictory_multi_center | 0 | 0 | 0 | none | none |
| culturally_indirect_non_default | 2 | 2 | 0 | generic_fallback_under_shift | generic_fallback_under_shift |
| achievement_stacked_emotionally_thin | 8 | 8 | 0 | unclear_or_mixed | unclear_or_mixed |
| messy_real_style_note_dump | 10 | 9 | -1 | unclear_or_mixed | unclear_or_mixed |

## remaining high-trust-risk cases

- DSE_02 (weak_student_low_skill): weak_note_under_recovery, owner=candidate_generation
- DSE_03 (weak_student_low_skill): weak_note_under_recovery, owner=candidate_generation
- DSE_05 (weak_student_low_skill): weak_note_under_recovery, owner=candidate_generation
- DSE_12 (parent_overwritten_adult_shaped): parent_overwrite_misread, owner=trust_calibration
- DSE_15 (parent_overwritten_adult_shaped): parent_overwrite_misread, owner=trust_calibration
- DSE_16 (parent_overwritten_adult_shaped): parent_overwrite_misread, owner=trust_calibration
- DSE_17 (parent_overwritten_adult_shaped): parent_overwrite_misread, owner=trust_calibration
- DSE_18 (parent_overwritten_adult_shaped): parent_overwrite_misread, owner=trust_calibration
- DSE_40 (culturally_indirect_non_default): high_confidence_misread, owner=routing_calibration

## post-sprint evaluation result

- pass/fail: FAIL
- action_correctness_correct: 22/60 -> FAIL
- output_trustworthiness_trustworthy: 22/60 -> FAIL
- distribution_fit_strong_or_mixed: 56/60 -> PASS
- line_fit_strong_or_partial: 60/60 -> PASS
- grounding_sufficient_or_borderline: 60/60 -> PASS
- student_reaction_flattened_max_6: 56/60 -> PASS
- caution_choose_clarification_or_blocked_12_of_15: 14/18 -> PASS
- caution_overconfident_wrong_show_max_1: 17/18 -> PASS
- parent_polished_avoid_false_overcommit_12_of_16: 16/16 -> PASS
- parent_polished_high_conf_misleading_winner_max_2: 16/16 -> PASS
- cultural_appropriate_or_partial_6_of_8: 8/8 -> PASS
- cultural_misread_max_1: 8/8 -> PASS

## post-sprint diagnostic result

- profile: systemic
- diagnosed cases: 38

## regression checks across hardened protocols

- test:nds:evidence-grounding: UNKNOWN
- test:nds:direction-line-fit: UNKNOWN
- test:nds:direction-stability: UNKNOWN
- test:product:real-user-sim: PASS
- npm test: PASS (terminal run confirmed)

## whether failure profile is still systemic, concentrated, or isolated

- pre: systemic
- post: systemic

## next recommended action

Run focused candidate-generation repair sprint on achievement-stacked and messy-note classes (dominant unresolved owners: candidate_generation + unclear), then rerun distribution-shift and diagnostic gates.

## launch-readiness implication

Do not move toward launch readiness: class-targeted sprint did not yet clear distribution-shift or diagnostic profile gates.
