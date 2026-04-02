# DISTRIBUTION_SHIFT_FAILURE_DIAGNOSTIC_RESULTS_V1

## protocol purpose

Convert failed distribution-shift evaluation output into a precise failure-attribution map with subsystem ownership and patch order.

## overall failure profile

- assessment: **systemic**
- explanation: Failures are distributed across many classes, indicating broad generalization weakness rather than localized drift.
- diagnosed cases: 39/60

## class-by-class summary

| distribution class | severity | pass/fail concentration | main failure cluster | likely subsystem owner | fix priority |
|---|---|---|---|---|---|
| weak_student_low_skill | systemic | concentrated | weak_note_under_recovery | candidate_generation | P5 |
| parent_overwritten_adult_shaped | systemic | concentrated | parent_overwrite_misread | trust_calibration | P2 |
| over_polished_hollow | systemic | concentrated | polished_emptiness_overvaluation | scorer | P2 |
| contradictory_multi_center | isolated | scattered | contradiction_overcommitment | routing_calibration | P4 |
| culturally_indirect_non_default | concentrated | scattered | generic_fallback_under_shift | candidate_generation | P6 |
| achievement_stacked_emotionally_thin | systemic | concentrated | unclear_or_mixed | unclear | P6 |
| messy_real_style_note_dump | systemic | concentrated | unclear_or_mixed | unclear | P6 |

## failure clusters by count

- unclear_or_mixed: 14
- weak_note_under_recovery: 8
- generic_fallback_under_shift: 7
- parent_overwrite_misread: 5
- polished_emptiness_overvaluation: 3
- contradiction_overcommitment: 1
- high_confidence_misread: 1

## subsystem ownership summary

- candidate_generation: 15
- unclear: 14
- trust_calibration: 5
- scorer: 3
- routing_calibration: 2

## high-trust-risk cases

- DSE_02 (weak_student_low_skill): undefined -> undefined
- DSE_03 (weak_student_low_skill): undefined -> undefined
- DSE_05 (weak_student_low_skill): undefined -> undefined
- DSE_12 (parent_overwritten_adult_shaped): undefined -> undefined
- DSE_15 (parent_overwritten_adult_shaped): undefined -> undefined
- DSE_16 (parent_overwritten_adult_shaped): undefined -> undefined
- DSE_17 (parent_overwritten_adult_shaped): undefined -> undefined
- DSE_18 (parent_overwritten_adult_shaped): undefined -> undefined
- DSE_22 (over_polished_hollow): undefined -> undefined
- DSE_32 (contradictory_multi_center): undefined -> undefined
- DSE_40 (culturally_indirect_non_default): undefined -> undefined

## top 10 generalization trust breaks

1. DSE_02 (weak_student_low_skill): weak_note_under_recovery -> feels_flattened
2. DSE_03 (weak_student_low_skill): weak_note_under_recovery -> feels_flattened
3. DSE_05 (weak_student_low_skill): weak_note_under_recovery -> feels_flattened
4. DSE_12 (parent_overwritten_adult_shaped): parent_overwrite_misread -> mixed
5. DSE_15 (parent_overwritten_adult_shaped): parent_overwrite_misread -> mixed
6. DSE_16 (parent_overwritten_adult_shaped): parent_overwrite_misread -> mixed
7. DSE_17 (parent_overwritten_adult_shaped): parent_overwrite_misread -> mixed
8. DSE_18 (parent_overwritten_adult_shaped): parent_overwrite_misread -> mixed
9. DSE_22 (over_polished_hollow): unclear_or_mixed -> feels_flattened
10. DSE_32 (contradictory_multi_center): contradiction_overcommitment -> feels_flattened

## recommended patch sequence

1. Priority 1: high-confidence misreads.
2. Priority 2: polished-emptiness and parent-overwrite overvaluation.
3. Priority 3: cultural-style misreads.
4. Priority 4: contradiction overcommitment under shift.
5. Priority 5: weak-note under-recovery.
6. Priority 6: generic fallback drift under shifted inputs.

## product readiness implications

Do not move toward launch readiness. Concentrated or systemic trust-risk failures require patch sprint closure first.
