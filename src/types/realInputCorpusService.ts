// realInputCorpusService.ts
// Service-layer contracts + fail-closed orchestration for real-input corpus substrate

import type {
  AdjudicateCaseRequest,
  AdjudicateCaseResponse,
  AttachRunRequest,
  AttachRunResponse,
  CreateCaseRequest,
  CreateCaseResponse,
  CreateEvalPackRequest,
  CreateEvalPackResponse,
  ExportEvalPackResponse,
  GetCaseDetailResponse,
  GetEvalPackResponse,
  GetReviewQueueResponse,
  PromoteCaseRequest,
  PromoteCaseResponse,
  QueueDecisionResult,
  SubmitCaseReviewRequest,
  SubmitCaseReviewResponse,
} from "./api/realInputCorpusApi";
import {
  canTransitionLifecycle,
  getDecisionBand,
  RIC_REVIEW_QUEUE_CONFIG,
  type RicCaseRecord,
  type RicLifecycleStatus,
  type RicProductSurface,
} from "./realInputCorpus";
import {
  normalizeEvalPackExport,
  serializeEvalPackExport,
} from "./realInputCorpusExport";
import {
  validateAdjudicateCaseRequest,
  validateAttachRunRequest,
  validateCreateCaseRequest,
  validateCreateEvalPackRequest,
  validateNormalizeCaseRequest,
  validatePromoteCaseRequest,
  validateReviewSubmissionForSurface,
  type ValidationIssue,
} from "./realInputCorpusSchemas";

export class RicValidationError extends Error {
  constructor(public readonly issues: ValidationIssue[]) {
    super("Validation failed");
    this.name = "RicValidationError";
  }
}

export class RicLifecycleError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "RicLifecycleError";
  }
}

export type QueueInputs = {
  runStatus: "success" | "partial_success" | "fallback_success" | "failed";
  confidenceScore: number | null;
  riskScore: number | null;
  fallbackUsed: boolean;
  usesNewRoutingVersion: boolean;
  usesNewPromptVersion: boolean;
  retryCount: number;
  sparseSegment: boolean;
  highComplexity: boolean;
  sensitiveAmbiguity: boolean;
  genericnessRiskFlag: boolean;
  representedInRecentReviewedCorpus: boolean;
};

export type DisagreementInputs = {
  decisionBandValues: number[];
  scoreDeltas: number[];
  anyPolicyRiskFlagged: boolean;
  policyRiskDisagreement: boolean;
  anyGoldPromotionFlagged: boolean;
  manuallyEscalated: boolean;
};

export interface RicRepository {
  createCase(input: CreateCaseRequest): Promise<CreateCaseResponse>;
  getCaseById(caseId: string): Promise<RicCaseRecord | null>;
  normalizeCase(caseId: string, input: unknown): Promise<void>;
  attachRun(caseId: string, input: AttachRunRequest): Promise<AttachRunResponse>;
  submitReview(caseId: string, input: SubmitCaseReviewRequest): Promise<SubmitCaseReviewResponse>;
  adjudicateCase(caseId: string, input: AdjudicateCaseRequest): Promise<AdjudicateCaseResponse>;
  promoteCase(caseId: string, input: PromoteCaseRequest): Promise<PromoteCaseResponse>;
  createEvalPack(input: CreateEvalPackRequest): Promise<CreateEvalPackResponse>;
  getEvalPack(evalPackId: string): Promise<GetEvalPackResponse>;
  exportEvalPack(evalPackId: string): Promise<ExportEvalPackResponse>;
  getReviewQueue(query?: Record<string, string | number | undefined>): Promise<GetReviewQueueResponse>;
  getCaseDetail(caseId: string): Promise<GetCaseDetailResponse>;
}

export interface RicAuditSink {
  write(entry: {
    actorId: string;
    actionType: string;
    targetTable: string;
    targetId?: string;
    caseId?: string;
    payload?: Record<string, unknown>;
  }): Promise<void>;
}

export class RealInputCorpusService {
  constructor(
    private readonly repo: RicRepository,
    private readonly audit: RicAuditSink,
  ) {}

  async createCase(actorId: string, input: unknown): Promise<CreateCaseResponse> {
    const result = validateCreateCaseRequest(input);
    if (!result.ok) {
      throw new RicValidationError(result.issues);
    }

    const created = await this.repo.createCase(result.value);

    await this.audit.write({
      actorId,
      actionType: "create_case",
      targetTable: "cases",
      targetId: created.caseId,
      caseId: created.caseId,
      payload: { lifecycleStatus: created.lifecycleStatus },
    });

    return created;
  }

  async normalizeCase(actorId: string, caseId: string, input: unknown): Promise<void> {
    const validated = validateNormalizeCaseRequest(input);
    if (!validated.ok) {
      throw new RicValidationError(validated.issues);
    }

    const current = await this.getExistingCase(caseId);
    this.assertTransition(current.lifecycleStatus, "normalized");

    await this.repo.normalizeCase(caseId, validated.value);

    await this.audit.write({
      actorId,
      actionType: "normalize_case",
      targetTable: "case_inputs",
      caseId,
      payload: { status: "normalized_or_failed" },
    });
  }

