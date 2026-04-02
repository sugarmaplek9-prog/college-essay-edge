# NDS_DIRECTION_STABILITY_TEST_RESULTS_V1

## Protocol purpose

Verify that NDS winner, route, confidence, and explanation stay meaning-stable under wording-only rewrites (action-heavy, reflection-heavy, and plain-language variants).

## Base case inventory

- realization_dominant: 4
- action_dominant: 4
- ambiguity_prone: 4
- total base cases: 12
- total executions: 48

## Version design rules

- Version A: balanced original wording
- Version B: action-heavy wording (same meaning)
- Version C: reflection-heavy wording (same meaning)
- Version D: plain/less-polished wording (same meaning)
- Rewrites preserve core event, tension, decision, realization, outcome, and story axis.

## Aggregate pass/fail summary

- winner_stability stable: 12/12 (PASS)
- winner_stability unstable: 0/12 (PASS)
- route_stability stable: 10/12 (PASS)
- confidence_stability unreliable: 1/12 (PASS)
- explanation_drift bad: 0/12 (PASS)
- strict-case failures: 0 (PASS)
- ambiguity arbitrary flips: 0 (PASS)

**OVERALL: PASS**

## Unstable winner cases

- None

## Unstable route cases

- DST_03: Fixer identity release toward question-asking
- DST_07: Food pantry cadence redesign

## Confidence drift cases

- DST_01: drifted (spread=2)
- DST_02: drifted (spread=1)
- DST_03: unreliable (spread=2)
- DST_04: drifted (spread=1)
- DST_07: drifted (spread=1)
- DST_08: drifted (spread=2)
- DST_09: drifted (spread=1)
- DST_11: unreliable (spread=2)

## Explanation drift cases

- None

## Case comparison packets

### BASE_CASE_ID: DST_01
EXPECTED_OUTCOME: direction_1
STABILITY_TOLERANCE: strict

VERSION_A:
- winner: direction_1
- route: show_strongest_direction
- confidence: high
- top_score: 0.940
- runner_up: 0.000
- margin: 0.940
- selected_axis_family: relationship_or_listening
- degraded_input_mode: true
- trust_mode: standard
- explanation_restraint_mode: false
- fallback_contaminated: false
- candidate_support_density: strong
- family_confidence: partial
- clarification_reason: n/a
- clarification_specificity: weak

VERSION_B:
- winner: direction_1
- route: show_strongest_direction
- confidence: high
- top_score: 0.820
- runner_up: 0.000
- margin: 0.820
- selected_axis_family: unclassified
- degraded_input_mode: true
- trust_mode: standard
- explanation_restraint_mode: false
- fallback_contaminated: false
- candidate_support_density: strong
- family_confidence: partial
- clarification_reason: n/a
- clarification_specificity: weak

VERSION_C:
- winner: direction_1
- route: show_strongest_direction
- confidence: high
- top_score: 0.930
- runner_up: 0.000
- margin: 0.930
- selected_axis_family: relationship_or_listening
- degraded_input_mode: false
- trust_mode: standard
- explanation_restraint_mode: false
- fallback_contaminated: false
- candidate_support_density: medium
- family_confidence: partial
- clarification_reason: n/a
- clarification_specificity: weak

VERSION_D:
- winner: direction_1
- route: ask_question_before_showing
- confidence: low
- top_score: 0.810
- runner_up: 0.780
- margin: 0.030
- selected_axis_family: unclassified
- degraded_input_mode: false
- trust_mode: standard
- explanation_restraint_mode: false
- fallback_contaminated: false
- candidate_support_density: strong
- family_confidence: partial
- clarification_reason: resolve_candidate_tie
- clarification_specificity: strong

STABILITY_AUDIT:
- winner_stability: minor_drift
- route_stability: minor_drift
- confidence_stability: drifted
- explanation_drift: acceptable
- reviewer_verdict: watch
- reviewer_notes: Expected outcome: direction_1; observed outcomes: direction_1, clarification. Winner stability: minor_drift. Route stability: minor_drift. Confidence: drifted. Explanation drift: acceptable. Outcome variation appears attributable to wording surface changes rather than semantic rewrite differences.

