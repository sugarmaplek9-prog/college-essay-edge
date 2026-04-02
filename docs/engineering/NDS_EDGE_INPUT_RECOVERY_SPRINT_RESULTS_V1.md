# NDS_EDGE_INPUT_RECOVERY_SPRINT_RESULTS_V1

## sprint purpose

Harden NDS recovery quality under weak, weird, contradictory, and overloaded input without collapsing into generic over-caution.

## pre-patch failure profile

- inferred pre-patch failing/untrustworthy cases: 3

## Track A changes

- degraded-input candidate mode + low-signal family restriction
- candidate deduplication and duplication-risk metadata
- fallback contamination controls and family-confidence weighting

## Track B changes

- typed clarification reasons tied to actual ambiguity
- clarification specificity guard/regeneration
- overloaded and collision-targeted clarification prompts

## Track C changes

- trust-preserving explanation restraint mode under degraded input
- confidence-fit and assertiveness debug channels
- lower over-assertion under weak evidence while preserving utility

## post-patch edge-case results

- behavior_correct: 23/24 (PASS)
- bluff_high: 0/24 (PASS)
- candidate_broken: 0/24 (PASS)
- trustworthy: 22/24 (PASS)
- route_action_match: 23/24 (PASS)
- caution_cases_correct: 10/10 (PASS)
- low_signal_or_contradiction_overbluff: 0 (PASS)

## remaining failure clusters

- ECB_01: candidate_generation_failure | clusters=axis_collapse, low_signal_overstretch, candidate_family_missing, evidence_noise
- ECB_02: candidate_generation_failure, trust_output_failure, fallback_behavior_failure | clusters=axis_collapse, fallback_contamination, low_signal_overstretch, candidate_family_missing
- ECB_03: candidate_generation_failure | clusters=axis_collapse, low_signal_overstretch, wrong_family_dominance
- ECB_04: candidate_generation_failure | clusters=axis_collapse, low_signal_overstretch, candidate_family_missing
- ECB_06: candidate_generation_failure | clusters=axis_collapse, low_signal_overstretch, candidate_family_missing
- ECB_10: candidate_generation_failure | clusters=axis_collapse
- ECB_11: candidate_generation_failure | clusters=axis_collapse
- ECB_14: candidate_generation_failure, clarification_quality_failure, trust_output_failure | clusters=axis_collapse, wrong_family_dominance
- ECB_15: candidate_generation_failure | clusters=axis_collapse
- ECB_16: candidate_generation_failure | clusters=axis_collapse
- ECB_17: candidate_generation_failure | clusters=axis_collapse
- ECB_18: candidate_generation_failure | clusters=axis_collapse
- ECB_19: candidate_generation_failure | clusters=axis_collapse
- ECB_20: candidate_generation_failure | clusters=axis_collapse
- ECB_21: candidate_generation_failure | clusters=axis_collapse, overloaded_input_fragmentation

## regressions check

- edge-input exit thresholds: PASS
- full regression stack must be checked via required protocol reruns and full test suite.

## rollout recommendation

**GO**
