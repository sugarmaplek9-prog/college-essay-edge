import { describe, expect, it } from 'vitest';
import { createSessionCaseState } from '@/lib/fm/case-state';
import { deriveDirectionContent } from '@/lib/fm/direction';
import { deriveOpeningCoachModel } from '@/lib/fm/openingCoach';
import {
  FIXTURE_F1_STRONG_CASE,
  FIXTURE_F3_THIN_RECOVERY,
  FIXTURE_F4_BLOCKED,
} from '@/__tests__/fixtures/orchestrator-responses';

type FixtureCase = {
  name: string;
  intake: any;
  rawInput: string;
};

const CASES: FixtureCase[] = [
  {
    name: 'F1 strong',
    intake: FIXTURE_F1_STRONG_CASE,
    rawInput:
      'I spent three summers volunteering at the hospital, and I thought I was helping. In my third summer, a nurse pulled me aside and said I was just getting in the way. That conversation changed how I think about service.',
  },
  {
    name: 'F3 thin',
    intake: FIXTURE_F3_THIN_RECOVERY,
    rawInput:
      'I like sports but I am not great at them. I kept showing up and started noticing what teammates needed in practice.',
  },
  {
    name: 'F4 blocked',
    intake: FIXTURE_F4_BLOCKED,
    rawInput: 'I am good at everything.',
  },
];

function assertVisibleCopy(value: string, label: string) {
  expect(typeof value).toBe('string');
  expect(value.trim().length, `${label} should not be empty`).toBeGreaterThan(8);
}

describe('first-minute required outputs contract', () => {
  it.each(CASES)('direction and opening outputs stay populated — $name', ({ intake, rawInput }) => {
    const caseState = createSessionCaseState(rawInput, intake);

    const direction = deriveDirectionContent(intake, caseState);
    const opening = deriveOpeningCoachModel(intake, caseState);

    assertVisibleCopy(direction.strongest.title, 'strongest.title');
    assertVisibleCopy(direction.strongest.explanation, 'strongest.explanation');
    assertVisibleCopy(direction.strongest.why_beats_obvious, 'strongest.why_beats_obvious');
    assertVisibleCopy(direction.strongest.next_move, 'strongest.next_move');
    assertVisibleCopy(direction.strongest.focused_question, 'strongest.focused_question');

    expect(direction.strongest.title).not.toBe('The strongest direction in your notes');

    assertVisibleCopy(direction.coach_comparison.weaker_read, 'coach_comparison.weaker_read');
    assertVisibleCopy(direction.coach_comparison.stronger_read, 'coach_comparison.stronger_read');
    assertVisibleCopy(direction.coach_comparison.coach_judgment, 'coach_comparison.coach_judgment');

    expect(direction.compare_alternatives.length).toBeGreaterThanOrEqual(2);
    for (const alt of direction.compare_alternatives) {
      assertVisibleCopy(alt.title, 'compare_alternative.title');
      assertVisibleCopy(alt.subtitle, 'compare_alternative.subtitle');
      assertVisibleCopy(alt.essay_focus, 'compare_alternative.essay_focus');
      assertVisibleCopy(alt.why_it_works_or_loses, 'compare_alternative.why_it_works_or_loses');
    }

    expect(opening.scaffoldSteps.length).toBeGreaterThanOrEqual(3);
    opening.scaffoldSteps.forEach((step, idx) => {
      assertVisibleCopy(step, `opening.scaffoldSteps[${idx}]`);
    });
    assertVisibleCopy(opening.refinementQuestion, 'opening.refinementQuestion');

    expect(opening.antiGenericWarnings.length).toBeGreaterThanOrEqual(3);
    opening.antiGenericWarnings.forEach((warning, idx) => {
      assertVisibleCopy(warning, `opening.antiGenericWarnings[${idx}]`);
    });
  });
});