### BASE_CASE_ID: DST_02
EXPECTED_OUTCOME: direction_1
STABILITY_TOLERANCE: strict

VERSION_A:
- winner: direction_1
- route: ask_question_before_showing
- confidence: low
- top_score: 0.930
- runner_up: 0.920
- margin: 0.010
- selected_axis_family: unclassified
- degraded_input_mode: true
- trust_mode: standard
- explanation_restraint_mode: false
- fallback_contaminated: false
- candidate_support_density: strong
- family_confidence: partial
- clarification_reason: resolve_candidate_tie
- clarification_specificity: strong

VERSION_B:
- winner: direction_2
- route: ask_question_before_showing
- confidence: low
- top_score: 0.910
- runner_up: 0.900
- margin: 0.010
- selected_axis_family: responsibility
- degraded_input_mode: true
- trust_mode: standard
- explanation_restraint_mode: false
- fallback_contaminated: false
- candidate_support_density: strong
- family_confidence: weak
- clarification_reason: resolve_candidate_tie
- clarification_specificity: medium

VERSION_C:
- winner: direction_2
- route: ask_question_before_showing
- confidence: low
- top_score: 0.930
- runner_up: 0.930
- margin: 0.000
- selected_axis_family: relationship_or_listening
- degraded_input_mode: false
- trust_mode: standard
- explanation_restraint_mode: false
- fallback_contaminated: false
- candidate_support_density: strong
- family_confidence: strong
- clarification_reason: resolve_candidate_tie
- clarification_specificity: strong

VERSION_D:
- winner: direction_2
- route: show_strongest_direction
- confidence: medium
- top_score: 0.880
- runner_up: 0.780
- margin: 0.100
- selected_axis_family: responsibility
- degraded_input_mode: false
- trust_mode: standard
- explanation_restraint_mode: false
- fallback_contaminated: false
- candidate_support_density: strong
- family_confidence: weak
- clarification_reason: n/a
- clarification_specificity: weak

STABILITY_AUDIT:
- winner_stability: stable
- route_stability: minor_drift
- confidence_stability: drifted
- explanation_drift: acceptable
- reviewer_verdict: watch
- reviewer_notes: Expected outcome: direction_1; observed outcomes: clarification, direction_2. Winner stability: stable. Route stability: minor_drift. Confidence: drifted. Explanation drift: acceptable. Outcome variation appears attributable to wording surface changes rather than semantic rewrite differences.

### BASE_CASE_ID: DST_03
EXPECTED_OUTCOME: direction_1
STABILITY_TOLERANCE: strict

VERSION_A:
- winner: direction_3
- route: ask_question_before_showing
- confidence: low
- top_score: 0.950
- runner_up: 0.920
- margin: 0.030
- selected_axis_family: identity_transformation
- degraded_input_mode: true
- trust_mode: standard
- explanation_restraint_mode: false
- fallback_contaminated: false
- candidate_support_density: strong
- family_confidence: partial
- clarification_reason: resolve_candidate_tie
- clarification_specificity: medium

VERSION_B:
- winner: direction_1
- route: show_strongest_direction
- confidence: high
- top_score: 0.940
- runner_up: 0.000
- margin: 0.940
- selected_axis_family: unclassified
- degraded_input_mode: true
- trust_mode: standard
- explanation_restraint_mode: false
- fallback_contaminated: false
- candidate_support_density: strong
- family_confidence: partial
- clarification_reason: n/a
- clarification_specificity: weak

