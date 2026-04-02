// =============================================================
// src/lib/ai/modules/narrative-intake/question-selector.ts
// INTAKE-07: Next-question selector v1
//
// Selects exactly one best next question to advance the student's
// intake. Never returns zero or two questions. Enforces question
// caps and prevents repetitive questioning loops.
//
// Decision hierarchy (highest information gain first):
//   1. turning_point  — when no pivot is confirmed
//   2. scene_detail   — when no scene evidence exists
//   3. stakes         — when stakes are not yet established
//   4. consequence    — when outcome is unknown
//   5. motivation     — when reason for action is unclear
//   6. relationship   — when relational context is missing
// =============================================================

import type {
  NextQuestionDecision,
  QuestionType,
  QuestionSelectionReason,
  NextQuestionReasonCode,
  IntakeSourceProvenanceRef,
  IntakeDecisionMeta,
} from '@/types/intake';
import type { UsableSignalDecision, NarrativePatternDecision, AuthorshipSignalDecision } from '@/types/intake';

// ─────────────────────────────────────────────────────────────
// VERSION + CAPS
// ─────────────────────────────────────────────────────────────

export const QUESTION_SELECTOR_VERSION = 'v1' as const;

/** Maximum questions per session before switching to reduced_scope fallback. */
export const MAX_QUESTIONS_PER_SESSION = 3;

// ─────────────────────────────────────────────────────────────
// QUESTION BANK
// ─────────────────────────────────────────────────────────────

const QUESTION_BANK: Record<QuestionType, string> = {
  turning_point:
    'What is one specific moment where your role or self-understanding changed in front of other people?',
  scene_detail:
    'Can you describe one moment — a specific day, session, or conversation — where something shifted in how you were handling the situation?',
  stakes:
    'Who else was affected by how this situation played out, and what was at risk for them?',
  consequence:
    'What happened after you changed how you were approaching it? What did you notice was different?',
  motivation:
    'Before the shift happened, what were you actually trying to accomplish — and why did that approach make sense to you at the time?',
  relationship:
    'Who was the person whose reaction or feedback mattered most in this situation, and what did they say or do?',
};

// ─────────────────────────────────────────────────────────────
// SELECTION LOGIC
// ─────────────────────────────────────────────────────────────

export interface QuestionSelectorInput {
  usable_signal: UsableSignalDecision;
  narrative_pattern: NarrativePatternDecision;
  authorship_signal: AuthorshipSignalDecision;
  prior_questions_asked: QuestionType[];
  evidence_gap_sources: IntakeSourceProvenanceRef[];
  session_id: string;
}

interface SelectionCandidate {
  type: QuestionType;
  selectionReason: QuestionSelectionReason;
  reasonCodes: NextQuestionReasonCode[];
  fallback: NextQuestionDecision['fallback_if_unanswered'];
  priority: number;  // lower = higher priority
}

