-- 001_real_input_corpus_substrate.sql
-- Real-input corpus + learned-judgment substrate
-- PostgreSQL 14+

BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- =========================================================
-- ENUMS
-- =========================================================

CREATE TYPE ric_case_type AS ENUM (
  'nds_real_input',
  'essay_feedback_real_input',
  'imported_guidance_request',
  'red_team_case',
  'curated_gold_seed'
);

CREATE TYPE ric_product_surface AS ENUM (
  'narrative_direction_selection',
  'essay_feedback'
);

CREATE TYPE ric_source_channel AS ENUM (
  'live_product',
  'manual_import',
  'support_log',
  'evaluation_seed',
  'reviewer_authored'
);

CREATE TYPE ric_lifecycle_status AS ENUM (
  'new',
  'capture_failed',
  'captured',
  'normalization_failed',
  'normalized',
  'run_attached',
  'review_exempt',
  'review_queued',
  'in_review',
  'review_complete',
  'adjudication_required',
  'adjudicated',
  'gold_candidate',
  'gold',
  'eval_pack_eligible',
  'archived',
  'rejected'
);

CREATE TYPE ric_review_priority AS ENUM (
  'none',
  'low',
  'normal',
  'high',
  'urgent',
  'gold_candidate'
);

CREATE TYPE ric_truth_status AS ENUM (
  'unreviewed',
  'weak_signal',
  'review_backed',
  'adjudicated',
  'gold'
);

CREATE TYPE ric_normalization_status AS ENUM (
  'pending',
  'success',
  'partial',
  'failed'
);

CREATE TYPE ric_extracted_intent AS ENUM (
  'seeking_topic_direction',
  'seeking_narrative_selection',
  'seeking_structural_help',
  'seeking_feedback',
  'mixed',
  'unclear'
);

CREATE TYPE ric_extracted_essay_stage AS ENUM (
  'blank_page',
  'rough_idea',
  'partial_draft',
  'full_draft',
  'unknown'
);

CREATE TYPE ric_extracted_prompt_type AS ENUM (
  'personal_statement',
  'supplemental',
  'identity',
  'community',
  'why_school',
  'challenge',
  'activity',
  'other',
  'unknown'
);

CREATE TYPE ric_extracted_emotional_signal AS ENUM (
  'neutral',
  'anxious',
  'overwhelmed',
  'hopeful',
  'confident',
  'self_doubting',
  'mixed',
  'unclear'
);

CREATE TYPE ric_run_status AS ENUM (
  'success',
  'partial_success',
  'fallback_success',
  'failed'
);

CREATE TYPE ric_output_role AS ENUM (
  'final',
  'candidate',
  'fallback',
  'redraft'
);

CREATE TYPE ric_queue_decision AS ENUM (
  'review_exempt',
  'spot_check',
  'full_review',
  'adjudication_priority',
  'gold_candidate_review'
);

CREATE TYPE ric_review_status AS ENUM (
  'draft',
  'submitted',
  'superseded'
);

CREATE TYPE ric_review_decision AS ENUM (
  'approve',
  'approve_with_minor_edits',
  'usable_but_weak',
  'not_usable',
  'unsafe_or_off_policy'
);

CREATE TYPE ric_failure_mode AS ENUM (
  'generic_advice',
  'fake_depth',
  'overconfident_inference',
  'weak_narrative_differentiation',
  'poor_student_fit_read',
  'shallow_evidence_use',
  'too_broad_unfocused',
  'too_polished_ai_sounding',
  'misread_emotional_signal',
  'weak_actionability',
  'confusing_structure',
  'unsupported_recommendation',
  'policy_safety_risk',
  'wrong_essay_type_assumption',
  'style_drift_from_product_standard'
);

CREATE TYPE ric_severity AS ENUM (
  'low',
  'medium',
  'high',
  'critical'
);

CREATE TYPE ric_adjudication_reason AS ENUM (
  'reviewer_disagreement',
  'gold_candidate_confirmation',
  'high_risk_case',
  'taxonomy_gap',
  'ops_escalation'
);