VERSION_C:
- winner: direction_1
- route: ask_question_before_showing
- confidence: low
- top_score: 0.900
- runner_up: 0.000
- margin: 0.090
- selected_axis_family: unclassified
- degraded_input_mode: true
- trust_mode: degraded_input
- explanation_restraint_mode: true
- fallback_contaminated: false
- candidate_support_density: medium
- family_confidence: partial
- clarification_reason: clarify_shift
- clarification_specificity: strong

VERSION_D:
- winner: direction_1
- route: show_strongest_direction
- confidence: high
- top_score: 0.890
- runner_up: 0.000
- margin: 0.890
- selected_axis_family: relationship_or_listening
- degraded_input_mode: false
- trust_mode: standard
- explanation_restraint_mode: false
- fallback_contaminated: false
- candidate_support_density: strong
- family_confidence: partial
- clarification_reason: n/a
- clarification_specificity: weak

STABILITY_AUDIT:
- winner_stability: minor_drift
- route_stability: unstable
- confidence_stability: unreliable
- explanation_drift: concerning
- reviewer_verdict: fail
- reviewer_notes: Expected outcome: direction_1; observed outcomes: clarification, direction_1. Winner stability: minor_drift. Route stability: unstable. Confidence: unreliable. Explanation drift: concerning. Outcome variation appears attributable to wording surface changes rather than semantic rewrite differences.

### BASE_CASE_ID: DST_04
EXPECTED_OUTCOME: direction_1
STABILITY_TOLERANCE: strict

VERSION_A:
- winner: direction_1
- route: show_strongest_direction
- confidence: medium
- top_score: 0.930
- runner_up: 0.000
- margin: 0.090
- selected_axis_family: relationship_or_listening
- degraded_input_mode: true
- trust_mode: degraded_input
- explanation_restraint_mode: true
- fallback_contaminated: false
- candidate_support_density: strong
- family_confidence: partial
- clarification_reason: clarify_shift
- clarification_specificity: medium

VERSION_B:
- winner: direction_2
- route: ask_question_before_showing
- confidence: low
- top_score: 0.860
- runner_up: 0.830
- margin: 0.030
- selected_axis_family: delegation
- degraded_input_mode: true
- trust_mode: standard
- explanation_restraint_mode: false
- fallback_contaminated: false
- candidate_support_density: strong
- family_confidence: strong
- clarification_reason: resolve_candidate_tie
- clarification_specificity: strong

VERSION_C:
- winner: direction_2
- route: ask_question_before_showing
- confidence: low
- top_score: 0.920
- runner_up: 0.910
- margin: 0.010
- selected_axis_family: relationship_or_listening
- degraded_input_mode: false
- trust_mode: standard
- explanation_restraint_mode: false
- fallback_contaminated: false
- candidate_support_density: strong
- family_confidence: strong
- clarification_reason: resolve_candidate_tie
- clarification_specificity: strong

VERSION_D:
- winner: direction_1
- route: show_strongest_direction
- confidence: medium
- top_score: 0.740
- runner_up: 0.000
- margin: 0.740
- selected_axis_family: relationship_or_listening
- degraded_input_mode: false
- trust_mode: standard
- explanation_restraint_mode: false
- fallback_contaminated: false
- candidate_support_density: strong
- family_confidence: partial
- clarification_reason: n/a
- clarification_specificity: weak

STABILITY_AUDIT:
- winner_stability: stable
- route_stability: minor_drift
- confidence_stability: drifted
- explanation_drift: concerning
- reviewer_verdict: watch
- reviewer_notes: Expected outcome: direction_1; observed outcomes: direction_1, clarification. Winner stability: stable. Route stability: minor_drift. Confidence: drifted. Explanation drift: concerning. Outcome variation appears attributable to wording surface changes rather than semantic rewrite differences.

### BASE_CASE_ID: DST_05
EXPECTED_OUTCOME: direction_1
STABILITY_TOLERANCE: strict

