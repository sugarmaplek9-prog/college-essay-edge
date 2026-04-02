# REAL_INPUT_CORPUS_AND_LEARNED_JUDGMENT_SUBSTRATE_IMPLEMENTATION_SPEC_V1.md

## Document control

- **Document name:** REAL_INPUT_CORPUS_AND_LEARNED_JUDGMENT_SUBSTRATE_IMPLEMENTATION_SPEC_V1.md
- **Product:** College Essay Edge
- **Track:** Real-input corpus + learned-judgment substrate
- **Primary surfaces:** Narrative Direction Selection first, Essay Feedback second
- **Document class:** Build-facing implementation specification
- **Status:** Draft for implementation
- **Intended audience:** engineering, product, QA, ops/review
- **Standard:** build-ready, explicit, fail-closed, versioned, testable

---

## 1. Purpose

This document defines the implementation-grade specification for the **real-input corpus + learned-judgment substrate**.

Its purpose is to establish the production system that captures real student inputs, records system behavior, captures structured reviewer judgment, resolves disagreement, promotes canonical benchmark cases, and converts those judgments into reusable evaluation and product-improvement assets.

This specification is not a research paper, not a loose architecture note, and not a future-state strategy document.

It exists so that an engineer can build the system with minimal ambiguity and so that QA can determine whether the implementation is correct.

---

## 2. Product objective

The substrate must allow the system to improve from:

- real user input patterns,
- real ambiguity patterns,
- real output failures,
- real reviewer judgment,
- structured disagreement resolution,
- benchmark case promotion,
- repeated evaluation across versions.

The substrate must support the following product outcomes:

1. better routing,
2. better context assembly,
3. better prompt behavior,
4. better output ranking,
5. stronger release QA,
6. lower genericness rate,
7. lower misread-intent rate,
8. stronger institutional learning loop.

---

## 3. Non-negotiable design principles

### 3.1 Fail-closed
If the substrate cannot reliably capture required data for a case, the case must not silently enter the trusted learning path.

### 3.2 Judgment over intuition
No system change should be justified by “this prompt feels better” when judgment-backed cases exist.

### 3.3 Version everything
Prompt versions, routing versions, labels, scorecards, evaluation packs, and promotion criteria must be versioned.

### 3.4 Normalized before trusted
Raw data is useful; only normalized, schema-valid, reviewable data can be used for learning, pack generation, or benchmark promotion.

### 3.5 Structured disagreement
Disagreement is not noise to ignore. It is a signal to capture, resolve, and use for calibration.

### 3.6 Operational utility only
Every stored field must support at least one of:
- review,
- evaluation,
- auditing,
- routing improvement,
- prompt improvement,
- failure monitoring,
- product QA.

### 3.7 Reuse across product surfaces
The substrate must be generic enough to support NDS first and Essay Feedback second without re-architecture.

---

## 4. System boundary

### 4.1 In scope
This track includes:

- case creation from live inputs and approved imports,
- normalization,
- run capture,
- review queueing,
- reviewer scoring and labeling,
- adjudication,
- gold-case promotion,
- eval-pack generation,
- reviewer calibration support,
- reporting hooks for failure rates and coverage.

### 4.2 Out of scope
This track does not include:

- model fine-tuning,
- full feature-store development,
- large-scale web crawling,
- automated online learning,
- broad admissions data warehousing,
- student-facing UI redesign,
- generalized experimentation framework across the full app.

---

## 5. Definitions

### 5.1 Case
A top-level unit representing one evaluable input-output event.

### 5.2 Run
A concrete execution of the product system on a case.

### 5.3 Review
A structured human judgment of one run or output.

### 5.4 Adjudication
A conflict-resolution step used when reviews disagree materially or when a case is a candidate for gold status.

### 5.5 Gold case
A case judged reliable enough to serve as a stable benchmark anchor.

### 5.6 Eval pack
A versioned set of cases used to compare system behavior across releases.

---

## 6. Architecture overview

The system consists of seven layers:

1. **Capture layer**
   - records raw user input and request metadata.

2. **Normalization layer**
   - converts raw case input into schema-valid structured form.

3. **Run-record layer**
   - captures system behavior, versions, output, and execution metadata.

4. **Review-queue layer**
   - prioritizes cases for human review based on rules.

5. **Judgment layer**
   - stores scored reviews, failure modes, and rationales.

6. **Adjudication + promotion layer**
   - resolves disagreement and upgrades cases into benchmark assets.

7. **Evaluation + feedback layer**
   - turns judged cases into eval packs, reporting, and product-improvement signals.

---

## 7. Required implementation outcomes

Implementation is not complete until the system can do all of the following in production or controlled staging:

- create a case from live traffic,
- validate and normalize that case,
- store the system run,
- assign a review priority,
- allow a reviewer to score the case,
- detect disagreement across reviewers,
- adjudicate that disagreement,
- promote a case to gold when criteria are met,
- assemble an eval pack from selected cases,
- export the eval pack in a deterministic format,
- report failure-mode distributions by product version.