CREATE TYPE ric_adjudicated_truth_status AS ENUM (
  'adjudicated_usable',
  'adjudicated_not_usable',
  'adjudicated_gold_ready',
  'adjudicated_needs_rework'
);

CREATE TYPE ric_pack_type AS ENUM (
  'broad_regression',
  'failure_focused',
  'sparse_edge',
  'gold_benchmark'
);

-- =========================================================
-- TIMESTAMP TRIGGER
-- =========================================================

CREATE OR REPLACE FUNCTION ric_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =========================================================
-- TABLES
-- =========================================================

CREATE TABLE cases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_key TEXT NOT NULL UNIQUE,
  case_type ric_case_type NOT NULL,
  product_surface ric_product_surface NOT NULL,
  source_channel ric_source_channel NOT NULL,
  lifecycle_status ric_lifecycle_status NOT NULL DEFAULT 'new',
  review_priority ric_review_priority NOT NULL DEFAULT 'none',
  current_truth_status ric_truth_status,
  label_schema_version TEXT NOT NULL,
  routing_policy_version TEXT,
  prompt_template_version TEXT,
  release_version TEXT,
  tags_json JSONB NOT NULL DEFAULT '[]'::jsonb,
  notes_internal TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  archived_at TIMESTAMPTZ,
  CONSTRAINT cases_tags_json_is_array CHECK (jsonb_typeof(tags_json) = 'array')
);

CREATE TABLE case_inputs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  raw_input_text TEXT NOT NULL,
  normalized_input_text TEXT,
  input_language TEXT NOT NULL DEFAULT 'en',
  raw_word_count INTEGER NOT NULL CHECK (raw_word_count >= 0),
  normalized_word_count INTEGER CHECK (normalized_word_count >= 0),
  normalization_status ric_normalization_status NOT NULL DEFAULT 'pending',
  normalization_errors_json JSONB NOT NULL DEFAULT '[]'::jsonb,
  extracted_intent ric_extracted_intent,
  extracted_essay_stage ric_extracted_essay_stage,
  extracted_prompt_type ric_extracted_prompt_type,
  extracted_ambiguity_level INTEGER CHECK (extracted_ambiguity_level BETWEEN 1 AND 5),
  extracted_emotional_signal ric_extracted_emotional_signal,
  extracted_constraints_json JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT case_inputs_nonempty_raw CHECK (length(trim(raw_input_text)) > 0),
  CONSTRAINT case_inputs_normalization_errors_is_array CHECK (jsonb_typeof(normalization_errors_json) = 'array'),
  CONSTRAINT case_inputs_constraints_is_array CHECK (jsonb_typeof(extracted_constraints_json) = 'array'),
  CONSTRAINT case_inputs_one_row_per_case UNIQUE (case_id)
);

CREATE TABLE case_context (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  student_grade_level TEXT,
  stated_goal_signal TEXT,
  prior_attempts_present BOOLEAN NOT NULL DEFAULT FALSE,
  ambiguity_level INTEGER CHECK (ambiguity_level BETWEEN 1 AND 5),
  complexity_score INTEGER CHECK (complexity_score BETWEEN 1 AND 5),
  sensitivity_flags_json JSONB NOT NULL DEFAULT '[]'::jsonb,
  context_payload_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT case_context_sensitivity_flags_is_array CHECK (jsonb_typeof(sensitivity_flags_json) = 'array'),
  CONSTRAINT case_context_payload_is_object CHECK (jsonb_typeof(context_payload_json) = 'object'),
  CONSTRAINT case_context_one_row_per_case UNIQUE (case_id)
);

