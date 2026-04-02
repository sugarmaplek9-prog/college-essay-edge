# NDS Candidate Reranker — V1

**Document ID:** `NDS_CANDIDATE_RERANKER_V1`
**Status:** Specification
**Version:** 1.0
**Parent spec:** `NDS_LEARNED_JUDGMENT_SYSTEM_V1`
**Schema contract:** `NDS_LEARNED_JUDGMENT_DATA_SCHEMA_V1`
**Related specs:** `NDS_ROUTE_CALIBRATION_MODEL_V1`, `NDS_LEARNED_JUDGMENT_SHADOW_MODE_V1`
**Last updated:** 2025-07

---

## Purpose

This document specifies the NDS Candidate Reranker — the model that learns, from labeled data, how to identify the best candidate narrative direction from a set of LLM-generated candidates, and to detect when no candidate in the set is good enough to show.

The candidate reranker is the highest-leverage intervention in the learned judgment system. Attribution triage data confirms that 90.9% of high-trust-risk residuals had no good candidate in the set, and 63.6% of all failures were primarily attributed to candidate generation failure. The reranker cannot fix what was never generated — but it can learn to reliably detect when the best available candidate is poor, and it can learn which candidate is the best when a good one exists. These two capabilities together address the dominant failure class.

---

## Table of Contents

