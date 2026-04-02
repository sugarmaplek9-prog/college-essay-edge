import { describe, expect, it } from 'vitest';
import {
  applySharpeningAnswer,
  appendContinuationNotes,
  buildCaseTranscript,
  createSessionCaseState,
  markQuestionSkipped,
  mergeContinuationText,
  normalizeStudentText,
  shouldGateToClarification,
  syncCaseStateWithIntelligence,
} from '@/lib/fm/case-state';
import {
  FIXTURE_F1_STRONG_CASE,
  FIXTURE_F3_THIN_RECOVERY,
} from '../fixtures/orchestrator-responses';

function normalizeFixture<T extends Record<string, any>>(fixture: T): T {
  if (fixture?.trusted_evidence?.trusted_evidence_rank) return fixture;

  return {
    ...fixture,
    trusted_evidence: {
      trusted_evidence_rank: Array.isArray(fixture?.trusted_evidence?.ranking)
        ? fixture.trusted_evidence.ranking.map((item: { source_id: string }) => item.source_id)
        : [],
      downgraded_sources: [],
      reason_codes: ['STORY_ENTRY_OUTRANKS_POLISHED_DRAFT'],
      meta: fixture?.trusted_evidence?.meta,
    },
  };
}

describe('session case-state guidance', () => {
  it('normalizes user input without rewriting meaning', () => {
    const normalized = normalizeStudentText('i  learned  a lot ,and it changed how i help.');
    expect(normalized).toBe('I learned a lot, and it changed how I help.');
  });

  it('builds a live case state and generates a dynamic sharpening question from missing detail', () => {
    const state = createSessionCaseState(
      'I like sports but I am not great at them.',
      normalizeFixture(FIXTURE_F3_THIN_RECOVERY as any)
    );

    expect(state.current_question).not.toBeNull();
    expect(state.current_question?.question_text.toLowerCase()).not.toContain('what changed for you after the thing');
    expect(state.missing_details.length).toBeGreaterThan(0);
    expect(state.prior_questions_asked.length).toBe(0);
  });

  it('updates the case state after a sharpening answer and changes downstream guidance surface', () => {
    const initial = createSessionCaseState(
      'I like sports but I am not great at them.',
      normalizeFixture(FIXTURE_F3_THIN_RECOVERY as any)
    );

    const updated = applySharpeningAnswer(
      initial,
      'My coach asked me to help younger players after practice, and I realized I was better at noticing what they needed than proving myself on the field.'
    );

    expect(updated.raw_inputs.length).toBe(2);
    expect(updated.prior_questions_asked.length).toBe(1);
    expect(updated.extracted.turning_points.length).toBeGreaterThan(0);
    expect(updated.extracted.reflections.length).toBeGreaterThan(0);
  });

  it('merges appended continuation notes without losing the original transcript', () => {
    const initial = createSessionCaseState(
      'I spent three summers volunteering at the hospital.',
      normalizeFixture(FIXTURE_F1_STRONG_CASE as any)
    );

    const merged = mergeContinuationText(
      buildCaseTranscript(initial),
      'I spent three summers volunteering at the hospital. In my third summer, a nurse pulled me aside.'
    );

    const continued = appendContinuationNotes(initial, merged.appendedText ?? '');

    expect(merged.appendedText).toContain('In my third summer');
    expect(continued.raw_inputs.length).toBe(2);
    expect(buildCaseTranscript(continued)).toContain('I spent three summers volunteering at the hospital.');
    expect(buildCaseTranscript(continued)).toContain('In my third summer, a nurse pulled me aside.');
  });

  it('syncs a continued case with refreshed intelligence while preserving the same session id', () => {
    const intake = normalizeFixture(FIXTURE_F3_THIN_RECOVERY as any);
    const initial = createSessionCaseState('I like sports and teamwork.', intake);
    const updated = applySharpeningAnswer(initial, 'My coach asked me to mentor younger players after practice.');
    const synced = syncCaseStateWithIntelligence(updated, {
      ...normalizeFixture(FIXTURE_F1_STRONG_CASE as any),
      intake_session_id: initial.session_id,
    });

    expect(synced.session_id).toBe(initial.session_id);
    expect(synced.raw_inputs.length).toBe(updated.raw_inputs.length);
  });

  it('avoids semantically duplicate sharpening questions after a skip', () => {
    const initial = createSessionCaseState(
      'I spent three summers volunteering at the hospital, but I still do not know what the real point is.',
      normalizeFixture(FIXTURE_F1_STRONG_CASE as any)
    );

    const firstQuestion = initial.current_question?.question_text;
    const skipped = markQuestionSkipped(initial);
    const nextQuestion = skipped.current_question?.question_text ?? null;

    if (nextQuestion) {
      expect(nextQuestion).not.toBe(firstQuestion);
    }
  });

  it('gates weak-input cases into clarification before full direction output', () => {
    const intake = normalizeFixture(FIXTURE_F3_THIN_RECOVERY as any);
    const state = createSessionCaseState('I like sports but I am not great at them.', intake);

    expect(shouldGateToClarification(intake, state)).toBe(true);
  });

  it('clears the gate for strong evidence cases', () => {
    const intake = normalizeFixture(FIXTURE_F1_STRONG_CASE as any);
    const state = createSessionCaseState(
      'I spent three summers volunteering at the hospital, and I thought I was helping. In my third summer, a nurse pulled me aside and said I was just getting in the way. That conversation changed how I think about service, so the next morning I asked how to help the team better.',
      intake
    );

    expect(shouldGateToClarification(intake, state)).toBe(false);
  });
});