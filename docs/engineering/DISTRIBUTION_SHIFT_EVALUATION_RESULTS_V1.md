# DISTRIBUTION_SHIFT_EVALUATION_RESULTS_V1

## protocol purpose

Evaluate whether NDS generalizes with trust, restraint, and usefulness under shifted real-world input distributions.

## class inventory

- weak_student_low_skill: 10
- parent_overwritten_adult_shaped: 8
- over_polished_hollow: 8
- contradictory_multi_center: 8
- culturally_indirect_non_default: 8
- achievement_stacked_emotionally_thin: 8
- messy_real_style_note_dump: 10

## overall pass/fail summary

**FAIL**
- action_correctness_correct: 21/60 (need 48) -> FAIL
- output_trustworthiness_trustworthy: 21/60 (need 45) -> FAIL
- distribution_fit_strong_or_mixed: 54/60 (need 45) -> PASS
- line_fit_strong_or_partial: 60/60 (need 48) -> PASS
- grounding_sufficient_or_borderline: 60/60 (need 48) -> PASS
- student_reaction_flattened_max_6: 54/60 (need 54) -> PASS
- caution_choose_clarification_or_blocked_12_of_15: 12/18 (need 12) -> PASS
- caution_overconfident_wrong_show_max_1: 17/18 (need 17) -> PASS
- parent_polished_avoid_false_overcommit_12_of_16: 16/16 (need 12) -> PASS
- parent_polished_high_conf_misleading_winner_max_2: 16/16 (need 14) -> PASS
- cultural_appropriate_or_partial_6_of_8: 8/8 (need 6) -> PASS
- cultural_misread_max_1: 8/8 (need 7) -> PASS
- design_rule_unlike_curated_at_least_30: 60/60 (need 30) -> PASS
- design_rule_weaker_system_fail_at_least_20: 52/60 (need 20) -> PASS
- design_rule_caution_at_least_15: 18/60 (need 15) -> PASS
- design_rule_success_without_good_sounding_at_least_10: 36/60 (need 10) -> PASS

## class-by-class performance

| distribution class | total cases | pass rate | main failure cluster | fix owner | fix priority |
|---|---:|---:|---|---|---|
| weak_student_low_skill | 10 | 70.0% | weak_note_under_support | AI engine + product trust | P5 |
| parent_overwritten_adult_shaped | 8 | 100.0% | none | AI engine + product trust | P5 |
| over_polished_hollow | 8 | 87.5% | overfit_to_clean_input_failure | AI engine + product trust | P5 |
| contradictory_multi_center | 8 | 87.5% | contradiction_collapse | AI engine + product trust | P4 |
| culturally_indirect_non_default | 8 | 87.5% | overfit_to_clean_input_failure | AI engine + product trust | P1 |
| achievement_stacked_emotionally_thin | 8 | 100.0% | none | AI engine + product trust | P5 |
| messy_real_style_note_dump | 10 | 100.0% | none | AI engine + product trust | P5 |

## caution-case performance

- caution cases: 18
- routed to clarification or blocked: 12/18

## polished-empty / parent-overwrite performance

- combined cases: 16
- clearly high-confidence misleading winners: 0

## cultural-style findings

- culturally indirect cases: 8
- misread_due_to_style: 0

## top 10 distribution-shift trust breaks

1. DSE_02 (weak_student_low_skill): weak_note_under_support -> feels_flattened_or_misread
2. DSE_03 (weak_student_low_skill): weak_note_under_support -> feels_flattened_or_misread
3. DSE_05 (weak_student_low_skill): weak_note_under_support -> feels_flattened_or_misread
4. DSE_22 (over_polished_hollow): overfit_to_clean_input_failure -> feels_flattened_or_misread
5. DSE_32 (contradictory_multi_center): contradiction_collapse -> feels_flattened_or_misread
6. DSE_40 (culturally_indirect_non_default): overfit_to_clean_input_failure -> feels_flattened_or_misread
7. coverage_fill_7: no additional high-priority break
8. coverage_fill_8: no additional high-priority break
9. coverage_fill_9: no additional high-priority break
10. coverage_fill_10: no additional high-priority break

## recommended fix sequence

1. Priority 1: high-confidence misreads on shifted inputs.
2. Priority 2: polished-emptiness overvaluation.
3. Priority 3: cultural-style misreads.
4. Priority 4: contradiction/collision overcommitment under shift.
5. Priority 5: weak-note recovery weaknesses.

## product readiness implications

Do not move toward launch readiness until distribution-shift protocol passes.