---

## 8. Canonical lifecycle

Each case must move through a strict lifecycle.

### 8.1 Lifecycle states

- `new`
- `capture_failed`
- `captured`
- `normalization_failed`
- `normalized`
- `run_attached`
- `review_exempt`
- `review_queued`
- `in_review`
- `review_complete`
- `adjudication_required`
- `adjudicated`
- `gold_candidate`
- `gold`
- `eval_pack_eligible`
- `archived`
- `rejected`

### 8.2 State transition rules

#### Allowed transitions

- `new -> captured`
- `new -> capture_failed`
- `captured -> normalized`
- `captured -> normalization_failed`
- `normalized -> run_attached`
- `run_attached -> review_exempt`
- `run_attached -> review_queued`
- `review_queued -> in_review`
- `in_review -> review_complete`
- `review_complete -> adjudication_required`
- `review_complete -> eval_pack_eligible`
- `adjudication_required -> adjudicated`
- `adjudicated -> gold_candidate`
- `gold_candidate -> gold`
- `gold_candidate -> eval_pack_eligible`
- `eval_pack_eligible -> archived`
- `review_complete -> rejected`
- `adjudicated -> rejected`

#### Forbidden transitions

The implementation must reject:
- skipping normalization,
- gold promotion before review completion,
- gold promotion when adjudication is required but missing,
- eval-pack inclusion without stable labels,
- archival of unresolved adjudication-required cases.

---

## 9. Data model

The substrate must use explicit normalized tables rather than a single JSON dump table.

JSON fields are allowed for flexible metadata, but core system logic must depend on structured columns.

---

## 10. Database schema

The following schema is the minimum acceptable schema for v1.

---

## 10.1 `cases`

Top-level record for one evaluable event.

| Column | Type | Null | Notes |
|---|---|---:|---|
| id | uuid | no | primary key |
| case_key | text | no | external-readable unique identifier |
| case_type | text | no | enum |
| product_surface | text | no | enum |
| source_channel | text | no | enum |
| lifecycle_status | text | no | enum |
| review_priority | text | no | enum |
| current_truth_status | text | yes | enum |
| label_schema_version | text | no | version string |
| routing_policy_version | text | yes | version string |
| prompt_template_version | text | yes | version string |
| release_version | text | yes | application release |
| created_at | timestamptz | no | |
| updated_at | timestamptz | no | |
| archived_at | timestamptz | yes | |
| tags_json | jsonb | no | array of strings |
| notes_internal | text | yes | ops notes only |

### Allowed enum values

#### `case_type`
- `nds_real_input`
- `essay_feedback_real_input`
- `imported_guidance_request`
- `red_team_case`
- `curated_gold_seed`

#### `product_surface`
- `narrative_direction_selection`
- `essay_feedback`

#### `source_channel`
- `live_product`
- `manual_import`
- `support_log`
- `evaluation_seed`
- `reviewer_authored`

#### `review_priority`
- `none`
- `low`
- `normal`
- `high`
- `urgent`
- `gold_candidate`

#### `current_truth_status`
- `unreviewed`
- `weak_signal`
- `review_backed`
- `adjudicated`
- `gold`

---

## 10.2 `case_inputs`

Stores raw and normalized input.

| Column | Type | Null | Notes |
|---|---|---:|---|
| id | uuid | no | primary key |
| case_id | uuid | no | fk to cases |
| raw_input_text | text | no | exact preserved input |
| normalized_input_text | text | yes | generated during normalization |
| input_language | text | no | default `en` |
| raw_word_count | integer | no | |
| normalized_word_count | integer | yes | |
| normalization_status | text | no | enum |
| normalization_errors_json | jsonb | no | array |
| extracted_intent | text | yes | enum |
| extracted_essay_stage | text | yes | enum |
| extracted_prompt_type | text | yes | enum |
| extracted_ambiguity_level | integer | yes | 1-5 |
| extracted_emotional_signal | text | yes | enum |
| extracted_constraints_json | jsonb | no | |
| created_at | timestamptz | no | |
| updated_at | timestamptz | no | |

### `normalization_status`
- `pending`
- `success`
- `partial`
- `failed`

### `extracted_intent`
- `seeking_topic_direction`
- `seeking_narrative_selection`
- `seeking_structural_help`
- `seeking_feedback`
- `mixed`
- `unclear`

### `extracted_essay_stage`
- `blank_page`
- `rough_idea`
- `partial_draft`
- `full_draft`
- `unknown`

### `extracted_prompt_type`
- `personal_statement`
- `supplemental`
- `identity`
- `community`
- `why_school`
- `challenge`
- `activity`
- `other`
- `unknown`

### `extracted_emotional_signal`
- `neutral`
- `anxious`
- `overwhelmed`
- `hopeful`
- `confident`
- `self_doubting`
- `mixed`
- `unclear`

