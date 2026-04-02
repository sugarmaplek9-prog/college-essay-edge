# NDS_STABILITY_FAILURE_DIAGNOSTIC_RESULTS_V1

## Purpose

Bridge failed stability outputs to specific subsystems by identifying the score dimensions, route thresholds, and explanation behavior that caused wording-sensitive flips.

## Scope

- base cases in source artifact: 12
- unstable base cases diagnosed: 4

## Failure grouping

- scorer-dimension instability: 4
- route-threshold instability: 3
- explanation-layer instability: 3

## Scorer-dimension instability cases

- DST_02: B: baseline winner (direction_2) is absent/rejected, forcing a winner flip. D: baseline winner (direction_2) is absent/rejected, forcing a winner flip.
- DST_03: B: baseline winner (direction_3) is absent/rejected, forcing a winner flip. C: baseline winner (direction_3) is absent/rejected, forcing a winner flip. D: baseline winner (direction_3) is absent/rejected, forcing a winner flip.
- DST_07: B: baseline winner (direction_1) is absent/rejected, forcing a winner flip. C: baseline winner (direction_1) is absent/rejected, forcing a winner flip.
- DST_11: B: baseline winner (direction_1) is absent/rejected, forcing a winner flip.

## Route-threshold instability cases

- DST_03: B: route flipped to show strongest because confidence rose to high (band shift low→high, margin 0.030→0.930). D: route flipped to show strongest because confidence rose to high (band shift low→high, margin 0.030→0.860).
- DST_07: B: route flipped to show strongest because confidence rose to high (band shift low→high, margin 0.050→0.930). C: route flipped to show strongest because confidence rose to high (band shift low→high, margin 0.050→0.910). D: route flipped to show strongest because confidence rose to medium (band shift low→medium, margin 0.050→0.760).
- DST_11: C: route flipped to clarification because confidence dropped to low (band shift high→low, margin 0.810→0.050).

## Explanation-layer instability cases

- DST_03: Explanation drift is within acceptable range for wording rewrites.
- DST_07: B: low explanation similarity (0.199) with axis change responsibility→system_redesign. C: low explanation similarity (0.184) with axis change responsibility→pattern_breaking. D: low explanation similarity (0.207) with axis change responsibility→identity_transformation.
- DST_11: C: low explanation similarity (0.203) with axis change relationship_or_listening→responsibility.

## Per-case diagnostics

### DST_02 — Interpreter realizes smoothing language erases parents voice
- class: realization_dominant
- expected_outcome: direction_1
- stability_tolerance: strict
- primary_cause: scorer_dimension_instability
- patched_status: patched_in_sprint_v1
- post_patch_outcome: winner=unstable, route=stable, confidence=drifted, explanation=acceptable

A/B/C/D outcomes
- A: winner=direction_2, route=show_strongest_direction, confidence=high, margin=0.920
- B: winner=direction_1, route=show_strongest_direction, confidence=high, margin=0.900
- C: winner=direction_2, route=show_strongest_direction, confidence=high, margin=0.910
- D: winner=direction_1, route=show_strongest_direction, confidence=medium, margin=0.770

Winner-flip reason
- B: baseline winner (direction_2) is absent/rejected, forcing a winner flip. D: baseline winner (direction_2) is absent/rejected, forcing a winner flip.

Route-flip reason
- No route flip across versions.

Explanation-drift reason
- Explanation drift is within acceptable range for wording rewrites.

Reviewer note
- semantic drift: false
- surface-only drift: true
- scorer bug: true
- explanation bug: false
- confidence bug: false
- note: semantic_drift=no | surface_only_drift=yes | scorer bug signal: B: baseline winner (direction_2) is absent/rejected, forcing a winner flip. D: baseline winner (direction_2) is absent/rejected, forcing a winner flip. | confidence/route bug signal: none | explanation bug signal: none

Score deltas by dimension (vs Version A selected winner)
- B: {"student_specificity":-0.04,"evidence_grounding":0,"non_genericity":-0.04,"buildability":0,"distinctness":-0.05,"scene_strength":0,"reflective_potential":0.02,"explanation_coherence":0,"clarification_need":0,"total_score":-0.02}
- C: {"student_specificity":-0.02,"evidence_grounding":0,"non_genericity":0.01,"buildability":-0.01,"distinctness":0,"scene_strength":0,"reflective_potential":0,"explanation_coherence":0,"clarification_need":0,"total_score":-0.01}
- D: {"student_specificity":-0.37,"evidence_grounding":0,"non_genericity":-0.4,"buildability":-0.01,"distinctness":-0.05,"scene_strength":-0.06,"reflective_potential":0.02,"explanation_coherence":0,"clarification_need":0,"total_score":-0.15}

