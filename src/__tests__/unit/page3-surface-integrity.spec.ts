import { describe, expect, it } from 'vitest';
import { buildCanonicalPage3Payload } from '@/lib/fm/canonicalPage3Payload';
import { createSessionCaseState, normalizeStudentText } from '@/lib/fm/case-state';
import { normalizeFirstMinuteDecision } from '@/lib/fm/firstMinuteDecisionNormalizer';
import { predictEvidenceStrength } from '@/lib/ml/evidenceStrength/predict';
import type { IntakeIntelligenceObject, IntakeSessionInput } from '@/types/intake';
import { FIXTURE_F1_STRONG_CASE } from '@/__tests__/fixtures/orchestrator-responses';

const BANNED_FRAMEWORK_SURFACE = /\b(hinge|new standard|assumption that failed|decision standard|the accountability you accepted|the standard your next action proved)\b/i;
const MALFORMED_REFERENCE_SURFACE = /\bat (I|we|my|our|he|she|they)\b/i;

function normalizeFixture<T extends Record<string, unknown>>(fixture: T): T {
  if ((fixture?.trusted_evidence as Record<string, unknown>)?.trusted_evidence_rank) return fixture;

  return {
    ...fixture,
    trusted_evidence: {
      trusted_evidence_rank: Array.isArray((fixture?.trusted_evidence as Record<string, unknown>)?.ranking)
        ? ((fixture.trusted_evidence as Record<string, unknown>).ranking as Array<{ source_id: string }>).map((item) => item.source_id)
        : [],
      downgraded_sources: [],
      reason_codes: ['STORY_ENTRY_OUTRANKS_POLISHED_DRAFT'],
      meta: (fixture?.trusted_evidence as Record<string, unknown>)?.meta,
    },
  };
}

const BASE_FIXTURE = normalizeFixture(
  FIXTURE_F1_STRONG_CASE as unknown as Record<string, unknown>
) as unknown as IntakeIntelligenceObject;

function makeStrongIntelligence(rawInput: string, pattern: string): IntakeIntelligenceObject {
  return normalizeFirstMinuteDecision(rawInput, {
    ...BASE_FIXTURE,
    usable_signal: {
      ...BASE_FIXTURE.usable_signal,
      usable_signal: true,
      signal_strength: 'high',
      signal_types: [pattern],
      reason_codes: ['STRONG_TEST_SIGNAL'],
    },
    narrative_pattern: {
      ...BASE_FIXTURE.narrative_pattern,
      primary_pattern: pattern,
      secondary_patterns: [],
      reason_codes: ['TEST_PATTERN_SELECTED'],
    },
    recommendation_viability: {
      ...BASE_FIXTURE.recommendation_viability,
      decision: 'success',
      reasoning: 'Strong test case ready for direction generation',
      reason_codes: ['TEST_READY'],
    },
  } as unknown as IntakeIntelligenceObject) as IntakeIntelligenceObject;
}

function makeSessionInput(rawInput: string): IntakeSessionInput {
  return {
    session_id: 'test-session',
    student_user_id: 'test-student',
    subject_entity_id: 'test-subject',
    story_entries: [
      {
        id: 'story-1',
        title: 'Initial notes',
        text: rawInput,
        created_at: new Date('2026-04-01T00:00:00.000Z').toISOString(),
      },
    ],
    draft_text: null,
    draft_id: null,
    school_context: null,
    student_profile: null,
    prior_attempt_count: 0,
    questions_asked: [],
    rejected_source_ids: [],
    session_created_at: new Date('2026-04-01T00:00:00.000Z').toISOString(),
  };
}

function buildPayload(rawInput: string, pattern: string) {
  const normalizedInput = normalizeStudentText(rawInput);
  const intake = makeStrongIntelligence(rawInput, pattern);
  const caseState = createSessionCaseState(normalizedInput, intake);
  const evidenceStrength = predictEvidenceStrength({
    rawInput,
    normalizedInput,
    intelligence: intake,
    sessionCaseState: caseState,
  });

  return buildCanonicalPage3Payload({
    sessionId: 'test-session',
    caseId: 'test-case',
    rawInput,
    normalizedInput,
    intakeInput: makeSessionInput(normalizedInput),
    intake,
    evidenceStrength,
    requestedProductMode: evidenceStrength.route,
    effectiveProductMode: evidenceStrength.route,
    caseState,
  });
}

