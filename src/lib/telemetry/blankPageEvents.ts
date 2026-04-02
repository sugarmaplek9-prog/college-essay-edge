import { buildEvent, fireFmEvent, type FmEventName, type FmEventPayload } from '@/lib/fm/events';
import type { BlankPageIntakePayload } from '@/types/intake';

function emit(name: FmEventName, screen: string, extra: Omit<FmEventPayload, 'at' | 'screen'>): void {
  const event = buildEvent(name, screen, extra);
  fireFmEvent(event.name, event.payload);
}

export function emitBlankPageModeAssigned(input: {
  blankPageMode: string | null;
  productMode: string;
  route: string;
  confidence: string | null;
  triggerSignals: string[];
}): void {
  emit('blank_page_mode_assigned', 'start', {
    product_mode: input.productMode,
    blank_page_mode: input.blankPageMode ?? 'unknown',
    route: input.route,
    source_type: 'runtime',
    viability: input.confidence ?? 'unknown',
    pattern: input.triggerSignals.join('|') || 'none',
  });
}

export function emitBlankPageQuestionRendered(input: {
  payload: BlankPageIntakePayload;
  recoveryDepth: number;
  supportFieldPresenceMap: {
    reassuranceCopy: boolean;
    exampleAnswerShape: boolean;
    whatGoodSignalWouldLookLike: boolean;
  };
}): void {
  emit('blank_page_question_rendered', 'question', {
    product_mode: 'blank_page_intake',
    blank_page_mode: input.payload.blank_page_mode,
    missing_signal_type: input.payload.missing_signal_type,
    next_step_type: input.payload.next_step_type,
    question_family_primary: input.payload.question_family_primary,
    question_family_secondary: input.payload.question_family_secondary,
    selected_template_id: input.payload.selected_template_id,
    blank_page_recovery_depth: input.recoveryDepth,
    route: `support_fields:${serializeSupportFieldPresence(input.supportFieldPresenceMap)}`,
  });
}

export function emitBlankPageAnswerSubmitted(input: {
  payload: BlankPageIntakePayload;
  recoveryDepth: number;
  answerWordCount: number;
  recoveryExhausted: boolean;
}): void {
  emit('blank_page_answer_submitted', 'question', {
    product_mode: 'blank_page_intake',
    blank_page_mode: input.payload.blank_page_mode,
    missing_signal_type: input.payload.missing_signal_type,
    next_step_type: input.payload.next_step_type,
    question_family_primary: input.payload.question_family_primary,
    question_family_secondary: input.payload.question_family_secondary,
    selected_template_id: input.payload.selected_template_id,
    blank_page_recovery_depth: input.recoveryDepth,
    blank_page_recovery_exhausted: input.recoveryExhausted,
    input_word_count: input.answerWordCount,
  });
}

export function emitBlankPageRouteTransition(input: {
  route: 'direction_light' | 'second_recovery_question' | 'clarification' | 'too_thin_to_recover';
  payload: BlankPageIntakePayload;
  recoveryDepth: number;
  recoveryExhausted: boolean;
  routeReason: string;
}): void {
  const eventName: FmEventName =
    input.route === 'direction_light'
      ? 'blank_page_to_direction_conversion'
      : input.route === 'second_recovery_question'
        ? 'blank_page_to_second_question'
        : input.route === 'clarification'
          ? 'blank_page_to_clarification'
          : 'blank_page_to_block';

  emit(eventName, 'question', {
    product_mode: 'blank_page_intake',
    blank_page_mode: input.payload.blank_page_mode,
    post_answer_route: input.route,
    blank_page_recovery_depth: input.recoveryDepth,
    blank_page_recovery_exhausted: input.recoveryExhausted,
    question_family_primary: input.payload.question_family_primary,
    question_family_secondary: input.payload.question_family_secondary,
    selected_template_id: input.payload.selected_template_id,
    route: input.routeReason.slice(0, 180),
  });
}

export function emitBlankPageAbandon(input: {
  payload: BlankPageIntakePayload;
  recoveryDepth: number;
  hadDraft: boolean;
}): void {
  emit('blank_page_abandon', 'question', {
    product_mode: 'blank_page_intake',
    blank_page_mode: input.payload.blank_page_mode,
    blank_page_recovery_depth: input.recoveryDepth,
    route: input.hadDraft ? 'had_draft' : 'no_draft',
  });
}

export function emitBlankPageContinue(input: {
  route: 'direction_light' | 'clarification' | 'too_thin_to_recover';
  payload: BlankPageIntakePayload;
  recoveryDepth: number;
}): void {
  emit('blank_page_continue', 'question', {
    product_mode: input.route === 'direction_light' ? 'direction_light' : 'blank_page_intake',
    blank_page_mode: input.payload.blank_page_mode,
    post_answer_route: input.route,
    blank_page_recovery_depth: input.recoveryDepth,
  });
}

function serializeSupportFieldPresence(input: {
  reassuranceCopy: boolean;
  exampleAnswerShape: boolean;
  whatGoodSignalWouldLookLike: boolean;
}): string {
  return [
    `reassurance:${input.reassuranceCopy ? 1 : 0}`,
    `example:${input.exampleAnswerShape ? 1 : 0}`,
    `signal:${input.whatGoodSignalWouldLookLike ? 1 : 0}`,
  ].join(',');
}
