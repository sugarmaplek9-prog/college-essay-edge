// =============================================================
// src/types/ai.ts
// TypeScript types for the College Essay Edge AI spine.
// Mirrors the database schema. Used by services, route handlers,
// worker, and tests.
// =============================================================

// =============================================================
// ENUM TYPES — mirror database enum values exactly
// =============================================================

export type RunTriggerType =
  | 'user_action'
  | 'artifact_created'
  | 'artifact_updated'
  | 'refresh'
  | 'admin_replay'
  | 'benchmark_run';

export type SubjectEntityType =
  | 'student_profile'
  | 'story_entry'
  | 'essay_project'
  | 'essay_draft_version'
  | 'supplement_project'
  | 'supplement_draft_version';

export type ExecutionMode =
  | 'standard'
  | 'reduced_scope'
  | 'diagnostic_only'
  | 'needs_more_input'
  | 'refresh';

export type RunReadinessState =
  | 'ready'
  | 'reduced'
  | 'insufficient_input'
  | 'stale_context'
  | 'blocked';

export type RunStatus =
  | 'queued'
  | 'running'
  | 'completed'
  | 'partial'
  | 'needs_more_input'
  | 'failed_validation'
  | 'blocked'
  | 'system_error';

export type ArtifactStatus =
  | 'success'
  | 'partial'
  | 'needs_more_input'
  | 'failed_validation'
  | 'blocked';

export type ArtifactLinkRole =
  | 'primary_subject'
  | 'evidence_source'
  | 'selected_dependency'
  | 'overlap_context'
  | 'school_context';

export type SelectionContext =
  | 'direction_choice'
  | 'supplement_angle_choice'
  | 'story_candidate_choice'
  | 'revision_priority_ack';

export type ValidatorDecision =
  | 'accept'
  | 'accept_partial'
  | 'retry_tightened'
  | 'retry_reduced_scope'
  | 'convert_to_needs_more_input'
  | 'block';

export type ValidatorSeverity = 'low' | 'medium' | 'high' | 'critical';

// =============================================================
// DATABASE ROW TYPES
// =============================================================

export interface ModuleRegistry {
  id: string;
  module_key: string;
  display_name: string;
  is_enabled: boolean;
  created_at: string;
}

export interface AiRun {
  id: string;
  module_id: string;
  student_user_id: string;
  trigger_type: RunTriggerType;
  subject_entity_type: SubjectEntityType;
  subject_entity_id: string;
  execution_mode: ExecutionMode;
  readiness_state: RunReadinessState;
  status: RunStatus;
  retry_count: number;
  fallback_applied: boolean;
  fallback_reason_code: string | null;
  provider_key: string | null;
  model_key: string | null;
  prompt_bundle_version_id: string | null;
  schema_version_id: string | null;
  validator_version_id: string | null;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
}

export interface AiArtifact {
  id: string;
  run_id: string;
  module_id: string;
  student_user_id: string;
  subject_entity_type: SubjectEntityType;
  subject_entity_id: string;
  artifact_status: ArtifactStatus;
  summary_text: string;
  payload_json: Record<string, unknown>;
  warnings_json: string[];
  meta_json: Record<string, unknown>;
  is_canonical_for_subject: boolean;
  selected_by_user: boolean;
  selected_item_id: string | null;
  render_version: string;
  created_at: string;
  superseded_at: string | null;
}

export interface ArtifactSubjectLink {
  id: string;
  artifact_id: string;
  linked_entity_type: SubjectEntityType;
  linked_entity_id: string;
  link_role: ArtifactLinkRole;
  created_at: string;
}

export interface ArtifactSelectionEvent {
  id: string;
  artifact_id: string;
  student_user_id: string;
  selected_item_id: string;
  selected_rank: number | null;
  selection_context: SelectionContext;
  created_at: string;
}

export interface ValidatorResult {
  id: string;
  run_id: string;
  artifact_id: string | null;
  module_id: string;
  validator_version_id: string | null;
  structural_pass: boolean;
  semantic_pass: boolean;
  brand_pass: boolean;
  authenticity_pass: boolean;
  admissibility_decision: ValidatorDecision;
  highest_severity: ValidatorSeverity;
  failure_codes_json: string[];
  warning_codes_json: string[];
  needs_more_input_reason_code: string | null;
  created_at: string;
}