describe('page 3 surface integrity gates', () => {
  it('fails closed on malformed/framework-heavy page-3 explanation text for the chem reliability case', () => {
    const rawInput = 'I was the fastest student in our AP chem lab section at finishing titration setups. During one lab, a classmate copied my setup and contaminated her sample because I had skipped labeling one transfer step I always did in my head. My teacher said speed was not the same thing as reliability. The next week I built a one-page checklist and made everyone use it before touching the burette. Our failed trials dropped a lot, and I stopped being proud of finishing first.';
    const packet = buildPayload(rawInput, 'competence_vs_responsibility').recommendation_packet;

    expect(packet.essay_about).toContain('someone else had to trust your process');
    expect(packet.next_step).toContain('unlabeled step');
    expect(packet.next_step).toContain('contaminated sample');
    expect(packet.next_step.startsWith('Start with')).toBe(true);
    expect(packet.next_step.startsWith('Open with')).toBe(false);

    [packet.essay_about, packet.why_this_direction, packet.weaker_read, packet.stronger_read, packet.next_step].forEach((value) => {
      expect(value).not.toMatch(BANNED_FRAMEWORK_SURFACE);
      expect(value).not.toMatch(MALFORMED_REFERENCE_SURFACE);
    });
  });

  it('keeps the robotics page-3 next move anchored to the decision and visible cost', () => {
    const rawInput = 'During regionals our robot failed inspection twice, and I told the team to remove an autonomous feature to pass on time. Another programmer argued we should keep it and risk a late match. I overruled him. We qualified but lost our quarterfinal because of manual control mistakes. After the event he said my call protected schedule but ignored our actual strength. I now frame emergency decisions as tradeoffs out loud before choosing.';
    const packet = buildPayload(rawInput, 'conflict_reframe').recommendation_packet;

    expect(packet.essay_about).toContain('cost you could not see at first');
    expect(packet.next_step).toContain('cut autonomous');
    expect(packet.next_step).toContain('quarterfinal cost');
    expect(packet.next_step.startsWith('Start with')).toBe(true);
    expect(packet.next_step.startsWith('Open with')).toBe(false);

    [packet.essay_about, packet.why_this_direction, packet.weaker_read, packet.stronger_read, packet.next_step].forEach((value) => {
      expect(value).not.toMatch(BANNED_FRAMEWORK_SURFACE);
      expect(value).not.toMatch(MALFORMED_REFERENCE_SURFACE);
    });
  });

  it('keeps the translation page-3 next move anchored to the misunderstanding evidence', () => {
    const rawInput = 'I used to think translating for my grandparents at government offices was just a family duty. At one appointment the clerk spoke quickly and I summarized instead of translating line by line so we could finish faster. My grandfather signed a form he did not understand. We had to return the next week to reverse it. Since then I ask officials to pause and I translate every instruction fully even when the line gets longer. That day changed what responsibility sounds like to me.';
    const packet = buildPayload(rawInput, 'identity_shift').recommendation_packet;

    expect(packet.essay_about).toContain('getting through the interaction stopped being enough');
    expect(packet.next_step).toContain('summary you gave');
    expect(packet.next_step).toContain('form your grandfather signed');
    expect(packet.next_step.startsWith('Start with')).toBe(true);
    expect(packet.next_step.startsWith('Open with')).toBe(false);

    [packet.essay_about, packet.why_this_direction, packet.weaker_read, packet.stronger_read, packet.next_step].forEach((value) => {
      expect(value).not.toMatch(BANNED_FRAMEWORK_SURFACE);
      expect(value).not.toMatch(MALFORMED_REFERENCE_SURFACE);
    });
  });
});