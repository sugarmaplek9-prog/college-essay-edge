# Blind Evaluation Run Plan — V1

Date: 2026-04-26

Status: `PLAN ONLY — BLIND RUN NOT EXECUTED`

## Scope

This artifact prepares the founder review surface for the future blind evaluation run of the frozen `072-real-human-corpus-expansion` split.

It does **not** execute the blind run.
It does **not** generate scores.
It does **not** compare NDS against generic AI yet.
It does **not** alter the frozen manifest.

## 1. Frozen manifest source

- Active frozen manifest: `specs/072-real-human-corpus-expansion/split-manifest.yaml`
- Freeze evidence: `specs/072-real-human-corpus-expansion/freeze-execution-evidence-v1.md`
- Founder-approved freeze commit: `82a061df3ce882f4d5e9c5db5fc9d569c11cc906`

The blind run must use the active frozen manifest only.

## 2. Final frozen case IDs

### Blind-assigned frozen cases

- `NSB-FS-005`
- `NSB-FS-006`
- `NSB-FS-013`
- `NSB-FS-014`
- `NSB-FS-015`
- `NSB-FS-016`
- `NSB-FS-020`
- `NSB-FS-021`
- `NSB-FS-022`

### Visible frozen cases

- `NSB-FS-008`
- `NSB-FS-017`
- `NSB-FS-018`
- `NSB-FS-019`
- `NSB-FS-023`
- `NSB-FS-024`

Only the `9` blind-assigned frozen cases above are eligible for the future blind evaluation run.

## 3. Blind evaluation input protocol

The current repo state contains:

- the active frozen manifest for `072`
- visible-side derived 072 case packs under `evaluation/cases/072_real_human_visible_*.json`
- the older leakage-safe but empty `evaluation/cases/blind-case-pack-v2.json`

The current repo does **not** yet contain a dedicated frozen `9`-case evaluator input artifact for the approved blind cohort.

Therefore the authorized run, once separately approved, must begin with a controlled blind-input preparation step:

1. Create a dedicated frozen blind evaluator input artifact derived from the founder-approved blind case IDs in `split-manifest.yaml`.
2. Build that artifact in the same derived-public-benchmark format already used by the existing `072` evaluation case files.
3. Store only the allowed derived input fields and metadata needed for evaluation; do not widen storage posture beyond existing corpus rules.
4. Keep that blind input artifact limited to the `9` frozen blind IDs and exclude all visible cases.
5. Record the generated artifact path, timestamp, and commit SHA in the run-start memo before any evaluator command runs.

Planning implication:

- the later run directive must either authorize creation of a dedicated file such as `evaluation/cases/072_real_human_blind_frozen_v1.json` or approve an equivalent isolated workspace artifact
- the run must not point the generic `evaluation/scripts/eval-*.ts` pipeline at the entire `evaluation/cases` directory without first isolating the frozen blind cohort, because `CASE_DIR` currently resolves to all JSON files under `evaluation/cases`

## 4. Generic AI baseline protocol

The existing evaluation pipeline already includes a baseline path:

- script: `evaluation/scripts/eval-baseline.ts`
- internal baseline builder: `src/lib/ai/evaluation/nds-evaluation.ts`
- current manifest default: `baseline_mode: deterministic_prompt_harness`

Planned baseline protocol:

1. Run the baseline only against the dedicated frozen blind input artifact, not the entire evaluation corpus.
2. Use the same frozen blind case list and ordering as the NDS run.
3. Record whether the baseline remains `deterministic_prompt_harness` or is separately upgraded to a real-provider baseline under founder instruction.
4. If founder later authorizes a real-provider baseline, capture exact model/provider metadata in the run manifest and result packet.

Until a separate run authorization says otherwise, the safe default assumption is the repo’s current baseline path: `deterministic_prompt_harness`.

## 5. Answer-key handling protocol

The evaluation pipeline writes blind decode material as:

- `reviewer_blind_decode.json`

Older holdout tooling also uses explicit answer-key artifacts such as:

- `blind_review_answer_key.json`

Planned answer-key handling protocol:

1. Keep any decode / answer-key artifact out of the initial human review packet.
2. Treat decode / answer-key files as restricted post-run artifacts.
3. Store them only inside the run directory after evaluator execution.
4. Do not paste answer-key contents into PR discussion, public docs, or review instructions.
5. If human review is performed, release the decode only after the scorer submits blind judgments.
6. Record answer-key path(s), generation time, and access restrictions in the run evidence memo.

