// =============================================================
// src/lib/ai/modules/narrative-intake/escalation-rules.ts
// INTAKE-10: Escalation rules for high-risk intake cases
//
// Deterministic rules that decide whether a session should
// route to human review rather than auto-committing.
//
// Rule outcomes are predictable and logged. High-risk cases
// must NOT silently auto-commit a recommendation.
// =============================================================

import type {
  IntakeEscalationDecision,
  EscalationReason,
  EscalationReasonCode,
  IntakeDecisionMeta,
} from '@/types/intake';
import type {
  UsableSignalDecision,
  AuthorshipSignalDecision,
  RecommendationViabilityDecision,
} from '@/types/intake';

// ─────────────────────────────────────────────────────────────
// VERSION + THRESHOLDS
// ─────────────────────────────────────────────────────────────

export const ESCALATION_RULES_VERSION = 'v1' as const;

/** Sessions with more prior attempts than this threshold trigger loop escalation. */
export const RECOVERY_LOOP_THRESHOLD = 3;

/** Queue-level threshold for escalation rate monitoring (INTAKE-15). */
export const ESCALATION_RATE_ALERT_THRESHOLD = 0.15;

// ─────────────────────────────────────────────────────────────
// ESCALATION RULE TABLE
// ─────────────────────────────────────────────────────────────

interface EscalationRule {
  description: string;
  blocking: boolean;
  match: (ctx: EscalationContext) => boolean;
  reason: EscalationReason;
  codes: EscalationReasonCode[];
}

interface EscalationContext {
  contamination_risk: 'high' | 'medium' | 'low';
  signal_strength: 'high' | 'medium' | 'low' | 'none';
  prior_attempt_count: number;
  viability_decision: RecommendationViabilityDecision['decision'];
  has_scene_evidence: boolean;
  conflicting_evidence: boolean;
}

const ESCALATION_RULES: EscalationRule[] = [
  {
    description: 'High contamination + no student signal — human must assess authorship',
    blocking: true,
    match: (ctx) =>
      ctx.contamination_risk === 'high' &&
      ctx.signal_strength === 'none' &&
      !ctx.has_scene_evidence,
    reason: 'high_contamination_low_student_signal',
    codes: ['CONTAMINATION_HIGH_SIGNAL_LOW'],
  },
  {
    description: 'Repeated recovery failure — system looped without gaining signal',
    blocking: true,
    match: (ctx) =>
      ctx.prior_attempt_count >= RECOVERY_LOOP_THRESHOLD &&
      ctx.signal_strength === 'none',
    reason: 'repeated_recovery_failure',
    codes: ['RECOVERY_LOOP_EXCEEDED', 'QUESTION_CAP_NO_SIGNAL'],
  },
  {
    description: 'Conflicting evidence that rules cannot resolve',
    blocking: true,
    match: (ctx) => ctx.conflicting_evidence,
    reason: 'conflicting_evidence',
    codes: ['EVIDENCE_CONFLICT_UNRESOLVABLE'],
  },
  {
    description: 'High contamination + blocked viability — steering risk too high to auto-commit',
    blocking: true,
    match: (ctx) =>
      ctx.contamination_risk === 'high' &&
      ctx.viability_decision === 'blocked',
    reason: 'low_confidence_high_steering_risk',
    codes: ['STEERING_RISK_TOO_HIGH'],
  },
  {
    description: 'No usable signal after multiple attempts',
    blocking: false,
    match: (ctx) =>
      ctx.prior_attempt_count >= 2 &&
      ctx.signal_strength === 'none',
    reason: 'no_usable_signal_multiple_attempts',
    codes: ['QUESTION_CAP_NO_SIGNAL'],
  },
];

// ─────────────────────────────────────────────────────────────
// PUBLIC ESCALATION DECIDER
// ─────────────────────────────────────────────────────────────

export interface EscalationRulesInput {
  usable_signal: UsableSignalDecision;
  authorship_signal: AuthorshipSignalDecision;
  viability: RecommendationViabilityDecision;
  prior_attempt_count: number;
  /**
   * Set to true when the system detects story_entries and draft_text
   * that make contradictory claims that cannot be automatically
   * reconciled (e.g. draft says "I succeeded" but notes say "we failed").
   */
  conflicting_evidence: boolean;
  session_id: string;
}

/**
 * Evaluate escalation rules for a completed intake session.
 * Returns an escalation decision with full audit trail.
 *
 * `blocking = true` means the system MUST route to human review
 * and must not auto-commit any downstream recommendation.
 *
 * `blocking = false` with `escalate = true` means the session
 * should enter the review queue but can optionally surface a
 * reduced-scope result while awaiting review.
 */
export function evaluateEscalation(input: EscalationRulesInput): IntakeEscalationDecision {
  const ctx: EscalationContext = {
    contamination_risk: input.authorship_signal.contamination_risk,
    signal_strength: input.usable_signal.signal_strength,
    prior_attempt_count: input.prior_attempt_count,
    viability_decision: input.viability.decision,
    has_scene_evidence: input.authorship_signal.student_scene_evidence !== 'absent',
    conflicting_evidence: input.conflicting_evidence,
  };

  const meta: IntakeDecisionMeta = {
    decision_version: ESCALATION_RULES_VERSION,
    taxonomy_version: 'taxonomy_v1',
    made_at: new Date().toISOString(),
    made_by: 'rules',
  };

  for (const rule of ESCALATION_RULES) {
    if (rule.match(ctx)) {
      return {
        escalate: true,
        escalation_reason: rule.reason,
        reason_codes: rule.codes,
        blocking: rule.blocking,
        meta,
      };
    }
  }

  return {
    escalate: false,
    escalation_reason: null,
    reason_codes: [],
    blocking: false,
    meta,
  };
}
