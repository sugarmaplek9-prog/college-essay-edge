import { describe, expect, it } from 'vitest';
import { createSessionCaseState } from '@/lib/fm/case-state';
import { deriveOpeningCoachModel } from '@/lib/fm/openingCoach';
import { FIXTURE_F1_STRONG_CASE } from '../fixtures/orchestrator-responses';

describe('deriveOpeningCoachModel', () => {
  it('returns interpretive page-4 guidance without prefilled worksheet lines for a strong case', () => {
    const rawInput = 'I spent three summers volunteering at the hospital, and I thought I was helping. In my third summer, a nurse pulled me aside and said I was just getting in the way. That conversation changed how I think about service.';
    const caseState = createSessionCaseState(rawInput, FIXTURE_F1_STRONG_CASE);

    const model = deriveOpeningCoachModel(FIXTURE_F1_STRONG_CASE, caseState);

    expect(model.scaffoldSteps).toHaveLength(4);
    expect(model.helperLine).not.toBe('Write the first four lines.');
    expect(model.initialDraft).not.toContain('Then [what interrupted that routine].');
    expect(model.initialDraft).not.toContain('So I chose to [what you did next].');
    expect(model.nextParagraphInstruction.length).toBeGreaterThan(20);
    expect(model.initialDraft.trim().length).toBeGreaterThan(0);
    expect(model.antiGenericWarnings.length).toBeGreaterThanOrEqual(4);
    expect(model.refinementQuestion.trim().length).toBeGreaterThan(8);
  });

  it('falls back to a generic but actionable scaffold without case state', () => {
    const model = deriveOpeningCoachModel(FIXTURE_F1_STRONG_CASE, null);

    expect(model.starterLine).toBeNull();
    expect(model.scaffoldSteps[0]).toContain('Choose the exact line that carries the pressure');
    expect(model.initialDraft).toContain('I was [what you were doing just before the shift].');
    expect(model.antiGenericWarnings).toContain('Stay in the scene first.');
  });
});