// =============================================================
// src/lib/ai/modules/narrative-direction-selection/validator.ts
//
// Validates Narrative Direction Selection provider output.
// Produces a structured ValidatorOutput that drives admissibility
// decisions before artifact persistence.
//
// Validation layers (in order):
//   1. Structural  — required fields present and correct types
//   2. Semantic    — content makes sense as direction guidance
//   3. Brand       — no policy-violating language
//   4. Authenticity — directions appear grounded in student's work
//
// The admissibility decision is derived from the combined result
// of all four checks. A ValidatorOutput is produced for every
// completed generation attempt and is always persisted to
// validator_results, even on block decisions.
// =============================================================

import type {
  NdsPayload,
  SemanticValidationResult,
  StructuralValidationResult,
  ValidatorDecision,
  ValidatorOutput,
  ValidatorSeverity,
} from '@/types/ai';

// Failure codes — canonical strings, not free-text
const FC = {
  MISSING_STATUS: 'nds.structural.missing_status',
  INVALID_STATUS: 'nds.structural.invalid_status',
  MISSING_BEST_DIRECTION: 'nds.structural.missing_best_direction',
  BEST_DIRECTION_MISSING_ID: 'nds.structural.best_direction_missing_id',
  BEST_DIRECTION_MISSING_ANGLE_TITLE: 'nds.structural.best_direction_missing_angle_title',
  BEST_DIRECTION_MISSING_CORE_CLAIM: 'nds.structural.best_direction_missing_core_claim',
  BEST_DIRECTION_MISSING_REAL_STORY: 'nds.structural.best_direction_missing_real_story',
  BEST_DIRECTION_MISSING_STUDENT_REVEAL: 'nds.structural.best_direction_missing_student_reveal',
  BEST_DIRECTION_MISSING_OBVIOUS_ANGLE_COMPARE: 'nds.structural.best_direction_missing_obvious_angle_compare',
  BEST_DIRECTION_MISSING_MAIN_RISK: 'nds.structural.best_direction_missing_main_risk',
  BEST_DIRECTION_MISSING_NEXT: 'nds.structural.best_direction_missing_next',
  NON_UNIQUE_ALTERNATIVE_IDS: 'nds.structural.non_unique_alternative_ids',
  MISSING_EVIDENCE_ANCHORS: 'nds.structural.missing_evidence_anchors',
  MISSING_DEPTH_SIGNALS: 'nds.structural.missing_depth_signals',
  NEEDS_MORE_INPUT_MISSING_QUESTION: 'nds.structural.nmi_missing_recovery_question',
  EMPTY_DIRECTIONS: 'nds.semantic.empty_directions',
  NO_CLEAR_WINNER: 'nds.semantic.no_clear_winner',
  FAKE_VARIETY: 'nds.semantic.fake_variety_alternatives',
  DISHONEST_SUCCESS_INSUFFICIENT_EVIDENCE:
    'nds.semantic.dishonest_success_insufficient_evidence',
  GENERIC_DIRECTION_TITLE: 'nds.semantic.generic_direction_title',
  MISSING_DEPTH_SIGNAL_CONTENT: 'nds.semantic.missing_depth_signal_content',
  GENERIC_REAL_STORY_EXPLANATION: 'nds.semantic.generic_real_story_explanation',
  GENERIC_STUDENT_REVEAL: 'nds.semantic.generic_student_reveal',
  WEAK_OBVIOUS_ANGLE_COMPARE: 'nds.semantic.weak_obvious_angle_compare',
  HEDGED_WINNER_LANGUAGE: 'nds.semantic.hedged_winner_language',
  WEAK_NEXT_MOVE: 'nds.semantic.weak_next_move',
  ALTERNATIVES_NOT_FUNCTIONALLY_DISTINCT: 'nds.semantic.alternatives_not_functionally_distinct',
  BANNED_PHRASE: 'nds.brand.banned_phrase',
  AUTHENTICITY_RISK: 'nds.authenticity.generic_output_risk',
} as const;

// Warning codes — non-blocking signals for the review queue
const WC = {
  SINGLE_ALTERNATIVE: 'nds.semantic.single_alternative_only',
  SHORT_SUMMARY: 'nds.semantic.short_best_direction_summary',
  MISSING_EVIDENCE_SOURCE_IDS: 'nds.provenance.evidence_anchors_lack_source_ids',
} as const;

