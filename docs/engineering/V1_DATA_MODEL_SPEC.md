# V1_DATA_MODEL_SPEC

## 1. Purpose

This document defines the authoritative v1 data model for College Essay Edge.

It is the backend truth for:

* core identity and role ownership
* student-owned admissions context
* Story Vault and essay workflow state
* supplement workflow state
* AI artifact persistence
* validator outcomes
* review and label capture
* benchmark case and benchmark result capture
* version provenance and auditability

If implementation, API behavior, UI assumptions, or ad hoc database choices conflict with this document, this document wins.

This is not a loose schema brainstorm.
It is the production data contract for a bounded AI product.

---

## 2. What this spec must solve

The v1 system is not a normal CRUD app.
It is a controlled product where workflow state, structured AI artifacts, validator enforcement, human review, and future learning readiness all depend on what is stored and how. The release gate explicitly requires module execution metadata, prompt/schema/validator provenance, label capture, benchmark candidate promotion, validator outcomes, and retry/fallback outcomes to be stored.

The orchestration layer also requires persistence of module output objects, module version references, validator results, readiness state, execution timestamps, retry count, and user-facing status, while rejecting the idea that raw model output alone becomes product truth.

The current SQL schema covers core user, student, story, essay, school, supplement, subscription, notification, and audit domains, but it does not yet fully elevate AI artifacts, runs, labels, review operations, benchmark records, and provenance into first-class production entities.

This spec fixes that.

---

## 3. Core modeling doctrine

### 3.1 The model is not the record of truth

The product does not store "whatever the model said."
It stores bounded, structured, product-approved artifacts. The module schema spec is explicit that the product ships validated artifacts, not prose blobs.

### 3.2 Student ownership is the center of gravity

Student-authored and student-relevant content must remain student-owned. Permissions explicitly anchor ownership in the student and restrict supporting adults to linked visibility rather than writing control.

### 3.3 Workflow state and artifact state are different things

A project can be in one workflow state while multiple artifacts, runs, validations, and reviews exist around it.
Do not collapse these into one row.

### 3.4 Canonical records must be separable from historical records

The system must preserve history while also supporting a clear "current selected state" for UI and downstream routing.

### 3.5 Review, labels, and benchmarks are not optional metadata

The labeling spec requires structured label families, source hierarchy, and per-artifact labeling records. The release gate requires reviewability, false-pass/false-block capture, and learning readiness.

### 3.6 Provenance must be queryable, not buried in logs

Schema version, validator version, prompt package identity, provider/model identity, retry mode, and execution mode must be stored on first-class records or in tightly coupled provenance tables.

---

## 4. Scope of the v1 data model

This spec covers the locked v1 launch system:

* Edge Snapshot
* Story Vault Analysis
* Narrative Direction Selection
* Essay Feedback
* Supplement Angle Suggestion

It also covers required supporting operations for:

* onboarding
* linked supporting adult visibility
* school planning context required by supplement workflows
* review operations
* benchmark promotion
* audit and provenance

This aligns with the locked scope document, which defines those five as the launch modules and keeps v1 narrow, reviewable, and authenticity-protective.

---

## 5. Data model design decision

### 5.1 Recommended architecture

Use a **hybrid relational + structured JSONB** model:

* relational tables for identity, ownership, state, selections, labels, review, runs, and benchmark records
* JSONB for module payload bodies that are already defined by stable module schemas

This is the correct v1 approach because:

* module payloads are structured but heterogeneous by module
* schema versions will evolve
* engineering still needs strong relational control over ownership, permissions, runs, and review
* the product must stay ML-ready without over-normalizing every nested artifact field too early

### 5.2 Anti-pattern to avoid

Do **not** create one table per AI module output and then scatter review, validator, provenance, and selection data differently in each table.

That is exactly how systems become impossible to query, benchmark, and improve.

---

## 6. Canonical v1 domains

The complete v1 data model is organized into twelve domains.

1. Identity and access
2. Student profile and onboarding
3. Story Vault
4. Essay workspace
5. Supplement workspace
6. School context
7. AI execution and artifacts
8. Validation and admissibility
9. Review and labels
10. Benchmarks and case intelligence
11. Entitlements and operational events
12. Audit and provenance