### DST_03 — Fixer identity release toward question-asking
- class: realization_dominant
- expected_outcome: direction_1
- stability_tolerance: strict
- primary_cause: scorer_dimension_instability
- patched_status: patched_in_sprint_v1
- post_patch_outcome: winner=minor_drift, route=unstable, confidence=unreliable, explanation=concerning

A/B/C/D outcomes
- A: winner=direction_3, route=ask_question_before_showing, confidence=low, margin=0.030
- B: winner=direction_1, route=show_strongest_direction, confidence=high, margin=0.930
- C: winner=direction_1, route=ask_question_before_showing, confidence=low, margin=0.090
- D: winner=direction_1, route=show_strongest_direction, confidence=high, margin=0.860

Winner-flip reason
- B: baseline winner (direction_3) is absent/rejected, forcing a winner flip. C: baseline winner (direction_3) is absent/rejected, forcing a winner flip. D: baseline winner (direction_3) is absent/rejected, forcing a winner flip.

Route-flip reason
- B: route flipped to show strongest because confidence rose to high (band shift low→high, margin 0.030→0.930). D: route flipped to show strongest because confidence rose to high (band shift low→high, margin 0.030→0.860).

Explanation-drift reason
- Explanation drift is within acceptable range for wording rewrites.

Reviewer note
- semantic drift: false
- surface-only drift: true
- scorer bug: true
- explanation bug: true
- confidence bug: true
- note: semantic_drift=no | surface_only_drift=yes | scorer bug signal: B: baseline winner (direction_3) is absent/rejected, forcing a winner flip. C: baseline winner (direction_3) is absent/rejected, forcing a winner flip. D: baseline winner (direction_3) is absent/rejected, forcing a winner flip. | confidence/route bug signal: B: route flipped to show strongest because confidence rose to high (band shift low→high, margin 0.030→0.930). D: route flipped to show strongest because confidence rose to high (band shift low→high, margin 0.030→0.860). | explanation bug signal: Explanation drift is within acceptable range for wording rewrites.

Score deltas by dimension (vs Version A selected winner)
- B: {"student_specificity":-0.05,"evidence_grounding":0,"non_genericity":-0.06,"buildability":0,"distinctness":-0.05,"scene_strength":0,"reflective_potential":0,"explanation_coherence":0,"clarification_need":0,"total_score":-0.02}
- C: {"student_specificity":-0.11,"evidence_grounding":0,"non_genericity":-0.07,"buildability":-0.07,"distinctness":-0.05,"scene_strength":0,"reflective_potential":-0.04,"explanation_coherence":0,"clarification_need":0,"total_score":-0.05}
- D: {"student_specificity":-0.25,"evidence_grounding":0,"non_genericity":-0.08,"buildability":-0.06,"distinctness":-0.05,"scene_strength":-0.1,"reflective_potential":-0.06,"explanation_coherence":0,"clarification_need":0,"total_score":-0.09}

### DST_07 — Food pantry cadence redesign
- class: action_dominant
- expected_outcome: direction_1
- stability_tolerance: strict
- primary_cause: scorer_dimension_instability
- patched_status: patched_in_sprint_v1
- post_patch_outcome: winner=unstable, route=unstable, confidence=unreliable, explanation=concerning

A/B/C/D outcomes
- A: winner=direction_1, route=ask_question_before_showing, confidence=low, margin=0.050
- B: winner=direction_2, route=show_strongest_direction, confidence=high, margin=0.930
- C: winner=direction_2, route=show_strongest_direction, confidence=high, margin=0.910
- D: winner=direction_1, route=show_strongest_direction, confidence=medium, margin=0.760

Winner-flip reason
- B: baseline winner (direction_1) is absent/rejected, forcing a winner flip. C: baseline winner (direction_1) is absent/rejected, forcing a winner flip.

Route-flip reason
- B: route flipped to show strongest because confidence rose to high (band shift low→high, margin 0.050→0.930). C: route flipped to show strongest because confidence rose to high (band shift low→high, margin 0.050→0.910). D: route flipped to show strongest because confidence rose to medium (band shift low→medium, margin 0.050→0.760).

