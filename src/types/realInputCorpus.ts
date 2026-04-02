// realInputCorpus.ts
// Domain-layer types for real-input corpus + learned-judgment substrate

export const RIC_CASE_TYPES = [
  "nds_real_input",
  "essay_feedback_real_input",
  "imported_guidance_request",
  "red_team_case",
  "curated_gold_seed",
] as const;

export const RIC_PRODUCT_SURFACES = [
  "narrative_direction_selection",
  "essay_feedback",
] as const;

export const RIC_SOURCE_CHANNELS = [
  "live_product",
  "manual_import",
  "support_log",
  "evaluation_seed",
  "reviewer_authored",
] as const;

export const RIC_LIFECYCLE_STATUSES = [
  "new",
  "capture_failed",
  "captured",
  "normalization_failed",
  "normalized",
  "run_attached",
  "review_exempt",
  "review_queued",
  "in_review",
  "review_complete",
  "adjudication_required",
  "adjudicated",
  "gold_candidate",
  "gold",
  "eval_pack_eligible",
  "archived",
  "rejected",
] as const;

export const RIC_REVIEW_PRIORITIES = [
  "none",
  "low",
  "normal",
  "high",
  "urgent",
  "gold_candidate",
] as const;

export const RIC_TRUTH_STATUSES = [
  "unreviewed",
  "weak_signal",
  "review_backed",
  "adjudicated",
  "gold",
] as const;

export const RIC_NORMALIZATION_STATUSES = [
  "pending",
  "success",
  "partial",
  "failed",
] as const;

export const RIC_EXTRACTED_INTENTS = [
  "seeking_topic_direction",
  "seeking_narrative_selection",
  "seeking_structural_help",
  "seeking_feedback",
  "mixed",
  "unclear",
] as const;

export const RIC_EXTRACTED_ESSAY_STAGES = [
  "blank_page",
  "rough_idea",
  "partial_draft",
  "full_draft",
  "unknown",
] as const;

export const RIC_EXTRACTED_PROMPT_TYPES = [
  "personal_statement",
  "supplemental",
  "identity",
  "community",
  "why_school",
  "challenge",
  "activity",
  "other",
  "unknown",
] as const;

export const RIC_EXTRACTED_EMOTIONAL_SIGNALS = [
  "neutral",
  "anxious",
  "overwhelmed",
  "hopeful",
  "confident",
  "self_doubting",
  "mixed",
  "unclear",
] as const;

export const RIC_RUN_STATUSES = [
  "success",
  "partial_success",
  "fallback_success",
  "failed",
] as const;

export const RIC_OUTPUT_ROLES = [
  "final",
  "candidate",
  "fallback",
  "redraft",
] as const;

export const RIC_QUEUE_DECISIONS = [
  "review_exempt",
  "spot_check",
  "full_review",
  "adjudication_priority",
  "gold_candidate_review",
] as const;

export const RIC_REVIEW_STATUSES = [
  "draft",
  "submitted",
  "superseded",
] as const;

export const RIC_REVIEW_DECISIONS = [
  "approve",
  "approve_with_minor_edits",
  "usable_but_weak",
  "not_usable",
  "unsafe_or_off_policy",
] as const;

export const RIC_FAILURE_MODES = [
  "generic_advice",
  "fake_depth",
  "overconfident_inference",
  "weak_narrative_differentiation",
  "poor_student_fit_read",
  "shallow_evidence_use",
  "too_broad_unfocused",
  "too_polished_ai_sounding",
  "misread_emotional_signal",
  "weak_actionability",
  "confusing_structure",
  "unsupported_recommendation",
  "policy_safety_risk",
  "wrong_essay_type_assumption",
  "style_drift_from_product_standard",
] as const;

export const RIC_SEVERITIES = [
  "low",
  "medium",
  "high",
  "critical",
] as const;

export const RIC_ADJUDICATION_REASONS = [
  "reviewer_disagreement",
  "gold_candidate_confirmation",
  "high_risk_case",
  "taxonomy_gap",
  "ops_escalation",
] as const;

