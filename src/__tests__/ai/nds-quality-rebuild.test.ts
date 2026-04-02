import { describe, expect, it } from 'vitest';
import { buildNdsNormalizedContextPack } from '@/lib/ai/modules/narrative-direction-selection/normalize-context';
import { evaluateNdsReadiness } from '@/lib/ai/modules/narrative-direction-selection/readiness';
import { executeNdsModule } from '@/lib/ai/modules/narrative-direction-selection/module-executor';
import { validateNdsOutput } from '@/lib/ai/modules/narrative-direction-selection/validator';
import type { NdsResolvedSources } from '@/types/ai';

function makeSources(overrides: Partial<NdsResolvedSources> = {}): NdsResolvedSources {
  return {
    essay_project: {
      id: 'proj-rb-1',
      student_user_id: 'user-rb-1',
      title: 'Rebuild project',
      status: 'not_started',
      selected_direction_artifact_id: null,
    },
    student_profile: {
      user_id: 'user-rb-1',
      first_name: 'Ari',
      last_name: 'Kim',
      grade: 12,
      interests: ['robotics', 'service'],
    },
    story_entries: [
      {
        id: 'story-rb-1',
        title: 'Robotics conflict',
        body:
          'I initially handled conflict poorly, then adapted after feedback. The turning point came when I stopped proving I was right and started helping my team decide together.',
        category: 'activity',
      },
    ],
    current_draft: {
      id: 'draft-rb-1',
      draft_text:
        'My draft currently over-focuses on achievements. I want to show how my role changed after a team breakdown.',
      version_number: 1,
    },
    school_context: null,
    source_meta: {
      story_entry_count: 1,
      has_current_draft: true,
      has_school_context: false,
    },
    ...overrides,
  };
}

describe('NDS quality rebuild — readiness calibration', () => {
  it('prefers reduced_scope over needs_more_input when at least one usable signal exists', () => {
    const context = buildNdsNormalizedContextPack(makeSources());
    const readiness = evaluateNdsReadiness(context);

    expect(readiness.execution_mode).not.toBe('needs_more_input');
    expect(['standard', 'reduced_scope']).toContain(readiness.execution_mode);
  });

  it('still routes to needs_more_input on truly empty context', () => {
    const context = buildNdsNormalizedContextPack(
      makeSources({ story_entries: [], current_draft: null })
    );
    const readiness = evaluateNdsReadiness(context);

    expect(readiness.execution_mode).toBe('needs_more_input');
  });
});

