import type {
  BlankPageIntakePayload,
  BlankPagePostAnswerDecision,
  BlankPageQuestionFamily,
  SessionApiResponse,
} from '@/types/intake';
import {
  applySharpeningAnswer,
  normalizeStudentText,
  type CaseQuestionRecord,
  type SessionCaseState,
} from '@/lib/fm/case-state';
import { resolveBlankPagePostAnswerRoute } from '@/lib/fm/resolveBlankPagePostAnswerRoute';
import { buildBlankPageRouteAuditRecord, logBlankPageRouteAudit } from '@/lib/fm/blankPageRouteAudit';

export interface HandleBlankPageAnswerResult {
  updatedCaseState: SessionCaseState;
  decision: BlankPagePostAnswerDecision;
  nextBlankPagePayload: BlankPageIntakePayload | null;
  postAnswerRoute: BlankPagePostAnswerDecision['post_answer_route'];
  shouldCallSessionApi: boolean;
  continuationBody: {
    raw_input: string;
    session_id: string;
    prior_attempt_count: number;
    questions_asked: CaseQuestionRecord['question_type'][];
  };
}

export function handleBlankPageAnswer(input: {
  answerText: string;
  caseState: SessionCaseState;
  activePayload: BlankPageIntakePayload;
}): HandleBlankPageAnswerResult {
  const normalizedAnswer = normalizeStudentText(input.answerText);
  const activeDepth = Math.max(1, input.caseState.blank_page_recovery.blank_page_recovery_depth || 1);

  const decision = resolveBlankPagePostAnswerRoute({
    answerText: normalizedAnswer,
    blankPageState: {
      blank_page_recovery_depth: activeDepth,
      blank_page_recovery_exhausted: input.caseState.blank_page_recovery.blank_page_recovery_exhausted,
      blank_page_mode: input.activePayload.blank_page_mode,
    },
  });

  const updated = applySharpeningAnswer(input.caseState, normalizedAnswer);
  const nextDepth = Math.min(2, activeDepth + 1);

  const withRecoveryState: SessionCaseState = {
    ...updated,
    blank_page_recovery: {
      ...updated.blank_page_recovery,
      blank_page_recovery_depth: nextDepth,
      blank_page_recovery_exhausted: decision.blank_page_recovery_exhausted,
      blank_page_previous_mode: input.activePayload.blank_page_mode,
      blank_page_previous_question_family: input.activePayload.question_family_primary,
      blank_page_previous_route_after_answer: decision.post_answer_route,
      post_answer_route: decision.post_answer_route,
      post_answer_route_reason: decision.post_answer_route_reason,
      recovered_signal_summary: decision.recovered_signal_summary.summary_text,
      blank_page_answer_history: [
        ...updated.blank_page_recovery.blank_page_answer_history,
        {
          asked_question: input.activePayload.recovery_question_primary,
          answer_text: normalizedAnswer,
          route_after_answer: decision.post_answer_route,
          route_reason: decision.post_answer_route_reason,
          answered_at: new Date().toISOString(),
        },
      ],
    },
  };

  const shouldCallSessionApi = decision.post_answer_route === 'direction_light' || decision.post_answer_route === 'clarification';

  logBlankPageRouteAudit(
    buildBlankPageRouteAuditRecord({
      sessionId: withRecoveryState.session_id,
      payload: input.activePayload,
      decision,
      caseState: withRecoveryState,
    })
  );

  return {
    updatedCaseState: withRecoveryState,
    decision,
    nextBlankPagePayload: buildNextBlankPagePayload(input.activePayload, decision),
    postAnswerRoute: decision.post_answer_route,
    shouldCallSessionApi,
    continuationBody: {
      raw_input: withRecoveryState.raw_inputs.map((item) => item.text).join(' '),
      session_id: withRecoveryState.session_id,
      prior_attempt_count: withRecoveryState.prior_questions_asked.length,
      questions_asked: withRecoveryState.prior_questions_asked.map((q) => q.question_type),
    },
  };
}

function buildNextBlankPagePayload(
  current: BlankPageIntakePayload,
  decision: BlankPagePostAnswerDecision
): BlankPageIntakePayload | null {
  if (decision.post_answer_route === 'too_thin_to_recover') {
    return {
      ...current,
      blank_page_mode: 'too_thin_to_recover',
      recovery_question_primary: 'Give one concrete starting point: a specific responsibility, event, or challenge from the last year.',
      recovery_question_secondary: null,
      recovery_confidence: 'low',
      missing_signal_type: 'missing_recoverable_signal',
      why_not_ready_for_direction: decision.post_answer_route_reason,
      next_step_type: 'provide_more_concrete_starting_point',
      reassurance_copy: 'This is still recoverable with one concrete event in plain language.',
      example_answer_shape: 'One sentence naming the event, one sentence naming what happened.',
      what_good_signal_would_look_like: 'A real moment with a clear action, person, or tension.',
      question_family_primary: null,
      question_family_secondary: null,
      selected_template_id: `${current.selected_template_id}__phase4_too_thin`,
    };
  }

  if (decision.post_answer_route !== 'second_recovery_question') {
    return null;
  }

  const followup = pickFollowupQuestion(current, decision);

  return {
    ...current,
    recovery_question_primary: followup.primary,
    recovery_question_secondary: null,
    recovery_confidence: 'medium',
    why_not_ready_for_direction: decision.post_answer_route_reason,
    next_step_type: 'answer_primary_question',
    example_answer_shape: 'Answer with one concrete scene and what changed in that scene.',
    what_good_signal_would_look_like: 'A single event that clearly shows what shifted for you.',
    question_family_primary: followup.family,
    question_family_secondary: null,
    selected_template_id: `${current.selected_template_id}__phase4_recovery_depth2`,
  };
}

function pickFollowupQuestion(
  current: BlankPageIntakePayload,
  decision: BlankPagePostAnswerDecision
): { primary: string; family: BlankPageQuestionFamily } {
  if (current.recovery_question_secondary) {
    return {
      primary: current.recovery_question_secondary,
      family: current.question_family_secondary ?? current.question_family_primary ?? 'moment_question',
    };
  }

  if (!decision.recovered_signal_summary.has_concrete_moment) {
    return {
      primary: 'Name one specific moment in this story where something changed for you.',
      family: 'moment_question',
    };
  }

  if (!decision.recovered_signal_summary.has_hinge_or_shift) {
    return {
      primary: 'What was the exact turning point where this became personally meaningful?',
      family: 'hinge_question',
    };
  }

  if (!decision.recovered_signal_summary.has_personal_center) {
    return {
      primary: 'What does this reveal about you beyond the situation itself?',
      family: 'person_over_task_question',
    };
  }

  return {
    primary: 'Where was the real tension or responsibility, and how did you respond?',
    family: 'conflict_question',
  };
}

export function mapApiResponseByPostAnswerRoute(input: {
  apiResponse: SessionApiResponse;
  route: BlankPagePostAnswerDecision['post_answer_route'];
}): SessionApiResponse {
  // Never coerce server product mode into forward progression.
  // Server response is authoritative for non-blank-page routes.
  if (input.route === 'direction_light') {
    return input.apiResponse;
  }

  if (input.route === 'clarification') {
    return {
      ...input.apiResponse,
      product_mode: 'clarification',
    };
  }

  return input.apiResponse;
}
