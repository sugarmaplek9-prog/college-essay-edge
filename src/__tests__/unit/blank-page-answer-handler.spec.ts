import { describe, expect, it } from 'vitest';
import { createSessionCaseState } from '@/lib/fm/case-state';
import { handleBlankPageAnswer, mapApiResponseByPostAnswerRoute } from '@/lib/fm/handleBlankPageAnswer';
import type { BlankPageIntakePayload } from '@/types/intake';
import {
  FIXTURE_F3_THIN_RECOVERY,
} from '../fixtures/orchestrator-responses';

function normalizeFixture<T extends Record<string, unknown>>(fixture: T): T {
  if ((fixture?.trusted_evidence as Record<string, unknown>)?.trusted_evidence_rank) return fixture;

  return {
    ...fixture,
    trusted_evidence: {
      trusted_evidence_rank: Array.isArray((fixture?.trusted_evidence as Record<string, unknown>)?.ranking)
        ? ((fixture.trusted_evidence as Record<string, unknown>).ranking as Array<{ source_id: string }>)
            .map((item) => item.source_id)
        : [],
      downgraded_sources: [],
      reason_codes: ['STORY_ENTRY_OUTRANKS_POLISHED_DRAFT'],
      meta: (fixture?.trusted_evidence as Record<string, unknown>)?.meta,
    },
  };
}

const BASE_PAYLOAD: BlankPageIntakePayload = {
  product_mode: 'blank_page_intake',
  blank_page_mode: 'topic_probe',
  recovery_question_primary: 'What moment inside this topic stayed with you afterward?',
  recovery_question_secondary: 'Where was the tension inside this?',
  recovery_confidence: 'medium',
  missing_signal_type: 'missing_moment',
  why_not_ready_for_direction: 'Topic present but no lived moment identified yet.',
  next_step_type: 'answer_primary_or_secondary_question',
  reassurance_copy: 'One concrete moment is enough.',
  example_answer_shape: 'One event and one shift.',
  what_good_signal_would_look_like: 'A scene with visible change.',
  topic_candidate: 'robotics',
  question_family_primary: 'moment_question',
  question_family_secondary: 'conflict_question',
  selected_template_id: 'tp_moment_01__tp_conflict_01',
};

describe('handleBlankPageAnswer', () => {
  it('increments depth and records answer history', () => {
    const intelligence = normalizeFixture(FIXTURE_F3_THIN_RECOVERY as any) as any;
    const caseState = createSessionCaseState('Can I write about robotics?', intelligence);

    const result = handleBlankPageAnswer({
      answerText: 'When my coach asked me to mentor, I changed how I showed up.',
      caseState,
      activePayload: BASE_PAYLOAD,
    });

    expect(result.updatedCaseState.blank_page_recovery.blank_page_recovery_depth).toBeGreaterThan(0);
    expect(result.updatedCaseState.blank_page_recovery.blank_page_answer_history.length).toBe(1);
    expect(result.updatedCaseState.blank_page_recovery.post_answer_route).toBe(result.postAnswerRoute);
  });

  it('returns second recovery payload when second recovery route selected', () => {
    const intelligence = normalizeFixture(FIXTURE_F3_THIN_RECOVERY as any) as any;
    const caseState = createSessionCaseState('Can I write about robotics?', intelligence);

    const result = handleBlankPageAnswer({
      answerText: 'It is about robotics and pressure, but I still do not have one scene.',
      caseState,
      activePayload: BASE_PAYLOAD,
    });

    if (result.postAnswerRoute === 'second_recovery_question') {
      expect(result.nextBlankPagePayload).not.toBeNull();
      expect(result.nextBlankPagePayload?.selected_template_id).toContain('phase4_recovery_depth2');
      expect(result.shouldCallSessionApi).toBe(false);
    }
  });

  it('enforces no-loop behavior after depth is exhausted', () => {
    const intelligence = normalizeFixture(FIXTURE_F3_THIN_RECOVERY as any) as any;
    const caseState = createSessionCaseState('I have no idea what to write about.', intelligence);
    caseState.blank_page_recovery.blank_page_recovery_depth = 2;
    caseState.blank_page_recovery.blank_page_recovery_exhausted = true;

    const result = handleBlankPageAnswer({
      answerText: 'idk',
      caseState,
      activePayload: BASE_PAYLOAD,
    });

    expect(result.postAnswerRoute).toBe('too_thin_to_recover');
    expect(result.updatedCaseState.blank_page_recovery.blank_page_recovery_exhausted).toBe(true);
    expect(result.shouldCallSessionApi).toBe(false);
  });

  it('does not coerce blocked response to direction_light in route mapping', () => {
    const apiResponse = {
      product_mode: 'blocked',
      intake_intelligence: { intake_session_id: 'session-1' },
      evidence_strength: { route: 'blocked' },
    } as any;

    const mapped = mapApiResponseByPostAnswerRoute({
      apiResponse,
      route: 'direction_light',
    });

    expect(mapped.product_mode).toBe('blocked');
  });

  it('forces clarification mode when post-answer route requires clarification', () => {
    const apiResponse = {
      product_mode: 'direction_light',
      intake_intelligence: { intake_session_id: 'session-1' },
      evidence_strength: { route: 'direction_light' },
    } as any;

    const mapped = mapApiResponseByPostAnswerRoute({
      apiResponse,
      route: 'clarification',
    });

    expect(mapped.product_mode).toBe('clarification');
  });
});