---

## 10.3 `case_context`

Structured context signals.

| Column | Type | Null | Notes |
|---|---|---:|---|
| id | uuid | no | primary key |
| case_id | uuid | no | fk |
| student_grade_level | text | yes | |
| stated_goal_signal | text | yes | short text |
| prior_attempts_present | boolean | no | |
| ambiguity_level | integer | yes | 1-5 |
| complexity_score | integer | yes | 1-5 |
| sensitivity_flags_json | jsonb | no | array |
| context_payload_json | jsonb | no | additional context |
| created_at | timestamptz | no | |
| updated_at | timestamptz | no | |

---

## 10.4 `case_runs`

One row per system execution attached to a case.

| Column | Type | Null | Notes |
|---|---|---:|---|
| id | uuid | no | primary key |
| case_id | uuid | no | fk |
| run_key | text | no | unique |
| model_provider | text | no | |
| model_name | text | no | |
| reasoning_mode | text | yes | |
| routing_policy_version | text | no | |
| prompt_template_version | text | no | |
| assembly_context_version | text | yes | |
| fallback_used | boolean | no | |
| confidence_score | numeric(5,4) | yes | 0-1 |
| risk_score | numeric(5,4) | yes | 0-1 |
| latency_ms | integer | yes | |
| token_input | integer | yes | |
| token_output | integer | yes | |
| run_status | text | no | enum |
| release_version | text | no | |
| created_at | timestamptz | no | |

### `run_status`
- `success`
- `partial_success`
- `fallback_success`
- `failed`

---

## 10.5 `case_run_inputs`

Captures execution-time structured inputs.

| Column | Type | Null |
|---|---|---:|
| id | uuid | no |
| run_id | uuid | no |
| input_features_json | jsonb | no |
| retrieved_patterns_json | jsonb | no |
| assembly_payload_json | jsonb | no |
| created_at | timestamptz | no |

---

## 10.6 `case_outputs`

Captures selected and optional candidate outputs.

| Column | Type | Null | Notes |
|---|---|---:|---|
| id | uuid | no | primary key |
| run_id | uuid | no | fk |
| output_role | text | no | enum |
| output_text | text | no | |
| output_rank | integer | yes | for candidate outputs |
| selected_for_delivery | boolean | no | |
| delivered_to_user | boolean | no | |
| output_metadata_json | jsonb | no | |
| created_at | timestamptz | no | |

### `output_role`
- `final`
- `candidate`
- `fallback`
- `redraft`

---

## 10.7 `case_queue_decisions`

Stores why a case was or was not routed to review.

| Column | Type | Null |
|---|---|---:|
| id | uuid | no |
| case_id | uuid | no |
| queue_decision | text | no |
| queue_reason_codes_json | jsonb | no |
| queue_score | numeric(5,4) | yes |
| decided_by | text | no |
| created_at | timestamptz | no |

### `queue_decision`
- `review_exempt`
- `spot_check`
- `full_review`
- `adjudication_priority`
- `gold_candidate_review`

---

## 10.8 `case_reviews`

One row per independent reviewer decision.

| Column | Type | Null |
|---|---|---:|
| id | uuid | no |
| case_id | uuid | no |
| run_id | uuid | no |
| reviewer_id | text | no |
| review_round | integer | no |
| review_status | text | no |
| decision | text | no |
| rationale_text | text | yes |
| generalizable_learning_flag | boolean | no |
| promote_to_gold_flag | boolean | no |
| requires_adjudication_flag | boolean | no |
| submitted_at | timestamptz | no |
| updated_at | timestamptz | no |

### `review_status`
- `draft`
- `submitted`
- `superseded`

### `decision`
- `approve`
- `approve_with_minor_edits`
- `usable_but_weak`
- `not_usable`
- `unsafe_or_off_policy`

---

## 10.9 `case_review_scores`

Dimension-level scores tied to one review.

| Column | Type | Null |
|---|---|---:|
| id | uuid | no |
| review_id | uuid | no |
| score_dimension | text | no |
| score_value | integer | no |
| created_at | timestamptz | no |

### Score rules
- valid range: 1 through 5
- all required dimensions must be present before submission
- duplicate dimension rows for a review are forbidden

---

## 10.10 `case_failure_modes`

Failure labels selected during review.

| Column | Type | Null |
|---|---|---:|
| id | uuid | no |
| review_id | uuid | no |
| failure_mode | text | no |
| severity | text | no |
| created_at | timestamptz | no |

### `failure_mode`
- `generic_advice`
- `fake_depth`
- `overconfident_inference`
- `weak_narrative_differentiation`
- `poor_student_fit_read`
- `shallow_evidence_use`
- `too_broad_unfocused`
- `too_polished_ai_sounding`
- `misread_emotional_signal`
- `weak_actionability`
- `confusing_structure`
- `unsupported_recommendation`
- `policy_safety_risk`
- `wrong_essay_type_assumption`
- `style_drift_from_product_standard`

