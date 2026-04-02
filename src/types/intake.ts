// =============================================================
// src/types/intake.ts
// INTAKE-01: Canonical decision contracts for the Narrative
// Intake Intelligence Layer v1.
//
// Every component of the intake stack imports from here.
// No decision shape is defined anywhere else.
// =============================================================

import type { CanonicalPage3Payload } from '@/types/PAGE_THREE_CANONICAL_PAYLOAD_TYPE_V1';

// =============================================================
// SHARED PROVENANCE + VERSION HOOKS
// =============================================================

export interface IntakeSourceProvenanceRef {
  source_id: string;
  source_type:
    | 'story_entry'
    | 'essay_draft_version'
    | 'student_profile'
    | 'school_context'
    | 'intake_session';
  excerpt?: string | null;
}

export interface IntakeDecisionMeta {
  /** Semver of the decision component that produced this output. */
  decision_version: string;
  /** Taxonomy version used for pattern/signal classification. */
  taxonomy_version: TaxonomyVersion;
  /** ISO-8601 timestamp of when this decision was produced. */
  made_at: string;
  /** Which mechanism produced the decision. */
  made_by: 'classifier' | 'rules' | 'hybrid';
}

export type TaxonomyVersion = 'taxonomy_v1';

// =============================================================
// USABLE SIGNAL DECISION  (INTAKE-03 output contract)
// =============================================================

export type SignalType =
  | 'self_correction_arc'
  | 'identity_shift'
  | 'responsibility_shift'
  | 'conflict_reframe'
  | 'failure_reinterpretation'
  | 'unknown';

export type SignalStrength = 'high' | 'medium' | 'low' | 'none';

export type UsableSignalReasonCode =
  | 'STRONG_SELF_CORRECTION_PRESENT'
  | 'CLEAR_IDENTITY_SHIFT_PRESENT'
  | 'RESPONSIBILITY_SHIFT_DETECTED'
  | 'CONFLICT_REFRAME_DETECTED'
  | 'FAILURE_REINTERPRETATION_DETECTED'
  | 'SCENE_DETAIL_SUFFICIENT'
  | 'AMBIGUOUS_POSSIBLE_SIGNAL'
  | 'RESUME_LIST_ONLY'
  | 'ABSTRACT_VALUES_NO_SCENE'
  | 'NO_SIGNAL_DETECTED'
  | 'CONTAMINATION_MASKS_SIGNAL';

/**
 * Canonical output of the usable narrative signal classifier.
 * Downstream modules use `usable_signal` and `signal_strength`
 * as the primary gate before running any direction logic.
 */
export interface UsableSignalDecision {
  usable_signal: boolean;
  signal_strength: SignalStrength;
  signal_types: SignalType[];
  confidence: 'high' | 'medium' | 'low';
  reason_codes: UsableSignalReasonCode[];
  evidence_sources: IntakeSourceProvenanceRef[];
  meta: IntakeDecisionMeta;
}

// =============================================================
// AUTHORSHIP SIGNAL DECISION  (INTAKE-04 output contract)
// =============================================================

export type AuthorshipCategory =
  | 'student_owned'
  | 'mixed'
  | 'contamination_risk';

export type ContaminationRisk = 'high' | 'medium' | 'low';

export type AuthorshipReasonCode =
  | 'POLISHED_ABSTRACTION_WITHOUT_SCENE'
  | 'DRAFT_CLAIMS_NOT_SUPPORTED_BY_NOTES'
  | 'ADULT_FRAMING_PATTERNS_DETECTED'
  | 'STUDENT_SCENE_EVIDENCE_PRESENT'
  | 'STORY_NOTE_DRAFT_MISMATCH'
  | 'SPECIFICITY_CONSISTENT_WITH_STUDENT'
  | 'ABSTRACT_DENSITY_HIGH'
  | 'SCENE_DETAIL_DENSITY_HIGH'
  | 'MIXED_EVIDENCE_STUDENT_AND_ADULT';