---

## 7. Domain 1 — Identity and access

### 7.1 `users`

**Purpose**
Top-level application identity record extending `auth.users`.

**Status**
Keep from current schema.

**Required fields**

* `id` UUID PK, FK to auth provider identity
* `email`
* `role` enum: `student | supporting_adult | admin`
* `created_at`
* `updated_at`

**Notes**
`role` is system-level. Users cannot self-change role in v1. Permissions matrix makes role changes admin-only.

### 7.2 `supporting_adult_profiles`

**Purpose**
Profile record for supporting adults.

**Status**
Keep, with relationship context.

### 7.3 `student_support_links`

**Purpose**
Explicit student-to-supporting-adult relationship link.

**Status**
Keep.

**Why it matters**
Supporting-adult visibility is explicit, linked, and read-oriented in v1, not implied by email or billing relationship.

---

## 8. Domain 2 — Student profile and onboarding

### 8.1 `student_profiles`

**Purpose**
Persistent student context used across launch modules.

**Status**
Keep, but tighten semantics.

**Current strengths**
The existing schema already stores grade, graduation year, academic profile band, target school type, interests, strengths summary, writing confidence, and onboarding completion.

**Required v1 fields**

* `user_id` PK/FK
* `first_name`
* `last_name`
* `grade`
* `graduation_year`
* `academic_profile_band`
* `target_school_band`
* `interests_json`
* `writing_confidence`
* `onboarding_complete`
* `created_at`
* `updated_at`

**Recommended additions**

* `student_profile_version` integer
* `profile_completeness_score` integer 0–100
* `last_meaningful_context_update_at` timestamptz
* `discovery_summary_json` JSONB

`strengths_summary` as free text is too loose to serve as system truth by itself.

### 8.2 `onboarding_sessions`

**Purpose**
In-progress onboarding state.

**Status**
Keep.

**Rule**
Do not treat onboarding session payload as canonical long-term profile truth.
It is a transient capture and recovery object.

### 8.3 `edge_snapshot_artifacts`

**Decision**
Replace the current `snapshot_results` table with the general AI artifact system described below, or treat `snapshot_results` as a compatibility layer only.

**Why**
The current `snapshot_results` stores module-shaped fields directly in one table, but v1 needs one consistent artifact persistence model across modules, not a special-case table for only one module.

**Recommendation**
Deprecate `snapshot_results` in favor of `ai_artifacts` with `module_id = edge_snapshot`.

---

## 9. Domain 3 — Story Vault

### 9.1 `story_entries`

**Purpose**
Canonical student-authored story inventory.

**Status**
Keep, but strengthen.

**Current strengths**
The existing schema stores title, body, category, theme tags, strength level, status, and usage flags.

**Required v1 fields**

* `id`
* `student_user_id`
* `title`
* `body`
* `category`
* `theme_tags_json`
* `status`
* `created_at`
* `updated_at`

**Change required**
`strength_level` should no longer be treated as primary truth if it can be written directly by the app without provenance.

**Recommended additions**

* `source_type` enum: `student_written | imported | summarized_from_input`
* `source_session_id` nullable FK
* `story_depth_score` nullable numeric
* `story_specificity_score` nullable numeric
* `last_analysis_artifact_id` nullable FK to `ai_artifacts`
* `user_pinned` boolean
* `archived_at` nullable timestamptz

### 9.2 `story_entry_links`

**Purpose**
Join table connecting story entries to project-level usage.

**Why needed**
The current booleans `used_in_personal_statement` and `used_in_supplements` are too coarse. A story may support multiple projects and specific artifact decisions.

**Required fields**

* `id`
* `story_entry_id`
* `entity_type` enum: `essay_project | supplement_project | ai_artifact | benchmark_case`
* `entity_id`
* `link_reason` enum: `candidate_source | selected_support | overlap_signal | referenced_evidence`
* `created_at`

### 9.3 `story_vault_analysis` persistence rule

Do not create a bespoke `story_vault_analysis_results` table.
Persist Story Vault Analysis as a module artifact in `ai_artifacts`, with optional per-story link rows in `story_entry_links` for selected candidates.

