# FALSE_PREMIUM_AND_INDIRECT_SIGNAL_REPAIR_SPRINT_RESULTS_V1

## sprint purpose

Surgically reduce residual pattern failures focused on indirect-hinge underread, false-premium confidence, and careful-but-unhelpful outputs without regressing hardened core behaviors.

## pre-sprint residual pattern profile

- residual cases: 38
- profile: pattern_concentrated
- top patterns: indirect_hinge_underread, careful_but_unhelpful_output, false_premium_confidence
- high trust-risk residuals: 9
- dominant owner: candidate_generation

## Track A changes

- Added indirect hinge sentence extraction before candidate generation.
- Added hinge-supported promotion by boosting family/support quality for candidates lexically aligned with hinge sentences.
- Added hinge diagnostics fields to scoring debug.

## Track B changes

- Added false-premium candidate trait detection (premium tone without evidence support).
- Added penalties for false-premium candidates in candidate scoring.
- Tightened ask-route guard when top candidate is false-premium under weak support.

## Track C changes

- Added flat-line risk detection and forced ask-route for safe-but-flat candidate winners.
- Sharpened clarification questions to target unresolved hinge or center competition.
- Added useful-caution diagnostics fields to scoring debug.

## post-sprint residual pattern changes

- residual cases: 38 -> 39
- profile (post): pattern_concentrated
- top patterns (post): indirect_hinge_underread, false_premium_confidence, careful_but_unhelpful_output

| key pattern | pre | post | delta |
|---|---:|---:|---:|
| indirect_hinge_underread | 11 | 10 | -1 |
| false_premium_confidence | 7 | 8 | 1 |
| careful_but_unhelpful_output | 8 | 8 | 0 |

## high-trust-risk reduction summary

- high-trust-risk residuals: 9 -> 11
- delta: 2
- dominant owner (post): candidate_generation

## distribution-shift movement summary

- pass/fail: FAIL -> FAIL
- diagnosed cases: 38 -> 39

| metric | pre | post | delta | post status |
|---|---:|---:|---:|---|
| action_correctness_correct | 22/60 | 21/60 | -1 | FAIL |
| output_trustworthiness_trustworthy | 22/60 | 21/60 | -1 | FAIL |
| distribution_fit_strong_or_mixed | 56/60 | 54/60 | -2 | PASS |
| line_fit_strong_or_partial | 60/60 | 60/60 | 0 | PASS |
| grounding_sufficient_or_borderline | 60/60 | 60/60 | 0 | PASS |
| student_reaction_flattened_max_6 | 56/60 | 54/60 | -2 | PASS |
| caution_choose_clarification_or_blocked_12_of_15 | 14/18 | 12/18 | -2 | PASS |
| caution_overconfident_wrong_show_max_1 | 17/18 | 17/18 | 0 | PASS |
| parent_polished_avoid_false_overcommit_12_of_16 | 16/16 | 16/16 | 0 | PASS |
| parent_polished_high_conf_misleading_winner_max_2 | 16/16 | 16/16 | 0 | PASS |
| cultural_appropriate_or_partial_6_of_8 | 8/8 | 8/8 | 0 | PASS |
| cultural_misread_max_1 | 8/8 | 8/8 | 0 | PASS |

## regression check across hardened protocols

- test:nds:evidence-grounding: UNKNOWN
- test:nds:direction-line-fit: UNKNOWN
- test:nds:direction-stability: UNKNOWN
- test:product:screen-trust: UNKNOWN
- test:product:flow-break: PASS
- test:product:session-state: PASS
- test:product:real-user-sim: PASS
- npm test: PASS (terminal run confirmed)
- test:nds:edge-case-breaker: UNKNOWN

## remaining residual risks

- DSE_02: weak_note_latent_signal_miss (risk=high, owner=candidate_generation, reaction=feels_overpraised_but_not_helped)
- DSE_03: weak_note_latent_signal_miss (risk=high, owner=candidate_generation, reaction=feels_overpraised_but_not_helped)
- DSE_04: indirect_hinge_underread (risk=medium, owner=candidate_generation, reaction=mixed)
- DSE_05: weak_note_latent_signal_miss (risk=high, owner=candidate_generation, reaction=feels_overpraised_but_not_helped)
- DSE_06: weak_note_latent_signal_miss (risk=medium, owner=candidate_generation, reaction=mixed)
- DSE_07: weak_note_latent_signal_miss (risk=medium, owner=candidate_generation, reaction=mixed)
- DSE_09: indirect_hinge_underread (risk=medium, owner=candidate_generation, reaction=mixed)
- DSE_10: weak_note_latent_signal_miss (risk=medium, owner=candidate_generation, reaction=mixed)
- DSE_12: false_premium_confidence (risk=high, owner=trust_calibration, reaction=mixed)
- DSE_15: careful_but_unhelpful_output (risk=high, owner=explanation_layer, reaction=mixed)
- DSE_16: false_premium_confidence (risk=high, owner=trust_calibration, reaction=mixed)
- DSE_17: indirect_hinge_underread (risk=high, owner=candidate_generation, reaction=mixed)

## recommendation for next action

- Continue surgical candidate-generation repairs on indirect hinge + false-premium residuals before any launch-readiness movement.

## product readiness implication

Do not move toward launch readiness.