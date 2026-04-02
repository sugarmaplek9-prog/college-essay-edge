# NDS_EDGE_STABILITY_RECONCILIATION_SPRINT_RESULTS_V1

## sprint purpose

Reconcile edge-input recovery gains with paraphrase stability so both protocol families remain rollout-safe.

## pre-reconciliation failure profile

- edge behavior_correct: 23/24
- edge candidate_broken: 0/24
- stability winner_stable: 6/12
- stability route_stable: 3/12
- stability diagnostic unstable_base_cases: 11

## regression attribution summary

- DST_02: primary=degraded_mode_overtrigger, secondary=candidate_recovery_overtrigger, edge_flag=yes, should_stay_standard=yes
- DST_03: primary=degraded_mode_overtrigger, secondary=clarification_guard_overtrigger, edge_flag=yes, should_stay_standard=yes
- DST_07: primary=degraded_mode_overtrigger, secondary=clarification_guard_overtrigger, edge_flag=yes, should_stay_standard=yes
- DST_11: primary=degraded_mode_overtrigger, secondary=clarification_guard_overtrigger, edge_flag=yes, should_stay_standard=no

## Track B scoping changes

- Edge mode activation tightened to stronger degraded-input signals only.
- Trust/explanation restraint constrained to weak or polished-empty inputs.
- Standard-mode protection applied to avoid edge-flag overtrigger on coherent paraphrases.
- Fallback and candidate-recovery penalties scoped to real contamination signals.

## edge-case metrics before/after

- behavior_correct: 23 -> 22
- bluff_high: 0 -> 0
- candidate_broken: 0 -> 0
- trustworthy: 22 -> 21
- route_action_match: 23 -> 22
- caution_cases_correct: 10 -> 10
- low_signal_or_contradiction_overbluff: 0 -> 0

## stability metrics before/after

- winner_stable: 6 -> 10
- winner_unstable: 5 -> 2
- route_stable: 3 -> 10
- confidence_unreliable: 9 -> 2
- explanation_bad: 6 -> 0
- strict_fail_count: 8 -> 1
- ambiguity_arbitrary_flip_count: 3 -> 0

## remaining unstable cases

- DST_02
- DST_03
- DST_07
- DST_11

## remaining weak edge cases

- ECB_01
- ECB_02
- ECB_03
- ECB_04
- ECB_06
- ECB_10
- ECB_11
- ECB_14
- ECB_15
- ECB_16
- ECB_17
- ECB_18
- ECB_19
- ECB_20
- ECB_21
- ECB_22

## final rollout recommendation

**GO**
