# PAGE 3 — Generalization Phase Plan V1

Date: 2026-03-26

## 1) Frozen regression benchmark confirmation

The original 12-case benchmark is now frozen as regression-only:

- Frozen case file: `scripts/data/frozen/page3-holdout-v2-cases.frozen.json`
- Frozen regression standard: `scripts/data/frozen/page3-frozen-regression-standard-v1.json`

Locked baseline target:

- `product_wins: 10`
- `openai_wins: 0`
- `ties: 2`
- `unscored: 0`

Locked gate requirements:

- `collapse_cases <= 0`
- `dominant_family_ratio <= 0.35`
- `packet_valid_for_review = true`

## 2) Proposed unseen validation set structure (Layer B)

File: `scripts/data/page3-unseen-v1-cases.json`

Structure:

- 12 unseen cases (`UV1_01`..`UV1_12`)
- Same schema as frozen benchmark (`case_id`, `title`, `narrative_pattern`, `signal_quality`, `raw_notes`)
- Pattern coverage includes:
  - `failure_reinterpretation`
  - `identity_shift`
  - `conflict_reframe`
  - `usefulness_vs_intention`
  - `responsibility_shift`
  - `competence_vs_responsibility`
  - `unknown`
- Mix of signal quality: strong / medium / weak

Intent:

- Test generalization beyond historical remediation set
- Catch benchmark-trained behavior
- Surface novel failure classes

## 3) Proposed messy-input set structure (Layer C)

File: `scripts/data/page3-messy-v1-cases.json`

Structure:

- 8 rough-input cases (`MW1_01`..`MW1_08`)
- Same schema for consistency with evaluator pipeline
- Input characteristics intentionally include:
  - fragments
  - shorthand
  - uncertain compare asks
  - inconsistent punctuation
  - colloquial language

Intent:

- Simulate realistic first-pass student notes
- Verify recommendation usability under noisy input
- Stress compare mode and fallback clarity with imperfect source text

## 4) Three-layer execution plan

Execution entrypoint:

- `npm run eval:page3:layers:v1`
- Script: `scripts/page3-multilayer-validation-v1.mjs`

Per-layer loop (A/B/C):

1. Run holdout evaluator (`scripts/page3-holdout-v2.mjs`) with layer-specific case file and output directory
2. Run pool integrity gate (`scripts/page3-pool-integrity-audit-v1.mjs`)
3. Run shell repetition audit (`scripts/tmp_audit_shell_repetition.mjs`)
4. Run packet validation gate (`scripts/page3-packet-validation-gate-v2.mjs`)
5. Aggregate outputs into multilayer report:
   - `evaluation_outputs/page3_layers/MULTILAYER_VALIDATION_REPORT_V1.json`
   - `evaluation_outputs/page3_layers/MULTILAYER_VALIDATION_REPORT_V1.md`

Frozen-layer enforcement:

- Layer A is checked against `page3-frozen-regression-standard-v1.json`
- Any mismatch marks frozen regression as failed

## 5) New runtime instrumentation for cross-layer comparison

Added instrumentation:

- Multi-layer orchestrator: `scripts/page3-multilayer-validation-v1.mjs`
  - Standardizes per-layer execution
  - Collects holdout + gate outputs
  - Computes frozen-regression pass/fail contract
- Shell audit parameterization:
  - `scripts/tmp_audit_shell_repetition.mjs` now accepts `OUT_DIR`
  - Enables shell-repetition diagnostics per validation layer

Recommended next instrumentation (next pass):

- Layer-diff analyzer to compare failure reasons and route distributions between A/B/C
- Per-pattern scoreboard by `narrative_pattern` and `signal_quality`
- Compare-mode drift tracker (`unknown` + `needs_more_input` cohorts) across layers
