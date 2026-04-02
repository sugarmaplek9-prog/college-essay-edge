// =============================================================
// src/lib/fm/logEvidenceDecision.ts
//
// Structured evidence-decision log for future ML training.
// Logs one record per session intake call.
//
// Phase 1: logs to console.log (structured JSON) so it can be
//   captured by Vercel's log drain or any stdout aggregator.
// Phase 2: write to a Supabase table or analytics pipeline.
//
// The log record becomes the training dataset for the Phase 2
// trained classifier.
// =============================================================

import type {
  BlankPageIntakePayload,
  EvidenceStrengthPrediction,
  IntakeIntelligenceObject,
  ProductMode,
} from '@/types/intake';
import type { EvidenceFeatures } from '@/lib/ml/evidenceStrength/features';

// =============================================================
// Log record shape
// =============================================================

export interface EvidenceDecisionLogRecord {
  log_id: string;
  session_id: string;
  logged_at: string;

  /** Raw (pre-normalization) character count */
  raw_input_char_count: number;
  /** Normalized input word count */
  normalized_word_count: number;

  /** Orchestrator decision summary */
  orchestrator_viability: string;
  orchestrator_signal_strength: string;
  orchestrator_pattern: string;
  orchestrator_pattern_confidence: string;
  orchestrator_contamination: string;
  orchestrator_scene_evidence: string;

  /** Evidence feature summary */
  features: EvidenceFeatures;

  /** Scoring output */
  product_mode: ProductMode;
  evidence_confidence: number;
  scores: Record<ProductMode, number>;
  feature_summary: EvidenceStrengthPrediction['featureSummary'];

  blank_page_intake_detected: boolean;
  blank_page_mode: EvidenceStrengthPrediction['blank_page_classification']['blank_page_mode'];
  blank_page_trigger_signals: EvidenceStrengthPrediction['blank_page_classification']['blank_page_trigger_signals'];
  blank_page_recovery_reason: EvidenceStrengthPrediction['blank_page_classification']['blank_page_recovery_reason'];
  blank_page_confidence: EvidenceStrengthPrediction['blank_page_classification']['blank_page_confidence'];
  top_level_blank_page_route: EvidenceStrengthPrediction['blank_page_classification']['top_level_blank_page_route'];
  question_family_primary: BlankPageIntakePayload['question_family_primary'] | null;
  question_family_secondary: BlankPageIntakePayload['question_family_secondary'] | null;
  missing_signal_type: BlankPageIntakePayload['missing_signal_type'] | null;
  why_not_ready_for_direction: BlankPageIntakePayload['why_not_ready_for_direction'] | null;
  selected_template_id: BlankPageIntakePayload['selected_template_id'] | null;
  recovery_confidence: BlankPageIntakePayload['recovery_confidence'] | null;

  /** Interaction tracking (filled in later via updates) */
  primary_question_shown: string | null;
  user_continued: boolean | null;
  user_accepted_angle: boolean | null;
}

// =============================================================
// Public API
// =============================================================

/**
 * Logs an evidence decision record.
 *
 * Phase 1: structured console output (captured by log drain).
 * Phase 2: replace the console.log with a DB write.
 */
export function logEvidenceDecision(record: Omit<EvidenceDecisionLogRecord, 'log_id' | 'logged_at'>): void {
  const full: EvidenceDecisionLogRecord = {
    ...record,
    log_id: generateLogId(),
    logged_at: new Date().toISOString(),
  };

  // Emit as structured JSON on a single line for log aggregation
  console.log(JSON.stringify({ event: 'evidence_decision', ...full }));
}

/**
 * Builds a log record from the available session context.
 * Call immediately after scoreEvidenceDeterministic.
 */
export function buildEvidenceLogRecord(input: {
  sessionId: string;
  rawInput: string;
  normalizedInput: string;
  intelligence: IntakeIntelligenceObject;
  features: EvidenceFeatures;
  prediction: EvidenceStrengthPrediction;
  blankPageIntakePayload?: BlankPageIntakePayload | null;
  primaryQuestionShown?: string | null;
}): Omit<EvidenceDecisionLogRecord, 'log_id' | 'logged_at'> {
  return {
    session_id: input.sessionId,
    raw_input_char_count: input.rawInput.length,
    normalized_word_count: input.normalizedInput.split(/\s+/).filter(Boolean).length,

    orchestrator_viability: input.intelligence.recommendation_viability.decision,
    orchestrator_signal_strength: input.intelligence.usable_signal.signal_strength,
    orchestrator_pattern: input.intelligence.narrative_pattern.primary_pattern,
    orchestrator_pattern_confidence: input.intelligence.narrative_pattern.confidence,
    orchestrator_contamination: input.intelligence.authorship_signal.contamination_risk,
    orchestrator_scene_evidence: input.intelligence.authorship_signal.student_scene_evidence,

    features: input.features,

    product_mode: input.prediction.route,
    evidence_confidence: input.prediction.confidence,
    scores: input.prediction.scores,
    feature_summary: input.prediction.featureSummary,

    blank_page_intake_detected: input.prediction.blank_page_classification.blank_page_intake_detected,
    blank_page_mode: input.prediction.blank_page_classification.blank_page_mode,
    blank_page_trigger_signals: input.prediction.blank_page_classification.blank_page_trigger_signals,
    blank_page_recovery_reason: input.prediction.blank_page_classification.blank_page_recovery_reason,
    blank_page_confidence: input.prediction.blank_page_classification.blank_page_confidence,
    top_level_blank_page_route: input.prediction.blank_page_classification.top_level_blank_page_route,
    question_family_primary: input.blankPageIntakePayload?.question_family_primary ?? null,
    question_family_secondary: input.blankPageIntakePayload?.question_family_secondary ?? null,
    missing_signal_type: input.blankPageIntakePayload?.missing_signal_type ?? null,
    why_not_ready_for_direction: input.blankPageIntakePayload?.why_not_ready_for_direction ?? null,
    selected_template_id: input.blankPageIntakePayload?.selected_template_id ?? null,
    recovery_confidence: input.blankPageIntakePayload?.recovery_confidence ?? null,

    primary_question_shown: input.primaryQuestionShown ?? null,
    user_continued: null,
    user_accepted_angle: null,
  };
}

// =============================================================
// Helpers
// =============================================================

function generateLogId(): string {
  return `evd_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}
