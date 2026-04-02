/**
 * src/__tests__/unit/evidence-routing.spec.ts
 *
 * Unit tests for the evidence-strength feature extractor,
 * deterministic scorer, and routing layer.
 *
 * Coverage:
 *   - Feature extraction from text
 *   - Deterministic routing: F1 → direction_full
 *   - Deterministic routing: F3 → clarification
 *   - Deterministic routing: F4 → blocked
 *   - Clarification payload is case-specific
 *   - Question composer generates concrete questions
 *   - Question deduper blocks repeats
 *   - Output quality guard catches corrupted text
 */

import { describe, expect, it } from 'vitest';
import { buildEvidenceFeatures } from '@/lib/ml/evidenceStrength/features';
import { scoreEvidenceDeterministic } from '@/lib/ml/evidenceStrength/model';
import { predictEvidenceStrength } from '@/lib/ml/evidenceStrength/predict';
import { buildClarificationPayload } from '@/lib/fm/buildClarificationPayload';
import { generateSharpeningQuestion } from '@/lib/fm/questionComposer';
import { isDuplicateQuestion } from '@/lib/fm/questionDeduper';
import { checkOutputQuality, guardOutputText } from '@/lib/fm/outputQualityGuard';
import { rankMissingDetails, getTopMissingDetail } from '@/lib/fm/missingDetailRanker';
import {
  FIXTURE_F1_STRONG_CASE,
  FIXTURE_F3_THIN_RECOVERY,
  FIXTURE_F4_BLOCKED,
} from '../fixtures/orchestrator-responses';
import { createSessionCaseState } from '@/lib/fm/case-state';

// =============================================================
// Fixture normalization
// =============================================================

function normalizeFixture<T extends Record<string, unknown>>(fixture: T): T {
  if ((fixture?.trusted_evidence as Record<string, unknown>)?.trusted_evidence_rank) return fixture;

  return {
    ...fixture,
    trusted_evidence: {
      trusted_evidence_rank: Array.isArray((fixture?.trusted_evidence as Record<string, unknown>)?.ranking)
        ? ((fixture.trusted_evidence as Record<string, unknown>).ranking as Array<{ source_id: string }>)
            .map((item) => item.source_id)
        : [],
      downgraded_sources: [],
      reason_codes: ['STORY_ENTRY_OUTRANKS_POLISHED_DRAFT'],
      meta: (fixture?.trusted_evidence as Record<string, unknown>)?.meta,
    },
  };
}

const F1 = normalizeFixture(FIXTURE_F1_STRONG_CASE as unknown as Record<string, unknown>) as unknown as typeof FIXTURE_F1_STRONG_CASE;
const F3 = normalizeFixture(FIXTURE_F3_THIN_RECOVERY as unknown as Record<string, unknown>) as unknown as typeof FIXTURE_F3_THIN_RECOVERY;
const F4 = normalizeFixture(FIXTURE_F4_BLOCKED as unknown as Record<string, unknown>) as unknown as typeof FIXTURE_F4_BLOCKED;

function makeRecoverableLowSignalIntelligence() {
  return {
    ...F4,
    usable_signal: {
      ...F4.usable_signal,
      usable_signal: false,
      signal_strength: 'none',
    },
    authorship_signal: {
      ...F4.authorship_signal,
      contamination_risk: 'low',
      student_scene_evidence: 'absent',
    },
    recommendation_viability: {
      ...F4.recommendation_viability,
      decision: 'needs_more_input',
      signal_sufficiency_used: 'none',
      contamination_risk_used: 'low',
    },
    escalation: {
      ...F4.escalation,
      blocking: false,
    },
  };
}

const STRONG_INPUT = 'I spent three summers volunteering at the hospital, and I thought I was helping. In my third summer, a nurse pulled me aside and said I was just getting in the way. That conversation changed how I think about service.';
const THIN_INPUT = 'I like sports but I am not great at them.';
const BLOCKED_INPUT = 'I am good at everything and I am a hard worker.';

// =============================================================
// Feature extraction
// =============================================================

