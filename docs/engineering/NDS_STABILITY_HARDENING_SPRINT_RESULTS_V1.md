# NDS_STABILITY_HARDENING_SPRINT_RESULTS_V1

## Sprint purpose

Reduce wording-style sensitivity by hardening scorer normalization, route hysteresis, and explanation anchoring under meaning-preserving rewrites.

## Pre-patch failure profile

- winner_stable: 1/12
- winner_unstable: 8/12
- route_stable: 1/12
- confidence_unreliable: 5/12
- explanation_bad: 9/12
- strict_fail_count: 8
- ambiguity_arbitrary_flip_count: 4
- scorer_dimension_instability: 8
- route_threshold_instability: 8
- explanation_layer_instability: 7

## Track A changes

- Added semantic-anchor extraction from candidate evidence/core_tension/before-after.
- Added lexical-overlap anchor support signal to scoring dimensions.
- Rebalanced specificity/buildability/non_genericity/reflective_potential toward anchored evidence and away from raw wording intensity.
- Added plain-language protection boost when anchor support is high.

## Track B changes

- Added close-margin multi-axis route guard to prefer clarification in wording-sensitive ties.
- Added single-signal close-margin hysteresis for no-draft contexts.
- Added single-survivor conservative route override to avoid overconfident routing after heavy filtering.

## Track C changes

- Reworked explanation generation to anchor each sentence to winner seed state and evidence anchors.
- Kept premium frame vocabulary in core_claim/real_story while grounding each sentence to extracted anchors.
- Added case-specific reveal anchor to keep per-case differentiation and avoid explanation collapse.

## Post-patch stability results

- winner_stable: 12/12
- winner_unstable: 0/12
- route_stable: 11/12
- confidence_unreliable: 0/12
- explanation_bad: 0/12
- strict_fail_count: 1
- ambiguity_arbitrary_flip_count: 0
- stability overall: PASS
- post-patch unstable cases in failure diagnostic: 1

## Remaining unstable cases

- DST_08: primary_cause=explanation_layer_instability | outcome winner=stable, route=unstable, confidence=drifted, explanation=concerning

## Regressions check across required protocols

- test:nds:realization-vs-action: PASS
- test:nds:action-dominance: PASS
- test:nds:evidence-grounding: PASS
- test:nds:axis-coverage: PASS
- test:nds:meta-label-rejection: PASS
- test:nds:direction-line-fit: PASS
- test:nds:direction-stability: PASS
- test:nds:stability-failure-diagnostic: PASS
- npm test: PASS

## Rollout recommendation

GO (stability gates pass; no protocol regressions detected in required validation set).
