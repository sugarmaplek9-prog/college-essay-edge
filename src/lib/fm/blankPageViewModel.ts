import type {
  BlankPageIntakePayload,
  BlankPageRenderState,
  BlankPageSubmissionState,
  BlankPageViewModel,
} from '@/types/intake';

// Presentation adapter contract:
// - The server payload is authoritative for blank-page semantics.
// - This module may derive render-only state (renderState, ctaLabel,
//   support-field presence, answer-box mode, null-safe display behavior).
// - This module must not reinterpret canonical payload meanings, merge fields
//   with different semantics, or substitute one canonical field for another.
// - Any semantic remapping must be explicit, reviewed, and traceable.

export function toSafeBlankPagePayload(payload: unknown): BlankPageIntakePayload {
  if (isValidBlankPagePayload(payload)) {
    return payload;
  }

  return {
    product_mode: 'blank_page_intake',
    blank_page_mode: 'too_thin_to_recover',
    recovery_question_primary: 'Give one concrete starting point: a specific responsibility, event, or challenge from the last year.',
    recovery_question_secondary: null,
    recovery_confidence: 'low',
    missing_signal_type: 'missing_recoverable_signal',
    why_not_ready_for_direction: 'We need one concrete starting point before direction can be accurate.',
    next_step_type: 'provide_more_concrete_starting_point',
    reassurance_copy: 'This is recoverable. Start with one real situation in plain language.',
    example_answer_shape: 'One sentence naming the situation, one sentence naming what happened.',
    what_good_signal_would_look_like: 'A real event with a person, action, or tension we can work with.',
    topic_candidate: null,
    question_family_primary: null,
    question_family_secondary: null,
    selected_template_id: 'phase3_safe_fallback_ttr_01',
  };
}

export function buildBlankPageViewModel(input: {
  payload: BlankPageIntakePayload;
  answerText: string;
  isSubmitting: boolean;
  submitError: string | null;
}): BlankPageViewModel {
  const payload = toSafeBlankPagePayload(input.payload);
  const hasSecondary = Boolean(payload.recovery_question_secondary && payload.recovery_question_secondary.trim().length > 0);
  const isTooThinFallback = payload.blank_page_mode === 'too_thin_to_recover';

  const submissionState: BlankPageSubmissionState = input.isSubmitting
    ? 'submitting'
    : input.submitError
      ? 'submit_error'
      : input.answerText.trim().length > 0
        ? 'drafting'
        : 'idle';

  const renderState = deriveRenderState({
    isTooThinFallback,
    hasSecondary,
    submissionState,
  });

  return {
    productMode: 'blank_page_intake',
    blankPageMode: payload.blank_page_mode,
    missingSignalType: payload.missing_signal_type,
    // Canonical semantic field preserved directly for traceability.
    whyNotReadyForDirection: payload.why_not_ready_for_direction,
    primaryQuestion: payload.recovery_question_primary,
    secondaryQuestion: hasSecondary ? payload.recovery_question_secondary : null,
    supportFields: {
      // Canonical support fields preserved directly; labels are applied by renderer only.
      reassuranceCopy: payload.reassurance_copy,
      exampleAnswerShape: payload.example_answer_shape,
      whatGoodSignalWouldLookLike: payload.what_good_signal_would_look_like,
    },
    supportFieldPresenceMap: {
      reassuranceCopy: Boolean(payload.reassurance_copy),
      exampleAnswerShape: Boolean(payload.example_answer_shape),
      whatGoodSignalWouldLookLike: Boolean(payload.what_good_signal_would_look_like),
    },
    nextStepType: payload.next_step_type,
    isTooThinFallback,
    recoveryConfidence: payload.recovery_confidence,
    selectedTemplateId: payload.selected_template_id,
    answerBoxMode: isTooThinFallback ? 'restart_concrete_starting_point' : 'bounded_recovery',
    ctaLabel: deriveCtaLabel(payload.next_step_type, isTooThinFallback),
    renderState,
    submissionState,
  };
}

function deriveRenderState(input: {
  isTooThinFallback: boolean;
  hasSecondary: boolean;
  submissionState: BlankPageSubmissionState;
}): BlankPageRenderState {
  if (input.isTooThinFallback) {
    return 'blank_page_too_thin_fallback';
  }

  if (input.submissionState === 'submitting') {
    return 'blank_page_answer_submitting';
  }

  if (input.submissionState === 'submit_error') {
    return 'blank_page_answer_submit_error';
  }

  if (input.submissionState === 'drafting') {
    return 'blank_page_answer_drafting';
  }

  if (input.hasSecondary) {
    return 'blank_page_question_with_secondary';
  }

  return 'blank_page_question_ready';
}

function deriveCtaLabel(nextStepType: BlankPageIntakePayload['next_step_type'], isTooThinFallback: boolean): string {
  if (isTooThinFallback) {
    return 'Continue with one concrete starting point';
  }

  switch (nextStepType) {
    case 'answer_primary_or_secondary_question':
      return 'Continue with this answer';
    case 'answer_primary_question':
      return 'Use this to move forward';
    case 'recovery_stop':
      return 'Submit response';
    case 'provide_more_concrete_starting_point':
      return 'Continue with one concrete starting point';
    default:
      return 'Use this to move forward';
  }
}

function isValidBlankPagePayload(payload: unknown): payload is BlankPageIntakePayload {
  if (!payload || typeof payload !== 'object') {
    return false;
  }

  const candidate = payload as Partial<BlankPageIntakePayload>;
  return (
    candidate.product_mode === 'blank_page_intake'
    && typeof candidate.blank_page_mode === 'string'
    && typeof candidate.recovery_question_primary === 'string'
    && candidate.recovery_question_primary.trim().length > 0
    && typeof candidate.missing_signal_type === 'string'
    && typeof candidate.why_not_ready_for_direction === 'string'
    && typeof candidate.next_step_type === 'string'
    && typeof candidate.selected_template_id === 'string'
  );
}