### `severity`
- `low`
- `medium`
- `high`
- `critical`

---

## 10.11 `case_reason_codes`

Normalized reason codes for a review.

| Column | Type | Null |
|---|---|---:|
| id | uuid | no |
| review_id | uuid | no |
| reason_code | text | no |
| created_at | timestamptz | no |

Initial reason codes should align with the ML labeling spec and remain versioned externally.

---

## 10.12 `case_adjudications`

Stores resolved truth state after conflict or promotion review.

| Column | Type | Null |
|---|---|---:|
| id | uuid | no |
| case_id | uuid | no |
| adjudicator_id | text | no |
| adjudication_reason | text | no |
| final_decision | text | no |
| truth_status | text | no |
| gold_candidate_confirmed | boolean | no |
| teaching_notes | text | yes |
| label_version_locked | text | no |
| completed_at | timestamptz | no |

### `adjudication_reason`
- `reviewer_disagreement`
- `gold_candidate_confirmation`
- `high_risk_case`
- `taxonomy_gap`
- `ops_escalation`

### `truth_status`
- `adjudicated_usable`
- `adjudicated_not_usable`
- `adjudicated_gold_ready`
- `adjudicated_needs_rework`

---

## 10.13 `gold_cases`

Stable benchmark anchors.

| Column | Type | Null |
|---|---|---:|
| id | uuid | no |
| case_id | uuid | no |
| gold_set_id | text | no |
| canonical_label_version | text | no |
| gold_reason | text | no |
| benchmark_notes | text | yes |
| created_at | timestamptz | no |

---

## 10.14 `eval_packs`

Top-level pack metadata.

| Column | Type | Null |
|---|---|---:|
| id | uuid | no |
| eval_pack_key | text | no |
| version | text | no |
| pack_type | text | no |
| selection_logic_text | text | no |
| label_version | text | no |
| created_by | text | no |
| created_at | timestamptz | no |
| notes | text | yes |

### `pack_type`
- `broad_regression`
- `failure_focused`
- `sparse_edge`
- `gold_benchmark`

---

## 10.15 `eval_pack_cases`

Join table.

| Column | Type | Null |
|---|---|---:|
| id | uuid | no |
| eval_pack_id | uuid | no |
| case_id | uuid | no |
| expected_truth_status | text | no |
| expected_failure_modes_json | jsonb | no |
| expected_score_profile_json | jsonb | no |
| created_at | timestamptz | no |

---

## 10.16 Required indexes

At minimum create indexes on:

- `cases(case_type, product_surface, lifecycle_status)`
- `cases(review_priority, created_at desc)`
- `case_inputs(case_id)`
- `case_runs(case_id, created_at desc)`
- `case_outputs(run_id, selected_for_delivery)`
- `case_reviews(case_id, submitted_at desc)`
- `case_review_scores(review_id, score_dimension)`
- `case_failure_modes(review_id, failure_mode)`
- `case_adjudications(case_id)`
- `gold_cases(case_id)`
- `eval_pack_cases(eval_pack_id, case_id)`

And unique constraints on:
- `cases(case_key)`
- `case_runs(run_key)`
- `eval_packs(eval_pack_key, version)`
- `case_review_scores(review_id, score_dimension)`

---

## 11. TypeScript domain model

The implementation must define explicit types. The following shape is the minimum acceptable contract.

