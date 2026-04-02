import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { BlankPageIntakePayload } from '@/types/intake';

const { buildEventMock, fireFmEventMock } = vi.hoisted(() => ({
  buildEventMock: vi.fn((name: string, screen: string, extra: Record<string, unknown>) => ({
    name,
    payload: {
      at: '2026-03-18T00:00:00.000Z',
      screen,
      ...extra,
    },
  })),
  fireFmEventMock: vi.fn(),
}));

vi.mock('@/lib/fm/events', () => ({
  buildEvent: buildEventMock,
  fireFmEvent: fireFmEventMock,
}));

import {
  emitBlankPageAbandon,
  emitBlankPageAnswerSubmitted,
  emitBlankPageContinue,
  emitBlankPageModeAssigned,
  emitBlankPageQuestionRendered,
  emitBlankPageRouteTransition,
} from '@/lib/telemetry/blankPageEvents';

const PAYLOAD: BlankPageIntakePayload = {
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

describe('blank-page telemetry events', () => {
  beforeEach(() => {
    buildEventMock.mockClear();
    fireFmEventMock.mockClear();
  });

  it('emits lane assignment with mode and trigger signal metadata', () => {
    emitBlankPageModeAssigned({
      blankPageMode: 'topic_probe',
      productMode: 'blank_page_intake',
      route: 'needs_structured_blank_page_intake',
      confidence: 'medium',
      triggerSignals: ['topic_only_intent'],
    });

    expect(buildEventMock).toHaveBeenCalledWith(
      'blank_page_mode_assigned',
      'start',
      expect.objectContaining({
        product_mode: 'blank_page_intake',
        blank_page_mode: 'topic_probe',
        route: 'needs_structured_blank_page_intake',
        source_type: 'runtime',
      })
    );
    expect(fireFmEventMock).toHaveBeenCalledTimes(1);
  });

  it('emits question rendered with required diagnostic fields', () => {
    emitBlankPageQuestionRendered({
      payload: PAYLOAD,
      recoveryDepth: 1,
      supportFieldPresenceMap: {
        reassuranceCopy: true,
        exampleAnswerShape: true,
        whatGoodSignalWouldLookLike: true,
      },
    });

    expect(buildEventMock).toHaveBeenCalledWith(
      'blank_page_question_rendered',
      'question',
      expect.objectContaining({
        blank_page_mode: 'topic_probe',
        missing_signal_type: 'missing_moment',
        next_step_type: 'answer_primary_or_secondary_question',
        question_family_primary: 'moment_question',
        selected_template_id: 'tp_moment_01__tp_conflict_01',
        blank_page_recovery_depth: 1,
      })
    );
    expect(fireFmEventMock).toHaveBeenCalledTimes(1);
  });

  it('emits answer submitted and route transition events with depth/exhaustion fields', () => {
    emitBlankPageAnswerSubmitted({
      payload: PAYLOAD,
      recoveryDepth: 2,
      answerWordCount: 24,
      recoveryExhausted: false,
    });

    emitBlankPageRouteTransition({
      route: 'direction_light',
      payload: PAYLOAD,
      recoveryDepth: 2,
      recoveryExhausted: false,
      routeReason: 'Recovered enough concrete signal for cautious forward movement.',
    });

    expect(buildEventMock).toHaveBeenNthCalledWith(
      1,
      'blank_page_answer_submitted',
      'question',
      expect.objectContaining({
        blank_page_recovery_depth: 2,
        blank_page_recovery_exhausted: false,
        input_word_count: 24,
      })
    );

    expect(buildEventMock).toHaveBeenNthCalledWith(
      2,
      'blank_page_to_direction_conversion',
      'question',
      expect.objectContaining({
        post_answer_route: 'direction_light',
        blank_page_recovery_depth: 2,
        blank_page_recovery_exhausted: false,
      })
    );

    expect(fireFmEventMock).toHaveBeenCalledTimes(2);
  });

  it('emits abandon and continue lifecycle events', () => {
    emitBlankPageAbandon({
      payload: PAYLOAD,
      recoveryDepth: 1,
      hadDraft: true,
    });

    emitBlankPageContinue({
      route: 'clarification',
      payload: PAYLOAD,
      recoveryDepth: 2,
    });

    expect(buildEventMock).toHaveBeenNthCalledWith(
      1,
      'blank_page_abandon',
      'question',
      expect.objectContaining({
        blank_page_recovery_depth: 1,
        route: 'had_draft',
      })
    );

    expect(buildEventMock).toHaveBeenNthCalledWith(
      2,
      'blank_page_continue',
      'question',
      expect.objectContaining({
        post_answer_route: 'clarification',
        blank_page_recovery_depth: 2,
      })
    );
    expect(fireFmEventMock).toHaveBeenCalledTimes(2);
  });
});
