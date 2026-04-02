# NDS Learned Judgment Shadow Mode — V1

**Document ID:** `NDS_LEARNED_JUDGMENT_SHADOW_MODE_V1`
**Status:** Specification
**Version:** 1.0
**Parent spec:** `NDS_LEARNED_JUDGMENT_SYSTEM_V1`
**Schema contract:** `NDS_LEARNED_JUDGMENT_DATA_SCHEMA_V1`
**Related specs:** `NDS_CANDIDATE_RERANKER_V1`, `NDS_ROUTE_CALIBRATION_MODEL_V1`, `NDS_TRUST_AND_HELPFULNESS_MODEL_V1`
**Last updated:** 2025-07

---

## Purpose

This document specifies the complete shadow mode protocol for the NDS learned judgment system. Shadow mode is the mechanism by which every trained model is tested against live production traffic before it is allowed to influence any student-facing decision.

Shadow mode is not a deployment phase to get through as quickly as possible. It is a required measurement phase that generates the evidence needed to make safe production deployment decisions. The data produced in shadow mode — model scores, comparison decisions, reviewer audits, anomaly events — is itself a valuable training signal for the next model version.

This spec governs the full lifecycle: what shadow mode means for each model, how models transition through influence phases, what metrics trigger promotion or halt, and what the rollback protocol is if a production model shows performance degradation.

---

## Table of Contents

