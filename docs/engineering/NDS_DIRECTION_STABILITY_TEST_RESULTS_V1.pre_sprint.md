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

- winner_stability stable: 1/12 (FAIL)
- winner_stability unstable: 8/12 (FAIL)
- route_stability stable: 1/12 (FAIL)
- confidence_stability unreliable: 5/12 (FAIL)
- explanation_drift bad: 9/12 (FAIL)
- strict-case failures: 8 (FAIL)
- ambiguity arbitrary flips: 4 (FAIL)

**OVERALL: FAIL**

## Unstable winner cases

- DST_01: Debate captain realizes listening matters more than being right
- DST_02: Interpreter realizes smoothing language erases parents voice
- DST_03: Fixer identity release toward question-asking
- DST_04: Clinic volunteer realizes task completion is not care
- DST_05: Restaurant ticket rail redesign
- DST_06: Code review bottleneck delegation
- DST_07: Food pantry cadence redesign
- DST_08: Robotics pit distributed ownership

## Unstable route cases

- DST_01: Debate captain realizes listening matters more than being right
- DST_02: Interpreter realizes smoothing language erases parents voice
- DST_03: Fixer identity release toward question-asking
- DST_04: Clinic volunteer realizes task completion is not care
- DST_05: Restaurant ticket rail redesign
- DST_06: Code review bottleneck delegation
- DST_08: Robotics pit distributed ownership

## Confidence drift cases

- DST_01: drifted (spread=1)
- DST_02: unreliable (spread=2)
- DST_03: unreliable (spread=2)
- DST_04: drifted (spread=1)
- DST_05: unreliable (spread=2)
- DST_06: drifted (spread=1)
- DST_08: drifted (spread=1)
- DST_09: drifted (spread=1)
- DST_10: unreliable (spread=2)
- DST_11: drifted (spread=1)
- DST_12: unreliable (spread=2)

## Explanation drift cases

- DST_01: drift=bad, indicator=0.795
- DST_04: drift=bad, indicator=0.803
- DST_05: drift=bad, indicator=0.853
- DST_06: drift=bad, indicator=0.845
- DST_07: drift=bad, indicator=0.852
- DST_08: drift=bad, indicator=0.825
- DST_09: drift=bad, indicator=0.819
- DST_11: drift=bad, indicator=0.835
- DST_12: drift=bad, indicator=0.853

## Case comparison packets

### BASE_CASE_ID: DST_01
EXPECTED_OUTCOME: direction_1
STABILITY_TOLERANCE: strict

VERSION_A:
- winner: direction_1
- route: ask_question_before_showing
- confidence: low
- top_score: 0.920
- runner_up: 0.920
- margin: 0.000

VERSION_B:
- winner: direction_3
- route: show_strongest_direction
- confidence: medium
- top_score: 0.730
- runner_up: 0.000
- margin: 0.730

VERSION_C:
- winner: direction_1
- route: ask_question_before_showing
- confidence: low
- top_score: 0.920
- runner_up: 0.920
- margin: 0.000

VERSION_D:
- winner: direction_5
- route: show_strongest_direction
- confidence: medium
- top_score: 0.720
- runner_up: 0.620
- margin: 0.100

STABILITY_AUDIT:
- winner_stability: unstable
- route_stability: unstable
- confidence_stability: drifted
- explanation_drift: bad
- reviewer_verdict: fail
- reviewer_notes: Expected outcome: direction_1; observed outcomes: clarification, direction_1. Winner stability: unstable. Route stability: unstable. Confidence: drifted. Explanation drift: bad. Outcome variation is difficult to justify from wording-only rewrites.

### BASE_CASE_ID: DST_02
EXPECTED_OUTCOME: direction_1
STABILITY_TOLERANCE: strict

VERSION_A:
- winner: direction_5
- route: ask_question_before_showing
- confidence: low
- top_score: 0.920
- runner_up: 0.900
- margin: 0.020

VERSION_B:
- winner: direction_3
- route: show_strongest_direction
- confidence: high
- top_score: 0.900
- runner_up: 0.000
- margin: 0.900

VERSION_C:
- winner: direction_5
- route: ask_question_before_showing
- confidence: low
- top_score: 0.910
- runner_up: 0.870
- margin: 0.040

VERSION_D:
- winner: direction_3
- route: show_strongest_direction
- confidence: medium
- top_score: 0.700
- runner_up: 0.000
- margin: 0.700

