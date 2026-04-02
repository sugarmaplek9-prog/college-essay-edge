import type { BlankPageMode, BlankPagePostAnswerRoute } from '@/types/intake';

export type BlankPageEvalSourceType =
  | 'public_internet'
  | 'anonymized_product_input'
  | 'synthetic'
  | 'legacy_synthetic';

export interface BlankPageEvalCase {
  case_id: string;
  prompt: string;
  expected_mode: BlankPageMode;
  observed_mode: BlankPageMode;
  expected_route: BlankPagePostAnswerRoute;
  observed_route: BlankPagePostAnswerRoute;
  source_type: BlankPageEvalSourceType;
  source_origin: string;
  source_reference: string;
  capture_date: string;
  transformation_level: 'raw' | 'lightly_normalized' | 'heavily_transformed';
  adjudication_status: 'approved' | 'pending' | 'rejected';
}

export interface BlankPageCaseValidationResult {
  isValid: boolean;
  errors: string[];
}

export function validateBlankPageEvalCase(input: unknown): BlankPageCaseValidationResult {
  const errors: string[] = [];
  const candidate = input as Partial<BlankPageEvalCase>;

  if (!isNonEmptyString(candidate.case_id)) errors.push('case_id is required');
  if (!isNonEmptyString(candidate.prompt)) errors.push('prompt is required');
  if (!isBlankPageMode(candidate.expected_mode)) errors.push('expected_mode is invalid');
  if (!isBlankPageMode(candidate.observed_mode)) errors.push('observed_mode is invalid');
  if (!isPostAnswerRoute(candidate.expected_route)) errors.push('expected_route is invalid');
  if (!isPostAnswerRoute(candidate.observed_route)) errors.push('observed_route is invalid');

  if (!isSourceType(candidate.source_type)) errors.push('source_type is invalid');
  if (!isNonEmptyString(candidate.source_origin)) errors.push('source_origin is required');
  if (!isNonEmptyString(candidate.source_reference)) errors.push('source_reference is required');
  if (!isIsoDate(candidate.capture_date)) errors.push('capture_date must be ISO-8601');

  if (!isTransformationLevel(candidate.transformation_level)) {
    errors.push('transformation_level is invalid');
  }

  if (!isAdjudicationStatus(candidate.adjudication_status)) {
    errors.push('adjudication_status is invalid');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function isIsoDate(value: unknown): boolean {
  if (typeof value !== 'string' || value.trim().length === 0) return false;
  return !Number.isNaN(Date.parse(value));
}

function isSourceType(value: unknown): value is BlankPageEvalSourceType {
  return (
    value === 'public_internet' ||
    value === 'anonymized_product_input' ||
    value === 'synthetic' ||
    value === 'legacy_synthetic'
  );
}

function isTransformationLevel(value: unknown): value is BlankPageEvalCase['transformation_level'] {
  return value === 'raw' || value === 'lightly_normalized' || value === 'heavily_transformed';
}

function isAdjudicationStatus(value: unknown): value is BlankPageEvalCase['adjudication_status'] {
  return value === 'approved' || value === 'pending' || value === 'rejected';
}

function isBlankPageMode(value: unknown): value is BlankPageMode {
  return (
    value === 'topic_probe' ||
    value === 'theme_probe' ||
    value === 'activity_probe' ||
    value === 'scope_reframe' ||
    value === 'blank_page_discovery' ||
    value === 'too_thin_to_recover'
  );
}

function isPostAnswerRoute(value: unknown): value is BlankPagePostAnswerRoute {
  return (
    value === 'direction_light' ||
    value === 'second_recovery_question' ||
    value === 'clarification' ||
    value === 'too_thin_to_recover'
  );
}