export const RIC_ADJUDICATED_TRUTH_STATUSES = [
  "adjudicated_usable",
  "adjudicated_not_usable",
  "adjudicated_gold_ready",
  "adjudicated_needs_rework",
] as const;

export const RIC_PACK_TYPES = [
  "broad_regression",
  "failure_focused",
  "sparse_edge",
  "gold_benchmark",
] as const;

export type RicCaseType = typeof RIC_CASE_TYPES[number];
export type RicProductSurface = typeof RIC_PRODUCT_SURFACES[number];
export type RicSourceChannel = typeof RIC_SOURCE_CHANNELS[number];
export type RicLifecycleStatus = typeof RIC_LIFECYCLE_STATUSES[number];
export type RicReviewPriority = typeof RIC_REVIEW_PRIORITIES[number];
export type RicTruthStatus = typeof RIC_TRUTH_STATUSES[number];
export type RicNormalizationStatus = typeof RIC_NORMALIZATION_STATUSES[number];
export type RicExtractedIntent = typeof RIC_EXTRACTED_INTENTS[number];
export type RicExtractedEssayStage = typeof RIC_EXTRACTED_ESSAY_STAGES[number];
export type RicExtractedPromptType = typeof RIC_EXTRACTED_PROMPT_TYPES[number];
export type RicExtractedEmotionalSignal = typeof RIC_EXTRACTED_EMOTIONAL_SIGNALS[number];
export type RicRunStatus = typeof RIC_RUN_STATUSES[number];
export type RicOutputRole = typeof RIC_OUTPUT_ROLES[number];
export type RicQueueDecision = typeof RIC_QUEUE_DECISIONS[number];
export type RicReviewStatus = typeof RIC_REVIEW_STATUSES[number];
export type RicReviewDecision = typeof RIC_REVIEW_DECISIONS[number];
export type RicFailureMode = typeof RIC_FAILURE_MODES[number];
export type RicSeverity = typeof RIC_SEVERITIES[number];
export type RicAdjudicationReason = typeof RIC_ADJUDICATION_REASONS[number];
export type RicAdjudicatedTruthStatus = typeof RIC_ADJUDICATED_TRUTH_STATUSES[number];
export type RicPackType = typeof RIC_PACK_TYPES[number];

export type RicNdsScoreDimension =
  | "authenticity_preservation"
  | "narrative_specificity"
  | "directional_usefulness"
  | "non_genericness"
  | "strategic_differentiation"
  | "student_fit"
  | "clarity_of_recommendation"
  | "evidence_grounded_interpretation"
  | "actionability"
  | "safety_policy_compliance";

export type RicEssayFeedbackScoreDimension =
  | "voice_preservation"
  | "specificity_of_critique"
  | "usefulness_of_revision_direction"
  | "non_genericness"
  | "line_of_attack_quality"
  | "clarity"
  | "emotional_intelligence"
  | "actionability"
  | "safety_policy_compliance";

export type RicScoreDimension =
  | RicNdsScoreDimension
  | RicEssayFeedbackScoreDimension;

export type RicScoreValue = 1 | 2 | 3 | 4 | 5;

export interface RicCaseRecord {
  id: string;
  caseKey: string;
  caseType: RicCaseType;
  productSurface: RicProductSurface;
  sourceChannel: RicSourceChannel;
  lifecycleStatus: RicLifecycleStatus;
  reviewPriority: RicReviewPriority;
  currentTruthStatus: RicTruthStatus | null;
  labelSchemaVersion: string;
  routingPolicyVersion: string | null;
  promptTemplateVersion: string | null;
  releaseVersion: string | null;
  tags: string[];
  notesInternal: string | null;
  createdAt: string;
  updatedAt: string;
  archivedAt: string | null;
}

