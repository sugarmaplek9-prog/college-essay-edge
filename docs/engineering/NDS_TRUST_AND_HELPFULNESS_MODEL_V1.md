# NDS Trust and Helpfulness Model — V1

**Document ID:** `NDS_TRUST_AND_HELPFULNESS_MODEL_V1`
**Status:** Specification
**Version:** 1.0
**Parent spec:** `NDS_LEARNED_JUDGMENT_SYSTEM_V1`
**Schema contract:** `NDS_LEARNED_JUDGMENT_DATA_SCHEMA_V1`
**Upstream dependencies:** `NDS_CANDIDATE_RERANKER_V1`, `NDS_ROUTE_CALIBRATION_MODEL_V1`
**Last updated:** 2025-07

---

## Purpose

This document specifies the NDS Trust and Helpfulness Model — the model that learns to predict whether a specific NDS output, as shown to a student, will be trusted and genuinely helpful to them.

The trust and helpfulness model is the final layer of judgment in the NDS pipeline. It does not change the routing decision or the candidate selection (those are upstream). It evaluates the full output object — the combination of routing decision, selected candidate, direction line, and explanation — and produces signal about whether that output package meets the product's trust and helpfulness bar.

This model is the **product moat model**. The reranker and route calibration model address whether the system's choices are structurally correct. The trust and helpfulness model addresses whether the output will actually help a real student write a better college essay without damaging their voice, their confidence, or their trust in the product. These are not the same question.

---

## Table of Contents