1. [Model Role in the System](#1-model-role-in-the-system)
2. [Problem Formulation](#2-problem-formulation)
3. [Sub-Model A: Candidate Quality Scorer](#3-sub-model-a-candidate-quality-scorer)
4. [Sub-Model B: No-Good-Candidate Detector](#4-sub-model-b-no-good-candidate-detector)
5. [Feature Specification](#5-feature-specification)
6. [Training Data Requirements](#6-training-data-requirements)
7. [Model Class and Architecture](#7-model-class-and-architecture)
8. [Training Configuration](#8-training-configuration)
9. [Inference Spec (Serving)](#9-inference-spec-serving)
10. [Evaluation Spec](#10-evaluation-spec)
11. [Release Gates](#11-release-gates)
12. [Integration with NDS Engine](#12-integration-with-nds-engine)
13. [Failure Modes and Mitigations](#13-failure-modes-and-mitigations)
14. [Shadow Mode Requirements](#14-shadow-mode-requirements)
15. [Version History and Upgrade Protocol](#15-version-history-and-upgrade-protocol)

---

## 1. Model Role in the System

### 1.1 Where the reranker sits

```
NDS invocation
    │
    ▼
[LLM generates 3–5 candidate directions]
    │
    ▼
[Feature extraction: intrinsic + vs-case + relative features]
    │
    ▼
┌─────────────────────────────────────────────────────┐
│              CANDIDATE RERANKER                      │
│                                                      │
│  Sub-model A: Candidate quality scorer               │
│     → candidate_quality_score (per candidate)        │
│     → best_candidate_probability (per candidate)     │
│     → false_premium_probability (per candidate)      │
│     → flattening_risk_probability (per candidate)    │
│                                                      │
│  Sub-model B: No-good-candidate detector             │
│     → P(no good candidate in set)                   │
│     → no_good_candidate_flag                         │
└─────────────────────────────────────────────────────┘
    │
    ▼
[Route calibration model] ← receives reranker outputs as inputs
    │
    ▼
[Routing decision: show / clarify / block]
    │
    ▼
[Trust and helpfulness model]
    │
    ▼
[Output to user]
```

The reranker outputs are inputs to the route calibration model. A downstream route calibration model that receives a strong `no_good_candidate` signal from the reranker should route to `clarify` rather than `show`. See `NDS_ROUTE_CALIBRATION_MODEL_V1` for the full routing logic.

### 1.2 What the reranker does NOT do

- It does not generate new candidates.
- It does not modify candidate text.
- It does not make the final routing decision (that is the route calibration model's job).
- It does not assess student trust or helpfulness in the output delivery context (that is the trust/helpfulness model's job).
- It does not write to `nds_human_labels`. It reads features from `nds_candidates` and `nds_runs`.

---

## 2. Problem Formulation

### 2.1 Sub-model A: Candidate quality scoring

**Input:** A single candidate, its features (intrinsic), the features of the run it belongs to (vs-case features), and the features of its sibling candidates (relative features).

**Output:**
- `candidate_quality_score ∈ [0, 1]` — overall quality of this candidate
- `best_candidate_probability ∈ [0, 1]` — P(this is the best available candidate in the set)
- `false_premium_probability ∈ [0, 1]` — P(this candidate uses false premium language)
- `flattening_risk_probability ∈ [0, 1]` — P(this candidate flattens student voice)

**Training task:** Multi-output regression/classification on human-labeled quality assessments from `nds_human_labels`.

**Target labels:**
- `candidate_quality_score` target: derived from `selected_candidate_quality` label:
  - `good` → 1.0
  - `acceptable` → 0.7
  - `poor` → 0.2
  - `harmful` → 0.0
- `best_candidate_probability` target: `better_candidate_existed = false AND selected_candidate_quality IN ('good', 'acceptable')` → 1.0 for selected candidate; 0.0 for non-selected candidates unless explicitly identified as better via `better_candidate_id`
- `false_premium_probability` target: `direction_line_premium_flag` from labels
- `flattening_risk_probability` target: `direction_line_flattening` from labels

### 2.2 Sub-model B: No-good-candidate detection

**Input:** The full set of candidate features for a run (set-level aggregation of candidate features).

**Output:**
- `no_good_candidate_score ∈ [0, 1]` — P(no candidate in this set is acceptable)
- `no_good_candidate_flag` — binary decision at operating threshold

**Training task:** Binary classification on `nds_human_labels.no_good_candidate`.

**Critical property:** False negative rate must be minimized. A missed no-good-candidate case (predicting `false` when the truth is `true`) results in showing a poor or harmful direction to a student. False positives (predicting `true` when a good candidate exists) result in unnecessary clarification prompts, which are a usability cost but not a trust risk. The operating threshold must be tuned accordingly.

---

## 3. Sub-Model A: Candidate Quality Scorer

### 3.1 Architecture

Gradient-boosted tree ensemble (XGBoost or LightGBM). See §7 for full justification.

Multi-output: the model outputs four scores simultaneously. In practice, this may be implemented as four separate single-output models sharing the same feature matrix (preferred for simplicity and independent threshold tuning) or as a multi-output model (preferred for training efficiency at scale).

**Default implementation:** Four separate LightGBM binary classifiers, one per output, sharing the same feature extraction pipeline.

### 3.2 Label construction

Labels for sub-model A are constructed from `nds_human_labels` rows using the following query logic:

```sql
-- For each run with a non-superseded, high/medium confidence label:
SELECT
  c.candidate_id,
  c.run_id,
  c.is_selected,
  -- quality score
  CASE l.selected_candidate_quality
    WHEN 'good'       THEN 1.0
    WHEN 'acceptable' THEN 0.7
    WHEN 'poor'       THEN 0.2
    WHEN 'harmful'    THEN 0.0
  END AS quality_score_target,
  -- best candidate flag
  CASE
    WHEN c.is_selected AND NOT l.better_candidate_existed THEN 1.0
    WHEN c.candidate_id = l.better_candidate_id           THEN 1.0
    ELSE 0.0
  END AS best_candidate_target,
  l.direction_line_premium_flag::numeric  AS false_premium_target,
  l.direction_line_flattening::numeric    AS flattening_risk_target
FROM nds_candidates c
JOIN nds_human_labels l ON l.run_id = c.run_id
WHERE
  l.supersedes_id IS NULL
  AND l.confidence_level IN ('high', 'medium')
  AND c.candidate_rank = 1   -- label applies to selected candidate only
```

For non-selected candidates, quality score labels are inferred:
- If `better_candidate_id` points to this candidate: `quality_score = 1.0`
- Otherwise: quality is set to `NULL` and these rows are excluded from the quality score training task (non-selected candidates have no direct quality label by default).

### 3.3 Output schema

The model writes results to `nds_candidates` columns at inference time:

```
nds_candidates.reranker_score               → candidate_quality_score
nds_candidates.reranker_best_candidate_p    → best_candidate_probability
nds_candidates.reranker_false_premium_p     → false_premium_probability
nds_candidates.reranker_flattening_risk_p   → flattening_risk_probability
```

---

## 4. Sub-Model B: No-Good-Candidate Detector

### 4.1 Architecture

Single LightGBM binary classifier on set-level features. The input is one row per run (not per candidate), constructed by aggregating candidate-level features across all candidates in the run.

### 4.2 Label construction

```sql
SELECT
  r.run_id,
  l.no_good_candidate::integer AS target
FROM nds_runs r
JOIN nds_human_labels l ON l.run_id = r.run_id
WHERE
  l.supersedes_id IS NULL
  AND l.confidence_level IN ('high', 'medium')
```

### 4.3 Class distribution expectations

Based on attribution triage data:
- 90.9% of high-trust-risk residuals had `no_good_candidate = true`
- Across the full run distribution, `no_good_candidate` is expected to represent ~20–35% of labeled cases (general run population is less skewed than the residual failure set)

If the positive class rate in the training dataset is outside the range 15–50%, investigate data collection bias before proceeding with training.

### 4.4 Threshold tuning

The no-good-candidate detector uses an asymmetric threshold strategy:

- Primary metric for threshold selection: **false negative rate** (FNR) on validation set
- Acceptable FNR at deployment: ≤ 8%
- Acceptable FPR at deployment: ≤ 30% (false positives = unnecessary clarification prompts)
- Operating threshold selected from validation set precision-recall curve at the point where FNR = 8%
- This threshold is recorded in `nds_training_snapshots.threshold_config` as `no_good_candidate_threshold`

### 4.5 Output schema

The detector outputs are added to the run-level context passed to the route calibration model:

```
run_context.no_good_candidate_score    → P(no good candidate)
run_context.no_good_candidate_flag     → binary at operating threshold
```

These values are NOT stored in `nds_runs` in the base schema (they are passed as in-memory context through the pipeline). They may be logged to `nds_runs.model_config` as a JSONB extension for debugging.

---

## 5. Feature Specification

### 5.1 Feature groups

Features are organized into three groups. All features are computed at inference time from data available in `nds_runs` and `nds_candidates`. No future data is used.

### 5.2 Group A: Intrinsic candidate features

These are properties of the candidate itself, independent of the input and of sibling candidates.

| Feature | Source column | Type | Description |
|---------|--------------|------|-------------|
| `is_generic` | `nds_candidates.is_generic` | Boolean | No grounding in essay scene |
| `is_premium` | `nds_candidates.is_premium` | Boolean | Prestige framing without scene |
| `is_contradiction` | `nds_candidates.is_contradiction` | Boolean | Contradicts essay evidence |
| `scene_anchor_present` | `nds_candidates.scene_anchor_present` | Boolean | References concrete scene |
| `indirect_signal_used` | `nds_candidates.indirect_signal_used` | Boolean | Uses indirect/implicit evidence |
| `direction_specificity_score` | `nds_candidates.direction_specificity_score` | Float [0,1] | Specificity of direction line |
| `explanation_grounding_score` | `nds_candidates.explanation_grounding_score` | Float [0,1] | How grounded the explanation is |
| `word_count_direction` | `nds_candidates.word_count_direction` | Integer | Word count of direction line |
| `word_count_explanation` | `nds_candidates.word_count_explanation` | Integer | Word count of explanation |
| `is_generic_x_not_scene` | Derived | Boolean | `is_generic AND NOT scene_anchor_present` |
| `is_premium_x_not_scene` | Derived | Boolean | `is_premium AND NOT scene_anchor_present` |

### 5.3 Group B: Vs-case features

These are relationships between the candidate and the input it was generated from.

| Feature | Source | Type | Description |
|---------|--------|------|-------------|
| `input_to_candidate_alignment_score` | `nds_candidates.input_to_candidate_alignment_score` | Float [0,1] | How well candidate aligns with input |
| `candidate_vs_input_overreach_score` | `nds_candidates.candidate_vs_input_overreach_score` | Float [0,1] | How much candidate overreaches the input |
| `input_specificity_score` | `nds_runs.input_specificity_score` | Float [0,1] | Specificity of input |
| `input_surface_only` | `nds_runs.input_surface_only_flag` | Boolean | Input is surface-only |
| `input_contradiction` | `nds_runs.input_contradiction_detected` | Boolean | Input has internal contradiction |
| `input_has_indirect` | `nds_runs.input_has_indirect_signal` | Boolean | Input has indirect signal only |
| `input_word_count` | `nds_runs.input_word_count` | Integer | Word count of input |
| `input_narrative_signal_count` | `nds_runs.input_narrative_signal_count` | Integer | Count of narrative signals in input |
| `specificity_gap` | Derived | Float | `direction_specificity_score - input_specificity_score` |
| `premium_on_low_specificity` | Derived | Boolean | `is_premium AND input_specificity_score < 0.4` |
| `generic_on_high_specificity` | Derived | Boolean | `is_generic AND input_specificity_score > 0.6` |

### 5.4 Group C: Relative features (set-level)

These are the position and quality of the candidate relative to its siblings in the same run.

| Feature | Source | Type | Description |
|---------|--------|------|-------------|
| `candidate_rank` | `nds_candidates.candidate_rank` | Integer | Rank in set (1 = selected) |
| `rank_vs_siblings_specificity` | `nds_candidates.rank_vs_siblings_specificity` | Integer | Rank by specificity in set |
| `margin_vs_next_best` | `nds_candidates.margin_vs_next_best` | Float | Score margin to 2nd-best |
| `set_generic_count` | `nds_candidates.set_generic_count` | Integer | Count of generic siblings |
| `set_all_generic` | `nds_candidates.set_all_generic` | Boolean | Every candidate is generic |
| `set_contradiction_count` | `nds_candidates.set_contradiction_count` | Integer | Count of contradiction siblings |
| `set_max_specificity` | `nds_candidates.set_max_specificity` | Float | Highest specificity in set |
| `set_size` | Derived | Integer | Total count of candidates in set |
| `frac_set_generic` | Derived | Float | `set_generic_count / set_size` |
| `is_best_in_bad_set` | Derived | Boolean | `is_selected AND set_all_generic` |
| `specificity_above_set_mean` | Derived | Boolean | `direction_specificity_score > set_mean_specificity` |

### 5.5 No-good-candidate detector additional features

The no-good-candidate detector uses set-level aggregations of all features above, plus:

| Feature | Derivation | Description |
|---------|-----------|-------------|
| `all_candidates_generic` | `set_all_generic` | All candidates are generic |
| `all_candidates_premium` | Aggregate | All candidates use premium framing |
| `min_specificity_in_set` | `MIN(direction_specificity_score)` over run | Minimum specificity in set |
| `max_specificity_in_set` | `MAX(direction_specificity_score)` over run | Maximum specificity in set |
| `mean_specificity_in_set` | `AVG(direction_specificity_score)` over run | Mean specificity in set |
| `max_alignment_in_set` | `MAX(input_to_candidate_alignment_score)` over run | Best alignment in set |
| `min_overreach_in_set` | `MIN(candidate_vs_input_overreach_score)` over run | Minimum overreach in set |
| `any_contradiction_in_set` | `set_contradiction_count > 0` | Any candidate contradicts input |
| `all_no_scene_anchor` | Aggregate | No candidate has a scene anchor |
| `input_surface_only` | `nds_runs.input_surface_only_flag` | Pass-through from run level |
| `input_low_specificity` | `input_specificity_score < 0.35` | Input is low-specificity |

### 5.6 Feature engineering constraints

1. **No text features.** The reranker must not operate on raw text — no TF-IDF, no embeddings, no character n-grams. All features are structured signals computed by the feature extraction pipeline. This is a hard constraint: preserves model interpretability, avoids encoding LLM-generated text artifacts, and prevents hidden text-level leakage.
2. **No features from `nds_human_labels` or `nds_product_outcomes`.** Feature extraction must be strictly label-free.
3. **All features must be computable in real-time at inference.** No feature may require a batch job that isn't already running before the NDS invocation. Expected feature computation latency: ≤ 25ms.
4. **Feature definitions must be documented precisely.** Any change to a feature's computation logic requires a new feature version and a re-training job before deployment.

---

## 6. Training Data Requirements

### 6.1 Minimum dataset sizes

| Sub-model | Minimum labeled runs | Minimum positive class count |
|-----------|--------------------|-----------------------------|
| Candidate quality scorer | 300 runs with quality labels | 75 `good` + 75 `poor or harmful` |
| Best-candidate classifier | 250 runs with `better_candidate_existed` labels | 50 `better_candidate_existed = true` |
| False premium classifier | 200 runs with `direction_line_premium_flag` labels | 50 `premium_flag = true` |
| Flattening risk classifier | 200 runs with `direction_line_flattening` labels | 40 `flattening = true` |
| No-good-candidate detector | 400 runs with `no_good_candidate` labels | 80 `no_good_candidate = true` |

These are hard minimums. Training must not proceed if any minimum is unmet. A warning is issued when the count is below 1.5× the minimum.

### 6.2 Data quality requirements for training

Per the dataset construction principles in `NDS_LEARNED_JUDGMENT_DATA_SCHEMA_V1` §9:
- All training labels must have `confidence_level IN ('high', 'medium')`
- Adjudicated labels preferred; at minimum 75% of high-value tier labels must be adjudicated or agreement-confirmed
- No session appears in more than one split
- Test set is the most recent 15% chronologically

### 6.3 Class balance

For the no-good-candidate detector:
- If `no_good_candidate = true` is below 20% of training data, flag a priority review queue request before training.
- Use class-weight correction (not oversampling) in the loss function.
- Class weights: `w_positive = (n_negative / n_positive)^0.75` (attenuated inverse frequency weighting).

---

## 7. Model Class and Architecture

### 7.1 Recommended model class

**Primary recommendation: LightGBM (gradient-boosted decision trees)**

Rationale:

| Property | Why it matters here |
|----------|---------------------|
| Interpretable feature importance | Required for model auditing and release gates |
| No overfitting on structured features | Candidate features are low-dimensional and bounded |
| Handles missing values natively | Some features may be NULL for early runs (pre-v2 NDS) |
| Fast inference (< 1ms per prediction) | Required for real-time NDS latency budget |
| Small model size | Easy to version, ship, and roll back |
| No distributional assumptions | Feature distributions are non-Gaussian and bounded |
| Standard SHAP support | Required for per-prediction explanations (debugging, safety audits) |

**Alternative considered: Neural encoder** — rejected for v1 because feature count is small (< 40 features), training data volume is limited (< 1000 labeled runs at launch), and interpretability is non-negotiable for safety auditing.

**Neural encoder may be appropriate in a future version (v2+) if:**
- Training dataset exceeds 5000 labeled runs
- Text-level features are added after additional safety review
- Interpretability requirements are satisfied by SHAP-based explanation of embedding dimensions

### 7.2 Model hyperparameters (initial)

```python
LIGHTGBM_PARAMS = {
    "objective": "binary",
    "metric": "auc",
    "n_estimators": 200,
    "learning_rate": 0.05,
    "max_depth": 4,
    "num_leaves": 15,
    "min_child_samples": 10,
    "feature_fraction": 0.8,
    "bagging_fraction": 0.8,
    "bagging_freq": 5,
    "reg_alpha": 0.1,
    "reg_lambda": 0.1,
    "random_state": 42,
    "verbose": -1
}
```

Hyperparameters are tuned via Optuna on the validation set. The `n_estimators` upper bound may be expanded to 500 as dataset size grows. All final hyperparameters are stored in `nds_training_snapshots.hyperparameters`.

### 7.3 No neural text processing

This is a non-negotiable rule for v1. The direction lines and explanation text **must not** be passed through any embedding model or language model as part of the reranker's inference. All signals from text must be pre-computed and stored as structured features.

---

## 8. Training Configuration

### 8.1 Training sequence

The candidate reranker must be trained before the route calibration model or trust/helpfulness model, because those models depend on reranker outputs as inputs. See `NDS_LEARNED_JUDGMENT_SYSTEM_V1` §13 for the full dependency order.

### 8.2 Cross-validation strategy

- Primary evaluation: time-based train/test split (test = most recent 15% of data chronologically)
- Secondary evaluation: 5-fold cross-validation on training data (to assess variance)
- Cross-validation is performed at the session level (all runs from a session are in the same fold)

### 8.3 Early stopping

For each LightGBM model, early stopping is enabled:
```python
callbacks=[lightgbm.early_stopping(stopping_rounds=20, verbose=False)]
```
Validation metric for early stopping: AUC on the validation split.

### 8.4 Reproducibility requirements

Every training run must:
1. Set `random_state=42` in all model constructors and data split operations.
2. Log the Python and LightGBM version to `nds_training_snapshots`.
3. Log the exact feature list and feature hash to `nds_training_snapshots`.
4. Save the serialized model artifact to a path recorded in `nds_training_snapshots.model_artifact_path`.

Given the same training snapshot hash, the same model must be producible from scratch. The serialized model file is the canonical artifact; the `run_id_hash_train` is the canonical dataset identifier.

---

## 9. Inference Spec (Serving)

### 9.1 Inference pipeline

```
nds_run invoked
    │
    ▼
LLM generates candidates
    │
    ▼
For each candidate:
  - compute Group A features (intrinsic)
  - compute Group B features (vs-case) using run context
  - compute Group C features (relative) using sibling candidates
    │
    ▼
Feature matrix assembled (one row per candidate + one row per run for NGC detector)
    │
    ▼
Sub-model A: predict candidate quality score, best-p, false-premium-p, flattening-p
Sub-model B: predict no_good_candidate_score
    │
    ▼
Reranker outputs written to in-memory context object:
  - per-candidate: quality_score, best_candidate_p, false_premium_p, flattening_p
  - run-level: no_good_candidate_score, no_good_candidate_flag
    │
    ▼
Selected candidate = argmax(best_candidate_p) over candidates
    │
    ▼
Context object passed to route calibration model
```

### 9.2 Latency budget

| Step | Budget |
|------|--------|
| Feature extraction (all features, all candidates) | ≤ 25ms |
| Sub-model A inference (4 classifiers × n candidates) | ≤ 5ms |
| Sub-model B inference | ≤ 2ms |
| Total reranker contribution to NDS latency | ≤ 35ms |

### 9.3 Model loading

The reranker model(s) are loaded into memory at process start. Re-loading on each request is not permitted. Model files must be co-located with the application container (not fetched from external storage at inference time).

### 9.4 Fallback behavior

If the reranker model is unavailable (file missing, deserialization error, version mismatch):
1. Log the error to the application error log with the model version and failure reason.
2. Fall back to the pre-model heuristic ranking (rank by `direction_specificity_score` descending).
3. Set `no_good_candidate_flag = false` (conservative: do not block on model failure).
4. Emit a `model_fallback` event to the monitoring system.
5. Do NOT crash the NDS pipeline. The student must still receive a result.

The fallback must be tested in the CI pipeline on every deploy.

---

## 10. Evaluation Spec

### 10.1 Metrics: Candidate quality scorer

| Metric | Target (test set) | Description |
|--------|------------------|-------------|
| AUC (quality ≥ acceptable vs. poor/harmful) | ≥ 0.82 | Discrimination between good and bad candidates |
| Precision at top-1 (selected = quality ≥ acceptable) | ≥ 0.80 | When model selects a candidate, it's acceptable or better |
| Recall at top-1 (best labeled candidate is model's top-1) | ≥ 0.75 | Model finds the best candidate when one exists |
| False premium precision | ≥ 0.72 | When model flags false premium, it's correct |
| Flattening risk recall | ≥ 0.70 | Model catches most flattening risk cases |

### 10.2 Metrics: No-good-candidate detector

| Metric | Target (test set) | Description |
|--------|------------------|-------------|
| AUC | ≥ 0.85 | Overall discrimination |
| False negative rate (FNR) at operating threshold | ≤ 8% | Critical: miss rate on true no-good-candidate cases |
| False positive rate (FPR) at operating threshold | ≤ 30% | Unnecessary clarification cost |
| Positive predictive value at operating threshold | ≥ 0.65 | When detector flags NGC, it's correct 65%+ of the time |

### 10.3 Human correlation evaluation (every version)

For each new model version, run a human correlation evaluation:
- Select 50 cases from the test set with known adjudicated labels.
- Compute the fraction where model's ranking agrees with human reviewers' preferred ranking.
- Required: model-human ranking agreement ≥ 70%.

### 10.4 Regression evaluation (every version)

Before any model version is released:
- Run the model against the full held-out evaluation sprint output dataset (`evaluation_outputs/`).
- Confirm that the model's AUC on the evaluation sprint runs is ≥ 0.80.
- Confirm no regression: AUC on the previous version's test set is not reduced by more than 0.02.

---

## 11. Release Gates

A new reranker model version must pass **all** of the following gates before deployment (even to shadow mode):

| Gate | Condition |
|------|-----------|
| **G1: Minimum dataset size** | All minimums in §6.1 met |
| **G2: Test AUC — quality scorer** | AUC ≥ 0.82 on held-out test set |
| **G3: Test AUC — NGC detector** | AUC ≥ 0.85 on held-out test set |
| **G4: NGC FNR** | FNR ≤ 8% at operating threshold |
| **G5: Human correlation** | Model-human ranking agreement ≥ 70% on 50-case correlation set |
| **G6: No regression** | AUC on previous version's test set not reduced by > 0.02 |
| **G7: Feature hash stability** | Feature list is unchanged from previous version (or intentional change is documented with a feature version bump) |
| **G8: Latency** | Inference latency ≤ 35ms at p95 on the load test suite |
| **G9: Fallback tested** | Fallback behavior confirmed passing in CI |
| **G10: Shadow mode pass** | See §14 for shadow mode release gates |

Gates G1–G9 must pass before shadow deployment. Gate G10 must pass before full production deployment.

---

## 12. Integration with NDS Engine

### 12.1 Integration point

The reranker integrates with the NDS engine at the point immediately after LLM candidate generation, before route selection. The integration is implemented in `src/lib/ai/modules/narrative-direction-selection/module-executor.ts`.

### 12.2 Feature extraction integration

Feature extraction is implemented as a synchronous function that takes the run context and candidate list as input and returns a structured feature object. It must be:
- Pure (no side effects, no external calls)
- Fast (total ≤ 25ms, including all relative features)
- Testable in isolation (tested in `src/__tests__/unit/`)

### 12.3 Model loading integration

The model files are loaded once at module initialization. The loading code must:
- Check the model version against the expected version in `model_config`
- Log a warning if the loaded model version differs from the expected version
- Use the fallback path if loading fails

### 12.4 Output integration

Reranker outputs are passed as a structured object to the route calibration model. They are also written to `nds_candidates` columns via an async background write (not on the critical inference path).

---

## 13. Failure Modes and Mitigations

| Failure mode | Description | Mitigation |
|-------------|-------------|------------|
| **Model overfits to NDS version** | Model learns version-specific artifacts rather than generalizable quality signals | Apply `nds_version` stratified splits; monitor AUC per version |
| **NGC detector too aggressive** | Flags too many cases as no-good-candidate, routing most traffic to clarify | Monitor FPR in shadow mode; adjust threshold before production |
| **NGC detector too conservative** | Misses real no-good-candidate cases, allowing poor directions through | Hard FNR ≤ 8% gate; shadow mode comparison against human reviewer rate |
| **Feature drift** | Production feature distributions drift from training distribution | Feature distribution monitoring in shadow mode; alert if >2σ drift on any key feature |
| **Training data concentration** | Labels are concentrated from a small period or few reviewers | Monitor label distribution by reviewer and by date in every training job |
| **All-generic-set detection failure** | NGC detector fails when the set has mixed (some generic, some not) candidates | `set_all_generic` feature must be verified in feature importance; must rank in top-5 features |

---

## 14. Shadow Mode Requirements

### 14.1 Shadow mode operation

Before production deployment, the reranker operates in shadow mode: it computes predictions for every live run but does not affect the routing decision shown to the user. Shadow mode is controlled by `nds_training_snapshots.shadow_only = true`.

### 14.2 Shadow mode metrics

The following metrics must be computed from shadow run data before production deployment:

| Metric | Required value | Description |
|--------|---------------|-------------|
| Reranker winner-change rate | Measured (no pass/fail) | Rate at which reranker would select a different candidate than heuristic ranking |
| NGC flag rate | ≤ 35% of live runs | Rate at which NGC detector fires on live traffic |
| NGC false positive estimate | ≤ 30% | Estimated via reviewer audit of 50 flagged cases |
| Reranker winner improvement rate | ≥ 60% of winner-change cases | Rate at which reviewer agrees reranker choice is better (50-case audit) |
| Latency P95 | ≤ 35ms | End-to-end reranker contribution |

### 14.3 Shadow mode exit criteria (production release gates)

To exit shadow mode and deploy to production:

| Criterion | Required value |
|-----------|---------------|
| Shadow NGC flag rate | ≤ 35% of live runs |
| Reviewer audit: NGC false positive rate | ≤ 30% |
| Reviewer audit: reranker winner improvement | ≥ 60% of winner-change cases |
| Latency P95 | ≤ 35ms |
| Shadow period duration | ≥ 7 calendar days |
| Shadow period run count | ≥ 500 live runs |

---

## 15. Version History and Upgrade Protocol

### 15.1 Version naming

Reranker versions follow semver: `MAJOR.MINOR.PATCH`
- MAJOR: breaking change in feature schema or output schema
- MINOR: new features added, model retrained
- PATCH: threshold adjustment only (no retraining)

### 15.2 Upgrade protocol

When a new model version passes all release gates and shadow mode criteria:

1. Write a new `nds_training_snapshots` row with `is_released = true`, `shadow_only = false`.
2. Update the model config in the NDS engine to point to the new model artifact.
3. Deploy the NDS engine with the new model.
4. Monitor live metrics for 48 hours: NGC flag rate, winner-change rate, P95 latency.
5. If any metric goes out of bounds within 48 hours, roll back to the previous model version immediately (change model config pointer, redeploy).

### 15.3 Rollback preservation

The previous model artifact must be retained in storage for at least 30 days after a new version is deployed. The rollback procedure must be documented and tested before any new version is deployed to production.

---

*End of NDS_CANDIDATE_RERANKER_V1*
