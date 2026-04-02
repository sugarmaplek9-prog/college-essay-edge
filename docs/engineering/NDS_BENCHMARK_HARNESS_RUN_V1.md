# NDS_BENCHMARK_HARNESS_RUN_V1

**Date:** 2026-03-17  
**Package:** [evaluation/nds_eval_package_v1](evaluation/nds_eval_package_v1)

## 1) Smoke run result

### Setup and script path verification
Executed successfully:
- environment install (`pandas` installed)
- case inspection
- prediction template generation
- scoring pipeline execution

Generated outputs:
- [outputs/NDS_PREDICTIONS_TEMPLATE.jsonl](evaluation/nds_eval_package_v1/outputs/NDS_PREDICTIONS_TEMPLATE.jsonl)
- [outputs/NDS_SCORE_REPORT.json](evaluation/nds_eval_package_v1/outputs/NDS_SCORE_REPORT.json)
- [outputs/NDS_SCORE_REPORT.md](evaluation/nds_eval_package_v1/outputs/NDS_SCORE_REPORT.md)
- [outputs/NDS_BENCHMARK_MISS_REVIEW_V1.json](evaluation/nds_eval_package_v1/outputs/NDS_BENCHMARK_MISS_REVIEW_V1.json)

Status: **PASS (infrastructure smoke)**

## 2) Full 25-case run result

Current run used blank template predictions (intended only to validate schema/IO path).

Summary from [outputs/NDS_SCORE_REPORT.json](evaluation/nds_eval_package_v1/outputs/NDS_SCORE_REPORT.json):
- cases scored: 25
- average total score: 0.0 / 14
- misses requiring review: 25
- provenance summary:
  - public_internet: 25
  - anonymized_product_input: 0
  - legacy_internal_case: 0

Interpretation: this run validates harness execution and report generation only. It is **not** a model benchmark.

## 3) NDS vs baseline comparison summary

Not yet executed in this run artifact.

Required next benchmark executions:
1. Fill template with current NDS predictions for all 25 cases.
2. Score NDS output.
3. Fill template with generic baseline prompt predictions for all 25 cases.
4. Score baseline output.
5. Compare reports dimension-by-dimension and by failure-owner cluster.

## 4) Top miss clusters (current infrastructure run)

From blank predictions run, all misses cluster into `candidate_generation` by heuristic fallback classification.

This is expected and non-diagnostic because no predictions were provided.

## 5) Benchmark corpus provenance summary

Current corpus provenance in scoring report:
- `public_internet`: 25
- `anonymized_product_input`: 0
- `legacy_internal_case`: 0

Adjudication status in case records is currently `needs_adjudication` (benchmark-only usage).

## 6) Recommended next diagnostic step

Execute required 5-case model smoke predictions first:
- NDS-001
- NDS-004
- NDS-005
- NDS-010
- NDS-016

Then run complete 25-case dual comparison (current NDS vs generic baseline), and finalize miss ownership using:
- `candidate_generation`
- `selection_or_reranking`
- `routing`
- `line_generation`
- `explanation`
- `benchmark_borderline`

Do not promote any benchmark case to gold training without adjudication.
