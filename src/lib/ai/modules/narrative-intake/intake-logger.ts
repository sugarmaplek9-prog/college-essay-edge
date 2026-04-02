// =============================================================
// src/lib/ai/modules/narrative-intake/intake-logger.ts
// INTAKE-11: Intake feature logging and training-data pipeline
//
// Emits one structured IntakeFeatureLogRecord per completed
// intake session. Records are exportable for offline retraining.
//
// Privacy boundaries:
//   - No raw student text is stored in log records.
//   - Excerpts in source provenance refs are limited to 80 chars.
//   - User IDs are pseudonymized at export time (INTAKE-14).
// =============================================================

import type {
  IntakeFeatureLogRecord,
  IntakeIntelligenceObject,
} from '@/types/intake';

// ─────────────────────────────────────────────────────────────
// VERSION
// ─────────────────────────────────────────────────────────────

export const INTAKE_LOGGER_VERSION = 'v1' as const;

// ─────────────────────────────────────────────────────────────
// LOG STORE
// In v1 this is an in-memory ring buffer.
// Replace with a durable store (Supabase table, S3) in production.
// ─────────────────────────────────────────────────────────────

const MAX_IN_MEMORY_RECORDS = 1000;
const logBuffer: IntakeFeatureLogRecord[] = [];

// ─────────────────────────────────────────────────────────────
// ID GENERATION
// ─────────────────────────────────────────────────────────────

function generateLogId(sessionId: string): string {
  const ts = Date.now().toString(36);
  const rand = Math.random().toString(36).slice(2, 8);
  return `ifl_${sessionId.slice(-6)}_${ts}_${rand}`;
}

// ─────────────────────────────────────────────────────────────
// PUBLIC LOGGER
// ─────────────────────────────────────────────────────────────

/**
 * Log a completed intake intelligence result.
 * Called by the orchestrator at the end of every session.
 *
 * `raw_*` fields record input shape metadata (counts, presence)
 * without storing raw text.
 */
export function logIntakeSession(
  intelligence: IntakeIntelligenceObject,
  rawMeta: {
    story_entry_count: number;
    draft_present: boolean;
    school_context_present: boolean;
  }
): IntakeFeatureLogRecord {
  const record: IntakeFeatureLogRecord = {
    log_id: generateLogId(intelligence.intake_session_id),
    session_id: intelligence.intake_session_id,
    student_user_id: intelligence.student_user_id,
    subject_entity_id: intelligence.subject_entity_id,
    raw_story_entry_count: rawMeta.story_entry_count,
    raw_draft_present: rawMeta.draft_present,
    raw_school_context_present: rawMeta.school_context_present,
    usable_signal_decision: intelligence.usable_signal,
    authorship_signal_decision: intelligence.authorship_signal,
    narrative_pattern_decision: intelligence.narrative_pattern,
    trusted_evidence_rank: intelligence.trusted_evidence,
    next_question_decision: intelligence.next_question,
    viability_decision: intelligence.recommendation_viability,
    school_context_decision: intelligence.school_context_use,
    escalation_decision: intelligence.escalation,
    final_direction_artifact_id: null,
    reviewer_override: null,
    student_continued: null,
    student_abandoned: null,
    logged_at: new Date().toISOString(),
  };

  // Trim excerpts for privacy compliance before storing
  record.usable_signal_decision = {
    ...record.usable_signal_decision,
    evidence_sources: record.usable_signal_decision.evidence_sources.map((s) => ({
      ...s,
      excerpt: s.excerpt ? s.excerpt.slice(0, 80) : null,
    })),
  };

  logBuffer.push(record);

  // Ring buffer: evict oldest when over capacity
  if (logBuffer.length > MAX_IN_MEMORY_RECORDS) {
    logBuffer.shift();
  }

  return record;
}

// ─────────────────────────────────────────────────────────────
// RECORD MUTATION HELPERS
// (called after session by downstream systems)
// ─────────────────────────────────────────────────────────────

/** Update a log record when the final direction artifact is written. */
export function recordFinalDirectionArtifact(
  logId: string,
  artifactId: string
): boolean {
  const record = logBuffer.find((r) => r.log_id === logId);
  if (!record) return false;
  record.final_direction_artifact_id = artifactId;
  return true;
}

/** Update a log record when a human reviewer overrides a decision. */
export function recordReviewerOverride(
  logId: string,
  override: NonNullable<IntakeFeatureLogRecord['reviewer_override']>
): boolean {
  const record = logBuffer.find((r) => r.log_id === logId);
  if (!record) return false;
  record.reviewer_override = override;
  return true;
}

/** Update continuation/abandonment signal from the UX layer. */
export function recordStudentContinuation(
  logId: string,
  continued: boolean
): boolean {
  const record = logBuffer.find((r) => r.log_id === logId);
  if (!record) return false;
  record.student_continued = continued;
  record.student_abandoned = !continued;
  return true;
}

// ─────────────────────────────────────────────────────────────
// EXPORT INTERFACE
// ─────────────────────────────────────────────────────────────

/**
 * Export all log records for offline model retraining.
 * In production this would stream to S3 or a training DB.
 *
 * Privacy: Call pseudonymizeForExport() before writing externally.
 */
export function exportLogRecords(): IntakeFeatureLogRecord[] {
  return [...logBuffer];
}

/**
 * Replace student_user_id with a stable pseudonym derived from a
 * one-way hash. Call this before any external export.
 */
export function pseudonymizeForExport(
  records: IntakeFeatureLogRecord[]
): IntakeFeatureLogRecord[] {
  return records.map((r) => ({
    ...r,
    // In production: replace with HMAC-SHA256(student_user_id, salt)
    student_user_id: `pseudo_${simpleHash(r.student_user_id)}`,
  }));
}

function simpleHash(s: string): string {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  }
  return Math.abs(h).toString(36);
}

/** Clear the in-memory buffer (used in tests). */
export function clearLogBuffer(): void {
  logBuffer.length = 0;
}

/** Current buffer size (used in tests + drift monitor). */
export function getLogBufferSize(): number {
  return logBuffer.length;
}