/**
 * Canonical output of the contamination / authorship classifier.
 * Consumed by evidence ranking and viability decision.
 * Replaces the NDS-internal `authorship_signal` sub-object when
 * the full intake stack is active.
 */
export interface AuthorshipSignalDecision {
  authorship_signal: AuthorshipCategory;
  contamination_risk: ContaminationRisk;
  student_scene_evidence: 'present' | 'weak' | 'absent';
  reasons: AuthorshipReasonCode[];
  evidence_sources: IntakeSourceProvenanceRef[];
  meta: IntakeDecisionMeta;
}

// =============================================================
// NARRATIVE PATTERN DECISION  (INTAKE-05 output contract)
// =============================================================

export type NarrativePattern =
  | 'self_correction_arc'
  | 'conflict_reframe'
  | 'identity_shift'
  | 'responsibility_shift'
  | 'usefulness_vs_intention'
  | 'competence_vs_responsibility'
  | 'failure_reinterpretation'
  | 'unknown';

export type PatternConfidence = 'high' | 'medium' | 'low';

export type PatternReasonCode =
  | 'PIVOT_MOMENT_DETECTED'
  | 'BEFORE_AFTER_CONTRAST_PRESENT'
  | 'EXTERNAL_FEEDBACK_CITED'
  | 'INTERNAL_REALIZATION_CITED'
  | 'RESPONSIBILITY_LANGUAGE_PRESENT'
  | 'CONFLICT_FOLLOWED_BY_RESOLUTION'
  | 'FAILURE_FOLLOWED_BY_REINTERPRETATION'
  | 'IDENTITY_CLAIM_SHIFT_DETECTED'
  | 'USEFULNESS_INTENTION_GAP_DETECTED'
  | 'COMPETENCE_RESPONSIBILITY_TENSION'
  | 'INSUFFICIENT_EVIDENCE_FOR_PATTERN'
  | 'MULTIPLE_PATTERNS_COEXIST';

/**
 * Canonical output of the narrative pattern classifier.
 * `primary_pattern` drives downstream angle generation.
 * `secondary_patterns` may influence alternatives.
 * `taxonomy_version` is required for reproducibility.
 */
export interface NarrativePatternDecision {
  primary_pattern: NarrativePattern;
  secondary_patterns: NarrativePattern[];
  confidence: PatternConfidence;
  reason_codes: PatternReasonCode[];
  supporting_evidence: IntakeSourceProvenanceRef[];
  taxonomy_version: TaxonomyVersion;
  meta: IntakeDecisionMeta;
}

// =============================================================
// NEXT QUESTION DECISION  (INTAKE-07 output contract)
// =============================================================

export type QuestionType =
  | 'turning_point'
  | 'stakes'
  | 'consequence'
  | 'scene_detail'
  | 'motivation'
  | 'relationship';

export type QuestionSelectionReason =
  | 'highest_information_gain'
  | 'fills_scene_detail_gap'
  | 'clarifies_pivot_moment'
  | 'establishes_stakes'
  | 'disambiguates_pattern'
  | 'resolves_contamination_ambiguity';

export type NextQuestionReasonCode =
  | 'MISSING_SCENE_DETAIL'
  | 'PIVOT_UNCONFIRMED'
  | 'STAKES_UNKNOWN'
  | 'MOTIVATION_UNCLEAR'
  | 'PATTERN_AMBIGUOUS'
  | 'CONSEQUENCE_NOT_STATED'
  | 'RELATIONSHIP_CONTEXT_MISSING'
  | 'NO_QUESTION_NEEDED_SUFFICIENT_SIGNAL';

/**
 * Canonical output of the next-question selector.
 * Exactly one question is always returned.
 * `fallback_if_unanswered` declares what the system will do
 * if the student does not respond.
 */
