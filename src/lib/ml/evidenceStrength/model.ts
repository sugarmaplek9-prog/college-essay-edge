// =============================================================
// src/lib/ml/evidenceStrength/model.ts
//
// Phase 1 deterministic evidence scorer.
// Assigns a ProductMode using weighted feature logic.
//
// Scoring philosophy:
//   blocked     — very weak/generic/contaminated input
//   clarification — real signal exists but key structure missing
//   direction_light — probable pattern, not enough for premium
//   direction_full  — strong scene, turn, reflection, low ambiguity
//
// In Phase 2 replace the body of scoreEvidenceDeterministic
// with a trained classifier while preserving the response shape.
// =============================================================

import type { IntakeIntelligenceObject } from '@/types/intake';
import type { EvidenceStrengthPrediction, ProductMode } from '@/types/intake';
import type {
  BlankPageClassification,
  BlankPageMode,
  TopLevelBlankPageRoute,
} from '@/types/intake';
import type { EvidenceFeatures } from './features';
import {
  GATE_FEATURE_VERSION,
  SCORING_CALIBRATION_VERSION,
  ROUTE_LOGIC_VERSION,
} from './version';

// =============================================================
// Scoring
// =============================================================

export function scoreEvidenceDeterministic(
  f: EvidenceFeatures,
  intelligence: IntakeIntelligenceObject
): EvidenceStrengthPrediction {
  const blankPage = classifyBlankPageIntake(f, intelligence);

  if (blankPage.top_level_blank_page_route === 'needs_structured_blank_page_intake') {
    return makeResult(
      'blank_page_intake',
      blankPage.blank_page_confidence === 'high' ? 0.88 : 0.74,
      { blocked: 0.5, clarification: 0.25, blank_page_intake: 4.0, direction_light: 0, direction_full: 0 },
      f,
      blankPage
    );
  }

  if (blankPage.top_level_blank_page_route === 'true_block') {
    return makeResult(
      'blocked',
      blankPage.blank_page_confidence === 'high' ? 0.95 : 0.82,
      { blocked: 5.0, clarification: 0.2, blank_page_intake: 0, direction_light: 0, direction_full: 0 },
      f,
      blankPage
    );
  }

  const scores: Record<ProductMode, number> = {
    blocked: 0,
    clarification: 0,
    blank_page_intake: 0,
    direction_light: 0,
    direction_full: 0,
  };

  // ── Hard gate: orchestrator already decided blocked ──────────────
  const viability = intelligence.recommendation_viability.decision;
  const escalationBlocking = intelligence.escalation.blocking;

  // Pure scope/framing instructional questions bypass the hard gate.
  // These are narrow essay-craft queries (why us, failure framing, etc.) with
  // no toxic signal — blocking them harms usefulness without protecting safety.
  if (escalationBlocking && f.instructionalPrompt !== 1) {
    return makeResult(
      'blocked',
      0.95,
      { blocked: 10, clarification: 0, blank_page_intake: 0, direction_light: 0, direction_full: 0 },
      f,
      blankPage
    );
  }

  // ── Blocked signals ──────────────────────────────────────────────
  const exploratoryPrompt = f.helpSeekingQuestion === 1 || f.topicOptionCount >= 2;

  if (f.signalStrength === 0) scores.blocked += exploratoryPrompt ? 0.5 : 2.5;
  if (f.primaryPatternConfidence === 0 && f.signalStrength <= 1) scores.blocked += exploratoryPrompt ? 0.25 : 1.0;
  if (f.contaminationRisk === 2 && f.authorshipSignal === 0) scores.blocked += 2.0;
  if (f.tokenCount < 15 && !exploratoryPrompt) scores.blocked += 1.5;
  if (f.ambiguityScore > 0.7 && f.conflictPresent === 0 && f.turningPointPresent === 0) scores.blocked += 1.0;
  if (f.trustedEvidenceCount === 0 && f.signalStrength === 0) scores.blocked += 0.75;
  if (f.clicheRiskScore > 0.75 && f.sceneSpecificityScore < 0.2) scores.blocked += 1.5;
  if (f.abstractionScore > 0.6 && f.sceneSpecificityScore < 0.15) scores.blocked += 1.0;

  if (viability === 'blocked' && !exploratoryPrompt) scores.blocked += 1.5;

  // ── Clarification signals ────────────────────────────────────────
  if (f.signalStrength === 1) scores.clarification += 2.0;
  if (f.signalStrength === 2) scores.clarification += 1.5;
  if (f.authorshipSignal === 1) scores.clarification += 1.0; // weak scene evidence
  if (f.sceneSpecificityScore < 0.35 && f.signalStrength >= 1) scores.clarification += 1.0;
  if (f.turningPointPresent === 0 && f.signalStrength >= 1) scores.clarification += 0.75;
  if (f.consequencePresent === 0 && f.signalStrength >= 1) scores.clarification += 0.50;
  if (f.reflectionPresent === 0 && f.signalStrength >= 1) scores.clarification += 0.25;
  if (f.helpSeekingQuestion === 1 && f.signalStrength === 0 && f.topicOptionCount < 2) {
    scores.clarification += 2.0;
  }
  // needs_more_input viability caps at clarification
  if (viability === 'needs_more_input') {
    scores.clarification += 1.0;
    scores.direction_full = 0;
  }

  // ── Direction-light signals ──────────────────────────────────────
  if (f.signalStrength === 2 && f.primaryPatternConfidence >= 1) scores.direction_light += 1.5;
  if (f.signalStrength === 3 && f.sceneSpecificityScore < 0.45) scores.direction_light += 1.0;
  if (f.conflictPresent === 1 && f.turningPointPresent === 0) scores.direction_light += 0.5;
  if (f.sceneSpecificityScore >= 0.3 && f.sceneSpecificityScore < 0.5) scores.direction_light += 0.75;
  if (f.primaryPatternConfidence === 1) scores.direction_light += 0.5;
  if (f.topicOptionCount >= 2) scores.direction_light += 2.25;
  if (f.instructionalPrompt === 1 && f.signalStrength === 0 && f.helpSeekingQuestion === 1) {
    // Instructional scope questions should route to direction_light, not clarification.
    // Subtract from clarification so direction_light wins the routing decision.
    scores.direction_light += 1.75;
    scores.clarification -= 2.5;
  }

  const mediumSignalRecoveredScope =
    viability === 'reduced_scope'
    && f.signalStrength >= 2
    && f.tokenCount >= 40
    && f.trustedEvidenceCount >= 1
    && f.sceneSpecificityScore >= 0.25
    && f.contaminationRisk <= 1;

  if (mediumSignalRecoveredScope) {
    scores.direction_light += 4.0;
    scores.clarification -= 1.0;
  }

  const mediumSignalNeedsMoreInput =
    viability === 'needs_more_input'
    && f.signalStrength >= 2
    && f.tokenCount >= 55
    && f.trustedEvidenceCount >= 1
    && f.sceneSpecificityScore >= 0.45
    && f.contaminationRisk <= 1;

  if (mediumSignalNeedsMoreInput) {
    scores.direction_light += 2.75;
    scores.clarification -= 0.5;
  }

  const recoverableCompareChoice =
    viability === 'needs_more_input'
    && f.topicOptionCount >= 2
    && f.scopeUncertainSignal === 1
    && f.tooThinToRecoverSignal === 0
    && intelligence.authorship_signal.contamination_risk !== 'high'
    && !escalationBlocking;

  if (recoverableCompareChoice) {
    // Compare-choice prompts are often viable for a provisional direction lane
    // even when they lack full scene evidence.
    scores.direction_light += 3.75;
    scores.clarification -= 1.25;
    scores.blocked -= 0.5;
  }

  // ── Direction-full signals ───────────────────────────────────────
  if (viability !== 'needs_more_input') {
    if (f.signalStrength === 3) scores.direction_full += 2.5;
    if (f.primaryPatternConfidence === 2) scores.direction_full += 1.0;
    if (f.authorshipSignal === 2) scores.direction_full += 1.0;
    if (f.sceneSpecificityScore >= 0.5) scores.direction_full += 0.75;
    if (f.turningPointPresent === 1) scores.direction_full += 0.5;
    if (f.reflectionPresent === 1) scores.direction_full += 0.5;
    if (f.conflictPresent === 1) scores.direction_full += 0.25;
    if (f.consequencePresent === 1) scores.direction_full += 0.25;
    if (f.contaminationRisk === 0) scores.direction_full += 0.25;
  }

  const route = maxScoreKey(scores);
  const total = Object.values(scores).reduce((a, b) => a + b, 0);
  const confidence = total > 0 ? scores[route] / total : 0.5;

  return makeResult(route, confidence, scores, f, blankPage);
}

