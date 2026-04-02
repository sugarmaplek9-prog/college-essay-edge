# NDS Route Calibration Model — V1

**Document ID:** `NDS_ROUTE_CALIBRATION_MODEL_V1`
**Status:** Specification
**Version:** 1.0
**Parent spec:** `NDS_LEARNED_JUDGMENT_SYSTEM_V1`
**Schema contract:** `NDS_LEARNED_JUDGMENT_DATA_SCHEMA_V1`
**Upstream dependency:** `NDS_CANDIDATE_RERANKER_V1`
**Related specs:** `NDS_TRUST_AND_HELPFULNESS_MODEL_V1`, `NDS_LEARNED_JUDGMENT_SHADOW_MODE_V1`
**Last updated:** 2025-07

---

## Purpose

This document specifies the NDS Route Calibration Model — the model that learns, from labeled routing outcomes, when to show a direction, when to prompt for clarification, and when to block output entirely.

The route calibration model sits downstream of the candidate reranker. It receives the reranker's candidate quality signals and combines them with input-level features to produce a calibrated probability distribution over the three possible routes: `show`, `clarify`, `block`. It then selects the route based on this distribution and operating thresholds tuned on the validation set.

Attribution triage data shows that 27.3% of high-trust-risk residuals were primarily attributed to routing calibration failure — specifically, showing output when the input did not provide enough signal to generate a trustworthy direction. This model is the mechanism for correcting that failure.

---

## Table of Contents

