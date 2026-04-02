// realInputCorpusApi.ts
// API-layer request/response payloads for real-input corpus substrate

import type {
  RicAdjudicatedTruthStatus,
  RicAdjudicationReason,
  RicCaseRecord,
  RicCaseReviewSubmission,
  RicCaseRunRecord,
  RicCaseType,
  RicEvalPackRecord,
  RicFailureMode,
  RicPackType,
  RicProductSurface,
  RicQueueDecision,
  RicReviewDecision,
  RicReviewPriority,
  RicScoreDimension,
  RicScoreValue,
  RicSourceChannel,
} from "../realInputCorpus";

export interface ApiErrorResponse {
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
}

export interface CreateCaseRequest {
  caseType: RicCaseType;
  productSurface: RicProductSurface;
  sourceChannel: RicSourceChannel;
  rawInputText: string;
  context: {
    studentGradeLevel?: string;
    priorAttemptsPresent?: boolean;
    statedGoalSignal?: string;
    ambiguityLevel?: number;
    complexityScore?: number;
    sensitivityFlags?: string[];
    contextPayload?: Record<string, unknown>;
  };
  tags?: string[];
  labelSchemaVersion: string;
}

export interface CreateCaseResponse {
  caseId: string;
  caseKey: string;
  lifecycleStatus: "captured";
}

export interface NormalizeCaseRequest {
  normalizedInputText: string;
  extractedIntent?: string;
  extractedEssayStage?: string;
  extractedPromptType?: string;
  extractedAmbiguityLevel?: number;
  extractedEmotionalSignal?: string;
  extractedConstraints?: string[];
  normalizationErrors?: string[];
  normalizationStatus: "success" | "partial" | "failed";
}

export interface NormalizeCaseResponse {
  caseId: string;
  normalizationStatus: "success" | "partial" | "failed";
  lifecycleStatus: "normalized" | "normalization_failed";
  extractedEssayStage: string | null;
  extractedPromptType: string | null;
  extractedAmbiguityLevel: number | null;
}

export interface AttachRunRequest {
  runKey: string;
  modelProvider: string;
  modelName: string;
  reasoningMode?: string;
  routingPolicyVersion: string;
  promptTemplateVersion: string;
  assemblyContextVersion?: string;
  fallbackUsed: boolean;
  confidenceScore?: number;
  riskScore?: number;
  latencyMs?: number;
  tokenInput?: number;
  tokenOutput?: number;
  runStatus: "success" | "partial_success" | "fallback_success" | "failed";
  releaseVersion: string;
  inputFeatures: Record<string, unknown>;
  retrievedPatterns: unknown[];
  assemblyPayload?: Record<string, unknown>;
  outputs: Array<{
    outputRole: "final" | "candidate" | "fallback" | "redraft";
    outputText: string;
    outputRank?: number;
    selectedForDelivery: boolean;
    deliveredToUser: boolean;
    outputMetadata?: Record<string, unknown>;
  }>;
}

export interface AttachRunResponse {
  caseId: string;
  runId: string;
  lifecycleStatus: "run_attached";
  run: RicCaseRunRecord;
}

export type SubmitCaseReviewRequest = RicCaseReviewSubmission;

export interface SubmitCaseReviewResponse {
  reviewId: string;
  caseId: string;
  lifecycleStatus: "review_complete" | "adjudication_required";
  adjudicationRequired: boolean;
}

export interface AdjudicateCaseRequest {
  adjudicatorId: string;
  adjudicationReason: RicAdjudicationReason;
  finalDecision: RicReviewDecision;
  truthStatus: RicAdjudicatedTruthStatus;
  goldCandidateConfirmed: boolean;
  teachingNotes?: string;
  labelVersionLocked: string;
}

export interface AdjudicateCaseResponse {
  adjudicationId: string;
  caseId: string;
  lifecycleStatus: "adjudicated";
  truthStatus: RicAdjudicatedTruthStatus;
}

export interface PromoteCaseRequest {
  target: "gold" | "eval_pack_eligible";
  goldSetId?: string;
  goldReason?: string;
  benchmarkNotes?: string;
}

export interface PromoteCaseResponse {
  caseId: string;
  lifecycleStatus: "gold" | "eval_pack_eligible";
  promotedTarget: "gold" | "eval_pack_eligible";
}

export interface ReviewQueueItem {
  caseId: string;
  caseKey: string;
  productSurface: RicProductSurface;
  caseType: RicCaseType;
  reviewPriority: RicReviewPriority;
  lifecycleStatus: string;
  createdAt: string;
  queueDecision: RicQueueDecision | null;
  queueReasonSummary: string[];
  confidenceScore: number | null;
  riskScore: number | null;
  assignedReviewerId?: string | null;
}