STABILITY_AUDIT:
- winner_stability: unstable
- route_stability: unstable
- confidence_stability: unreliable
- explanation_drift: acceptable
- reviewer_verdict: fail
- reviewer_notes: Expected outcome: direction_1; observed outcomes: clarification, direction_1. Winner stability: unstable. Route stability: unstable. Confidence: unreliable. Explanation drift: acceptable. Outcome variation appears attributable to wording surface changes rather than semantic rewrite differences.

### BASE_CASE_ID: DST_03
EXPECTED_OUTCOME: direction_1
STABILITY_TOLERANCE: strict

VERSION_A:
- winner: direction_1
- route: ask_question_before_showing
- confidence: low
- top_score: 0.930
- runner_up: 0.930
- margin: 0.000

VERSION_B:
- winner: direction_3
- route: show_strongest_direction
- confidence: high
- top_score: 0.910
- runner_up: 0.000
- margin: 0.910

VERSION_C:
- winner: direction_3
- route: show_strongest_direction
- confidence: high
- top_score: 0.880
- runner_up: 0.000
- margin: 0.880

VERSION_D:
- winner: direction_5
- route: ask_question_before_showing
- confidence: low
- top_score: 0.890
- runner_up: 0.880
- margin: 0.010

STABILITY_AUDIT:
- winner_stability: unstable
- route_stability: unstable
- confidence_stability: unreliable
- explanation_drift: concerning
- reviewer_verdict: fail
- reviewer_notes: Expected outcome: direction_1; observed outcomes: clarification, direction_1. Winner stability: unstable. Route stability: unstable. Confidence: unreliable. Explanation drift: concerning. Outcome variation appears attributable to wording surface changes rather than semantic rewrite differences.

### BASE_CASE_ID: DST_04
EXPECTED_OUTCOME: direction_1
STABILITY_TOLERANCE: strict

VERSION_A:
- winner: direction_1
- route: show_strongest_direction
- confidence: medium
- top_score: 0.910
- runner_up: 0.820
- margin: 0.090

VERSION_B:
- winner: direction_1
- route: ask_question_before_showing
- confidence: low
- top_score: 0.810
- runner_up: 0.810
- margin: 0.000

VERSION_C:
- winner: direction_5
- route: show_strongest_direction
- confidence: medium
- top_score: 0.900
- runner_up: 0.820
- margin: 0.080

VERSION_D:
- winner: direction_5
- route: ask_question_before_showing
- confidence: low
- top_score: 0.750
- runner_up: 0.730
- margin: 0.020

STABILITY_AUDIT:
- winner_stability: unstable
- route_stability: unstable
- confidence_stability: drifted
- explanation_drift: bad
- reviewer_verdict: fail
- reviewer_notes: Expected outcome: direction_1; observed outcomes: direction_1, clarification. Winner stability: unstable. Route stability: unstable. Confidence: drifted. Explanation drift: bad. Outcome variation is difficult to justify from wording-only rewrites.

### BASE_CASE_ID: DST_05
EXPECTED_OUTCOME: direction_1
STABILITY_TOLERANCE: strict

VERSION_A:
- winner: direction_5
- route: show_strongest_direction
- confidence: high
- top_score: 0.920
- runner_up: 0.800
- margin: 0.120

VERSION_B:
- winner: direction_5
- route: ask_question_before_showing
- confidence: low
- top_score: 0.920
- runner_up: 0.880
- margin: 0.040

VERSION_C:
- winner: direction_5
- route: show_strongest_direction
- confidence: medium
- top_score: 0.920
- runner_up: 0.850
- margin: 0.070

VERSION_D:
- winner: direction_1
- route: ask_question_before_showing
- confidence: low
- top_score: 0.790
- runner_up: 0.790
- margin: 0.000

STABILITY_AUDIT:
- winner_stability: unstable
- route_stability: unstable
- confidence_stability: unreliable
- explanation_drift: bad
- reviewer_verdict: fail
- reviewer_notes: Expected outcome: direction_1; observed outcomes: direction_1, clarification. Winner stability: unstable. Route stability: unstable. Confidence: unreliable. Explanation drift: bad. Outcome variation is difficult to justify from wording-only rewrites.

### BASE_CASE_ID: DST_06
EXPECTED_OUTCOME: direction_1
STABILITY_TOLERANCE: strict

VERSION_A:
- winner: direction_5
- route: show_strongest_direction
- confidence: medium
- top_score: 0.910
- runner_up: 0.840
- margin: 0.070

VERSION_B:
- winner: direction_5
- route: ask_question_before_showing
- confidence: low
- top_score: 0.920
- runner_up: 0.880
- margin: 0.040