```ts
export type ProductSurface =
  | "narrative_direction_selection"
  | "essay_feedback";

export type CaseType =
  | "nds_real_input"
  | "essay_feedback_real_input"
  | "imported_guidance_request"
  | "red_team_case"
  | "curated_gold_seed";

export type LifecycleStatus =
  | "new"
  | "capture_failed"
  | "captured"
  | "normalization_failed"
  | "normalized"
  | "run_attached"
  | "review_exempt"
  | "review_queued"
  | "in_review"
  | "review_complete"
  | "adjudication_required"
  | "adjudicated"
  | "gold_candidate"
  | "gold"
  | "eval_pack_eligible"
  | "archived"
  | "rejected";

export type ReviewPriority =
  | "none"
  | "low"
  | "normal"
  | "high"
  | "urgent"
  | "gold_candidate";

export type ReviewDecision =
  | "approve"
  | "approve_with_minor_edits"
  | "usable_but_weak"
  | "not_usable"
  | "unsafe_or_off_policy";

export type FailureMode =
  | "generic_advice"
  | "fake_depth"
  | "overconfident_inference"
  | "weak_narrative_differentiation"
  | "poor_student_fit_read"
  | "shallow_evidence_use"
  | "too_broad_unfocused"
  | "too_polished_ai_sounding"
  | "misread_emotional_signal"
  | "weak_actionability"
  | "confusing_structure"
  | "unsupported_recommendation"
  | "policy_safety_risk"
  | "wrong_essay_type_assumption"
  | "style_drift_from_product_standard";

export interface CaseRecord {
  id: string;
  caseKey: string;
  caseType: CaseType;
  productSurface: ProductSurface;
  sourceChannel: string;
  lifecycleStatus: LifecycleStatus;
  reviewPriority: ReviewPriority;
  currentTruthStatus: "unreviewed" | "weak_signal" | "review_backed" | "adjudicated" | "gold" | null;
  labelSchemaVersion: string;
  routingPolicyVersion?: string | null;
  promptTemplateVersion?: string | null;
  releaseVersion?: string | null;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  archivedAt?: string | null;
}

export interface CaseInputRecord {
  caseId: string;
  rawInputText: string;
  normalizedInputText?: string | null;
  normalizationStatus: "pending" | "success" | "partial" | "failed";
  extractedIntent?: string | null;
  extractedEssayStage?: string | null;
  extractedPromptType?: string | null;
  extractedAmbiguityLevel?: number | null;
  extractedEmotionalSignal?: string | null;
  extractedConstraints: string[];
}

export interface CaseRunRecord {
  id: string;
  caseId: string;
  runKey: string;
  modelProvider: string;
  modelName: string;
  reasoningMode?: string | null;
  routingPolicyVersion: string;
  promptTemplateVersion: string;
  assemblyContextVersion?: string | null;
  fallbackUsed: boolean;
  confidenceScore?: number | null;
  riskScore?: number | null;
  runStatus: "success" | "partial_success" | "fallback_success" | "failed";
  releaseVersion: string;
  createdAt: string;
}

export interface ReviewScore {
  dimension: string;
  value: 1 | 2 | 3 | 4 | 5;
}

export interface CaseReviewSubmission {
  caseId: string;
  runId: string;
  reviewerId: string;
  reviewRound: number;
  decision: ReviewDecision;
  rationaleText?: string;
  generalizableLearningFlag: boolean;
  promoteToGoldFlag: boolean;
  requiresAdjudicationFlag: boolean;
  scores: ReviewScore[];
  failureModes: Array<{
    failureMode: FailureMode;
    severity: "low" | "medium" | "high" | "critical";
  }>;
  reasonCodes: string[];
}
```

---

## 12. Required scoring dimensions

The scorecard must be explicit by product surface.

### 12.1 NDS required dimensions
All are required at review submission time.

- `authenticity_preservation`
- `narrative_specificity`
- `directional_usefulness`
- `non_genericness`
- `strategic_differentiation`
- `student_fit`
- `clarity_of_recommendation`
- `evidence_grounded_interpretation`
- `actionability`
- `safety_policy_compliance`

### 12.2 Essay Feedback required dimensions

- `voice_preservation`
- `specificity_of_critique`
- `usefulness_of_revision_direction`
- `non_genericness`
- `line_of_attack_quality`
- `clarity`
- `emotional_intelligence`
- `actionability`
- `safety_policy_compliance`

### 12.3 Score semantics
Use a 1-5 integer scale.

- `1` = unacceptable
- `2` = materially weak
- `3` = acceptable but limited
- `4` = strong
- `5` = excellent

Implementation rule:
- no half-points in v1,
- no optional scoring dimensions for base review,
- missing dimensions block submission.

---

## 13. Review queue rules

Queue logic must be deterministic and explainable.

### 13.1 Review-exempt cases
A case may be review-exempt only if all of the following are true:

- run status is `success`,
- confidence score is above configured threshold,
- risk score is below configured threshold,
- no trigger flags fired,
- case type is already adequately represented in recent reviewed corpus,
- no new routing or prompt version is active.

### 13.2 Full-review triggers
Send to full review when any of the following are true:

- confidence score below threshold,
- risk score above threshold,
- output uses new routing version,
- output uses new prompt version,
- user retry count exceeds threshold,
- output was fallback-generated,
- case matches sparse or underrepresented segment,
- case is high-complexity,
- case contains sensitive ambiguity,
- automated checks flag genericness risk.

### 13.3 Adjudication-priority triggers
Send toward adjudication path when:

- two reviewers differ by two or more decision bands,
- gold promotion is requested by any reviewer,
- case is high-risk or policy-sensitive,
- dimension variance exceeds configured threshold,
- taxonomy gap is detected.

### 13.4 Gold-candidate triggers
A case becomes a gold candidate if:

- at least one reviewer flags it,
- review quality is complete,
- rationale quality is sufficient,
- case teaches a reusable lesson,
- input is clear and representative or strategically important.

---

## 14. Queue configuration constants

The initial implementation must keep these values configurable in one place.

```ts
export const REVIEW_QUEUE_CONFIG = {
  fullReviewConfidenceThreshold: 0.72,
  fullReviewRiskThreshold: 0.35,
  spotCheckSampleRate: 0.15,
  retryEscalationThreshold: 2,
  disagreementDecisionBandThreshold: 2,
  disagreementDimensionDeltaThreshold: 1.5,
  sparseSegmentLookbackDays: 30,
  goldPromotionRequiresAdjudication: true,
};
```