// =============================================================
// NARRATIVE DIRECTION SELECTION PAYLOAD CONTRACT
// Part 3 of the engineering directive. This is the canonical
// payload_json shape persisted in ai_artifacts.payload_json
// for the narrative_direction_selection module.
// =============================================================

export interface NdsDirection {
  id: string;          // e.g. "direction_1"
  angle_title: string;
  core_claim: string;
  why_this_is_the_real_story: string;
  what_it_reveals_about_the_student: string;
  why_it_beats_the_obvious_angle: string;
  main_risk_if_written_poorly: string;
  next_move: string;
}

export interface NdsAlternative {
  id: string;          // must be unique; matches selected_item_id candidates
  angle_title: string;
  what_this_angle_would_focus_on: string;
  why_it_is_weaker: string;
  failure_mode: string;
}

export interface NdsDepthSignals {
  detected_tension: string | null;
  detected_shift: string | null;
  obvious_but_weaker_angle: string | null;
  essay_opportunity: string | null;
}

export interface NdsEvidenceAnchor {
  label: string;
  source_type:
    | 'story_entry'
    | 'essay_draft_version'
    | 'student_profile'
    | 'school_context';
  source_id: string | null;
  excerpt?: string;
  source_index?: number;
  anchor_type?: 'object' | 'person_or_relationship' | 'scene_detail' | 'tension' | 'phrase_fragment' | 'shift';
  hinge_relevance_score?: number;
  support_role?: 'supports_selected' | 'weakens_selected';
}

export type NdsRouteDecision =
  | 'show_strongest_direction'
  | 'ask_question_before_showing'
  | 'regen_candidates'
  | 'fail_closed';

export type NdsConfidenceBand = 'high' | 'medium' | 'low';

export interface NdsCandidateScores {
  student_specificity: number;
  evidence_grounding: number;
  non_genericity: number;
  buildability: number;
  distinctness: number;
  scene_strength: number;
  reflective_potential: number;
  explanation_coherence: number;
  clarification_need: number;
  total_score: number;
}

export interface NdsCandidateValidatorFlags {
  has_banned_abstraction: boolean;
  is_too_generic: boolean;
  has_source_anchor: boolean;
  has_narrative_hinge: boolean;
  is_coaching_instruction: boolean;
  repeatable_direction_risk: boolean;
  passes_direction_rule_lock: boolean;
  has_clear_evidence: boolean;
  is_distinct_from_others: boolean;
  meta_label_reject: boolean;
  meta_label_penalty: boolean;
  meta_label_reason: string | null;
  /** 3-level axis-presence classification: strong = specific axis noun present;
   *  weak = generic structural noun only; missing = no axis noun at all. */
  axis_presence: 'strong' | 'weak' | 'missing';
  degraded_input_mode?: boolean;
  fallback_contaminated?: boolean;
  candidate_duplication_risk?: 'low' | 'medium' | 'high';
  candidate_support_density?: 'strong' | 'medium' | 'weak';
  family_confidence?: 'strong' | 'partial' | 'weak';
  passes_minimum_quality: boolean;
}

export interface NdsCandidateEvidenceSpan {
  text: string;
  start_char: number;
  end_char: number;
}

export interface NdsScoredCandidate {
  candidate_id: string;
  direction_line: string;
  direction_summary: string;
  core_tension: string;
  before_state: string;
  after_state: string;
  evidence_spans: NdsCandidateEvidenceSpan[];
  why_strong: string;
  risk_if_chosen: string;
  clarifying_question_if_uncertain: string;
  scores: NdsCandidateScores;
  validator_flags: NdsCandidateValidatorFlags;
  rank: number;
  selected: boolean;
}

export interface NdsRejectedCandidate {
  candidate_id: string;
  direction_line: string;
  rejection_reasons: string[];
  rejected_direction_rationale?: string;
}

export interface NdsClarifyingQuestionArtifact {
  question_text: string;
  linked_candidate_id: string;
  question_reason:
    | 'disambiguate_tension'
    | 'clarify_shift'
    | 'strengthen_scene'
    | 'resolve_candidate_tie'
    | 'missing_scene'
    | 'missing_reflection'
    | 'axis_collision'
    | 'two_competing_centers'
    | 'low_signal'
    | 'overloaded_input'
    | 'fallback_risk';
}