describe('buildEvidenceFeatures', () => {
  it('extracts scene specificity signals from concrete narrative', () => {
    const state = createSessionCaseState(STRONG_INPUT, F1 as any);
    const features = buildEvidenceFeatures({
      rawInput: STRONG_INPUT,
      normalizedInput: STRONG_INPUT,
      intelligence: F1 as any,
      sessionCaseState: state,
    });

    expect(features.tokenCount).toBeGreaterThan(25);
    expect(features.sceneSpecificityScore).toBeGreaterThan(0.4);
    expect(features.signalStrength).toBe(3); // 'high'
    expect(features.authorshipSignal).toBe(2); // 'present'
    expect(features.contaminationRisk).toBe(0); // 'low'
    expect(features.primaryPatternConfidence).toBe(2); // 'high'
    expect(features.turningPointPresent).toBe(1);
  });

  it('scores thin input with low scene specificity and weak authorship', () => {
    const state = createSessionCaseState(THIN_INPUT, F3 as any);
    const features = buildEvidenceFeatures({
      rawInput: THIN_INPUT,
      normalizedInput: THIN_INPUT,
      intelligence: F3 as any,
      sessionCaseState: state,
    });

    expect(features.tokenCount).toBeLessThan(15);
    expect(features.sceneSpecificityScore).toBeLessThan(0.3);
    expect(features.signalStrength).toBe(2); // 'medium'
    expect(features.authorshipSignal).toBe(1); // 'weak'
    expect(features.turningPointPresent).toBe(0);
  });

  it('scores blocked input with near-zero evidence signals', () => {
    const features = buildEvidenceFeatures({
      rawInput: BLOCKED_INPUT,
      normalizedInput: BLOCKED_INPUT,
      intelligence: F4 as any,
      sessionCaseState: null,
    });

    expect(features.signalStrength).toBe(0); // 'none'
    expect(features.authorshipSignal).toBe(0); // 'absent'
    expect(features.contaminationRisk).toBe(2); // 'high'
    expect(features.clicheRiskScore).toBeGreaterThan(0.2);
  });
});

// =============================================================
// Deterministic scorer routing
// =============================================================

describe('scoreEvidenceDeterministic — fixture routing', () => {
  it('routes F1 strong case to direction_full', () => {
    const state = createSessionCaseState(STRONG_INPUT, F1 as any);
    const features = buildEvidenceFeatures({
      rawInput: STRONG_INPUT,
      normalizedInput: STRONG_INPUT,
      intelligence: F1 as any,
      sessionCaseState: state,
    });
    const result = scoreEvidenceDeterministic(features, F1 as any);
    expect(result.route).toBe('direction_full');
    expect(result.confidence).toBeGreaterThan(0.4);
    expect(result.scores.direction_full).toBeGreaterThan(result.scores.clarification);
  });

  it('routes F3 thin recovery case to clarification', () => {
    const state = createSessionCaseState(THIN_INPUT, F3 as any);
    const features = buildEvidenceFeatures({
      rawInput: THIN_INPUT,
      normalizedInput: THIN_INPUT,
      intelligence: F3 as any,
      sessionCaseState: state,
    });
    const result = scoreEvidenceDeterministic(features, F3 as any);
    expect(result.route).toBe('clarification');
    expect(result.scores.clarification).toBeGreaterThan(result.scores.direction_full);
  });

  it('routes F4 blocked case to blocked', () => {
    const features = buildEvidenceFeatures({
      rawInput: BLOCKED_INPUT,
      normalizedInput: BLOCKED_INPUT,
      intelligence: F4 as any,
      sessionCaseState: null,
    });
    const result = scoreEvidenceDeterministic(features, F4 as any);
    expect(result.route).toBe('blocked');
    expect(result.scores.blocked).toBeGreaterThan(result.scores.clarification);
  });

  it('never routes blocked viability to direction modes', () => {
    const features = buildEvidenceFeatures({
      rawInput: BLOCKED_INPUT,
      normalizedInput: BLOCKED_INPUT,
      intelligence: F4 as any,
      sessionCaseState: null,
    });
    const result = scoreEvidenceDeterministic(features, F4 as any);
    expect(result.route).not.toBe('direction_full');
    expect(result.route).not.toBe('direction_light');
  });

  it('includes a featureSummary on every result', () => {
    const features = buildEvidenceFeatures({
      rawInput: STRONG_INPUT,
      normalizedInput: STRONG_INPUT,
      intelligence: F1 as any,
      sessionCaseState: null,
    });
    const result = scoreEvidenceDeterministic(features, F1 as any);
    expect(result.featureSummary).toBeDefined();
    expect(typeof result.featureSummary?.sceneSpecificity).toBe('number');
  });
});

