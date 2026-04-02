// =============================================================
// src/lib/ai/constants.ts
// Module-level constants for the AI spine.
// =============================================================

/** Canonical module key for Narrative Direction Selection */
export const MODULE_KEY_NDS = 'narrative_direction_selection' as const;

/** Run statuses that indicate an active (non-terminal) run */
export const ACTIVE_RUN_STATUSES = ['queued', 'running'] as const;

/** Run statuses that represent a terminal state */
export const TERMINAL_RUN_STATUSES = [
  'completed',
  'partial',
  'needs_more_input',
  'failed_validation',
  'blocked',
  'system_error',
] as const;

/** Artifact statuses that are considered admissible product output */
export const ADMISSIBLE_ARTIFACT_STATUSES = [
  'success',
  'partial',
  'needs_more_input',
] as const;

/** Validator decisions that allow artifact persistence */
export const PERSIST_DECISIONS = [
  'accept',
  'accept_partial',
  'convert_to_needs_more_input',
] as const;

/** Maps validator decision → run status (terminal) */
export const DECISION_TO_RUN_STATUS: Record<string, string> = {
  accept: 'completed',
  accept_partial: 'partial',
  convert_to_needs_more_input: 'needs_more_input',
  block: 'blocked',
  retry_tightened: 'failed_validation',
  retry_reduced_scope: 'failed_validation',
};

/** Maps validator decision → artifact status */
export const DECISION_TO_ARTIFACT_STATUS: Record<string, string> = {
  accept: 'success',
  accept_partial: 'partial',
  convert_to_needs_more_input: 'needs_more_input',
};

/** Default render version for v1 artifacts */
export const DEFAULT_RENDER_VERSION = 'v1.0';

/** Default validator version for v1 */
export const DEFAULT_VALIDATOR_VERSION = 'v1.0';

/** Default schema version for NDS artifacts */
export const NDS_SCHEMA_VERSION = 'v1.0';

/** Provider keys */
export const PROVIDER_KEY_OPENAI = 'openai';
export const PROVIDER_KEY_ANTHROPIC = 'anthropic';

/** Default provider and model for NDS */
export const NDS_DEFAULT_PROVIDER = PROVIDER_KEY_OPENAI;
export const NDS_DEFAULT_MODEL = 'gpt-4o';

/** Minimum story body length (characters) to consider as usable input */
export const MIN_STORY_BODY_LENGTH = 50;

/** Minimum number of story entries for a standard mode run */
export const MIN_STORY_ENTRIES_FOR_STANDARD = 1;