These values are starting defaults, not permanent truth.

---

## 15. API specification

All endpoints must validate payloads server-side.

Response envelopes must be deterministic.

---

## 15.1 Create case

### `POST /api/cases`

Creates a top-level case.

#### Request
```json
{
  "caseType": "nds_real_input",
  "productSurface": "narrative_direction_selection",
  "sourceChannel": "live_product",
  "rawInputText": "I have a lot of activities but don't know what story to tell...",
  "context": {
    "studentGradeLevel": "12",
    "priorAttemptsPresent": true,
    "statedGoalSignal": "Needs essay topic direction"
  },
  "tags": ["blank_page", "live_intake"]
}
```

#### Response
```json
{
  "caseId": "uuid",
  "caseKey": "CASE-2026-000001",
  "lifecycleStatus": "captured"
}
```

#### Validation
Reject if:
- `rawInputText` empty,
- `caseType` invalid,
- `productSurface` invalid,
- source unsupported.

---

## 15.2 Normalize case

### `POST /api/cases/:id/normalize`

Creates normalized input and extracted signals.

#### Response
```json
{
  "caseId": "uuid",
  "normalizationStatus": "success",
  "lifecycleStatus": "normalized",
  "extractedEssayStage": "blank_page",
  "extractedPromptType": "personal_statement",
  "extractedAmbiguityLevel": 4
}
```

#### Rules
- normalization must be idempotent,
- repeated calls overwrite prior normalization only if explicitly allowed by role,
- errors must be stored, not swallowed.

---

## 15.3 Attach run

### `POST /api/cases/:id/run`

Stores system execution data.

#### Request
```json
{
  "runKey": "RUN-2026-000001",
  "modelProvider": "openai",
  "modelName": "gpt-5.4-thinking",
  "routingPolicyVersion": "irp_v1.2.0",
  "promptTemplateVersion": "nds_prompt_v1.4.3",
  "assemblyContextVersion": "ctx_v1.1.0",
  "fallbackUsed": false,
  "confidenceScore": 0.81,
  "riskScore": 0.19,
  "runStatus": "success",
  "releaseVersion": "app_0.9.0",
  "inputFeatures": {
    "ambiguityLevel": 4
  },
  "retrievedPatterns": [],
  "outputs": [
    {
      "outputRole": "final",
      "outputText": "You have three viable narrative directions...",
      "selectedForDelivery": true,
      "deliveredToUser": true
    }
  ]
}
```

---

## 15.4 Submit review

### `POST /api/cases/:id/review`

Accepts a structured reviewer submission.

#### Server rules
- review must reference an existing run,
- all required dimensions must be present,
- failure modes may be zero or more,
- empty rationale allowed only for low-risk spot-check approvals,
- decision `unsafe_or_off_policy` requires at least one failure mode.

#### Response
```json
{
  "reviewId": "uuid",
  "caseId": "uuid",
  "lifecycleStatus": "review_complete",
  "adjudicationRequired": false
}
```

---

## 15.5 Adjudicate case

### `POST /api/cases/:id/adjudicate`

#### Request
```json
{
  "adjudicatorId": "reviewer_lead_1",
  "adjudicationReason": "reviewer_disagreement",
  "finalDecision": "approve_with_minor_edits",
  "truthStatus": "adjudicated_usable",
  "goldCandidateConfirmed": false,
  "teachingNotes": "Strong directionality but one reviewer overweighted polish."
}
```

#### Rules
- cannot adjudicate without at least two submitted reviews unless override role,
- cannot mark gold-ready without locked labels,
- adjudication stores a permanent truth record.

---

## 15.6 Promote case

### `POST /api/cases/:id/promote`

#### Request
```json
{
  "target": "gold",
  "goldSetId": "GOLD-NDS-CORE-001",
  "goldReason": "Canonical blank-page ambiguity case with stable review consensus"
}
```

#### Rules
- gold promotion requires adjudicated or single-review override with admin role disabled by default,
- eval-pack promotion requires stable labels.

---

## 15.7 Review queue

### `GET /api/review-queue`

Query params:
- `productSurface`
- `priority`
- `status`
- `limit`
- `cursor`

Response must include:
- case id,
- case key,
- product surface,
- case type,
- review priority,
- lifecycle status,
- created at,
- queue reason summary,
- confidence score,
- risk score.

---

## 15.8 Eval pack creation

### `POST /api/eval-packs`

#### Request
```json
{
  "evalPackKey": "NDS-BROAD-REGRESSION",
  "version": "v1",
  "packType": "broad_regression",
  "labelVersion": "ml_labels_v1",
  "selectionLogicText": "All adjudicated NDS real-input cases from release window app_0.9.x excluding policy-risk cases",
  "caseIds": [
    "uuid-1",
    "uuid-2"
  ]
}
```