1. [Model Role in the System](#1-model-role-in-the-system)
2. [Problem Formulation](#2-problem-formulation)
3. [Feature Specification](#3-feature-specification)
4. [Output Schema](#4-output-schema)
5. [Training Data Requirements](#5-training-data-requirements)
6. [Model Class and Architecture](#6-model-class-and-architecture)
7. [Calibration Requirements](#7-calibration-requirements)
8. [Training Configuration](#8-training-configuration)
9. [Inference Spec (Serving)](#9-inference-spec-serving)
10. [Evaluation Spec](#10-evaluation-spec)
11. [Release Gates](#11-release-gates)
12. [Integration with NDS Engine](#12-integration-with-nds-engine)
13. [Routing Decision Logic](#13-routing-decision-logic)
14. [Failure Modes and Mitigations](#14-failure-modes-and-mitigations)
15. [Shadow Mode Requirements](#15-shadow-mode-requirements)

---

## 1. Model Role in the System

### 1.1 Position in the inference pipeline

```
[Candidate Reranker outputs]
  - candidate_quality_score (best candidate)
  - best_candidate_probability
  - false_premium_probability
  - flattening_risk_probability
  - no_good_candidate_score
  - no_good_candidate_flag
        │
        ▼
[Input features from nds_runs]
  - input_specificity_score
  - input_surface_only_flag
  - input_contradiction_detected
  - input_has_indirect_signal
  - input_narrative_signal_count
        │
        ▼
┌───────────────────────────────────────────────────────┐
│           ROUTE CALIBRATION MODEL                      │
│                                                        │
│   Inputs:  reranker outputs + input features           │
│   Output:  P(show), P(clarify), P(block)               │
│            + calibrated_confidence                     │
│            + route_taken (argmax at threshold)         │
└───────────────────────────────────────────────────────┘
        │
        ▼
[route_taken] → written to nds_runs.route_taken
[route_confidence] → written to nds_runs.route_confidence
        │
        ▼
[Trust and helpfulness model]
        │
        ▼
[Output to user]
```

### 1.2 What this model does NOT do

- It does not generate or modify candidate text.
- It does not rank candidates (that is the reranker's job).
- It does not evaluate the quality of the output after routing (that is the trust model's job).
- It does not learn to show output more often as a default. It learns the correct routing given evidence quality.

---

## 2. Problem Formulation

### 2.1 Task definition

**Inputs:** A feature vector combining reranker outputs (§3.1) and input features (§3.2).

**Output:** A calibrated probability distribution over three routing classes:
- `P(show)` — probability that showing a direction is the right decision
- `P(clarify)` — probability that asking a clarifying question is better
- `P(block)` — probability that neither action is appropriate (no useful direction possible, no useful clarification question either)

**Decision rule:** Route is selected by threshold logic applied to the predicted probabilities. See §13 for the full decision logic.

### 2.2 Training target

The training target is derived from `nds_human_labels.route_correct_would_be` (for incorrect cases) and `nds_runs.route_taken` (for correct cases):

```sql
-- Canonical routing target for a labeled run:
SELECT
  r.run_id,
  CASE
    WHEN l.route_verdict = 'correct'    THEN r.route_taken
    WHEN l.route_verdict = 'incorrect'  THEN l.route_correct_would_be
    WHEN l.route_verdict = 'borderline' THEN r.route_taken  -- default to actual (borderline = defensible)
  END AS routing_target
FROM nds_runs r
JOIN nds_human_labels l ON l.run_id = r.run_id
WHERE
  l.supersedes_id IS NULL
  AND l.confidence_level IN ('high', 'medium')
  AND l.route_correct_would_be IS NOT NULL
    OR l.route_verdict IN ('correct', 'borderline')
```

Borderline cases default to the actual route taken — the assumption is that borderline routing decisions were defensible, so the actual decision is used as a (soft) positive label.

### 2.3 Class distribution expectation

Based on observed NDS run distributions:
- `show`: expected ~60–75% of labeled runs
- `clarify`: expected ~20–30% of labeled runs
- `block`: expected ~2–8% of labeled runs

If the `block` class falls below 2% of labeled training data, hold it out of the multi-class formulation and implement as a post-hoc override rule (see §13.3).

---

## 3. Feature Specification

### 3.1 Reranker-derived features (upstream inputs)

| Feature | Source | Type | Description |
|---------|--------|------|-------------|
| `best_candidate_quality_score` | Reranker sub-model A | Float [0,1] | Quality score of the top-ranked candidate |
| `best_candidate_probability` | Reranker sub-model A | Float [0,1] | P(top-ranked candidate is the best available) |
| `best_false_premium_p` | Reranker sub-model A | Float [0,1] | P(false premium) for top candidate |
| `best_flattening_risk_p` | Reranker sub-model A | Float [0,1] | P(flattening) for top candidate |
| `no_good_candidate_score` | Reranker sub-model B | Float [0,1] | P(no good candidate in set) |
| `no_good_candidate_flag` | Reranker sub-model B | Boolean | Binary NGC decision at operating threshold |
| `candidate_quality_margin` | Derived | Float | `best_quality_score - second_best_quality_score` |
| `set_mean_quality` | Derived | Float | Mean quality score across all candidates |
| `set_max_quality` | Derived | Float | `best_candidate_quality_score` |
| `set_quality_variance` | Derived | Float | Variance of quality scores across set |

### 3.2 Input-level features

| Feature | Source | Type | Description |
|---------|--------|------|-------------|
| `input_specificity_score` | `nds_runs.input_specificity_score` | Float [0,1] | Specificity of student input |
| `input_surface_only` | `nds_runs.input_surface_only_flag` | Boolean | Input contains only surface-level content |
| `input_contradiction` | `nds_runs.input_contradiction_detected` | Boolean | Input contains internal contradiction |
| `input_has_indirect` | `nds_runs.input_has_indirect_signal` | Boolean | Input relies on indirect signals |
| `input_narrative_signal_count` | `nds_runs.input_narrative_signal_count` | Integer | Count of usable narrative signals |
| `input_word_count` | `nds_runs.input_word_count` | Integer | Word count of student input |

### 3.3 Interaction features (derived)

| Feature | Derivation | Description |
|---------|-----------|-------------|
| `low_input_x_low_quality` | `input_specificity_score < 0.4 AND best_quality_score < 0.5` | Compound failure signal |
| `ngc_x_low_specificity` | `no_good_candidate_flag AND input_specificity_score < 0.5` | Strong clarify signal |
| `high_quality_x_high_specificity` | `best_quality_score > 0.75 AND input_specificity_score > 0.6` | Strong show signal |
| `contradiction_x_low_margin` | `input_contradiction AND candidate_quality_margin < 0.1` | Inconsistent candidate set |
| `false_premium_x_low_input` | `best_false_premium_p > 0.6 AND input_specificity_score < 0.4` | Generic input → premium candidate |
| `surface_only_x_ngc` | `input_surface_only AND no_good_candidate_flag` | Double signal: should clarify |

### 3.4 Feature engineering constraints

All constraints from `NDS_CANDIDATE_RERANKER_V1` §5.6 apply here:
1. No text features. No embeddings. No raw LLM output.
2. No features from `nds_human_labels` or `nds_product_outcomes`.
3. All features computable in real-time at inference.
4. Feature definitions precisely documented.

Additional constraint for the route calibration model:
5. **No circularity with heuristic routing logic.** Features derived from the pre-model heuristic routing score must not be used. This prevents the model from learning to replicate the heuristic rather than learn from labeled corrections.

---

## 4. Output Schema

The model produces the following outputs at inference time:

```typescript
interface RouteCalibrationOutput {
  // Calibrated probability distribution
  p_show: number;     // 0.0–1.0
  p_clarify: number;  // 0.0–1.0
  p_block: number;    // 0.0–1.0

  // Confidence in the selected route
  route_confidence: number;  // 0.0–1.0, derived from max(p_show, p_clarify, p_block)

  // Selected route
  route_taken: 'show' | 'clarify' | 'block';

  // Model metadata
  model_version: string;
  threshold_version: string;

  // Override flags (see §13.3)
  override_applied: boolean;
  override_reason: string | null;
}
```

`route_confidence` is the calibrated probability of the selected class. This value is stored in `nds_runs.route_confidence` and is used by the trust/helpfulness model as an input.

---

## 5. Training Data Requirements

### 5.1 Minimum dataset sizes

| Route class | Minimum labeled runs |
|-------------|---------------------|
| `show` (positive for show) | 200 |
| `clarify` (positive for clarify) | 100 |
| `block` (positive for block) | 30 |
| **Total** | **≥ 330** |

If `block` class count is below 30, use the post-hoc override rule instead (§13.3) and train a binary `show` vs. `clarify` classifier only.

### 5.2 Reranker feature availability

The route calibration model **requires** reranker features as inputs. Training must not proceed until:
1. At least `NDS_CANDIDATE_RERANKER_V1` shadow model v1.0 is available.
2. Reranker features are computed and stored for all runs in the training dataset.

If reranker features are unavailable for older runs (pre-reranker deployment), those runs are excluded from the training dataset for this model.

### 5.3 Training data quality requirements

Same as `NDS_CANDIDATE_RERANKER_V1` §6.2. Additionally:
- Runs with `route_verdict = 'borderline'` in their label must constitute ≤ 25% of training data. If borderline is over-represented, it dilutes the signal from clearly correct/incorrect cases.
- For multi-reviewer runs, only adjudicated or agreement-confirmed routing labels are used.

---

## 6. Model Class and Architecture

### 6.1 Recommended model class

**Primary: LightGBM multi-class classifier**

Same rationale as `NDS_CANDIDATE_RERANKER_V1` §7.1 — interpretability, structured features, fast inference, small model size, SHAP support.

The multi-class objective uses `softmax` output, which produces a probability distribution over the three classes directly. This distribution is then calibrated using Platt scaling or isotonic regression on the validation set.

### 6.2 Calibration requirement

A route calibration model that is not well-calibrated — where `P(correct_route) = 0.7` does not actually correspond to 70% accuracy — is dangerous. A miscalibrated model may produce overconfident `show` predictions on borderline cases, which is the primary failure mode identified in the attribution triage.

**Required calibration method:** Platt scaling applied post-hoc on the validation set.

**Calibration validation:** After calibration, the Expected Calibration Error (ECE) on the test set must be ≤ 0.08 for the `show` class. (ECE measures the average gap between predicted probability and actual accuracy in probability buckets.)

### 6.3 Hyperparameters (initial)

```python
ROUTE_CALIBRATION_PARAMS = {
    "objective": "multiclass",
    "num_class": 3,
    "metric": "multi_logloss",
    "n_estimators": 150,
    "learning_rate": 0.05,
    "max_depth": 4,
    "num_leaves": 12,
    "min_child_samples": 8,
    "feature_fraction": 0.85,
    "bagging_fraction": 0.85,
    "bagging_freq": 5,
    "reg_alpha": 0.1,
    "reg_lambda": 0.1,
    "random_state": 42,
    "verbose": -1
}
```

If `block` is excluded (< 30 examples), use `objective: "binary"` for a two-class `show` vs. `clarify` model.

---

## 7. Calibration Requirements

### 7.1 Why calibration is a first-class requirement

The route confidence score is used in:
1. The `nds_human_labels` review queue tier assignment (low confidence → high-value tier)
2. The trust/helpfulness model (as an input feature)
3. The shadow mode comparison (alert when model is uncertain about a decision the heuristic made confidently)

An uncalibrated confidence score corrupts all of these downstream uses. Calibration is not optional.

### 7.2 Calibration procedure

1. Train the base LightGBM model on the training split.
2. Get the model's raw predicted probabilities on the validation split.
3. Fit a Platt scaling calibrator (logistic regression on raw probabilities) for the `show` class.
4. Fit isotonic regression calibrators for `clarify` and `block` (typically lower-frequency classes benefit from isotonic).
5. Re-normalize the three calibrated outputs to sum to 1.0.
6. Evaluate ECE on the test split (must be ≤ 0.08 for `show`, ≤ 0.12 for `clarify`).
7. Store calibration curve plots in the training snapshot artifacts.

### 7.3 Calibration monitoring in production

- Monthly: compute ECE on the most recently labeled 100 runs. If ECE drifts above 0.12 for the `show` class, trigger a re-calibration job (re-fit the Platt calibrator on new data without full retraining).
- If ECE exceeds 0.15: block new model versions from using the current calibrator; force full retraining.

---

## 8. Training Configuration

### 8.1 Training sequence dependency

This model must be trained **after** the candidate reranker (v1.0 or later) is trained and producing shadow mode outputs. The training job must verify that reranker features exist in the training dataset before proceeding.

### 8.2 Cross-validation strategy

Same as `NDS_CANDIDATE_RERANKER_V1` §8.2:
- Time-based train/test split (test = most recent 15% chronologically)
- 5-fold cross-validation on training data, folded at session level
- Calibration fit on validation split

### 8.3 Class weighting

For the multi-class formulation, use class-weight correction:
```python
class_weights = {
    "show": 1.0,
    "clarify": n_show / n_clarify,    # inverse frequency
    "block": min(n_show / n_block, 5.0)  # capped to avoid extreme weights
}
```

### 8.4 Reproducibility

Same requirements as `NDS_CANDIDATE_RERANKER_V1` §8.4. Additionally: calibration fit random seeds and calibration curve data must be stored in `nds_training_snapshots.training_log_path`.

---

## 9. Inference Spec (Serving)

### 9.1 Inference pipeline

```
Reranker outputs received (in-memory context object)
    │
    ▼
Input features extracted from nds_runs context
    │
    ▼
Interaction features computed
    │
    ▼
Feature vector assembled
    │
    ▼
LightGBM model produces raw P(show), P(clarify), P(block)
    │
    ▼
Calibrator applied → calibrated P(show), P(clarify), P(block)
    │
    ▼
Override logic applied (§13.3)
    │
    ▼
route_taken selected (§13)
route_confidence = max(calibrated probabilities)
    │
    ▼
RouteCalibrationOutput written to context object
nds_runs.route_taken, nds_runs.route_confidence updated
```

### 9.2 Latency budget

| Step | Budget |
|------|--------|
| Feature assembly | ≤ 5ms |
| Model inference (LightGBM forward pass) | ≤ 3ms |
| Calibration | ≤ 1ms |
| Override logic | ≤ 1ms |
| **Total route calibration contribution** | **≤ 10ms** |

### 9.3 Fallback behavior

If the route calibration model is unavailable:
1. Log the error.
2. Fall back to the pre-model heuristic routing rule.
3. Set `route_confidence` to the heuristic confidence score.
4. Emit a `model_fallback` event.
5. Do NOT crash the NDS pipeline.

---

## 10. Evaluation Spec

### 10.1 Routing accuracy

| Metric | Target (test set) | Description |
|--------|------------------|-------------|
| Overall routing accuracy | ≥ 0.78 | Fraction of routes matching human-preferred route |
| `show` class precision | ≥ 0.82 | When model says show, it's correct 82%+ of the time |
| `show` class recall | ≥ 0.80 | Model captures 80%+ of true show cases |
| `clarify` class recall | ≥ 0.70 | Model catches 70%+ of true clarify cases |
| Overconfident-wrong-show rate | ≤ 10% | Fraction of incorrect show decisions with `p_show > 0.75` |

The **overconfident-wrong-show rate** is a first-class metric. This is the failure mode identified in the attribution triage: the system shows output confidently when it should have clarified. Any model version that increases this rate compared to baseline is rejected.

### 10.2 Calibration metrics

| Metric | Target (test set) | Description |
|--------|------------------|-------------|
| ECE — `show` class | ≤ 0.08 | Expected calibration error for show probability |
| ECE — `clarify` class | ≤ 0.12 | Expected calibration error for clarify probability |
| Reliability diagram shape | Monotonically increasing | Calibration curve must not have inversions |
| Brier score — `show` | ≤ 0.18 | Mean squared probability error on show class |

### 10.3 Attribution alignment

At model evaluation time, compute routing decision distribution for the 11 high-trust-risk residual cases used in the attribution triage. The model must route at least 8/11 of these cases to `clarify` (matching the triage finding that 6/11 should have clarified, plus 3/11 trust calibration cases that may now route correctly with better candidate quality).

This is a soft target (advisory) for v1. It becomes a hard release gate for v2 and beyond.

---

## 11. Release Gates

All of the following must pass before deployment (including shadow mode):

| Gate | Condition |
|------|-----------|
| **G1: Minimum dataset size** | ≥ 330 labeled runs meeting quality requirements |
| **G2: Reranker dependency** | Reranker v1.0 or later trained and features available in training data |
| **G3: Routing accuracy** | Overall accuracy ≥ 0.78 on test set |
| **G4: Show precision** | `show` precision ≥ 0.82 |
| **G5: Overconfident-wrong-show rate** | ≤ 10% |
| **G6: ECE** | ECE ≤ 0.08 for `show` class on test set |
| **G7: No regression** | Routing accuracy on previous version's test set not reduced by > 0.03 |
| **G8: Fallback tested** | Fallback to heuristic routing confirmed passing in CI |
| **G9: Latency** | P95 inference latency ≤ 10ms |
| **G10: Shadow mode pass** | See §15 |

---

## 12. Integration with NDS Engine

### 12.1 Integration point

The route calibration model integrates immediately after the candidate reranker, before the routing decision is applied. Integration point in `src/lib/ai/modules/narrative-direction-selection/module-executor.ts`.

### 12.2 Feature contract

The route calibration model expects the following to be present in the context object received from the reranker:
```typescript
interface RerankerContext {
  best_candidate_quality_score: number;
  best_candidate_probability: number;
  best_false_premium_p: number;
  best_flattening_risk_p: number;
  no_good_candidate_score: number;
  no_good_candidate_flag: boolean;
  candidate_quality_margin: number;
  set_mean_quality: number;
  set_max_quality: number;
  set_quality_variance: number;
}
```

If any required feature is `null` or `undefined`, the fallback path is used.

---

## 13. Routing Decision Logic

### 13.1 Primary decision rule

After calibration, the route is selected as follows:

```typescript
function selectRoute(
  p_show: number,
  p_clarify: number,
  p_block: number,
  thresholds: RouteThresholds
): 'show' | 'clarify' | 'block' {

  // Block override (highest priority)
  if (p_block >= thresholds.block_min_p) return 'block';

  // Clarify override (second priority)
  if (p_clarify >= thresholds.clarify_min_p) return 'clarify';

  // Show default
  if (p_show >= thresholds.show_min_p) return 'show';

  // Fallback: argmax
  return argmax({ show: p_show, clarify: p_clarify, block: p_block });
}
```

Default thresholds (tuned on validation set, stored in `threshold_config`):
```json
{
  "show_min_p": 0.55,
  "clarify_min_p": 0.45,
  "block_min_p": 0.70
}
```

**Important:** `clarify_min_p < show_min_p` intentionally. When the model is uncertain between show and clarify, it defaults to clarify. This encodes the product principle: uncertain routing should resolve toward getting more information, not toward showing potentially poor output.

### 13.2 Confidence assignment

```typescript
const route_confidence = Math.max(p_show, p_clarify, p_block);
```

Route confidence is the calibrated probability of the selected class. It is stored in `nds_runs.route_confidence`.

### 13.3 Hard override rules

The following rules fire before the model's probabilistic decision. They are not learned; they are fixed logic:

| Override | Condition | Action | Reason |
|----------|-----------|--------|--------|
| `force_clarify_ngc` | `no_good_candidate_flag = true AND no_good_candidate_score > 0.80` | `route = clarify` | Reranker detected no good candidate with high confidence — clarification is the only responsible action |
| `force_clarify_surface` | `input_surface_only = true AND input_specificity_score < 0.25` | `route = clarify` | Input too thin to generate grounded direction |
| `force_block_contradiction` | `input_contradiction = true AND set_contradiction_count = set_size` | `route = block` | All candidates contradict the input — nothing usable |

Override rules fire before the model prediction is evaluated. When an override fires, `override_applied = true` and `override_reason` is set in the output. Override events are logged and audited monthly.

### 13.4 Override rate monitoring

Override rates are tracked in production:
- `force_clarify_ngc` rate: expected < 25% of show-eligible runs
- `force_clarify_surface` rate: expected < 10% of all runs
- `force_block_contradiction` rate: expected < 3% of all runs

If any override rate exceeds 2× the expected range, trigger a review.

---

## 14. Failure Modes and Mitigations

| Failure mode | Description | Mitigation |
|-------------|-------------|------------|
| **Overconfident show on low-quality sets** | Model predicts high `p_show` despite low candidate quality | ECE monitoring; overconfident-wrong-show gate; `force_clarify_ngc` override |
| **Clarify over-triggering** | Model routes too many valid cases to clarify, degrading UX | FPR monitoring on clarify; shadow mode comparison with human reviewer rate |
| **Block class underfit** | Block class too rare to train reliably | Post-hoc override rule instead of learned block class when n < 30 |
| **Reranker feature distribution shift** | Reranker scores shift after reranker re-training, breaking route model assumptions | Retrain route model whenever reranker major version changes |
| **Miscalibration drift** | ECE worsens over time as input distribution shifts | Monthly ECE monitoring; re-calibration trigger at ECE > 0.12 |
| **Heuristic override domination** | Hard override rules fire on too many cases, rendering model moot | Override rate monitoring; if any override > 40% of cases, review override rule definitions |

---

## 15. Shadow Mode Requirements

### 15.1 Shadow mode operation

Before production deployment, the route calibration model runs in shadow mode: it computes routing decisions for every live run but the actual routing used is the heuristic or previous model's decision. Shadow mode is controlled by `nds_training_snapshots.shadow_only = true`.

### 15.2 Shadow mode metrics

| Metric | Required value | Description |
|--------|---------------|-------------|
| Shadow routing agreement with heuristic | Measured (no pass/fail) | Rate at which model agrees with current routing |
| Shadow clarify-increase rate | Measured | Rate at which model routes to clarify more than current system |
| Overconfident-wrong-show estimate | ≤ 10% | Estimated via reviewer audit of 50 show decisions |
| ECE on shadow period data | ≤ 0.10 | Calibration check on live distribution |
| Latency P95 | ≤ 10ms | End-to-end route calibration contribution |

### 15.3 Shadow mode exit criteria

| Criterion | Required value |
|-----------|---------------|
| Shadow period duration | ≥ 7 calendar days |
| Shadow period run count | ≥ 500 live runs |
| Reviewer audit: clarify improvement rate | ≥ 65% of cases where model clarifies but heuristic shows, reviewer agrees clarify was better |
| Latency P95 | ≤ 10ms |
| ECE on shadow period | ≤ 0.10 |
| No regression in shadow routing accuracy vs. heuristic | Model accuracy on labeled shadow cases ≥ heuristic accuracy |

---

*End of NDS_ROUTE_CALIBRATION_MODEL_V1*
