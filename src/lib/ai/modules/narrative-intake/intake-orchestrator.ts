// =============================================================
// src/lib/ai/modules/narrative-intake/intake-orchestrator.ts
// INTAKE-17: V1 intake orchestration service
//
// Calls all intake decision components in the correct sequence
// and returns one canonical IntakeIntelligenceObject for
// downstream modules (NDS, supplement angle, revision priority).
//
// Sequence:
//   1. signal detection       (INTAKE-03)
//   2. contamination scoring  (INTAKE-04)
//   3. pattern classification (INTAKE-05)
//   4. evidence ranking       (INTAKE-06)
//   5. question selection     (INTAKE-07)
//   6. viability decision     (INTAKE-08)
//   7. school context         (INTAKE-09, if present)
//   8. escalation decision    (INTAKE-10)
// =============================================================

import type {
  IntakeIntelligenceObject,
  IntakeSessionInput,
  IntakeSourceProvenanceRef,
} from '@/types/intake';
import { classifyUsableSignal } from './signal-classifier';
import { classifyContamination } from './contamination-classifier';
import { classifyNarrativePattern } from './pattern-classifier';
import { rankTrustedEvidence, type RankableSource } from './evidence-ranker';
import { selectNextQuestion } from './question-selector';
import { decideViability } from './viability-decider';
import { rankSchoolContextRelevance } from './school-context-ranker';
import { evaluateEscalation } from './escalation-rules';

// ─────────────────────────────────────────────────────────────
// VERSION
// ─────────────────────────────────────────────────────────────

export const ORCHESTRATOR_VERSION = 'v1' as const;

// ─────────────────────────────────────────────────────────────
// SOURCE ADAPTER
// Converts IntakeSessionInput sources into RankableSource objects
// for the evidence ranker.
// ─────────────────────────────────────────────────────────────

function buildRankableSources(
  input: IntakeSessionInput,
  contaminationRisk: 'high' | 'medium' | 'low',
  hasSceneEvidence: boolean
): RankableSource[] {
  const sources: RankableSource[] = [];

  input.story_entries.forEach((entry, index) => {
    sources.push({
      source_id: entry.id,
      source_type: 'story_entry',
      recency_rank: index + 1,
      project_id: entry.project_id ?? input.subject_entity_id,
      rejected: input.rejected_source_ids.includes(entry.id) || (entry.rejected ?? false),
      is_cross_project: entry.project_id != null && entry.project_id !== input.subject_entity_id,
      is_stale: false,
      contamination_risk: 'low', // story entries are always student-owned for rank purposes
      has_scene_evidence: hasSceneEvidence,
    });
  });

  if (input.draft_id && input.draft_text) {
    sources.push({
      source_id: input.draft_id,
      source_type: 'essay_draft_version',
      recency_rank: input.story_entries.length + 1,
      project_id: input.subject_entity_id,
      rejected: input.rejected_source_ids.includes(input.draft_id),
      is_cross_project: false,
      is_stale: false,
      contamination_risk: contaminationRisk,
      has_scene_evidence: false, // draft scene evidence comes from story entries
    });
  }

  return sources;
}

// ─────────────────────────────────────────────────────────────
// CONFLICTING EVIDENCE DETECTOR
// Simple heuristic: draft claims success language while story
// notes contain failure / mistake language.
// ─────────────────────────────────────────────────────────────

function detectConflictingEvidence(input: IntakeSessionInput): boolean {
  if (!input.draft_text || input.story_entries.length === 0) return false;
  const draft = input.draft_text.toLowerCase();
  const story = input.story_entries.map((e) => e.text).join(' ').toLowerCase();

  const draftSuccess = /i succeeded|it went well|accomplished|achieved|proud of/i.test(draft);
  const storyFailure = /i failed|didn.t work|went wrong|mistake|mishandled|incorrect/i.test(story);

  return draftSuccess && storyFailure;
}

// ─────────────────────────────────────────────────────────────
// PUBLIC ORCHESTRATOR
// ─────────────────────────────────────────────────────────────

/**
 * Run the full intake intelligence stack and return one canonical
 * IntakeIntelligenceObject.
 *
 * The object is deterministic given the same input. All downstream
 * modules must consume it rather than re-deriving any sub-decision.
 * The orchestration sequence follows the spec in INTAKE-17 exactly.
 */
export async function runIntakeOrchestrator(
  input: IntakeSessionInput
): Promise<IntakeIntelligenceObject> {
  const sessionId = input.session_id;

  // ── Step 1: Signal detection ──────────────────────────────
  const usable_signal = classifyUsableSignal({
    story_entries: input.story_entries,
    draft_text: input.draft_text,
    session_id: sessionId,
  });

  // ── Step 2: Contamination scoring ────────────────────────
  const authorship_signal = classifyContamination({
    story_entries: input.story_entries,
    draft_text: input.draft_text,
    draft_id: input.draft_id,
    session_id: sessionId,
  });

  // ── Step 3: Pattern classification ───────────────────────
  const narrative_pattern = classifyNarrativePattern({
    story_entries: input.story_entries,
    draft_text: input.draft_text,
    session_id: sessionId,
  });

  // ── Step 4: Evidence ranking ──────────────────────────────
  const rankableSources = buildRankableSources(
    input,
    authorship_signal.contamination_risk,
    authorship_signal.student_scene_evidence !== 'absent'
  );
  const trusted_evidence = rankTrustedEvidence({
    sources: rankableSources,
    session_id: sessionId,
  });

  // ── Step 5: Question selection ────────────────────────────
  const evidenceGapSources: IntakeSourceProvenanceRef[] = input.story_entries.map((e) => ({
    source_id: e.id,
    source_type: 'story_entry' as const,
    excerpt: e.text.slice(0, 80),
  }));
  const next_question = selectNextQuestion({
    usable_signal,
    narrative_pattern,
    authorship_signal,
    prior_questions_asked: input.questions_asked,
    evidence_gap_sources: evidenceGapSources,
    session_id: sessionId,
  });

  // ── Step 6: Viability decision ────────────────────────────
  const recommendation_viability = decideViability({
    usable_signal,
    authorship_signal,
    narrative_pattern,
    prior_attempt_count: input.prior_attempt_count,
    questions_asked: input.questions_asked,
    session_id: sessionId,
  });

  // ── Step 7: School context (if present) ───────────────────
  const school_context_use = rankSchoolContextRelevance({
    school_context: input.school_context,
    narrative_pattern,
    session_id: sessionId,
  });

  // ── Step 8: Escalation decision ───────────────────────────
  const conflicting = detectConflictingEvidence(input);
  const escalation = evaluateEscalation({
    usable_signal,
    authorship_signal,
    viability: recommendation_viability,
    prior_attempt_count: input.prior_attempt_count,
    conflicting_evidence: conflicting,
    session_id: sessionId,
  });

  return {
    intake_session_id: input.session_id,
    student_user_id: input.student_user_id,
    subject_entity_id: input.subject_entity_id,
    usable_signal,
    authorship_signal,
    narrative_pattern,
    trusted_evidence,
    next_question,
    recommendation_viability,
    school_context_use,
    escalation,
    created_at: new Date().toISOString(),
    orchestration_version: ORCHESTRATOR_VERSION,
  };
}