CREATE TABLE case_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  run_key TEXT NOT NULL UNIQUE,
  model_provider TEXT NOT NULL,
  model_name TEXT NOT NULL,
  reasoning_mode TEXT,
  routing_policy_version TEXT NOT NULL,
  prompt_template_version TEXT NOT NULL,
  assembly_context_version TEXT,
  fallback_used BOOLEAN NOT NULL DEFAULT FALSE,
  confidence_score NUMERIC(5,4) CHECK (confidence_score >= 0 AND confidence_score <= 1),
  risk_score NUMERIC(5,4) CHECK (risk_score >= 0 AND risk_score <= 1),
  latency_ms INTEGER CHECK (latency_ms >= 0),
  token_input INTEGER CHECK (token_input >= 0),
  token_output INTEGER CHECK (token_output >= 0),
  run_status ric_run_status NOT NULL,
  release_version TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE case_run_inputs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id UUID NOT NULL REFERENCES case_runs(id) ON DELETE CASCADE,
  input_features_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  retrieved_patterns_json JSONB NOT NULL DEFAULT '[]'::jsonb,
  assembly_payload_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT case_run_inputs_features_is_object CHECK (jsonb_typeof(input_features_json) = 'object'),
  CONSTRAINT case_run_inputs_patterns_is_array CHECK (jsonb_typeof(retrieved_patterns_json) = 'array'),
  CONSTRAINT case_run_inputs_payload_is_object CHECK (jsonb_typeof(assembly_payload_json) = 'object'),
  CONSTRAINT case_run_inputs_one_row_per_run UNIQUE (run_id)
);

CREATE TABLE case_outputs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id UUID NOT NULL REFERENCES case_runs(id) ON DELETE CASCADE,
  output_role ric_output_role NOT NULL,
  output_text TEXT NOT NULL,
  output_rank INTEGER CHECK (output_rank IS NULL OR output_rank >= 1),
  selected_for_delivery BOOLEAN NOT NULL DEFAULT FALSE,
  delivered_to_user BOOLEAN NOT NULL DEFAULT FALSE,
  output_metadata_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT case_outputs_nonempty_output CHECK (length(trim(output_text)) > 0),
  CONSTRAINT case_outputs_metadata_is_object CHECK (jsonb_typeof(output_metadata_json) = 'object')
);

CREATE TABLE case_queue_decisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  queue_decision ric_queue_decision NOT NULL,
  queue_reason_codes_json JSONB NOT NULL DEFAULT '[]'::jsonb,
  queue_score NUMERIC(5,4) CHECK (queue_score >= 0 AND queue_score <= 1),
  decided_by TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT case_queue_reason_codes_is_array CHECK (jsonb_typeof(queue_reason_codes_json) = 'array')
);

CREATE TABLE case_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  run_id UUID NOT NULL REFERENCES case_runs(id) ON DELETE CASCADE,
  reviewer_id TEXT NOT NULL,
  review_round INTEGER NOT NULL CHECK (review_round >= 1),
  review_status ric_review_status NOT NULL DEFAULT 'draft',
  decision ric_review_decision NOT NULL,
  rationale_text TEXT,
  generalizable_learning_flag BOOLEAN NOT NULL DEFAULT FALSE,
  promote_to_gold_flag BOOLEAN NOT NULL DEFAULT FALSE,
  requires_adjudication_flag BOOLEAN NOT NULL DEFAULT FALSE,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE case_review_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id UUID NOT NULL REFERENCES case_reviews(id) ON DELETE CASCADE,
  score_dimension TEXT NOT NULL,
  score_value INTEGER NOT NULL CHECK (score_value BETWEEN 1 AND 5),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT case_review_scores_unique_dimension_per_review UNIQUE (review_id, score_dimension)
);