VERSION_A:
- winner: direction_2
- route: ask_question_before_showing
- confidence: low
- top_score: 0.940
- runner_up: 0.910
- margin: 0.030
- selected_axis_family: system_redesign
- degraded_input_mode: false
- trust_mode: standard
- explanation_restraint_mode: false
- fallback_contaminated: false
- candidate_support_density: strong
- family_confidence: strong
- clarification_reason: resolve_candidate_tie
- clarification_specificity: medium

VERSION_B:
- winner: direction_2
- route: ask_question_before_showing
- confidence: low
- top_score: 0.930
- runner_up: 0.910
- margin: 0.020
- selected_axis_family: system_redesign
- degraded_input_mode: false
- trust_mode: standard
- explanation_restraint_mode: false
- fallback_contaminated: false
- candidate_support_density: strong
- family_confidence: strong
- clarification_reason: resolve_candidate_tie
- clarification_specificity: medium

VERSION_C:
- winner: direction_2
- route: ask_question_before_showing
- confidence: low
- top_score: 0.920
- runner_up: 0.900
- margin: 0.020
- selected_axis_family: system_redesign
- degraded_input_mode: false
- trust_mode: standard
- explanation_restraint_mode: false
- fallback_contaminated: false
- candidate_support_density: strong
- family_confidence: strong
- clarification_reason: resolve_candidate_tie
- clarification_specificity: medium

VERSION_D:
- winner: direction_3
- route: ask_question_before_showing
- confidence: low
- top_score: 0.810
- runner_up: 0.780
- margin: 0.030
- selected_axis_family: system_redesign
- degraded_input_mode: false
- trust_mode: standard
- explanation_restraint_mode: false
- fallback_contaminated: false
- candidate_support_density: strong
- family_confidence: strong
- clarification_reason: resolve_candidate_tie
- clarification_specificity: medium

STABILITY_AUDIT:
- winner_stability: stable
- route_stability: stable
- confidence_stability: stable
- explanation_drift: acceptable
- reviewer_verdict: pass
- reviewer_notes: Expected outcome: direction_1; observed outcomes: clarification. Winner stability: stable. Route stability: stable. Confidence: stable. Explanation drift: acceptable. Outcome variation appears attributable to wording surface changes rather than semantic rewrite differences.

### BASE_CASE_ID: DST_06
EXPECTED_OUTCOME: direction_1
STABILITY_TOLERANCE: strict

VERSION_A:
- winner: direction_2
- route: ask_question_before_showing
- confidence: low
- top_score: 0.920
- runner_up: 0.900
- margin: 0.020
- selected_axis_family: delegation
- degraded_input_mode: false
- trust_mode: standard
- explanation_restraint_mode: false
- fallback_contaminated: false
- candidate_support_density: strong
- family_confidence: strong
- clarification_reason: resolve_candidate_tie
- clarification_specificity: medium

VERSION_B:
- winner: direction_2
- route: ask_question_before_showing
- confidence: low
- top_score: 0.960
- runner_up: 0.940
- margin: 0.020
- selected_axis_family: delegation
- degraded_input_mode: false
- trust_mode: standard
- explanation_restraint_mode: false
- fallback_contaminated: false
- candidate_support_density: medium
- family_confidence: strong
- clarification_reason: resolve_candidate_tie
- clarification_specificity: strong

VERSION_C:
- winner: direction_1
- route: ask_question_before_showing
- confidence: low
- top_score: 0.890
- runner_up: 0.000
- margin: 0.090
- selected_axis_family: unclassified
- degraded_input_mode: true
- trust_mode: degraded_input
- explanation_restraint_mode: true
- fallback_contaminated: false
- candidate_support_density: medium
- family_confidence: partial
- clarification_reason: clarify_shift
- clarification_specificity: strong

VERSION_D:
- winner: direction_1
- route: ask_question_before_showing
- confidence: low
- top_score: 0.780
- runner_up: 0.000
- margin: 0.090
- selected_axis_family: unclassified
- degraded_input_mode: true
- trust_mode: degraded_input
- explanation_restraint_mode: true
- fallback_contaminated: false
- candidate_support_density: medium
- family_confidence: partial
- clarification_reason: clarify_shift
- clarification_specificity: strong