---

## 10. Domain 4 — Essay workspace

### 10.1 `essay_projects`

**Purpose**
Top-level personal statement project record.

**Status**
Keep, but tighten aggressively.

**Current strengths**
The existing schema stores title, selected direction, outline JSON, current draft text, and workflow status.

**Problem**
This mixes canonical project state with mutable artifact bodies and weak provenance.

**Required v1 fields**

* `id`
* `student_user_id`
* `title`
* `status` enum
* `selected_direction_artifact_id` nullable FK to `ai_artifacts`
* `selected_direction_item_id` nullable text
* `current_draft_version_id` nullable FK to `essay_draft_versions`
* `active_outline_artifact_id` nullable FK to `ai_artifacts`
* `created_at`
* `updated_at`

**Remove as canonical fields**

* `selected_direction` text
* `outline_json`
* `current_draft_text`

Those belong either in selected artifact references or draft-version tables.

### 10.2 `essay_draft_versions`

**Purpose**
Canonical draft history for essay projects.

**Decision**
Rename and extend current `essay_versions`.

**Required fields**

* `id`
* `essay_project_id`
* `version_number`
* `draft_text`
* `source_type` enum: `student_authored | pasted | imported | system_preserved`
* `created_by_user_id`
* `created_at`
* `word_count`
* `is_current` boolean

**Rule**
The current draft is a pointer, not a duplicated text field on `essay_projects`.

### 10.3 `essay_feedback_artifacts`

**Decision**
Do not keep `essay_feedback` as a bespoke table as the long-term contract.

**Why**
Essay feedback is a structured module artifact with validator outcomes, warnings, and provenance. The existing `essay_feedback` table captures only payload fragments and loses the broader product contract.

**Recommendation**
Persist Essay Feedback through `ai_artifacts` with `module_id = essay_feedback`.

---

## 11. Domain 5 — Supplement workspace

### 11.1 `supplement_projects`

**Purpose**
Top-level supplement project per student + institution + prompt.

**Status**
Keep, but extend.

**Current strengths**
The existing schema stores student, institution, prompt text, prompt category, draft text, status, and overlap warnings.

**Problems**
It mixes prompt/project identity, mutable draft body, and AI-derived overlap state in one row.

**Required v1 fields**

* `id`
* `student_user_id`
* `institution_id`
* `prompt_text`
* `prompt_category`
* `status`
* `selected_angle_artifact_id` nullable FK to `ai_artifacts`
* `selected_angle_item_id` nullable text
* `current_draft_version_id` nullable FK to `supplement_draft_versions`
* `created_at`
* `updated_at`

**Remove as canonical fields**

* `draft_text`
* `overlap_warnings_json`

### 11.2 `supplement_draft_versions`

**Purpose**
Versioned draft history for each supplement project.

**Required fields**

* `id`
* `supplement_project_id`
* `version_number`
* `draft_text`
* `source_type`
* `created_by_user_id`
* `created_at`
* `word_count`
* `is_current`

### 11.3 Overlap logic note

Overlap Warning is deferred from core launch scope, so do not over-design a dedicated overlap domain for v1. Store any transitional overlap warnings as artifact warnings or artifact-linked review signals, not as a heavyweight standalone subsystem.

---

## 12. Domain 6 — School context

### 12.1 `institutions`

### 12.2 `institution_deadlines`

### 12.3 `student_school_lists`

**Status**
Keep these from the existing SQL with only minor tightening.

**Reason**
They provide school context required for supplement workflows and linked parent visibility.

**Important rule**
Institutional metadata is context support, not AI artifact truth.

---

## 13. Domain 7 — AI execution and artifacts

This is the most important missing domain in the current schema.

### 13.1 `module_registry`

**Purpose**
Canonical list of modules supported by the system.

**Required fields**

* `module_id` PK text
* `display_name`
* `is_launch_module` boolean
* `is_enabled` boolean
* `current_schema_version`
* `validator_profile_key`
* `created_at`
* `updated_at`

**v1 seeded module IDs**

* `edge_snapshot`
* `story_vault_analysis`
* `narrative_direction_selection`
* `essay_feedback`
* `supplement_angle_suggestion`
* `outline_generation` nullable disabled/deferred
* `overlap_warning` nullable disabled/deferred