Explanation-drift reason
- B: low explanation similarity (0.199) with axis change responsibility→system_redesign. C: low explanation similarity (0.184) with axis change responsibility→pattern_breaking. D: low explanation similarity (0.207) with axis change responsibility→identity_transformation.

Reviewer note
- semantic drift: false
- surface-only drift: true
- scorer bug: true
- explanation bug: true
- confidence bug: true
- note: semantic_drift=no | surface_only_drift=yes | scorer bug signal: B: baseline winner (direction_1) is absent/rejected, forcing a winner flip. C: baseline winner (direction_1) is absent/rejected, forcing a winner flip. | confidence/route bug signal: B: route flipped to show strongest because confidence rose to high (band shift low→high, margin 0.050→0.930). C: route flipped to show strongest because confidence rose to high (band shift low→high, margin 0.050→0.910). D: route flipped to show strongest because confidence rose to medium (band shift low→medium, margin 0.050→0.760). | explanation bug signal: B: low explanation similarity (0.199) with axis change responsibility→system_redesign. C: low explanation similarity (0.184) with axis change responsibility→pattern_breaking. D: low explanation similarity (0.207) with axis change responsibility→identity_transformation.

Score deltas by dimension (vs Version A selected winner)
- B: {"student_specificity":0.19,"evidence_grounding":0,"non_genericity":0.34,"buildability":0.03,"distinctness":0,"scene_strength":0,"reflective_potential":0.05,"explanation_coherence":0,"clarification_need":0,"total_score":0.11}
- C: {"student_specificity":0.2,"evidence_grounding":0,"non_genericity":0.33,"buildability":-0.02,"distinctness":0,"scene_strength":0,"reflective_potential":0.01,"explanation_coherence":0,"clarification_need":0,"total_score":0.09}
- D: {"student_specificity":-0.17,"evidence_grounding":0,"non_genericity":-0.06,"buildability":0,"distinctness":-0.05,"scene_strength":-0.15,"reflective_potential":0,"explanation_coherence":0,"clarification_need":0,"total_score":-0.06}

### DST_11 — Team conflict: role correction versus process correction (ambiguity-prone)
- class: ambiguity_prone
- expected_outcome: clarification
- stability_tolerance: moderate
- primary_cause: scorer_dimension_instability
- patched_status: patched_in_sprint_v1
- post_patch_outcome: winner=minor_drift, route=minor_drift, confidence=unreliable, explanation=concerning

A/B/C/D outcomes
- A: winner=direction_1, route=show_strongest_direction, confidence=high, margin=0.810
- B: winner=direction_2, route=show_strongest_direction, confidence=high, margin=0.940
- C: winner=direction_1, route=ask_question_before_showing, confidence=low, margin=0.050
- D: winner=direction_1, route=show_strongest_direction, confidence=medium, margin=0.770

Winner-flip reason
- B: baseline winner (direction_1) is absent/rejected, forcing a winner flip.

Route-flip reason
- C: route flipped to clarification because confidence dropped to low (band shift high→low, margin 0.810→0.050).

Explanation-drift reason
- C: low explanation similarity (0.203) with axis change relationship_or_listening→responsibility.

Reviewer note
- semantic drift: false
- surface-only drift: true
- scorer bug: true
- explanation bug: true
- confidence bug: true
- note: semantic_drift=no | surface_only_drift=yes | scorer bug signal: B: baseline winner (direction_1) is absent/rejected, forcing a winner flip. | confidence/route bug signal: C: route flipped to clarification because confidence dropped to low (band shift high→low, margin 0.810→0.050). | explanation bug signal: C: low explanation similarity (0.203) with axis change relationship_or_listening→responsibility.

Score deltas by dimension (vs Version A selected winner)
- B: {"student_specificity":0.24,"evidence_grounding":0,"non_genericity":0.41,"buildability":0.04,"distinctness":0.05,"scene_strength":0,"reflective_potential":0.07,"explanation_coherence":0,"clarification_need":0,"total_score":0.13}
- C: {"student_specificity":0.19,"evidence_grounding":0,"non_genericity":0.4,"buildability":-0.01,"distinctness":0.05,"scene_strength":0,"reflective_potential":0.02,"explanation_coherence":0,"clarification_need":0,"total_score":0.1}
- D: {"student_specificity":-0.15,"evidence_grounding":0,"non_genericity":0,"buildability":0.01,"distinctness":0,"scene_strength":-0.09,"reflective_potential":0,"explanation_coherence":0,"clarification_need":0,"total_score":-0.04}
