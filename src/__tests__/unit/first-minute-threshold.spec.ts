import { describe, expect, it } from 'vitest';
import { normalizeFirstMinuteDecision } from '@/lib/fm/firstMinuteDecisionNormalizer';
import { predictEvidenceStrength } from '@/lib/ml/evidenceStrength/predict';
import { createSessionCaseState } from '@/lib/fm/case-state';
import {
  FIXTURE_F3_THIN_RECOVERY,
  FIXTURE_F4_BLOCKED,
} from '../fixtures/orchestrator-responses';
import type { IntakeIntelligenceObject } from '@/types/intake';

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

const F3 = normalizeFixture(FIXTURE_F3_THIN_RECOVERY as unknown as Record<string, unknown>) as unknown as IntakeIntelligenceObject;
const F4 = normalizeFixture(FIXTURE_F4_BLOCKED as unknown as Record<string, unknown>) as unknown as IntakeIntelligenceObject;

describe('first-minute threshold tuning', () => {
  it('routes borderline-thin but plausible input to clarification', () => {
    const rawInput = 'I like sports but I am not great at them.';

    const blockedButRecoverable = {
      ...F4,
      authorship_signal: {
        ...F4.authorship_signal,
        contamination_risk: 'low',
        student_scene_evidence: 'weak',
      },
      usable_signal: {
        ...F4.usable_signal,
        usable_signal: true,
      },
      recommendation_viability: {
        ...F4.recommendation_viability,
        decision: 'blocked',
      },
      escalation: {
        ...F4.escalation,
        blocking: true,
      },
    } as IntakeIntelligenceObject;

    const normalized = normalizeFirstMinuteDecision(rawInput, blockedButRecoverable);

    expect(normalized.recommendation_viability.decision).toBe('needs_more_input');
    expect(normalized.escalation.blocking).toBe(false);

    const state = createSessionCaseState(rawInput, normalized);
    const prediction = predictEvidenceStrength({
      rawInput,
      normalizedInput: rawInput,
      intelligence: normalized,
      sessionCaseState: state,
    });

    expect(prediction.route).toBe('clarification');
  });

  it('keeps generic self-praise blocked', () => {
    const rawInput = 'I am good at everything.';

    const normalized = normalizeFirstMinuteDecision(rawInput, F3);

    expect(normalized.recommendation_viability.decision).toBe('blocked');
    expect(normalized.escalation.blocking).toBe(true);

    const prediction = predictEvidenceStrength({
      rawInput,
      normalizedInput: rawInput,
      intelligence: normalized,
      sessionCaseState: null,
    });

    expect(prediction.route).toBe('blocked');
  });

  it('does not hard-block concrete pivot input that mentions generic leadership language', () => {
    const rawInput = 'I mentor new peer counselors. I used to think giving direct advice was efficient, but one student repeated my words without changing anything. I shifted to asking them to map consequences before choosing. I have scenes, but I keep writing generic leadership language.';

    const needsMoreInputButRecoverable = {
      ...F4,
      authorship_signal: {
        ...F4.authorship_signal,
        contamination_risk: 'low',
        student_scene_evidence: 'absent',
      },
      usable_signal: {
        ...F4.usable_signal,
        usable_signal: false,
        signal_strength: 'none',
      },
      recommendation_viability: {
        ...F4.recommendation_viability,
        decision: 'needs_more_input',
      },
      escalation: {
        ...F4.escalation,
        blocking: false,
      },
    } as IntakeIntelligenceObject;

    const normalized = normalizeFirstMinuteDecision(rawInput, needsMoreInputButRecoverable);

    expect(normalized.recommendation_viability.decision).toBe('success');
    expect(normalized.escalation.blocking).toBe(false);

    const state = createSessionCaseState(rawInput, normalized);
    const prediction = predictEvidenceStrength({
      rawInput,
      normalizedInput: rawInput,
      intelligence: normalized,
      sessionCaseState: state,
    });

    expect(prediction.route).not.toBe('blocked');
  });
});
