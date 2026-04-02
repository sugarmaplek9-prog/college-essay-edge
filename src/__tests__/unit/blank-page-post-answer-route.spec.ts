import { describe, expect, it } from 'vitest';
import { resolveBlankPagePostAnswerRoute } from '@/lib/fm/resolveBlankPagePostAnswerRoute';

describe('resolveBlankPagePostAnswerRoute', () => {
  it('routes strong recovered answers to direction_light', () => {
    const decision = resolveBlankPagePostAnswerRoute({
      answerText: 'When my coach asked me to mentor younger players after practice, I realized I cared more about helping them improve than proving myself, and I changed how I showed up every day.',
      blankPageState: {
        blank_page_recovery_depth: 1,
        blank_page_recovery_exhausted: false,
        blank_page_mode: 'activity_probe',
      },
    });

    expect(decision.post_answer_route).toBe('direction_light');
    expect(decision.recovered_signal_summary.has_concrete_moment).toBe(true);
    expect(decision.recovered_signal_summary.has_hinge_or_shift).toBe(true);
  });

  it('routes partial improvement to second_recovery_question when depth allows', () => {
    const decision = resolveBlankPagePostAnswerRoute({
      answerText: 'I kept returning to this project and something felt different, but I have not pinned down the exact scene yet.',
      blankPageState: {
        blank_page_recovery_depth: 1,
        blank_page_recovery_exhausted: false,
        blank_page_mode: 'topic_probe',
      },
    });

    expect(decision.post_answer_route).toBe('second_recovery_question');
    expect(decision.requires_second_recovery_focus).toBe(true);
  });

  it('does not fake-forward weak activity-list ambiguity directly to direction_light', () => {
    const decision = resolveBlankPagePostAnswerRoute({
      answerText: 'I did many activities and none of them feel right yet, and I still cannot name one specific scene.',
      blankPageState: {
        blank_page_recovery_depth: 1,
        blank_page_recovery_exhausted: false,
        blank_page_mode: 'activity_probe',
      },
    });

    expect(decision.post_answer_route).not.toBe('direction_light');
    expect(['clarification', 'second_recovery_question']).toContain(decision.post_answer_route);
  });

  it('routes weak but coherent answers to clarification at depth 1', () => {
    const decision = resolveBlankPagePostAnswerRoute({
      answerText: 'I think it is maybe about leadership but I am still unsure what exactly happened.',
      blankPageState: {
        blank_page_recovery_depth: 1,
        blank_page_recovery_exhausted: false,
        blank_page_mode: 'theme_probe',
      },
    });

    expect(['clarification', 'second_recovery_question']).toContain(decision.post_answer_route);
  });

  it('routes unrecoverable/incoherent answers to too_thin_to_recover when depth exhausted', () => {
    const decision = resolveBlankPagePostAnswerRoute({
      answerText: 'idk',
      blankPageState: {
        blank_page_recovery_depth: 2,
        blank_page_recovery_exhausted: true,
        blank_page_mode: 'blank_page_discovery',
      },
    });

    expect(decision.post_answer_route).toBe('too_thin_to_recover');
    expect(decision.blank_page_recovery_exhausted).toBe(true);
  });

  it('never allows second recovery at depth >= 2', () => {
    const decision = resolveBlankPagePostAnswerRoute({
      answerText: 'I returned to this situation a lot and noticed pressure, but it is still vague.',
      blankPageState: {
        blank_page_recovery_depth: 2,
        blank_page_recovery_exhausted: false,
        blank_page_mode: 'scope_reframe',
      },
    });

    expect(decision.post_answer_route).not.toBe('second_recovery_question');
  });
});