// Banned phrases that trigger brand failure
const BANNED_PHRASES = [
  'as an ai',
  'as a language model',
  'i cannot',
  'i am unable to',
  'i don\'t have access',
  'i cannot provide',
  'please consult',
  'this is not financial advice',
];

// Generic titles that indicate non-grounded output
const GENERIC_DIRECTION_TITLES = [
  'direction 1',
  'direction 2',
  'direction 3',
  'option 1',
  'option 2',
  'essay direction',
  'personal statement direction',
];

const GENERIC_CLICHE_PATTERN =
  /(meaningful experience|growth|leadership|resilience|authentic self|passion|made me who i am)/i;

const LOW_VALUE_NEXT_MOVE_PATTERN =
  /(^|\b)(draft a paragraph|expand on this|describe what you learned|write more|add more detail)(\b|$)/i;

const HEDGED_WINNER_PATTERN =
  /\b(could be|might be|maybe|perhaps|one option|possible direction|plausible direction|you could|you might|could also)\b/i;

const ADMISSIONS_SIGNAL_PATTERN =
  /\b(reader|admissions|committee|applicant|judgment|discernment|decision-making|decision making|trust|responsibility|listening|humility|self-command|self awareness|diagnose|adapt|pressure|credibility|follow-through|follow through|relational|intellectual)\b/i;

const REVEAL_ACTION_PATTERN =
  /\b(shows|reveals|demonstrates|lets|proves|makes clear|signals)\b/i;

const CONTRAST_REASON_PATTERN =
  /\b(would|instead|lets the reader|leave the reader|watch|centers|overemphasize|retell|resume|résumé|trait claim|summary)\b/i;

const VAGUE_COMPARE_FILLER_PATTERN =
  /\b(more specific|less generic|more concrete|more interesting|more unique|more faithful)\b/i;

/**
 * Attempts to parse a raw provider response into a typed NdsPayload.
 * Returns null if parsing fails completely.
 */
