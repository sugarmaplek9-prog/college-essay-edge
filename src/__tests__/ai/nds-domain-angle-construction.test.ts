import { describe, expect, it } from 'vitest';
import { buildNdsNormalizedContextPack } from '@/lib/ai/modules/narrative-direction-selection/normalize-context';
import { executeNdsModule } from '@/lib/ai/modules/narrative-direction-selection/module-executor';
import type { NdsResolvedSources } from '@/types/ai';

function makeSources(storyBody: string): NdsResolvedSources {
  return {
    essay_project: {
      id: 'proj-domain-1',
      student_user_id: 'user-domain-1',
      title: 'Domain angle test',
      status: 'not_started',
      selected_direction_artifact_id: null,
    },
    student_profile: {
      user_id: 'user-domain-1',
      first_name: 'Case',
      last_name: 'Tester',
      grade: 12,
      interests: ['community', 'growth'],
    },
    story_entries: [
      {
        id: 'story-1',
        title: 'Story 1',
        body: storyBody,
        category: 'activity',
      },
    ],
    current_draft: null,
    school_context: null,
    source_meta: {
      story_entry_count: 1,
      has_current_draft: false,
      has_school_context: false,
    },
  };
}

describe('NDS Step 2 domain-specific angle construction', () => {
  it('derives case-specific domain signals in normalization', () => {
    const debate = buildNdsNormalizedContextPack(
      makeSources(
        'Debate conflict: I initially handled this situation poorly, then adapted my approach after feedback. That was the moment I realized it affected others.'
      )
    );
    const clinic = buildNdsNormalizedContextPack(
      makeSources(
        'Community clinic volunteer: I initially handled this situation poorly, then adapted my approach after feedback. That was the moment I realized it affected patients.'
      )
    );
    const tutoring = buildNdsNormalizedContextPack(
      makeSources(
        'Peer tutoring growth: I initially handled this situation poorly, then adapted my approach after feedback. That was the moment I realized it affected others.'
      )
    );

    expect(debate.story_signals[0].domain_signal.situational_domain).toBe('debate_conflict');
    expect(clinic.story_signals[0].domain_signal.situational_domain).toBe('community_care');
    expect(tutoring.story_signals[0].domain_signal.situational_domain).toBe('peer_teaching');

    expect(debate.story_signals[0].domain_signal.likely_human_stakes.length).toBeGreaterThan(20);
    expect(clinic.story_signals[0].domain_signal.interpretive_opportunity.length).toBeGreaterThan(20);
  });

  it('uses domain signals to generate non-interchangeable angle titles/core claims', async () => {
    const debatePack = buildNdsNormalizedContextPack(
      makeSources(
        'Debate conflict: I initially handled this situation poorly, then adapted my approach after feedback. That was the moment I realized it affected others.'
      )
    );
    const clinicPack = buildNdsNormalizedContextPack(
      makeSources(
        'Community clinic volunteer: I initially handled this situation poorly, then adapted my approach after feedback. That was the moment I realized it affected patients.'
      )
    );
    const tutoringPack = buildNdsNormalizedContextPack(
      makeSources(
        'Peer tutoring growth: I initially handled this situation poorly, then adapted my approach after feedback. That was the moment I realized it affected others.'
      )
    );

    const debateOut = await executeNdsModule({
      run_id: 'run-debate',
      module_key: 'narrative_direction_selection',
      execution_mode: 'standard',
      context_pack: debatePack,
      module_versions: { prompt_version: 'v1', schema_version: 'v1', validator_version: 'v1' },
    });

    const clinicOut = await executeNdsModule({
      run_id: 'run-clinic',
      module_key: 'narrative_direction_selection',
      execution_mode: 'standard',
      context_pack: clinicPack,
      module_versions: { prompt_version: 'v1', schema_version: 'v1', validator_version: 'v1' },
    });

    const tutoringOut = await executeNdsModule({
      run_id: 'run-tutoring',
      module_key: 'narrative_direction_selection',
      execution_mode: 'standard',
      context_pack: tutoringPack,
      module_versions: { prompt_version: 'v1', schema_version: 'v1', validator_version: 'v1' },
    });

    const debateBest = (debateOut.candidate_payload as any).best_direction;
    const clinicBest = (clinicOut.candidate_payload as any).best_direction;
    const tutoringBest = (tutoringOut.candidate_payload as any).best_direction;

    expect(debateBest.angle_title).toContain('argument');
    expect(clinicBest.angle_title).toContain('clinic');
    expect(tutoringBest.angle_title).toContain('tutoring');

    expect(debateBest.angle_title).not.toBe(clinicBest.angle_title);
    expect(clinicBest.angle_title).not.toBe(tutoringBest.angle_title);
    expect(debateBest.core_claim).not.toBe(clinicBest.core_claim);
  });
});