export interface GetReviewQueueResponse {
  items: ReviewQueueItem[];
  nextCursor: string | null;
}

export interface GetCaseDetailResponse {
  case: RicCaseRecord;
  input: {
    rawInputText: string;
    normalizedInputText: string | null;
    extractedIntent: string | null;
    extractedEssayStage: string | null;
    extractedPromptType: string | null;
    extractedAmbiguityLevel: number | null;
    extractedEmotionalSignal: string | null;
    extractedConstraints: string[];
  };
  context: {
    studentGradeLevel: string | null;
    statedGoalSignal: string | null;
    priorAttemptsPresent: boolean;
    ambiguityLevel: number | null;
    complexityScore: number | null;
    sensitivityFlags: string[];
    contextPayload: Record<string, unknown>;
  } | null;
  latestRun: {
    runId: string;
    runKey: string;
    modelProvider: string;
    modelName: string;
    routingPolicyVersion: string;
    promptTemplateVersion: string;
    assemblyContextVersion: string | null;
    fallbackUsed: boolean;
    confidenceScore: number | null;
    riskScore: number | null;
    runStatus: string;
    releaseVersion: string;
    inputFeatures: Record<string, unknown>;
    retrievedPatterns: unknown[];
    assemblyPayload: Record<string, unknown>;
    outputs: Array<{
      outputId: string;
      outputRole: string;
      outputText: string;
      outputRank: number | null;
      selectedForDelivery: boolean;
      deliveredToUser: boolean;
      outputMetadata: Record<string, unknown>;
    }>;
  } | null;
  reviews: Array<{
    reviewId: string;
    reviewerId: string;
    reviewRound: number;
    reviewStatus: string;
    decision: RicReviewDecision;
    rationaleText: string | null;
    generalizableLearningFlag: boolean;
    promoteToGoldFlag: boolean;
    requiresAdjudicationFlag: boolean;
    submittedAt: string;
    scores: Array<{
      dimension: RicScoreDimension;
      value: RicScoreValue;
    }>;
    failureModes: Array<{
      failureMode: RicFailureMode;
      severity: "low" | "medium" | "high" | "critical";
    }>;
    reasonCodes: string[];
  }>;
  adjudication: {
    adjudicationId: string;
    adjudicatorId: string;
    adjudicationReason: string;
    finalDecision: RicReviewDecision;
    truthStatus: string;
    goldCandidateConfirmed: boolean;
    teachingNotes: string | null;
    labelVersionLocked: string;
    completedAt: string;
  } | null;
}

export interface CreateEvalPackRequest {
  evalPackKey: string;
  version: string;
  packType: RicPackType;
  labelVersion: string;
  selectionLogicText: string;
  createdBy: string;
  notes?: string;
  caseIds: string[];
}

export interface CreateEvalPackResponse {
  evalPackId: string;
  evalPackKey: string;
  version: string;
  packType: RicPackType;
}

export interface EvalPackCaseExport {
  caseKey: string;
  productSurface: RicProductSurface;
  rawInputText: string;
  normalizedInputText: string | null;
  context: Record<string, unknown>;
  expectedTruthStatus: string;
  expectedFailureModes: string[];
  expectedScoreProfile: Partial<Record<RicScoreDimension, RicScoreValue>>;
}

export interface GetEvalPackResponse {
  evalPack: RicEvalPackRecord;
  caseCount: number;
  cases: Array<{
    caseId: string;
    caseKey: string;
    productSurface: RicProductSurface;
    expectedTruthStatus: string;
  }>;
}

export interface ExportEvalPackResponse {
  evalPackKey: string;
  version: string;
  packType: RicPackType;
  labelVersion: string;
  createdAt: string;
  cases: EvalPackCaseExport[];
}

export interface QueueDecisionResult {
  queueDecision: RicQueueDecision;
  queueReasonCodes: string[];
  queueScore: number | null;
}

export interface FailureReportRow {
  releaseVersion: string;
  reviewedCaseCount: number;
  genericAdviceRate: number;
  misreadEmotionalSignalRate: number;
  weakActionabilityRate: number;
  poorStudentFitRate: number;
  goldCasePromotionRate: number;
}

export interface CoverageReportRow {
  productSurface: RicProductSurface;
  essayStage: string | null;
  promptType: string | null;
  complexityScore: number | null;
  sourceChannel: RicSourceChannel;
  caseCount: number;
}

export interface ReviewerCalibrationRow {
  reviewerId: string;
  totalSubmittedReviews: number;
  disagreementRate: number;
  goldPromotionFlagRate: number;
  avgRationaleLength: number;
}
