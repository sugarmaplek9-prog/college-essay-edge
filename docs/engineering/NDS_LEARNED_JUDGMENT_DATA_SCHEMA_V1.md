# NDS Learned Judgment System — Data Schema V1

**Document ID:** `NDS_LEARNED_JUDGMENT_DATA_SCHEMA_V1`
**Status:** Specification
**Version:** 1.0
**Parent spec:** `NDS_LEARNED_JUDGMENT_SYSTEM_V1`
**Last updated:** 2025-07

---

## Purpose

This document specifies the full database schema required to operate the NDS learned judgment system. It defines all five core tables, every column with types and constraints, index strategy, retention and immutability rules, and the dataset construction principles that govern how rows flow from product runs through labels into training snapshots.

This schema is the ground truth for all downstream ML pipelines. Any drift between the schema defined here and the actual tables in production constitutes a schema contract violation and must be resolved before training proceeds.

---

## Table of Contents

1. [Design Principles](#1-design-principles)
2. [Table A — nds_runs](#2-table-a--nds_runs)
3. [Table B — nds_candidates](#3-table-b--nds_candidates)
4. [Table C — nds_human_labels](#4-table-c--nds_human_labels)
5. [Table D — nds_product_outcomes](#5-table-d--nds_product_outcomes)
6. [Table E — nds_training_snapshots](#6-table-e--nds_training_snapshots)
7. [Relationships and Foreign Keys](#7-relationships-and-foreign-keys)
8. [Index Strategy](#8-index-strategy)
9. [Dataset Construction Principles](#9-dataset-construction-principles)
10. [Leakage Prevention Rules](#10-leakage-prevention-rules)
11. [Retention and Immutability Policy](#11-retention-and-immutability-policy)
12. [Schema Versioning Protocol](#12-schema-versioning-protocol)

---

## 1. Design Principles

### 1.1 Core commitments

1. **Every row is append-only.** No training-relevant row is ever mutated after creation. Corrections are written as new rows with a `supersedes_id` pointer, never as in-place updates.
2. **Every feature used at inference time must be reconstructible from this schema alone.** If a feature cannot be reproduced from stored columns, it must not be used in training or at serving time.
3. **Labels and features are stored separately.** `nds_candidates` stores features and metadata. `nds_human_labels` stores assessments. No label column lives in a feature table.
4. **Training snapshots are immutable views.** `nds_training_snapshots` captures the exact set of rows used for a given training run. The snapshot is frozen at the time training begins and must not be modified afterward.
5. **Production labels are time-stamped with reviewer identity.** All label rows record `reviewer_id`, `labeled_at`, `review_tier`, and `confidence_level` — enabling per-reviewer calibration and label quality auditing.

### 1.2 Storage target

PostgreSQL (via Supabase) is the canonical storage layer. All column types, defaults, and constraints below are PostgreSQL-compatible. JSONB is used for structured free-form payloads (candidate content, essay text, etc.) where schema evolution must remain decoupled from column definitions.

---

## 2. Table A — `nds_runs`

**Purpose:** One row per NDS execution — meaning one row each time the system is invoked to select a narrative direction for a session. This is the root entity. All other tables join to this table.

```sql
CREATE TABLE nds_runs (
  -- Identity
  run_id              UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id          TEXT          NOT NULL,
  user_id             TEXT          NOT NULL,

  -- Invocation metadata
  created_at          TIMESTAMPTZ   NOT NULL DEFAULT now(),
  nds_version         TEXT          NOT NULL,   -- semver string, e.g. "2.4.1"
  route_taken         TEXT          NOT NULL,   -- "show" | "clarify" | "block"
  route_confidence    NUMERIC(5,4)  NOT NULL,   -- 0.0000–1.0000
  selected_candidate_id UUID        REFERENCES nds_candidates(candidate_id),

  -- Input snapshot (raw)
  essay_text          TEXT          NOT NULL,
  essay_word_count    INTEGER       NOT NULL,
  session_context     JSONB         NOT NULL,   -- full session context at invocation time

  -- Derived input features (denormalized for training speed)
  input_word_count            INTEGER,
  input_specificity_score     NUMERIC(5,4),
  input_narrative_signal_count INTEGER,
  input_surface_only_flag     BOOLEAN,
  input_contradiction_detected BOOLEAN,
  input_has_indirect_signal   BOOLEAN,

  -- System state at time of run
  model_config        JSONB         NOT NULL,   -- full model config snapshot
  prompt_version      TEXT          NOT NULL,   -- prompt hash or version ID
  feature_vector_hash TEXT,                     -- SHA-256 of feature vector used

  -- Outcome linkage (populated async, after product events arrive)
  outcome_id          UUID          REFERENCES nds_product_outcomes(outcome_id),

  -- Flag columns
  is_shadow_run       BOOLEAN       NOT NULL DEFAULT false,
  is_excluded_from_training BOOLEAN NOT NULL DEFAULT false,
  exclusion_reason    TEXT,

  CONSTRAINT route_taken_valid CHECK (route_taken IN ('show', 'clarify', 'block')),
  CONSTRAINT route_confidence_range CHECK (route_confidence >= 0 AND route_confidence <= 1)
);
```

### Column notes

| Column | Notes |
|--------|-------|
| `session_id` | External session identifier from the product layer. May map to multiple `run_id` values if the user iterates. |
| `nds_version` | Semver string of the NDS heuristic engine at time of invocation. Critical for isolating training data by version. |
| `route_taken` | The routing decision actually shown to the user. Must match one of the valid route values. |
| `route_confidence` | The confidence score produced by the route/calibration model (or heuristic rule, pre-model). |
| `selected_candidate_id` | FK to the winning candidate. May be NULL when `route_taken = 'block'` and no candidate was surfaced. |
| `session_context` | The full structured context blob. Schema defined in `NDS_CANDIDATE_RERANKER_V1`. |
| `input_specificity_score` | Pre-computed at inference time from the input analysis pipeline. |
| `is_shadow_run` | TRUE when the run was produced by shadow mode (not shown to user in normal flow). |
| `is_excluded_from_training` | Set TRUE if this run should never enter a training dataset (e.g., integration tests, synthetic inputs). |

---

## 3. Table B — `nds_candidates`

**Purpose:** One row per candidate narrative direction generated for a given run. Typically 3–5 candidates per run. Contains the full candidate content, all pre-computed features, and scoring results.

```sql
CREATE TABLE nds_candidates (
  -- Identity
  candidate_id        UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id              UUID          NOT NULL REFERENCES nds_runs(run_id),

  -- Candidate content
  candidate_rank      INTEGER       NOT NULL,   -- 1 = selected, 2+ = alternates
  direction_label     TEXT          NOT NULL,   -- brief label, e.g. "Intellectual Curiosity"
  direction_line      TEXT          NOT NULL,   -- the full one-line direction
  explanation_text    TEXT          NOT NULL,   -- the explanation shown to user
  content_hash        TEXT          NOT NULL,   -- SHA-256 of direction_line + explanation_text

  -- Intrinsic candidate features
  is_selected         BOOLEAN       NOT NULL,
  is_generic          BOOLEAN       NOT NULL,   -- label: no grounding in essay scene
  is_premium          BOOLEAN       NOT NULL,   -- label: premium/prestige without concrete scene
  is_contradiction    BOOLEAN       NOT NULL,   -- label: contradicts essay evidence
  scene_anchor_present BOOLEAN      NOT NULL,   -- at least one concrete scene referenced
  indirect_signal_used BOOLEAN      NOT NULL,   -- uses indirect/implicit evidence
  direction_specificity_score NUMERIC(5,4),
  explanation_grounding_score NUMERIC(5,4),
  word_count_direction INTEGER,
  word_count_explanation INTEGER,

  -- Vs-case features (computed at selection time, relative to input)
  input_to_candidate_alignment_score NUMERIC(5,4),
  candidate_vs_input_overreach_score NUMERIC(5,4),

  -- Relative features (computed at selection time, relative to sibling candidates)
  rank_vs_siblings_specificity INTEGER,        -- 1 = highest specificity in set
  margin_vs_next_best          NUMERIC(5,4),   -- score margin to 2nd-best candidate
  set_generic_count            INTEGER,        -- how many siblings are also generic
  set_all_generic              BOOLEAN,        -- TRUE if every candidate is generic
  set_contradiction_count      INTEGER,
  set_max_specificity          NUMERIC(5,4),

  -- Model scores (populated when models exist; NULL before training)
  reranker_score               NUMERIC(5,4),
  reranker_best_candidate_p    NUMERIC(5,4),   -- P(this is best available)
  reranker_false_premium_p     NUMERIC(5,4),   -- P(false premium)
  reranker_flattening_risk_p   NUMERIC(5,4),   -- P(flattening risk)

  -- Created / audit
  created_at          TIMESTAMPTZ   NOT NULL DEFAULT now(),

  CONSTRAINT candidate_rank_positive CHECK (candidate_rank >= 1)
);
```

### Column notes

| Column | Notes |
|--------|-------|
| `candidate_rank` | Rank order as produced by NDS at run time. 1 = the candidate that was selected (or would have been selected under `show` routing). |
| `is_generic` | Binary label assigned by the feature extraction pipeline, not by the LLM. Definition: no reference to a specific scene, place, event, or concrete attribute from the essay. |
| `is_premium` | Binary label: uses prestige/excellence framing without scene-level evidence. |
| `scene_anchor_present` | TRUE if the candidate's direction line or explanation references at least one concrete scene from the essay text. |
| `explanation_grounding_score` | A 0–1 measure of how specifically the explanation text draws from the essay. |
| `set_all_generic` | Denormalized from sibling rows — TRUE if every candidate in this run's candidate set is generic. Used directly as a training feature for the no-good-candidate detector. |
| `reranker_*` | NULL until the reranker model has been trained and deployed. Shadow runs will populate these. |

---

## 4. Table C — `nds_human_labels`

**Purpose:** Human reviewer assessments of a run. One row per label event — meaning a single reviewer's assessment of a specific run. If a run is reviewed by multiple reviewers (adjudication tier), multiple rows exist with a common `run_id` and different `reviewer_id` values.

```sql
CREATE TABLE nds_human_labels (
  -- Identity
  label_id            UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id              UUID          NOT NULL REFERENCES nds_runs(run_id),
  reviewer_id         TEXT          NOT NULL,   -- internal reviewer handle
  labeled_at          TIMESTAMPTZ   NOT NULL DEFAULT now(),
  supersedes_id       UUID          REFERENCES nds_human_labels(label_id),

  -- Review tier and confidence
  review_tier         TEXT          NOT NULL,   -- "high_value" | "standard" | "lightweight"
  confidence_level    TEXT          NOT NULL,   -- "high" | "medium" | "low"
  review_duration_seconds INTEGER,             -- time spent on review

  -- Case-level labels
  route_verdict       TEXT          NOT NULL,   -- "correct" | "incorrect" | "borderline"
  route_correct_would_be TEXT,                 -- "show" | "clarify" | "block" if incorrect
  case_failure_class  TEXT,                    -- "candidate_generation" | "trust_calibration" | "routing_calibration" | "none"
  no_good_candidate   BOOLEAN       NOT NULL,   -- TRUE if no candidate in set was acceptable quality
  clarification_better BOOLEAN     NOT NULL,   -- TRUE if clarify would have been better than show

  -- Candidate-level labels (per winning candidate)
  selected_candidate_quality TEXT   NOT NULL,   -- "good" | "acceptable" | "poor" | "harmful"
  better_candidate_existed    BOOLEAN NOT NULL, -- TRUE if a non-selected candidate was better
  better_candidate_id         UUID   REFERENCES nds_candidates(candidate_id),

  -- Output-level labels
  direction_line_accurate     BOOLEAN NOT NULL,
  direction_line_grounded     BOOLEAN NOT NULL,   -- grounded in essay evidence
  direction_line_premium_flag BOOLEAN NOT NULL,   -- surface prestige without scene
  direction_line_flattening   BOOLEAN NOT NULL,   -- flattens student voice
  explanation_accurate        BOOLEAN NOT NULL,
  explanation_grounded        BOOLEAN NOT NULL,
  explanation_adds_value      BOOLEAN NOT NULL,

  -- Trust signal labels
  trust_verdict       TEXT          NOT NULL,   -- "trusted" | "untrusted" | "borderline"
  helpfulness_verdict TEXT          NOT NULL,   -- "helpful" | "neutral" | "harmful"
  false_premium_present BOOLEAN     NOT NULL,
  student_voice_preserved BOOLEAN   NOT NULL,

  -- Free text
  reviewer_notes      TEXT,

  -- Adjudication
  is_adjudicated      BOOLEAN       NOT NULL DEFAULT false,
  adjudicator_id      TEXT,
  adjudicated_at      TIMESTAMPTZ,

  CONSTRAINT review_tier_valid CHECK (review_tier IN ('high_value', 'standard', 'lightweight')),
  CONSTRAINT confidence_valid CHECK (confidence_level IN ('high', 'medium', 'low')),
  CONSTRAINT route_verdict_valid CHECK (route_verdict IN ('correct', 'incorrect', 'borderline')),
  CONSTRAINT candidate_quality_valid CHECK (
    selected_candidate_quality IN ('good', 'acceptable', 'poor', 'harmful')
  ),
  CONSTRAINT trust_verdict_valid CHECK (trust_verdict IN ('trusted', 'untrusted', 'borderline')),
  CONSTRAINT helpfulness_verdict_valid CHECK (helpfulness_verdict IN ('helpful', 'neutral', 'harmful')),
  CONSTRAINT failure_class_valid CHECK (
    case_failure_class IN ('candidate_generation', 'trust_calibration', 'routing_calibration', 'none') OR
    case_failure_class IS NULL
  )
);
```

### Column notes

| Column | Notes |
|--------|-------|
| `supersedes_id` | If a label is corrected after the fact (e.g., after adjudication), the corrected label row points to the row it replaces. Superseded rows are excluded from training but retained for audit. |
| `review_tier` | Controls which workflow the label was produced under. See `NDS_REVIEW_LABELING_WORKBENCH_V1` for tier definitions. |
| `no_good_candidate` | The single most important label for the candidate generation failure class. `TRUE` when the reviewer confirms that no candidate in the set was acceptable. |
| `better_candidate_existed` | TRUE when an alternate (non-selected) candidate in the set was clearly better than the one selected. This is distinct from `no_good_candidate`. |
| `better_candidate_id` | FK to the specific better candidate, when `better_candidate_existed = TRUE`. |
| `false_premium_present` | TRUE when the reviewer identifies false-premium language in the direction line or explanation. |
| `student_voice_preserved` | TRUE when the output respects the student's actual voice and does not generalize or flatten them. |
| `is_adjudicated` | TRUE if this label row was produced or confirmed through the adjudication workflow (multi-reviewer conflict resolution). |

### Label quality rules

1. `no_good_candidate = TRUE` requires `selected_candidate_quality IN ('poor', 'harmful')`.
2. `better_candidate_existed = TRUE` requires `better_candidate_id IS NOT NULL`.
3. `clarification_better = TRUE` implies `route_verdict IN ('incorrect', 'borderline')`.
4. `false_premium_present = TRUE` implies `direction_line_premium_flag = TRUE OR explanation_grounded = FALSE`.
5. When `confidence_level = 'low'`, the row is excluded from training unless adjudicated.

---

## 5. Table D — `nds_product_outcomes`

**Purpose:** Downstream product engagement signals associated with a run. Populated asynchronously as the user interacts with the product after an NDS result is shown. One row per run (upserted as signals arrive).

```sql
CREATE TABLE nds_product_outcomes (
  -- Identity
  outcome_id          UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id              UUID          NOT NULL UNIQUE REFERENCES nds_runs(run_id),
  session_id          TEXT          NOT NULL,
  user_id             TEXT          NOT NULL,
  updated_at          TIMESTAMPTZ   NOT NULL DEFAULT now(),

  -- User engagement with the NDS result
  direction_accepted          BOOLEAN,        -- user explicitly accepted/used the direction
  direction_rejected          BOOLEAN,        -- user explicitly dismissed the direction
  direction_regenerated       BOOLEAN,        -- user requested a new direction immediately
  time_to_first_action_seconds INTEGER,       -- latency until first action after NDS result
  session_continued_after_nds BOOLEAN,        -- user continued writing after seeing result

  -- Essay revision signals (available when student revises after NDS)
  essay_revised_after_nds     BOOLEAN,
  revision_alignment_score    NUMERIC(5,4),   -- how well revision aligns with given direction
  revision_word_count_delta   INTEGER,        -- word count change after revision

  -- Trust proxy signals
  user_re_entered_nds_flow    BOOLEAN,        -- returned to NDS flow (positive trust signal)
  user_exit_after_nds         BOOLEAN,        -- left app immediately (negative trust signal)
  user_help_requested         BOOLEAN,        -- requested help/clarification after NDS result

  -- Data quality
  outcome_completeness_score  NUMERIC(3,2),   -- 0.00–1.00, fraction of expected signals received
  last_signal_at              TIMESTAMPTZ,    -- timestamp of most recently received signal
  is_sufficient_for_training  BOOLEAN NOT NULL DEFAULT false,

  CONSTRAINT outcome_completeness_range CHECK (
    outcome_completeness_score IS NULL OR
    (outcome_completeness_score >= 0 AND outcome_completeness_score <= 1)
  )
);
```

### Column notes

| Column | Notes |
|--------|-------|
| `direction_accepted` | Explicit product-level accept signal (e.g., user clicks "Use this direction"). May be NULL if signal never arrives. |
| `revision_alignment_score` | Computed by comparing the post-NDS essay revision against the given direction line using a lightweight embedding similarity. NULL if no revision occurs. |
| `is_sufficient_for_training` | Set TRUE when `outcome_completeness_score >= 0.6` and at least one meaningful engagement signal is present. Used as a gate for including outcome rows in training datasets. |
| `user_exit_after_nds` | Strong negative signal: user left the product within N seconds of seeing the NDS result. Threshold is N=30s, configurable in model config. |

### Important: outcome rows are weak supervision only

Product outcome signals are noisy proxies for quality. They must be used as weak supervision alongside human labels, not as substitutes. A rejected direction may reflect student resistance to valid guidance; an accepted direction may reflect weak engagement rather than genuine value. Human labels in `nds_human_labels` always take precedence in training dataset construction.

---

## 6. Table E — `nds_training_snapshots`

**Purpose:** An immutable record of every training run: which rows were included, which model was produced, what the evaluation results were, and all hyperparameters. This table makes every trained model fully reproducible.

```sql
CREATE TABLE nds_training_snapshots (
  -- Identity
  snapshot_id         UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at          TIMESTAMPTZ   NOT NULL DEFAULT now(),
  model_type          TEXT          NOT NULL,   -- "reranker" | "no_good_candidate" | "route_calibration" | "trust_helpfulness"
  model_version       TEXT          NOT NULL,   -- semver, e.g. "1.0.0"

  -- Dataset composition
  n_runs_total        INTEGER       NOT NULL,
  n_runs_labeled      INTEGER       NOT NULL,
  n_runs_high_value   INTEGER       NOT NULL,
  n_runs_standard     INTEGER       NOT NULL,
  n_runs_excluded     INTEGER       NOT NULL,
  dataset_split_config JSONB        NOT NULL,   -- train/val/test split fractions and strategy
  run_id_hash_train   TEXT          NOT NULL,   -- SHA-256 of sorted train run_id list (reproducibility)
  run_id_hash_val     TEXT          NOT NULL,
  run_id_hash_test    TEXT          NOT NULL,
  nds_version_filter  TEXT,                     -- if restricted to specific NDS version(s)
  date_range_start    TIMESTAMPTZ,
  date_range_end      TIMESTAMPTZ,

  -- Hyperparameters
  hyperparameters     JSONB         NOT NULL,   -- complete hyperparameter dict
  feature_list        JSONB         NOT NULL,   -- ordered list of feature names used
  feature_hash        TEXT          NOT NULL,   -- SHA-256 of serialized feature_list

  -- Evaluation results (held-out test set)
  eval_results        JSONB         NOT NULL,   -- all metric values, thresholds, confusion matrix
  primary_metric_name TEXT          NOT NULL,   -- the metric used for model selection
  primary_metric_value NUMERIC(6,5) NOT NULL,   -- value on test set
  threshold_config    JSONB         NOT NULL,   -- operating thresholds selected at val time

  -- Artifacts
  model_artifact_path TEXT          NOT NULL,   -- path/URI to serialized model file
  training_log_path   TEXT,                     -- path/URI to full training log
  feature_importance  JSONB,                    -- serialized feature importances

  -- Release state
  is_released         BOOLEAN       NOT NULL DEFAULT false,
  released_at         TIMESTAMPTZ,
  release_notes       TEXT,
  shadow_only         BOOLEAN       NOT NULL DEFAULT true,   -- starts in shadow mode

  CONSTRAINT model_type_valid CHECK (
    model_type IN ('reranker', 'no_good_candidate', 'route_calibration', 'trust_helpfulness')
  )
);
```

### Column notes

| Column | Notes |
|--------|-------|
| `run_id_hash_train/val/test` | SHA-256 hash of the sorted list of `run_id` values in each split. These hashes allow exact reproducibility checks: re-run training with the same hash list and you must get the same model within floating-point tolerance. |
| `feature_hash` | Hash of the feature list. If this changes between versions, it signals a feature set change and the previous model is incomparable. |
| `threshold_config` | The operating thresholds selected from the validation set (e.g., `{"rerank_winner_threshold": 0.65, "no_good_candidate_threshold": 0.72}`). These are the thresholds used at serving time for this model version. |
| `shadow_only` | Starts TRUE for every new model release. Must be set FALSE explicitly after shadow evaluation passes all release gates. |
| `primary_metric_value` | The single number used to decide whether this model version is better than the previous. Must exceed the previous snapshot's value to be a valid upgrade candidate. |

---

## 7. Relationships and Foreign Keys

```
nds_runs
  ├── nds_candidates  (run_id → run_id)     1:many
  ├── nds_human_labels (run_id → run_id)    1:many
  └── nds_product_outcomes (run_id → run_id) 1:1

nds_candidates
  └── nds_human_labels (better_candidate_id → candidate_id)  many:0-1

nds_human_labels
  └── nds_human_labels (supersedes_id → label_id)  self-reference for corrections

nds_training_snapshots
  (no FK constraints — snapshots are immutable records of past states,
   not live foreign-key-joined tables. Run membership is stored in
   run_id_hash columns and in a separate join table below.)
```

### Join table: `nds_snapshot_run_membership`

```sql
CREATE TABLE nds_snapshot_run_membership (
  snapshot_id   UUID  NOT NULL REFERENCES nds_training_snapshots(snapshot_id),
  run_id        UUID  NOT NULL REFERENCES nds_runs(run_id),
  split         TEXT  NOT NULL,   -- "train" | "val" | "test"
  PRIMARY KEY (snapshot_id, run_id),
  CONSTRAINT split_valid CHECK (split IN ('train', 'val', 'test'))
);
```

This table enables exact reconstruction of any historical training dataset without relying on hash lookups alone.

---

## 8. Index Strategy

### `nds_runs`

```sql
CREATE INDEX idx_nds_runs_session_id     ON nds_runs (session_id);
CREATE INDEX idx_nds_runs_user_id        ON nds_runs (user_id);
CREATE INDEX idx_nds_runs_created_at     ON nds_runs (created_at DESC);
CREATE INDEX idx_nds_runs_route_taken    ON nds_runs (route_taken);
CREATE INDEX idx_nds_runs_nds_version    ON nds_runs (nds_version);
CREATE INDEX idx_nds_runs_shadow         ON nds_runs (is_shadow_run) WHERE is_shadow_run = true;
CREATE INDEX idx_nds_runs_excluded       ON nds_runs (is_excluded_from_training)
  WHERE is_excluded_from_training = false;
```

### `nds_candidates`

```sql
CREATE INDEX idx_nds_candidates_run_id   ON nds_candidates (run_id);
CREATE INDEX idx_nds_candidates_selected ON nds_candidates (run_id, is_selected);
CREATE INDEX idx_nds_candidates_generic  ON nds_candidates (is_generic, is_selected);
CREATE INDEX idx_nds_candidates_hash     ON nds_candidates (content_hash);
```

### `nds_human_labels`

```sql
CREATE INDEX idx_nds_labels_run_id       ON nds_human_labels (run_id);
CREATE INDEX idx_nds_labels_reviewer     ON nds_human_labels (reviewer_id);
CREATE INDEX idx_nds_labels_tier         ON nds_human_labels (review_tier);
CREATE INDEX idx_nds_labels_labeled_at   ON nds_human_labels (labeled_at DESC);
CREATE INDEX idx_nds_labels_no_good      ON nds_human_labels (no_good_candidate)
  WHERE no_good_candidate = true;
CREATE INDEX idx_nds_labels_superseded   ON nds_human_labels (supersedes_id)
  WHERE supersedes_id IS NOT NULL;
```

### `nds_product_outcomes`

```sql
CREATE INDEX idx_nds_outcomes_run_id     ON nds_product_outcomes (run_id);
CREATE INDEX idx_nds_outcomes_sufficient ON nds_product_outcomes (is_sufficient_for_training)
  WHERE is_sufficient_for_training = true;
```

### `nds_training_snapshots`

```sql
CREATE INDEX idx_snapshots_model_type    ON nds_training_snapshots (model_type, created_at DESC);
CREATE INDEX idx_snapshots_released      ON nds_training_snapshots (is_released, model_type)
  WHERE is_released = true;
```

---

## 9. Dataset Construction Principles

### 9.1 Which runs enter a training dataset

A run is eligible for training if and only if **all** of the following hold:

1. `is_excluded_from_training = false`
2. At least one `nds_human_labels` row exists for the run, where:
   - `supersedes_id IS NULL` (not a corrected row)
   - `confidence_level IN ('high', 'medium')` OR `is_adjudicated = true`
3. The run's `nds_version` falls within the version filter specified in the training job configuration.
4. `created_at` falls within the date window for the training job.

Runs with only `confidence_level = 'low'` labels are held in a pending pool and excluded until adjudicated.

### 9.2 Train / validation / test split

- Splits are performed **by `session_id`**, not by `run_id`. Runs from the same session must all be in the same split to prevent session-level data leakage.
- Default split: 70% train / 15% val / 15% test.
- Test set is always chronologically the most recent 15% (time-based holdout), not random.
- Val set is sampled randomly from the remainder after test is held out.
- Split assignments are written to `nds_snapshot_run_membership` before training begins and are immutable from that point forward.

### 9.3 Class balance strategy

For training the no-good-candidate detector and other binary classifiers, class imbalance is addressed via:
1. Stratified sampling to ensure both classes appear in all splits with representative proportions.
2. Class-weight correction in the loss function (preferred over oversampling/undersampling for gradient-boosted trees).
3. If the minority class falls below 15% of training data, trigger a review queue priority bump to increase high-value labeling of minority-class runs before the training job is scheduled.

### 9.4 Label aggregation when multiple reviewers

When a run has multiple label rows (adjudication tier), the following precedence rules determine the canonical label used in training:

1. If an adjudicated row exists (`is_adjudicated = true`): use that row exclusively.
2. If all non-superseded reviewer rows agree on the primary label: use majority value.
3. If reviewer rows disagree on the primary label: the run is held out of training until adjudication completes.

---

## 10. Leakage Prevention Rules

These rules are enforced in the dataset construction pipeline and audited in every training run log:

| Rule | Description |
|------|-------------|
| **L1: Session isolation** | No session appears in more than one split. Checked by asserting `COUNT(DISTINCT session_id) = n` in each split. |
| **L2: Temporal holdout** | Test set uses only runs from the most recent chronological window. Test set `min(created_at)` must exceed train set `max(created_at)`. |
| **L3: No future outcome signals in features** | `nds_product_outcomes` signals are not used as features in any model. They are only used as weak supervision labels. No outcome signal collected after t=0 (run time) may appear as a feature. |
| **L4: Label-free feature tables** | Feature extraction pipelines read only from `nds_runs` and `nds_candidates`. They must not read from `nds_human_labels` or `nds_product_outcomes`. |
| **L5: Version isolation option** | When training on a specific `nds_version`, all candidates produced by that version are included consistently. Partial-version training (mixing runs from a version that only ran in shadow mode) requires an explicit override flag with written justification. |
| **L6: No reviewer identity in features** | `reviewer_id` must never appear as a feature. It may only be used for reviewer calibration analysis in separate audit scripts. |

---

## 11. Retention and Immutability Policy

### 11.1 Retention periods

| Table | Retention |
|-------|-----------|
| `nds_runs` | Permanent (no deletion) |
| `nds_candidates` | Permanent |
| `nds_human_labels` | Permanent, including superseded rows |
| `nds_product_outcomes` | 24 months rolling (older rows archived to cold storage) |
| `nds_training_snapshots` | Permanent |
| `nds_snapshot_run_membership` | Permanent |

### 11.2 Immutability enforcement

- No `UPDATE` or `DELETE` statements are permitted on `nds_runs`, `nds_candidates`, or `nds_human_labels` by any application code path.
- The Supabase Row Level Security policy must explicitly revoke `UPDATE` and `DELETE` privileges for the application service role on these tables.
- Exception: `nds_runs.outcome_id` may be set once after the outcome row is created (back-fill FK). After the first set, it must not be changed.

### 11.3 Corrections protocol

If an error is found in a stored row:
1. Create a new row with corrected values.
2. Set `supersedes_id` (for labels) or add a `correction_note` (for runs, in `exclusion_reason`) pointing to the original row.
3. The original row must not be modified. Training pipelines must always exclude superseded rows.

---

## 12. Schema Versioning Protocol

### 12.1 Versioning rules

- This document is schema version `v1`.
- Any backward-incompatible change (column removal, type change, constraint tightening) requires a new schema version document (`NDS_LEARNED_JUDGMENT_DATA_SCHEMA_V2`).
- Additive changes (new nullable columns, new tables) may be applied under a minor version (`v1.1`, `v1.2`) with a changelog entry appended to this document.

### 12.2 Migration requirements

All migrations must:
1. Be written as idempotent, numbered SQL migration files.
2. Include a rollback path.
3. Be tested against a copy of production schema before execution.
4. Be recorded in `nds_training_snapshots.hyperparameters` for any training run that occurs after the migration: the `schema_version` key must be set.

### 12.3 Cross-spec schema contracts

| Child spec | Depends on these tables | Notes |
|---|---|---|
| `NDS_CANDIDATE_RERANKER_V1` | `nds_runs`, `nds_candidates`, `nds_human_labels` | Feature extraction reads all three |
| `NDS_ROUTE_CALIBRATION_MODEL_V1` | `nds_runs`, `nds_candidates`, `nds_human_labels` | Especially `route_verdict` and `case_failure_class` |
| `NDS_TRUST_AND_HELPFULNESS_MODEL_V1` | `nds_runs`, `nds_candidates`, `nds_human_labels`, `nds_product_outcomes` | Combines labels with weak supervision |
| `NDS_REVIEW_LABELING_WORKBENCH_V1` | `nds_runs`, `nds_candidates`, `nds_human_labels` | Writes to `nds_human_labels`; reads from the first two |
| `NDS_LEARNED_JUDGMENT_SHADOW_MODE_V1` | `nds_runs`, `nds_candidates`, `nds_training_snapshots` | Reads model scores, writes shadow run rows |

---

*End of NDS_LEARNED_JUDGMENT_DATA_SCHEMA_V1*
