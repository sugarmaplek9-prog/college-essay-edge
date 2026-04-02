// =============================================================
// src/lib/fm/buildLightDirectionPayload.ts
//
// Builds the LightDirectionPayload shown when product_mode
// is 'direction_light'.
//
// Allowed: provisional angle, plain-English theme, why it may
//   work, one short story-derived example, best next question
//   or move.
//
// Not allowed: overconfident compare sections, long structure
//   scaffold, weak-vs-strong start comparison, heavy premium
//   guidance unsupported by evidence.
// =============================================================

import type { IntakeIntelligenceObject, NarrativePattern, LightDirectionPayload } from '@/types/intake';
import type { EvidenceFeatures } from '@/lib/ml/evidenceStrength/features';
import type { SessionCaseState } from '@/lib/fm/case-state';
import { getDominantScene, getDominantTurningPoint, getDominantActor } from '@/lib/fm/case-state';
import { getTopMissingDetail } from '@/lib/fm/missingDetailRanker';
import { generateSharpeningQuestion } from '@/lib/fm/questionComposer';

// =============================================================
// Provisional angle labels (tentative but more specific than clarification)
// =============================================================

const PROVISIONAL_ANGLE: Record<NarrativePattern, string> = {
  self_correction_arc:          'The moment you got corrected — and why it changed your standard.',
  identity_shift:               'How you changed — what you do differently now because of this.',
  responsibility_shift:         'When responsibility got real — not the title, but the moment.',
  failure_reinterpretation:     'What the setback taught you that success couldn\'t have.',
  conflict_reframe:             'What you understood after the conflict that you couldn\'t before.',
  usefulness_vs_intention:      'Trying to help vs actually helping — the gap between the two.',
  competence_vs_responsibility: 'Can do it vs should do it — where ability met a values question.',
  unknown:                      'There\'s a real story here, and this is the thread to follow.',
};

const PROVISIONAL_THEME: Record<NarrativePattern, string> = {
  self_correction_arc:          'This essay is about the moment your standard for doing something changed.',
  identity_shift:               'This essay is about who you became, not what you did.',
  responsibility_shift:         'This essay is about the moment your idea of responsibility changed.',
  failure_reinterpretation:     'This essay is about what you could only learn by failing.',
  conflict_reframe:             'This essay is about the moment you understood the conflict differently.',
  usefulness_vs_intention:      'This essay is about the gap between wanting to help and actually helping.',
  competence_vs_responsibility: 'This essay is about using capability responsibly, not just effectively.',
  unknown:                      'This essay is about a moment that changed how you think or act.',
};

const WHY_IT_MAY_WORK: Record<NarrativePattern, string> = {
  self_correction_arc:          'It gives the essay a clear before-and-after turn that shows change instead of claiming it.',
  identity_shift:               'It replaces activity description with self-definition, which is what admissions readers actually want.',
  responsibility_shift:         'It moves past generic leadership language into a real change in judgment.',
  failure_reinterpretation:     'It keeps the essay from being a predictable obstacle story by focusing on what the setback revealed.',
  conflict_reframe:             'It avoids a flat both-sides summary by giving the reader a precise change to follow.',
  usefulness_vs_intention:      'It creates humility and stakes — the story becomes about learning what real usefulness requires.',
  competence_vs_responsibility: 'It moves the essay beyond talent and into values, which is where the stronger judgment usually lives.',
  unknown:                      'There is enough signal here to find a sharper center of gravity.',
};

const SHORT_EXAMPLE: Record<NarrativePattern, string> = {
  self_correction_arc:          'Open with the moment of correction — what was said, what you felt, what you noticed. Stay in the moment before explaining what it meant.',
  identity_shift:               'Open with a before-version of you in one concrete line, then show the moment that made that version impossible.',
  responsibility_shift:         'Open at the moment you realized your old approach was failing the people around you.',
  failure_reinterpretation:     'Open at the failure itself — the moment it happened, not the background that led to it.',
  conflict_reframe:             'Open with the tension at its highest point, not the history of the relationship.',
  usefulness_vs_intention:      'Open with the moment your intended help missed the mark — what you did, and how you found out it wasn\'t working.',
  competence_vs_responsibility: 'Open at the moment your capability gave you leverage — and then show where the decision started.',
  unknown:                      'Open with one concrete moment: where you were, what happened, what you noticed first.',
};

