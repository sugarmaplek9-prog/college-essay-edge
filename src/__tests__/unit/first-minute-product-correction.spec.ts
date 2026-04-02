import { describe, expect, it } from 'vitest';
import { deriveReflectionContent } from '@/lib/fm/observations';
import { deriveDirectionContent } from '@/lib/fm/direction';
import { createSessionCaseState } from '@/lib/fm/case-state';
import {
  FIXTURE_F1_STRONG_CASE,
  FIXTURE_F3_THIN_RECOVERY,
} from '../fixtures/orchestrator-responses';

function normalizeFixture<T extends Record<string, any>>(fixture: T): T {
  if (fixture?.trusted_evidence?.trusted_evidence_rank) return fixture;

  return {
    ...fixture,
    trusted_evidence: {
      trusted_evidence_rank: Array.isArray(fixture?.trusted_evidence?.ranking)
        ? fixture.trusted_evidence.ranking.map((item: { source_id: string }) => item.source_id)
        : [],
      downgraded_sources: [],
      reason_codes: ['STORY_ENTRY_OUTRANKS_POLISHED_DRAFT'],
      meta: fixture?.trusted_evidence?.meta,
    },
  };
}

describe('First-minute product correction contracts', () => {
  it('reflection content is exactly 2-3 plain observations without labeled mini-analysis', () => {
    const reflection = deriveReflectionContent(normalizeFixture(FIXTURE_F1_STRONG_CASE as any));
    const combined = reflection.observations.join(' ').toLowerCase();

    expect(reflection.observations.length).toBeGreaterThanOrEqual(2);
    expect(reflection.observations.length).toBeLessThanOrEqual(3);
    expect(reflection.observations.every((item: string) => item.length > 20)).toBe(true);

    const bannedPhrases = [
      "i'm seeing",
      'we detected',
      'narrative pattern identified',
      'confidence score',
      'model',
      'ai analysis',
    ];

    for (const phrase of bannedPhrases) {
      expect(combined.includes(phrase)).toBe(false);
    }
  });

  it('direction content answers actionability questions with concrete sections', () => {
    const intake = normalizeFixture(FIXTURE_F1_STRONG_CASE as any);
    const caseState = createSessionCaseState(
      'I spent three summers volunteering at the hospital, and I thought I was helping. In my third summer, a nurse pulled me aside and said I was just getting in the way. That conversation changed how I think about service.',
      intake
    );
    const direction = deriveDirectionContent(intake, caseState);
    const strongest = direction.strongest;

    expect(strongest.title.length).toBeGreaterThan(5);
    expect(strongest.explanation.length).toBeGreaterThan(25);
    expect(strongest.essay_about.length).toBeGreaterThan(45);
    expect(strongest.write_first_steps.length).toBe(3);
    expect(strongest.write_first_steps.every((step: string) => step.length > 20)).toBe(true);
    expect(strongest.avoid_lines.length).toBeGreaterThanOrEqual(3);
    expect(strongest.avoid_lines.every((line: string) => line.toLowerCase().includes('do not'))).toBe(true);
    expect(strongest.write_next_steps.length).toBe(3);
    expect(strongest.focused_question.endsWith('?')).toBe(true);
    expect(strongest.draft_opening_seed.length).toBeGreaterThan(80);
    expect(strongest.primary_cta_label).toBe('Draft my opening now');
    expect(strongest.secondary_cta_label).toBe('Help me sharpen the moment first');
    expect(strongest.tertiary_cta_label).toBe('Show me what the weaker version would do');
  });

  it('compare content makes the stronger and weaker versions concrete', () => {
    const direction = deriveDirectionContent(normalizeFixture(FIXTURE_F1_STRONG_CASE as any));
    const strongest = direction.compare_alternatives.find((item: any) => item.is_strongest);
    const weaker = direction.compare_alternatives.find((item: any) => !item.is_strongest);

    expect(strongest).toBeDefined();
    expect(weaker).toBeDefined();
    expect(strongest?.essay_focus.length).toBeGreaterThan(20);
    expect(strongest?.how_it_would_likely_start.length).toBeGreaterThan(15);
    expect(weaker?.why_it_works_or_loses.toLowerCase()).toContain('loses');
    expect(weaker?.risk_if_written_this_way.length).toBeGreaterThan(20);
  });

  it('recovery-case direction still gives concrete next-step guidance after clarification', () => {
    const direction = deriveDirectionContent(normalizeFixture(FIXTURE_F3_THIN_RECOVERY as any));
    expect(direction.strongest.next_move.toLowerCase()).toContain('answer this');
    expect(direction.strongest.explanation.length).toBeGreaterThan(20);
  });
});