// =============================================================
// End-to-end predictEvidenceStrength
// =============================================================

describe('predictEvidenceStrength', () => {
  it('strong input never produces clarification or blocked route', () => {
    const result = predictEvidenceStrength({
      rawInput: STRONG_INPUT,
      normalizedInput: STRONG_INPUT,
      intelligence: F1 as any,
      sessionCaseState: null,
    });
    expect(['direction_full', 'direction_light']).toContain(result.route);
  });

  it('thin input never produces full direction', () => {
    const result = predictEvidenceStrength({
      rawInput: THIN_INPUT,
      normalizedInput: THIN_INPUT,
      intelligence: F3 as any,
      sessionCaseState: null,
    });
    expect(result.route).not.toBe('direction_full');
  });

  it('routes blank-page essay requests to blank_page_intake via low-signal recovery', () => {
    const rawInput = 'I really have no idea what to write about for my college essay.';
    const intelligence = makeRecoverableLowSignalIntelligence() as any;
    const state = createSessionCaseState(rawInput, intelligence);

    const result = predictEvidenceStrength({
      rawInput,
      normalizedInput: rawInput,
      intelligence,
      sessionCaseState: state,
    });

    expect(result.route).toBe('blank_page_intake');

    const features = buildEvidenceFeatures({
      rawInput,
      normalizedInput: rawInput,
      intelligence,
      sessionCaseState: state,
    });
    const payload = buildClarificationPayload(intelligence, features, state, rawInput);

    expect(payload.lowSignalRecoveryDebug?.recoverable_low_signal_lane_activated).toBe(true);
    expect(payload.lowSignalRecoveryDebug?.low_signal_recovery_reason).toBe('blank_page_intake_request');
    expect(payload.primaryQuestion).toContain('Before we pick a topic');
  });

  it('exposes blank-page classification metadata in prediction output', () => {
    const rawInput = 'I have no idea what to write about for my essay.';
    const intelligence = makeRecoverableLowSignalIntelligence() as any;
    const state = createSessionCaseState(rawInput, intelligence);

    const result = predictEvidenceStrength({
      rawInput,
      normalizedInput: rawInput,
      intelligence,
      sessionCaseState: state,
    });

    expect(result.blank_page_classification.top_level_blank_page_route).toBe('needs_structured_blank_page_intake');
    expect(result.blank_page_classification.blank_page_mode).toBe('blank_page_discovery');
    expect(result.blank_page_classification.blank_page_trigger_signals.length).toBeGreaterThan(0);
    expect(result.blank_page_classification.blank_page_confidence).toBeTruthy();
  });

  it('routes topic-viability scope questions to blank_page_intake via low-signal recovery', () => {
    const rawInput = 'Is writing about moving schools three times too common?';
    const intelligence = makeRecoverableLowSignalIntelligence() as any;
    const state = createSessionCaseState(rawInput, intelligence);

    const result = predictEvidenceStrength({
      rawInput,
      normalizedInput: rawInput,
      intelligence,
      sessionCaseState: state,
    });

    expect(result.route).toBe('blank_page_intake');

    const features = buildEvidenceFeatures({
      rawInput,
      normalizedInput: rawInput,
      intelligence,
      sessionCaseState: state,
    });
    const payload = buildClarificationPayload(intelligence, features, state, rawInput);

    expect(payload.lowSignalRecoveryDebug?.recoverable_low_signal_lane_activated).toBe(true);
    expect(payload.lowSignalRecoveryDebug?.low_signal_recovery_reason).toBe('topic_viability_scope_question');
    expect(payload.primaryQuestion.toLowerCase()).toContain('moving schools three times');
    expect(payload.primaryQuestion.toLowerCase()).not.toContain('too common');
  });
});