## 6. Judge / scoring protocol

The current evaluation pipeline already defines a blind reviewer packet and score form in `src/lib/ai/evaluation/pack.ts`.

Planned scoring protocol:

1. Run NDS and baseline on the frozen blind cohort.
2. Normalize outputs with `evaluation/scripts/eval-normalize.ts`.
3. Generate a blind reviewer packet with `evaluation/scripts/eval-review-packet.ts`.
4. Score blind comparisons using the existing packet score dimensions:
   - `divergence_quality`
   - `conviction_quality`
   - `evidence_grounding`
   - `next_step_usefulness`
   - `substitution_risk`
   - `student_dignity_tone`
   - `product_sharpness`
   - `nds_clearly_better_than_baseline`
5. Preserve raw per-system outputs, normalized outputs, score records, and summary artifacts in the run directory.
6. If a human review slice is requested, generate it from the blind packet only after the packet exists and before decode disclosure.

## 7. Output directory naming

The generic evaluation pipeline writes runs under:

- `evaluation/runs/<evaluation_run_id>`

where `evaluation_run_id` is created by the pack library.

Planned naming rule:

1. Use the standard run directory under `evaluation/runs/` for machine artifacts.
2. Use a review label and evidence memo that explicitly names the run as the frozen 072 blind evaluation.
3. Create a matching human-readable evidence folder or memo reference if founder requests a bundled packet.

Example planned labeling:

- run directory: `evaluation/runs/nds_eval_<timestamp_or_uuid>`
- human review reference label: `072 frozen blind evaluation v1`

## 8. Required run commands

These commands are planned commands only. They are **not** authorized to run yet.

### Planned preparation sequence

1. Prepare the dedicated frozen blind input artifact for the `9` approved blind IDs.
2. Execute the evaluation pipeline against that isolated blind input artifact.

### Planned command sequence

Because the generic `eval:*` scripts load from `evaluation/cases` by default, the run directive must first approve one of the following execution shapes:

- an isolated workspace where `evaluation/cases` contains only the frozen blind input artifact set for this run, or
- a minimal approved helper/update that lets `eval:*` scripts read from a dedicated blind case directory or file

Once that isolation path is approved, the planned command sequence is:

1. `npm run eval:nds`
2. `npm run eval:baseline`
3. `npm run eval:normalize -- --run-dir <runDir>`
4. `npm run eval:review-packet -- --run-dir <runDir>`
5. `npm run eval:summary -- --run-dir <runDir>`

Optional consolidated path, only if the isolated blind input artifact is already active and approved:

6. `npm run eval:full`

Human review follow-up, if separately requested:

7. generate human review slice / scoring packet from the run directory after the blind packet exists and before decode disclosure

## 9. Failure / abort conditions

Abort the run immediately if any of the following is true:

1. `split-manifest.yaml` no longer matches the founder-approved frozen inventory.
2. The planned blind input artifact does not contain exactly the `9` approved blind IDs.
3. Any visible or non-072 case appears in the run input.
4. Any answer-key or decode artifact is exposed before blind human scoring is complete.
5. The output directory already exists for the intended run and cannot be shown to be safe to reuse.
6. Required provider or environment settings are missing for the approved baseline mode.
7. The run scripts still point at the entire `evaluation/cases` corpus instead of the isolated frozen blind input.
8. Any new leakage, provenance, or manifest drift is discovered after freeze.

## 10. Human review packet requirements

The later run review packet must include:

1. active frozen manifest reference
2. blind case ID roster
3. reviewer packet path
4. decode / answer-key custody note
5. run manifest path
6. normalized results path
7. summary path
8. explicit statement that visible cases were excluded from the blind run
9. scorer instructions using the existing blind score dimensions
10. a clean founder review memo summarizing outcomes after scoring, not before

## 11. Non-execution confirmation

This artifact is planning only.

- blind evaluation has **not** been executed
- no scores have been generated
- no generic AI comparison has been executed for the frozen 072 blind cohort
- no frozen inventory changes are authorized by this plan

## Founder decision needed on the next PR

The PR for this plan should request exactly one of:

- `APPROVE RUN`
- `REQUEST CHANGES`
- `NO-GO`

## Final status

`PLAN ONLY — BLIND RUN NOT EXECUTED`