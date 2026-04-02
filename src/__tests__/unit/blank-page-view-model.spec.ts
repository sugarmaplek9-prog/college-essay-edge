import { describe, expect, it } from 'vitest';
import { buildBlankPageViewModel, toSafeBlankPagePayload } from '@/lib/fm/blankPageViewModel';
import type { BlankPageIntakePayload } from '@/types/intake';

const BASE_PAYLOAD: BlankPageIntakePayload = {
  product_mode: 'blank_page_intake',
  blank_page_mode: 'topic_probe',
  recovery_question_primary: 'What moment inside this topic stayed with you afterward?',
  recovery_question_secondary: 'Where did tension or uncertainty show up?',
  recovery_confidence: 'medium',
  missing_signal_type: 'missing_moment',
  why_not_ready_for_direction: 'Topic present but no lived moment identified yet.',
  next_step_type: 'answer_primary_or_secondary_question',
  reassurance_copy: 'This is recoverable with one clear moment.',
  example_answer_shape: 'One scene, one shift, one sentence of meaning.',
  what_good_signal_would_look_like: 'A specific event with clear before/after movement.',
  topic_candidate: 'gardening',
  question_family_primary: 'moment_question',
  question_family_secondary: 'conflict_question',
  selected_template_id: 'tp_moment_01__tp_conflict_01',
};

describe('blankPageViewModel', () => {
  it('maps payload to view model with explicit secondary-question state', () => {
    const vm = buildBlankPageViewModel({
      payload: BASE_PAYLOAD,
      answerText: '',
      isSubmitting: false,
      submitError: null,
    });

    expect(vm.productMode).toBe('blank_page_intake');
    expect(vm.blankPageMode).toBe('topic_probe');
    expect(vm.missingSignalType).toBe(BASE_PAYLOAD.missing_signal_type);
  expect(vm.whyNotReadyForDirection).toBe(BASE_PAYLOAD.why_not_ready_for_direction);
    expect(vm.primaryQuestion).toBe(BASE_PAYLOAD.recovery_question_primary);
    expect(vm.secondaryQuestion).toBe(BASE_PAYLOAD.recovery_question_secondary);
    expect(vm.nextStepType).toBe(BASE_PAYLOAD.next_step_type);
    expect(vm.recoveryConfidence).toBe(BASE_PAYLOAD.recovery_confidence);
    expect(vm.selectedTemplateId).toBe(BASE_PAYLOAD.selected_template_id);
    expect(vm.supportFields.reassuranceCopy).toBe(BASE_PAYLOAD.reassurance_copy);
    expect(vm.supportFields.exampleAnswerShape).toBe(BASE_PAYLOAD.example_answer_shape);
    expect(vm.supportFields.whatGoodSignalWouldLookLike).toBe(BASE_PAYLOAD.what_good_signal_would_look_like);
    expect(vm.renderState).toBe('blank_page_question_with_secondary');
    expect(vm.ctaLabel).toBe('Continue with this answer');
    expect(vm.supportFieldPresenceMap.reassuranceCopy).toBe(true);
    expect(vm.supportFieldPresenceMap.exampleAnswerShape).toBe(true);
    expect(vm.supportFieldPresenceMap.whatGoodSignalWouldLookLike).toBe(true);
  });

  it('switches render state to drafting/submitting/error explicitly', () => {
    const drafting = buildBlankPageViewModel({
      payload: BASE_PAYLOAD,
      answerText: 'One real moment.',
      isSubmitting: false,
      submitError: null,
    });
    expect(drafting.renderState).toBe('blank_page_answer_drafting');

    const submitting = buildBlankPageViewModel({
      payload: BASE_PAYLOAD,
      answerText: 'One real moment.',
      isSubmitting: true,
      submitError: null,
    });
    expect(submitting.renderState).toBe('blank_page_answer_submitting');

    const errored = buildBlankPageViewModel({
      payload: BASE_PAYLOAD,
      answerText: 'One real moment.',
      isSubmitting: false,
      submitError: 'retry',
    });
    expect(errored.renderState).toBe('blank_page_answer_submit_error');
  });

  it('handles too_thin fallback distinctly', () => {
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

    expect(vm.isTooThinFallback).toBe(true);
    expect(vm.renderState).toBe('blank_page_too_thin_fallback');
    expect(vm.answerBoxMode).toBe('restart_concrete_starting_point');
    expect(vm.ctaLabel).toContain('concrete starting point');
  });

  it('fails closed to safe payload when malformed input arrives', () => {
    const safe = toSafeBlankPagePayload({ product_mode: 'blank_page_intake' });
    expect(safe.blank_page_mode).toBe('too_thin_to_recover');
    expect(safe.missing_signal_type).toBe('missing_recoverable_signal');
    expect(safe.recovery_question_primary.length).toBeGreaterThan(20);
  });
});