export interface NdsScoreSummary {
  top_score: number;
  runner_up_score: number;
  score_margin: number;
}

export interface NdsScoringDebugPacket {
  generated_candidate_count: number;
  surviving_candidate_count: number;
  selected_candidate_id: string | null;
  candidate_rankings: Array<{
    candidate_id: string;
    total_score: number;
    rank: number;
  }>;
  candidates: NdsScoredCandidate[];
  rejected_candidates: NdsRejectedCandidate[];
  score_summary: NdsScoreSummary;
  confidence_band: NdsConfidenceBand;
  route_decision: NdsRouteDecision;
  clarification_reason?: string;
  clarification_specificity?: 'strong' | 'medium' | 'weak';
  clarification_targets_actual_ambiguity?: boolean;
  trust_mode?: 'standard' | 'degraded_input';
  output_assertiveness?: 'high' | 'medium' | 'low';
  direction_line_confidence_fit?: 'strong' | 'borderline' | 'weak';
  explanation_restraint_mode?: boolean;
  generation_metadata?: {
    raw_note_count?: number;
    anchor_candidates_extracted?: Array<{
      text: string;
      source_id: string | null;
      source_type: 'story_entry' | 'essay_draft_version';
      anchor_type: 'object' | 'person_or_relationship' | 'scene_detail' | 'tension' | 'phrase_fragment' | 'shift';
      source_index: number;
    }>;
    hinge_candidates_extracted?: Array<{
      text: string;
      source_id: string | null;
      source_type: 'story_entry' | 'essay_draft_version';
      source_index: number;
      hinge_relevance_score: number;
    }>;
    candidate_scores_by_dimension?: Array<{
      candidate_id: string;
      direction_line: string;
      source_grounding: number;
      anchor_retention: number;
      narrative_hinge_clarity: number;
      draftability: number;
      individualization: number;
      non_repeatability: number;
      coaching_usefulness: number;
      abstraction_penalty: number;
      total_score: number;
    }>;
  };
}

export interface NdsPayloadSuccess {
  status: 'success';
  best_direction: NdsDirection;
  recommended_direction?: string;
  why_this_direction?: string;
  alternatives: NdsAlternative[];
  evidence_anchors: NdsEvidenceAnchor[];
  rejected_direction_rationale?: string;
  generation_metadata?: NdsScoringDebugPacket['generation_metadata'];
  depth_signals: NdsDepthSignals;
  recovery_question: null;
  selected_candidate_id?: string;
  confidence_band?: NdsConfidenceBand;
  route_decision?: NdsRouteDecision;
  score_summary?: NdsScoreSummary;
  candidates?: NdsScoredCandidate[];
  rejected_candidates?: NdsRejectedCandidate[];
  clarifying_question?: NdsClarifyingQuestionArtifact | null;
  scoring_debug?: NdsScoringDebugPacket;
}

export interface NdsPayloadNeedsMoreInput {
  status: 'needs_more_input';
  best_direction: null;
  alternatives: [];
  evidence_anchors: [];
  depth_signals: {
    detected_tension: null;
    detected_shift: null;
    obvious_but_weaker_angle: null;
    essay_opportunity: null;
  };
  recovery_question: string;
  selected_candidate_id?: string | null;
  confidence_band?: NdsConfidenceBand;
  route_decision?: NdsRouteDecision;
  score_summary?: NdsScoreSummary;
  candidates?: NdsScoredCandidate[];
  rejected_candidates?: NdsRejectedCandidate[];
  clarifying_question?: NdsClarifyingQuestionArtifact | null;
  scoring_debug?: NdsScoringDebugPacket;
}

export type NdsPayload = NdsPayloadSuccess | NdsPayloadNeedsMoreInput;

// =============================================================
// API REQUEST / RESPONSE SHAPES
// =============================================================

export interface CreateRunRequest {
  module: string;
  subject: {
    entity_type: SubjectEntityType;
    entity_id: string;
  };
  trigger: {
    type: RunTriggerType;
    name: string;
  };
  requested_mode: ExecutionMode;
  options: {
    max_retries: number;
    allow_fallback_provider: boolean;
    force_refresh: boolean;
    create_review_if_flagged: boolean;
  };
  client_context: {
    ui_surface: string;
    request_id: string;
  };
}

