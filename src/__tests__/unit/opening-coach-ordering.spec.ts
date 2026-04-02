import { describe, expect, it } from 'vitest';
import { createSessionCaseState } from '@/lib/fm/case-state';
import { normalizeFirstMinuteDecision } from '@/lib/fm/firstMinuteDecisionNormalizer';
import { deriveOpeningCoachModel } from '@/lib/fm/openingCoach';
import type { IntakeIntelligenceObject } from '@/types/intake';
import { FIXTURE_F1_STRONG_CASE } from '@/__tests__/fixtures/orchestrator-responses';

const BANNED_FRAMEWORK_SURFACE = /\bhinge\b/i;

function makeStrongIntelligence(rawInput: string, pattern: string): IntakeIntelligenceObject {
  return normalizeFirstMinuteDecision(rawInput, {
    ...(FIXTURE_F1_STRONG_CASE as unknown as IntakeIntelligenceObject),
    usable_signal: {
      ...FIXTURE_F1_STRONG_CASE.usable_signal,
      usable_signal: true,
      signal_strength: 'high',
      signal_types: [pattern],
      reason_codes: ['STRONG_TEST_SIGNAL'],
    },
    narrative_pattern: {
      ...FIXTURE_F1_STRONG_CASE.narrative_pattern,
      primary_pattern: pattern,
      secondary_patterns: [],
      reason_codes: ['TEST_PATTERN_SELECTED'],
    },
    recommendation_viability: {
      ...FIXTURE_F1_STRONG_CASE.recommendation_viability,
      decision: 'success',
      reasoning: 'Strong test case ready for opening coach',
      reason_codes: ['TEST_READY'],
    },
  } as unknown as IntakeIntelligenceObject) as IntakeIntelligenceObject;
}

describe('opening coach ordering gates', () => {
  it('puts evidence selection before drafting for the chem reliability opening coach', () => {
    const rawInput = 'I was the fastest student in our AP chem lab section at finishing titration setups. During one lab, a classmate copied my setup and contaminated her sample because I had skipped labeling one transfer step I always did in my head. My teacher said speed was not the same thing as reliability. The next week I built a one-page checklist and made everyone use it before touching the burette. Our failed trials dropped a lot, and I stopped being proud of finishing first.';
    const intake = makeStrongIntelligence(rawInput, 'competence_vs_responsibility');
    const caseState = createSessionCaseState(rawInput, intake);
    const model = deriveOpeningCoachModel(intake, caseState);

    expect(model.helperLine).toMatch(/^Choose the exact line/i);
    expect(model.scaffoldSteps[0]).toMatch(/^Choose the exact line/i);
    expect(model.scaffoldSteps[1]).toMatch(/^Start from that line/i);
    expect(model.nextParagraphInstruction).toMatch(/^Before you draft further/i);
    expect(model.nextParagraphInstruction).toContain('evidence line');

    [model.helperLine, ...model.scaffoldSteps, model.nextParagraphInstruction, model.nextParagraphExpectation].forEach((value) => {
      expect(value).not.toMatch(BANNED_FRAMEWORK_SURFACE);
    });
  });

  it('keeps the translation opening coach evidence-first and human-facing', () => {
    const rawInput = 'I used to think translating for my grandparents at government offices was just a family duty. At one appointment the clerk spoke quickly and I summarized instead of translating line by line so we could finish faster. My grandfather signed a form he did not understand. We had to return the next week to reverse it. Since then I ask officials to pause and I translate every instruction fully even when the line gets longer. That day changed what responsibility sounds like to me.';
    const intake = makeStrongIntelligence(rawInput, 'identity_shift');
    const caseState = createSessionCaseState(rawInput, intake);
    const model = deriveOpeningCoachModel(intake, caseState);

    expect(model.helperLine).toMatch(/^Choose the exact line/i);
    expect(model.scaffoldSteps[0]).toMatch(/^Choose the exact line/i);
    expect(model.nextParagraphInstruction).toMatch(/^Before you draft further/i);
    expect(model.nextParagraphInstruction).toContain('evidence line');

    [model.helperLine, ...model.scaffoldSteps, model.nextParagraphInstruction, model.nextParagraphExpectation].forEach((value) => {
      expect(value).not.toMatch(BANNED_FRAMEWORK_SURFACE);
    });
  });
});