export function classifyBlankPageIntake(
  f: EvidenceFeatures,
  intelligence: IntakeIntelligenceObject
): BlankPageClassification {
  const rawTriggers = Array.from(new Set(f.blankPageTriggerSignals));
  const recoverableCompareChoiceForDirection =
    f.topicOptionCount >= 2
    && f.scopeUncertainSignal === 1
    && f.tooThinToRecoverSignal === 0
    && intelligence.recommendation_viability.decision !== 'blocked'
    && intelligence.authorship_signal.contamination_risk !== 'high'
    && !intelligence.escalation.blocking;

  if (recoverableCompareChoiceForDirection) {
    return {
      blank_page_intake_detected: false,
      blank_page_mode: null,
      blank_page_trigger_signals: rawTriggers,
      blank_page_recovery_reason: null,
      blank_page_confidence: null,
      top_level_blank_page_route: 'ready_for_nds',
    };
  }

  const modeByPriority: Array<{ mode: BlankPageMode; active: boolean; confidence: 'low' | 'medium' | 'high' }> = [
    {
      mode: 'blank_page_discovery',
      active: f.blankPageDiscoverySignal === 1,
      confidence: rawTriggers.includes('blank_page_language') ? 'high' : 'medium',
    },
    {
      mode: 'scope_reframe',
      active: f.scopeUncertainSignal === 1,
      confidence: rawTriggers.includes('scope_uncertain_language') ? 'high' : 'medium',
    },
    {
      mode: 'theme_probe',
      active: f.themeOnlySignal === 1,
      confidence: rawTriggers.includes('trait_show_language') ? 'medium' : 'low',
    },
    {
      mode: 'activity_probe',
      active: f.activityOnlySignal === 1,
      confidence: rawTriggers.includes('multiple_activity_options') ? 'high' : 'medium',
    },
    {
      mode: 'topic_probe',
      active: f.topicOnlySignal === 1,
      confidence: rawTriggers.includes('topic_eligibility_question') ? 'high' : 'medium',
    },
    {
      mode: 'too_thin_to_recover',
      active: f.tooThinToRecoverSignal === 1,
      confidence: rawTriggers.includes('off_domain_or_unusable') ? 'high' : 'medium',
    },
  ];

  const resolved = modeByPriority.find((entry) => entry.active) ?? null;
  const hasStrongNdsEvidence =
    f.signalStrength >= 2
    && (f.sceneSpecificityScore >= 0.35 || f.turningPointPresent === 1 || f.reflectionPresent === 1)
    && intelligence.recommendation_viability.decision !== 'blocked';

  if (resolved?.mode === 'too_thin_to_recover') {
    return {
      blank_page_intake_detected: false,
      blank_page_mode: 'too_thin_to_recover',
      blank_page_trigger_signals: rawTriggers,
      blank_page_recovery_reason: 'input_too_thin_or_unusable_for_recovery',
      blank_page_confidence: resolved.confidence,
      top_level_blank_page_route: 'true_block',
    };
  }

  if (resolved && !hasStrongNdsEvidence) {
    return {
      blank_page_intake_detected: true,
      blank_page_mode: resolved.mode,
      blank_page_trigger_signals: rawTriggers,
      blank_page_recovery_reason: `recoverable_${resolved.mode}`,
      blank_page_confidence: resolved.confidence,
      top_level_blank_page_route: 'needs_structured_blank_page_intake',
    };
  }

  const route: TopLevelBlankPageRoute = f.tooThinToRecoverSignal === 1 ? 'true_block' : 'ready_for_nds';

  return {
    blank_page_intake_detected: false,
    blank_page_mode: route === 'true_block' ? 'too_thin_to_recover' : null,
    blank_page_trigger_signals: rawTriggers,
    blank_page_recovery_reason: route === 'true_block' ? 'input_too_thin_or_unusable_for_recovery' : null,
    blank_page_confidence: route === 'true_block' ? 'medium' : null,
    top_level_blank_page_route: route,
  };
}