export function parseProviderOutput(
  raw: Record<string, unknown>
): NdsPayload | null {
  try {
    const status = raw['status'];
    if (status === 'success' || status === 'needs_more_input') {
      return raw as unknown as NdsPayload;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Main validator entry point. Runs all four validation layers
 * and returns a complete ValidatorOutput.
 */
export function validateNdsOutput(
  payload: Record<string, unknown>
): ValidatorOutput {
  const warningCodes: string[] = [];

  // --- Layer 1: Structural validation ---
  const structuralResult = validateNdsStructural(payload);
  const failureCodes = [...structuralResult.failure_codes];
  const structural = structuralResult.structural_pass;

  // --- Layers 2-4 only run on structurally valid payloads ---
  let semantic = true;
  let brand = true;
  let authenticity = true;
  let needsMoreInputReasonCode: string | null = null;

  if (structural) {
    const parsed = payload as unknown as NdsPayload;

    if (parsed.status === 'needs_more_input') {
      // For needs_more_input, semantic/brand/authenticity pass by definition
      // (the model correctly identified it cannot proceed)
      needsMoreInputReasonCode = 'insufficient_input_for_direction_generation';
    } else {
      const semanticResult = validateNdsSemantic(parsed);
      semantic = semanticResult.semantic_pass;
      failureCodes.push(...semanticResult.failure_codes);
      warningCodes.push(...semanticResult.warning_codes);
      needsMoreInputReasonCode = semanticResult.needs_more_input_reason_code;
      brand = runBrandValidation(parsed, failureCodes);
      authenticity = runAuthenticityValidation(parsed, failureCodes, warningCodes);
    }
  }

  // --- Derive admissibility decision ---
  const { decision, highestSeverity } = deriveAdmissibility({
    structural,
    semantic,
    brand,
    authenticity,
    failureCodes,
    payload: payload as unknown as NdsPayload,
  });

  if (
    decision === 'convert_to_needs_more_input' &&
    !needsMoreInputReasonCode
  ) {
    needsMoreInputReasonCode = 'insufficient_input_for_direction_generation';
  }

  return {
    structuralPass: structural,
    semanticPass: semantic,
    brandPass: brand,
    authenticityPass: authenticity,
    decision,
    highestSeverity,
    failureCodes,
    warningCodes,
    needsMoreInputReasonCode,
  };
}

export function validateNdsStructural(
  raw: Record<string, unknown>
): StructuralValidationResult {
  const failureCodes: string[] = [];
  const structuralPass = runStructuralValidation(raw, failureCodes);
  return {
    structural_pass: structuralPass,
    failure_codes: failureCodes,
  };
}

export function validateNdsSemantic(
  payload: NdsPayload
): SemanticValidationResult {
  const failures: string[] = [];
  const warnings: string[] = [];

  const semanticPass = runSemanticValidation(payload, failures, warnings);
  if (!semanticPass) {
    return {
      semantic_pass: false,
      decision: 'block',
      failure_codes: failures,
      warning_codes: warnings,
      highest_severity: 'high',
      needs_more_input_reason_code: null,
    };
  }

  return {
    semantic_pass: true,
    decision: payload.status === 'needs_more_input' ? 'convert_to_needs_more_input' : 'accept',
    failure_codes: failures,
    warning_codes: warnings,
    highest_severity: warnings.length > 0 ? 'medium' : 'low',
    needs_more_input_reason_code:
      payload.status === 'needs_more_input'
        ? 'insufficient_input_for_direction_generation'
        : null,
  };
}

// =============================================================
// INTERNAL — Structural Validation
// =============================================================

function runStructuralValidation(
  raw: Record<string, unknown>,
  failures: string[]
): boolean {
  const status = raw['status'];

  if (!status) {
    failures.push(FC.MISSING_STATUS);
    return false;
  }

  if (status !== 'success' && status !== 'needs_more_input') {
    failures.push(FC.INVALID_STATUS);
    return false;
  }

  if (status === 'needs_more_input') {
    if (!raw['recovery_question'] || typeof raw['recovery_question'] !== 'string') {
      failures.push(FC.NEEDS_MORE_INPUT_MISSING_QUESTION);
      return false;
    }
    const ds = raw['depth_signals'] as Record<string, unknown> | undefined;
    if (!ds || typeof ds !== 'object') {
      failures.push(FC.MISSING_DEPTH_SIGNALS);
      return false;
    }
    return true;
  }

  // status === 'success' path
  const bd = raw['best_direction'] as Record<string, unknown> | undefined;
  if (!bd || typeof bd !== 'object') {
    failures.push(FC.MISSING_BEST_DIRECTION);
    return false;
  }

  if (!bd['id'] || typeof bd['id'] !== 'string') {
    failures.push(FC.BEST_DIRECTION_MISSING_ID);
  }
  if (!bd['angle_title'] || typeof bd['angle_title'] !== 'string') {
    failures.push(FC.BEST_DIRECTION_MISSING_ANGLE_TITLE);
  }
  if (!bd['core_claim'] || typeof bd['core_claim'] !== 'string') {
    failures.push(FC.BEST_DIRECTION_MISSING_CORE_CLAIM);
  }
  if (!bd['why_this_is_the_real_story'] || typeof bd['why_this_is_the_real_story'] !== 'string') {
    failures.push(FC.BEST_DIRECTION_MISSING_REAL_STORY);
  }
  if (!bd['what_it_reveals_about_the_student'] || typeof bd['what_it_reveals_about_the_student'] !== 'string') {
    failures.push(FC.BEST_DIRECTION_MISSING_STUDENT_REVEAL);
  }
  if (!bd['why_it_beats_the_obvious_angle'] || typeof bd['why_it_beats_the_obvious_angle'] !== 'string') {
    failures.push(FC.BEST_DIRECTION_MISSING_OBVIOUS_ANGLE_COMPARE);
  }
  if (!bd['main_risk_if_written_poorly'] || typeof bd['main_risk_if_written_poorly'] !== 'string') {
    failures.push(FC.BEST_DIRECTION_MISSING_MAIN_RISK);
  }
  if (!bd['next_move'] || typeof bd['next_move'] !== 'string') {
    failures.push(FC.BEST_DIRECTION_MISSING_NEXT);
  }

  // Validate alternative ids are unique
  const alternatives = raw['alternatives'] as Array<Record<string, unknown>> | undefined;
  if (Array.isArray(alternatives)) {
    const ids = alternatives.map((a) => a['id']).filter(Boolean);
    if (ids.length !== new Set(ids).size) {
      failures.push(FC.NON_UNIQUE_ALTERNATIVE_IDS);
    }
  }

  // evidence_anchors must be present (can be empty array, but key must exist)
  if (!Array.isArray(raw['evidence_anchors'])) {
    failures.push(FC.MISSING_EVIDENCE_ANCHORS);
  }

  const depthSignals = raw['depth_signals'];
  if (!depthSignals || typeof depthSignals !== 'object' || Array.isArray(depthSignals)) {
    failures.push(FC.MISSING_DEPTH_SIGNALS);
  }

  return failures.length === 0;
}

// =============================================================
// INTERNAL — Semantic Validation
// =============================================================

function runSemanticValidation(
  payload: NdsPayload,
  failures: string[],
  warnings: string[]
): boolean {
  if (payload.status !== 'success') return true;

  const { best_direction, alternatives } = payload;

  if (!best_direction || !best_direction.angle_title.trim()) {
    failures.push(FC.EMPTY_DIRECTIONS);
    return false;
  }

  // Best direction title must not be generic
  const titleLower = best_direction.angle_title.toLowerCase().trim();
  if (GENERIC_DIRECTION_TITLES.some((g) => titleLower === g)) {
    failures.push(FC.GENERIC_DIRECTION_TITLE);
  }

  if (
    typeof payload.depth_signals !== 'object' ||
    payload.depth_signals === null ||
    !Object.values(payload.depth_signals).some((v) => typeof v === 'string' && v.trim().length > 0)
  ) {
    failures.push(FC.MISSING_DEPTH_SIGNAL_CONTENT);
  }

  if (
    best_direction.why_this_is_the_real_story.trim().length < 40 ||
    GENERIC_CLICHE_PATTERN.test(best_direction.why_this_is_the_real_story)
  ) {
    failures.push(FC.GENERIC_REAL_STORY_EXPLANATION);
  }

  if (
    HEDGED_WINNER_PATTERN.test(best_direction.core_claim) ||
    HEDGED_WINNER_PATTERN.test(best_direction.why_this_is_the_real_story)
  ) {
    failures.push(FC.HEDGED_WINNER_LANGUAGE);
  }

  if (
    best_direction.what_it_reveals_about_the_student.trim().length < 45 ||
    GENERIC_CLICHE_PATTERN.test(best_direction.what_it_reveals_about_the_student) ||
    !REVEAL_ACTION_PATTERN.test(best_direction.what_it_reveals_about_the_student) ||
    !ADMISSIONS_SIGNAL_PATTERN.test(best_direction.what_it_reveals_about_the_student)
  ) {
    failures.push(FC.GENERIC_STUDENT_REVEAL);
  }

  if (
    best_direction.why_it_beats_the_obvious_angle.trim().length < 55 ||
    !CONTRAST_REASON_PATTERN.test(best_direction.why_it_beats_the_obvious_angle) ||
    (VAGUE_COMPARE_FILLER_PATTERN.test(best_direction.why_it_beats_the_obvious_angle) &&
      !/reader|watch|would|instead|leave the reader/i.test(best_direction.why_it_beats_the_obvious_angle))
  ) {
    failures.push(FC.WEAK_OBVIOUS_ANGLE_COMPARE);
  }

  if (
    best_direction.next_move.trim().length < 60 ||
    LOW_VALUE_NEXT_MOVE_PATTERN.test(best_direction.next_move)
  ) {
    failures.push(FC.WEAK_NEXT_MOVE);
  }

  const anchorsWithSource = payload.evidence_anchors.filter(
    (a: { source_id: string | null }) => !!a.source_id
  );
  if (anchorsWithSource.length === 0) {
    failures.push(FC.DISHONEST_SUCCESS_INSUFFICIENT_EVIDENCE);
  }

  const normalizedBest = normalizeTitle(best_direction.angle_title);
  const normalizedAltTitles = alternatives.map((a: { angle_title: string }) =>
    normalizeTitle(a.angle_title)
  );
  const alternativesSameAsBest = normalizedAltTitles.filter(
    (t: string) => t === normalizedBest
  ).length;
  if (alternativesSameAsBest > 0) {
    failures.push(FC.NO_CLEAR_WINNER);
  }

  if (alternatives.length < 1) {
    failures.push(FC.ALTERNATIVES_NOT_FUNCTIONALLY_DISTINCT);
  }

  if (alternatives.length >= 2) {
    const distinctAltTitles = new Set(normalizedAltTitles);
    const distinctLoses = new Set(
      alternatives.map((a: { why_it_is_weaker: string }) =>
        a.why_it_is_weaker.trim().toLowerCase()
      )
    );
    const distinctModes = new Set(
      alternatives.map((a: { failure_mode: string }) => a.failure_mode.trim().toLowerCase())
    );

    if (distinctAltTitles.size < alternatives.length || (distinctLoses.size === 1 && distinctModes.size === 1)) {
      failures.push(FC.ALTERNATIVES_NOT_FUNCTIONALLY_DISTINCT);
    }
  }

  // Should have at least two alternatives for a useful comparison
  if (alternatives.length < 2) {
    warnings.push(WC.SINGLE_ALTERNATIVE);
  }

  // Evidence anchors should ideally have source_ids
  const anchorsWithoutIds = payload.evidence_anchors.filter(
    (a: { source_id: string | null }) => !a.source_id
  );
  if (anchorsWithoutIds.length > 0) {
    warnings.push(WC.MISSING_EVIDENCE_SOURCE_IDS);
  }

  return failures.length === 0;
}

function normalizeTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// =============================================================
// INTERNAL — Brand Validation
// =============================================================

function runBrandValidation(
  payload: NdsPayload,
  failures: string[]
): boolean {
  if (payload.status !== 'success') return true;

  // Check all text fields for banned phrases
  const textFields = [
    payload.best_direction.angle_title,
    payload.best_direction.core_claim,
    payload.best_direction.why_this_is_the_real_story,
    payload.best_direction.why_it_beats_the_obvious_angle,
    payload.best_direction.next_move,
    ...payload.alternatives.map((a: { angle_title: string }) => a.angle_title),
    ...payload.alternatives.map((a: { why_it_is_weaker: string }) => a.why_it_is_weaker),
  ].join(' ').toLowerCase();

  const hasBannedPhrase = BANNED_PHRASES.some((phrase) =>
    textFields.includes(phrase)
  );

  if (hasBannedPhrase) {
    failures.push(FC.BANNED_PHRASE);
    return false;
  }

  return true;
}

// =============================================================
// INTERNAL — Authenticity Validation
// =============================================================

function runAuthenticityValidation(
  payload: NdsPayload,
  _failures: string[],
  warnings: string[]
): boolean {
  if (payload.status !== 'success') return true;

  // Authenticity risk: if evidence_anchors is completely empty and
  // this is a success output, the directions may not be grounded in
  // the student's actual stories. Flag as warning, not hard failure.
  if (payload.evidence_anchors.length === 0) {
    warnings.push(WC.MISSING_EVIDENCE_SOURCE_IDS);
    // This is a warning, not a block, for v1. Escalate to review queue.
  }

  return true;
}

// =============================================================
// INTERNAL — Admissibility Decision
// =============================================================

function deriveAdmissibility(params: {
  structural: boolean;
  semantic: boolean;
  brand: boolean;
  authenticity: boolean;
  failureCodes: string[];
  payload: NdsPayload;
}): { decision: ValidatorDecision; highestSeverity: ValidatorSeverity } {
  const { structural, semantic, brand, payload } = params;

  // needs_more_input path — convert rather than block
  if (payload?.status === 'needs_more_input') {
    return { decision: 'convert_to_needs_more_input', highestSeverity: 'low' };
  }

  // Hard structural failure → block
  if (!structural) {
    return { decision: 'block', highestSeverity: 'critical' };
  }

  // Brand failure → block (no unsafe content permitted)
  if (!brand) {
    return { decision: 'block', highestSeverity: 'high' };
  }

  // Semantic failure → retry or block depending on severity
  if (!semantic) {
    if (
      params.failureCodes.includes(FC.DISHONEST_SUCCESS_INSUFFICIENT_EVIDENCE) ||
      params.failureCodes.includes(FC.NO_CLEAR_WINNER) ||
      params.failureCodes.includes(FC.MISSING_DEPTH_SIGNAL_CONTENT)
    ) {
      return { decision: 'convert_to_needs_more_input', highestSeverity: 'medium' };
    }

    // Generic titles suggest the model didn't understand the prompt
    // → retry with tighter constraints
    return { decision: 'retry_tightened', highestSeverity: 'high' };
  }

  // All hard checks pass — accept
  return { decision: 'accept', highestSeverity: 'low' };
}