STABILITY_AUDIT:
- winner_stability: stable
- route_stability: stable
- confidence_stability: stable
- explanation_drift: concerning
- reviewer_verdict: watch
- reviewer_notes: Expected outcome: direction_1; observed outcomes: clarification. Winner stability: stable. Route stability: stable. Confidence: stable. Explanation drift: concerning. Outcome variation appears attributable to wording surface changes rather than semantic rewrite differences.

### BASE_CASE_ID: DST_07
EXPECTED_OUTCOME: direction_1
STABILITY_TOLERANCE: strict

VERSION_A:
- winner: direction_1
- route: ask_question_before_showing
- confidence: low
- top_score: 0.820
- runner_up: 0.770
- margin: 0.050
- selected_axis_family: unclassified
- degraded_input_mode: true
- trust_mode: degraded_input
- explanation_restraint_mode: true
- fallback_contaminated: false
- candidate_support_density: medium
- family_confidence: partial
- clarification_reason: resolve_candidate_tie
- clarification_specificity: strong

VERSION_B:
- winner: direction_2
- route: ask_question_before_showing
- confidence: low
- top_score: 0.940
- runner_up: 0.920
- margin: 0.020
- selected_axis_family: system_redesign
- degraded_input_mode: false
- trust_mode: standard
- explanation_restraint_mode: false
- fallback_contaminated: false
- candidate_support_density: strong
- family_confidence: strong
- clarification_reason: resolve_candidate_tie
- clarification_specificity: strong

VERSION_C:
- winner: direction_2
- route: ask_question_before_showing
- confidence: low
- top_score: 0.910
- runner_up: 0.890
- margin: 0.020
- selected_axis_family: pattern_breaking
- degraded_input_mode: false
- trust_mode: standard
- explanation_restraint_mode: false
- fallback_contaminated: false
- candidate_support_density: strong
- family_confidence: strong
- clarification_reason: resolve_candidate_tie
- clarification_specificity: medium

VERSION_D:
- winner: direction_1
- route: show_strongest_direction
- confidence: medium
- top_score: 0.770
- runner_up: 0.000
- margin: 0.770
- selected_axis_family: unclassified
- degraded_input_mode: false
- trust_mode: standard
- explanation_restraint_mode: false
- fallback_contaminated: false
- candidate_support_density: strong
- family_confidence: partial
- clarification_reason: n/a
- clarification_specificity: weak

STABILITY_AUDIT:
- winner_stability: stable
- route_stability: unstable
- confidence_stability: drifted
- explanation_drift: concerning
- reviewer_verdict: fail
- reviewer_notes: Expected outcome: direction_1; observed outcomes: clarification, direction_1. Winner stability: stable. Route stability: unstable. Confidence: drifted. Explanation drift: concerning. Outcome variation appears attributable to wording surface changes rather than semantic rewrite differences.

### BASE_CASE_ID: DST_08
EXPECTED_OUTCOME: direction_1
STABILITY_TOLERANCE: strict

VERSION_A:
- winner: direction_2
- route: ask_question_before_showing
- confidence: low
- top_score: 0.910
- runner_up: 0.890
- margin: 0.020
- selected_axis_family: delegation
- degraded_input_mode: false
- trust_mode: standard
- explanation_restraint_mode: false
- fallback_contaminated: false
- candidate_support_density: strong
- family_confidence: strong
- clarification_reason: resolve_candidate_tie
- clarification_specificity: medium

VERSION_B:
- winner: direction_2
- route: ask_question_before_showing
- confidence: low
- top_score: 0.930
- runner_up: 0.910
- margin: 0.020
- selected_axis_family: delegation
- degraded_input_mode: false
- trust_mode: standard
- explanation_restraint_mode: false
- fallback_contaminated: false
- candidate_support_density: strong
- family_confidence: strong
- clarification_reason: resolve_candidate_tie
- clarification_specificity: medium

