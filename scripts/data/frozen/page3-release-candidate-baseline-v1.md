# Page 3 Release Candidate Baseline V1

- baseline_id: page3_release_candidate_baseline_v1
- accepted_on: 2026-03-26T22:45:11.865Z
- release_candidate_id: page3_rc_v1
- rc_pass: true
- all_layers_packet_valid: true
- all_layers_no_collapse: true
- frozen_regression_ok: true
- residual_comprehension_fail_total_layer_b: 2

## Layer results
- Layer A — Frozen Regression Benchmark: tally={"product_wins":10,"openai_wins":0,"ties":2,"unscored":0}, collapse=0, dominant_family_ratio=0.273, packet_valid=true, failed_gates=none
- Layer B — Unseen Validation Set: tally={"product_wins":0,"openai_wins":0,"ties":0,"unscored":12}, collapse=0, dominant_family_ratio=0.333, packet_valid=true, failed_gates=none
- Layer C — Messy Input Set: tally={"product_wins":0,"openai_wins":0,"ties":0,"unscored":8}, collapse=0, dominant_family_ratio=0.25, packet_valid=true, failed_gates=none

## Accepted residuals
- Residual candidate-level comprehension_fail rejections still exist in Layer B diagnostics, but no longer produce collapse or packet invalidation.
- Layers B and C remain product-only decision layers in the RC suite because their OpenAI baseline cache is intentionally incomplete.

## Known limitations
- The frozen evaluator is heuristic and remains a guardrail, not the final human authority for product quality.
- The RC suite is strong for remediation protection but does not yet replace broader controlled product testing on real student notes.
- Controlled testing still needs operator review to judge landing quality, not just structural validity.

## Open questions for controlled testing
- How often do real messy notes trigger fallback candidates without reducing trust in the surfaced recommendation?
- Do recommendation openings stay diverse in broader real-case batches beyond the current three layers?
- Are there new failure classes in long, partially drafted, or highly comparative inputs that the frozen layers do not cover?

