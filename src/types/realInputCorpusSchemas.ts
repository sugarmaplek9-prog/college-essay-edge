// realInputCorpusSchemas.ts
// Runtime validation helpers for real-input corpus API payloads

import type {
  AdjudicateCaseRequest,
  AttachRunRequest,
  CreateCaseRequest,
  CreateEvalPackRequest,
  NormalizeCaseRequest,
  PromoteCaseRequest,
  SubmitCaseReviewRequest,
} from "./api/realInputCorpusApi";
import {
  getRequiredScoreDimensions,
  isValidRicScoreValue,
  RIC_ADJUDICATED_TRUTH_STATUSES,
  RIC_ADJUDICATION_REASONS,
  RIC_CASE_TYPES,
  RIC_EXTRACTED_EMOTIONAL_SIGNALS,
  RIC_EXTRACTED_ESSAY_STAGES,
  RIC_EXTRACTED_INTENTS,
  RIC_EXTRACTED_PROMPT_TYPES,
  RIC_FAILURE_MODES,
  RIC_PACK_TYPES,
  RIC_PRODUCT_SURFACES,
  RIC_REVIEW_DECISIONS,
  RIC_RUN_STATUSES,
  RIC_SOURCE_CHANNELS,
  type RicProductSurface,
} from "./realInputCorpus";

export type ValidationIssue = {
  field: string;
  code: string;
  message: string;
};

export type ValidationResult<T> =
  | { ok: true; value: T }
  | { ok: false; issues: ValidationIssue[] };

function ok<T>(value: T): ValidationResult<T> {
  return { ok: true, value };
}

function fail<T>(issues: ValidationIssue[]): ValidationResult<T> {
  return { ok: false, issues };
}