VERSION_C:
- winner: direction_2
- route: ask_question_before_showing
- confidence: low
- top_score: 0.920
- runner_up: 0.900
- margin: 0.020
- selected_axis_family: delegation
- degraded_input_mode: false
- trust_mode: standard
- explanation_restraint_mode: false
- fallback_contaminated: false
- candidate_support_density: medium
- family_confidence: strong
- clarification_reason: resolve_candidate_tie
- clarification_specificity: medium

VERSION_D:
- winner: direction_1
- route: show_strongest_direction
- confidence: high
- top_score: 0.810
- runner_up: 0.000
- margin: 0.810
- selected_axis_family: unclassified
- degraded_input_mode: false
- trust_mode: standard
- explanation_restraint_mode: false
- fallback_contaminated: false
- candidate_support_density: strong
- family_confidence: partial
- clarification_reason: n/a
- clarification_specificity: weak

STABILITY_AUDIT:
- winner_stability: stable
- route_stability: minor_drift
- confidence_stability: drifted
- explanation_drift: concerning
- reviewer_verdict: watch
- reviewer_notes: Expected outcome: direction_1; observed outcomes: clarification, direction_1. Winner stability: stable. Route stability: minor_drift. Confidence: drifted. Explanation drift: concerning. Outcome variation appears attributable to wording surface changes rather than semantic rewrite differences.

### BASE_CASE_ID: DST_09
EXPECTED_OUTCOME: clarification
STABILITY_TOLERANCE: moderate

VERSION_A:
- winner: direction_2
- route: ask_question_before_showing
- confidence: low
- top_score: 0.830
- runner_up: 0.800
- margin: 0.030
- selected_axis_family: relationship_or_listening
- degraded_input_mode: false
- trust_mode: standard
- explanation_restraint_mode: false
- fallback_contaminated: false
- candidate_support_density: strong
- family_confidence: strong
- clarification_reason: resolve_candidate_tie
- clarification_specificity: strong

VERSION_B:
- winner: direction_2
- route: ask_question_before_showing
- confidence: low
- top_score: 0.860
- runner_up: 0.830
- margin: 0.030
- selected_axis_family: system_redesign
- degraded_input_mode: true
- trust_mode: standard
- explanation_restraint_mode: false
- fallback_contaminated: false
- candidate_support_density: strong
- family_confidence: strong
- clarification_reason: resolve_candidate_tie
- clarification_specificity: strong

VERSION_C:
- winner: direction_2
- route: ask_question_before_showing
- confidence: low
- top_score: 0.930
- runner_up: 0.900
- margin: 0.030
- selected_axis_family: relationship_or_listening
- degraded_input_mode: false
- trust_mode: standard
- explanation_restraint_mode: false
- fallback_contaminated: false
- candidate_support_density: strong
- family_confidence: strong
- clarification_reason: resolve_candidate_tie
- clarification_specificity: strong

VERSION_D:
- winner: direction_2
- route: show_strongest_direction
- confidence: medium
- top_score: 0.750
- runner_up: 0.700
- margin: 0.050
- selected_axis_family: relationship_or_listening
- degraded_input_mode: false
- trust_mode: standard
- explanation_restraint_mode: false
- fallback_contaminated: false
- candidate_support_density: medium
- family_confidence: strong
- clarification_reason: resolve_candidate_tie
- clarification_specificity: strong

STABILITY_AUDIT:
- winner_stability: stable
- route_stability: minor_drift
- confidence_stability: drifted
- explanation_drift: concerning
- reviewer_verdict: watch
- reviewer_notes: Expected outcome: clarification; observed outcomes: clarification, direction_2. Winner stability: stable. Route stability: minor_drift. Confidence: drifted. Explanation drift: concerning. Outcome variation appears attributable to wording surface changes rather than semantic rewrite differences.

