# NDS LEARNED JUDGMENT SYSTEM V1

**Workstream:** Narrative Direction Selection — Learned Judgment Layer
**Status:** Foundational system spec · High-leverage product moat
**Created:** 2026-03-17

---

## 1. PURPOSE

This document specifies the learned judgment layer for the Narrative Direction Selection (NDS) engine.

The current NDS stack is a hardened heuristic system: candidate generation, rule/validator filtering, structured scoring, route logic, and explanation generation. It performs well on the core curated distribution and has been battle-tested across multiple hardening sprints.

The residual failures it cannot close are:

- **Candidate generation misses** — no good candidate is produced for weak-note, family-duty, culturally indirect, or contradiction inputs.
- **False-premium confidence** — polished-but-empty inputs receive a premature winner instead of clarification or block.
- **Indirect hinge underread** — real narrative centers expressed through duty, understated action, or indirect phrasing are missed.
- **Careful-but-unhelpful route decisions** — a strong enough candidate exists but over-caution forces an unnecessary clarification.
- **Explanation-layer amplification** — weak candidates produce explanations that make the failure worse.

These failures share a structural property: they require **judgment that generalizes from examples**, not just rules applied to features.

This spec defines how to build that judgment layer.

---

## 2. CORE ARCHITECTURE PRINCIPLE

**LLM writes. Learned system judges.**

| Layer | Owner | Responsibilities |
|---|---|---|
| **LLM** | Generation | Produce candidate directions, evidence-grounded explanations, clarification questions, structured output text |
| **Learned judgment** | Ranking and calibration | Rank candidate quality, detect no-good-candidate situations, decide route, detect false-premium and flattening risk, estimate trust, improve from reviewer and product signals |

The learned layer sits **above** raw generation. It does not replace generation. It decides what to do with what generation produces.

This constraint is non-negotiable. An end-to-end black-box replacing the full pipeline would sacrifice auditability, stability, and the ability to trace and repair failures.

---

## 3. PRODUCT OBJECTIVE

The learned judgment system must materially improve:

- Candidate selection quality
- Routing quality (show vs clarify vs block)
- Trust calibration (false confidence reduction)
- Distribution-shift robustness
- Student-feeling-understood outcomes
- Consistency across difficult inputs

Without regressing:

- Evidence grounding
- Direction line fit
- Stability and reproducibility
- Flow integrity
- Screen trust

All improvements must be measured against the existing hardened evaluation suite and the distribution-shift evaluation protocol before any production influence is enabled.

---

## 4. SYSTEM SCOPE

| Component | Section | Summary |
|---|---|---|
| Gold-label system | §8 | How cases, candidates, routes, and outputs are labeled |
| Training data model | §10 | How reviewer and product signals are stored |
| Candidate reranker | §12.1 | Model that selects the best candidate or detects no-good-candidate situations |
| Route/calibration model | §12.3 | Model that decides show / clarify / block |
| Trust and usefulness model | §12.4 | Model that predicts false-premium, flattening, and student-understood risk |
| Evaluation and release gates | §18 | Metrics, thresholds, and promotion criteria |

Child specs:
- [NDS_LEARNED_JUDGMENT_DATA_SCHEMA_V1.md](NDS_LEARNED_JUDGMENT_DATA_SCHEMA_V1.md)
- [NDS_REVIEW_LABELING_WORKBENCH_V1.md](NDS_REVIEW_LABELING_WORKBENCH_V1.md)
- [NDS_CANDIDATE_RERANKER_V1.md](NDS_CANDIDATE_RERANKER_V1.md)
- [NDS_ROUTE_CALIBRATION_MODEL_V1.md](NDS_ROUTE_CALIBRATION_MODEL_V1.md)
- [NDS_TRUST_AND_HELPFULNESS_MODEL_V1.md](NDS_TRUST_AND_HELPFULNESS_MODEL_V1.md)
- [NDS_LEARNED_JUDGMENT_SHADOW_MODE_V1.md](NDS_LEARNED_JUDGMENT_SHADOW_MODE_V1.md)

---

## 5. NON-NEGOTIABLE RULES

**Rule 1 — No end-to-end black box.**
Do not replace the full NDS pipeline with a single generative or ranking model. The architecture must remain decomposed.

**Rule 2 — Learned layer operates on structured objects.**
The learned models take structured candidate objects and structured route context as inputs. They do not receive raw input text as their only signal.

**Rule 3 — Every decision must be auditable.**
Every learned model decision must produce inspectable fields: what won, why it won, which risk signals were active, what route was chosen, and what confidence was assigned.

**Rule 4 — Improve product truthfulness, not just benchmark scores.**
A model that improves benchmark pass rates by memorizing evaluation-set patterns but hurts real user trust is a failure condition.