export interface NextQuestionDecision {
  question_type: QuestionType;
  question_text: string;
  why_this_question: QuestionSelectionReason;
  reason_codes: NextQuestionReasonCode[];
  fallback_if_unanswered: 'reduced_scope_possible' | 'needs_more_input' | 'blocked';
  evidence_gap_sources: IntakeSourceProvenanceRef[];
  meta: IntakeDecisionMeta;
}

// =============================================================
// RECOMMENDATION VIABILITY DECISION  (INTAKE-08 output contract)
// =============================================================

export type ViabilityDecision =
  | 'success'
  | 'reduced_scope'
  | 'needs_more_input'
  | 'blocked';

export type ViabilityReasonCode =
  | 'SUFFICIENT_SIGNAL_STANDARD'
  | 'SUFFICIENT_FOR_REDUCED'
  | 'DRAFT_ONLY_CONTAMINATION_RISK'
  | 'RESUME_LIST_INSUFFICIENT'
  | 'NO_SCENE_EVIDENCE'
  | 'PATTERN_AMBIGUOUS_PROCEED_REDUCED'
  | 'HIGH_CONTAMINATION_BLOCKS'
  | 'REPEATED_RECOVERY_FAILURE'
  | 'PRIOR_ATTEMPTS_EXHAUSTED'
  | 'CONFLICTING_EVIDENCE_REVIEW_REQUIRED'
  | 'QUESTION_CAP_REACHED_REDUCE';

/**
 * Canonical output of the viability decision engine.
 * Rules make the final decision; ML contributes features.
 * `signal_sufficiency_used` and `contamination_risk_used`
 * record the feature values that triggered this outcome.
 */
export interface RecommendationViabilityDecision {
  decision: ViabilityDecision;
  reason_codes: ViabilityReasonCode[];
  signal_sufficiency_used: SignalStrength;
  contamination_risk_used: ContaminationRisk;
  meta: IntakeDecisionMeta;
}

// =============================================================
// TRUSTED EVIDENCE RANK  (INTAKE-06 output contract)
// =============================================================

export type DowngradeReason =
  | 'contamination_risk_high'
  | 'source_stale'
  | 'source_rejected'
  | 'cross_project_source'
  | 'no_scene_evidence'
  | 'draft_claims_unsupported';

export interface DowngradedSource {
  source_id: string;
  source_type: IntakeSourceProvenanceRef['source_type'];
  reason: DowngradeReason;
}

export type TrustedEvidenceReasonCode =
  | 'STORY_ENTRY_OUTRANKS_POLISHED_DRAFT'
  | 'RECENT_SOURCE_PREFERRED'
  | 'SCENE_DETAIL_ELEVATES_RANK'
  | 'STALE_SOURCE_REMOVED'
  | 'REJECTED_SOURCE_REMOVED'
  | 'CROSS_PROJECT_SOURCE_REMOVED'
  | 'CONTAMINATION_FORCED_DOWNGRADE'
  | 'NO_SOURCES_RANKABLE';

/**
 * Canonical output of the trusted evidence ranking service.
 * `trusted_evidence_rank` is ordered highest-trust-first.
 * Downstream modules must consume evidence in this order.
 * `downgraded_sources` must never re-enter the ranked list.
 */
export interface TrustedEvidenceRank {
  trusted_evidence_rank: string[];
  downgraded_sources: DowngradedSource[];
  reason_codes: TrustedEvidenceReasonCode[];
  meta: IntakeDecisionMeta;
}

// =============================================================
// SCHOOL CONTEXT USE DECISION  (INTAKE-09 output contract)
// =============================================================

export type SchoolContextUseDecision = 'use' | 'ignore' | 'hold';

export type SchoolContextReasonCode =
  | 'SUPPORTS_EMERGING_PATTERN'
  | 'ADDS_SPECIFICITY_TO_ANGLE'
  | 'IRRELEVANT_TO_CURRENT_NARRATIVE'
  | 'GENERIC_PADDING_RISK'
  | 'NO_SCHOOL_CONTEXT_PROVIDED'
  | 'HOLDS_PENDING_MORE_SIGNAL';