### BASE_CASE_ID: DST_10
EXPECTED_OUTCOME: clarification
STABILITY_TOLERANCE: moderate

VERSION_A:
- winner: direction_1
- route: ask_question_before_showing
- confidence: low
- top_score: 0.850
- runner_up: 0.850
- margin: 0.000
- selected_axis_family: unclassified
- degraded_input_mode: true
- trust_mode: standard
- explanation_restraint_mode: false
- fallback_contaminated: false
- candidate_support_density: strong
- family_confidence: partial
- clarification_reason: resolve_candidate_tie
- clarification_specificity: strong

VERSION_B:
- winner: direction_3
- route: ask_question_before_showing
- confidence: low
- top_score: 0.930
- runner_up: 0.920
- margin: 0.010
- selected_axis_family: system_redesign
- degraded_input_mode: false
- trust_mode: standard
- explanation_restraint_mode: false
- fallback_contaminated: false
- candidate_support_density: strong
- family_confidence: weak
- clarification_reason: resolve_candidate_tie
- clarification_specificity: medium

VERSION_C:
- winner: direction_3
- route: ask_question_before_showing
- confidence: low
- top_score: 0.930
- runner_up: 0.910
- margin: 0.020
- selected_axis_family: system_redesign
- degraded_input_mode: false
- trust_mode: standard
- explanation_restraint_mode: false
- fallback_contaminated: false
- candidate_support_density: strong
- family_confidence: strong
- clarification_reason: resolve_candidate_tie
- clarification_specificity: strong

VERSION_D:
- winner: direction_1
- route: ask_question_before_showing
- confidence: low
- top_score: 0.880
- runner_up: 0.790
- margin: 0.090
- selected_axis_family: unclassified
- degraded_input_mode: false
- trust_mode: standard
- explanation_restraint_mode: false
- fallback_contaminated: false
- candidate_support_density: strong
- family_confidence: partial
- clarification_reason: clarify_shift
- clarification_specificity: strong

STABILITY_AUDIT:
- winner_stability: stable
- route_stability: stable
- confidence_stability: stable
- explanation_drift: acceptable
- reviewer_verdict: pass
- reviewer_notes: Expected outcome: clarification; observed outcomes: clarification. Winner stability: stable. Route stability: stable. Confidence: stable. Explanation drift: acceptable. Outcome variation appears attributable to wording surface changes rather than semantic rewrite differences.

### BASE_CASE_ID: DST_11
EXPECTED_OUTCOME: clarification
STABILITY_TOLERANCE: moderate

VERSION_A:
- winner: direction_1
- route: show_strongest_direction
- confidence: high
- top_score: 0.840
- runner_up: 0.000
- margin: 0.840
- selected_axis_family: relationship_or_listening
- degraded_input_mode: true
- trust_mode: standard
- explanation_restraint_mode: false
- fallback_contaminated: false
- candidate_support_density: strong
- family_confidence: partial
- clarification_reason: n/a
- clarification_specificity: weak

VERSION_B:
- winner: direction_2
- route: ask_question_before_showing
- confidence: low
- top_score: 0.960
- runner_up: 0.930
- margin: 0.030
- selected_axis_family: delegation
- degraded_input_mode: false
- trust_mode: standard
- explanation_restraint_mode: false
- fallback_contaminated: false
- candidate_support_density: strong
- family_confidence: strong
- clarification_reason: resolve_candidate_tie
- clarification_specificity: strong

VERSION_C:
- winner: direction_1
- route: ask_question_before_showing
- confidence: low
- top_score: 0.910
- runner_up: 0.880
- margin: 0.030
- selected_axis_family: unclassified
- degraded_input_mode: false
- trust_mode: standard
- explanation_restraint_mode: false
- fallback_contaminated: false
- candidate_support_density: medium
- family_confidence: partial
- clarification_reason: resolve_candidate_tie
- clarification_specificity: strong

