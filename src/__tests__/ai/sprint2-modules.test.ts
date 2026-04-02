import { describe, it, expect } from 'vitest';
import { buildNdsNormalizedContextPack } from '@/lib/ai/modules/narrative-direction-selection/normalize-context';
import { evaluateNdsReadiness } from '@/lib/ai/modules/narrative-direction-selection/readiness';
import { buildNdsPromptV1 } from '@/lib/ai/modules/narrative-direction-selection/prompt-builder';
import { validateNdsSemantic, validateNdsStructural } from '@/lib/ai/modules/narrative-direction-selection/validator';
import {
  executeNdsModule,
  NDS_PROVIDER_PATH_CLASSIFICATION,
  getNdsProviderReadinessState,
} from '@/lib/ai/modules/narrative-direction-selection/module-executor';
import { buildSubjectLinksFromResolvedSources } from '@/lib/ai/modules/narrative-direction-selection/source-resolution';
import type { NdsResolvedSources, NdsPayload } from '@/types/ai';

function makeSources(overrides: Partial<NdsResolvedSources> = {}): NdsResolvedSources {
  return {
    essay_project: {
      id: 'proj-1',
      student_user_id: 'user-1',
      title: 'Essay Project',
      status: 'not_started',
      selected_direction_artifact_id: null,
    },
    student_profile: {
      user_id: 'user-1',
      first_name: 'Sam',
      last_name: 'Lee',
      grade: 11,
      interests: ['robotics'],
    },
    story_entries: [
      {
        id: 'story-1',
        title: 'Robotics failure',
        body: 'I failed our first robotics qualifier, rebuilt the drivetrain, and learned to ask for help while leading the team.',
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
    ...overrides,
  };
}

describe('Sprint 2 context + readiness', () => {
  it('builds normalized context pack with bounded story signals', () => {
    const contextPack = buildNdsNormalizedContextPack(makeSources());
    expect(contextPack.story_signals.length).toBe(1);
    expect(contextPack.subject.entity_type).toBe('essay_project');
  });

  it('collapses duplicate story signals during normalization', () => {
    const duplicateBody =
      'I failed our first robotics qualifier, rebuilt the drivetrain, and learned to ask for help while leading the team.';

    const contextPack = buildNdsNormalizedContextPack(
      makeSources({
        story_entries: [
          {
            id: 'story-1',
            title: 'Robotics failure A',
            body: duplicateBody,
            category: 'activity',
          },
          {
            id: 'story-2',
            title: 'Robotics failure B',
            body: duplicateBody,
            category: 'activity',
          },
        ],
      })
    );

    expect(contextPack.story_signals).toHaveLength(1);
  });

  it('returns insufficient_input when no story signals', () => {
    const contextPack = buildNdsNormalizedContextPack(makeSources({ story_entries: [] }));
    const readiness = evaluateNdsReadiness(contextPack);
    expect(readiness.readiness_state).toBe('insufficient_input');
    expect(readiness.execution_mode).toBe('needs_more_input');
  });
});

describe('Sprint 2 prompt + validator contracts', () => {
  it('builds v1 prompt package for standard mode', () => {
    const contextPack = buildNdsNormalizedContextPack(makeSources());
    const prompt = buildNdsPromptV1(contextPack, 'standard');
    expect(prompt.bundleVersion).toContain('v1');
    expect(prompt.userPrompt).toContain('Story Signals');
    expect(prompt.userPrompt).toContain('Execution mode: standard');
  });

  it('builds v1 prompt package for reduced_scope mode', () => {
    const contextPack = buildNdsNormalizedContextPack(makeSources());
    const prompt = buildNdsPromptV1(contextPack, 'reduced_scope');
    expect(prompt.userPrompt).toContain('Execution mode: reduced_scope');
  });

  it('builds v1 prompt package for needs_more_input mode', () => {
    const contextPack = buildNdsNormalizedContextPack(makeSources({ story_entries: [] }));
    const prompt = buildNdsPromptV1(contextPack, 'needs_more_input');
    expect(prompt.userPrompt).toContain('Execution mode: needs_more_input');
  });

  it('splits structural and semantic validation', () => {
    const payload: NdsPayload = {
      status: 'success',
      best_direction: {
        id: 'direction_1',
        angle_title: 'Robotics growth arc',
        core_claim: 'Strong direction grounded in a concrete turning point with reflection and visible behavior change.',
        why_this_is_the_real_story: 'Specific and evidence-backed: the shift is interpretive, not just outcome-based.',
        what_it_reveals_about_the_student: 'Shows leadership through revised judgment after failure.',
        why_it_beats_the_obvious_angle: 'Beats the obvious achievement angle by centering internal revision.',
        main_risk_if_written_poorly: 'Could feel technical unless emotional stakes are foregrounded.',
        next_move: 'Write the scene where the failure changed your leadership style, then include two observed details proving the shift.',
      },
      alternatives: [
        {
          id: 'direction_2',
          angle_title: 'Competence-first angle',
          what_this_angle_would_focus_on: 'Execution quality and outcomes.',
          why_it_is_weaker: 'Less interpretive depth.',
          failure_mode: 'May become task summary.',
        },
      ],
      evidence_anchors: [{ label: 'robotics', source_type: 'story_entry', source_id: 'story-1' }],
      depth_signals: {
        detected_tension: 'Performance vs self-revision.',
        detected_shift: 'Failure to collaborative leadership.',
        obvious_but_weaker_angle: 'Achievement recap',
        essay_opportunity: 'Use turning-point scene as hinge.',
      },
      recovery_question: null,
    };

    const structural = validateNdsStructural(payload as unknown as Record<string, unknown>);
    const semantic = validateNdsSemantic(payload);

    expect(structural.structural_pass).toBe(true);
    expect(semantic.semantic_pass).toBe(true);
  });
});

describe('Sprint 2 module executor', () => {
  it('classifies provider path as deterministic stub for internal verification', () => {
    expect(NDS_PROVIDER_PATH_CLASSIFICATION).toBe('deterministic_stub');
    expect(getNdsProviderReadinessState()).toBe('internal_verification_only');
  });

  it('returns needs_more_input payload in needs_more_input mode', async () => {
    const contextPack = buildNdsNormalizedContextPack(makeSources({ story_entries: [] }));
    const output = await executeNdsModule({
      run_id: 'run-1',
      module_key: 'narrative_direction_selection',
      execution_mode: 'needs_more_input',
      context_pack: contextPack,
      module_versions: {
        prompt_version: 'v1',
        schema_version: 'v1',
        validator_version: 'v1',
      },
    });

    expect(output.candidate_payload.status).toBe('needs_more_input');
  });
});

describe('Sprint 2 provenance link persistence payloads', () => {
  it('builds subject-link rows from actual resolved sources', () => {
    const links = buildSubjectLinksFromResolvedSources('artifact-1', makeSources({
      current_draft: {
        id: 'draft-1',
        draft_text: 'Draft content',
        version_number: 1,
      },
      school_context: {
        source_id: 'school-ctx-1',
        target_school: 'State U',
        signal_summary: 'Context signal',
      },
      story_entries: [
        {
          id: 'story-1',
          title: 'Story one',
          body: 'Body one with reflective change signal.',
          category: 'activity',
        },
        {
          id: 'story-2',
          title: 'Story two',
          body: 'Body two with another reflective change signal.',
          category: 'service',
        },
      ],
    }));

    expect(links.some((l: { link_role: string }) => l.link_role === 'primary_subject')).toBe(true);
    expect(links.filter((l: { link_role: string }) => l.link_role === 'evidence_source')).toHaveLength(2);
    expect(
      links.some(
        (l: { linked_entity_type: string }) => l.linked_entity_type === 'essay_draft_version'
      )
    ).toBe(true);
    expect(links.some((l: { link_role: string }) => l.link_role === 'school_context')).toBe(true);
  });
});