/**
 * Canonical output of the school-context relevance ranker.
 * `relevance_score` is 0–1 (0 = no relevance, 1 = highly sharpens angle).
 * Downstream modules ignore school context when decision = 'ignore'.
 */
export interface SchoolContextUseDecisionResult {
  school_context_use: SchoolContextUseDecision;
  relevance_score: number;
  reason: string;
  reason_codes: SchoolContextReasonCode[];
  source_ref: IntakeSourceProvenanceRef | null;
  meta: IntakeDecisionMeta;
}

// =============================================================
// INTAKE ESCALATION DECISION  (INTAKE-10 output contract)
// =============================================================

export type EscalationReason =
  | 'high_contamination_low_student_signal'
  | 'repeated_indecision'
  | 'conflicting_evidence'
  | 'low_confidence_high_steering_risk'
  | 'repeated_recovery_failure'
  | 'no_usable_signal_multiple_attempts';

export type EscalationReasonCode =
  | 'CONTAMINATION_HIGH_SIGNAL_LOW'
  | 'RECOVERY_LOOP_EXCEEDED'
  | 'EVIDENCE_CONFLICT_UNRESOLVABLE'
  | 'STEERING_RISK_TOO_HIGH'
  | 'QUESTION_CAP_NO_SIGNAL'
  | 'ADMIN_FLAG_REVIEW_REQUIRED';

/**
 * Canonical output of the escalation rules engine.
 * `blocking` = true means the system must not auto-commit a
 * recommendation without human review.
 * `escalation_reason` is null when escalate = false.
 */
export interface IntakeEscalationDecision {
  escalate: boolean;
  escalation_reason: EscalationReason | null;
  reason_codes: EscalationReasonCode[];
  blocking: boolean;
  meta: IntakeDecisionMeta;
}

// =============================================================
// CANONICAL INTAKE INTELLIGENCE OBJECT
// INTAKE-17: Full orchestration output contract
// =============================================================

/**
 * The single canonical object returned by the intake orchestrator.
 * All downstream modules (NDS, supplement angle, revision priority)
 * consume this object — they must not re-derive any of the
 * decisions it contains.
 */
export interface IntakeIntelligenceObject {
  intake_session_id: string;
  student_user_id: string;
  subject_entity_id: string;
  usable_signal: UsableSignalDecision;
  authorship_signal: AuthorshipSignalDecision;
  narrative_pattern: NarrativePatternDecision;
  trusted_evidence: TrustedEvidenceRank;
  /** null when signal is sufficient and no question is needed. */
  next_question: NextQuestionDecision | null;
  recommendation_viability: RecommendationViabilityDecision;
  /** null when no school context is present in the session. */
  school_context_use: SchoolContextUseDecisionResult | null;
  escalation: IntakeEscalationDecision;
  created_at: string;
  orchestration_version: string;
}

// =============================================================
// EVIDENCE STRENGTH + PRODUCT MODE  (governance layer)
// =============================================================

/**
 * Canonical product-mode enum.
 * The evidence layer assigns exactly one of these to every session.
 * Frontend MUST route and render based on product_mode only —
 * never infer mode from scattered viability/escalation flags.
 */
export type ProductMode =
  | 'blocked'
  | 'clarification'
  | 'blank_page_intake'
  | 'direction_light'
  | 'direction_full';

export type BlankPageMode =
  | 'topic_probe'
  | 'theme_probe'
  | 'activity_probe'
  | 'scope_reframe'
  | 'blank_page_discovery'
  | 'too_thin_to_recover';

export type TopLevelBlankPageRoute =
  | 'ready_for_nds'
  | 'needs_structured_blank_page_intake'
  | 'true_block';

export type BlankPageTriggerSignal =
  | 'topic_only_intent'
  | 'topic_eligibility_question'
  | 'theme_only_intent'
  | 'trait_show_language'
  | 'activity_domain_only'
  | 'multiple_activity_options'
  | 'scope_uncertain_language'
  | 'blank_page_language'
  | 'no_topic_present'
  | 'empty_or_near_empty_input'
  | 'off_domain_or_unusable';