**Rule 5 — Never become a pure style detector.**
The learned system must capture narrative judgment — does this candidate reveal a real center, does this student feel seen — not just surface polish preference.

---

## 6. TARGET FAILURE CLASSES

These are the highest-value targets for the learned system. All have been confirmed by the attribution triage:

| Failure class | Attribution share | Residual count |
|---|---|---|
| Candidate generation miss | 63.6% of high-risk residuals | 7/11 |
| Trust calibration failure (false-premium) | 27.3% | 3/11 |
| Routing over-caution | 9.1% | 1/11 |

The full residual behavioral pattern table, in priority order:

1. `no_good_candidate_situation` — input class has no recoverable winner
2. `indirect_hinge_underread` — real center present but not in candidate set
3. `false_premium_confidence` — polished surface without grounded scene
4. `careful_but_unhelpful_output` — strong candidate suppressed by over-caution
5. `parent_overwritten_adult_shaped` — adult-edited prose treated as strong evidence
6. `culturally_indirect_narrative_underread` — duty-shaped, understated, collective-framing inputs
7. `weak_note_latent_signal_underrecovery` — thin notes where a real story exists but is not recovered
8. `contradiction_overcommitment` — multi-center input flattened to a single generic winner

---

## 7. CURRENT vs TARGET ARCHITECTURE

### 7.1 Current baseline system

```
input normalization
  → candidate generation
  → rule / validator filtering
  → heuristic scoring / reranking
  → route decision
  → explanation generation
  → UI presentation
```

### 7.2 Target learned system

```
input normalization
  → candidate generation
  → rule / validator filtering
  → LEARNED: candidate-quality scoring         ← Phase 3
  → LEARNED: no-good-candidate detection       ← Phase 3
  → LEARNED: route / calibration decision      ← Phase 4
  → explanation generation (from selected)
  → LEARNED: trust / usefulness prediction     ← Phase 5
  → UI presentation
  ↑
  └── reviewer + product feedback loop
        into training data                      ← Phase 1–2
```

The heuristic scoring layer remains as a fallback and guardrail at all phases.

---

## 8. GOLD-LABEL SYSTEM SPEC

The gold-label system is the most important part of the entire learned system. A shallow or inconsistent gold set will poison every downstream model.

### 8.1 Labeling unit hierarchy

| Level | What it labels |
|---|---|
| Case | The full input, its class, and the correct action for this run |
| Candidate | Each generated direction candidate individually |
| Route | The show/clarify/block decision and its quality |
| Output | What the student receives and whether it is trustworthy and useful |

### 8.2 Required case-level labels

| Field | Values |
|---|---|
| `case_id` | run identifier |
| `input_distribution_class` | `weak_student_low_skill` / `parent_overwritten_adult_shaped` / `over_polished_hollow` / `contradictory_multi_center` / `culturally_indirect_non_default` / `achievement_stacked_emotionally_thin` / `messy_real_style_note_dump` / `strong_grounded_curated` |
| `expected_best_action` | `show` / `clarify` / `block` |
| `actual_best_action` | `show` / `clarify` / `block` |
| `case_quality_band` | `strong` / `recoverable` / `weak` / `truly_insufficient` |
| `contains_indirect_hinge` | `yes` / `no` |
| `contains_parent_overwrite_risk` | `yes` / `no` |
| `contains_polished_emptiness_risk` | `yes` / `no` |
| `contains_multi_center_risk` | `yes` / `no` |
| `contains_weak_note_latent_signal` | `yes` / `no` |
| `contains_cultural_style_risk` | `yes` / `no` |

### 8.3 Required candidate-level labels

| Field | Values |
|---|---|
| `candidate_id` | string |
| `axis_family` | axis family string |
| `candidate_quality` | `strong` / `usable` / `borderline` / `weak` / `bad` |
| `is_best_candidate_for_case` | `yes` / `no` |
| `is_no_good_candidate_case` | `yes` / `no` |
| `captures_real_center` | `yes` / `no` / `partial` |
| `line_fit` | `strong_fit` / `partial_fit` / `misfit` |
| `evidence_grounding` | `strong` / `adequate` / `weak` / `insufficient` |
| `false_premium_risk` | `low` / `medium` / `high` |
| `flattening_risk` | `low` / `medium` / `high` |
| `usefulness_for_student` | `strong` / `moderate` / `weak` |
| `captures_indirect_hinge` | `yes` / `no` |
| `better_than_selected` | `yes` / `no` |
| `should_have_been_suppressed` | `yes` / `no` |

### 8.4 Required route-level labels