function isEnumValue<T extends readonly string[]>(set: T, value: unknown): value is T[number] {
  return typeof value === "string" && (set as readonly string[]).includes(value);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isObject(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

function pushIssue(
  issues: ValidationIssue[],
  field: string,
  code: string,
  message: string,
): void {
  issues.push({ field, code, message });
}

export function validateCreateCaseRequest(input: unknown): ValidationResult<CreateCaseRequest> {
  const issues: ValidationIssue[] = [];

  if (!isObject(input)) {
    return fail([{ field: "body", code: "invalid_type", message: "Request must be an object" }]);
  }

  if (!isEnumValue(RIC_CASE_TYPES, input.caseType)) {
    pushIssue(issues, "caseType", "invalid_enum", "Invalid case type");
  }
  if (!isEnumValue(RIC_PRODUCT_SURFACES, input.productSurface)) {
    pushIssue(issues, "productSurface", "invalid_enum", "Invalid product surface");
  }
  if (!isEnumValue(RIC_SOURCE_CHANNELS, input.sourceChannel)) {
    pushIssue(issues, "sourceChannel", "invalid_enum", "Invalid source channel");
  }
  if (!isNonEmptyString(input.rawInputText)) {
    pushIssue(issues, "rawInputText", "required", "rawInputText must be non-empty");
  }
  if (!isNonEmptyString(input.labelSchemaVersion)) {
    pushIssue(issues, "labelSchemaVersion", "required", "labelSchemaVersion is required");
  }
  if (!isObject(input.context)) {
    pushIssue(issues, "context", "invalid_type", "context must be an object");
  }
  if (input.tags !== undefined && !Array.isArray(input.tags)) {
    pushIssue(issues, "tags", "invalid_type", "tags must be an array");
  }

  return issues.length ? fail(issues) : ok(input as unknown as CreateCaseRequest);
}

export function validateNormalizeCaseRequest(input: unknown): ValidationResult<NormalizeCaseRequest> {
  const issues: ValidationIssue[] = [];

  if (!isObject(input)) {
    return fail([{ field: "body", code: "invalid_type", message: "Request must be an object" }]);
  }

  if (!isNonEmptyString(input.normalizedInputText)) {
    pushIssue(
      issues,
      "normalizedInputText",
      "required",
      "normalizedInputText must be non-empty",
    );
  }

  if (!isEnumValue(["success", "partial", "failed"] as const, input.normalizationStatus)) {
    pushIssue(issues, "normalizationStatus", "invalid_enum", "Invalid normalizationStatus");
  }

  if (input.extractedIntent != null && !isEnumValue(RIC_EXTRACTED_INTENTS, input.extractedIntent)) {
    pushIssue(issues, "extractedIntent", "invalid_enum", "Invalid extractedIntent");
  }

  if (
    input.extractedEssayStage != null &&
    !isEnumValue(RIC_EXTRACTED_ESSAY_STAGES, input.extractedEssayStage)
  ) {
    pushIssue(issues, "extractedEssayStage", "invalid_enum", "Invalid extractedEssayStage");
  }

  if (
    input.extractedPromptType != null &&
    !isEnumValue(RIC_EXTRACTED_PROMPT_TYPES, input.extractedPromptType)
  ) {
    pushIssue(issues, "extractedPromptType", "invalid_enum", "Invalid extractedPromptType");
  }

  if (
    input.extractedEmotionalSignal != null &&
    !isEnumValue(RIC_EXTRACTED_EMOTIONAL_SIGNALS, input.extractedEmotionalSignal)
  ) {
    pushIssue(
      issues,
      "extractedEmotionalSignal",
      "invalid_enum",
      "Invalid extractedEmotionalSignal",
    );
  }

  if (
    input.extractedAmbiguityLevel != null &&
    (typeof input.extractedAmbiguityLevel !== "number" ||
      !Number.isInteger(input.extractedAmbiguityLevel) ||
      input.extractedAmbiguityLevel < 1 ||
      input.extractedAmbiguityLevel > 5)
  ) {
    pushIssue(
      issues,
      "extractedAmbiguityLevel",
      "invalid_range",
      "extractedAmbiguityLevel must be an integer from 1 to 5",
    );
  }

  return issues.length ? fail(issues) : ok(input as unknown as NormalizeCaseRequest);
}

export function validateAttachRunRequest(input: unknown): ValidationResult<AttachRunRequest> {
  const issues: ValidationIssue[] = [];

  if (!isObject(input)) {
    return fail([{ field: "body", code: "invalid_type", message: "Request must be an object" }]);
  }

  const requiredStringFields: Array<keyof AttachRunRequest> = [
    "runKey",
    "modelProvider",
    "modelName",
    "routingPolicyVersion",
    "promptTemplateVersion",
    "releaseVersion",
  ];

  for (const field of requiredStringFields) {
    if (!isNonEmptyString(input[field])) {
      pushIssue(issues, field, "required", `${field} is required`);
    }
  }

  if (!isEnumValue(RIC_RUN_STATUSES, input.runStatus)) {
    pushIssue(issues, "runStatus", "invalid_enum", "Invalid runStatus");
  }

  if (typeof input.fallbackUsed !== "boolean") {
    pushIssue(issues, "fallbackUsed", "invalid_type", "fallbackUsed must be boolean");
  }

  if (!Array.isArray(input.outputs) || input.outputs.length === 0) {
    pushIssue(issues, "outputs", "required", "outputs must be a non-empty array");
  }

  return issues.length ? fail(issues) : ok(input as unknown as AttachRunRequest);
}

export function validateReviewSubmissionForSurface(
  input: unknown,
  productSurface: RicProductSurface,
): ValidationResult<SubmitCaseReviewRequest> {
  const issues: ValidationIssue[] = [];

  if (!isObject(input)) {
    return fail([{ field: "body", code: "invalid_type", message: "Request must be an object" }]);
  }

  if (!isNonEmptyString(input.caseId)) {
    pushIssue(issues, "caseId", "required", "caseId is required");
  }
  if (!isNonEmptyString(input.runId)) {
    pushIssue(issues, "runId", "required", "runId is required");
  }
  if (!isNonEmptyString(input.reviewerId)) {
    pushIssue(issues, "reviewerId", "required", "reviewerId is required");
  }
  if (!isEnumValue(RIC_REVIEW_DECISIONS, input.decision)) {
    pushIssue(issues, "decision", "invalid_enum", "Invalid review decision");
  }

  if (!Array.isArray(input.scores)) {
    pushIssue(issues, "scores", "invalid_type", "scores must be an array");
  } else {
    const required = new Set(getRequiredScoreDimensions(productSurface));
    const provided = new Set<string>();

    for (const [idx, score] of input.scores.entries()) {
      if (!isObject(score)) {
        pushIssue(issues, `scores[${idx}]`, "invalid_type", "Score entry must be an object");
        continue;
      }
      if (!isNonEmptyString(score.dimension)) {
        pushIssue(issues, `scores[${idx}].dimension`, "required", "dimension is required");
      } else {
        provided.add(score.dimension);
      }
      if (typeof score.value !== "number" || !isValidRicScoreValue(score.value)) {
        pushIssue(issues, `scores[${idx}].value`, "invalid_range", "score value must be 1..5");
      }
    }

    for (const dimension of required) {
      if (!provided.has(dimension)) {
        pushIssue(issues, "scores", "missing_dimension", `Missing required score: ${dimension}`);
      }
    }
  }

  if (!Array.isArray(input.failureModes)) {
    pushIssue(issues, "failureModes", "invalid_type", "failureModes must be an array");
  } else {
    for (const [idx, item] of input.failureModes.entries()) {
      if (!isObject(item)) {
        pushIssue(
          issues,
          `failureModes[${idx}]`,
          "invalid_type",
          "failureMode entry must be an object",
        );
        continue;
      }
      if (!isEnumValue(RIC_FAILURE_MODES, item.failureMode)) {
        pushIssue(
          issues,
          `failureModes[${idx}].failureMode`,
          "invalid_enum",
          "Invalid failure mode",
        );
      }
      if (!isEnumValue(["low", "medium", "high", "critical"] as const, item.severity)) {
        pushIssue(
          issues,
          `failureModes[${idx}].severity`,
          "invalid_enum",
          "Invalid severity",
        );
      }
    }
  }

  return issues.length ? fail(issues) : ok(input as unknown as SubmitCaseReviewRequest);
}

export function validateAdjudicateCaseRequest(
  input: unknown,
): ValidationResult<AdjudicateCaseRequest> {
  const issues: ValidationIssue[] = [];

  if (!isObject(input)) {
    return fail([{ field: "body", code: "invalid_type", message: "Request must be an object" }]);
  }

  if (!isNonEmptyString(input.adjudicatorId)) {
    pushIssue(issues, "adjudicatorId", "required", "adjudicatorId is required");
  }
  if (!isEnumValue(RIC_ADJUDICATION_REASONS, input.adjudicationReason)) {
    pushIssue(issues, "adjudicationReason", "invalid_enum", "Invalid adjudication reason");
  }
  if (!isEnumValue(RIC_REVIEW_DECISIONS, input.finalDecision)) {
    pushIssue(issues, "finalDecision", "invalid_enum", "Invalid finalDecision");
  }
  if (!isEnumValue(RIC_ADJUDICATED_TRUTH_STATUSES, input.truthStatus)) {
    pushIssue(issues, "truthStatus", "invalid_enum", "Invalid truthStatus");
  }
  if (typeof input.goldCandidateConfirmed !== "boolean") {
    pushIssue(
      issues,
      "goldCandidateConfirmed",
      "invalid_type",
      "goldCandidateConfirmed must be boolean",
    );
  }
  if (!isNonEmptyString(input.labelVersionLocked)) {
    pushIssue(issues, "labelVersionLocked", "required", "labelVersionLocked is required");
  }

  return issues.length ? fail(issues) : ok(input as unknown as AdjudicateCaseRequest);
}

export function validatePromoteCaseRequest(input: unknown): ValidationResult<PromoteCaseRequest> {
  const issues: ValidationIssue[] = [];

  if (!isObject(input)) {
    return fail([{ field: "body", code: "invalid_type", message: "Request must be an object" }]);
  }

  if (!isEnumValue(["gold", "eval_pack_eligible"] as const, input.target)) {
    pushIssue(issues, "target", "invalid_enum", "Invalid promotion target");
  }

  if (input.target === "gold") {
    if (!isNonEmptyString(input.goldSetId)) {
      pushIssue(issues, "goldSetId", "required", "goldSetId is required for gold promotion");
    }
    if (!isNonEmptyString(input.goldReason)) {
      pushIssue(issues, "goldReason", "required", "goldReason is required for gold promotion");
    }
  }

  return issues.length ? fail(issues) : ok(input as unknown as PromoteCaseRequest);
}

export function validateCreateEvalPackRequest(
  input: unknown,
): ValidationResult<CreateEvalPackRequest> {
  const issues: ValidationIssue[] = [];

  if (!isObject(input)) {
    return fail([{ field: "body", code: "invalid_type", message: "Request must be an object" }]);
  }

  if (!isNonEmptyString(input.evalPackKey)) {
    pushIssue(issues, "evalPackKey", "required", "evalPackKey is required");
  }
  if (!isNonEmptyString(input.version)) {
    pushIssue(issues, "version", "required", "version is required");
  }
  if (!isEnumValue(RIC_PACK_TYPES, input.packType)) {
    pushIssue(issues, "packType", "invalid_enum", "Invalid packType");
  }
  if (!isNonEmptyString(input.labelVersion)) {
    pushIssue(issues, "labelVersion", "required", "labelVersion is required");
  }
  if (!isNonEmptyString(input.selectionLogicText)) {
    pushIssue(issues, "selectionLogicText", "required", "selectionLogicText is required");
  }
  if (!isNonEmptyString(input.createdBy)) {
    pushIssue(issues, "createdBy", "required", "createdBy is required");
  }
  if (!Array.isArray(input.caseIds) || input.caseIds.length === 0) {
    pushIssue(issues, "caseIds", "required", "caseIds must be a non-empty array");
  }

  return issues.length ? fail(issues) : ok(input as unknown as CreateEvalPackRequest);
}