export interface BlankPageClassification {
  blank_page_intake_detected: boolean;
  blank_page_mode: BlankPageMode | null;
  blank_page_trigger_signals: BlankPageTriggerSignal[];
  blank_page_recovery_reason: string | null;
  blank_page_confidence: 'low' | 'medium' | 'high' | null;
  top_level_blank_page_route: TopLevelBlankPageRoute;
}

/**
 * Output of the deterministic evidence scorer (Phase 1).
 * In Phase 2 this will be replaced/augmented by a trained classifier
 * while preserving this response contract.
 */
export interface EvidenceStrengthPrediction {
  route: ProductMode;
  confidence: number;
  scores: Record<ProductMode, number>;
  blank_page_classification: BlankPageClassification;
  gate_version?: {
    gate_feature_version: string;
    scoring_calibration_version: string;
    route_logic_version: string;
  };
  featureSummary?: {
    sceneSpecificity: number;
    conflictStrength: number;
    reflectionStrength: number;
    ambiguity: number;
  };
}

/**
 * Clarification-mode payload.
 * Shown when product_mode === 'clarification'.
 * Must NOT include full direction content.
 */
export interface ClarificationPayload {
  possibleAngleLabel: string;
  whyNotLockedYet: string;
  missingDetailTargets: string[];
  primaryQuestion: string;
  optionalQuestionChoices?: string[];
  returnTarget?: 'direction' | 'opening';
  coachBehavior?: {
    coach_intervention_type: Array<'diagnose' | 'reject' | 'ask' | 'build' | 'critique' | 'advance'>;
    coach_student_state:
      | 'blank_page_student'
      | 'achievement_clutter_student'
      | 'sensitive_topic_hesitation_student'
      | 'prestige_optimizing_student'
      | 'nearly_there_student'
      | 'default_student';
    coach_escalation_level: 'low' | 'medium' | 'high';
    genericness_risk: 'low' | 'medium' | 'high';
    needs_question: boolean;
    question_goal: 'none' | 'concrete_moment' | 'turning_point' | 'choice' | 'revealing_detail' | 'good_vs_generic_distinction';
    correction_target: 'none' | 'resume_language' | 'meaning_too_early' | 'scene_missing' | 'weak_specificity' | 'generic_helping_language' | 'weak_direction_fit';
    next_move_type: 'start_opening' | 'answer_question' | 'revise_for_specificity' | 'write_next_paragraph' | 'continue_draft';
    coach_confidence: 'low' | 'medium' | 'high';
  };
  missingSignalTag?:
    | 'missing_hinge_scene'
    | 'unresolved_dual_center'
    | 'thin_reflection'
    | 'weak_note_specificity'
    | 'family_duty_not_explicit'
    | 'general_scene_gap'
    | 'indirect_hinge_present_but_underpowered'
    | 'instructional_or_scope_question_needs_reframing'
    | 'truly_insufficient_even_after_recovery';
  clarificationDebug?: {
    missing_signal_type: string;
    template_type: 'scope_reframe' | 'hinge_extraction' | 'standard';
    sharpening_activated: boolean;
  };
  lowSignalRecoveryDebug?: {
    recoverable_low_signal_lane_activated: boolean;
    low_signal_recovery_reason:
      | 'blank_page_intake_request'
      | 'topic_viability_scope_question';
    recovery_lane_confidence_cap: 'low';
    recovery_lane_block_override_reason:
      | 'recoverable_blank_page_request'
      | 'recoverable_topic_validation_request';
  };
}

export type BlankPageQuestionFamily =
  | 'moment_question'
  | 'hinge_question'
  | 'responsibility_question'
  | 'person_over_task_question'
  | 'conflict_question'
  | 'change_question'
  | 'scope_reframe_question'
  | 'blank_page_discovery_question';