VERSION_C:
- winner: direction_1
- route: ask_question_before_showing
- confidence: low
- top_score: 0.910
- runner_up: 0.910
- margin: 0.000

VERSION_D:
- winner: direction_5
- route: show_strongest_direction
- confidence: medium
- top_score: 0.710
- runner_up: 0.590
- margin: 0.120

STABILITY_AUDIT:
- winner_stability: unstable
- route_stability: unstable
- confidence_stability: drifted
- explanation_drift: bad
- reviewer_verdict: fail
- reviewer_notes: Expected outcome: direction_1; observed outcomes: direction_1, clarification. Winner stability: unstable. Route stability: unstable. Confidence: drifted. Explanation drift: bad. Outcome variation is difficult to justify from wording-only rewrites.

### BASE_CASE_ID: DST_07
EXPECTED_OUTCOME: direction_1
STABILITY_TOLERANCE: strict

VERSION_A:
- winner: direction_1
- route: ask_question_before_showing
- confidence: low
- top_score: 0.800
- runner_up: 0.800
- margin: 0.000

VERSION_B:
- winner: direction_5
- route: ask_question_before_showing
- confidence: low
- top_score: 0.910
- runner_up: 0.850
- margin: 0.060

VERSION_C:
- winner: direction_5
- route: ask_question_before_showing
- confidence: low
- top_score: 0.910
- runner_up: 0.860
- margin: 0.050

VERSION_D:
- winner: direction_3
- route: ask_question_before_showing
- confidence: low
- top_score: 0.640
- runner_up: 0.000
- margin: 0.640

STABILITY_AUDIT:
- winner_stability: unstable
- route_stability: stable
- confidence_stability: stable
- explanation_drift: bad
- reviewer_verdict: fail
- reviewer_notes: Expected outcome: direction_1; observed outcomes: clarification. Winner stability: unstable. Route stability: stable. Confidence: stable. Explanation drift: bad. Outcome variation is difficult to justify from wording-only rewrites.

### BASE_CASE_ID: DST_08
EXPECTED_OUTCOME: direction_1
STABILITY_TOLERANCE: strict

VERSION_A:
- winner: direction_1
- route: ask_question_before_showing
- confidence: low
- top_score: 0.910
- runner_up: 0.910
- margin: 0.000

VERSION_B:
- winner: direction_5
- route: ask_question_before_showing
- confidence: low
- top_score: 0.920
- runner_up: 0.860
- margin: 0.060

VERSION_C:
- winner: direction_1
- route: ask_question_before_showing
- confidence: low
- top_score: 0.900
- runner_up: 0.900
- margin: 0.000

VERSION_D:
- winner: direction_1
- route: show_strongest_direction
- confidence: medium
- top_score: 0.780
- runner_up: 0.630
- margin: 0.150

STABILITY_AUDIT:
- winner_stability: unstable
- route_stability: unstable
- confidence_stability: drifted
- explanation_drift: bad
- reviewer_verdict: fail
- reviewer_notes: Expected outcome: direction_1; observed outcomes: clarification, direction_1. Winner stability: unstable. Route stability: unstable. Confidence: drifted. Explanation drift: bad. Outcome variation is difficult to justify from wording-only rewrites.

### BASE_CASE_ID: DST_09
EXPECTED_OUTCOME: clarification
STABILITY_TOLERANCE: moderate

VERSION_A:
- winner: direction_1
- route: ask_question_before_showing
- confidence: low
- top_score: 0.810
- runner_up: 0.810
- margin: 0.000

VERSION_B:
- winner: direction_1
- route: ask_question_before_showing
- confidence: low
- top_score: 0.810
- runner_up: 0.810
- margin: 0.000

VERSION_C:
- winner: direction_5
- route: show_strongest_direction
- confidence: medium
- top_score: 0.900
- runner_up: 0.830
- margin: 0.070

VERSION_D:
- winner: direction_5
- route: ask_question_before_showing
- confidence: low
- top_score: 0.730
- runner_up: 0.710
- margin: 0.020

STABILITY_AUDIT:
- winner_stability: minor_drift
- route_stability: minor_drift
- confidence_stability: drifted
- explanation_drift: bad
- reviewer_verdict: fail
- reviewer_notes: Expected outcome: clarification; observed outcomes: clarification, direction_1. Winner stability: minor_drift. Route stability: minor_drift. Confidence: drifted. Explanation drift: bad. Outcome variation appears attributable to wording surface changes rather than semantic rewrite differences.