### 13.2 `ai_runs`

**Purpose**
One row per module invocation attempt.

**Why needed**
The release gate requires execution metadata, validator outcomes, retry/fallback outcomes, and learning readiness. The orchestration spec requires readiness state, retry count, execution mode, and timestamps to be stored.

**Required fields**

* `id` UUID PK
* `module_id` FK to `module_registry`
* `student_user_id` FK to `users`
* `trigger_type` enum: `user_action | artifact_created | artifact_updated | refresh | admin_replay | benchmark_run`
* `subject_entity_type` enum: `student_profile | story_entry | essay_project | essay_draft_version | supplement_project | supplement_draft_version`
* `subject_entity_id` UUID
* `execution_mode` enum: `standard | reduced_scope | diagnostic_only | needs_more_input | refresh`
* `readiness_state` enum: `ready | reduced | insufficient_input | stale_context | blocked`
* `status` enum: `queued | running | completed | partial | needs_more_input | failed_validation | blocked | system_error`
* `retry_count` integer
* `fallback_applied` boolean
* `fallback_reason_code` nullable text
* `provider_key` text
* `model_key` text
* `prompt_bundle_version_id` nullable FK
* `schema_version_id` nullable FK
* `validator_version_id` nullable FK
* `started_at`
* `completed_at`
* `created_at`

### 13.3 `ai_artifacts`

**Purpose**
Canonical persisted product-approved module artifact.

**This is the main AI table.**

**Required fields**

* `id` UUID PK
* `run_id` FK to `ai_runs`
* `module_id` FK
* `student_user_id` FK
* `subject_entity_type`
* `subject_entity_id`
* `artifact_status` enum: `success | partial | needs_more_input | failed_validation | blocked`
* `summary_text`
* `payload_json` JSONB
* `warnings_json` JSONB default `[]`
* `meta_json` JSONB default `{}`
* `is_canonical_for_subject` boolean
* `selected_by_user` boolean
* `selected_item_id` nullable text
* `render_version` text
* `created_at`
* `superseded_at` nullable timestamptz

**Why JSONB here is correct**
The module output schema already defines a common root envelope and stable module-specific payload shapes, making JSONB artifact storage appropriate when paired with schema-version and validator-version references.

### 13.4 `artifact_subject_links`

**Purpose**
Many-to-many links between artifacts and other entities used as evidence or context.

**Use cases**

* narrative direction artifact linked to multiple story entries
* supplement angle artifact linked to one institution and one essay project
* essay feedback artifact linked to a specific draft version

**Required fields**

* `id`
* `artifact_id`
* `linked_entity_type`
* `linked_entity_id`
* `link_role` enum: `primary_subject | evidence_source | selected_dependency | overlap_context | school_context`
* `created_at`

### 13.5 `artifact_selection_events`

**Purpose**
Store explicit user decisions on ranked options inside artifacts.

**Why needed**
Choice quality is a core moat for v1. User selection is an important outcome signal and should not be inferred only from downstream project mutation. Labeling spec explicitly treats user-selected recommendation and changed direction as important outcome labels.

**Required fields**

* `id`
* `artifact_id`
* `student_user_id`
* `selected_item_id`
* `selected_rank` integer nullable
* `selection_context` enum: `direction_choice | supplement_angle_choice | story_candidate_choice | revision_priority_ack`
* `created_at`

---

## 14. Domain 8 — Validation and admissibility

### 14.1 `validator_profiles`

**Purpose**
Reference table for validator configuration by module and version.

### 14.2 `validator_results`

**Purpose**
Structured validator output per run or per artifact.

**Why needed**
The validator is a decision engine with layer outcomes, failure codes, severity, and admissibility decisions. These must be stored as structured product truth, not scattered strings.

**Required fields**

* `id`
* `run_id` FK
* `artifact_id` nullable FK
* `module_id`
* `validator_version_id`
* `structural_pass` boolean
* `semantic_pass` boolean
* `brand_pass` boolean
* `authenticity_pass` boolean
* `admissibility_decision` enum: `accept | accept_partial | retry_tightened | retry_reduced_scope | convert_to_needs_more_input | block`
* `highest_severity` enum: `low | medium | high | critical`
* `failure_codes_json` JSONB array
* `warning_codes_json` JSONB array
* `needs_more_input_reason_code` nullable text
* `created_at`

