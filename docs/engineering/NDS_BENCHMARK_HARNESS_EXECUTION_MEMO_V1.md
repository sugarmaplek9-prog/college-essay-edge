# NDS_BENCHMARK_HARNESS_EXECUTION_MEMO_V1

**Product:** College Essay Edge  
**Date:** 2026-03-17  
**Status:** Approved benchmark/diagnostic workstream

## Purpose

Define engineering execution for offline benchmark harness integration under current strategy, governance, and learned-judgment roadmap.

This harness is approved for:
- offline evaluation
- diagnostic comparison
- miss clustering
- reviewer triage queue support

This harness is not approved as:
- automatic gold truth
- direct training corpus without adjudication
- standalone final quality proof

## Required execution rules

1. Run harness in order: setup → schema/provenance compatibility → smoke → full comparison → miss classification.
2. Enforce provenance/adjudication metadata before compatibility sign-off.
3. Support best-action predictions beyond forced-winner behavior:
   - `show_strongest_direction`
   - `ask_question_before_showing`
   - `blocked_or_needs_more_input`
   - `no_good_candidate`
4. Produce miss review artifact with failure-owner taxonomy fields.
5. Keep internet-sourced data benchmark-only until adjudicated.

## Implementation changes completed

Within [evaluation/nds_eval_package_v1](evaluation/nds_eval_package_v1):

- Updated template generator:
  - [scripts/make_blank_predictions.py](evaluation/nds_eval_package_v1/scripts/make_blank_predictions.py)
  - Adds `predicted_best_action`, `provenance`, `failure_annotation`, and `expected_best_action` fields.

- Updated scorer:
  - [scripts/score_predictions.py](evaluation/nds_eval_package_v1/scripts/score_predictions.py)
  - Supports canonical best-action mapping.
  - Emits miss-classification diagnostics.
  - Writes required miss review artifact: `outputs/NDS_BENCHMARK_MISS_REVIEW_V1.json`.

- Updated case inspection:
  - [scripts/inspect_cases.py](evaluation/nds_eval_package_v1/scripts/inspect_cases.py)
  - Surfaces provenance-relevant columns in inspection output.

- Updated output schema doc:
  - [docs/NDS_BENCHMARK_OUTPUT_PACK_V1.md](evaluation/nds_eval_package_v1/docs/NDS_BENCHMARK_OUTPUT_PACK_V1.md)
  - Adds canonical action contract and provenance/failure fields.

- Added updated case schema deliverable:
  - [docs/NDS_BENCHMARK_CASE_SCHEMA_V2.json](evaluation/nds_eval_package_v1/docs/NDS_BENCHMARK_CASE_SCHEMA_V2.json)

## Governance hard rule

No harness case may be used as gold training data unless it has:
- provenance metadata
- transformation metadata
- adjudication status
- explicit review/adjudication

Public internet cases are allowed for benchmarking and diagnosis, not direct gold truth.

## Required downstream deliverables

- [docs/engineering/NDS_BENCHMARK_HARNESS_RUN_V1.md](docs/engineering/NDS_BENCHMARK_HARNESS_RUN_V1.md)
- [evaluation/nds_eval_package_v1/outputs/NDS_BENCHMARK_MISS_REVIEW_V1.json](evaluation/nds_eval_package_v1/outputs/NDS_BENCHMARK_MISS_REVIEW_V1.json)
- [evaluation/nds_eval_package_v1/docs/NDS_BENCHMARK_CASE_SCHEMA_V2.json](evaluation/nds_eval_package_v1/docs/NDS_BENCHMARK_CASE_SCHEMA_V2.json)
