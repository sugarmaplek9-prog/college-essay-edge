import { describe, expect, it } from 'vitest';
import { createSessionCaseState } from '@/lib/fm/case-state';
import { deriveDirectionContent } from '@/lib/fm/direction';
import { deriveCoachBehaviorSignals, buildCoachResponse, buildCompareCoachNarrative } from '@/lib/fm/coachBehavior';
import { FIXTURE_F1_STRONG_CASE } from '../fixtures/orchestrator-responses';

describe('coach behavior layer', () => {
  it('escalates when an opening drifts into generic lesson language', () => {
    const rawInput = 'I spent three summers volunteering at the hospital, and I thought I was helping. In my third summer, a nurse pulled me aside and said I was just getting in the way. That conversation changed how I think about service.';
    const caseState = createSessionCaseState(rawInput, FIXTURE_F1_STRONG_CASE);
    const strongest = deriveDirectionContent(FIXTURE_F1_STRONG_CASE, caseState).strongest;

    const signals = deriveCoachBehaviorSignals({
      stage: 'opening',
      intake: FIXTURE_F1_STRONG_CASE,
      strongest,
      caseState,
      draftText: 'I learned that leadership and service matter because this experience made me realize who I want to be.',
    });

    expect(signals.genericness_risk).toBe('high');
    expect(signals.coach_escalation_level).toBe('high');
    expect(signals.correction_target).toBe('resume_language');
    expect(signals.coach_intervention_type).toContain('reject');
  });

  it('builds a crisp corrective response instead of vague feedback', () => {
    const rawInput = 'I spent three summers volunteering at the hospital, and I thought I was helping. In my third summer, a nurse pulled me aside and said I was just getting in the way. That conversation changed how I think about service.';
    const caseState = createSessionCaseState(rawInput, FIXTURE_F1_STRONG_CASE);
    const strongest = deriveDirectionContent(FIXTURE_F1_STRONG_CASE, caseState).strongest;
    const signals = deriveCoachBehaviorSignals({
      stage: 'opening',
      intake: FIXTURE_F1_STRONG_CASE,
      strongest,
      caseState,
      draftText: 'This taught me that helping people is important.',
    });

    const response = buildCoachResponse(signals, strongest, caseState);

    expect(response.diagnosis).not.toMatch(/deeper|authentic/i);
    expect(response.instruction).toMatch(/scene|moment|exact/i);
  });

  it('renders compare narratives with explicit weaker-vs-stronger discrimination', () => {
    const rawInput = 'I spent three summers volunteering at the hospital, and I thought I was helping. In my third summer, a nurse pulled me aside and said I was just getting in the way. That conversation changed how I think about service.';
    const caseState = createSessionCaseState(rawInput, FIXTURE_F1_STRONG_CASE);
    const direction = deriveDirectionContent(FIXTURE_F1_STRONG_CASE, caseState);
    const strongest = direction.compare_alternatives.find((entry) => entry.is_strongest);
    const weaker = direction.compare_alternatives.find((entry) => !entry.is_strongest);

    expect(strongest).toBeDefined();
    expect(weaker).toBeDefined();

    const strongerNarrative = buildCompareCoachNarrative(
      strongest!,
      direction.strongest.write_first_steps[0]
    );
    const weakerNarrative = buildCompareCoachNarrative(
      weaker!,
      direction.strongest.write_first_steps[0]
    );

    expect(strongerNarrative.diagnosis).toMatch(/survives pressure|turning point/i);
    expect(weakerNarrative.diagnosis).toMatch(/fails|familiar/i);
    expect(weakerNarrative.mistake).toMatch(/mistake|broad framing/i);
  });
});