  async attachRun(actorId: string, caseId: string, input: unknown): Promise<AttachRunResponse> {
    const validated = validateAttachRunRequest(input);
    if (!validated.ok) {
      throw new RicValidationError(validated.issues);
    }

    const current = await this.getExistingCase(caseId);
    this.assertTransition(current.lifecycleStatus, "run_attached");

    const run = await this.repo.attachRun(caseId, validated.value);

    await this.audit.write({
      actorId,
      actionType: "attach_run",
      targetTable: "case_runs",
      caseId,
      targetId: run.runId,
      payload: {
        runStatus: validated.value.runStatus,
        fallbackUsed: validated.value.fallbackUsed,
        releaseVersion: validated.value.releaseVersion,
      },
    });

    return run;
  }

  decideReviewQueue(inputs: QueueInputs): QueueDecisionResult {
    const cfg = RIC_REVIEW_QUEUE_CONFIG;

    const reasons: string[] = [];
    let queueDecision: QueueDecisionResult["queueDecision"] = "spot_check";

    const fullReviewTrigger =
      inputs.runStatus !== "success" ||
      (inputs.confidenceScore != null && inputs.confidenceScore < cfg.fullReviewConfidenceThreshold) ||
      (inputs.riskScore != null && inputs.riskScore > cfg.fullReviewRiskThreshold) ||
      inputs.fallbackUsed ||
      inputs.usesNewRoutingVersion ||
      inputs.usesNewPromptVersion ||
      inputs.retryCount > cfg.retryEscalationThreshold ||
      inputs.sparseSegment ||
      inputs.highComplexity ||
      inputs.sensitiveAmbiguity ||
      inputs.genericnessRiskFlag;

    if (fullReviewTrigger) {
      queueDecision = "full_review";
      if (inputs.runStatus !== "success") reasons.push("run_not_success");
      if ((inputs.confidenceScore ?? 1) < cfg.fullReviewConfidenceThreshold)
        reasons.push("confidence_below_threshold");
      if ((inputs.riskScore ?? 0) > cfg.fullReviewRiskThreshold)
        reasons.push("risk_above_threshold");
      if (inputs.fallbackUsed) reasons.push("fallback_used");
      if (inputs.usesNewRoutingVersion) reasons.push("new_routing_version");
      if (inputs.usesNewPromptVersion) reasons.push("new_prompt_version");
      if (inputs.retryCount > cfg.retryEscalationThreshold) reasons.push("retry_escalation");
      if (inputs.sparseSegment) reasons.push("sparse_segment");
      if (inputs.highComplexity) reasons.push("high_complexity");
      if (inputs.sensitiveAmbiguity) reasons.push("sensitive_ambiguity");
      if (inputs.genericnessRiskFlag) reasons.push("genericness_risk_flag");
    } else if (
      inputs.runStatus === "success" &&
      (inputs.confidenceScore ?? 0) >= cfg.fullReviewConfidenceThreshold &&
      (inputs.riskScore ?? 1) <= cfg.fullReviewRiskThreshold &&
      inputs.representedInRecentReviewedCorpus &&
      !inputs.usesNewRoutingVersion &&
      !inputs.usesNewPromptVersion
    ) {
      queueDecision = "review_exempt";
      reasons.push("meets_review_exempt_criteria");
    }

    const queueScore =
      queueDecision === "full_review"
        ? Math.min(1, (inputs.riskScore ?? 0) + (inputs.genericnessRiskFlag ? 0.25 : 0))
        : null;

    return {
      queueDecision,
      queueReasonCodes: reasons,
      queueScore,
    };
  }

  async submitCaseReview(
    actorId: string,
    caseId: string,
    productSurface: RicProductSurface,
    input: unknown,
  ): Promise<SubmitCaseReviewResponse> {
    const validated = validateReviewSubmissionForSurface(input, productSurface);
    if (!validated.ok) {
      throw new RicValidationError(validated.issues);
    }

    const current = await this.getExistingCase(caseId);
    if (!["review_queued", "in_review"].includes(current.lifecycleStatus)) {
      throw new RicLifecycleError(
        `Review submission not allowed from status ${current.lifecycleStatus}`,
      );
    }

    const response = await this.repo.submitReview(caseId, validated.value);

    await this.audit.write({
      actorId,
      actionType: "submit_review",
      targetTable: "case_reviews",
      caseId,
      targetId: response.reviewId,
      payload: { lifecycleStatus: response.lifecycleStatus },
    });

    return response;
  }

