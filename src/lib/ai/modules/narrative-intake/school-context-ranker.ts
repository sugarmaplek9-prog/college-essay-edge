// =============================================================
// src/lib/ai/modules/narrative-intake/school-context-ranker.ts
// INTAKE-09: School-context relevance ranking
//
// Determines whether available school context genuinely sharpens
// the emerging narrative direction, or is irrelevant padding.
//
// Decision: use | hold | ignore
//   use  — school context is meaningfully related to the pattern
//   hold — context exists but pattern is not yet confirmed enough
//   ignore — school context is generic or unrelated
// =============================================================

import type {
  SchoolContextUseDecisionResult,
  SchoolContextUseDecision,
  SchoolContextReasonCode,
  IntakeDecisionMeta,
  IntakeSourceProvenanceRef,
  NarrativePatternDecision,
} from '@/types/intake';

// ─────────────────────────────────────────────────────────────
// VERSION
// ─────────────────────────────────────────────────────────────

export const SCHOOL_CONTEXT_RANKER_VERSION = 'v1' as const;

// ─────────────────────────────────────────────────────────────
// RELEVANCE PATTERNS
// Organized by narrative pattern — school context is relevant
// when its language resonates with the emerging pattern.
// ─────────────────────────────────────────────────────────────

const PATTERN_SCHOOL_RESONANCE: Record<string, RegExp[]> = {
  self_correction_arc: [
    /growth mindset/i,
    /learning from failure/i,
    /intellectual humility/i,
    /reflective (learner|practice|thinking)/i,
    /revision/i,
    /feedback culture/i,
  ],
  conflict_reframe: [
    /collaborative (community|culture|environment)/i,
    /dialogue/i,
    /bridge (perspective|gap|difference)/i,
    /constructive discourse/i,
    /debate/i,
    /diverse perspective/i,
  ],
  identity_shift: [
    /exploratory/i,
    /interdisciplinary/i,
    /self-discovery/i,
    /finding your (voice|path|identity)/i,
    /open curriculum/i,
  ],
  responsibility_shift: [
    /collaborative research/i,
    /team.based (learning|project|research)/i,
    /community (contribution|impact)/i,
    /shared (responsibility|governance)/i,
  ],
  usefulness_vs_intention: [
    /human.centered/i,
    /service learning/i,
    /community impact/i,
    /applied (research|learning|service)/i,
    /equity/i,
    /access/i,
  ],
  failure_reinterpretation: [
    /research university/i,
    /undergraduate research/i,
    /experimental/i,
    /innovation/i,
    /entrepreneurship/i,
    /taking intellectual risk/i,
  ],
};

const GENERIC_PADDING_PATTERNS = [
  /amazing (research|opportunities|faculty|campus)/i,
  /world.class/i,
  /dream school/i,
  /always wanted to attend/i,
  /best (university|school|program) for/i,
  /top.ranked/i,
  /culture of innovation/i,
  /diverse community/i,
];

// ─────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────

function countHits(text: string, patterns: RegExp[]): number {
  return patterns.filter((p) => p.test(text)).length;
}

function computeRelevanceScore(
  schoolNotes: string,
  primaryPattern: string,
  genericHits: number,
  resonanceHits: number
): number {
  if (primaryPattern === 'unknown') return 0;
  if (genericHits >= 2 && resonanceHits === 0) return 0.05;

  const base = Math.min(resonanceHits * 0.2, 0.8);
  const genericPenalty = Math.min(genericHits * 0.1, 0.3);
  return Math.max(0, Math.min(1, base - genericPenalty));
}

// ─────────────────────────────────────────────────────────────
// PUBLIC RANKER
// ─────────────────────────────────────────────────────────────

export interface SchoolContextRankerInput {
  school_context: {
    source_id: string;
    target_school: string;
    notes: string;
  } | null;
  narrative_pattern: NarrativePatternDecision;
  session_id: string;
}

/**
 * Rank whether school context should be used, held, or ignored
 * given the emerging narrative direction.
 *
 * Returns null when no school context is present.
 * Returns a full `SchoolContextUseDecisionResult` when context exists.
 */
export function rankSchoolContextRelevance(
  input: SchoolContextRankerInput
): SchoolContextUseDecisionResult | null {
  if (!input.school_context || input.school_context.notes.trim().length === 0) {
    const meta: IntakeDecisionMeta = {
      decision_version: SCHOOL_CONTEXT_RANKER_VERSION,
      taxonomy_version: 'taxonomy_v1',
      made_at: new Date().toISOString(),
      made_by: 'rules',
    };
    return {
      school_context_use: 'ignore',
      relevance_score: 0,
      reason: 'No school context provided.',
      reason_codes: ['NO_SCHOOL_CONTEXT_PROVIDED'],
      source_ref: null,
      meta,
    };
  }

  const { notes, source_id } = input.school_context;
  const primaryPattern = input.narrative_pattern.primary_pattern;
  const patternConfidence = input.narrative_pattern.confidence;

  const resonancePatterns = PATTERN_SCHOOL_RESONANCE[primaryPattern] ?? [];
  const resonanceHits = countHits(notes, resonancePatterns);
  const genericHits = countHits(notes, GENERIC_PADDING_PATTERNS);
  const relevance_score = computeRelevanceScore(notes, primaryPattern, genericHits, resonanceHits);

  const source_ref: IntakeSourceProvenanceRef = {
    source_id,
    source_type: 'school_context',
    excerpt: notes.slice(0, 100),
  };

  let decision: SchoolContextUseDecision;
  let reason: string;
  const reason_codes: SchoolContextReasonCode[] = [];

  if (primaryPattern === 'unknown' || patternConfidence === 'low') {
    decision = 'hold';
    reason = 'Narrative pattern is not yet confirmed — hold school context until signal is clearer.';
    reason_codes.push('HOLDS_PENDING_MORE_SIGNAL');
  } else if (genericHits >= 2 && resonanceHits === 0) {
    decision = 'ignore';
    reason = 'School context reads as generic-padding language without connecting to the emerging narrative.';
    reason_codes.push('GENERIC_PADDING_RISK', 'IRRELEVANT_TO_CURRENT_NARRATIVE');
  } else if (relevance_score >= 0.4) {
    decision = 'use';
    reason = `School context supports the emerging ${primaryPattern.replace(/_/g, ' ')} pattern.`;
    reason_codes.push('SUPPORTS_EMERGING_PATTERN');
    if (resonanceHits >= 2) reason_codes.push('ADDS_SPECIFICITY_TO_ANGLE');
  } else if (relevance_score >= 0.1) {
    decision = 'hold';
    reason = 'School context has some resonance but is not strong enough to include without more signal.';
    reason_codes.push('HOLDS_PENDING_MORE_SIGNAL');
  } else {
    decision = 'ignore';
    reason = 'School context does not resonate with the current narrative direction.';
    reason_codes.push('IRRELEVANT_TO_CURRENT_NARRATIVE');
  }

  const meta: IntakeDecisionMeta = {
    decision_version: SCHOOL_CONTEXT_RANKER_VERSION,
    taxonomy_version: 'taxonomy_v1',
    made_at: new Date().toISOString(),
    made_by: 'hybrid',
  };

  return {
    school_context_use: decision,
    relevance_score,
    reason,
    reason_codes,
    source_ref,
    meta,
  };
}