describe('Phase 1 blank-page mode assignment', () => {
  const recoverable = makeRecoverableLowSignalIntelligence() as any;

  it('keeps mode assignment deterministic for identical input', () => {
    const rawInput = 'Can I write about robotics?';

    const stateA = createSessionCaseState(rawInput, recoverable);
    const first = predictEvidenceStrength({
      rawInput,
      normalizedInput: rawInput,
      intelligence: recoverable,
      sessionCaseState: stateA,
    });

    const stateB = createSessionCaseState(rawInput, recoverable);
    const second = predictEvidenceStrength({
      rawInput,
      normalizedInput: rawInput,
      intelligence: recoverable,
      sessionCaseState: stateB,
    });

    expect(first.blank_page_classification.top_level_blank_page_route)
      .toBe(second.blank_page_classification.top_level_blank_page_route);
    expect(first.blank_page_classification.blank_page_mode)
      .toBe(second.blank_page_classification.blank_page_mode);
    expect(first.route).toBe(second.route);
  });

  const topicOnlyCases = [
    'Can I write about gardening?',
    'Would volunteering work for my college essay?',
    'Should I write about coding for my personal statement?',
  ];

  const themeOnlyCases = [
    'I want to show resilience.',
    'I want to write about leadership.',
    'I want my essay to demonstrate growth.',
  ];

  const activityOnlyCases = [
    'I am between robotics and debate.',
    'Maybe soccer for my essay?',
    'I am deciding between robotics, debate, and soccer.',
  ];

  const scopeUncertainCases = [
    'I do not know if this says enough about me.',
    'I like this topic but I am not sure it is deep enough.',
    'I am not sure this is really an essay-worthy topic.',
  ];

  const blankPageCases = [
    'I have no idea what to write about.',
    'Nothing feels special enough for my college essay.',
    'I do not know where to start for my personal statement.',
  ];

  const tooThinCases = [
    'hi',
    'n/a',
    'write my essay for me',
  ];

  it.each(topicOnlyCases)('classifies topic-only case: %s', (rawInput) => {
    const state = createSessionCaseState(rawInput, recoverable);
    const result = predictEvidenceStrength({
      rawInput,
      normalizedInput: rawInput,
      intelligence: recoverable,
      sessionCaseState: state,
    });

    expect(result.blank_page_classification.top_level_blank_page_route).toBe('needs_structured_blank_page_intake');
    expect(result.blank_page_classification.blank_page_mode).toBe('topic_probe');
    expect(result.route).toBe('blank_page_intake');
  });

  it.each(themeOnlyCases)('classifies theme-only case: %s', (rawInput) => {
    const state = createSessionCaseState(rawInput, recoverable);
    const result = predictEvidenceStrength({
      rawInput,
      normalizedInput: rawInput,
      intelligence: recoverable,
      sessionCaseState: state,
    });

    expect(result.blank_page_classification.top_level_blank_page_route).toBe('needs_structured_blank_page_intake');
    expect(result.blank_page_classification.blank_page_mode).toBe('theme_probe');
    expect(result.route).toBe('blank_page_intake');
  });

  it.each(activityOnlyCases)('classifies activity-only case: %s', (rawInput) => {
    const state = createSessionCaseState(rawInput, recoverable);
    const result = predictEvidenceStrength({
      rawInput,
      normalizedInput: rawInput,
      intelligence: recoverable,
      sessionCaseState: state,
    });

    expect(result.blank_page_classification.top_level_blank_page_route).toBe('needs_structured_blank_page_intake');
    expect(result.blank_page_classification.blank_page_mode).toBe('activity_probe');
    expect(result.route).toBe('blank_page_intake');
  });

  it.each(scopeUncertainCases)('classifies scope-uncertain case: %s', (rawInput) => {
    const state = createSessionCaseState(rawInput, recoverable);
    const result = predictEvidenceStrength({
      rawInput,
      normalizedInput: rawInput,
      intelligence: recoverable,
      sessionCaseState: state,
    });

    expect(result.blank_page_classification.top_level_blank_page_route).toBe('needs_structured_blank_page_intake');
    expect(result.blank_page_classification.blank_page_mode).toBe('scope_reframe');
    expect(result.route).toBe('blank_page_intake');
  });

  it.each(blankPageCases)('classifies blank-page discovery case: %s', (rawInput) => {
    const state = createSessionCaseState(rawInput, recoverable);
    const result = predictEvidenceStrength({
      rawInput,
      normalizedInput: rawInput,
      intelligence: recoverable,
      sessionCaseState: state,
    });

    expect(result.blank_page_classification.top_level_blank_page_route).toBe('needs_structured_blank_page_intake');
    expect(result.blank_page_classification.blank_page_mode).toBe('blank_page_discovery');
    expect(result.route).toBe('blank_page_intake');
  });

  it.each(tooThinCases)('classifies too-thin case as true_block: %s', (rawInput) => {
    const state = createSessionCaseState(rawInput, recoverable);
    const result = predictEvidenceStrength({
      rawInput,
      normalizedInput: rawInput,
      intelligence: recoverable,
      sessionCaseState: state,
    });

    expect(result.blank_page_classification.top_level_blank_page_route).toBe('true_block');
    expect(result.blank_page_classification.blank_page_mode).toBe('too_thin_to_recover');
    expect(result.route).toBe('blocked');
  });

  it('keeps clearly directional input in ready_for_nds', () => {
    const rawInput = STRONG_INPUT;
    const state = createSessionCaseState(rawInput, F1 as any);
    const result = predictEvidenceStrength({
      rawInput,
      normalizedInput: rawInput,
      intelligence: F1 as any,
      sessionCaseState: state,
    });

    expect(result.blank_page_classification.top_level_blank_page_route).toBe('ready_for_nds');
    expect(result.blank_page_classification.blank_page_mode).toBeNull();
    expect(['direction_full', 'direction_light']).toContain(result.route);
  });
});