  detectReviewDisagreement(input: DisagreementInputs): boolean {
    const cfg = RIC_REVIEW_QUEUE_CONFIG;

    const maxBandDelta = input.decisionBandValues.length
      ? Math.max(...input.decisionBandValues) - Math.min(...input.decisionBandValues)
      : 0;

    const maxDimensionDelta = input.scoreDeltas.length ? Math.max(...input.scoreDeltas) : 0;

    return (
      maxBandDelta >= cfg.disagreementDecisionBandThreshold ||
      maxDimensionDelta >= cfg.disagreementDimensionDeltaThreshold ||
      input.policyRiskDisagreement ||
      input.anyGoldPromotionFlagged ||
      input.manuallyEscalated ||
      input.anyPolicyRiskFlagged
    );
  }

  async adjudicateCase(
    actorId: string,
    caseId: string,
    input: unknown,
  ): Promise<AdjudicateCaseResponse> {
    const validated = validateAdjudicateCaseRequest(input);
    if (!validated.ok) {
      throw new RicValidationError(validated.issues);
    }

    const current = await this.getExistingCase(caseId);
    if (!["review_complete", "adjudication_required"].includes(current.lifecycleStatus)) {
      throw new RicLifecycleError(`Adjudication not allowed from status ${current.lifecycleStatus}`);
    }

    const adjudicated = await this.repo.adjudicateCase(caseId, validated.value);

    await this.audit.write({
      actorId,
      actionType: "adjudicate_case",
      targetTable: "case_adjudications",
      caseId,
      targetId: adjudicated.adjudicationId,
      payload: {
        finalDecision: validated.value.finalDecision,
        truthStatus: validated.value.truthStatus,
      },
    });

    return adjudicated;
  }

  async promoteCase(
    actorId: string,
    caseId: string,
    input: unknown,
  ): Promise<PromoteCaseResponse> {
    const validated = validatePromoteCaseRequest(input);
    if (!validated.ok) {
      throw new RicValidationError(validated.issues);
    }

    const current = await this.getExistingCase(caseId);

    if (validated.value.target === "gold") {
      if (!["adjudicated", "gold_candidate"].includes(current.lifecycleStatus)) {
        throw new RicLifecycleError("Gold promotion requires adjudicated or gold_candidate status");
      }
    } else if (!canTransitionLifecycle(current.lifecycleStatus, "eval_pack_eligible")) {
      throw new RicLifecycleError(
        `Cannot promote to eval_pack_eligible from ${current.lifecycleStatus}`,
      );
    }

    const promoted = await this.repo.promoteCase(caseId, validated.value);

    await this.audit.write({
      actorId,
      actionType: "promote_case",
      targetTable: promoted.promotedTarget === "gold" ? "gold_cases" : "cases",
      caseId,
      payload: {
        target: promoted.promotedTarget,
        lifecycleStatus: promoted.lifecycleStatus,
      },
    });

    return promoted;
  }

  async createEvalPack(actorId: string, input: unknown): Promise<CreateEvalPackResponse> {
    const validated = validateCreateEvalPackRequest(input);
    if (!validated.ok) {
      throw new RicValidationError(validated.issues);
    }

    const created = await this.repo.createEvalPack(validated.value);

    await this.audit.write({
      actorId,
      actionType: "create_eval_pack",
      targetTable: "eval_packs",
      targetId: created.evalPackId,
      payload: {
        evalPackKey: created.evalPackKey,
        version: created.version,
        packType: created.packType,
      },
    });

    return created;
  }

  async exportEvalPack(evalPackId: string): Promise<{
    payload: ExportEvalPackResponse;
    json: string;
  }> {
    const exported = await this.repo.exportEvalPack(evalPackId);
    const normalized = normalizeEvalPackExport(exported);

    return {
      payload: normalized,
      json: serializeEvalPackExport(normalized),
    };
  }

  async getReviewQueue(
    query?: Record<string, string | number | undefined>,
  ): Promise<GetReviewQueueResponse> {
    return this.repo.getReviewQueue(query);
  }

  async getCaseDetail(caseId: string): Promise<GetCaseDetailResponse> {
    return this.repo.getCaseDetail(caseId);
  }

  private async getExistingCase(caseId: string): Promise<RicCaseRecord> {
    const current = await this.repo.getCaseById(caseId);
    if (!current) {
      throw new RicLifecycleError(`Case not found: ${caseId}`);
    }
    return current;
  }

  private assertTransition(from: RicLifecycleStatus, to: RicLifecycleStatus): void {
    if (!canTransitionLifecycle(from, to)) {
      throw new RicLifecycleError(`Illegal lifecycle transition: ${from} -> ${to}`);
    }
  }
}

export function hasDecisionBandConflict(
  decisions: Array<"approve" | "approve_with_minor_edits" | "usable_but_weak" | "not_usable" | "unsafe_or_off_policy">,
  threshold = RIC_REVIEW_QUEUE_CONFIG.disagreementDecisionBandThreshold,
): boolean {
  if (decisions.length < 2) return false;
  const bands = decisions.map((d) => getDecisionBand(d));
  return Math.max(...bands) - Math.min(...bands) >= threshold;
}