---

## 16. Export format

Eval packs must be exportable in deterministic JSON.

### 16.1 Eval pack export shape
```json
{
  "evalPackKey": "NDS-BROAD-REGRESSION",
  "version": "v1",
  "packType": "broad_regression",
  "labelVersion": "ml_labels_v1",
  "createdAt": "2026-03-18T00:00:00Z",
  "cases": [
    {
      "caseKey": "CASE-2026-000103",
      "productSurface": "narrative_direction_selection",
      "rawInputText": "...",
      "normalizedInputText": "...",
      "context": {},
      "expectedTruthStatus": "adjudicated_usable",
      "expectedFailureModes": [],
      "expectedScoreProfile": {
        "non_genericness": 4,
        "actionability": 5
      }
    }
  ]
}
```

### 16.2 Export rules
- deterministic field order,
- deterministic case order,
- no hidden fields,
- no reviewer personal identifiers in exports,
- all exports version-stamped.

---

## 17. Admin UI specification

Build only the minimum serious operational interface.

---

## 17.1 Screen A — Review queue

### Purpose
Allow reviewers to triage and open cases quickly.

### Required columns
- case key
- created at
- product surface
- case type
- lifecycle status
- priority
- confidence
- risk
- queue reason summary
- assigned reviewer, if any

### Required actions
- open case
- assign to self
- filter
- sort by priority then age
- mark skipped with reason

### Failure handling
If queue data incomplete:
- row displays as blocked,
- case cannot be opened for scoring,
- ops note shown.

---

## 17.2 Screen B — Case review detail

### Layout sections
1. metadata header
2. raw input panel
3. normalized input panel
4. context panel
5. output panel
6. run metadata panel
7. scorecard panel
8. failure mode selection panel
9. rationale + notes panel
10. submit actions

### Required controls
- score dropdown or button group for each dimension,
- multi-select failure modes,
- severity selector per failure mode,
- rationale text area,
- promote-to-gold checkbox,
- generalizable-learning checkbox,
- save draft,
- submit.

### Submission blocks
Do not allow submission if:
- required dimension missing,
- invalid score value,
- decision missing,
- policy risk selected without rationale,
- gold promotion selected with incomplete scorecard.

---

## 17.3 Screen C — Adjudication view

### Required data shown
- raw input,
- normalized input,
- final output,
- side-by-side submitted reviews,
- score deltas,
- failure-mode deltas,
- gold-promotion flags,
- adjudication recommendation helper summary.

### Required adjudicator actions
- set final decision,
- set truth status,
- confirm gold candidate yes/no,
- enter teaching notes,
- lock label version,
- complete adjudication.

---

## 17.4 Screen D — Eval pack manager

### Required capabilities
- create pack from filtered cases,
- inspect pack membership,
- view case status and truth status,
- export JSON,
- version pack,
- archive superseded pack versions.

---

## 18. Adjudication logic

Adjudication must not be ad hoc.

### 18.1 Trigger conditions
Adjudication required when any of the following are true:

- decision band distance >= threshold,
- one reviewer says usable and another says not usable,
- any reviewer flags policy risk and another does not,
- any reviewer flags gold promotion,
- score variance on key dimensions exceeds threshold,
- ops lead manually escalates.

### 18.2 Decision band mapping
Map decisions to ordinal bands:

- `approve` = 5
- `approve_with_minor_edits` = 4
- `usable_but_weak` = 3
- `not_usable` = 2
- `unsafe_or_off_policy` = 1

### 18.3 Adjudicator responsibilities
The adjudicator must determine:

- what final decision stands,
- whether disagreement reflects reviewer inconsistency or a genuine ambiguous case,
- whether a taxonomy update is needed,
- whether the case is benchmark-worthy.

### 18.4 Locked truth
Once adjudicated:
- the truth record becomes authoritative,
- later reviews may be added but do not overwrite truth,
- pack exports use adjudicated truth by default.

---

## 19. Gold promotion standard

“Gold” is not shorthand for “good.”

A gold case must satisfy all of the following:

1. the case is reusable,
2. the input is interpretable and sufficiently complete,
3. the review rationale is strong,
4. disagreement is resolved,
5. labels are stable,
6. the case teaches a repeatable lesson,
7. the case is strategically important or strongly representative.

### 19.1 Forbidden gold promotions
Do not allow gold promotion for:
- incomplete reviews,
- unstable labels,
- one-off novelty cases with poor reuse value,
- unresolved sensitive-content handling,
- ambiguous outputs with no strong adjudication note.

---

## 20. Reporting requirements

The substrate must generate operational reports.

### 20.1 Required failure report
By release version, show:
- total reviewed cases,
- generic advice rate,
- misread emotional signal rate,
- weak actionability rate,
- poor student-fit rate,
- gold-case promotion rate.

