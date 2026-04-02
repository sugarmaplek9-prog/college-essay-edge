import { describe, expect, it } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { BlankPageIntakeView } from '@/components/firstMinute/BlankPageIntakeView';
import { buildBlankPageViewModel } from '@/lib/fm/blankPageViewModel';
import type { BlankPageIntakePayload } from '@/types/intake';

const BASE_PAYLOAD: BlankPageIntakePayload = {
  product_mode: 'blank_page_intake',
  blank_page_mode: 'theme_probe',
  recovery_question_primary: 'What specific situation forced this trait to become real?',
  recovery_question_secondary: null,
  recovery_confidence: 'medium',
  missing_signal_type: 'missing_lived_evidence',
  why_not_ready_for_direction: 'Theme present but no event anchor exists.',
  next_step_type: 'answer_primary_question',
  reassurance_copy: 'One concrete event is enough for the next step.',
  example_answer_shape: 'Name the event, who was involved, and what shifted.',
  what_good_signal_would_look_like: 'A real before/after movement in one situation.',
  topic_candidate: null,
  question_family_primary: 'change_question',
  question_family_secondary: null,
  selected_template_id: 'th_change_01__th_conflict_01',
};

describe('BlankPageIntakeView', () => {
  it('renders blank-page branch with primary question and CTA', () => {
    const vm = buildBlankPageViewModel({
      payload: BASE_PAYLOAD,
      answerText: '',
      isSubmitting: false,
      submitError: null,
    });

    const html = renderToStaticMarkup(
      React.createElement(BlankPageIntakeView, {
        viewModel: vm,
        answer: '',
        submitting: false,
        submitError: null,
        onAnswerChange: () => undefined,
        onSubmit: () => undefined,
      })
    );

    expect(html).toContain('data-testid="blank-page-intake-view"');
    expect(html).toContain('data-product-mode="blank_page_intake"');
    expect(html).toContain('data-blank-page-mode="theme_probe"');
    expect(html).toContain('data-missing-signal-type="missing_lived_evidence"');
    expect(html).toContain('data-recovery-confidence="medium"');
    expect(html).toContain('data-selected-template-id="th_change_01__th_conflict_01"');
    expect(html).toContain('blank-page-primary-question');
    expect(html).toContain('Theme present but no event anchor exists.');
    expect(html).toContain('Reassurance');
    expect(html).toContain('One concrete event is enough for the next step.');
    expect(html).toContain('How to answer');
    expect(html).toContain('What strong signal looks like');
    expect(html).toContain('Use this to move forward');
    expect(html).not.toContain('blank-page-secondary-question');
  });

  it('keeps canonical why-not-ready and reassurance semantics separate in render', () => {
    const vm = buildBlankPageViewModel({
      payload: BASE_PAYLOAD,
      answerText: '',
      isSubmitting: false,
      submitError: null,
    });

    const html = renderToStaticMarkup(
      React.createElement(BlankPageIntakeView, {
        viewModel: vm,
        answer: '',
        submitting: false,
        submitError: null,
        onAnswerChange: () => undefined,
        onSubmit: () => undefined,
      })
    );

    expect(html).toContain('data-testid="blank-page-why-not-ready"');
    expect(html).toContain(BASE_PAYLOAD.why_not_ready_for_direction);
    expect(html).toContain('Reassurance');
    expect(html).toContain(BASE_PAYLOAD.reassurance_copy ?? '');
    expect(html).not.toContain('Why this question');
  });

  it('renders no parallel semantic channel outside canonical payload content', () => {
    const vm = buildBlankPageViewModel({
      payload: BASE_PAYLOAD,
      answerText: '',
      isSubmitting: false,
      submitError: null,
    });

    const html = renderToStaticMarkup(
      React.createElement(BlankPageIntakeView, {
        viewModel: vm,
        answer: '',
        submitting: false,
        submitError: null,
        onAnswerChange: () => undefined,
        onSubmit: () => undefined,
      })
    );

    expect(html).toContain(BASE_PAYLOAD.why_not_ready_for_direction);
    expect(html).not.toContain('blank-page-transition-message');
  });

  it('renders secondary question only when present', () => {
    const vm = buildBlankPageViewModel({
      payload: {
        ...BASE_PAYLOAD,
        recovery_question_secondary: 'Where was tension or uncertainty in practice?',
        next_step_type: 'answer_primary_or_secondary_question',
      },
      answerText: '',
      isSubmitting: false,
      submitError: null,
    });

    const html = renderToStaticMarkup(
      React.createElement(BlankPageIntakeView, {
        viewModel: vm,
        answer: '',
        submitting: false,
        submitError: null,
        onAnswerChange: () => undefined,
        onSubmit: () => undefined,
      })
    );

    expect(html).toContain('blank-page-secondary-question');
    expect(html).toContain('Continue with this answer');
  });

  it('renders too-thin fallback distinctly', () => {
    const vm = buildBlankPageViewModel({
      payload: {
        ...BASE_PAYLOAD,
        blank_page_mode: 'too_thin_to_recover',
        missing_signal_type: 'missing_recoverable_signal',
        next_step_type: 'provide_more_concrete_starting_point',
        question_family_primary: null,
        question_family_secondary: null,
      },
      answerText: '',
      isSubmitting: false,
      submitError: null,
    });

    const html = renderToStaticMarkup(
      React.createElement(BlankPageIntakeView, {
        viewModel: vm,
        answer: '',
        submitting: false,
        submitError: null,
        onAnswerChange: () => undefined,
        onSubmit: () => undefined,
      })
    );

    expect(html).toContain('data-render-state="blank_page_too_thin_fallback"');
    expect(html).toContain('bounded restart, not a rejection');
    expect(html).toContain('concrete starting point');
  });
});
