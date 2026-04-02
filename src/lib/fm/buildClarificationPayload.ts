// =============================================================
// src/lib/fm/buildClarificationPayload.ts
//
// Builds the ClarificationPayload shown when product_mode
// is 'clarification'.
//
// Rules:
//   - State the possible angle tentatively, not definitively
//   - Explain what is still missing in plain English
//   - Include 1–3 case-specific missing-detail descriptions
//   - Always provide a dynamic primaryQuestion
//   - Never include a full direction payload
// =============================================================

import type { IntakeIntelligenceObject, NarrativePattern, ClarificationPayload } from '@/types/intake';
import type { EvidenceFeatures } from '@/lib/ml/evidenceStrength/features';
import type { SessionCaseState } from '@/lib/fm/case-state';
import { getTopMissingDetail, rankMissingDetails, type MissingDetailTarget } from '@/lib/fm/missingDetailRanker';
import { generateSharpeningQuestion } from '@/lib/fm/questionComposer';
import { isDuplicateQuestion } from '@/lib/fm/questionDeduper';
import { extractNarrativeSignals } from '@/lib/fm/narrative-signals';
import { detectMissingSignal, type MissingSignalTarget } from '@/lib/fm/missing-signal-detector';
import { generateClarificationQuestion } from '@/lib/fm/clarification-question';

// =============================================================
// Plain-English angle labels (clarification mode — tentative)
// =============================================================

const CLARIFICATION_ANGLE_LABEL: Record<NarrativePattern, string> = {
  self_correction_arc:          'This may work best as a story about getting corrected and updating your standard.',
  identity_shift:               'This may work best as a story about how you changed.',
  responsibility_shift:         'This may work best as a story about when responsibility got real.',
  failure_reinterpretation:     'This may work best as a story about what the setback taught you.',
  conflict_reframe:             'This may work best as a story about what you understood after the conflict.',
  usefulness_vs_intention:      'This may work best as a story about trying to help vs actually helping.',
  competence_vs_responsibility: 'This may work best as a story about can-do vs should-do.',
  unknown:                      'There may be a real story here, but we need one more concrete detail to find it.',
};

// =============================================================
// Why-not-locked messages per missing detail target
// =============================================================

const WHY_NOT_LOCKED: Record<string, string> = {
  scene_line:             'I still need to know exactly where this happened and what was said or done first.',
  conflict_cause:         'I still don\'t know what triggered the tension or what caused the conflict.',
  turning_point:          'I still don\'t know the exact moment things shifted or what made you see it differently.',
  other_person_reaction:  'I still don\'t know how the other person responded or what they said.',
  internal_realization:   'I still don\'t know what clicked for you internally — what you understood that you hadn\'t before.',
  repair_action:          'I still don\'t know what you actually did differently afterward.',
  consequence:            'I still don\'t know what changed in your behavior after this moment.',
};

const MISSING_DETAIL_LABEL: Record<string, string> = {
  scene_line:             'the exact setting and what happened first',
  conflict_cause:         'what triggered the conflict or correction',
  turning_point:          'the precise moment of realization',
  other_person_reaction:  'how the other person actually responded',
  internal_realization:   'what clicked internally in that moment',
  repair_action:          'what you did differently right after',
  consequence:            'what changed in your behavior afterward',
};