// =============================================================
// Clarification payload
// =============================================================

describe('buildClarificationPayload', () => {
  it('returns a case-specific possibleAngleLabel', () => {
    const state = createSessionCaseState(THIN_INPUT, F3 as any);
    const features = buildEvidenceFeatures({
      rawInput: THIN_INPUT,
      normalizedInput: THIN_INPUT,
      intelligence: F3 as any,
      sessionCaseState: state,
    });
    const payload = buildClarificationPayload(F3 as any, features, state);

    expect(payload.possibleAngleLabel).toBeTruthy();
    expect(payload.possibleAngleLabel.length).toBeGreaterThan(10);
    // Should not be overconfident
    expect(payload.possibleAngleLabel).toMatch(/may|might|could/i);
  });

  it('provides a whyNotLockedYet message that mentions what is missing', () => {
    const state = createSessionCaseState(THIN_INPUT, F3 as any);
    const features = buildEvidenceFeatures({
      rawInput: THIN_INPUT,
      normalizedInput: THIN_INPUT,
      intelligence: F3 as any,
      sessionCaseState: state,
    });
    const payload = buildClarificationPayload(F3 as any, features, state);

    expect(payload.whyNotLockedYet).toBeTruthy();
    expect(payload.whyNotLockedYet.length).toBeGreaterThan(20);
  });

  it('provides a primaryQuestion that is case-specific (not generic)', () => {
    const state = createSessionCaseState(THIN_INPUT, F3 as any);
    const features = buildEvidenceFeatures({
      rawInput: THIN_INPUT,
      normalizedInput: THIN_INPUT,
      intelligence: F3 as any,
      sessionCaseState: state,
    });
    const payload = buildClarificationPayload(F3 as any, features, state);

    expect(payload.primaryQuestion).toBeTruthy();
    // Must end with a question mark
    expect(payload.primaryQuestion.endsWith('?')).toBe(true);
    // Must not be a stock phrase
    expect(payload.primaryQuestion).not.toMatch(/what changed your self.understanding/i);
    expect(payload.primaryQuestion).not.toMatch(/what did you learn from this/i);
  });
});

// =============================================================
// Question composer
// =============================================================

describe('generateSharpeningQuestion', () => {
  it('generates a scene-specific question for scene_line target', () => {
    const state = createSessionCaseState(STRONG_INPUT, F1 as any);
    const features = buildEvidenceFeatures({
      rawInput: STRONG_INPUT,
      normalizedInput: STRONG_INPUT,
      intelligence: F1 as any,
      sessionCaseState: state,
    });
    const question = generateSharpeningQuestion({
      intelligence: F1 as any,
      features,
      caseState: state,
      target: 'scene_line',
    });

    expect(question).toBeTruthy();
    expect(question!.endsWith('?')).toBe(true);
    // Should be a concrete question, not abstract
    expect(question).not.toMatch(/self.understanding|personal growth|what did you learn/i);
  });

  it('generates a turning point question that references case evidence', () => {
    const state = createSessionCaseState(STRONG_INPUT, F1 as any);
    const features = buildEvidenceFeatures({
      rawInput: STRONG_INPUT,
      normalizedInput: STRONG_INPUT,
      intelligence: F1 as any,
      sessionCaseState: state,
    });
    const question = generateSharpeningQuestion({
      intelligence: F1 as any,
      features,
      caseState: state,
      target: 'turning_point',
    });

    expect(question).toBeTruthy();
    expect(question!.endsWith('?')).toBe(true);
  });

  it('returns null for a null target', () => {
    const features = buildEvidenceFeatures({
      rawInput: THIN_INPUT,
      normalizedInput: THIN_INPUT,
      intelligence: F3 as any,
      sessionCaseState: null,
    });
    const question = generateSharpeningQuestion({
      intelligence: F3 as any,
      features,
      caseState: null,
      target: null,
    });

    expect(question).toBeNull();
  });
});