1. [Model Role in the System](#1-model-role-in-the-system)
2. [What This Model Learns](#2-what-this-model-learns)
3. [Output Schema](#3-output-schema)
4. [Feature Specification](#4-feature-specification)
5. [Training Data Requirements](#5-training-data-requirements)
6. [Model Class and Architecture](#6-model-class-and-architecture)
7. [Multi-Output Architecture](#7-multi-output-architecture)
8. [Weak Supervision Integration](#8-weak-supervision-integration)
9. [Training Configuration](#9-training-configuration)
10. [Inference Spec (Serving)](#10-inference-spec-serving)
11. [Evaluation Spec](#11-evaluation-spec)
12. [Uses of Model Outputs](#12-uses-of-model-outputs)
13. [Release Gates](#13-release-gates)
14. [Shadow Mode Requirements](#14-shadow-mode-requirements)
15. [Failure Modes and Mitigations](#15-failure-modes-and-mitigations)
16. [Future Evolution Path](#16-future-evolution-path)

---

## 1. Model Role in the System

### 1.1 Position in the inference pipeline

```
[Route Calibration Model output]
  - route_taken: 'show'
  - route_confidence: 0.81
  - p_show, p_clarify, p_block
        │
        ▼
[Full output object assembled]
  - selected candidate (direction_line, explanation_text)
  - all candidate features (from reranker)
  - input features (from nds_runs)
        │
        ▼
┌────────────────────────────────────────────────────────┐
│         TRUST AND HELPFULNESS MODEL                     │
│                                                         │
│  Inputs:  full output + reranker outputs + route output │
│                                                         │
│  Outputs:                                               │
│    student_understood_score         0.0–1.0             │
│    helpfulness_score                0.0–1.0             │
│    false_premium_risk_score         0.0–1.0             │
│    flattening_risk_score            0.0–1.0             │
│    trust_aggregate_score            0.0–1.0             │
└────────────────────────────────────────────────────────┘
        │
        ▼
[Output shown to student] ← with trust-level-adjusted presentation
        │
        ▼
[Trust model outputs logged to nds_runs.model_config for training feedback]
```

### 1.2 What this model does at serving time

The trust model does not block output or change the routing decision (that ship has sailed by the time this model runs). Instead, its outputs drive:

1. **Presentation layer adjustment:** When `trust_aggregate_score < 0.5`, the output is presented with additional hedging or a more prominent "Does this feel right?" affordance, prompting the student to self-assess rather than blindly follow the direction.
2. **Logging and feedback signal:** Scores are stored for use as weak supervision labels in future training data and for detecting systematic trust failures in production.
3. **Review queue prioritization:** Runs with `trust_aggregate_score < 0.45` are promoted to the high-value review tier.
4. **Model monitoring:** Aggregate trust score distributions are tracked weekly; significant drops trigger a review.

### 1.3 What this model does NOT do at serving time

- Does not suppress or replace the selected candidate.
- Does not change the `route_taken` decision.
- Does not generate alternative text or rewrites.
- Does not directly fail a student's session.

---

## 2. What This Model Learns

### 2.1 The core learning target

The model learns to predict human reviewer assessments of four distinct trust-related properties of an NDS output:

| Property | Human label source | What it measures |
|----------|--------------------|-----------------|
| **Student understood** | `trust_verdict` | Would a student correctly interpret and apply this output? |
| **Helpfulness** | `helpfulness_verdict` | Does this output give the student actionable, genuine guidance? |
| **False premium risk** | `false_premium_present` | Is the output likely to give false-premium framing? |
| **Flattening risk** | `student_voice_preserved` (inverted) | Is the output at risk of flattening or genericizing the student? |

These four properties are related but distinct. A direction can be understandable but unhelpful (clear but generic). It can be technically grounded but still damage student voice (accurate but flattening). It can be specific but premium-framed (anchored in a scene but still prestige-washing it). The model must learn all four separately.

### 2.2 The aggregate trust score

`trust_aggregate_score` is a weighted combination of the four individual scores:

```
trust_aggregate_score =
    0.30 × student_understood_score +
    0.35 × helpfulness_score +
    0.20 × (1 - false_premium_risk_score) +
    0.15 × (1 - flattening_risk_score)
```

Weights are initialized from the attribution triage data:
- Helpfulness is weighted highest (the primary product goal)
- Student understanding is second (prerequisite for helpfulness)
- False premium and flattening are protection weights (defense against the two dominant harm types)

Weights are treated as hyperparameters and may be adjusted as more label data accumulates, but any adjustment requires explicit documentation in a training snapshot and approval from the product quality owner.

---

## 3. Output Schema

```typescript
interface TrustHelpfulnessOutput {
  // Individual scores (all 0.0–1.0)
  student_understood_score: number;   // P(student correctly interprets this)
  helpfulness_score: number;          // P(this output gives genuine actionable guidance)
  false_premium_risk_score: number;   // P(false premium present)
  flattening_risk_score: number;      // P(student voice flattened)

  // Aggregate
  trust_aggregate_score: number;      // weighted combination (see §2.2)

  // Binary flags (at operating thresholds)
  trust_flag_low: boolean;            // trust_aggregate_score < low_threshold (0.45)
  false_premium_flag: boolean;        // false_premium_risk_score > 0.65
  flattening_flag: boolean;           // flattening_risk_score > 0.60

  // Presentation instruction
  presentation_mode: 'standard' | 'hedged' | 'strongly_hedged';

  // Model metadata
  model_version: string;
}
```

### Presentation mode logic

```typescript
function selectPresentationMode(
  trust_aggregate_score: number,
  thresholds: TrustThresholds
): 'standard' | 'hedged' | 'strongly_hedged' {
  if (trust_aggregate_score >= thresholds.standard_threshold) return 'standard';        // ≥ 0.65
  if (trust_aggregate_score >= thresholds.hedged_threshold)   return 'hedged';          // 0.45–0.64
  return 'strongly_hedged';                                                              // < 0.45
}
```

`hedged` mode: include a "Does this feel right for your story?" prompt alongside the direction. `strongly_hedged` mode: include the prompt and reduce visual prominence of the direction (e.g., smaller header, explicit "this is a suggestion" framing).

---

## 4. Feature Specification

### 4.1 Feature groups

The trust model receives features from three sources: the selected candidate (output features), the reranker outputs (quality assessment signals), and the route calibration outputs (confidence signals).

### 4.2 Output-level features (from selected candidate)

| Feature | Source | Type | Description |
|---------|--------|------|-------------|
| `direction_specificity_score` | `nds_candidates.direction_specificity_score` | Float [0,1] | Specificity of selected direction line |
| `explanation_grounding_score` | `nds_candidates.explanation_grounding_score` | Float [0,1] | Grounding of explanation in essay |
| `scene_anchor_present` | `nds_candidates.scene_anchor_present` | Boolean | Concrete scene referenced |
| `indirect_signal_used` | `nds_candidates.indirect_signal_used` | Boolean | Indirect evidence used |
| `is_generic` | `nds_candidates.is_generic` | Boolean | Direction is generic |
| `is_premium` | `nds_candidates.is_premium` | Boolean | Direction uses premium framing |
| `is_contradiction` | `nds_candidates.is_contradiction` | Boolean | Direction contradicts essay |
| `word_count_direction` | `nds_candidates.word_count_direction` | Integer | Length of direction line |
| `word_count_explanation` | `nds_candidates.word_count_explanation` | Integer | Length of explanation |

### 4.3 Reranker-derived features (upstream quality signals)

| Feature | Source | Type | Description |
|---------|--------|------|-------------|
| `reranker_quality_score` | `nds_candidates.reranker_score` | Float [0,1] | Reranker's quality assessment |
| `reranker_false_premium_p` | `nds_candidates.reranker_false_premium_p` | Float [0,1] | Reranker's false premium signal |
| `reranker_flattening_risk_p` | `nds_candidates.reranker_flattening_risk_p` | Float [0,1] | Reranker's flattening signal |
| `reranker_best_candidate_p` | `nds_candidates.reranker_best_candidate_p` | Float [0,1] | P(this is best in set) |
| `no_good_candidate_score` | Run context | Float [0,1] | NGC detector score |
| `set_all_generic` | `nds_candidates.set_all_generic` | Boolean | All candidates were generic |

### 4.4 Route calibration features (confidence and routing signals)

| Feature | Source | Type | Description |
|---------|--------|------|-------------|
| `route_confidence` | `nds_runs.route_confidence` | Float [0,1] | Calibrated confidence in routing decision |
| `p_show` | Route model output | Float [0,1] | Calibrated P(show) |
| `p_clarify` | Route model output | Float [0,1] | Calibrated P(clarify) |
| `route_was_forced` | Override flag | Boolean | Route was set by a hard override rule |

### 4.5 Input context features

| Feature | Source | Type | Description |
|---------|--------|------|-------------|
| `input_specificity_score` | `nds_runs.input_specificity_score` | Float [0,1] | Input specificity |
| `input_surface_only` | `nds_runs.input_surface_only_flag` | Boolean | Input is surface-only |
| `input_has_indirect` | `nds_runs.input_has_indirect_signal` | Boolean | Input has indirect signal |
| `input_narrative_signal_count` | `nds_runs.input_narrative_signal_count` | Integer | Usable narrative signals |
| `input_word_count` | `nds_runs.input_word_count` | Integer | Word count |

### 4.6 Interaction features

| Feature | Derivation | Description |
|---------|-----------|-------------|
| `premium_x_low_input` | `is_premium AND input_specificity_score < 0.4` | Premium direction on thin input |
| `generic_x_high_input` | `is_generic AND input_specificity_score > 0.6` | Generic direction despite rich input |
| `low_grounding_x_high_confidence` | `explanation_grounding_score < 0.4 AND route_confidence > 0.75` | System confident but output is poorly grounded |
| `contradiction_x_shown` | `is_contradiction AND route_taken = 'show'` | Contradiction candidate was shown |
| `ngc_x_shown` | `no_good_candidate_score > 0.6 AND route_taken = 'show'` | NGC signal high but system showed anyway |
| `specificity_gap` | `direction_specificity_score - input_specificity_score` | Direction more/less specific than input warrants |

### 4.7 Feature engineering constraints

Same as `NDS_CANDIDATE_RERANKER_V1` §5.6:
1. No text features. No embeddings. No raw LLM output.
2. No features from `nds_human_labels` (label-free features only).
3. No features from `nds_product_outcomes` except as weak supervision labels (§8).
4. All features computable in real-time.

---

## 5. Training Data Requirements

### 5.1 Minimum dataset sizes

| Sub-model | Minimum labeled runs | Minimum positive class count |
|-----------|--------------------|-----------------------------|
| Student understood (binary) | 250 runs | 50 `untrusted` (`trust_verdict = 'untrusted'`) |
| Helpfulness (binary: helpful vs neutral/harmful) | 250 runs | 60 `harmful or neutral` |
| False premium classifier | 200 runs | 50 `false_premium_present = true` |
| Flattening risk classifier | 200 runs | 40 `student_voice_preserved = false` |
| Trust aggregate regression | 300 runs | 60 with `trust_aggregate_score < 0.5` |

### 5.2 Upstream model dependency

This model must be trained after both the reranker and route calibration model, because it uses both as inputs. The training dataset must contain:
- Reranker features computed (shadow or production deployment ≥ v1.0)
- Route calibration outputs (`route_confidence`, `p_show`, `p_clarify`) available for all training runs

If upstream model outputs are unavailable for older runs, those runs are excluded.

### 5.3 Weak supervision availability

Optionally, `nds_product_outcomes` signals may be used as weak supervision if at least 40% of training runs have sufficient outcome data (`is_sufficient_for_training = true`). See §8 for the integration spec.

---

## 6. Model Class and Architecture

### 6.1 Recommended model class: LightGBM (v1)

Same rationale as upstream models. Interpretability, fast inference, structured features, SHAP support.

```python
TRUST_MODEL_PARAMS = {
    "objective": "binary",
    "metric": "auc",
    "n_estimators": 200,
    "learning_rate": 0.04,
    "max_depth": 4,
    "num_leaves": 12,
    "min_child_samples": 8,
    "feature_fraction": 0.80,
    "bagging_fraction": 0.80,
    "bagging_freq": 5,
    "reg_alpha": 0.15,
    "reg_lambda": 0.15,
    "random_state": 42,
    "verbose": -1
}
```

Four separate binary classifiers, one per output. Trust aggregate score is computed post-prediction by the weighted formula in §2.2.

### 6.2 Neural encoder — future version consideration

A neural encoder (BERT-like, fine-tuned on direction line + explanation + essay excerpt) could materially improve prediction quality if text-level signals carry information that structured features do not capture.

**This is deferred to v2 or later, contingent on:**
1. Training dataset > 3000 labeled runs
2. Structured feature AUC plateau (v1 model ceases to improve with more data)
3. Explicit approval of text-feature policy by safety review
4. SHAP-based explanation of encoder outputs satisfying the interpretability requirement

The structured model must be exhausted first. Neural models introduce training cost, latency, and interpretability risk that are not justified before v1 is saturated.

---

## 7. Multi-Output Architecture

### 7.1 Why four separate models vs. one multi-output model

Four separate models are preferred for v1 because:
1. Each output has a different positive class rate, requiring independent threshold tuning.
2. The false premium and flattening classifiers may receive less label data than the trust and helpfulness classifiers. Separate models allow independent release gates.
3. Debugging is simpler: when `trust_aggregate_score` is low, feature importance from each individual model clarifies which component is driving the low score.

### 7.2 Shared feature matrix

All four models share the same feature extraction pipeline. The feature matrix is computed once and passed to all four models, avoiding redundant computation.

### 7.3 Independence assumption

The four models are trained independently. They do not share weights or loss functions. The trust aggregate score is a post-hoc combination.

This is an approximation — the four properties are correlated (a false premium direction is also likely flattening). However, for v1, the independence assumption is acceptable. A multi-task learning approach may be explored in v2 if the four-classifier approach shows systematic residual errors on correlated failure patterns.

---

## 8. Weak Supervision Integration

### 8.1 What weak supervision adds

Product outcome signals from `nds_product_outcomes` are noisy proxies for student trust and helpfulness. They are not used as direct training labels but as additional signal to weight training examples or as soft labels in a label smoothing approach.

### 8.2 Available weak supervision signals

| Signal | Direction | Use |
|--------|-----------|-----|
| `direction_accepted = true` | Positive trust signal | Mild upweight for `student_understood_score` training |
| `direction_rejected = true` | Negative trust signal | Mild upweight for low-trust class |
| `user_exit_after_nds = true` | Negative trust signal | Mild upweight for `helpfulness_score` negative class |
| `session_continued_after_nds = true` | Positive helpfulness signal | Mild upweight for `helpfulness_score` positive class |
| `essay_revised_after_nds = true` AND `revision_alignment_score > 0.6` | Strong positive helpfulness | Upweight for `helpfulness_score` positive class |

### 8.3 Weak supervision weighting policy

Weak supervision signals are applied as **sample weights**, not as labels. A run with a strong weak supervision signal in the same direction as its human label receives a higher training weight. A run where weak supervision and human label conflict is given a reduced weight (the human label takes precedence, but the conflict reduces confidence).

```python
def compute_sample_weight(human_label, weak_supervision_signal):
    if human_label is None:
        return 0.0  # exclude from training
    if weak_supervision_signal is None:
        return 1.0  # no adjustment
    if human_label == weak_supervision_signal:
        return 1.3  # signal agreement: mild upweight
    else:
        return 0.8  # signal conflict: mild downweight
```

Weak supervision must **never** be used as a substitute for human labels. Runs with no human label and only weak supervision signals are excluded from training.

### 8.4 Weak supervision availability gate

Weak supervision integration is only activated when:
- `is_sufficient_for_training = true` for ≥ 40% of the training dataset's runs
- The weak supervision pipeline has been audited for signal validity

If these conditions are not met, train without weak supervision (all weights = 1.0).

---

## 9. Training Configuration

### 9.1 Training sequence dependency

This model must be trained **after** both the reranker (v1.0+) and route calibration model (v1.0+). The training job must verify:
- Reranker features available in training dataset (all candidate rows have `reranker_score` populated)
- Route calibration outputs available in training dataset (all run rows have `route_confidence` populated)

### 9.2 Cross-validation strategy

Same as upstream models:
- Time-based train/test split (test = most recent 15% chronologically)
- 5-fold CV on training data, folded at session level
- Early stopping with validation AUC

### 9.3 Reproducibility

Same requirements as upstream models. Feature hash must include the trust model's feature list separately from the reranker's feature list (they share some features but are distinct feature sets).

---

## 10. Inference Spec (Serving)

### 10.1 Inference pipeline

```
Route calibration output received
    │
    ▼
Trust model feature vector assembled (§4.1–4.6)
    │
    ▼
4 LightGBM classifiers run in parallel:
  - student_understood_score
  - helpfulness_score
  - false_premium_risk_score
  - flattening_risk_score
    │
    ▼
trust_aggregate_score computed (weighted formula)
    │
    ▼
presentation_mode selected
    │
    ▼
TrustHelpfulnessOutput assembled
    │
    ▼
Presentation layer receives presentation_mode
Model outputs logged to nds_runs.model_config (async)
```

### 10.2 Latency budget

| Step | Budget |
|------|--------|
| Feature assembly | ≤ 5ms |
| 4-model parallel inference | ≤ 5ms |
| Score aggregation | ≤ 1ms |
| **Total trust model contribution** | **≤ 11ms** |

### 10.3 Fallback behavior

If the trust model is unavailable:
1. Log the error.
2. Set `trust_aggregate_score = null`.
3. Default `presentation_mode = 'standard'`.
4. Do NOT crash the NDS pipeline.

---

## 11. Evaluation Spec

### 11.1 Individual classifier metrics

| Classifier | Metric | Target (test set) |
|------------|--------|------------------|
| Student understood | AUC | ≥ 0.80 |
| Student understood | Precision at top-quartile low-trust predictions | ≥ 0.70 |
| Helpfulness | AUC | ≥ 0.78 |
| Helpfulness | F1 (harmful class) | ≥ 0.65 |
| False premium | AUC | ≥ 0.82 |
| False premium | Precision | ≥ 0.72 |
| Flattening risk | AUC | ≥ 0.78 |
| Flattening risk | Recall | ≥ 0.68 |

### 11.2 Trust aggregate metrics

| Metric | Target (test set) | Description |
|--------|------------------|-------------|
| AUC (trust ≥ 0.5 vs. < 0.5) | ≥ 0.80 | Discrimination between acceptable and low-trust outputs |
| Spearman correlation with human trust rating | ≥ 0.65 | Rank correlation between model scores and reviewer ratings |
| Low-trust precision (flag rate when score < 0.45) | ≥ 0.70 | When model flags low trust, reviewer agrees 70%+ |

### 11.3 Helpfulness-safety metric (critical)

**Harmful output detection rate:** Among all test-set outputs labeled `helpfulness_verdict = 'harmful'` by reviewers, what fraction does the model flag with `helpfulness_score < 0.4`?

Required: ≥ 65%

This is the safety analog to the reranker's FNR metric. Missing a harmful output — allowing it through at `presentation_mode = 'standard'` — is a trust violation.

### 11.4 Correlation with product outcomes

At evaluation time, compute the Spearman correlation between `trust_aggregate_score` and:
- `direction_accepted` rate (positive correlation expected: ≥ 0.25)
- `user_exit_after_nds` rate (negative correlation expected: ≤ -0.20)

If these correlations are near zero, the model is not capturing a signal that predicts actual student behavior. This is an advisory alert (not a hard gate) for v1, but becomes a release gate for v2.

---

## 12. Uses of Model Outputs

### 12.1 Presentation layer (real-time)

- `presentation_mode` drives visual and copy presentation of the direction
- `false_premium_flag = true`: may suppress certain visual treatments (e.g., do not use bold/highlight emphasis on premium-flagged direction lines)
- `flattening_flag = true`: may add a "Is this specific to you?" affordance

Presentation layer specifications are owned by the product team. This spec governs the model outputs — what those outputs drive in the UI is specified in a separate product spec.

### 12.2 Review queue prioritization

Runs where `trust_aggregate_score < 0.45` are auto-promoted to the high-value review tier in the workbench queue. This ensures that the trust model's identified failure cases receive human review, which feeds back into future training data.

### 12.3 Production monitoring

Weekly aggregates:
- Mean `trust_aggregate_score` across all `show` decisions
- 10th percentile `trust_aggregate_score` (low-end performance monitoring)
- `false_premium_flag` rate
- `flattening_flag` rate
- `trust_flag_low` rate

Alert thresholds:
- Mean `trust_aggregate_score` drops below 0.65 → review trigger
- `false_premium_flag` rate exceeds 20% → immediate review
- `flattening_flag` rate exceeds 25% → immediate review

### 12.4 Long-term: trust improvement signal

As product outcome data accumulates, the trust model's predictions can be validated against actual student engagement signals. High `trust_aggregate_score` should correlate with `direction_accepted = true` and `essay_revised_after_nds = true`. This correlation, tracked over time, is the primary product-level evidence that the trust model is capturing real signal.

---

## 13. Release Gates

| Gate | Condition |
|------|-----------|
| **G1: Minimum dataset size** | All minimums in §5.1 met |
| **G2: Upstream model dependency** | Reranker v1.0+ and route calibration v1.0+ deployed and features available |
| **G3: Student understood AUC** | ≥ 0.80 on test set |
| **G4: Helpfulness AUC** | ≥ 0.78 on test set |
| **G5: False premium AUC** | ≥ 0.82 on test set |
| **G6: Harmful output detection rate** | ≥ 65% of reviewer-labeled harmful outputs flagged |
| **G7: Trust aggregate AUC** | ≥ 0.80 on test set |
| **G8: Spearman correlation** | ≥ 0.65 between model scores and reviewer ratings |
| **G9: No regression** | No individual classifier AUC reduced by > 0.03 vs. previous version |
| **G10: Latency** | P95 inference ≤ 11ms |
| **G11: Shadow mode pass** | See §14 |

---

## 14. Shadow Mode Requirements

### 14.1 Shadow mode operation

Trust model runs in shadow mode before production deployment. At `presentation_mode = standard` (heuristic), trust model scores are computed for all `show` decisions. The model does not alter presentation. Scores are logged for analysis.

### 14.2 Shadow mode metrics

| Metric | Required value | Description |
|--------|---------------|-------------|
| Shadow `trust_flag_low` rate | ≤ 30% of show decisions | Model flags ≤ 30% as low-trust on live traffic |
| False premium shadow flag rate | ≤ 20% | False premium detected in ≤ 20% of shown outputs |
| Reviewer audit: low-trust agreement | ≥ 65% | When model flags low trust, reviewer agrees 65%+ of the time |
| Reviewer audit: standard-trust false alarm rate | ≤ 20% | Model flags low trust when reviewer rates as trusted ≤ 20% |
| Latency P95 | ≤ 11ms | Inference latency |

### 14.3 Shadow mode exit criteria

| Criterion | Required |
|-----------|----------|
| Shadow period duration | ≥ 7 calendar days |
| Shadow period run count | ≥ 500 live show decisions |
| Reviewer audit: low-trust agreement | ≥ 65% |
| False positive rate on trusted outputs | ≤ 20% |
| Latency P95 | ≤ 11ms |
| Harmful output detection rate on shadow period | ≥ 60% |

---

## 15. Failure Modes and Mitigations

| Failure mode | Description | Mitigation |
|-------------|-------------|------------|
| **Overfits to reviewer anchoring artifacts** | Reviewers have systematic biases (e.g., always flag short explanations as low-trust); model learns reviewer bias rather than actual trust signal | Calibration monitoring; reviewer drift detection; reviewer-stratified evaluation |
| **Trust score inflation** | Model predicts high trust for everything to minimize loss on majority class | Class weight correction; precision at top-quartile low-trust metric gates |
| **False premium over-triggering** | Model flags too many outputs as false premium, causing excessive hedged presentation | Shadow FPR gate; calibration of `false_premium_risk_score` |
| **Reranker feature leakage** | Trust model learns to shadow the reranker's signals rather than adding independent signal | Feature importance analysis: reranker features must not dominate all trust outputs |
| **Product outcome noise** | Weak supervision signals mislead training | Weak supervision only activated when 40%+ of runs have outcome data; weight adjustment is mild (1.3×/0.8×) |
| **Stale model** | Trust model trained before product changes (new copy, new UI) loses calibration | Monthly calibration check; alert if trust score distribution shifts significantly |

---

## 16. Future Evolution Path

### 16.1 V2 considerations

When training data exceeds 3000 labeled runs and structured features plateau, consider:

1. **Encoder component for direction line + explanation:** A fine-tuned text encoder that processes the direction line and explanation jointly. Combined with structured features via a late fusion architecture. Requires text-feature policy approval.

2. **Student-context personalization:** If per-student signals become available (writing history, grade level, prior NDS interactions), incorporate as input features to personalize trust predictions.

3. **Outcome-supervised fine-tuning:** Use the growing `nds_product_outcomes` dataset to fine-tune the model on actual student behavior after sufficient volume and quality validation.

4. **Multi-task learning:** Train the four classifiers jointly with shared representations to capture correlated failure modes (false premium + flattening) more efficiently.

### 16.2 The product moat

At full maturity, the trust and helpfulness model is the core of a defensible product moat:
- It is the only component trained specifically on the intersection of NDS outputs, student essay characteristics, and expert reviewer assessments of what makes college essay guidance genuinely helpful vs. superficially plausible.
- This combination of data cannot be easily replicated by a generic LLM: the LLM generates directions that sound plausible, but it does not have access to the labeled signal about when plausible directions actually help real students. This model has that signal.
- Every additional labeled case and every additional product outcome signal strengthens the moat without changing the model architecture.

---

*End of NDS_TRUST_AND_HELPFULNESS_MODEL_V1*