function deriveLowSignalRecoveryDebug(
  rawInput: string | undefined,
  features: EvidenceFeatures
): ClarificationPayload['lowSignalRecoveryDebug'] {
  if (!rawInput) return undefined;

  const lower = rawInput.trim().toLowerCase();
  const blankPageRequest =
    features.signalStrength === 0 &&
    features.sceneSpecificityScore <= 0.18 &&
    /\b(no\s+idea|don['’]?t\s+know|do\s+not\s+know|not\s+sure)\b[\s\S]{0,50}\b(what\s+to\s+write\s+about|for\s+my\s+college\s+essay|college\s+essay|personal\s+statement)\b/i.test(lower);

  const topicViabilityScopeQuestion =
    features.signalStrength === 0 &&
    /\b(write|writing)\s+about\b/i.test(lower) &&
    /\b(too\s+common|too\s+clich[eé]|bad|risky|good\s+enough|work)\b/i.test(lower);

  if (!blankPageRequest && !topicViabilityScopeQuestion) return undefined;

  return {
    recoverable_low_signal_lane_activated: true,
    low_signal_recovery_reason: blankPageRequest
      ? 'blank_page_intake_request'
      : 'topic_viability_scope_question',
    recovery_lane_confidence_cap: 'low',
    recovery_lane_block_override_reason: blankPageRequest
      ? 'recoverable_blank_page_request'
      : 'recoverable_topic_validation_request',
  };
}

function sanitizeScopeTopicHint(topicHint: string): string {
  return topicHint
    .replace(/\b(too\s+common|too\s+clich[eé]|good\s+enough|bad|risky|okay)\b.*$/i, '')
    .replace(/^writing\s+about\s+/i, '')
    .replace(/^write\s+about\s+/i, '')
    .trim();
}

// =============================================================
// Public API
// =============================================================

export function buildClarificationPayload(
  intelligence: IntakeIntelligenceObject,
  features: EvidenceFeatures,
  state: SessionCaseState | null,
  rawInput?: string
): ClarificationPayload {
  const pattern = intelligence.narrative_pattern.primary_pattern;
  const possibleAngleLabel = CLARIFICATION_ANGLE_LABEL[pattern];

  // Get all missing detail targets (up to 3)
  const allMissing = rankMissingDetails(intelligence, features, state);
  const priorTargets = state
    ? state.prior_questions_asked.map((q: { missing_detail: string }) => q.missing_detail)
    : [];

  const missingDetailTargets = (allMissing as Array<string | null>)
    .filter((t): t is string => t !== null && !priorTargets.includes(t))
    .slice(0, 3)
    .map((t) => MISSING_DETAIL_LABEL[t] ?? t);

  // Build the why-not-locked message from the top missing target
  const topTarget = getTopMissingDetail(intelligence, features, state, priorTargets);
  const whyNotLockedYet =
    (topTarget && WHY_NOT_LOCKED[topTarget]) ??
    'There is not enough concrete detail yet to lock an honest direction.';

  // Generate the primary question
  const priorQuestions = state
    ? state.prior_questions_asked.map((q: { question_text: string }) => q.question_text)
    : [];

  let primaryQuestion: string | null = null;

  // ── Signal-based pipeline (primary) ──────────────────────────
  // Extracts concrete story elements from the raw transcript and
  // asks for the single most important missing detail. Produces
  // case-specific, non-generic questions.
  if (rawInput && rawInput.trim().length > 20) {
    const signals = extractNarrativeSignals(rawInput);
    const usedSignalTargets: MissingSignalTarget[] = [];

    for (let i = 0; i < 6; i += 1) {
      const signalTarget = detectMissingSignal(signals, usedSignalTargets);
      if (!signalTarget || usedSignalTargets.includes(signalTarget)) break;

      const signalQuestion = generateClarificationQuestion({
        rawInput,
        signals,
        target: signalTarget,
        priorQuestions,
      });

      usedSignalTargets.push(signalTarget);

      if (!signalQuestion) continue;
      if (isDuplicateQuestion(signalQuestion, { priorQuestions, priorTargets })) continue;

      primaryQuestion = signalQuestion;
      break;
    }
  }

  // ── Fallback: intelligence-based pipeline ─────────────────────
  // Uses the ML-parsed features when signal extraction did not
  // produce a usable question (very short or abstract input).
  if (!primaryQuestion) {
    const targets = (allMissing as Array<string | null>).filter((t): t is string => t !== null);
    for (const target of targets) {
      const candidate = generateSharpeningQuestion({ intelligence, features, caseState: state, target: target as MissingDetailTarget });
      if (candidate && !isDuplicateQuestion(candidate, { priorQuestions, priorTargets })) {
        primaryQuestion = candidate;
        break;
      }
    }
  }

  // ── Last resort ───────────────────────────────────────────────
  if (!primaryQuestion) {
    primaryQuestion = intelligence.next_question?.question_text ?? 'Can you describe the most concrete moment in this story in two or three sentences?';
  }

  const missingSignalTag = deriveMissingSignalTag(topTarget, features, rawInput);
  const lowSignalRecoveryDebug = deriveLowSignalRecoveryDebug(rawInput, features);

  // For scope/validation questions, override primaryQuestion with a more useful template
  let finalPrimaryQuestion = primaryQuestion;
  if (
    missingSignalTag === 'instructional_or_scope_question_needs_reframing' &&
    rawInput &&
    rawInput.trim().length > 0
  ) {
    const topicMatch = rawInput.match(
      /\b(about\s+([\w\s']+?)(?:\?|$)|write\s+about\s+([\w\s']+?)(?:\?|$)|essay\s+on\s+([\w\s']+?)(?:\?|$))/i
    );
    const topicHint = sanitizeScopeTopicHint(
      (topicMatch?.[2] ?? topicMatch?.[3] ?? topicMatch?.[4] ?? '').trim().slice(0, 60)
    );
    const scopeQuestion = topicHint
      ? `What actually happened with ${topicHint} that made it feel worth writing about? Name the one specific moment.`
      : 'What specific moment made this topic feel personal enough to write about? Name the scene in one sentence.';
    if (!isDuplicateQuestion(scopeQuestion, { priorQuestions, priorTargets })) {
      finalPrimaryQuestion = scopeQuestion;
    }
  }

  if (
    lowSignalRecoveryDebug?.low_signal_recovery_reason === 'blank_page_intake_request'
  ) {
    const recoveryQuestion = 'Before we pick a topic, what is one part of your life you keep returning to — a responsibility, a place, a problem, or something you do all the time?';
    if (!isDuplicateQuestion(recoveryQuestion, { priorQuestions, priorTargets })) {
      finalPrimaryQuestion = recoveryQuestion;
    }
  }

  return {
    possibleAngleLabel,
    whyNotLockedYet,
    missingDetailTargets,
    primaryQuestion: finalPrimaryQuestion ?? primaryQuestion,
    missingSignalTag,
    clarificationDebug: {
      missing_signal_type: missingSignalTag ?? 'general_scene_gap',
      template_type: missingSignalTag === 'instructional_or_scope_question_needs_reframing'
        ? 'scope_reframe'
        : missingSignalTag === 'missing_hinge_scene'
          ? 'hinge_extraction'
          : 'standard',
      sharpening_activated: missingSignalTag !== 'general_scene_gap' && missingSignalTag !== null,
    },
    lowSignalRecoveryDebug,
  };
}

function deriveMissingSignalTag(
  topTarget: string | null,
  features: EvidenceFeatures,
  rawInput?: string
): ClarificationPayload['missingSignalTag'] {
  // Scope/validation questions: "Can I write about X?", "Is X too cliché?"
  const isValidationQuery = rawInput
    ? /^(can|could|should|is|are|would|does)\s+(i|it|an?\s+essay|my\s+essay)/i.test(rawInput.trim()) ||
      /\b(too\s+cliché|good\s+enough|work\s+(as|for)|risky|bad\s+to|too\s+common)\b/i.test(rawInput)
    : false;
  if (isValidationQuery || features.instructionalPrompt === 1) return 'instructional_or_scope_question_needs_reframing';

  if (features.tokenCount < 12 && features.sceneSpecificityScore < 0.15) return 'truly_insufficient_even_after_recovery';
  if (topTarget === 'turning_point') return 'missing_hinge_scene';
  if (features.actorCount >= 2 && features.conflictPresent === 1 && topTarget === 'other_person_reaction') return 'unresolved_dual_center';
  if (topTarget === 'internal_realization' || features.reflectionPresent === 0) return 'thin_reflection';
  if (features.authorshipSignal === 1 && features.sceneSpecificityScore < 0.3) return 'indirect_hinge_present_but_underpowered';
  if (topTarget === 'scene_line' || features.sceneSpecificityScore < 0.25) return 'general_scene_gap';
  if (features.tokenCount < 18) return 'weak_note_specificity';
  return 'family_duty_not_explicit';
}