1. [Shadow Mode Philosophy](#1-shadow-mode-philosophy)
2. [Shadow Mode Architecture](#2-shadow-mode-architecture)
3. [Influence Phases](#3-influence-phases)
4. [Per-Model Shadow Requirements Summary](#4-per-model-shadow-requirements-summary)
5. [Shadow Metrics Specification](#5-shadow-metrics-specification)
6. [Reviewer Audit Protocol](#6-reviewer-audit-protocol)
7. [Anomaly Detection and Alerting](#7-anomaly-detection-and-alerting)
8. [Promotion Protocol (Shadow → Production)](#8-promotion-protocol-shadow--production)
9. [Rollback Protocol](#9-rollback-protocol)
10. [Shadow Mode Logging Spec](#10-shadow-mode-logging-spec)
11. [Production Monitoring (Post-Promotion)](#11-production-monitoring-post-promotion)
12. [Model Influence Phase Governance](#12-model-influence-phase-governance)

---

## 1. Shadow Mode Philosophy

### 1.1 The core commitment

Every model trained in the learned judgment system runs in shadow mode before it influences a single student-facing decision. This is not a formality — it is an empirical check that the model behaves correctly on live production traffic, which is always at least partially out-of-distribution relative to the labeled training data.

Shadow mode answers three questions that offline evaluation cannot:

1. **Distribution question:** Does the model's behavior on live traffic match its behavior on the test set? If not, the training data is unrepresentative of production.
2. **Rate question:** How often does the model disagree with current system behavior? A model that agrees 99% of the time is probably learning the heuristic, not the ground truth. A model that disagrees 80% of the time is likely overfitted to failure cases.
3. **Quality question:** When the model disagrees with the current system, is it right? This requires human review of sampled disagreement cases — it cannot be answered without a reviewer audit.

### 1.2 Shadow mode is not neutral

Running models in shadow mode has costs:
- Inference latency is added to every live NDS call (the model runs even though its output is not used)
- Engineering resources are required to build and maintain the shadow pipeline
- Reviewer time is consumed by shadow audit cases

These costs are justified because the alternative — deploying untested models to production — introduces trust risks that can damage student outcomes at scale. Shadow mode costs are bounded and predictable; deployment trust damage is unbounded.

### 1.3 What "shadow mode" means precisely

A model is in shadow mode when:
- `nds_training_snapshots.shadow_only = true` for this model version
- The model runs at inference time and produces predictions
- The predictions are logged to `nds_runs.model_config` (JSONB)
- The predictions do **not** affect the routing decision, candidate selection, or presentation shown to the student
- The predictions are available for analysis, comparison, and reviewer audit

A model exits shadow mode and enters production influence when:
- `nds_training_snapshots.shadow_only = false`
- The model's predictions are used in the decision pipeline at the influence level specified for its current phase

---

## 2. Shadow Mode Architecture

### 2.1 Shadow execution flow

```
NDS invocation for student session
    │
    ▼
[Standard heuristic / previous-model pipeline runs]
[Produces: routing decision, candidate selection, trust assessment]
    │
    ▼
[Shadow model pipeline runs in parallel]
[Produces: shadow scores for each model in shadow mode]
    │
    ▼
[Comparison object assembled]
  - heuristic_route vs. shadow_route
  - heuristic_selected_candidate vs. shadow_selected_candidate
  - heuristic_trust_assessment vs. shadow_trust_assessment
    │
    ▼
[Student sees: heuristic output] ← shadow has NO effect on what student sees
    │
    ▼
[Comparison object logged to shadow_log table (see §10)]
    │
    ▼
[Anomaly detection runs] (async, post-session)
[Comparison events sampled into reviewer audit queue]
```

### 2.2 Latency constraint for shadow execution

The shadow pipeline must not add more than 80ms to the total NDS latency budget. Shadow execution is run as a fire-and-forget background task where possible. If the shadow model is running significantly over budget, it is terminated and a `shadow_timeout` event is logged (not an error that fails the user's session).

### 2.3 Isolation requirement

Shadow model predictions must not influence each other across sessions. Each shadow run is fully isolated — no shared state, no caching of scores across requests.

---

## 3. Influence Phases

Models do not jump directly from shadow mode to full production influence. They progress through four influence phases. Each phase requires passing the metrics defined in §4 before advancing.

### Phase 1: Shadow (advisory)

**Description:** Model runs fully in shadow. Outputs are logged and analyzed but have zero product effect.

**Purpose:** Validate distribution alignment, agreement rates, and anomaly-free operation.

**Duration:** Minimum 7 days, minimum 500 live runs, all shadow metrics must pass.

**Product effect:** None.

**Advancement criteria:** See §4 per-model requirements.

---

### Phase 2: Soft influence

**Description:** Model outputs are used to adjust presentation layer signals only. Specifically:
- Trust model's `presentation_mode` influences the UI affordance shown to the student
- Reranker's candidate ranking may reorder the internal candidate list (though the product only shows one candidate, the reranker winner is used)
- Route calibration model's output is logged but does NOT yet change routing decisions

**Purpose:** Validate model behavior in the product loop without affecting routing (the highest-stakes decision).

**Duration:** Minimum 14 days, minimum 1000 live runs.

**Product effect:** Presentation layer changes (hedging affordance, "does this feel right?" prompt on low-trust outputs).

**Advancement criteria:** No adverse product metrics (rejection rate, re-generation rate, exit rate) increase by more than 5% vs. baseline period. Trust flag rate is in expected range (15–30% of show decisions).

---

### Phase 3: Selective production influence

**Description:** Model outputs begin affecting routing decisions in a controlled subset of cases:
- Route calibration model's route is used when the model is **highly confident** and **disagrees with the heuristic in the direction of clarify**. Specifically: when model says `clarify` with `p_clarify > 0.80` and the heuristic says `show`.
- Reranker winner is used as the production selected candidate (previously only advisory).
- Trust model operates fully in presentation layer.

**Purpose:** Validate routing changes in the highest-confidence disagreement cases, where the model's signal is most reliable.

**Duration:** Minimum 21 days, minimum 2000 live runs.

**Product effect:** A fraction of `show` decisions become `clarify` decisions. This is the first category of direct routing influence.

**Advancement criteria:**
- Among cases where phase 3 routing overrode heuristic: reviewer audit shows override was correct ≥ 70% of the time (50-case audit)
- No regression in overall session continuation rate
- No increase in support/help-seeking events

---

### Phase 4: Primary influence

**Description:** Model is the primary decision-maker for all routing, candidate selection, and trust assessment. Heuristic operates as fallback only.

**Purpose:** Full production deployment.

**Duration:** Ongoing (no expiry). Continuous monitoring per §11.

**Product effect:** Model drives all NDS decisions for sessions in scope.

**Advancement criteria:** All Phase 3 criteria sustained over the Phase 3 period, plus a formal release review (§8).

---

## 4. Per-Model Shadow Requirements Summary

### 4.1 Candidate Reranker

Full shadow requirements are specified in `NDS_CANDIDATE_RERANKER_V1` §14. Summary:

| Requirement | Value |
|-------------|-------|
| Shadow duration (minimum) | 7 days |
| Shadow run count (minimum) | 500 live runs |
| NGC flag rate | ≤ 35% of live runs |
| NGC false positive estimate (reviewer audit) | ≤ 30% (50-case audit) |
| Reranker winner improvement rate (reviewer audit) | ≥ 60% of winner-change cases (50-case audit) |
| Latency P95 | ≤ 35ms |

Advancement path: Phase 1 → Phase 2 (reranker winner used in soft influence) → Phase 4 (reranker winner is production selection).

Note: The reranker does not have a Phase 3 of its own — its influence is either soft (advisory ranking) or full (production selection). The Phase 3 gating applies at the system level, not per-model.

---

### 4.2 Route Calibration Model

Full shadow requirements are specified in `NDS_ROUTE_CALIBRATION_MODEL_V1` §15. Summary:

| Requirement | Value |
|-------------|-------|
| Shadow duration (minimum) | 7 days |
| Shadow run count (minimum) | 500 live runs |
| Clarify improvement rate (reviewer audit) | ≥ 65% (cases where model clarifies but heuristic shows) |
| Latency P95 | ≤ 10ms |
| ECE on shadow period | ≤ 0.10 |
| No regression in routing accuracy vs. heuristic | Model accuracy ≥ heuristic on labeled shadow cases |

Advancement path: Phase 1 → Phase 2 (calibrated confidence logged only) → Phase 3 (high-confidence clarify overrides applied) → Phase 4 (primary routing decision-maker).

---

### 4.3 Trust and Helpfulness Model

Full shadow requirements are specified in `NDS_TRUST_AND_HELPFULNESS_MODEL_V1` §14. Summary:

| Requirement | Value |
|-------------|-------|
| Shadow duration (minimum) | 7 days |
| Shadow run count (minimum) | 500 live show decisions |
| Low-trust flag rate | ≤ 30% of show decisions |
| False premium shadow rate | ≤ 20% |
| Reviewer audit: low-trust agreement | ≥ 65% |
| Reviewer audit: false alarm rate on trusted outputs | ≤ 20% |
| Latency P95 | ≤ 11ms |
| Harmful output detection on shadow period | ≥ 60% |

Advancement path: Phase 1 → Phase 2 (presentation layer adjustments active) → Phase 4 (full trust-driven presentation; no Phase 3 for trust model since it never changes routing).

---

## 5. Shadow Metrics Specification

### 5.1 Winner-change rate (reranker)

**Definition:** The fraction of shadow runs where the reranker would select a different candidate than the heuristic's rank-1 selection.

**Formula:** `n(reranker_selected_candidate_id ≠ heuristic_selected_candidate_id) / n(total shadow runs)`

**Expected range at v1 launch:** 15–35%

- Below 15%: model is too conservative / too similar to heuristic → investigate feature importance, ensure NGC signal is present
- Above 35%: model may be over-correcting or training data is unrepresentative → review label distribution, check for class imbalance

---

### 5.2 NGC flag rate (no-good-candidate detector)

**Definition:** The fraction of shadow runs where the NGC detector fires (`no_good_candidate_flag = true`).

**Formula:** `n(no_good_candidate_flag = true) / n(total shadow runs)`

**Expected range:** 15–35%

- Above 35%: detector is too aggressive — review threshold and FPR
- Below 15%: detector may be too conservative — review class weight settings

---

### 5.3 Routing disagreement rate (route calibration model)

**Definition:** The fraction of shadow runs where the route calibration model would choose a different route than the current system.

**Formula:** `n(shadow_route ≠ current_route) / n(total shadow runs)`

**Expected range:** 15–30%

Broken down by direction:
- `shadow_clarify_where_show`: Model says clarify, heuristic shows. This is the key correction direction.
- `shadow_show_where_clarify`: Model says show, heuristic clarifies. More cautious about this direction.
- `shadow_block_where_show`: Model says block, heuristic shows. Most sensitive — requires reviewer audit before acting on.

---

### 5.4 Trust score distribution (trust model)

**Key distribution metrics to track:**

| Metric | Expected range |
|--------|---------------|
| Mean `trust_aggregate_score` on show decisions | 0.60–0.80 |
| 10th percentile `trust_aggregate_score` | ≥ 0.35 |
| `trust_flag_low` rate | 10–30% |
| `false_premium_flag` rate | 5–20% |
| `flattening_flag` rate | 5–25% |

---

### 5.5 Agreement comparison with reviewer labels

**Definition:** For all shadow cases that receive human review labels during the shadow period, compare the shadow model predictions to the reviewer's labels.

This is the most important shadow metric — it directly measures whether the model's predictions align with human judgment on live data.

| Comparison | Minimum agreement |
|-----------|------------------|
| NGC flag vs. reviewer `no_good_candidate` | ≥ 80% |
| Shadow route vs. reviewer `route_correct_would_be` | ≥ 72% |
| Trust flag vs. reviewer `trust_verdict = untrusted` | ≥ 65% |

---

## 6. Reviewer Audit Protocol

### 6.1 Purpose of shadow reviewer audits

The reviewer audit is the single most important validation step in shadow mode. It answers the question: when the model disagrees with the current system, who is right?

This cannot be answered from logged data alone — it requires a human reviewer to look at the specific case, understand the disagreement, and render a judgment.

### 6.2 Audit sampling strategy

During the shadow period, the following cases are automatically added to a shadow audit queue in the review workbench:

| Sample | Count per week | Priority |
|--------|---------------|----------|
| Cases where reranker would change winner | 25 | High |
| Cases where NGC fires | 20 | High |
| Cases where route calibration model says clarify but heuristic shows | 25 | High |
| Cases where trust model flags low trust | 15 | Standard |
| Cases where all three models agree with current system (control) | 10 | Standard |

**Control sample is required.** Without control cases (where models and current system agree), the audit cannot assess false positive rates. A reviewer audit that samples only disagreement cases cannot measure whether the model is over-correcting.

### 6.3 Audit review form

Audit reviews use a simplified version of the standard label form. The reviewer is shown:
1. The student input (standard presentation)
2. The current system's output (what the student actually saw)
3. What the shadow model would have done differently (without showing which is the "model" vs. "current system" — blinded comparison)

The reviewer is asked:
- **Which decision is better?** (Option A / Option B / About equal / Cannot tell)
- **Why?** (Free text, optional)
- **Confidence:** (High / Medium / Low)

The blinding is critical. Reviewers must not know which option is the model's and which is the current system's. This prevents anchoring on the "new model must be better" assumption.

### 6.4 Audit result aggregation

After each audit batch:
1. Compute the fraction of cases where reviewers prefer the model's decision over the current system's.
2. Compute the fraction of control cases where reviewers prefer Option A (current system) — should be approximately 50% under a blind comparison if model/system are comparable.
3. If the control preference rate deviates significantly from 50%, investigate reviewer anchoring.

**Minimum audit case counts before shadow period can close:**
- Reranker winner comparison: ≥ 50 reviewed cases
- Route calibration comparison: ≥ 50 reviewed cases
- Trust assessment comparison: ≥ 30 reviewed cases

---

## 7. Anomaly Detection and Alerting

### 7.1 What anomaly detection monitors

The shadow monitoring pipeline runs continuously on logged shadow data and alerts on the following conditions:

| Anomaly | Condition | Severity |
|---------|-----------|----------|
| **NGC rate spike** | `no_good_candidate_flag` rate > 50% in any 6-hour window | High |
| **Route disagreement spike** | Shadow routing disagreement rate > 50% in any 12-hour window | High |
| **Trust score collapse** | Mean `trust_aggregate_score` < 0.45 for any 500-run window | High |
| **Latency regression** | Shadow inference latency P95 > 2× budget for 1 hour | High |
| **Feature distribution shift** | Any key feature mean shifts > 2σ from training distribution | Medium |
| **Label mismatch flag** | Model-vs-reviewer agreement drops below 60% on a 20-case audit batch | High |
| **Override rate spike** | Any hard override rule firing > 40% of runs | Medium |
| **All-model-agreement breakdown** | Agreement between all three shadow models drops below 50% | Medium |

### 7.2 Alert response protocol

**High severity:**
- Automatic pause of shadow mode advancement (no models may advance to the next influence phase during an active high-severity alert)
- Immediate notification to the model owner and product quality owner
- Required response within 24 hours: either resolve the alert or escalate to a shadow mode halt (models stop computing shadow predictions until resolved)

**Medium severity:**
- Notification to model owner
- Required review within 72 hours
- No automatic pause of advancement, but the alert must be resolved before a promotion review (§8) can proceed

### 7.3 Shadow halt protocol

A shadow halt is a stronger action than a pause: all shadow-mode models stop computing predictions, and no new shadow runs are ingested into the review queue. Shadow halt is triggered when:
- A high-severity alert is unresolved after 24 hours
- Two or more high-severity alerts are active simultaneously
- Reviewer audit shows model-vs-reviewer agreement < 55% on a 50-case batch

To resume shadow mode after a halt: a written root cause analysis is required, the triggering condition must be resolved, and the model owner must explicitly re-enable shadow mode.

---

## 8. Promotion Protocol (Shadow → Production)

### 8.1 Promotion review requirements

Before a model advances from Phase 1 to any higher influence phase, a formal promotion review must be conducted. The review must be documented and signed off by the model owner and a second reviewer.

The promotion review document must contain:

1. **Shadow period summary:** Duration, run count, all shadow metric values vs. targets.
2. **Reviewer audit summary:** Audit case counts, preference rates, reviewer agreement rates, blinded comparison results.
3. **Anomaly history:** Any alerts that fired during the shadow period and how they were resolved.
4. **Distribution comparison:** Feature distribution plots (training vs. shadow period). Key features: `input_specificity_score`, `direction_specificity_score`, `no_good_candidate_score`.
5. **Decision:** Promote / Do not promote / Promote with modifications.
6. **If modifications:** Description of threshold adjustments, override rule changes, or other modifications applied before promotion.

### 8.2 Promotion sign-off requirements

| Phase transition | Required sign-offs |
|-----------------|-------------------|
| Phase 1 → Phase 2 | Model owner |
| Phase 2 → Phase 3 | Model owner + product quality owner |
| Phase 3 → Phase 4 | Model owner + product quality owner + engineering lead |

Phase 4 (full production influence) is the highest-stakes transition. It requires three sign-offs and cannot be executed when any active alert exists.

### 8.3 Promotion execution

```
Promotion review approved
    │
    ▼
Update nds_training_snapshots:
  - shadow_only = false
  - released_at = now()
  - release_notes = promotion review summary
    │
    ▼
Deploy NDS engine with updated model config:
  - model influence phase set to new level
  - threshold_config loaded from nds_training_snapshots
    │
    ▼
Monitor live metrics for 48 hours (post-promotion watch period):
  - Routing distribution (show/clarify/block rates)
  - NGC flag rate
  - Trust flag rate
  - Session continuation rate
  - Re-generation rate
    │
    ▼
If any metric moves out of expected range during 48-hour watch:
  → trigger rollback (§9)
```

---

## 9. Rollback Protocol

### 9.1 When rollback is required

Rollback is required when any of the following conditions are met after production deployment:

| Condition | Rollback trigger |
|-----------|-----------------|
| Session continuation rate drops by > 5% vs. baseline (48-hour watch) | Required |
| Re-generation rate (user requests new direction) increases by > 15% | Required |
| `trust_flag_low` production rate exceeds 40% | Required |
| Routing distribution shifts: `clarify` rate exceeds 50% of show-eligible runs | Required |
| P95 inference latency exceeds 2× budget | Required |
| Reviewer production audit shows model-vs-human agreement < 60% (20-case spot check) | Required |
| Any model error rate exceeds 0.5% of live requests | Required |

### 9.2 Rollback procedure

```
Rollback trigger identified
    │
    ▼
Notify model owner and engineering lead immediately
    │
    ▼
Execute rollback:
  1. Revert NDS engine model config to previous version
  2. Deploy previous model version (artifact path from previous nds_training_snapshots row)
  3. Verify previous behavior restored by checking live metrics (within 15 minutes)
    │
    ▼
Shadow the rolled-back new model version (set shadow_only = true)
    │
    ▼
Investigate root cause (required within 48 hours):
  - Compare live distribution to training distribution
  - Review anomaly logs
  - Pull sample cases triggering the problem metric
  - Identify whether issue is model error, threshold error, feature drift, or product change
    │
    ▼
Write rollback post-mortem document:
  - Trigger condition and timeline
  - Root cause
  - Fix plan
  - Shadow period plan for re-deployment
```

### 9.3 Rollback readiness requirements

Before **any** model is promoted to any production influence phase:
1. The previous model artifact must be retained in storage (minimum 30 days)
2. The rollback procedure must be documented
3. The rollback procedure must have been tested in a staging environment within the last 30 days
4. The estimated rollback execution time must be ≤ 15 minutes

Rollback readiness is a hard requirement for Phase 3 and Phase 4 promotions.

---

## 10. Shadow Mode Logging Spec

### 10.1 Shadow log table

```sql
CREATE TABLE nds_shadow_logs (
  log_id              UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id              UUID          NOT NULL REFERENCES nds_runs(run_id),
  logged_at           TIMESTAMPTZ   NOT NULL DEFAULT now(),

  -- Which model versions are active in shadow for this run
  reranker_model_version      TEXT,
  route_model_version         TEXT,
  trust_model_version         TEXT,

  -- Reranker shadow outputs
  shadow_selected_candidate_id UUID REFERENCES nds_candidates(candidate_id),
  shadow_no_good_candidate_score NUMERIC(5,4),
  shadow_no_good_candidate_flag  BOOLEAN,
  reranker_winner_changed        BOOLEAN,   -- true if shadow selects different candidate than heuristic

  -- Route calibration shadow outputs
  shadow_route              TEXT,           -- 'show' | 'clarify' | 'block'
  shadow_p_show             NUMERIC(5,4),
  shadow_p_clarify          NUMERIC(5,4),
  shadow_p_block            NUMERIC(5,4),
  shadow_route_confidence   NUMERIC(5,4),
  route_decision_changed    BOOLEAN,        -- true if shadow route ≠ current system route
  route_change_direction    TEXT,           -- 'show_to_clarify' | 'clarify_to_show' | 'other'

  -- Trust model shadow outputs
  shadow_student_understood   NUMERIC(5,4),
  shadow_helpfulness          NUMERIC(5,4),
  shadow_false_premium_p      NUMERIC(5,4),
  shadow_flattening_p         NUMERIC(5,4),
  shadow_trust_aggregate      NUMERIC(5,4),
  shadow_trust_flag_low       BOOLEAN,
  shadow_presentation_mode    TEXT,         -- 'standard' | 'hedged' | 'strongly_hedged'
  trust_presentation_changed  BOOLEAN,      -- true if shadow presentation ≠ current mode

  -- Comparison flags
  all_models_agree_with_current BOOLEAN,   -- true if all shadow models agree with current system

  -- Audit queue
  audit_queue_added   BOOLEAN NOT NULL DEFAULT false,
  audit_priority      TEXT,   -- 'high' | 'standard' | null

  CONSTRAINT shadow_route_valid CHECK (
    shadow_route IS NULL OR shadow_route IN ('show', 'clarify', 'block')
  )
);
```

### 10.2 Retention policy

`nds_shadow_logs` rows are retained for 90 days. After 90 days, rows are archived to cold storage. Rows from shadow periods that led to production deployments are retained indefinitely for reproducibility.

### 10.3 Anonymization

`nds_shadow_logs` contains no PII beyond what is already in `nds_runs`. The `run_id` foreign key is the only student linkage. Shadow log analysis must respect the same access controls as `nds_runs`.

---

## 11. Production Monitoring (Post-Promotion)

### 11.1 Live metrics dashboard (computed weekly)

After models are deployed to Phase 4 (primary influence), the following metrics are tracked on a weekly basis:

| Metric | Expected range | Alert threshold |
|--------|---------------|----------------|
| Route distribution: `show` % | 60–75% of eligible runs | < 55% or > 85% |
| Route distribution: `clarify` % | 20–30% | > 40% |
| NGC flag rate | 15–35% | > 40% |
| Mean `trust_aggregate_score` | 0.60–0.80 | < 0.55 |
| `false_premium_flag` rate | 5–20% | > 25% |
| Session continuation rate after NDS | Baseline ± 3% | Drop > 5% from baseline |
| Re-generation rate | Baseline ± 10% | Increase > 15% from baseline |
| Reranker winner-change rate | 15–35% | > 45% or < 8% |
| Override rule fire rate (force_clarify_ngc) | < 25% | > 35% |
| Model fallback rate (when model is unavailable) | < 1% | > 2% |

### 11.2 Monthly full evaluation

Every 30 days after Phase 4 deployment:
1. Pull all new labeled runs from the past 30 days.
2. Compute model accuracy (routing, NGC, trust) on newly labeled runs.
3. Compare to the metrics at the time of Phase 4 deployment.
4. If any metric drops by > 5 percentage points vs. deployment baseline: trigger a re-training assessment (evaluate whether a new model version is needed).

### 11.3 Calibration monitoring

Monthly: compute ECE for the route calibration model on the most recently labeled 100 runs. If ECE exceeds 0.12: trigger re-calibration. If ECE exceeds 0.15: trigger full re-training.

### 11.4 Production reviewer spot-checks

Monthly: sample 20 live production decisions and send to the review workbench as spot-check cases. Compute model-vs-reviewer agreement. Required: ≥ 70% agreement. If below 70%: investigate and consider shadow mode reset.

---

## 12. Model Influence Phase Governance

### 12.1 Current phase tracking

All model phase states are tracked in `nds_training_snapshots` and in a `nds_model_phase_log` table:

```sql
CREATE TABLE nds_model_phase_log (
  log_id          UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  snapshot_id     UUID          NOT NULL REFERENCES nds_training_snapshots(snapshot_id),
  model_type      TEXT          NOT NULL,
  from_phase      INTEGER       NOT NULL,  -- 1, 2, 3, or 4
  to_phase        INTEGER       NOT NULL,
  transitioned_at TIMESTAMPTZ   NOT NULL DEFAULT now(),
  approved_by     TEXT          NOT NULL,  -- reviewer identity
  promotion_doc_path TEXT,                 -- path to promotion review document
  notes           TEXT
);
```

### 12.2 Phase state invariants

At any time, the following invariants must hold:

1. **The trust model cannot be in a higher phase than the reranker.** The trust model uses reranker outputs — it cannot be in production if the reranker is still advisory.
2. **The route calibration model cannot be in Phase 3 or 4 if the reranker is in Phase 1.** Route calibration depends on reranker outputs.
3. **No model can be in Phase 4 if any high-severity alert is active.**
4. **All model versions in Phase 2+ must have a completed reviewer audit on file (at least 50 cases).**

### 12.3 Rollback of phase

A model may be rolled back to a lower phase (without full model version rollback) when:
- A metric breach triggers a concern but not an immediate rollback
- The model owner elects to reduce influence while investigating

Phase rollback is cheaper than version rollback — it reduces the model's influence scope without changing the underlying model artifact. Phase rollback is always available as a mitigation action.

### 12.4 Multi-model promotion coordination

When multiple models are promoted in the same deployment window:
- All models must have completed their Phase 1 shadow requirements independently
- The combined effect on routing and presentation must be evaluated jointly, not just per-model
- A joint promotion review is required (not separate per-model reviews)
- The 48-hour post-promotion watch period applies to the combined deployment

Joint promotions are discouraged for Phase 3 and Phase 4 transitions. Prefer sequential promotion (reranker first, then route calibration, then trust) to isolate which model's behavior drives any post-deployment changes.

---

*End of NDS_LEARNED_JUDGMENT_SHADOW_MODE_V1*
