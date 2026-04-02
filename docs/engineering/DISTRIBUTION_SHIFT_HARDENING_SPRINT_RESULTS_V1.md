# DISTRIBUTION_SHIFT_HARDENING_SPRINT_RESULTS_V1

## sprint purpose

Repair systemic generalization failures from distribution-shift evaluation/diagnostic while preserving hardened core NDS behavior.

## pre-sprint failure profile

- distribution-shift pass/fail: FAIL
- diagnostic profile: systemic
- diagnosed cases: 60
- high trust-risk cases: 13

## track-by-track changes

### track a high confidence misread reduction
- Added shift-sensitive confidence compression and route skepticism under adult-shaped/polished/contradiction risk.
- Raised evidence+margin bar before allowing show on shift-risk patterns.

### track b polished parent resistance
- Added adult-shaped and polished-empty stress signals.
- Added route guard to avoid false-premium show on shallow margins.

### track c cultural style robustness
- Added culturally-indirect signal and reduced false low-signal penalty for relational-duty narratives.
- Added cultural-style support path allowing show when concrete hinge exists.

### track d contradiction calibration
- Added contradiction-sensitive clarification threshold under shifted input.
- Forced low-confidence ask in contradiction + low-margin cases.

### track e weak note recovery
- Expanded action marker detection to recover latent concrete signals in weak notes.
- Retained clarification quality safeguards while preventing immediate collapse to generic.

### track f generic fallback suppression
- Replaced generic other-domain primary line with concrete correction-arc line.
- Added generic-fallback suppression guard when top line is generic under shift.

### debug reporting updates
- Exposed shift_risk_flags and activation toggles in scoring_debug.
- Exposed candidate axis_family, total_score, why_this_direction, selected_evidence in payload candidates.


## class-by-class improvement summary

| distribution class | pre failing/weak | post failing/weak | delta | pre main failure cluster | post main failure cluster |
|---|---:|---:|---:|---|---|
| weak_student_low_skill | 10 | 8 | -2 | weak_note_under_recovery | weak_note_under_recovery |
| parent_overwritten_adult_shaped | 8 | 5 | -3 | parent_overwrite_misread | parent_overwrite_misread |
| over_polished_hollow | 8 | 6 | -2 | polished_emptiness_overvaluation | polished_emptiness_overvaluation |
| contradictory_multi_center | 8 | 0 | -8 | unclear_or_mixed | none |
| culturally_indirect_non_default | 8 | 2 | -6 | unclear_or_mixed | generic_fallback_under_shift |
| achievement_stacked_emotionally_thin | 8 | 8 | 0 | unclear_or_mixed | unclear_or_mixed |
| messy_real_style_note_dump | 10 | 10 | 0 | unclear_or_mixed | unclear_or_mixed |

## high-trust-risk case reductions

- pre: 13
- post: 9
- delta: -4

## post-sprint distribution-shift result

- pass/fail: FAIL
- action_correctness_correct: 21/60 -> FAIL
- output_trustworthiness_trustworthy: 21/60 -> FAIL
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
- diagnosed cases: 39

## regression checks across existing protocols

- test:nds:evidence-grounding: UNKNOWN
- test:nds:direction-line-fit: UNKNOWN
- test:nds:direction-stability: UNKNOWN
- test:product:screen-trust: UNKNOWN
- test:product:flow-break: PASS
- test:product:session-state: PASS
- test:product:real-user-sim: PASS
- npm test: PASS (terminal run confirmed in sprint execution)
- test:nds:edge-case-breaker: UNKNOWN

## remaining generalization risks

- DSE_02 (weak_student_low_skill): weak_note_under_recovery, trust=high, owner=candidate_generation
- DSE_03 (weak_student_low_skill): weak_note_under_recovery, trust=high, owner=candidate_generation
- DSE_04 (weak_student_low_skill): weak_note_under_recovery, trust=medium, owner=candidate_generation
- DSE_05 (weak_student_low_skill): weak_note_under_recovery, trust=high, owner=candidate_generation
- DSE_06 (weak_student_low_skill): weak_note_under_recovery, trust=medium, owner=candidate_generation
- DSE_07 (weak_student_low_skill): weak_note_under_recovery, trust=medium, owner=candidate_generation
- DSE_09 (weak_student_low_skill): weak_note_under_recovery, trust=medium, owner=candidate_generation
- DSE_10 (weak_student_low_skill): weak_note_under_recovery, trust=medium, owner=candidate_generation
- DSE_12 (parent_overwritten_adult_shaped): parent_overwrite_misread, trust=high, owner=trust_calibration
- DSE_15 (parent_overwritten_adult_shaped): parent_overwrite_misread, trust=high, owner=trust_calibration
- DSE_16 (parent_overwritten_adult_shaped): parent_overwrite_misread, trust=high, owner=trust_calibration
- DSE_17 (parent_overwritten_adult_shaped): parent_overwrite_misread, trust=high, owner=trust_calibration
- DSE_18 (parent_overwritten_adult_shaped): parent_overwrite_misread, trust=high, owner=trust_calibration
- DSE_20 (over_polished_hollow): polished_emptiness_overvaluation, trust=medium, owner=scorer
- DSE_21 (over_polished_hollow): generic_fallback_under_shift, trust=medium, owner=candidate_generation

## launch-readiness implication

Do not move toward launch readiness: distribution-shift hardening thresholds and/or diagnostic profile remain above release tolerance.