// =============================================================
// Public API
// =============================================================

export function buildLightDirectionPayload(
  intelligence: IntakeIntelligenceObject,
  features: EvidenceFeatures,
  state: SessionCaseState | null
): LightDirectionPayload {
  const pattern = intelligence.narrative_pattern.primary_pattern;

  const provisionalAngle = PROVISIONAL_ANGLE[pattern];
  const plainEnglishTheme = PROVISIONAL_THEME[pattern];
  const whyItMayWork = WHY_IT_MAY_WORK[pattern];

  // Build a short story-specific example if we have scene evidence
  const scene = state ? getDominantScene(state) : null;
  const turning = state ? getDominantTurningPoint(state) : null;
  const actor = state ? getDominantActor(state) : null;
  const transcript = (state?.raw_inputs ?? []).map((r) => r.text).join(' ');

  const generatedCandidates = buildCandidateDirections(transcript, pattern);
  const familyDutyCandidateGenerated = generatedCandidates.some((c) => /responsibility|owed|duty|care/i.test(c));
  const contradictionDualCenterCandidatesGenerated = generatedCandidates.length >= 2 && /\b(and|or|between)\b/i.test(transcript);
  const indirectHingeCandidatesDetected = extractHingePhrases(transcript);
  const hingeSupportActivated = indirectHingeCandidatesDetected.length > 0;
  const weakNoteRecoveryCandidateGenerated = features.tokenCount < 20 && generatedCandidates.length > 0;
  const premiumToneWithoutSupport = generatedCandidates.some((c) => /transformative|visionary|destiny|profound/i.test(c));
  const falsePremiumCandidateFlag = premiumToneWithoutSupport && features.sceneSpecificityScore < 0.3;
  const falsePremiumSuppressionActivated = falsePremiumCandidateFlag;

  const filteredCandidates = generatedCandidates.filter((c) => !shouldSuppressFalsePremium(c, falsePremiumCandidateFlag));
  const candidateDirections = (filteredCandidates.length > 0 ? filteredCandidates : generatedCandidates).slice(0, 3);

  const candidateSetQualityBand: LightDirectionPayload['candidateSetQualityBand'] =
    candidateDirections.length >= 3
      ? 'strong'
      : candidateDirections.length === 2
        ? 'mixed'
        : 'weak';

  let shortExample = SHORT_EXAMPLE[pattern];
  if (scene) {
    shortExample = `You might open with: "${trimSnippet(scene)}" — stay inside that moment rather than explaining what you were doing there.`;
  } else if (actor) {
    shortExample = `You might open with the moment involving ${actor} — let the reader meet the tension before you explain the context.`;
  }

  // Best next question
  const priorTargets = state
    ? state.prior_questions_asked.map((q: { missing_detail: string }) => q.missing_detail)
    : [];
  const topTarget = getTopMissingDetail(intelligence, features, state, priorTargets);
  const bestNextQuestion = topTarget
    ? generateSharpeningQuestion({ intelligence, features, caseState: state, target: topTarget })
    : (intelligence.next_question?.question_text ?? null);

  // Best next move — pattern-specific
  const bestNextMove = turning
    ? `Write the scene leading into "${trimSnippet(turning)}" — stay in the moment without stepping back to explain.`
    : `Write the opening two to three sentences starting inside the most concrete moment you described. Don't introduce yourself yet.`;

  const bestDirection = candidateDirections[0] ?? provisionalAngle;

  return {
    provisionalAngle: bestDirection,
    plainEnglishTheme,
    whyItMayWork,
    shortExample,
    bestNextQuestion,
    bestNextMove,
    candidateDirections,
    candidateSetQualityBand,
    generationDebug: {
      family_duty_candidate_generated: familyDutyCandidateGenerated,
      indirect_hinge_candidates_detected: indirectHingeCandidatesDetected,
      hinge_support_activated: hingeSupportActivated,
      weak_note_recovery_candidate_generated: weakNoteRecoveryCandidateGenerated,
      contradiction_dual_center_candidates_generated: contradictionDualCenterCandidatesGenerated,
      candidate_set_quality_band: candidateSetQualityBand,
      false_premium_candidate_flag: falsePremiumCandidateFlag,
      premium_tone_without_support: premiumToneWithoutSupport,
      false_premium_suppression_activated: falsePremiumSuppressionActivated,
    },
  };
}