### 20.2 Required coverage report
Show:
- case counts by essay stage,
- case counts by prompt type,
- case counts by complexity,
- case counts by source lane,
- underrepresented segments.

### 20.3 Required reviewer calibration report
Show:
- pairwise disagreement rate,
- dimension-level variance,
- gold-promotion disagreement rate,
- average rationale length,
- unstable taxonomy flags.

---

## 21. Security, privacy, and operational constraints

### 21.1 Data minimization
Store only fields needed for product improvement, audit, or evaluation.

### 21.2 Reviewer visibility
Reviewer UI must not show unnecessary personal metadata.

### 21.3 Export restrictions
Eval-pack exports must exclude reviewer identity and any irrelevant internal notes.

### 21.4 Sensitive-content handling
Sensitive-content flags must be preserved and usable in queue routing.
Cases marked for restricted handling must not enter unrestricted review pools.

### 21.5 Auditability
Every review, adjudication, promotion, and export action must have:
- actor id,
- timestamp,
- target id,
- action type.

---

## 22. Release plan

Build in five controlled phases.

### Phase 1 — schema + capture
Ship:
- database tables,
- create-case endpoint,
- normalize-case endpoint,
- attach-run endpoint,
- base validation,
- audit logging.

### Phase 2 — queue + review UI
Ship:
- queue decision engine,
- review queue screen,
- case detail review screen,
- review submission endpoint,
- required scorecard enforcement.

### Phase 3 — adjudication + gold
Ship:
- disagreement detection,
- adjudication screen,
- adjudication endpoint,
- gold-case table and promotion flow.

### Phase 4 — eval packs
Ship:
- pack creation endpoint,
- pack manager screen,
- deterministic JSON export,
- pack versioning.

### Phase 5 — reports + feedback hooks
Ship:
- failure-mode dashboard,
- coverage report,
- calibration report,
- routing/prompt lesson extraction views.

---

## 23. QA test plan

This track is not acceptable without explicit QA.

### 23.1 Schema tests
Validate:
- invalid enums rejected,
- required fields enforced,
- foreign keys enforced,
- duplicate unique keys rejected.

### 23.2 Lifecycle tests
Validate:
- forbidden transitions blocked,
- normalization required before run-attached state,
- adjudication required cases cannot be promoted directly.

### 23.3 API tests
Validate:
- empty raw input rejected,
- incomplete scorecards rejected,
- invalid failure mode rejected,
- malformed export blocked.

### 23.4 UI workflow tests
Validate:
- reviewer cannot submit missing dimensions,
- adjudicator sees comparison correctly,
- gold toggle disabled when prerequisites not met,
- queue filters stable under pagination.

### 23.5 Determinism tests
Validate:
- same eval pack export twice yields same case order and same field order,
- same queue rules produce same decision for same input state.

### 23.6 Permission tests
Validate:
- non-adjudicator cannot adjudicate,
- non-admin cannot force gold promotion,
- restricted cases do not appear to unauthorized reviewers.

### 23.7 Regression tests
Validate:
- new prompt version correctly populates run metadata,
- old reviewed cases remain valid after new release deployment,
- exports from older pack versions remain reproducible.

---

## 24. Acceptance criteria

This implementation spec is satisfied only when all conditions below are true.

1. live product cases are captured with raw input and metadata,
2. normalization status is stored and auditable,
3. runs are recorded with version metadata,
4. queue decisions are explainable and queryable,
5. reviewers can submit complete structured judgments,
6. disagreement is auto-detected,
7. adjudication creates locked truth records,
8. gold promotion is gated correctly,
9. eval packs export deterministically,
10. QA can trace a case from capture through benchmark promotion,
11. at least one release-level failure report can be generated from real reviewed cases.

---

## 25. Anti-patterns to forbid

The implementation must explicitly avoid the following anti-patterns:

- storing everything in one giant JSON field and calling it a system,
- allowing free-form reviewer notes without normalized labels,
- allowing gold promotion by vibes,
- allowing silent lifecycle jumps,
- using reviewed cases without version metadata,
- generating eval packs from unstable or partial truth states,
- mixing reviewer identity into reusable benchmark exports,
- relying on manual spreadsheet ops as the primary source of truth.

---

## 26. Immediate implementation sequence for engineering

Engineering should execute in this exact order:

1. create migrations,
2. define shared TypeScript types,
3. implement create/normalize/run endpoints,
4. implement queue-decision service,
5. implement review submission API with hard validation,
6. build review queue screen,
7. build case detail review screen,
8. implement disagreement detection,
9. implement adjudication flow,
10. implement gold promotion,
11. implement eval-pack export,
12. implement reporting queries,
13. run full QA matrix,
14. freeze v1 substrate contract.

---

## 27. Final standard

A world-class substrate is not measured by how much data it stores.

It is measured by whether the system can reliably convert messy real inputs and structured human judgment into stable product learning.

That is the standard this build track must meet.