CREATE TABLE case_failure_modes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id UUID NOT NULL REFERENCES case_reviews(id) ON DELETE CASCADE,
  failure_mode ric_failure_mode NOT NULL,
  severity ric_severity NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE case_reason_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id UUID NOT NULL REFERENCES case_reviews(id) ON DELETE CASCADE,
  reason_code TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE case_adjudications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  adjudicator_id TEXT NOT NULL,
  adjudication_reason ric_adjudication_reason NOT NULL,
  final_decision ric_review_decision NOT NULL,
  truth_status ric_adjudicated_truth_status NOT NULL,
  gold_candidate_confirmed BOOLEAN NOT NULL DEFAULT FALSE,
  teaching_notes TEXT,
  label_version_locked TEXT NOT NULL,
  completed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE gold_cases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID NOT NULL UNIQUE REFERENCES cases(id) ON DELETE CASCADE,
  gold_set_id TEXT NOT NULL,
  canonical_label_version TEXT NOT NULL,
  gold_reason TEXT NOT NULL,
  benchmark_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE eval_packs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  eval_pack_key TEXT NOT NULL,
  version TEXT NOT NULL,
  pack_type ric_pack_type NOT NULL,
  selection_logic_text TEXT NOT NULL,
  label_version TEXT NOT NULL,
  created_by TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT eval_packs_unique_key_version UNIQUE (eval_pack_key, version)
);

CREATE TABLE eval_pack_cases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  eval_pack_id UUID NOT NULL REFERENCES eval_packs(id) ON DELETE CASCADE,
  case_id UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  expected_truth_status TEXT NOT NULL,
  expected_failure_modes_json JSONB NOT NULL DEFAULT '[]'::jsonb,
  expected_score_profile_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT eval_pack_cases_unique_membership UNIQUE (eval_pack_id, case_id),
  CONSTRAINT eval_pack_cases_failure_modes_is_array CHECK (jsonb_typeof(expected_failure_modes_json) = 'array'),
  CONSTRAINT eval_pack_cases_score_profile_is_object CHECK (jsonb_typeof(expected_score_profile_json) = 'object')
);

CREATE TABLE case_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID REFERENCES cases(id) ON DELETE CASCADE,
  actor_id TEXT NOT NULL,
  action_type TEXT NOT NULL,
  target_table TEXT NOT NULL,
  target_id UUID,
  payload_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT case_audit_log_payload_is_object CHECK (jsonb_typeof(payload_json) = 'object')
);

-- =========================================================
-- INDEXES
-- =========================================================

CREATE INDEX idx_cases_type_surface_status
  ON cases(case_type, product_surface, lifecycle_status);

CREATE INDEX idx_cases_review_priority_created_at
  ON cases(review_priority, created_at DESC);

CREATE INDEX idx_case_runs_case_id_created_at
  ON case_runs(case_id, created_at DESC);

CREATE INDEX idx_case_outputs_run_id_selected
  ON case_outputs(run_id, selected_for_delivery);

CREATE INDEX idx_case_reviews_case_id_submitted_at
  ON case_reviews(case_id, submitted_at DESC);

CREATE INDEX idx_case_review_scores_review_id_dimension
  ON case_review_scores(review_id, score_dimension);

CREATE INDEX idx_case_failure_modes_review_id_failure_mode
  ON case_failure_modes(review_id, failure_mode);

CREATE INDEX idx_case_adjudications_case_id
  ON case_adjudications(case_id);

CREATE INDEX idx_gold_cases_case_id
  ON gold_cases(case_id);

CREATE INDEX idx_eval_pack_cases_eval_pack_id_case_id
  ON eval_pack_cases(eval_pack_id, case_id);

CREATE INDEX idx_case_audit_log_case_id_created_at
  ON case_audit_log(case_id, created_at DESC);

-- =========================================================
-- UPDATED_AT TRIGGERS
-- =========================================================

CREATE TRIGGER trg_cases_updated_at
BEFORE UPDATE ON cases
FOR EACH ROW EXECUTE FUNCTION ric_set_updated_at();

CREATE TRIGGER trg_case_inputs_updated_at
BEFORE UPDATE ON case_inputs
FOR EACH ROW EXECUTE FUNCTION ric_set_updated_at();

CREATE TRIGGER trg_case_context_updated_at
BEFORE UPDATE ON case_context
FOR EACH ROW EXECUTE FUNCTION ric_set_updated_at();

CREATE TRIGGER trg_case_reviews_updated_at
BEFORE UPDATE ON case_reviews
FOR EACH ROW EXECUTE FUNCTION ric_set_updated_at();

COMMIT;