describe('NDS quality rebuild — depth and premium contract', () => {
  it('executor emits upgraded depth fields for success outputs', async () => {
    const context = buildNdsNormalizedContextPack(makeSources());

    const output = await executeNdsModule({
      run_id: 'run-rb-1',
      module_key: 'narrative_direction_selection',
      execution_mode: 'standard',
      context_pack: context,
      module_versions: {
        prompt_version: 'v1',
        schema_version: 'v1',
        validator_version: 'v1',
      },
    });

    const payload = output.candidate_payload as Record<string, unknown>;
    expect(payload.status).toBe('success');

    const best = payload.best_direction as Record<string, unknown>;
    expect(typeof best.angle_title).toBe('string');
    expect(typeof best.core_claim).toBe('string');
    expect(typeof best.why_this_is_the_real_story).toBe('string');
    expect(typeof best.why_it_beats_the_obvious_angle).toBe('string');

    const depthSignals = payload.depth_signals as Record<string, unknown>;
    const nonNullSignals = Object.values(depthSignals).filter(
      (v) => typeof v === 'string' && v.trim().length > 0
    );
    expect(nonNullSignals.length).toBeGreaterThan(0);

    const alternatives = payload.alternatives as Array<Record<string, unknown>>;
    expect(alternatives.length).toBeGreaterThanOrEqual(2);
  });

  it('executor emits live scoring debug packet with candidate scores and route decision', async () => {
    const context = buildNdsNormalizedContextPack(makeSources());

    const output = await executeNdsModule({
      run_id: 'run-rb-scoring-1',
      module_key: 'narrative_direction_selection',
      execution_mode: 'standard',
      context_pack: context,
      module_versions: {
        prompt_version: 'v1',
        schema_version: 'v1',
        validator_version: 'v1',
      },
    });

    const payload = output.candidate_payload as Record<string, unknown>;
    expect(payload.status).toBe('success');
    expect(payload.selected_candidate_id).toBe('direction_1');
    expect(payload.confidence_band).toBeTruthy();
    expect(payload.route_decision).toBe('show_strongest_direction');

    const candidates = payload.candidates as Array<Record<string, unknown>>;
    // With the recommended-direction rule lock, at least one survivor must
    // remain and it must pass source-anchor + anti-repeatability checks.
    expect(candidates.length).toBeGreaterThanOrEqual(1);

    const survivingIds = candidates.map((candidate) => candidate.candidate_id);
    // direction_1 must be selected winner (highest score, axis-true)
    expect(survivingIds[0]).toBe('direction_1');
    // direction_2 (soft-meta competence frame) must NOT survive
    expect(survivingIds).not.toContain('direction_2');

    for (const candidate of candidates.slice(0, 2)) {
      const scores = candidate.scores as Record<string, unknown>;
      expect(typeof scores.total_score).toBe('number');
      expect(typeof scores.student_specificity).toBe('number');
      expect(typeof scores.evidence_grounding).toBe('number');
    }

    const rejectedCandidates = payload.rejected_candidates as Array<Record<string, unknown>>;
    // direction_2 (meta_label_reject) and direction_4 (generic_angle) must be rejected.
    // At least one rejection should include the rule-lock failure reason.
    expect(rejectedCandidates.length).toBeGreaterThanOrEqual(2);
    const rejectedIds = rejectedCandidates.map((r) => r.candidate_id);
    expect(rejectedIds).toContain('direction_2');
    expect(rejectedIds).toContain('direction_4');
    const dir2Rejection = rejectedCandidates.find((r) => r.candidate_id === 'direction_2');
    expect((dir2Rejection?.rejection_reasons as string[]).length).toBeGreaterThan(0);
    const dir4Rejection = rejectedCandidates.find((r) => r.candidate_id === 'direction_4');
    expect(dir4Rejection?.rejection_reasons).toContain('generic_angle');

    const debugPacket = payload.scoring_debug as Record<string, unknown>;
    expect(debugPacket.generated_candidate_count).toBeGreaterThanOrEqual(4);
    expect(debugPacket.surviving_candidate_count).toBe(candidates.length);
    expect(debugPacket.selected_candidate_id).toBe('direction_1');
    expect(debugPacket.confidence_band).toBe(payload.confidence_band);
    expect(debugPacket.route_decision).toBe(payload.route_decision);

    const rankings = debugPacket.candidate_rankings as Array<Record<string, unknown>>;
    expect(rankings).toHaveLength(candidates.length);
    expect(rankings[0]).toMatchObject({
      candidate_id: 'direction_1',
      rank: 1,
    });
  });

  it('validator rejects low-value next move and missing depth signals', () => {
    const weakPayload = {
      status: 'success',
      best_direction: {
        id: 'direction_1',
        angle_title: 'Strong angle',
        core_claim: 'A concrete claim with enough length and context to pass basic checks.',
        why_this_is_the_real_story:
          'This explanation is specific enough and not generic; it ties to a concrete shift under pressure and social consequences.',
        what_it_reveals_about_the_student: 'Shows revision of judgment in public.',
        why_it_beats_the_obvious_angle: 'This beats the obvious angle by centering change over achievements.',
        main_risk_if_written_poorly: 'Could become broad values prose.',
        next_move: 'Draft a paragraph.',
      },
      alternatives: [
        {
          id: 'direction_2',
          angle_title: 'Alt',
          what_this_angle_would_focus_on: 'A different focus',
          why_it_is_weaker: 'Weaker because less transformation',
          failure_mode: 'Could be generic',
        },
      ],
      evidence_anchors: [{ label: 'Story', source_type: 'story_entry', source_id: 'story-rb-1' }],
      depth_signals: {
        detected_tension: null,
        detected_shift: null,
        obvious_but_weaker_angle: null,
        essay_opportunity: null,
      },
      recovery_question: null,
    };

    const result = validateNdsOutput(weakPayload);
    expect(result.semanticPass).toBe(false);
    expect(result.failureCodes).toContain('nds.semantic.missing_depth_signal_content');
  });

  it('validator rejects alternatives that are not functionally distinct', () => {
    const payload = {
      status: 'success',
      best_direction: {
        id: 'direction_1',
        angle_title: 'Identity revision angle',
        core_claim: 'A claim with enough depth and specificity to satisfy semantic length expectations in validation.',
        why_this_is_the_real_story:
          'The real story is the internal shift in judgment after friction, not the visible accomplishment line item.',
        what_it_reveals_about_the_student: 'Shows ability to revise beliefs under pressure.',
        why_it_beats_the_obvious_angle: 'The obvious angle is achievement recap; this one foregrounds transformation.',
        main_risk_if_written_poorly: 'Could lose tension if summarized too broadly.',
        next_move:
          'Write the hinge scene, add two observable details proving the shift, and remove lines that do not support the transformation claim.',
      },
      alternatives: [
        {
          id: 'direction_2',
          angle_title: 'Alternative A',
          what_this_angle_would_focus_on: 'Topic A',
          why_it_is_weaker: 'Same reason',
          failure_mode: 'Same failure',
        },
        {
          id: 'direction_3',
          angle_title: 'Alternative B',
          what_this_angle_would_focus_on: 'Topic B',
          why_it_is_weaker: 'Same reason',
          failure_mode: 'Same failure',
        },
      ],
      evidence_anchors: [{ label: 'Story', source_type: 'story_entry', source_id: 'story-rb-1' }],
      depth_signals: {
        detected_tension: 'Tension',
        detected_shift: 'Shift',
        obvious_but_weaker_angle: 'Obvious angle',
        essay_opportunity: 'Opportunity',
      },
      recovery_question: null,
    };

    const result = validateNdsOutput(payload);
    expect(result.semanticPass).toBe(false);
    expect(result.failureCodes).toContain('nds.semantic.alternatives_not_functionally_distinct');
  });
});