| Field | Values |
|---|---|
| `selected_route` | `show` / `clarify` / `block` |
| `should_have_clarified` | `yes` / `no` |
| `should_have_blocked` | `yes` / `no` |
| `should_have_shown` | `yes` / `no` |
| `confidence_correctness` | `too_high` / `appropriate` / `too_low` |
| `clarification_usefulness` | `strong` / `partial` / `weak` |
| `block_usefulness` | `strong` / `partial` / `weak` |

### 8.5 Required output-level labels

| Field | Values |
|---|---|
| `student_feels_understood` | `yes` / `mixed` / `no` |
| `trustworthiness` | `trustworthy` / `questionable` / `not_trustworthy` |
| `helpfulness` | `strong` / `moderate` / `weak` |
| `emotional_fit` | `strong` / `partial` / `wrong` |
| `would_continue_using_product` | `yes` / `no` / `maybe` |

### 8.6 Gold-label quality rules

1. All high-risk cases must have primary reviewer labels.
2. A 20% subset must have second reviewer audit.
3. Disagreements must be tracked, adjudicated, and resolved.
4. Adjudicated labels are gold. Un-adjudicated disagreements are not used as gold.
5. Reviewer consistency over time must be measured and monitored.

---

## 9. REVIEW WORKFLOW SPEC

### 9.1 Tiers

| Tier | Trigger | Action |
|---|---|---|
| High-value | High-trust-risk residual case, new distribution class, flagged by trust model | Primary + second review, full label set, adjudication |
| Standard | Routine run sample | Primary review only, core label set |
| Lightweight | High-confidence correct pass | Sampled audit, output-level labels only |

### 9.2 Adjudication rules

- Disagreement on `is_best_candidate_for_case`: always adjudicate.
- Disagreement on `expected_best_action`: always adjudicate.
- Disagreement on `candidate_quality` by more than one level: adjudicate.
- Disagreement on `false_premium_risk`: adjudicate when one reviewer says `high`.
- Disagreements unresolvable by adjudicator: flag as `uncertain`, exclude from gold until reviewed by a third party.

---

## 10. TRAINING DATA MODEL SPEC

Full schema details are in [NDS_LEARNED_JUDGMENT_DATA_SCHEMA_V1.md](NDS_LEARNED_JUDGMENT_DATA_SCHEMA_V1.md).

### 10.1 Core tables

| Table | Contents |
|---|---|
| `nds_runs` | Full run record: input, route, selected candidate, output, debug packet, model/prompt versions |
| `nds_candidates` | Each candidate per run: axis family, line, summary, evidence, scores, validator flags |
| `nds_human_labels` | All human reviewer labels with namespace, reviewer ID, and adjudication state |
| `nds_product_outcomes` | User behavior signals: continue, clarify, abandon, compare, revise, return |
| `nds_training_snapshots` | Immutable, versioned training set materializations |

### 10.2 Dataset principles

- **Immutable snapshots.** Training runs use versioned dataset snapshots, never live tables.
- **Reproducibility.** Every model is reproducible from: dataset snapshot ID + feature extraction version + training config + code version.
- **Leakage prevention.** Adjudicated labels must not leak into inference-time features. Future user outcomes must not leak into training examples where they would not be available at prediction time.

---

## 11. FEATURE SPEC (SUMMARY)

Full feature specs are in the child model specs.

### 11.1 Candidate reranker

Candidate intrinsic: axis family, line tokens, summary tokens, evidence count and overlap, validator flags, heuristic quality signals, false-premium heuristics, hinge support flags.

Candidate vs case: alignment to extracted hinge sentences, indirect hinge alignment, family/duty signals, contradiction signals, weak-note latent signals, mismatch to adult-shaped or polished-emptiness risk.

Relative: margin vs second-best, family diversity, unique support presence, duplicate/flat candidate flags.

### 11.2 Route/calibration model

Candidate set quality distribution, top candidate quality, no-good-candidate signals, margin quality, contradiction markers, low-signal markers, polished-emptiness markers, indirect hinge presence, weak-note recovery confidence, fallback contamination, clarification usefulness priors.

### 11.3 Trust/usefulness model

Selected candidate quality score, line fit, evidence sufficiency, false-premium risk, flattening risk, route correctness probability, axis helpfulness likelihood, cautious-but-useful indicators, student-understood proxy features.

---

## 12. MODEL SPECS (SUMMARY)

Full specs in child docs. Summary:

| Model | Objective | Output | Recommended v1 class |
|---|---|---|---|
| Candidate reranker | Rank candidates by true-center quality, suppress false-premium | `candidate_quality_score`, `best_candidate_probability`, `false_premium_probability`, `flattening_risk_probability` | Gradient-boosted trees on structured features |
| No-good-candidate detector | Predict whether no sufficiently good candidate exists | `no_good_candidate_probability` | Binary classifier, same feature space as reranker |
| Route/calibration model | Predict best action: show / clarify / block | `P(show)`, `P(clarify)`, `P(block)`, `calibrated_confidence_score` | Gradient-boosted trees or logistic regression with calibration |
| Trust/usefulness model | Predict student-felt understanding, helpfulness, false-premium risk, flattening risk | `student_understood_score`, `helpfulness_score`, `false_premium_risk_score`, `flattening_risk_score` | Structured model first; fine-tuned small encoder if justified |

