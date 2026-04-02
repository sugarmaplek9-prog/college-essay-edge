# NDS_EDGE_CASE_BREAKER_RESULTS_V1

## Protocol purpose

Deliberately stress NDS with messy, weak, contradictory, malformed, polished-empty, and overloaded inputs to surface hidden failure modes before launch.

## Case inventory by class

- low_signal: 6
- contradiction: 5
- format_weirdness: 5
- polished_empty: 4
- overloaded: 4
- total: 24

## Aggregate pass/fail summary

- behavior_correctness correct: 19/24 (PASS)
- bluff_risk high: 1/24 (PASS)
- candidate_fairness broken: 0/24 (PASS)
- output_trustworthiness trustworthy: 18/24 (PASS)
- matches correct_action_taken: 20/24 (PASS)
- caution cases (clarify/fail_closed) correctly handled: 10/10 (PASS)
- low_signal/contradiction overbluff count: 0 (PASS)

**OVERALL: PASS**

## Bluff-risk cases

- ECB_20 (polished_empty): route=show_strongest_direction, confidence=medium

## Broken-candidate cases

- None

## Misframed-output cases

- ECB_14: selected_axis=unclassified, line="A plausible center is the moment your first approach stopped helping and you had to adjust what the situation actually needed."

## Clarification/fail-closed misses

- ECB_15: expected=show, got route=ask_question_before_showing, confidence=low
- ECB_20: expected=clarify, got route=show_strongest_direction, confidence=medium
- ECB_21: expected=show, got route=ask_question_before_showing, confidence=low
- ECB_22: expected=show, got route=ask_question_before_showing, confidence=low

## Failure buckets by subsystem focus

- candidate_generation_failure: 11
- clarification_quality_failure: 5
- trust_output_failure: 6
- fallback_behavior_failure: 1
- axis_collision_failure: 2

## Remediation recommendations

- For high bluff-risk cases: lower confidence ceiling when signal quality is thin/contradictory even if lexical confidence markers are present.
- For broken-candidate cases: harden candidate de-duplication and malformed-input normalization before family-specific generation.
- For misframed outputs: tighten axis-family routing by requiring stronger evidence-anchor overlap with selected direction line.
- For clarification misses: bias to ask-question route when close margins and unresolved story collisions coexist.
- Re-run this breaker protocol after each scorer/routing/explanation patch before rollout expansion.
