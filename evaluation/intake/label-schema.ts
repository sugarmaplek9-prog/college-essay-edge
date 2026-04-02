// =============================================================
// evaluation/intake/label-schema.ts
// INTAKE-02: Label schema for the narrative signal benchmark dataset.
//
// Defines the canonical label shape used by all benchmark cases.
// Labels must be internally consistent and support downstream
// classifier evaluation (INTAKE-12) and retraining (INTAKE-14).
// =============================================================

import type { SignalType, SignalStrength, NarrativePattern, ContaminationRisk } from '@/types/intake';

// ─────────────────────────────────────────────────────────────
// LABEL ENUMS
// ─────────────────────────────────────────────────────────────

export type BenchmarkSlice =
  | 'positive'           // Clear usable signal, student-owned
  | 'ambiguous'          // Signal present but weak or mixed
  | 'negative_resume'    // No signal; résumé-list / activity dump
  | 'contamination_heavy'; // Polished framing, adult voice

export type NmiLabel =
  | 'nmi_correct'         // System correctly said needs_more_input
  | 'nmi_incorrect'       // System incorrectly said needs_more_input
  | 'not_applicable';     // Case did not reach NMI decision

export type QuestionUsefulnessLabel =
  | 'high'    // Question would meaningfully advance signal
  | 'medium'  // Question is fine but not the top pick
  | 'low'     // Question is weak or redundant
  | 'not_applicable';

export type EscalationCorrectnessLabel =
  | 'correct_escalate'
  | 'correct_no_escalate'
  | 'incorrect_escalate'
  | 'incorrect_no_escalate'
  | 'not_labeled';

// ─────────────────────────────────────────────────────────────
// SIGNAL QUALITY LABEL
// ─────────────────────────────────────────────────────────────

export interface SignalQualityLabel {
  /** Whether this case contains usable narrative signal. */
  usable_signal: boolean;
  /** Labeled signal strength. */
  signal_strength: SignalStrength;
  /** All signal types present in this case. */
  signal_types: SignalType[];
  /** Confidence in these labels (used to weight training examples). */
  label_confidence: 'high' | 'medium' | 'low';
}

// ─────────────────────────────────────────────────────────────
// CONTAMINATION LABEL
// ─────────────────────────────────────────────────────────────

export interface ContaminationLabel {
  /** Expected contamination risk level. */
  contamination_risk: ContaminationRisk;
  /** Whether student scene evidence is present in the raw input. */
  student_scene_present: boolean;
  /** Whether the polished draft is likely adult-authored. */
  adult_framing_present: boolean;
}

// ─────────────────────────────────────────────────────────────
// PATTERN LABEL
// ─────────────────────────────────────────────────────────────

export interface PatternLabel {
  /** Expected primary narrative pattern. */
  primary_pattern: NarrativePattern;
  /** Additional co-present patterns (may be empty). */
  secondary_patterns: NarrativePattern[];
}

// ─────────────────────────────────────────────────────────────
// FULL BENCHMARK CASE LABEL
// ─────────────────────────────────────────────────────────────

export interface BenchmarkCaseLabel {
  /** Which benchmark slice this case belongs to. */
  slice: BenchmarkSlice;
  signal_quality: SignalQualityLabel;
  contamination: ContaminationLabel;
  pattern: PatternLabel;
  nmi_correctness: NmiLabel;
  question_usefulness: QuestionUsefulnessLabel;
  escalation_correctness: EscalationCorrectnessLabel;
  /** Free-text labeler notes for human review and audit. */
  labeler_notes: string;
  /** Schema version of this label object. Bump when adding fields. */
  label_schema_version: 'label_v1';
}

// ─────────────────────────────────────────────────────────────
// BENCHMARK CASE (input + label)
// ─────────────────────────────────────────────────────────────

export interface BenchmarkCase {
  case_id: string;
  label: string;           // Human-readable short label
  slice: BenchmarkSlice;
  story_entries: Array<{
    id: string;
    title: string;
    text: string;
  }>;
  draft_text: string | null;
  school_context_notes: string | null;
  prior_attempt_count: number;
  questions_asked: string[];
  ground_truth: BenchmarkCaseLabel;
}
