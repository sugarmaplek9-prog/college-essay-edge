# Blind Evaluation Execution Evidence — V1

Date: 2026-04-26

## Founder authorization

- Founder decision: `APPROVE RUN`
- Approved PR number: `PR #6`
- Approved PR title: `072 Blind Evaluation Run Plan — Frozen Split`
- Approved plan artifact: `blind-evaluation-run-plan-v1.md`
- Execution branch: `072-blind-evaluation-execution`

## Execution source posture

- Approved manifest source: `specs/072-real-human-corpus-expansion/split-manifest.yaml`
- Frozen blind input artifact: `evaluation_outputs/072-real-human-corpus-expansion/blind-evaluation-run-v1/input/072_blind_frozen_input_v1.json`
- Execution helper: `evaluation/scripts/run-072-blind-evaluation-v1.ts`
- Base execution commit: `96c0b585ef96d64d514114ca4a947558d24b23d1`

PR #6 was not merged at execution time.
To preserve the approved run-plan state while still using the prevalidated isolated-run artifacts, engineering executed the run from a clean worktree branched from the fetched `pull/6/merge` preview and overlaid only the dedicated 072 helper and frozen blind input artifact already prepared in the workspace.

No manifest changes or case-inventory changes were made during this execution step.

## Final frozen blind case IDs executed

- `NSB-FS-005`
- `NSB-FS-006`
- `NSB-FS-013`
- `NSB-FS-014`
- `NSB-FS-015`
- `NSB-FS-016`
- `NSB-FS-020`
- `NSB-FS-021`
- `NSB-FS-022`

## Command and timing

- Exact execution command: `"/Volumes/TOSHIBA EXT/College Essay/node_modules/.bin/tsx" evaluation/scripts/run-072-blind-evaluation-v1.ts`
- Execution started at: `2026-04-26T23:01:49.647Z`
- Execution finished at: `2026-04-26T23:01:49.715Z`
- Output directory: `evaluation_outputs/072-real-human-corpus-expansion/blind-evaluation-run-v1`
- Run result: `COMPLETE`
- Retries: `0`
- Timeouts: `0`

## Output artifacts generated

### Root artifacts

- `manifest.json`
- `nds_results.json`
- `baseline_results.json`
- `normalized_results.json`
- `scores.json`
- `summary.json`
- `summary.csv`
- `summary.md`
- `reviewer_packet.md`
- `founder_human_review_packet_v1.md`
- `execution_metadata.json`

### Per-case output directories

- `nds_cases/`
- `baseline_cases/`
- `normalized_cases/`

### Restricted decode custody

- Protected decode path: `evaluation_outputs/072-real-human-corpus-expansion/blind-evaluation-run-v1/protected/reviewer_blind_decode.json`
- Decode exposure in reviewer packet: `no`
- Decode exposure in this memo: `no`

## Inventory preservation confirmations

- Confirmation no blind IDs changed from the frozen manifest: `yes`
- Confirmation no visible cases were included: `yes`
- Confirmation no new cases were added: `yes`
- Confirmation no frozen cases were removed: `yes`
- Confirmation active manifest path remained the approved source of truth: `yes`

## Baseline protocol confirmation

- Baseline system present in outputs: `baseline_free_ai`
- Baseline results generated for all `9` blind cases: `yes`
- NDS results generated for all `9` blind cases: `yes`
- Normalized comparison artifacts generated: `yes`
- Blind reviewer packet generated: `yes`

## Validation notes

Engineering confirmed the following after execution:

1. `summary.json` reports `total_cases_run: 9` and `total_scored_cases: 9`.
2. `execution_metadata.json` lists exactly the `9` founder-approved blind IDs.
3. The protected decode exists only under `protected/reviewer_blind_decode.json`.
4. The human review packet exists as `founder_human_review_packet_v1.md`.
5. No manifest edits were required for the run.

## Deviations / exceptions

One controlled deviation occurred relative to the approved plan PR surface:

- the fetched `pull/6/merge` preview did not yet contain `evaluation/scripts/run-072-blind-evaluation-v1.ts` or the isolated frozen blind input artifact
- engineering overlaid those already-prepared, prevalidated files into the clean execution worktree solely to execute the founder-authorized run safely against the exact frozen `9`-case cohort
- generated run outputs were then synced back into the canonical output directory in this workspace

No scoring rerun, inventory substitution, manifest edit, or answer-key disclosure deviation occurred.

## Current post-run status

`072 BLIND EVALUATION EXECUTED — RESULTS READY FOR REVIEW`

## Final status

FINAL STATUS: `072 BLIND EVALUATION EXECUTED — RESULTS READY FOR REVIEW`