export interface CreateRunResponse {
  run_id: string;
  module: string;
  status: RunStatus;
  execution_mode: ExecutionMode;
  subject: {
    entity_type: SubjectEntityType;
    entity_id: string;
  };
  created_at: string;
}

export interface GetRunResponse {
  run_id: string;
  module: string;
  status: RunStatus;
  execution_mode: ExecutionMode;
  readiness_state: RunReadinessState;
  subject: {
    entity_type: SubjectEntityType;
    entity_id: string;
  };
  artifact_id: string | null;
  validator_result_id: string | null;
  review_queue_item_id: string | null;
  attempt_count: number;
  created_at: string;
  started_at: string | null;
  completed_at: string | null;
}

export interface GetArtifactResponse {
  run: {
    run_id: string;
    module: string;
    status: RunStatus;
    execution_mode: ExecutionMode;
    readiness_state: RunReadinessState;
  };
  artifact: {
    id: string;
    module: string;
    schema_version: string;
    status: ArtifactStatus;
    summary: string;
    data: Record<string, unknown>;
    warnings: string[];
    meta: {
      selected: boolean;
      is_canonical_for_subject: boolean;
      created_at: string;
    };
  };
  validator: {
    validator_version: string;
    structural_pass: boolean;
    semantic_pass: boolean;
    brand_pass: boolean;
    authenticity_pass: boolean;
    decision: ValidatorDecision;
    severity: ValidatorSeverity;
    failure_codes: string[];
    notes: string[];
  };
  review: {
    queued: boolean;
    queue_item_id: string | null;
  };
}

export interface SelectArtifactRequest {
  selected_item_id: string;
  selected_rank: number | null;
  selection_context: SelectionContext;
}

export interface SelectArtifactResponse {
  artifact_id: string;
  selected_item_id: string;
  status: 'recorded';
  recorded_at: string;
}

// =============================================================
// INTERNAL SERVICE TYPES
// =============================================================

/** Lightweight subject resolved from the database */
export interface ResolvedSubject {
  entityType: SubjectEntityType;
  entityId: string;
  studentUserId: string;
}

/** Readiness precheck result before run creation */
export interface ReadinessPrecheck {
  state: RunReadinessState;
  resolvedMode: ExecutionMode;
  reason?: string;
}

/** Internal context bundle assembled for worker execution.
 *  Never exposed via public API. */
export interface NdsContextBundle {
  essayProject: {
    id: string;
    student_user_id: string;
    title: string;
    status: string;
    selected_direction: string | null;
    current_draft_text: string | null;
  };
  studentProfile: {
    user_id: string;
    first_name: string;
    last_name: string;
    graduation_year: number | null;
    interests: unknown;
    strengths_summary: string | null;
    writing_confidence: number | null;
  } | null;
  storyEntries: Array<{
    id: string;
    title: string;
    body: string;
    category: string | null;
    theme_tags_json: unknown[];
    strength_level: string;
  }>;
  priorSelectedDirection: {
    artifactId: string;
    selectedItemId: string;
    payload: NdsPayload;
  } | null;
  edgeSnapshot: {
    summary_text: string | null;
    strongest_themes_json: unknown;
    story_directions_json: unknown;
  } | null;
}

/** Normalized output from the provider adapter */
export interface ProviderOutput {
  rawText: string;
  parsedPayload: Record<string, unknown>;
  providerKey: string;
  modelKey: string;
  latencyMs: number;
}

/** Structured validator output before DB persistence */
export interface ValidatorOutput {
  structuralPass: boolean;
  semanticPass: boolean;
  brandPass: boolean;
  authenticityPass: boolean;
  decision: ValidatorDecision;
  highestSeverity: ValidatorSeverity;
  failureCodes: string[];
  warningCodes: string[];
  needsMoreInputReasonCode: string | null;
}

// =============================================================
// SPRINT 2 — CONTEXT ASSEMBLER + PROMPT/VALIDATOR V1 CONTRACTS
// =============================================================

export interface NdsResolvedSources {
  essay_project: {
    id: string;
    student_user_id: string;
    title: string;
    status: string;
    selected_direction_artifact_id?: string | null;
  };
  student_profile: {
    user_id: string;
    first_name: string;
    last_name: string;
    grade?: number | null;
    interests?: unknown;
  } | null;
  story_entries: Array<{
    id: string;
    title: string;
    body: string;
    category: string | null;
    created_at?: string;
  }>;
  current_draft: {
    id: string;
    draft_text: string;
    version_number: number;
  } | null;
  school_context: {
    source_id: string;
    target_school: string;
    signal_summary: string;
  } | null;
  source_meta: {
    story_entry_count: number;
    has_current_draft: boolean;
    has_school_context: boolean;
  };
}