**Failure code source**
Store canonical codes defined by validator rules, including structural, semantic, brand/authenticity, and input-quality failures such as `weak_decision_pressure`, `low_specificity_feedback`, `school_agnostic_angle`, `ghostwriting_drift`, `final_prose_risk`, and `insufficient_input_depth`.

### 14.3 `retry_decisions`

**Purpose**
Track retry/fallback steps applied after validation.

**Required fields**

* `id`
* `run_id`
* `attempt_number`
* `decision_type` enum: `retry_tightened | retry_reduced_scope | convert_to_needs_more_input | block | accept_partial`
* `reason_codes_json`
* `applied_config_json`
* `created_at`

---

## 15. Domain 9 — Review and labels

### 15.1 `review_queue_items`

**Purpose**
Queue of artifacts requiring human inspection.

**Why needed**
The release gate requires flagged outputs to be inspectable, labelable, and review-operated post-launch.

**Required fields**

* `id`
* `artifact_id`
* `student_user_id`
* `module_id`
* `queue_reason` enum: `genericity_risk | authenticity_risk | validator_borderline | benchmark_candidate | manual_escalation | false_pass_report | false_block_report`
* `priority` enum: `low | medium | high | urgent`
* `status` enum: `open | in_review | resolved | escalated`
* `assigned_reviewer_user_id` nullable
* `created_at`
* `resolved_at` nullable

### 15.2 `artifact_reviews`

**Purpose**
One human review record per review event.

**Required fields**

* `id`
* `artifact_id`
* `review_queue_item_id` nullable
* `reviewer_user_id`
* `review_type` enum: `standard | escalation | benchmark | post_change | spot_check`
* `review_summary`
* `notes`
* `created_at`

### 15.3 `artifact_labels`

**Purpose**
Structured label record attached to one artifact review source.

**This table is mandatory.**

**Required fields**

* `id`
* `artifact_id`
* `module_id`
* `labeler_user_id` nullable
* `label_source` enum: `human_review | benchmark | validator | derived_outcome`
* `quality_label` enum
* `uniqueness_label` enum
* `authenticity_label` enum
* `substitution_risk_label` enum
* `failure_labels_json` JSONB array
* `outcome_labels_json` JSONB array
* `review_confidence` enum
* `notes`
* `created_at`

This follows the labeling spec almost exactly and should not be weakened.

### 15.4 Label hierarchy rule

Do not overwrite stronger label sources with weaker ones. Preserve separate label rows and resolve interpretation at query time or materialized-view level. The labeling spec explicitly requires source hierarchy preservation.

---

## 16. Domain 10 — Benchmarks and case intelligence

### 16.1 `benchmark_cases`

**Purpose**
Canonical benchmark library record.

**Required fields**

* `id`
* `module_id`
* `case_name`
* `case_summary`
* `case_input_bundle_json`
* `why_this_case_matters`
* `world_class_behavior_target`
* `acceptable_behavior_floor`
* `most_likely_generic_failure`
* `most_likely_authenticity_failure` nullable
* `what_a_reviewer_should_notice`
* `what_the_validator_should_catch`
* `uniqueness_expectation`
* `substitution_risk_interpretation`
* `created_by_user_id`
* `created_at`
* `is_active`

These required annotation fields come directly from the case annotation guide and should be stored structurally, not only as attached prose.

### 16.2 `benchmark_case_artifact_links`

**Purpose**
Link real artifacts promoted into benchmark candidates or benchmark exemplars.

**Required fields**

* `id`
* `benchmark_case_id`
* `artifact_id`
* `link_type` enum: `source_candidate | gold_example | failure_example | comparison_example`
* `created_at`

### 16.3 `benchmark_runs`

**Purpose**
Record executions of the live system against benchmark cases.

**Required fields**

* `id`
* `benchmark_case_id`
* `run_id`
* `artifact_id` nullable
* `review_status` enum: `pending | reviewed | approved | rejected`
* `created_at`