function buildCandidateDirections(text: string, pattern: NarrativePattern): string[] {
  const lower = text.toLowerCase();

  const scopeGuidanceCandidates = buildScopeGuidanceCandidates(lower);
  if (scopeGuidanceCandidates.length > 0) return scopeGuidanceCandidates;

  const optionCandidates = buildOptionCandidates(lower);
  if (optionCandidates.length > 0) return optionCandidates;

  return [
    PROVISIONAL_ANGLE[pattern],
    PROVISIONAL_THEME[pattern],
    SHORT_EXAMPLE[pattern],
  ];
}

function buildScopeGuidanceCandidates(lower: string): string[] {
  if (/why\s+us/.test(lower)) {
    return [
      'program-resource-person fit chain',
      'campus vibe generalities',
      'prestige praise',
    ];
  }

  if (/failure\s+without\s+sounding\s+fake/.test(lower)) {
    return [
      'revision process essay',
      'tidy moral lesson essay',
      'confession essay',
    ];
  }

  if (/how\s+personal\s+is\s+too\s+personal/.test(lower)) {
    return [
      'student-centered rule-set',
      'privacy threshold talk',
      'shock-value examples',
    ];
  }

  return [];
}

function buildOptionCandidates(lower: string): string[] {
  const candidates: string[] = [];

  // Distinctive/unusual topics first — these make stronger essays than common ones.
  if (/transit\s+maps?/.test(lower)) {
    candidates.push('transit maps as urban systems curiosity');
  }
  if (/coding\s+a\s+game|code\s+a\s+game|game\s+coding/.test(lower)) {
    candidates.push('game coding as creator lens');
  }

  // Competition and failure — more specific than generic illness resilience.
  if (/losing\s+a\s+competition|second\s+place|placed\s+(second|third)|lost\s+(the|a)\s+(competition|contest|match)|getting\s+second/.test(lower)) {
    candidates.push('failure with intellectual growth');
    candidates.push('ambition and revision');
  }

  // Family/work context — strong essay material.
  if (/restaurant/.test(lower)) {
    candidates.push('restaurant as responsibility and real-world observation');
  }
  if (/volunteer|library/.test(lower)) {
    candidates.push('library as community observation');
    candidates.push('service essay');
  }
  if (/debate/.test(lower)) {
    candidates.push('debate as argument and empathy');
  }
  if (/piano/.test(lower)) {
    candidates.push('piano as discipline');
  }

  // Illness — valid but common; ranked below more distinctive angles.
  if (/chronic\s+illness|type\s*1\s*diabetes|cystic\s+fibrosis/.test(lower)) {
    candidates.push('illness as resilience');
  }

  // Broad failure mentions without competition context.
  if (/\bfailure\b/.test(lower) && !candidates.includes('failure with intellectual growth')) {
    candidates.push('failure with intellectual growth');
  }

  if (/quote/.test(lower)) {
    candidates.push('quote as framing device for deeper story');
  }

  const deduped = Array.from(new Set(candidates));
  return deduped.slice(0, 3);
}

function extractHingePhrases(text: string): string[] {
  if (!text) return [];
  const matches = text.match(/\b(but|until|then|after\s+that|that's\s+when|that\s+moment|realized|learned)\b/gi) ?? [];
  return Array.from(new Set(matches.map((m) => m.toLowerCase()))).slice(0, 4);
}

function shouldSuppressFalsePremium(candidate: string, falsePremiumCandidateFlag: boolean): boolean {
  if (!falsePremiumCandidateFlag) return false;
  return /transformative|visionary|destiny|profound/i.test(candidate);
}

function trimSnippet(text: string): string {
  return text.length > 70 ? `${text.slice(0, 67).trim()}…` : text;
}
