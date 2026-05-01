# 072 Post-Repair Evaluation Execution Evidence — V1

## Founder authorization

- Status: `072 POST-REPAIR EVALUATION PLAN APPROVED — EXECUTION AUTHORIZED`
- Governing plan: `specs/072-real-human-corpus-expansion/post-repair-evaluation-plan-v1.md`
- Execution branch intent: `072-post-repair-evaluation-execution`

## Execution posture

- Repair runtime was not edited during this pass.
- Frozen 072 artifacts were read-only inputs.
- Unseen case inputs were read from the approved case files and were not altered after execution start.
- No public proof claim is authorized by this run.

## Execution command

- Command: `npx tsx evaluation/scripts/run-072-post-repair-evaluation-execution-v1.ts`
- Started: `2026-04-27T00:48:08.850Z`
- Finished: `2026-04-27T00:48:09.077Z`
- Output root: `evaluation_outputs/072-real-human-corpus-expansion/072-post-repair-evaluation-execution-v1`

## Three-layer evidence bundle

### 1. Frozen 072 sentinel

- Input source: `evaluation_outputs/072-real-human-corpus-expansion/blind-evaluation-run-v1/input/072_blind_frozen_input_v1.json`
- Output folder: `evaluation_outputs/072-real-human-corpus-expansion/072-post-repair-evaluation-execution-v1/frozen-072-sentinel`
- Status: `REPAIR_PASS`
- Critical repair failures moved from `7 / 3 / 9 / 7` to `0 / 0 / 0 / 0` across:
  - correction-template leakage
  - meta-instructional leakage
  - generic next-move suffix
  - dangling fragment phrasing
- Average source-overlap increased from `7.67` to `9.44`.

### 2. Unseen holdout / future-split

- Holdout source: `evaluation/cases/072_real_human_visible_medium_weak_v1.json`
- Future-split source: `evaluation/cases/072_real_human_visible_bootstrap_v1.json`
- Holdout output folder: `evaluation_outputs/072-real-human-corpus-expansion/072-post-repair-evaluation-execution-v1/unseen-holdout-v1`
- Future-split output folder: `evaluation_outputs/072-real-human-corpus-expansion/072-post-repair-evaluation-execution-v1/future-split-v1`
- Holdout machine result: `9 / 9` NDS-better (`100%`)
- Future-split machine result: `15 / 15` NDS-better (`100%`)
- Combined unseen machine result: `24 / 24` NDS-better (`100%`)

### 3. Blinded human review

- Packet folder: `evaluation_outputs/072-real-human-corpus-expansion/072-post-repair-evaluation-execution-v1/blinded-human-review-v1`
- Packet size: `10` cases (`5` unseen-holdout, `5` future-split)
- Decode custody: `evaluation_outputs/072-real-human-corpus-expansion/072-post-repair-evaluation-execution-v1/blinded-human-review-v1/protected/reviewer_blind_decode.json`
- Judgment record: `evaluation_outputs/072-real-human-corpus-expansion/072-post-repair-evaluation-execution-v1/blinded-human-review-v1/reviewer_results.json`

## Artifact inventory

- `evaluation/scripts/run-072-post-repair-evaluation-execution-v1.ts`
- `evaluation_outputs/072-real-human-corpus-expansion/072-post-repair-evaluation-execution-v1/execution_metadata.json`
- `evaluation_outputs/072-real-human-corpus-expansion/072-post-repair-evaluation-execution-v1/execution_summary.json`
- `evaluation_outputs/072-real-human-corpus-expansion/072-post-repair-evaluation-execution-v1/final_recommendation.json`
- `specs/072-real-human-corpus-expansion/post-repair-pattern-summary-v1.md`
- `specs/072-real-human-corpus-expansion/post-repair-blind-human-review-results-v1.md`
- `specs/072-real-human-corpus-expansion/post-repair-evaluation-recommendation-v1.md`

## Deviations / exceptions

- None from the approved execution plan.
- One implementation adaptation was required: the clean worktree did not contain ignored frozen artifacts or large case JSON files, so the execution helper read those approved inputs from the primary repo root while writing all new outputs inside the execution worktree.

## Final status

`072 POST-REPAIR EVALUATION COMPLETE — RESULT READY FOR STANDARDIZED REVIEW`