The first version of every model must prioritize interpretability, stability, and auditable features over raw performance. Do not begin with a large black-box model.

---

## 13. TRAINING SEQUENCE

Train in dependency order:

1. **Candidate reranker** — most critical gap; independent of route.
2. **No-good-candidate detector** — builds on reranker features.
3. **Route/calibration model** — can now condition on better candidate quality estimates.
4. **Trust/usefulness model** — most stable once candidate and route signals are reliable.

---

## 14. EVALUATION REQUIREMENTS

### 14.1 Candidate reranker

- Top-1 best-candidate agreement with gold labels
- No-good-candidate detection: precision, recall, F1
- False-premium reduction vs heuristic baseline
- Indirect-hinge recovery improvement
- Distribution-shift evaluation pass rate improvement
- Student-understood proxy improvement

### 14.2 Route model

- Action correctness rate
- Overconfident wrong-show reduction
- Clarification usefulness rate
- Block correctness
- Expected calibration error (ECE)

### 14.3 Trust/usefulness model

- Student-understood label accuracy
- Not-trustworthy detection precision/recall
- False-premium risk detection
- Cautious-but-unhelpful detection

### 14.4 Evaluation splits

Every trained model must be evaluated on:

- Standard train/validation/test split
- Distribution-shift holdout (the 7-class distribution-shift evaluation set)
- Time-split holdout if ≥ 3 months of data exists
- Reviewer-disagreement subset audit

---

## 15. PHASED IMPLEMENTATION

| Phase | Deliverable |
|---|---|
| 1 | Gold-label schema + review tooling live |
| 2 | Offline dataset assembly + snapshot pipeline |
| 3 | Candidate reranker v1 + no-good-candidate detector |
| 4 | Route/calibration model v1 |
| 5 | Trust/usefulness model v1 |
| 6 | Shadow mode: all models running in parallel, logging disagreements |
| 7 | Limited production influence behind flag: route and confidence only |

Do not skip phases. Do not enter production influence without passing shadow mode evaluation and offline release gates.

---

## 16. SAFETY AND GUARDRAIL RULES

The learned system must **never**:

- Bypass evidence-grounding guardrails
- Bypass hard line-fit suppressors
- Output unsupported premium confidence
- Silently override block/clarify rules without logging
- Remove auditability from the decision path

The learned system must **always**:

- Log all model score outputs per run
- Log decision rationale fields alongside every learned decision
- Preserve debug visibility matching or exceeding the current `debug_packet` format
- Allow rollback to baseline heuristic path with a single config flag
- Preserve the full candidate set in storage even when the learned winner differs from the heuristic winner

---

## 17. RELEASE GATES

A learned model cannot enter any form of production influence unless it **improves** (vs heuristic baseline) on:

- Candidate best-choice agreement
- No-good-candidate detection rate
- False-premium reduction rate
- Indirect-hinge recovery rate
- Route correctness rate
- Student-understood trust label accuracy

And does **not regress** on:

- Evidence grounding pass rate
- Direction stability
- Line fit pass rate
- Flow integrity
- Session integrity
- Real-user simulation trust score

All gates are measured on the held-out distribution-shift evaluation set plus the existing hardened regression suite.

---

## 18. FAILURE CONDITIONS

This workstream fails if any of the following occur:

1. Training data is shallow, inconsistent, or adjudication quality is low.
2. Learned models primarily learn polish preference rather than narrative judgment.
3. Shadow mode cannot explain the reason for disagreements with the heuristic path.
4. The learned layer improves one benchmark but degrades trust metrics.
5. Production influence is introduced before stable offline and shadow mode gains are confirmed.
6. The system loses auditability: a run cannot be explained post-hoc.

---

## 19. WORLD-CLASS QUALITY BAR

The system has reached world-class when a reviewer examining a high-difficulty run can see:

- The correct candidate was selected because it captures the student's actual center, not the most polished surface.
- Clarification was chosen exactly when a trustworthy candidate did not exist, and the question was useful.
- Block was chosen when no candidate and no useful clarification could be constructed from the available input.
- The student sees a direction or question that makes them feel understood, not flattened or praised generically.
- The system is improving from its own review corpus in ways that no pure heuristic can replicate.

That is the target.

---

*See child specs for full schema, tooling, model, and rollout details.*
