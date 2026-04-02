// =============================================================
// src/lib/ai/errors.ts
// Typed error classes for the AI spine.
// Route handlers catch these and map to appropriate HTTP codes.
// =============================================================

/** Base class for all AI service errors */
export class AiServiceError extends Error {
  constructor(
    message: string,
    public readonly code: string
  ) {
    super(message);
    this.name = 'AiServiceError';
  }
}

/** 400 — Request body is malformed or fails schema validation */
export class MalformedRequestError extends AiServiceError {
  constructor(message: string) {
    super(message, 'MALFORMED_REQUEST');
    this.name = 'MalformedRequestError';
  }
}

/** 403 — Authenticated actor does not own or have access to subject */
export class PermissionDeniedError extends AiServiceError {
  constructor(message = 'Permission denied') {
    super(message, 'PERMISSION_DENIED');
    this.name = 'PermissionDeniedError';
  }
}

/** 404 — Subject entity does not exist */
export class SubjectNotFoundError extends AiServiceError {
  constructor(entityType: string, entityId: string) {
    super(`${entityType} not found: ${entityId}`, 'SUBJECT_NOT_FOUND');
    this.name = 'SubjectNotFoundError';
  }
}

/** 404 — Module registry row not found */
export class ModuleNotFoundError extends AiServiceError {
  constructor(moduleKey: string) {
    super(`Module not found: ${moduleKey}`, 'MODULE_NOT_FOUND');
    this.name = 'ModuleNotFoundError';
  }
}

/** 404 — Run not found */
export class RunNotFoundError extends AiServiceError {
  constructor(runId: string) {
    super(`Run not found: ${runId}`, 'RUN_NOT_FOUND');
    this.name = 'RunNotFoundError';
  }
}

/** 404 — Artifact not found for run */
export class ArtifactNotFoundError extends AiServiceError {
  constructor(runId: string) {
    super(`No admissible artifact for run: ${runId}`, 'ARTIFACT_NOT_FOUND');
    this.name = 'ArtifactNotFoundError';
  }
}

/**
 * 409 — A conflicting in-flight run already exists for
 * (module, subject_entity_type, subject_entity_id)
 */
export class ConflictingRunError extends AiServiceError {
  constructor(public readonly existingRunId: string) {
    super(
      `An active run already exists for this subject: ${existingRunId}`,
      'CONFLICTING_RUN'
    );
    this.name = 'ConflictingRunError';
  }
}

/**
 * 409 — Workflow state prevents the requested operation
 * (e.g. essay_project status does not allow direction selection)
 */
export class InvalidWorkflowStateError extends AiServiceError {
  constructor(message: string) {
    super(message, 'INVALID_WORKFLOW_STATE');
    this.name = 'InvalidWorkflowStateError';
  }
}

/** 422 — Required inputs are missing at the hard-block level */
export class InsufficientInputError extends AiServiceError {
  constructor(reason: string) {
    super(`Insufficient input for generation: ${reason}`, 'INSUFFICIENT_INPUT');
    this.name = 'InsufficientInputError';
  }
}

/** 500 — Module is disabled in module_registry */
export class ModuleDisabledError extends AiServiceError {
  constructor(moduleKey: string) {
    super(`Module is disabled: ${moduleKey}`, 'MODULE_DISABLED');
    this.name = 'ModuleDisabledError';
  }
}

/** Internal — provider or infrastructure failure during execution */
export class ProviderExecutionError extends AiServiceError {
  constructor(
    message: string,
    public readonly providerKey: string
  ) {
    super(message, 'PROVIDER_EXECUTION_ERROR');
    this.name = 'ProviderExecutionError';
  }
}

/** Internal — validator produced an unrecoverable result */
export class ValidatorError extends AiServiceError {
  constructor(message: string) {
    super(message, 'VALIDATOR_ERROR');
    this.name = 'ValidatorError';
  }
}

/**
 * 503 — Required server-side runtime configuration is absent.
 * Thrown when environment variables required for a service
 * (e.g. Supabase URL/key, DB connection string) are not present.
 * Surfaces as 503 with a non-leaking body so callers know the
 * service is unavailable without exposing internal config details.
 */
export class ServiceConfigurationError extends AiServiceError {
  constructor(message = 'Service temporarily unavailable') {
    super(message, 'SERVICE_CONFIGURATION_ERROR');
    this.name = 'ServiceConfigurationError';
  }
}