// =============================================================
// Question deduper
// =============================================================

describe('isDuplicateQuestion', () => {
  it('detects exact repeat questions', () => {
    const prior = 'What exactly happened in the moment with the nurse?';
    expect(
      isDuplicateQuestion(prior, { priorQuestions: [prior], priorTargets: [] })
    ).toBe(true);
  });

  it('detects near-semantic duplicate questions', () => {
    const prior = 'What exactly happened with the nurse in that moment?';
    const candidate = 'What happened exactly with the nurse in that moment?';
    expect(
      isDuplicateQuestion(candidate, { priorQuestions: [prior], priorTargets: [] })
    ).toBe(true);
  });

  it('allows distinct questions through', () => {
    const prior = 'What exactly happened with the nurse?';
    const candidate = 'What did you do differently the next morning to show the change was real?';
    expect(
      isDuplicateQuestion(candidate, { priorQuestions: [prior], priorTargets: [] })
    ).toBe(false);
  });

  it('allows first question when no prior questions exist', () => {
    const candidate = 'What exactly did the nurse say when she pulled you aside?';
    expect(
      isDuplicateQuestion(candidate, { priorQuestions: [], priorTargets: [] })
    ).toBe(false);
  });
});

// =============================================================
// Missing detail ranker
// =============================================================

describe('rankMissingDetails', () => {
  it('includes turning_point as top priority for thin identity_shift case', () => {
    const state = createSessionCaseState(THIN_INPUT, F3 as any);
    const features = buildEvidenceFeatures({
      rawInput: THIN_INPUT,
      normalizedInput: THIN_INPUT,
      intelligence: F3 as any,
      sessionCaseState: state,
    });
    const ranked = rankMissingDetails(F3 as any, features, state);
    expect(ranked.length).toBeGreaterThan(0);
    expect(ranked).toContain('turning_point');
  });

  it('returns null from getTopMissingDetail when all targets have been asked', () => {
    const state = createSessionCaseState(THIN_INPUT, F3 as any);
    const features = buildEvidenceFeatures({
      rawInput: THIN_INPUT,
      normalizedInput: THIN_INPUT,
      intelligence: F3 as any,
      sessionCaseState: state,
    });
    const allTargets = ['scene_line', 'conflict_cause', 'turning_point', 'other_person_reaction', 'internal_realization', 'repair_action', 'consequence'];
    const top = getTopMissingDetail(F3 as any, features, state, allTargets);
    expect(top).toBeNull();
  });
});

// =============================================================
// Output quality guard
// =============================================================

describe('checkOutputQuality', () => {
  it('passes clean, well-formed text', () => {
    expect(checkOutputQuality('The moment you got corrected changes how you define doing it well.')).toBeNull();
  });

  it('detects grammar corruption from template assembly', () => {
    expect(checkOutputQuality('The angle is undefined and should be improved.')).toBe('grammar_corruption');
    expect(checkOutputQuality('Current value is null for this field.')).toBe('grammar_corruption');
  });

  it('detects banned abstract labels', () => {
    expect(checkOutputQuality('This is The Thread Worth Following for your essay.')).toBe('abstract_label');
  });

  it('flags text that is too short', () => {
    expect(checkOutputQuality('Hi')).toBe('too_short');
    expect(checkOutputQuality('')).toBe('too_short');
  });
});

describe('guardOutputText', () => {
  it('returns original text when it passes', () => {
    const result = guardOutputText('The moment you got corrected.', 'Fallback text.');
    expect(result.passed).toBe(true);
    expect(result.text).toBe('The moment you got corrected.');
  });

  it('returns fallback and suggests downgrade on grammar corruption', () => {
    const result = guardOutputText('undefined data object null', 'Safe fallback text here.', 'direction_full');
    expect(result.passed).toBe(false);
    expect(result.text).toBe('Safe fallback text here.');
    expect(result.suggestedDowngrade).toBe('direction_light');
  });
});