// =============================================================
// Helpers
// =============================================================

function maxScoreKey(scores: Record<ProductMode, number>): ProductMode {
  // Tie-breaking order: full > light > blank-page > clarification > blocked
  const order: ProductMode[] = ['direction_full', 'direction_light', 'blank_page_intake', 'clarification', 'blocked'];
  let best: ProductMode = 'blocked';
  let bestScore = -Infinity;
  for (const mode of order) {
    if (scores[mode] > bestScore) {
      bestScore = scores[mode];
      best = mode;
    }
  }
  return best;
}

function makeResult(
  route: ProductMode,
  confidence: number,
  scores: Record<ProductMode, number>,
  f: EvidenceFeatures,
  blankPageClassification: BlankPageClassification
): EvidenceStrengthPrediction {
  return {
    route,
    confidence: Math.round(confidence * 100) / 100,
    scores,
    blank_page_classification: blankPageClassification,
    gate_version: {
      gate_feature_version: GATE_FEATURE_VERSION,
      scoring_calibration_version: SCORING_CALIBRATION_VERSION,
      route_logic_version: ROUTE_LOGIC_VERSION,
    },
    featureSummary: {
      sceneSpecificity: Math.round(f.sceneSpecificityScore * 100) / 100,
      conflictStrength: f.conflictPresent,
      reflectionStrength: f.reflectionPresent,
      ambiguity: Math.round(f.ambiguityScore * 100) / 100,
    },
  };
}
