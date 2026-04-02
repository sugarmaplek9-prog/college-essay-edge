import type {
  BlankPagePostAnswerDecision,
  BlankPagePostAnswerRoute,
  RecoveredSignalSummary,
} from '@/types/intake';

export interface BlankPageRecoveryStateInput {
  blank_page_recovery_depth: number;
  blank_page_recovery_exhausted: boolean;
  blank_page_mode: string | null;
}

export function resolveBlankPagePostAnswerRoute(input: {
  answerText: string;
  blankPageState: BlankPageRecoveryStateInput;
}): BlankPagePostAnswerDecision {
  const normalized = normalizeAnswer(input.answerText);
  const depth = Math.max(1, input.blankPageState.blank_page_recovery_depth || 1);
  const exhausted = input.blankPageState.blank_page_recovery_exhausted || depth >= 2;

  const summary = evaluateRecoveredSignal(normalized);
  const score = signalScore(summary);

  let route: BlankPagePostAnswerRoute;
  let reason: string;

  if (!summary.coherent_enough_for_progression || normalized.length < 8) {
    route = exhausted ? 'too_thin_to_recover' : 'clarification';
    reason = exhausted
      ? 'Recovery depth exhausted and answer remains incoherent or too thin.'
      : 'Answer remains too thin to justify blank-page progression.';
  } else if (score >= 4) {
    route = 'direction_light';
    reason = 'Answer recovered concrete signal sufficient for cautious forward movement.';
  } else if (score >= 2 && !exhausted) {
    route = 'second_recovery_question';
    reason = 'Answer improved signal materially; one targeted second recovery question is justified.';
  } else if (score <= 1 && exhausted) {
    route = 'too_thin_to_recover';
    reason = 'Recovery depth exhausted without enough signal for progress.';
  } else {
    route = 'clarification';
    reason = exhausted
      ? 'Second recovery budget exhausted; hand off to clarification with preserved context.'
      : 'Some signal recovered, but not enough for direction; clarification is the safer next route.';
  }

  const recoveryExhausted = exhausted || (depth >= 2 && route !== 'direction_light');

  return {
    post_answer_route: route,
    post_answer_route_reason: reason,
    blank_page_recovery_depth: depth,
    blank_page_recovery_exhausted: recoveryExhausted,
    recovered_signal_summary: summary,
    forwardable_topic_candidate: extractTopicCandidate(normalized),
    forwardable_event_candidate: summary.has_lived_event_anchor ? extractEventCandidate(normalized) : null,
    requires_second_recovery_focus: route === 'second_recovery_question',
  };
}

function evaluateRecoveredSignal(answer: string): RecoveredSignalSummary {
  const hasConcreteMoment = /\b(when|after|during|that day|that night|the moment|in that moment)\b/i.test(answer);
  const hasHingeOrShift = /\b(realized|changed|shifted|stopped|started|understood|turned)\b/i.test(answer);
  const hasLivedEventAnchor = /\b(teacher|coach|friend|parent|team|class|hospital|project|debate|robotics|family|manager)\b/i.test(answer)
    || /\b(said|did|happened|asked|told)\b/i.test(answer);
  const hasPersonalCenter = /\b(i|my|me)\b/i.test(answer) && /\b(cared|felt|responsible|decided|noticed|learned|realized|changed)\b/i.test(answer);
  const hasTensionOrResponsibility = /\b(conflict|tension|pressure|responsib|difficult|friction|uncertain|struggle|burden)\b/i.test(answer);
  const coherentEnough = !/^(n\/a|idk|i don't know|no idea|nothing|\.+)$/i.test(answer.trim()) && answer.trim().length >= 12;

  const parts: string[] = [];
  if (hasConcreteMoment) parts.push('concrete moment present');
  if (hasHingeOrShift) parts.push('hinge/shift present');
  if (hasLivedEventAnchor) parts.push('lived event anchor present');
  if (hasPersonalCenter) parts.push('personal center present');
  if (hasTensionOrResponsibility) parts.push('tension/responsibility present');
  if (!coherentEnough) parts.push('coherence too weak');

  return {
    has_concrete_moment: hasConcreteMoment,
    has_hinge_or_shift: hasHingeOrShift,
    has_lived_event_anchor: hasLivedEventAnchor,
    has_personal_center: hasPersonalCenter,
    has_tension_or_responsibility: hasTensionOrResponsibility,
    coherent_enough_for_progression: coherentEnough,
    summary_text: parts.length > 0 ? parts.join('; ') : 'no meaningful recovered signal detected',
  };
}

function signalScore(summary: RecoveredSignalSummary): number {
  const components = [
    summary.has_concrete_moment,
    summary.has_hinge_or_shift,
    summary.has_lived_event_anchor,
    summary.has_personal_center,
    summary.has_tension_or_responsibility,
  ];
  return components.filter(Boolean).length;
}

function normalizeAnswer(answer: string): string {
  return answer.replace(/\s+/g, ' ').trim();
}

function extractTopicCandidate(answer: string): string | null {
  const m = answer.match(/\b(?:about|in|inside)\s+([a-z0-9\s'’\-]{3,60})/i);
  return m?.[1]?.trim() ?? null;
}

function extractEventCandidate(answer: string): string | null {
  const sentences = answer.split(/(?<=[.!?])\s+/).filter(Boolean);
  const eventSentence = sentences.find((s) => /\b(when|after|during|said|asked|happened|realized|changed)\b/i.test(s));
  return eventSentence?.trim() ?? null;
}