export type MissingSignalType =
  | 'missing_moment'
  | 'missing_hinge'
  | 'missing_lived_evidence'
  | 'missing_personal_center'
  | 'missing_scope_frame'
  | 'missing_topic_candidate'
  | 'missing_recoverable_signal';

export type NextStepType =
  | 'answer_primary_question'
  | 'answer_primary_or_secondary_question'
  | 'provide_more_concrete_starting_point'
  | 'recovery_stop';

export type BlankPagePostAnswerRoute =
  | 'direction_light'
  | 'second_recovery_question'
  | 'clarification'
  | 'too_thin_to_recover';

export interface RecoveredSignalSummary {
  has_concrete_moment: boolean;
  has_hinge_or_shift: boolean;
  has_lived_event_anchor: boolean;
  has_personal_center: boolean;
  has_tension_or_responsibility: boolean;
  coherent_enough_for_progression: boolean;
  summary_text: string;
}

export interface BlankPagePostAnswerDecision {
  post_answer_route: BlankPagePostAnswerRoute;
  post_answer_route_reason: string;
  blank_page_recovery_depth: number;
  blank_page_recovery_exhausted: boolean;
  recovered_signal_summary: RecoveredSignalSummary;
  forwardable_topic_candidate?: string | null;
  forwardable_event_candidate?: string | null;
  requires_second_recovery_focus?: boolean;
}

/**
 * Structured blank-page intake payload.
 * Shown when product_mode === 'blank_page_intake'.
 */
export interface BlankPageIntakePayload {
  product_mode: 'blank_page_intake';
  blank_page_mode: BlankPageMode;
  recovery_question_primary: string;
  recovery_question_secondary: string | null;
  recovery_confidence: 'low' | 'medium' | 'high';
  missing_signal_type: MissingSignalType;
  why_not_ready_for_direction: string;
  next_step_type: NextStepType;
  reassurance_copy: string | null;
  example_answer_shape: string | null;
  what_good_signal_would_look_like: string | null;
  topic_candidate: string | null;
  question_family_primary: BlankPageQuestionFamily | null;
  question_family_secondary: BlankPageQuestionFamily | null;
  selected_template_id: string;
}

export type BlankPageRenderState =
  | 'blank_page_question_ready'
  | 'blank_page_question_with_secondary'
  | 'blank_page_answer_drafting'
  | 'blank_page_answer_submitting'
  | 'blank_page_answer_submit_error'
  | 'blank_page_too_thin_fallback';

export type BlankPageSubmissionState =
  | 'idle'
  | 'drafting'
  | 'submitting'
  | 'submit_error';

export interface BlankPageViewModel {
  productMode: 'blank_page_intake';
  blankPageMode: BlankPageMode;
  missingSignalType: MissingSignalType;
  whyNotReadyForDirection: string;
  primaryQuestion: string;
  secondaryQuestion: string | null;
  supportFields: {
    reassuranceCopy: string | null;
    exampleAnswerShape: string | null;
    whatGoodSignalWouldLookLike: string | null;
  };
  supportFieldPresenceMap: {
    reassuranceCopy: boolean;
    exampleAnswerShape: boolean;
    whatGoodSignalWouldLookLike: boolean;
  };
  nextStepType: NextStepType;
  isTooThinFallback: boolean;
  recoveryConfidence: 'low' | 'medium' | 'high';
  selectedTemplateId: string;
  answerBoxMode: 'bounded_recovery' | 'restart_concrete_starting_point';
  ctaLabel: string;
  renderState: BlankPageRenderState;
  submissionState: BlankPageSubmissionState;
}

/**
 * Light-direction payload.
 * Shown when product_mode === 'direction_light'.
 * Tentative angle — no overconfident premium sections.
 */