function buildCandidates(input: QuestionSelectorInput): SelectionCandidate[] {
  const { usable_signal, narrative_pattern, authorship_signal } = input;
  const asked = new Set(input.prior_questions_asked);
  const candidates: SelectionCandidate[] = [];

  // Priority 1: No pivot confirmed → turning_point
  const noPivot =
    narrative_pattern.primary_pattern === 'unknown' ||
    narrative_pattern.confidence === 'low';
  if (noPivot && !asked.has('turning_point')) {
    candidates.push({
      type: 'turning_point',
      selectionReason: 'highest_information_gain',
      reasonCodes: ['PIVOT_UNCONFIRMED'],
      fallback: 'reduced_scope_possible',
      priority: 1,
    });
  }

  // Priority 2: No scene evidence → scene_detail
  const noScene = authorship_signal.student_scene_evidence === 'absent' &&
    usable_signal.signal_strength !== 'high';
  if (noScene && !asked.has('scene_detail')) {
    candidates.push({
      type: 'scene_detail',
      selectionReason: 'fills_scene_detail_gap',
      reasonCodes: ['MISSING_SCENE_DETAIL'],
      fallback: 'needs_more_input',
      priority: 2,
    });
  }

  // Priority 3: Pattern is ambiguous (medium confidence) → disambiguates
  const patternAmbiguous = narrative_pattern.confidence === 'medium';
  if (patternAmbiguous && !asked.has('stakes')) {
    candidates.push({
      type: 'stakes',
      selectionReason: 'disambiguates_pattern',
      reasonCodes: ['PATTERN_AMBIGUOUS', 'STAKES_UNKNOWN'],
      fallback: 'reduced_scope_possible',
      priority: 3,
    });
  }

  // Priority 4: Contamination ambiguity → relationship question to anchor voice
  const contaminationAmbiguous = authorship_signal.contamination_risk === 'medium';
  if (contaminationAmbiguous && !asked.has('relationship')) {
    candidates.push({
      type: 'relationship',
      selectionReason: 'resolves_contamination_ambiguity',
      reasonCodes: ['RELATIONSHIP_CONTEXT_MISSING'],
      fallback: 'reduced_scope_possible',
      priority: 4,
    });
  }

  // Priority 5: Signal present but consequence unknown
  const noConsequence =
    usable_signal.usable_signal &&
    !usable_signal.signal_types.includes('failure_reinterpretation');
  if (noConsequence && !asked.has('consequence')) {
    candidates.push({
      type: 'consequence',
      selectionReason: 'clarifies_pivot_moment',
      reasonCodes: ['CONSEQUENCE_NOT_STATED'],
      fallback: 'reduced_scope_possible',
      priority: 5,
    });
  }

  // Priority 6: Motivation unclear (only ask if some signal exists)
  if (usable_signal.usable_signal && !asked.has('motivation')) {
    candidates.push({
      type: 'motivation',
      selectionReason: 'highest_information_gain',
      reasonCodes: ['MOTIVATION_UNCLEAR'],
      fallback: 'reduced_scope_possible',
      priority: 6,
    });
  }

  return candidates.sort((a, b) => a.priority - b.priority);
}

// ─────────────────────────────────────────────────────────────
// PUBLIC SELECTOR
// ─────────────────────────────────────────────────────────────

/**
 * Select exactly one next question for the intake session.
 *
 * Returns null when signal is already sufficient (no question needed).
 * Enforces MAX_QUESTIONS_PER_SESSION — when the cap is reached,
 * returns a consequence question with fallback = reduced_scope_possible
 * so the system can proceed rather than stalling.
 */
export function selectNextQuestion(
  input: QuestionSelectorInput
): NextQuestionDecision | null {
  // No question needed when signal is already strong
  if (
    input.usable_signal.signal_strength === 'high' &&
    input.narrative_pattern.confidence !== 'low' &&
    input.authorship_signal.student_scene_evidence === 'present'
  ) {
    return null;
  }

  const candidates = buildCandidates(input);

  // Cap enforcement: if we've already hit the max, pick the best fallback
  if (input.prior_questions_asked.length >= MAX_QUESTIONS_PER_SESSION) {
    const meta: IntakeDecisionMeta = {
      decision_version: QUESTION_SELECTOR_VERSION,
      taxonomy_version: 'taxonomy_v1',
      made_at: new Date().toISOString(),
      made_by: 'rules',
    };
    return {
      question_type: 'consequence',
      question_text: QUESTION_BANK.consequence,
      why_this_question: 'clarifies_pivot_moment',
      reason_codes: ['QUESTION_CAP_REACHED_REDUCE' as NextQuestionReasonCode],
      fallback_if_unanswered: 'reduced_scope_possible',
      evidence_gap_sources: input.evidence_gap_sources,
      meta,
    };
  }

  // No candidates means signal is sufficient
  if (candidates.length === 0) return null;

  const best = candidates[0];

  const meta: IntakeDecisionMeta = {
    decision_version: QUESTION_SELECTOR_VERSION,
    taxonomy_version: 'taxonomy_v1',
    made_at: new Date().toISOString(),
    made_by: 'hybrid',
  };

  return {
    question_type: best.type,
    question_text: QUESTION_BANK[best.type],
    why_this_question: best.selectionReason,
    reason_codes: best.reasonCodes,
    fallback_if_unanswered: best.fallback,
    evidence_gap_sources: input.evidence_gap_sources,
    meta,
  };
}

// Re-export cap constant for use in tests + orchestrator
export { MAX_QUESTIONS_PER_SESSION as QUESTION_CAP };