VERSION_D:
- winner: direction_1
- route: show_strongest_direction
- confidence: medium
- top_score: 0.770
- runner_up: 0.000
- margin: 0.770
- selected_axis_family: relationship_or_listening
- degraded_input_mode: false
- trust_mode: standard
- explanation_restraint_mode: false
- fallback_contaminated: false
- candidate_support_density: strong
- family_confidence: weak
- clarification_reason: n/a
- clarification_specificity: weak

STABILITY_AUDIT:
- winner_stability: stable
- route_stability: minor_drift
- confidence_stability: unreliable
- explanation_drift: acceptable
- reviewer_verdict: fail
- reviewer_notes: Expected outcome: clarification; observed outcomes: direction_1, clarification. Winner stability: stable. Route stability: minor_drift. Confidence: unreliable. Explanation drift: acceptable. Outcome variation appears attributable to wording surface changes rather than semantic rewrite differences.

### BASE_CASE_ID: DST_12
EXPECTED_OUTCOME: clarification
STABILITY_TOLERANCE: moderate

VERSION_A:
- winner: direction_2
- route: ask_question_before_showing
- confidence: low
- top_score: 0.950
- runner_up: 0.930
- margin: 0.020
- selected_axis_family: relationship_or_listening
- degraded_input_mode: false
- trust_mode: standard
- explanation_restraint_mode: false
- fallback_contaminated: false
- candidate_support_density: strong
- family_confidence: strong
- clarification_reason: resolve_candidate_tie
- clarification_specificity: strong

VERSION_B:
- winner: direction_3
- route: ask_question_before_showing
- confidence: low
- top_score: 0.860
- runner_up: 0.830
- margin: 0.030
- selected_axis_family: relationship_or_listening
- degraded_input_mode: true
- trust_mode: standard
- explanation_restraint_mode: false
- fallback_contaminated: false
- candidate_support_density: medium
- family_confidence: strong
- clarification_reason: resolve_candidate_tie
- clarification_specificity: strong

VERSION_C:
- winner: direction_2
- route: ask_question_before_showing
- confidence: low
- top_score: 0.930
- runner_up: 0.910
- margin: 0.020
- selected_axis_family: relationship_or_listening
- degraded_input_mode: false
- trust_mode: standard
- explanation_restraint_mode: false
- fallback_contaminated: false
- candidate_support_density: strong
- family_confidence: strong
- clarification_reason: resolve_candidate_tie
- clarification_specificity: strong

VERSION_D:
- winner: direction_2
- route: ask_question_before_showing
- confidence: low
- top_score: 0.910
- runner_up: 0.890
- margin: 0.020
- selected_axis_family: relationship_or_listening
- degraded_input_mode: false
- trust_mode: standard
- explanation_restraint_mode: false
- fallback_contaminated: false
- candidate_support_density: strong
- family_confidence: strong
- clarification_reason: resolve_candidate_tie
- clarification_specificity: strong

STABILITY_AUDIT:
- winner_stability: stable
- route_stability: stable
- confidence_stability: stable
- explanation_drift: acceptable
- reviewer_verdict: pass
- reviewer_notes: Expected outcome: clarification; observed outcomes: clarification. Winner stability: stable. Route stability: stable. Confidence: stable. Explanation drift: acceptable. Outcome variation appears attributable to wording surface changes rather than semantic rewrite differences.

## Remediation recommendations

- If winner instability clusters in action-heavy versions, reduce action-verb inflation bias in scoring dimensions tied to buildability and specificity.
- If reflection-heavy versions steal wins, rebalance reflective markers against concrete axis signals and evidence overlap.
- If plain-language versions lose confidence disproportionately, reduce polish sensitivity by calibrating lexical richness weighting.
- If route drift appears in strict cases, tighten clarification thresholds to semantic uncertainty rather than prose quality.
- Re-run NDS_DIRECTION_LINE_FIT_AUDIT_V1 and NDS_META_LABEL_REJECTION_TEST_V1 after scorer reweighting changes.
