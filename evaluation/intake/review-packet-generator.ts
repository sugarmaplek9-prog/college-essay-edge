// =============================================================
// evaluation/intake/review-packet-generator.ts
// INTAKE-13: Human review labeling workflow inputs
//
// Generates reviewer-ready packets so humans can label:
//   - contamination correctness
//   - signal quality correctness
//   - NMI correctness
//   - next-question usefulness
//   - escalation correctness
//
// Outputs feed back into the training dataset (INTAKE-14).
// Usage:  npx tsx evaluation/intake/review-packet-generator.ts
// =============================================================

import { writeFileSync, mkdirSync, readFileSync } from 'fs';
import { join, resolve } from 'path';
import type { IntakeFeatureLogRecord } from '../../src/types/intake';

// ─────────────────────────────────────────────────────────────
// PATHS
// ─────────────────────────────────────────────────────────────

const PACKETS_DIR = resolve(__dirname, '../reports/intake/review-packets');

// ─────────────────────────────────────────────────────────────
// REVIEWER PACKET SHAPE
// ─────────────────────────────────────────────────────────────

export interface ReviewerPacket {
  packet_id: string;
  session_id: string;
  generated_at: string;
  /** Summary of what the student provided (no raw text in v1). */
  student_input_summary: {
    story_entry_count: number;
    draft_present: boolean;
    school_context_present: boolean;
  };
  system_decisions: {
    signal_strength: string;
    signal_types: string[];
    contamination_risk: string;
    student_scene_evidence: string;
    primary_pattern: string;
    viability_decision: string;
    question_type: string | null;
    question_text: string | null;
    escalated: boolean;
    escalation_reason: string | null;
  };
  evidence_rank_summary: {
    top_sources: string[];
    downgraded_sources: string[];
  };
  label_fields: {
    contamination_correct: null;        // reviewer fills: true | false
    signal_quality_correct: null;       // reviewer fills: true | false
    nmi_correct: null;                  // reviewer fills: 'correct' | 'incorrect' | 'not_applicable'
    next_question_useful: null;         // reviewer fills: 'high' | 'medium' | 'low' | 'not_applicable'
    escalation_correct: null;           // reviewer fills: 'correct_escalate' | 'correct_no_escalate' | 'incorrect_escalate' | 'incorrect_no_escalate'
    corrected_viability: null;          // reviewer fills if nmi_correct = 'incorrect'
    notes: null;                        // reviewer fills: free text
  };
  packet_schema_version: 'review_packet_v1';
}

// ─────────────────────────────────────────────────────────────
// GENERATOR
// ─────────────────────────────────────────────────────────────

export function generateReviewerPacket(record: IntakeFeatureLogRecord): ReviewerPacket {
  const topSources = record.trusted_evidence_rank.trusted_evidence_rank.slice(0, 3);
  const downgraded = record.trusted_evidence_rank.downgraded_sources.map(
    (d) => `${d.source_id} (${d.reason})`
  );

  return {
    packet_id: `pkt_${record.log_id}`,
    session_id: record.session_id,
    generated_at: new Date().toISOString(),
    student_input_summary: {
      story_entry_count: record.raw_story_entry_count,
      draft_present: record.raw_draft_present,
      school_context_present: record.raw_school_context_present,
    },
    system_decisions: {
      signal_strength: record.usable_signal_decision.signal_strength,
      signal_types: record.usable_signal_decision.signal_types,
      contamination_risk: record.authorship_signal_decision.contamination_risk,
      student_scene_evidence: record.authorship_signal_decision.student_scene_evidence,
      primary_pattern: record.narrative_pattern_decision.primary_pattern,
      viability_decision: record.viability_decision.decision,
      question_type: record.next_question_decision?.question_type ?? null,
      question_text: record.next_question_decision?.question_text ?? null,
      escalated: record.escalation_decision.escalate,
      escalation_reason: record.escalation_decision.escalation_reason,
    },
    evidence_rank_summary: {
      top_sources: topSources,
      downgraded_sources: downgraded,
    },
    label_fields: {
      contamination_correct: null,
      signal_quality_correct: null,
      nmi_correct: null,
      next_question_useful: null,
      escalation_correct: null,
      corrected_viability: null,
      notes: null,
    },
    packet_schema_version: 'review_packet_v1',
  };
}

// ─────────────────────────────────────────────────────────────
// BATCH GENERATOR
// ─────────────────────────────────────────────────────────────

export function generateBatchPackets(records: IntakeFeatureLogRecord[]): ReviewerPacket[] {
  return records.map(generateReviewerPacket);
}

// ─────────────────────────────────────────────────────────────
// PERSIST
// ─────────────────────────────────────────────────────────────

export function persistPackets(packets: ReviewerPacket[]): string {
  mkdirSync(PACKETS_DIR, { recursive: true });
  const timestamp = new Date().toISOString().replace(/[:.]/g, '');
  const outputPath = join(PACKETS_DIR, `review_packets_${timestamp}.json`);
  writeFileSync(outputPath, JSON.stringify(packets, null, 2), 'utf-8');
  return outputPath;
}

// ─────────────────────────────────────────────────────────────
// LABELED PACKET → TRAINING RECORD CONVERTER
// Called after reviewers fill in label_fields
// ─────────────────────────────────────────────────────────────

export interface LabeledTrainingRecord {
  session_id: string;
  packet_id: string;
  labeled_at: string;
  signal_strength: string;
  contamination_risk: string;
  primary_pattern: string;
  viability: string;
  contamination_correct: boolean | null;
  signal_quality_correct: boolean | null;
  nmi_correct: string | null;
  next_question_useful: string | null;
  escalation_correct: string | null;
  corrected_viability: string | null;
  reviewer_notes: string | null;
  label_schema_version: 'training_label_v1';
}

export function convertPacketToTrainingRecord(
  packet: ReviewerPacket & { label_fields: Record<string, unknown> }
): LabeledTrainingRecord {
  return {
    session_id: packet.session_id,
    packet_id: packet.packet_id,
    labeled_at: new Date().toISOString(),
    signal_strength: packet.system_decisions.signal_strength,
    contamination_risk: packet.system_decisions.contamination_risk,
    primary_pattern: packet.system_decisions.primary_pattern,
    viability: packet.system_decisions.viability_decision,
    contamination_correct: packet.label_fields.contamination_correct as boolean | null,
    signal_quality_correct: packet.label_fields.signal_quality_correct as boolean | null,
    nmi_correct: packet.label_fields.nmi_correct as string | null,
    next_question_useful: packet.label_fields.next_question_useful as string | null,
    escalation_correct: packet.label_fields.escalation_correct as string | null,
    corrected_viability: packet.label_fields.corrected_viability as string | null,
    reviewer_notes: packet.label_fields.notes as string | null,
    label_schema_version: 'training_label_v1',
  };
}
