// =============================================================
// src/lib/ai/modules/narrative-intake/viability-decider.ts
// INTAKE-08: Constrained recommendation viability decision
//
// Rules-driven decision engine that determines whether intake
// can proceed to: success | reduced_scope | needs_more_input | blocked
//
// ML contributes features (signal strength, contamination risk,
// pattern confidence). Rules make the final decision.
// Every decision is auditable via reason_codes.
// =============================================================

import type {
  RecommendationViabilityDecision,
  ViabilityDecision,
  ViabilityReasonCode,
  IntakeDecisionMeta,
  SignalStrength,
  ContaminationRisk,
  UsableSignalDecision,
  AuthorshipSignalDecision,
  NarrativePatternDecision,
} from '@/types/intake';

// ─────────────────────────────────────────────────────────────
// VERSION
// ─────────────────────────────────────────────────────────────

export const VIABILITY_DECIDER_VERSION = 'v1' as const;

// ─────────────────────────────────────────────────────────────
// VIABILITY RULE TABLE
// ─────────────────────────────────────────────────────────────
// Rules are evaluated top-to-bottom. First match wins.

interface ViabilityRule {
  description: string;
  match: (ctx: ViabilityContext) => boolean;
  decision: ViabilityDecision;
  reason_codes: ViabilityReasonCode[];
}

interface ViabilityContext {
  signal_strength: SignalStrength;
  contamination_risk: ContaminationRisk;
  pattern_confidence: 'high' | 'medium' | 'low';
  prior_attempt_count: number;
  questions_asked_count: number;
  has_scene_evidence: boolean;
  is_resume_only: boolean;
}

const VIABILITY_RULES: ViabilityRule[] = [
  // --- BLOCKED conditions ---
  {
    description: 'High contamination, no scene evidence, multiple prior attempts',
    match: (ctx) =>
      ctx.contamination_risk === 'high' &&
      !ctx.has_scene_evidence &&
      ctx.prior_attempt_count >= 2,
    decision: 'blocked',
    reason_codes: ['HIGH_CONTAMINATION_BLOCKS', 'REPEATED_RECOVERY_FAILURE'],
  },
  {
    description: 'Prior attempts exhausted with no signal gain',
    match: (ctx) =>
      ctx.prior_attempt_count >= 3 &&
      ctx.signal_strength === 'none',
    decision: 'blocked',
    reason_codes: ['PRIOR_ATTEMPTS_EXHAUSTED'],
  },

  // --- SUCCESS conditions ---
  {
    description: 'High signal, low contamination — standard success',
    match: (ctx) =>
      ctx.signal_strength === 'high' &&
      ctx.contamination_risk === 'low' &&
      ctx.pattern_confidence !== 'low',
    decision: 'success',
    reason_codes: ['SUFFICIENT_SIGNAL_STANDARD'],
  },
  {
    description: 'High signal, medium contamination, scene evidence present',
    match: (ctx) =>
      ctx.signal_strength === 'high' &&
      ctx.contamination_risk === 'medium' &&
      ctx.has_scene_evidence,
    decision: 'success',
    reason_codes: ['SUFFICIENT_SIGNAL_STANDARD'],
  },

  // --- REDUCED SCOPE conditions ---
  {
    description: 'High signal with low pattern confidence but concrete scene evidence — proceed reduced scope',
    match: (ctx) =>
      ctx.signal_strength === 'high' &&
      ctx.pattern_confidence === 'low' &&
      ctx.contamination_risk !== 'high' &&
      ctx.has_scene_evidence,
    decision: 'reduced_scope',
    reason_codes: ['PATTERN_AMBIGUOUS_PROCEED_REDUCED'],
  },
  {
    description: 'Medium signal, contamination not high — reduced scope',
    match: (ctx) =>
      ctx.signal_strength === 'medium' &&
      ctx.contamination_risk !== 'high',
    decision: 'reduced_scope',
    reason_codes: ['SUFFICIENT_FOR_REDUCED'],
  },
  {
    description: 'Medium signal, high contamination but scene evidence present',
    match: (ctx) =>
      ctx.signal_strength === 'medium' &&
      ctx.contamination_risk === 'high' &&
      ctx.has_scene_evidence,
    decision: 'reduced_scope',
    reason_codes: ['SUFFICIENT_FOR_REDUCED', 'DRAFT_ONLY_CONTAMINATION_RISK'],
  },
  {
    description: 'Pattern ambiguous but some signal — reduced scope after questions exhausted',
    match: (ctx) =>
      ctx.signal_strength !== 'none' &&
      ctx.pattern_confidence === 'medium' &&
      ctx.questions_asked_count >= 2,
    decision: 'reduced_scope',
    reason_codes: ['PATTERN_AMBIGUOUS_PROCEED_REDUCED', 'QUESTION_CAP_REACHED_REDUCE'],
  },
  {
    description: 'Low signal, low contamination, prior attempt > 0 — concede reduced scope',
    match: (ctx) =>
      ctx.signal_strength === 'low' &&
      ctx.contamination_risk === 'low' &&
      ctx.prior_attempt_count >= 1,
    decision: 'reduced_scope',
    reason_codes: ['SUFFICIENT_FOR_REDUCED'],
  },

  // --- NEEDS MORE INPUT conditions ---
  {
    description: 'Draft-only with high contamination risk, no scene evidence',
    match: (ctx) =>
      ctx.contamination_risk === 'high' &&
      !ctx.has_scene_evidence &&
      ctx.prior_attempt_count < 2,
    decision: 'needs_more_input',
    reason_codes: ['DRAFT_ONLY_CONTAMINATION_RISK', 'NO_SCENE_EVIDENCE'],
  },
  {
    description: 'Resume list only — needs story',
    match: (ctx) => ctx.is_resume_only,
    decision: 'needs_more_input',
    reason_codes: ['RESUME_LIST_INSUFFICIENT'],
  },
  {
    description: 'No signal, no contamination issue — just thin input',
    match: (ctx) =>
      ctx.signal_strength === 'none' &&
      ctx.contamination_risk === 'low' &&
      ctx.prior_attempt_count === 0,
    decision: 'needs_more_input',
    reason_codes: ['NO_SCENE_EVIDENCE'],
  },
  {
    description: 'Low signal, high contamination — ask for student notes first',
    match: (ctx) =>
      ctx.signal_strength === 'low' &&
      ctx.contamination_risk === 'high' &&
      !ctx.has_scene_evidence,
    decision: 'needs_more_input',
    reason_codes: ['DRAFT_ONLY_CONTAMINATION_RISK'],
  },

  // --- DEFAULT ---
  {
    description: 'Fallback: unclear input → needs_more_input',
    match: () => true,
    decision: 'needs_more_input',
    reason_codes: ['NO_SCENE_EVIDENCE'],
  },
];