### 16.4 `benchmark_reviews`

**Purpose**
Human review of benchmark outputs.

**Required fields**

* `id`
* `benchmark_run_id`
* `reviewer_user_id`
* `benchmark_grade` enum: `world_class | strong | acceptable | weak | fail`
* `notes`
* `created_at`

---

## 17. Domain 11 — Entitlements and operational events

### 17.1 `subscriptions`

### 17.2 `notification_events`

### 17.3 `audit_events`

**Status**
Keep from existing schema.

**Important note**
These are operational support tables, not substitutes for artifact review or provenance tables.

---

## 18. Domain 12 — Version provenance

This is the second major missing area in the current schema.

### 18.1 `prompt_bundle_versions`

**Purpose**
Versioned identifier for prompt package composition.

**Required fields**

* `id`
* `module_id`
* `version_key`
* `global_identity_version`
* `authenticity_layer_version`
* `module_objective_version`
* `forbidden_patterns_version`
* `created_at`
* `is_active`

The orchestration spec requires prompt composition to remain inspectable and versionable.

### 18.2 `schema_versions`

**Purpose**
Version registry for module output schemas.

**Required fields**

* `id`
* `module_id`
* `schema_version_key`
* `is_active`
* `created_at`

### 18.3 `validator_versions`

**Purpose**
Version registry for validator logic and rule packs.

### 18.4 `context_bundle_snapshots`

**Purpose**
Optional but recommended snapshot of the exact approved context bundle used for a run.

**Required fields**

* `id`
* `run_id`
* `context_summary_json`
* `source_entity_refs_json`
* `compression_notes_json`
* `created_at`

**Why it matters**
The orchestration layer is defined around trigger → assemble → constrain → generate → enforce → persist → learn. If later quality review cannot see what evidence bundle the run used, debugging becomes much weaker.

---

## 19. Canonical entity relationship map

At the highest level, the relationships should be:

* `users` 1:1 `student_profiles` for student users
* `users` 1:1 `supporting_adult_profiles` for supporting-adult users
* `users` 1:N `student_support_links` as either student or adult
* `users` 1:N `onboarding_sessions`
* `users` 1:N `story_entries`
* `users` 1:N `essay_projects`
* `users` 1:N `supplement_projects`
* `essay_projects` 1:N `essay_draft_versions`
* `supplement_projects` 1:N `supplement_draft_versions`
* `module_registry` 1:N `ai_runs`
* `ai_runs` 1:0..1 `ai_artifacts`
* `ai_runs` 1:N `validator_results`
* `ai_runs` 1:N `retry_decisions`
* `ai_artifacts` 1:N `artifact_subject_links`
* `ai_artifacts` 1:N `artifact_selection_events`
* `ai_artifacts` 1:N `review_queue_items`
* `ai_artifacts` 1:N `artifact_reviews`
* `ai_artifacts` 1:N `artifact_labels`
* `benchmark_cases` 1:N `benchmark_runs`
* `benchmark_runs` 1:N `benchmark_reviews`
* `benchmark_cases` N:N `ai_artifacts` through `benchmark_case_artifact_links`

---

## 20. Canonical vs historical rules

### 20.1 Canonical rule

For any subject entity + module pair, at most one artifact may be marked `is_canonical_for_subject = true` at a time.

### 20.2 History rule

Older artifacts are preserved unless explicit retention policy changes later.
Do not delete old artifacts just because a new one is selected.

### 20.3 Draft rule

Draft versions are append-only except for operational correction.
Do not mutate prior user draft versions in place.

### 20.4 Review rule

Reviews and labels are append-only records.
Do not overwrite reviewer judgments.

---

## 21. Soft deletion and archival rules

v1 permissions already exclude most self-service delete flows. The data model should reflect that by preferring soft archival for student content rather than destructive deletes in standard app UX.

**Recommendation**
For user-generated domains, prefer nullable `archived_at` and `archived_by_user_id` over hard delete where product history matters.

Use hard delete only for:

* auth-driven account deletion workflows when legally required
* internal admin cleanup where explicitly permitted
* low-value transient sessions if no audit need exists

