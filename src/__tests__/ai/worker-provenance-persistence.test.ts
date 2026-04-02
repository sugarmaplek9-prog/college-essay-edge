import { beforeEach, describe, expect, it, vi } from 'vitest';

const linksInsertSpy = vi.fn();

vi.mock('@/lib/supabase/server', () => {
  const aiRunRow = {
    id: 'run-1',
    module_id: 'module-1',
    student_user_id: 'user-1',
    trigger_type: 'user_action',
    subject_entity_type: 'essay_project',
    subject_entity_id: 'proj-1',
    execution_mode: 'standard',
    readiness_state: 'ready',
    status: 'queued',
    retry_count: 0,
    fallback_applied: false,
    fallback_reason_code: null,
    provider_key: null,
    model_key: null,
    prompt_bundle_version_id: null,
    schema_version_id: null,
    validator_version_id: null,
    started_at: null,
    completed_at: null,
    created_at: new Date().toISOString(),
  };

  const db = {
    from: (table: string) => {
      if (table === 'ai_runs') {
        return {
          select: () => ({
            eq: () => ({
              single: async () => ({ data: aiRunRow, error: null }),
            }),
          }),
          update: () => ({
            eq: async () => ({ error: null }),
          }),
        };
      }

      if (table === 'ai_artifacts') {
        const chain: {
          eq: () => typeof chain;
        } = {
          eq: () => chain,
        };

        return {
          update: () => chain,
          insert: () => ({
            select: () => ({
              single: async () => ({ data: { id: 'artifact-1' }, error: null }),
            }),
          }),
        };
      }

      if (table === 'artifact_subject_links') {
        return {
          insert: async (rows: unknown[]) => {
            linksInsertSpy(rows);
            return { error: null };
          },
        };
      }

      if (table === 'validator_results') {
        return {
          insert: async () => ({ error: null }),
        };
      }

      throw new Error(`Unexpected table ${table}`);
    },
  };

  return {
    createServiceClient: () => db,
  };
});

vi.mock('@/lib/ai/modules/narrative-direction-selection/source-resolution', async () => {
  const actual = await vi.importActual<
    typeof import('@/lib/ai/modules/narrative-direction-selection/source-resolution')
  >('@/lib/ai/modules/narrative-direction-selection/source-resolution');

  return {
    ...actual,
    resolveNdsSources: async () => ({
      essay_project: {
        id: 'proj-1',
        student_user_id: 'user-1',
        title: 'Essay Project',
        status: 'not_started',
        selected_direction_artifact_id: null,
      },
      student_profile: null,
      story_entries: [
        {
          id: 'story-1',
          title: 'Story One',
          body: 'A story body with clear reflection and change signal.',
          category: 'activity',
        },
      ],
      current_draft: {
        id: 'draft-1',
        draft_text: 'Draft content',
        version_number: 1,
      },
      school_context: {
        source_id: 'school-1',
        target_school: 'State U',
        signal_summary: 'School context signal',
      },
      source_meta: {
        story_entry_count: 1,
        has_current_draft: true,
        has_school_context: true,
      },
    }),
  };
});

vi.mock('@/lib/ai/modules/narrative-direction-selection/module-executor', () => ({
  assertNdsProviderProductionReadiness: () => undefined,
  executeNdsModule: async () => ({
    provider_key: 'openai',
    model_key: 'gpt-4o',
    raw_response: {
      status: 'success',
    },
    candidate_payload: {
      status: 'success',
      best_direction: {
        id: 'direction_1',
        title: 'Strong direction',
        summary: 'Strong direction grounded in a clear turning point and reflection.',
        why_it_wins: 'Specific and evidence-backed.',
        main_risk: 'Could become summary-heavy.',
        next_move: 'Write the pivotal moment as a scene.',
      },
      alternatives: [
        {
          id: 'direction_2',
          title: 'Alternative path',
          why_it_loses: 'Less reflective depth.',
          risk: 'May be broad.',
        },
      ],
      evidence_anchors: [
        {
          label: 'Story One',
          source_type: 'story_entry',
          source_id: 'story-1',
        },
      ],
      recovery_question: null,
    },
    execution_meta: {
      latency_ms: 10,
      token_usage: {},
      fallback_applied: false,
    },
  }),
}));

vi.mock('@/lib/ai/modules/narrative-direction-selection/validator', () => ({
  validateNdsOutput: () => ({
    structuralPass: true,
    semanticPass: true,
    brandPass: true,
    authenticityPass: true,
    decision: 'accept',
    highestSeverity: 'low',
    failureCodes: [],
    warningCodes: [],
    needsMoreInputReasonCode: null,
  }),
}));

import { executeRun } from '@/lib/ai/worker/execute-run';

describe('worker provenance persistence', () => {
  beforeEach(() => {
    linksInsertSpy.mockClear();
  });

  it('persists artifact_subject_links rows from resolved sources', async () => {
    await executeRun('run-1');

    expect(linksInsertSpy).toHaveBeenCalledTimes(1);

    const inserted = linksInsertSpy.mock.calls[0][0] as Array<{
      link_role: string;
      linked_entity_type: string;
      linked_entity_id: string;
    }>;

    expect(inserted.some((r) => r.link_role === 'primary_subject')).toBe(true);
    expect(inserted.some((r) => r.link_role === 'evidence_source')).toBe(true);
    expect(
      inserted.some(
        (r) => r.linked_entity_type === 'essay_draft_version' && r.linked_entity_id === 'draft-1'
      )
    ).toBe(true);
    expect(inserted.some((r) => r.link_role === 'school_context')).toBe(true);
  });
});