export interface RicCaseInputRecord {
  id: string;
  caseId: string;
  rawInputText: string;
  normalizedInputText: string | null;
  inputLanguage: string;
  rawWordCount: number;
  normalizedWordCount: number | null;
  normalizationStatus: RicNormalizationStatus;
  normalizationErrors: string[];
  extractedIntent: RicExtractedIntent | null;
  extractedEssayStage: RicExtractedEssayStage | null;
  extractedPromptType: RicExtractedPromptType | null;
  extractedAmbiguityLevel: number | null;
  extractedEmotionalSignal: RicExtractedEmotionalSignal | null;
  extractedConstraints: string[];
  createdAt: string;
  updatedAt: string;
}

export interface RicCaseContextRecord {
  id: string;
  caseId: string;
  studentGradeLevel: string | null;
  statedGoalSignal: string | null;
  priorAttemptsPresent: boolean;
  ambiguityLevel: number | null;
  complexityScore: number | null;
  sensitivityFlags: string[];
  contextPayload: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface RicCaseRunRecord {
  id: string;
  caseId: string;
  runKey: string;
  modelProvider: string;
  modelName: string;
  reasoningMode: string | null;
  routingPolicyVersion: string;
  promptTemplateVersion: string;
  assemblyContextVersion: string | null;
  fallbackUsed: boolean;
  confidenceScore: number | null;
  riskScore: number | null;
  latencyMs: number | null;
  tokenInput: number | null;
  tokenOutput: number | null;
  runStatus: RicRunStatus;
  releaseVersion: string;
  createdAt: string;
}

export interface RicCaseRunInputRecord {
  id: string;
  runId: string;
  inputFeatures: Record<string, unknown>;
  retrievedPatterns: unknown[];
  assemblyPayload: Record<string, unknown>;
  createdAt: string;
}

export interface RicCaseOutputRecord {
  id: string;
  runId: string;
  outputRole: RicOutputRole;
  outputText: string;
  outputRank: number | null;
  selectedForDelivery: boolean;
  deliveredToUser: boolean;
  outputMetadata: Record<string, unknown>;
  createdAt: string;
}

export interface RicCaseQueueDecisionRecord {
  id: string;
  caseId: string;
  queueDecision: RicQueueDecision;
  queueReasonCodes: string[];
  queueScore: number | null;
  decidedBy: string;
  createdAt: string;
}

export interface RicReviewScore {
  dimension: RicScoreDimension;
  value: RicScoreValue;
}

export interface RicFailureModeSelection {
  failureMode: RicFailureMode;
  severity: RicSeverity;
}

export interface RicCaseReviewRecord {
  id: string;
  caseId: string;
  runId: string;
  reviewerId: string;
  reviewRound: number;
  reviewStatus: RicReviewStatus;
  decision: RicReviewDecision;
  rationaleText: string | null;
  generalizableLearningFlag: boolean;
  promoteToGoldFlag: boolean;
  requiresAdjudicationFlag: boolean;
  submittedAt: string;
  updatedAt: string;
}

export interface RicCaseReviewSubmission {
  caseId: string;
  runId: string;
  reviewerId: string;
  reviewRound: number;
  decision: RicReviewDecision;
  rationaleText?: string;
  generalizableLearningFlag: boolean;
  promoteToGoldFlag: boolean;
  requiresAdjudicationFlag: boolean;
  scores: RicReviewScore[];
  failureModes: RicFailureModeSelection[];
  reasonCodes: string[];
}

export interface RicCaseAdjudicationRecord {
  id: string;
  caseId: string;
  adjudicatorId: string;
  adjudicationReason: RicAdjudicationReason;
  finalDecision: RicReviewDecision;
  truthStatus: RicAdjudicatedTruthStatus;
  goldCandidateConfirmed: boolean;
  teachingNotes: string | null;
  labelVersionLocked: string;
  completedAt: string;
}

export interface RicGoldCaseRecord {
  id: string;
  caseId: string;
  goldSetId: string;
  canonicalLabelVersion: string;
  goldReason: string;
  benchmarkNotes: string | null;
  createdAt: string;
}

export interface RicEvalPackRecord {
  id: string;
  evalPackKey: string;
  version: string;
  packType: RicPackType;
  selectionLogicText: string;
  labelVersion: string;
  createdBy: string;
  notes: string | null;
  createdAt: string;
}

export interface RicEvalPackCaseRecord {
  id: string;
  evalPackId: string;
  caseId: string;
  expectedTruthStatus: string;
  expectedFailureModes: string[];
  expectedScoreProfile: Partial<Record<RicScoreDimension, RicScoreValue>>;
  createdAt: string;
}

export interface RicAuditLogRecord {
  id: string;
  caseId: string | null;
  actorId: string;
  actionType: string;
  targetTable: string;
  targetId: string | null;
  payload: Record<string, unknown>;
  createdAt: string;
}

export const RIC_NDS_REQUIRED_SCORE_DIMENSIONS: readonly RicNdsScoreDimension[] = [
  "authenticity_preservation",
  "narrative_specificity",
  "directional_usefulness",
  "non_genericness",
  "strategic_differentiation",
  "student_fit",
  "clarity_of_recommendation",
  "evidence_grounded_interpretation",
  "actionability",
  "safety_policy_compliance",
] as const;

export const RIC_ESSAY_FEEDBACK_REQUIRED_SCORE_DIMENSIONS: readonly RicEssayFeedbackScoreDimension[] = [
  "voice_preservation",
  "specificity_of_critique",
  "usefulness_of_revision_direction",
  "non_genericness",
  "line_of_attack_quality",
  "clarity",
  "emotional_intelligence",
  "actionability",
  "safety_policy_compliance",
] as const;

export const RIC_REVIEW_DECISION_BANDS: Readonly<Record<RicReviewDecision, number>> = {
  approve: 5,
  approve_with_minor_edits: 4,
  usable_but_weak: 3,
  not_usable: 2,
  unsafe_or_off_policy: 1,
};

export const RIC_REVIEW_QUEUE_CONFIG = {
  fullReviewConfidenceThreshold: 0.72,
  fullReviewRiskThreshold: 0.35,
  spotCheckSampleRate: 0.15,
  retryEscalationThreshold: 2,
  disagreementDecisionBandThreshold: 2,
  disagreementDimensionDeltaThreshold: 1.5,
  sparseSegmentLookbackDays: 30,
  goldPromotionRequiresAdjudication: true,
} as const;

export function getRequiredScoreDimensions(
  productSurface: RicProductSurface,
): readonly RicScoreDimension[] {
  return productSurface === "narrative_direction_selection"
    ? RIC_NDS_REQUIRED_SCORE_DIMENSIONS
    : RIC_ESSAY_FEEDBACK_REQUIRED_SCORE_DIMENSIONS;
}

export function isValidRicScoreValue(value: number): value is RicScoreValue {
  return Number.isInteger(value) && value >= 1 && value <= 5;
}

export function getDecisionBand(decision: RicReviewDecision): number {
  return RIC_REVIEW_DECISION_BANDS[decision];
}

export function canTransitionLifecycle(
  from: RicLifecycleStatus,
  to: RicLifecycleStatus,
): boolean {
  const allowedTransitions: Readonly<Record<RicLifecycleStatus, readonly RicLifecycleStatus[]>> = {
    new: ["captured", "capture_failed"],
    capture_failed: [],
    captured: ["normalized", "normalization_failed"],
    normalization_failed: [],
    normalized: ["run_attached"],
    run_attached: ["review_exempt", "review_queued"],
    review_exempt: [],
    review_queued: ["in_review"],
    in_review: ["review_complete"],
    review_complete: ["adjudication_required", "eval_pack_eligible", "rejected"],
    adjudication_required: ["adjudicated"],
    adjudicated: ["gold_candidate", "eval_pack_eligible", "rejected"],
    gold_candidate: ["gold", "eval_pack_eligible"],
    gold: ["archived"],
    eval_pack_eligible: ["archived"],
    archived: [],
    rejected: [],
  };

  return allowedTransitions[from].includes(to);
}