export interface LightDirectionPayload {
  provisionalAngle: string;
  plainEnglishTheme: string;
  whyItMayWork: string;
  shortExample: string;
  bestNextQuestion: string | null;
  bestNextMove: string;
  candidateDirections?: string[];
  candidateSetQualityBand?: 'strong' | 'mixed' | 'weak';
  generationDebug?: {
    family_duty_candidate_generated: boolean;
    indirect_hinge_candidates_detected: string[];
    hinge_support_activated: boolean;
    weak_note_recovery_candidate_generated: boolean;
    contradiction_dual_center_candidates_generated: boolean;
    candidate_set_quality_band: 'strong' | 'mixed' | 'weak';
    false_premium_candidate_flag: boolean;
    premium_tone_without_support: boolean;
    false_premium_suppression_activated: boolean;
  };
}

/**
 * Canonical session API response shape.
 * Replaces the previous raw IntakeIntelligenceObject return.
 * Frontend must read product_mode first, then render the
 * corresponding optional payload.
 */
export interface SessionApiResponse {
  intake_intelligence: IntakeIntelligenceObject;
  product_mode: ProductMode;
  evidence_strength: EvidenceStrengthPrediction;
  blank_page_intake_detected: boolean;
  blank_page_mode: BlankPageMode | null;
  blank_page_trigger_signals: BlankPageTriggerSignal[];
  blank_page_recovery_reason: string | null;
  blank_page_confidence: 'low' | 'medium' | 'high' | null;
  top_level_blank_page_route: TopLevelBlankPageRoute;
  sharpening_question?: string;
  clarification_payload?: ClarificationPayload;
  blank_page_intake_payload?: BlankPageIntakePayload;
  light_direction_payload?: LightDirectionPayload;
  canonical_page3_payload?: CanonicalPage3Payload;
}

// =============================================================
// INTAKE SESSION INPUT  (orchestration entry point)
// =============================================================

export interface IntakeSessionInput {
  session_id: string;
  student_user_id: string;
  subject_entity_id: string;
  story_entries: Array<{
    id: string;
    title: string;
    text: string;
    created_at?: string;
    project_id?: string;
    rejected?: boolean;
  }>;
  draft_text: string | null;
  draft_id: string | null;
  school_context: {
    source_id: string;
    target_school: string;
    notes: string;
  } | null;
  student_profile: {
    grade_level: string | null;
    intended_majors: string[];
    core_interests: string[];
  } | null;
  prior_attempt_count: number;
  questions_asked: QuestionType[];
  rejected_source_ids: string[];
  session_created_at: string;
}

// =============================================================
// INTAKE FEATURE LOG RECORD  (INTAKE-11 contract)
// =============================================================

/**
 * Structured log record emitted by the orchestrator.
 * One record per intake session invocation.
 * Exported for offline model retraining.
 */
export interface IntakeFeatureLogRecord {
  log_id: string;
  session_id: string;
  student_user_id: string;
  subject_entity_id: string;
  raw_story_entry_count: number;
  raw_draft_present: boolean;
  raw_school_context_present: boolean;
  usable_signal_decision: UsableSignalDecision;
  authorship_signal_decision: AuthorshipSignalDecision;
  narrative_pattern_decision: NarrativePatternDecision;
  trusted_evidence_rank: TrustedEvidenceRank;
  next_question_decision: NextQuestionDecision | null;
  viability_decision: RecommendationViabilityDecision;
  school_context_decision: SchoolContextUseDecisionResult | null;
  escalation_decision: IntakeEscalationDecision;
  /** Final direction artifact ID written by downstream module, if any. */
  final_direction_artifact_id: string | null;
  /** Human reviewer override, if applied after the fact. */
  reviewer_override: {
    overridden_at: string;
    reviewer_id: string;
    corrected_viability: ViabilityDecision | null;
    corrected_contamination: ContaminationRisk | null;
    notes: string;
  } | null;
  /** Did the student continue the session after intake? */
  student_continued: boolean | null;
  /** Did the student abandon? */
  student_abandoned: boolean | null;
  logged_at: string;
}