export interface NdsNormalizedContextPack {
  module: 'narrative_direction_selection';
  subject: {
    entity_type: 'essay_project';
    entity_id: string;
  };
  student_core: {
    name: string | null;
    grade_level: string | null;
    intended_majors: string[];
    core_interests: string[];
    identity_notes: string[];
  };
  story_signals: Array<{
    source_id: string;
    source_type: 'story_entry';
    event_summary: string;
    change_signal: string;
    evidence_strength: 'high' | 'medium' | 'low';
    recency_rank: number;
    narrative_signal: {
      pattern: 'self_correction_arc' | 'unknown';
      pattern_confidence: 'high' | 'medium' | 'low';
      tension_type: 'initial_mistake' | 'conflict' | 'unknown';
      feedback_present: boolean;
      pivot_present: boolean;
      behavior_change_present: boolean;
      impact_on_others_present: boolean;
    };
    domain_signal: {
      situational_domain:
        | 'debate_conflict'
        | 'community_care'
        | 'peer_teaching'
        | 'technical_leadership'
        | 'research_failure'
        | 'service_operations'
        | 'athletic_recovery'
        | 'other';
      likely_human_stakes: string;
      interpretive_opportunity: string;
    };
  }>;
  draft_signals: Array<{
    source_id: string;
    source_type: 'essay_draft_version';
    signal_summary: string;
    strength: 'high' | 'medium' | 'low';
    authorship_signal: {
      contamination_risk: 'high' | 'medium' | 'low';
      student_scene_evidence: 'present' | 'weak' | 'absent';
      weighting_decision:
        | 'prioritize_story'
        | 'usable_with_caution'
        | 'draft_only_low_trust';
    };
  }>;
  school_signals: Array<{
    source_id: string;
    target_school: string;
    signal_summary: string;
  }>;
  context_gaps: string[];
  assembler_meta: {
    story_signal_count: number;
    draft_signal_count: number;
    school_signal_count: number;
    used_current_draft: boolean;
  };
}

export type ReadinessReasonCode =
  | 'NO_STORY_SIGNAL'
  | 'ONLY_ACTIVITY_LIST'
  | 'NO_CHANGE_SIGNAL'
  | 'THIN_INPUT'
  | 'STALE_DRAFT_CONFLICT'
  | 'MISSING_SUBJECT'
  | 'ACCESS_DENIED'
  | 'WORKFLOW_BLOCKED'
  | 'SUFFICIENT_FOR_STANDARD'
  | 'SUFFICIENT_FOR_REDUCED';

export interface NdsReadinessResult {
  readiness_state: 'ready' | 'reduced' | 'insufficient_input' | 'blocked';
  execution_mode: 'standard' | 'reduced_scope' | 'needs_more_input';
  reasons: ReadinessReasonCode[];
  recommended_recovery_question_type:
    | 'turning_point'
    | 'stakes'
    | 'why_change'
    | 'specificity_gap'
    | null;
}

export interface NdsModuleExecutionInput {
  run_id: string;
  module_key: 'narrative_direction_selection';
  execution_mode: 'standard' | 'reduced_scope' | 'needs_more_input';
  context_pack: NdsNormalizedContextPack;
  module_versions: {
    prompt_version: 'v1';
    schema_version: 'v1';
    validator_version: 'v1';
  };
}

export interface NdsModuleExecutionOutput {
  provider_key: string;
  model_key: string;
  raw_response: Record<string, unknown>;
  candidate_payload: Record<string, unknown>;
  execution_meta: {
    latency_ms: number;
    token_usage: Record<string, number>;
    fallback_applied: boolean;
  };
}

export interface StructuralValidationResult {
  structural_pass: boolean;
  failure_codes: string[];
}

export interface SemanticValidationResult {
  semantic_pass: boolean;
  decision: 'accept' | 'accept_partial' | 'convert_to_needs_more_input' | 'block';
  failure_codes: string[];
  warning_codes: string[];
  highest_severity: ValidatorSeverity;
  needs_more_input_reason_code: string | null;
}