### BASE_CASE_ID: DST_10
EXPECTED_OUTCOME: clarification
STABILITY_TOLERANCE: moderate

VERSION_A:
- winner: direction_1
- route: ask_question_before_showing
- confidence: low
- top_score: 0.820
- runner_up: 0.800
- margin: 0.020

VERSION_B:
- winner: direction_1
- route: ask_question_before_showing
- confidence: low
- top_score: 0.930
- runner_up: 0.930
- margin: 0.000

VERSION_C:
- winner: direction_1
- route: ask_question_before_showing
- confidence: low
- top_score: 0.910
- runner_up: 0.910
- margin: 0.000

VERSION_D:
- winner: direction_1
- route: show_strongest_direction
- confidence: high
- top_score: 0.860
- runner_up: 0.740
- margin: 0.120

STABILITY_AUDIT:
- winner_stability: stable
- route_stability: minor_drift
- confidence_stability: unreliable
- explanation_drift: acceptable
- reviewer_verdict: fail
- reviewer_notes: Expected outcome: clarification; observed outcomes: clarification, direction_1. Winner stability: stable. Route stability: minor_drift. Confidence: unreliable. Explanation drift: acceptable. Outcome variation appears attributable to wording surface changes rather than semantic rewrite differences.

### BASE_CASE_ID: DST_11
EXPECTED_OUTCOME: clarification
STABILITY_TOLERANCE: moderate

VERSION_A:
- winner: direction_1
- route: ask_question_before_showing
- confidence: low
- top_score: 0.820
- runner_up: 0.800
- margin: 0.020

VERSION_B:
- winner: direction_5
- route: ask_question_before_showing
- confidence: low
- top_score: 0.920
- runner_up: 0.890
- margin: 0.030

VERSION_C:
- winner: direction_1
- route: show_strongest_direction
- confidence: medium
- top_score: 0.910
- runner_up: 0.840
- margin: 0.070

VERSION_D:
- winner: direction_1
- route: show_strongest_direction
- confidence: medium
- top_score: 0.770
- runner_up: 0.670
- margin: 0.100

STABILITY_AUDIT:
- winner_stability: minor_drift
- route_stability: minor_drift
- confidence_stability: drifted
- explanation_drift: bad
- reviewer_verdict: fail
- reviewer_notes: Expected outcome: clarification; observed outcomes: clarification, direction_1. Winner stability: minor_drift. Route stability: minor_drift. Confidence: drifted. Explanation drift: bad. Outcome variation appears attributable to wording surface changes rather than semantic rewrite differences.

### BASE_CASE_ID: DST_12
EXPECTED_OUTCOME: clarification
STABILITY_TOLERANCE: moderate

VERSION_A:
- winner: direction_5
- route: ask_question_before_showing
- confidence: low
- top_score: 0.920
- runner_up: 0.880
- margin: 0.040

VERSION_B:
- winner: direction_1
- route: ask_question_before_showing
- confidence: low
- top_score: 0.820
- runner_up: 0.820
- margin: 0.000

VERSION_C:
- winner: direction_5
- route: ask_question_before_showing
- confidence: low
- top_score: 0.910
- runner_up: 0.850
- margin: 0.060

VERSION_D:
- winner: direction_5
- route: show_strongest_direction
- confidence: high
- top_score: 0.890
- runner_up: 0.770
- margin: 0.120

STABILITY_AUDIT:
- winner_stability: minor_drift
- route_stability: minor_drift
- confidence_stability: unreliable
- explanation_drift: bad
- reviewer_verdict: fail
- reviewer_notes: Expected outcome: clarification; observed outcomes: clarification, direction_1. Winner stability: minor_drift. Route stability: minor_drift. Confidence: unreliable. Explanation drift: bad. Outcome variation appears attributable to wording surface changes rather than semantic rewrite differences.

## Remediation recommendations

- If winner instability clusters in action-heavy versions, reduce action-verb inflation bias in scoring dimensions tied to buildability and specificity.
- If reflection-heavy versions steal wins, rebalance reflective markers against concrete axis signals and evidence overlap.
- If plain-language versions lose confidence disproportionately, reduce polish sensitivity by calibrating lexical richness weighting.
- If route drift appears in strict cases, tighten clarification thresholds to semantic uncertainty rather than prose quality.
- Re-run NDS_DIRECTION_LINE_FIT_AUDIT_V1 and NDS_META_LABEL_REJECTION_TEST_V1 after scorer reweighting changes.
