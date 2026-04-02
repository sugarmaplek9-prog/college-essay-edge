import fs from 'node:fs';
import { describe, expect, it } from 'vitest';
import { buildFreeAiBaselinePayload, scoreNdsPayload } from '@/lib/ai/evaluation/nds-evaluation';
import { buildNdsNormalizedContextPack } from '@/lib/ai/modules/narrative-direction-selection/normalize-context';
import { evaluateNdsReadiness } from '@/lib/ai/modules/narrative-direction-selection/readiness';
import { executeNdsModule } from '@/lib/ai/modules/narrative-direction-selection/module-executor';
import type { NdsResolvedSources } from '@/types/ai';

const PARENT_ADVISOR_CASES = ['case_002', 'case_004', 'case_006', 'case_008', 'case_010'];

function mapCaseToSources(caseId: string): NdsResolvedSources {
  const c = JSON.parse(fs.readFileSync(`evaluation/cases/${caseId}.json`, 'utf8'));
  return {
    essay_project: {
      id: c.essay_project.project_id,
      student_user_id: `eval_${caseId}`,
      title: c.label,
      status: 'not_started',
      selected_direction_artifact_id: null,
    },
    student_profile: {
      user_id: `eval_${caseId}`,
      first_name: 'Eval',
      last_name: caseId,
      grade: Number(c.student_profile.grade_level) || null,
      interests: c.student_profile.core_interests,
    },
    story_entries: c.story_entries.map((s: { id: string; text: string }) => ({
      id: s.id,
      title: s.id,
      body: s.text,
      category: null,
    })),
    current_draft: c.current_draft?.text
      ? {
          id: c.current_draft.id ?? `${caseId}_draft`,
          draft_text: c.current_draft.text,
          version_number: 1,
        }
      : null,
    school_context: c.school_context?.target_school
      ? {
          source_id: `${caseId}_school_ctx`,
          target_school: c.school_context.target_school,
          signal_summary: c.school_context.notes || 'school context provided',
        }
      : null,
    source_meta: {
      story_entry_count: c.story_entries.length,
      has_current_draft: !!c.current_draft?.text,
      has_school_context: !!c.school_context?.target_school,
    },
  };
}

describe('NDS Step 6 parent/advisor contamination rebuild', () => {
  it('downweights polished draft framing when there is no student-owned scene evidence', () => {
    const context = buildNdsNormalizedContextPack({
      essay_project: {
        id: 'proj-parent-risk',
        student_user_id: 'user-parent-risk',
        title: 'Parent risk draft',
        status: 'not_started',
        selected_direction_artifact_id: null,
      },
      student_profile: {
        user_id: 'user-parent-risk',
        first_name: 'Ari',
        last_name: 'Kim',
        grade: 12,
        interests: ['robotics'],
      },
      story_entries: [],
      current_draft: {
        id: 'draft-parent-risk',
        draft_text:
          'This essay should highlight leadership, maturity, and future direction. I am trying to connect the experience to values, growth, and a broader lesson about who I am today.',
        version_number: 1,
      },
      school_context: null,
      source_meta: {
        story_entry_count: 0,
        has_current_draft: true,
        has_school_context: false,
      },
    });

    expect(context.draft_signals).toHaveLength(1);
    expect(context.draft_signals[0].authorship_signal.contamination_risk).toBe('high');
    expect(context.draft_signals[0].authorship_signal.weighting_decision).toBe('draft_only_low_trust');
    expect(context.draft_signals[0].strength).toBe('low');
    expect(context.context_gaps).toContain(
      'Current draft may reflect polished adult framing without enough student-owned scene evidence.'
    );

    const readiness = evaluateNdsReadiness(context);
    expect(readiness.execution_mode).toBe('needs_more_input');
  });

  it('prefers student-authored story evidence over polished draft framing', async () => {
    const context = buildNdsNormalizedContextPack({
      essay_project: {
        id: 'proj-parent-story',
        student_user_id: 'user-parent-story',
        title: 'Robotics contamination case',
        status: 'not_started',
        selected_direction_artifact_id: null,
      },
      student_profile: {
        user_id: 'user-parent-story',
        first_name: 'Ari',
        last_name: 'Kim',
        grade: 12,
        interests: ['robotics'],
      },
      story_entries: [
        {
          id: 'story-parent-story',
          title: 'pit notes',
          body:
            'At first I kept taking the repair back from my teammate because I thought I could fix it faster. After our mentor pointed out that I was freezing the whole pit, I changed my approach. In the next round I stayed on testing and notes while she handled the repair, and the team moved faster.',
          category: null,
        },
      ],
      current_draft: {
        id: 'draft-parent-story',
        draft_text:
          'This essay should frame robotics as a story of leadership, values, and future engineering direction. I am trying to connect the event to maturity and broader purpose.',
        version_number: 1,
      },
      school_context: null,
      source_meta: {
        story_entry_count: 1,
        has_current_draft: true,
        has_school_context: false,
      },
    });

    expect(context.story_signals).toHaveLength(1);
    expect(context.draft_signals[0].authorship_signal.contamination_risk).toBe('high');
    expect(context.draft_signals[0].authorship_signal.weighting_decision).toBe('prioritize_story');
    expect(context.context_gaps).toContain(
      'Student-authored story evidence should take priority over polished draft framing.'
    );

    const readiness = evaluateNdsReadiness(context);
    expect(readiness.execution_mode).not.toBe('needs_more_input');

    const run = await executeNdsModule({
      run_id: 'run-parent-story',
      module_key: 'narrative_direction_selection',
      execution_mode: readiness.execution_mode,
      context_pack: context,
      module_versions: {
        prompt_version: 'v1',
        schema_version: 'v1',
        validator_version: 'v1',
      },
    });

    const payload = run.candidate_payload as { status: string; best_direction: Record<string, string> };
    expect(payload.status).toBe('success');
    expect(payload.best_direction.angle_title.toLowerCase()).toContain('team');
    expect(payload.best_direction.core_claim.toLowerCase()).not.toContain('future direction');
    expect(payload.best_direction.core_claim.toLowerCase()).not.toContain('broader purpose');
  });

  it('beats the generic baseline on the five parent/advisor review cases', async () => {
    for (const caseId of PARENT_ADVISOR_CASES) {
      const context = buildNdsNormalizedContextPack(mapCaseToSources(caseId));
      const readiness = evaluateNdsReadiness(context);

      expect(context.story_signals.length).toBeGreaterThan(0);
      expect(context.draft_signals[0].authorship_signal.contamination_risk).not.toBe('low');
      expect(readiness.execution_mode).not.toBe('needs_more_input');

      const ndsOutput = await executeNdsModule({
        run_id: `run_${caseId}`,
        module_key: 'narrative_direction_selection',
        execution_mode: readiness.execution_mode,
        context_pack: context,
        module_versions: {
          prompt_version: 'v1',
          schema_version: 'v1',
          validator_version: 'v1',
        },
      });

      const baselinePayload = buildFreeAiBaselinePayload(context, readiness.execution_mode);
      const ndsPayload = ndsOutput.candidate_payload as unknown as Parameters<typeof scoreNdsPayload>[0];

      const ndsScore = scoreNdsPayload(ndsPayload);
      const baselineScore = scoreNdsPayload(baselinePayload);

      expect(ndsScore.total).toBeGreaterThan(baselineScore.total);

      if (ndsPayload.status === 'success') {
        expect(ndsPayload.best_direction.angle_title).not.toBe('Direction 1');
        expect(ndsPayload.best_direction.core_claim.toLowerCase()).not.toContain('values and future direction');
      }
    }
  });
});