// ─────────────────────────────────────────────────────────────
// PUBLIC DECIDER
// ─────────────────────────────────────────────────────────────

export interface ViabilityDeciderInput {
  usable_signal: UsableSignalDecision;
  authorship_signal: AuthorshipSignalDecision;
  narrative_pattern: NarrativePatternDecision;
  prior_attempt_count: number;
  questions_asked: string[];
  session_id: string;
}

/**
 * Determine whether the intake can proceed to a recommendation.
 *
 * Decision is fully rules-driven. ML features (signal, contamination,
 * pattern confidence) are inputs; rules determine the outcome.
 * `reason_codes` provide the complete audit trail.
 */
export function decideViability(input: ViabilityDeciderInput): RecommendationViabilityDecision {
  const ctx: ViabilityContext = {
    signal_strength: input.usable_signal.signal_strength,
    contamination_risk: input.authorship_signal.contamination_risk,
    pattern_confidence: input.narrative_pattern.confidence,
    prior_attempt_count: input.prior_attempt_count,
    questions_asked_count: input.questions_asked.length,
    has_scene_evidence: input.authorship_signal.student_scene_evidence !== 'absent',
    is_resume_only: input.usable_signal.reason_codes.includes('RESUME_LIST_ONLY'),
  };

  // Evaluate rules in order; first match wins
  for (const rule of VIABILITY_RULES) {
    if (rule.match(ctx)) {
      const meta: IntakeDecisionMeta = {
        decision_version: VIABILITY_DECIDER_VERSION,
        taxonomy_version: 'taxonomy_v1',
        made_at: new Date().toISOString(),
        made_by: 'rules',
      };
      return {
        decision: rule.decision,
        reason_codes: rule.reason_codes,
        signal_sufficiency_used: ctx.signal_strength,
        contamination_risk_used: ctx.contamination_risk,
        meta,
      };
    }
  }

  // Should never reach here due to default rule, but TypeScript requires it
  const meta: IntakeDecisionMeta = {
    decision_version: VIABILITY_DECIDER_VERSION,
    taxonomy_version: 'taxonomy_v1',
    made_at: new Date().toISOString(),
    made_by: 'rules',
  };
  return {
    decision: 'needs_more_input',
    reason_codes: ['NO_SCENE_EVIDENCE'],
    signal_sufficiency_used: ctx.signal_strength,
    contamination_risk_used: ctx.contamination_risk,
    meta,
  };
}