---

## 22. Minimal enum set to formalize

The current schema already includes several workflow enums and should keep them.

Add these v1 enums:

* `module_id_enum` or registry-backed module IDs
* `entity_type_enum`
* `artifact_status_enum`
* `run_status_enum`
* `execution_mode_enum`
* `readiness_state_enum`
* `validator_decision_enum`
* `severity_enum`
* `review_queue_reason_enum`
* `review_status_enum`
* `review_type_enum`
* `label_source_enum`
* `quality_label_enum`
* `uniqueness_label_enum`
* `authenticity_label_enum`
* `substitution_risk_label_enum`
* `review_confidence_enum`
* `selection_context_enum`
* `source_type_enum`

---

## 23. Specific review of the current SQL schema

### 23.1 What is good already

The current SQL is solid for:

* auth extension pattern
* user roles
* student/supporting-adult linking
* onboarding persistence
* story inventory basics
* essay and supplement project basics
* institution and deadline context
* subscriptions, notifications, and audit events

That gives a usable application spine.

### 23.2 Where it is weak for the real product

It is weak in five critical places:

1. **AI artifact persistence is fragmented**

   * `snapshot_results` and `essay_feedback` are bespoke tables instead of a unified artifact model.

2. **Project rows carry mutable artifact payloads**

   * `selected_direction`, `outline_json`, `current_draft_text`, `draft_text`, and `overlap_warnings_json` mix workflow state with artifact bodies.

3. **Validator truth is not first-class**

   * there is no structured validator result table with layer pass/fail, failure codes, and admissibility decisions.

4. **Review and labels are missing**

   * there is no production-grade storage for queueing, reviewer actions, label hierarchy, false-pass/false-block capture, or benchmark promotion.

5. **Provenance is missing**

   * there is no first-class prompt/schema/validator version registry attached to runs and artifacts.

### 23.3 Bottom-line judgment

Your current SQL is a good **application schema draft**.
It is not yet a complete **AI product data model**.

This spec closes that gap.

---

## 24. Build order for the database layer

Implement in this order:

### Phase A — keep and clean existing core tables

* `users`
* `student_profiles`
* `supporting_adult_profiles`
* `student_support_links`
* `onboarding_sessions`
* `story_entries`
* `essay_projects`
* `essay_draft_versions`
* `institutions`
* `institution_deadlines`
* `student_school_lists`
* `supplement_projects`
* `supplement_draft_versions`
* `subscriptions`
* `notification_events`
* `audit_events`

### Phase B — add the real AI product spine

* `module_registry`
* `ai_runs`
* `ai_artifacts`
* `artifact_subject_links`
* `artifact_selection_events`
* `validator_profiles`
* `validator_results`
* `retry_decisions`

### Phase C — add human quality operations

* `review_queue_items`
* `artifact_reviews`
* `artifact_labels`

### Phase D — add benchmark and provenance readiness

* `benchmark_cases`
* `benchmark_case_artifact_links`
* `benchmark_runs`
* `benchmark_reviews`
* `prompt_bundle_versions`
* `schema_versions`
* `validator_versions`
* `context_bundle_snapshots`

---

## 25. Non-negotiable implementation rules

1. **No raw model prose becomes product truth without an artifact row.**
2. **No user-visible success exists without a validator result.**
3. **No selected direction or supplement angle is stored as plain text alone if it originated from an artifact.**
4. **No review labels overwrite prior stronger labels.**
5. **No benchmark system is real unless it stores benchmark cases, benchmark runs, and benchmark reviews.**
6. **No module can be ML-ready unless run metadata, validator results, user outcomes, and provenance are queryable.**

These are direct consequences of the orchestration, labeling, validator, and release-gate documents already specified.

---

## 26. Final directive

Implement v1 as a disciplined relational system with a unified artifact spine.

Do not let module outputs live as scattered special-case tables.
Do not let workflow state absorb artifact bodies.
Do not let quality operations exist outside the data model.

The v1 backend truth should be:

* student-centered
* artifact-driven
* validator-enforced
* reviewable
* benchmarkable
* provenance-aware
* ML-ready without becoming overengineered

That is the v1 data model standard.
