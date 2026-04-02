# NDS Eval Package V1

This package is designed to be opened in VS Code and run locally.

## What is included

- `data/NDS_GOLD_LABEL_PACK_V1.csv`
- `data/NDS_GOLD_LABEL_PACK_V1.json`
- `docs/NDS_BENCHMARK_OUTPUT_PACK_V1.md`
- `docs/NDS_OFFLINE_EVAL_RUBRIC_V1.md`
- `docs/NDS_FAILURE_TAXONOMY_V1.md`
- `docs/NDS_ADJUDICATION_WORKFLOW_V1.md`
- `docs/NDS_EXECUTION_DIRECTION_V1.md`
- `scripts/inspect_cases.py`
- `scripts/make_blank_predictions.py`
- `scripts/score_predictions.py`
- `outputs/` for local results

## What to do in VS Code

### 1. Unzip the package
Place the folder anywhere on your machine.

### 2. Open in VS Code
In Terminal:

```bash
cd /path/to/nds_eval_package_v1
code .
```

If `code` is not installed in your shell path, open VS Code manually and choose **File -> Open Folder**.

### 3. Create and activate a virtual environment
On macOS:

```bash
python3 -m venv .venv
source .venv/bin/activate
```

### 4. Install dependencies
```bash
pip install -r requirements.txt
```

### 5. Inspect the cases
```bash
python scripts/inspect_cases.py --limit 10
```

### 6. Generate a blank prediction template
This gives you a fillable predictions file.

```bash
python scripts/make_blank_predictions.py
```

This writes:
- `outputs/NDS_PREDICTIONS_TEMPLATE.jsonl`

### 7. Fill predictions
For each case, fill in:

- `predicted_action`
- `predicted_best_direction`
- `predicted_candidate_directions`
- `predicted_rejected_directions`
- `clarification_questions`
- `confidence_band`
- `risk_flags`
- `one_sentence_rationale`
- `full_rationale`
- `needs_human_review`

You can do this:
- manually
- by piping your NDS model outputs into the template
- by writing your own script that emits one JSON object per line

### 8. Score predictions
```bash
python scripts/score_predictions.py --predictions outputs/NDS_PREDICTIONS_TEMPLATE.jsonl
```

This writes:
- `outputs/NDS_SCORE_REPORT.json`
- `outputs/NDS_SCORE_REPORT.md`

## Suggested first execution path

### Pass 1: smoke test
Run 5 cases manually:
- NDS-001
- NDS-004
- NDS-005
- NDS-010
- NDS-016

### Pass 2: full benchmark
Run all 25 cases through:
- your current NDS
- a generic baseline prompt

Then compare the reports.

## Governance and usage constraints (mandatory)

- This harness is approved for benchmark and diagnosis workflows.
- This harness is **not** approved as automatic gold training data.
- Public internet cases require provenance and adjudication before any gold-training use.
- Use this harness to separate failure ownership:
	- candidate generation
	- selection/reranking
	- routing/clarification
	- trust-risk
	- explanation amplification

## Canonical best-action support

Predictions should use `predicted_best_action` with one of:

- `show_strongest_direction`
- `ask_question_before_showing`
- `blocked_or_needs_more_input`
- `no_good_candidate`

`predicted_action` is retained only for legacy compatibility.

## Additional generated artifact

`scripts/score_predictions.py` now also writes:

- `outputs/NDS_BENCHMARK_MISS_REVIEW_V1.json`

This file is the structured miss-clustering/review queue artifact.

## Scoring logic in this package

The current scorer uses exact / near-exact string normalization for:
- `predicted_action`
- `predicted_best_direction`
- `clarification_needed` inferred from whether clarification questions were provided when expected

It also computes heuristic checks for:
- rejected direction presence
- rationale presence
- basic risk handling on sensitive cases

This is enough for V1 benchmarking.
Later you should upgrade to:
- adjudicator review
- semantic match scoring
- pairwise preference comparison

## Important cautions

- Do not train directly on raw public answers.
- Use this package first for benchmark and failure analysis.
- Sensitive-topic cases should always be reviewed by a human before benchmark freeze.

## Recommended next step after opening the package
Run the blank template, score a baseline, and identify whether your first fix should hit:
- candidate generation
- clarification
- trust-risk
- explanation
